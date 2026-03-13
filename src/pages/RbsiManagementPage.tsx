import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Typography,
  Paper,
  Button,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Stack,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowRight as CollapseIcon,
  FolderRounded,
  AssignmentRounded,
  FolderOpenRounded,
  Add as AddIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Description as KepIcon,
  Dashboard as DashboardIcon,
  FiberNew as NewIcon,
  RemoveCircleOutline as DeletedIcon,
  ChangeCircle as ChangedIcon,
  Close as CloseIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import {
  getAllRbsi,
  createRbsi,
  getProgramsByRbsi,
  getKepList as apiGetKepList,
  createKep as apiCreateKep,
  batchUpdateKepProgress,
  getMonitoringData,
  updateProgram as apiUpdateProgram,
  updateInisiatif as apiUpdateInisiatif,
  deleteProgram as apiDeleteProgram,
  deleteInisiatif as apiDeleteInisiatif,
  getInisiatifGroups,
} from '../api/rbsiApi';
import type {
  RbsiResponse,
  RbsiProgramResponse,
  RbsiKepResponse,
  RbsiMonitoringResponse,
  InisiatifGroupResponse,
} from '../api/rbsiApi';
import {
  AddProgramModal,
  AddInisiatifModal,
  AddPeriodeModal,
  CopyFromYearModal,
  HistoryComparisonModal,
  AnalyticsModal,
} from '../components/modals';

// ============ TYPES ============

interface KepData {
  id: string;
  nomorKep: string;
  tahunPelaporan: number;
  createdAt?: string;
}

interface YearProgress {
  tahun: number;
  status: 'none' | 'planned' | 'realized';
}

// ============ MEMOIZED COMPONENTS ============

// Memoized Progress Cell - only re-renders when its specific data changes
interface ProgressCellProps {
  groupId: string;
  kepId: string;
  year: number;
  iniVersion: any;
  getProgress: (groupId: string, kepId: string, year: number) => 'none' | 'planned' | 'realized';
  toggleProgress: (groupId: string, kepId: string, year: number) => void;
  renderStatus: (status: 'none' | 'planned' | 'realized', isEditable: boolean) => React.ReactNode;
  updateKey: number; // Force re-render when this changes
}

const ProgressCell = React.memo<ProgressCellProps>(({ 
  groupId, 
  kepId, 
  year, 
  iniVersion, 
  getProgress, 
  toggleProgress, 
  renderStatus,
  updateKey: _updateKey // Used for triggering re-render
}) => {
  const status = iniVersion ? getProgress(groupId, kepId, year) : 'none';
  
  return (
    <Tooltip
      title={
        iniVersion
          ? `Klik untuk ubah status tahun ${year}`
          : 'Tidak ada di KEP ini'
      }
    >
      <Box
        component="span"
        onClick={e => {
          e.stopPropagation();
          if (iniVersion) {
            toggleProgress(groupId, kepId, year);
          }
        }}
        sx={{ 
          cursor: iniVersion ? 'pointer' : 'default', 
          display: 'inline-flex', 
          p: 0.15,
        }}
      >
        {iniVersion ? renderStatus(status, true) : (
          <Box sx={{ width: 18, height: 18, bgcolor: '#f0f0f0', borderRadius: '2px' }} />
        )}
      </Box>
    </Tooltip>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these specific props change
  return (
    prevProps.groupId === nextProps.groupId &&
    prevProps.kepId === nextProps.kepId &&
    prevProps.year === nextProps.year &&
    prevProps.iniVersion === nextProps.iniVersion &&
    prevProps.updateKey === nextProps.updateKey
  );
});

ProgressCell.displayName = 'ProgressCell';

// ============ COMPONENT ============

function RbsiManagementPage() {
  // View mode: 'table' = simple program list, 'monitoring' = with KEP progress columns
  const [viewMode, setViewMode] = useState<'table' | 'monitoring'>('monitoring');

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  
  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(60); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const resizeWidthRef = useRef(60); // Track width during drag without re-rendering

  // RBSI State
  const [rbsiList, setRbsiList] = useState<RbsiResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [rbsiLoading, setRbsiLoading] = useState(false);
  const [periodeAnchorEl, setPeriodeAnchorEl] = useState<null | HTMLElement>(null);

  // Programs data
  const [programs, setPrograms] = useState<RbsiProgramResponse[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  // Year filter
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());

  // KEP data
  const [kepList, setKepList] = useState<KepData[]>([]);
  const [kepLoading, setKepLoading] = useState(false);
  const [selectedKep, setSelectedKep] = useState<KepData | null>(null);

  // Optimized monitoring data (pre-structured from backend) - THIS IS THE SOURCE OF TRUTH
  const [monitoringData, setMonitoringData] = useState<RbsiMonitoringResponse | null>(null);
  const [allYearsLoading, setAllYearsLoading] = useState(false);

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  
  // Force re-render map for individual cells (key-based re-render)
  const [cellUpdates, setCellUpdates] = useState<Map<string, number>>(new Map());

  // Modal states
  const [openAddProgramModal, setOpenAddProgramModal] = useState(false);
  const [openAddInisiatifModal, setOpenAddInisiatifModal] = useState(false);
  const [selectedProgramIdForInisiatif, setSelectedProgramIdForInisiatif] = useState<string>('');
  const [openAddPeriodeModal, setOpenAddPeriodeModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [openAnalyticsModal, setOpenAnalyticsModal] = useState(false);

  // Add KEP dialog
  const [addKepDialogOpen, setAddKepDialogOpen] = useState(false);
  const [newKepNomor, setNewKepNomor] = useState<string>('');
  const [newKepYear, setNewKepYear] = useState<number>(new Date().getFullYear());
  const [addKepLoading, setAddKepLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogType, setEditDialogType] = useState<'program' | 'inisiatif'>('program');
  const [editingItem, setEditingItem] = useState<{
    id: string;
    nomor: string;
    nama: string;
    rbsiId?: string;
    programId?: string;
    tahun: number;
    groupId?: string | null; // Current group_id of initiative (null or UUID)
  } | null>(null);
  const [editNomor, setEditNomor] = useState('');
  const [editNama, setEditNama] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // Initiative group management - CACHED globally for performance
  const [inisiatifGroups, setInisiatifGroups] = useState<InisiatifGroupResponse[]>([]);
  const [loadingInisiatifGroups, setLoadingInisiatifGroups] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null); // null = create new group, string = use existing

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogType, setDeleteDialogType] = useState<'program' | 'inisiatif'>('program');
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    nomor: string;
    nama: string;
    inisiatifCount?: number;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Track pending changes (only changed items) for efficient save
  const pendingChangesRef = useRef<Map<string, { kepId: string; groupId: string; yearlyProgress: YearProgress[] }>>(new Map());

  const currentYear = new Date().getFullYear();

  // Debounce keyword search for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Period years
  const periodYears = React.useMemo(() => {
    if (!selectedRbsi) return { start: 2024, end: 2027 };
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    return { start: startYear, end: endYear };
  }, [selectedRbsi]);

  // Tahun options from RBSI periode
  const tahunOptions = React.useMemo(() => {
    if (!selectedRbsi) return [];
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  }, [selectedRbsi]);

  // Previous year for copy
  const previousTahun = React.useMemo(() => {
    if (!selectedRbsi || !selectedTahun) return null;
    const [startYear] = selectedRbsi.periode.split('-').map(Number);
    const prevYear = selectedTahun - 1;
    return prevYear >= startYear ? prevYear : null;
  }, [selectedRbsi, selectedTahun]);

  // ============ COMPARISON HELPER FUNCTIONS ============

  // Memoized filtered programs from monitoring data (use backend structure directly)
  const filteredMonitoringPrograms = useMemo(() => {
    if (!monitoringData) return [];
    if (!debouncedKeyword) return monitoringData.programs;
    
    const lowKeyword = debouncedKeyword.toLowerCase();
    const filtered = [];
    
    for (const program of monitoringData.programs) {
      // Check if program itself matches
      let programMatches = false;
      if (program.nomor_program?.toLowerCase().includes(lowKeyword)) {
        programMatches = true;
      }
      if (!programMatches && program.versions_by_year) {
        for (const version of Object.values(program.versions_by_year)) {
          if (version.nama_program?.toLowerCase().includes(lowKeyword)) {
            programMatches = true;
            break;
          }
        }
      }
      
      // If program matches, include all initiatives
      if (programMatches) {
        filtered.push(program);
        continue;
      }
      
      // Otherwise, filter initiatives
      const matchingInitiatives = program.initiatives?.filter(ini => {
        if (ini.nomor_inisiatif?.toLowerCase().includes(lowKeyword)) return true;
        if (ini.versions_by_year) {
          for (const iniVersion of Object.values(ini.versions_by_year)) {
            if (iniVersion.nama_inisiatif?.toLowerCase().includes(lowKeyword)) return true;
          }
        }
        return false;
      }) || [];
      
      // If any initiatives match, include program with only matching initiatives
      if (matchingInitiatives.length > 0) {
        filtered.push({
          ...program,
          initiatives: matchingInitiatives
        });
      }
    }
    
    return filtered;
  }, [monitoringData, debouncedKeyword]);

  // ============ DATA FETCHING ============

  // Optimized monitoring data fetching - single API call with pre-structured response
  const fetchMonitoringData = useCallback(async (rbsiId: string) => {
    setAllYearsLoading(true);
    try {
      const response = await getMonitoringData(rbsiId);
      const data = response.data;
      
      // Backend structure is already optimal - use it directly!
      setMonitoringData(data);

      if (import.meta.env.MODE === 'development') {
        console.log('[Performance] Monitoring data loaded:', {
          programs: data.programs.length,
          totalInitiatives: data.programs.reduce((sum, p) => sum + p.initiatives.length, 0),
          keps: data.kep_list.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal mengambil data monitoring',
        severity: 'error',
      });
      setMonitoringData(null);
    } finally {
      setAllYearsLoading(false);
    }
  }, []);

  // Fetch RBSI list
  useEffect(() => {
    fetchRbsiList();
  }, []);

  // Fetch programs, KEP, and inisiatif groups when RBSI selected
  useEffect(() => {
    if (selectedRbsi) {
      fetchKepList(selectedRbsi.id);
      fetchInisiatifGroups(selectedRbsi.id);
    }
  }, [selectedRbsi]);

  // Fetch programs when selectedRbsi or selectedTahun changes
  useEffect(() => {
    if (selectedRbsi && selectedTahun) {
      // Always filter programs by selected year
      fetchPrograms(selectedRbsi.id, selectedTahun);
    }
  }, [selectedRbsi, selectedTahun, viewMode]);

  // Update selectedKep when selectedTahun or kepList changes
  useEffect(() => {
    if (selectedTahun && kepList.length > 0) {
      const kep = kepList.find(k => k.tahunPelaporan === selectedTahun);
      setSelectedKep(kep || null);
    }
  }, [selectedTahun, kepList]);

  // Set default tahun when selectedRbsi changes
  useEffect(() => {
    if (selectedRbsi) {
      const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
      if (currentYear >= startYear && currentYear <= endYear) {
        setSelectedTahun(currentYear);
      } else {
        setSelectedTahun(endYear);
      }
    }
  }, [selectedRbsi, currentYear]);

  // Fetch optimized monitoring data (single API call) when in monitoring mode
  useEffect(() => {
    if (selectedRbsi && kepList.length > 0 && viewMode === 'monitoring') {
      // Reset unsaved changes when switching modes (data will be refreshed from backend)
      setHasChanges(false);
      fetchMonitoringData(selectedRbsi.id);
    }
  }, [selectedRbsi, kepList, viewMode, fetchMonitoringData]);

  const fetchRbsiList = async () => {
    setRbsiLoading(true);
    try {
      const response = await getAllRbsi();
      setRbsiList(response.data);
      if (response.data.length > 0 && !selectedRbsi) {  
        setSelectedRbsi(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch RBSI list:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal mengambil data RBSI',
        severity: 'error',
      });
    } finally {
      setRbsiLoading(false);
    }
  };

  const fetchInisiatifGroups = async (rbsiId: string) => {
    setLoadingInisiatifGroups(true);
    try {
      const response = await getInisiatifGroups(rbsiId);
      setInisiatifGroups(response.data || []);
    } catch (error) {
      console.error('Failed to fetch initiative groups:', error);
      setInisiatifGroups([]);
    } finally {
      setLoadingInisiatifGroups(false);
    }
  };

  const fetchPrograms = async (rbsiId: string, tahun?: number, preserveExpandedState = false) => {
    setProgramsLoading(true);
    try {
      const response = await getProgramsByRbsi(rbsiId, tahun);
      const fetchedPrograms = response.data || [];
      setPrograms(fetchedPrograms);

      // Only expand all programs on initial load (when preserveExpandedState is false)
      // Otherwise, keep the existing expand/collapse state
      if (!preserveExpandedState) {
        // In monitoring mode, use nomor_program as key (to group by program number)
        // In table mode, use id as key (unique per program instance)
        const allProgramIds = new Set<string>();
        fetchedPrograms.forEach(p => allProgramIds.add(viewMode === 'monitoring' ? p.nomor_program : p.id));
        setExpandedPrograms(allProgramIds);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal mengambil data program',
        severity: 'error',
      });
      setPrograms([]);
    } finally {
      setProgramsLoading(false);
    }
  };

  const fetchKepList = async (rbsiId: string) => {
    setKepLoading(true);
    try {
      const response = await apiGetKepList(rbsiId);
      const apiKepList = response.data || [];

      const mappedKepList: KepData[] = apiKepList.map((kep: RbsiKepResponse) => ({
        id: kep.id,
        nomorKep: kep.nomor_kep,
        tahunPelaporan: kep.tahun_pelaporan,
        createdAt: kep.created_at,
      }));

      setKepList(mappedKepList.sort((a, b) => a.tahunPelaporan - b.tahunPelaporan));
    } catch (error) {
      console.error('Failed to fetch KEP list:', error);
      setKepList([]);
    } finally {
      setKepLoading(false);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Resize handlers for split panels
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeWidthRef.current = leftPanelWidth;
    setIsResizing(true);
  }, [leftPanelWidth]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.querySelector('[data-resize-container]') as HTMLElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left;
      const newWidthPercent = (offsetX / containerRect.width) * 100;

      // Limit between 30% and 80%
      const clampedWidth = Math.max(30, Math.min(80, newWidthPercent));
      
      // Update resize width ref
      resizeWidthRef.current = clampedWidth;
      
      // Directly update colgroup columns for smooth resizing
      const colgroups = container.querySelectorAll('colgroup');
      if (colgroups.length > 0) {
        const colgroup = colgroups[0];
        const cols = colgroup.querySelectorAll('col');
        
        // Calculate how many KEPs (should be half the total columns)
        const kepCount = cols.length / 2;
        
        // Update name column widths
        for (let i = 0; i < kepCount; i++) {
          (cols[i] as HTMLElement).style.width = `${clampedWidth / kepCount}%`;
        }
        
        // Update progress column widths
        for (let i = kepCount; i < cols.length; i++) {
          (cols[i] as HTMLElement).style.width = `${(100 - clampedWidth) / kepCount}%`;
        }
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    // Update state with final width
    setLeftPanelWidth(resizeWidthRef.current);
  }, []);

  // Add/remove mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const tokenizeNomor = (value: string | undefined): Array<string | number> => {
    if (!value) return [''];
    return value
      .split('.')
      .flatMap(part => part.match(/(\d+|[^\d]+)/g) || [])
      .map(token => (token.match(/^\d+$/) ? parseInt(token, 10) : token.toLowerCase()));
  };

  const compareNomor = (a: string | undefined, b: string | undefined): number => {
    const aTokens = tokenizeNomor(a);
    const bTokens = tokenizeNomor(b);
    const maxLength = Math.max(aTokens.length, bTokens.length);

    for (let i = 0; i < maxLength; i++) {
      const aToken = aTokens[i];
      const bToken = bTokens[i];

      if (aToken === undefined) return -1;
      if (bToken === undefined) return 1;

      if (typeof aToken === 'number' && typeof bToken === 'number') {
        if (aToken !== bToken) return aToken - bToken;
        continue;
      }

      if (typeof aToken === 'string' && typeof bToken === 'string') {
        if (aToken !== bToken) return aToken.localeCompare(bToken);
        continue;
      }

      if (typeof aToken === 'number') return -1;
      return 1;
    }

    return 0;
  };

  const filteredPrograms = useMemo(() => {
    return programs
      .filter(program => {
        const inisiatifs = program.inisiatifs || [];
        const lowKeyword = debouncedKeyword.toLowerCase();
        const matchKeyword =
          program.nama_program.toLowerCase().includes(lowKeyword) ||
          program.nomor_program.toLowerCase().includes(lowKeyword) ||
          inisiatifs.some(ini => ini.nama_inisiatif.toLowerCase().includes(lowKeyword));
        return matchKeyword;
      })
      .sort((a, b) => compareNomor(a.nomor_program, b.nomor_program));
  }, [programs, debouncedKeyword]);

  // Get progress - check pending changes first, then backend data
  const getProgress = useCallback((groupId: string, kepId: string, targetYear: number): 'none' | 'planned' | 'realized' => {
    // 1. Check pending changes first for instant feedback (optimistic UI)
    const pendingKey = `${groupId}-${kepId}`;
    const pendingChange = pendingChangesRef.current.get(pendingKey);
    if (pendingChange) {
      const yearProgress = pendingChange.yearlyProgress.find(y => y.tahun === targetYear);
      if (yearProgress) {
        return yearProgress.status as 'none' | 'planned' | 'realized';
      }
    }

    // 2. Fall back to backend data (direct O(1) access)
    if (!monitoringData) return 'none';
    
    // Find initiative by group_id
    for (const program of monitoringData.programs) {
      const initiative = program.initiatives.find(ini => ini.group_id === groupId);
      if (initiative) {
        const progressInfo = initiative.progress_by_kep[kepId];
        if (progressInfo?.yearly_progress) {
          const yearProgress = progressInfo.yearly_progress.find(yp => yp.tahun === targetYear);
          return (yearProgress?.status as 'none' | 'planned' | 'realized') || 'none';
        }
        return 'none';
      }
    }
    
    return 'none';
  }, [monitoringData]);

  // Toggle progress - NO STATE UPDATE, only pendingChanges + force re-render
  // TEMPORARY: Currently using 2-state cycle (none ↔ realized) - 'planned' is skipped
  // To re-enable 3-state cycle, see comments in the "Calculate new status" section below
  const toggleProgress = useCallback(
    (groupId: string, kepId: string, targetYear: number) => {
      console.log('🔄 Toggle Progress:', { groupId, kepId, targetYear });
      
      // Get current status from pending changes first, then backend data
      const pendingKey = `${groupId}-${kepId}`;
      const pendingChange = pendingChangesRef.current.get(pendingKey);
      
      let oldStatus: 'none' | 'planned' | 'realized' = 'none';
      let baseYearlyProgress: YearProgress[] | null = null;
      
      if (pendingChange) {
        // Use pending change as base
        const pendingYear = pendingChange.yearlyProgress.find(yp => yp.tahun === targetYear);
        oldStatus = (pendingYear?.status as 'none' | 'planned' | 'realized') || 'none';
        baseYearlyProgress = pendingChange.yearlyProgress;
      } else {
        // Use backend data as base
        if (monitoringData) {
          for (const program of monitoringData.programs) {
            const initiative = program.initiatives.find(ini => ini.group_id === groupId);
            if (initiative) {
              const progressInfo = initiative.progress_by_kep[kepId];
              if (progressInfo?.yearly_progress) {
                const yearProgress = progressInfo.yearly_progress.find(yp => yp.tahun === targetYear);
                oldStatus = (yearProgress?.status as 'none' | 'planned' | 'realized') || 'none';
                baseYearlyProgress = progressInfo.yearly_progress.map(yp => ({
                  tahun: yp.tahun,
                  status: yp.status as 'none' | 'planned' | 'realized'
                }));
              }
              break;
            }
          }
        }
      }

      // Calculate new status
      // TEMPORARY: 2-state cycle (none ↔ realized) - skip 'planned' for now
      // TODO: Uncomment 3-state cycle below if planning stage is needed again
      let newStatus: 'none' | 'planned' | 'realized';
      
      // 2-state cycle (current):
      if (oldStatus === 'none') newStatus = 'realized';
      else newStatus = 'none';
      
      // 3-state cycle (for future use if needed):
      // if (oldStatus === 'none') newStatus = 'planned';
      // else if (oldStatus === 'planned') newStatus = 'realized';
      // else newStatus = 'none';

      // Build new yearly progress
      let newYearlyProgress: YearProgress[];
      if (!baseYearlyProgress || baseYearlyProgress.length === 0) {
        // Initialize with all years
        newYearlyProgress = [];
        for (let year = periodYears.start; year <= periodYears.end; year++) {
          newYearlyProgress.push({ tahun: year, status: year === targetYear ? newStatus : 'none' });
        }
      } else {
        // Update specific year
        newYearlyProgress = baseYearlyProgress.map(yp =>
          yp.tahun === targetYear ? { ...yp, status: newStatus } : yp
        );
      }

      // Track in pending changes only - NO STATE UPDATE!
      pendingChangesRef.current.set(pendingKey, {
        kepId,
        groupId: groupId,
        yearlyProgress: newYearlyProgress,
      });
      
      console.log('✅ Pending change saved:', {
        key: pendingKey,
        oldStatus,
        newStatus,
        totalPending: pendingChangesRef.current.size
      });

      // Force re-render ONLY for affected cells (per KEP-year combo)
      setHasChanges(true);
      setCellUpdates(prev => {
        const newMap = new Map(prev);
        // Update all years for this initiative-KEP combo
        for (let year = periodYears.start; year <= periodYears.end; year++) {
          const cellKey = `${groupId}-${kepId}-${year}`;
          newMap.set(cellKey, (newMap.get(cellKey) || 0) + 1);
        }
        return newMap;
      });
    },
    [periodYears, monitoringData]
  );

  // Add new KEP
  const handleAddKep = async () => {
    if (!selectedRbsi) return;

    const existingKep = kepList.find(k => k.nomorKep === newKepNomor || k.tahunPelaporan === newKepYear);
    if (existingKep) {
      setSnackbar({
        open: true,
        message: `KEP dengan nomor atau tahun tersebut sudah ada`,
        severity: 'warning',
      });
      return;
    }

    setAddKepLoading(true);
    try {
      const response = await apiCreateKep(selectedRbsi.id, {
        nomor_kep: newKepNomor || `KEP-${String(kepList.length + 1).padStart(3, '0')}/${newKepYear}`,
        tahun_pelaporan: newKepYear,
        copy_from_latest: true,
      });

      const newKep: KepData = {
        id: response.data.id,
        nomorKep: response.data.nomor_kep,
        tahunPelaporan: response.data.tahun_pelaporan,
        createdAt: response.data.created_at,
      };

      setKepList(prev => [...prev, newKep].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan));
      setAddKepDialogOpen(false);
      setNewKepNomor('');

      if (viewMode === 'monitoring') {
        fetchMonitoringData(selectedRbsi.id);
      }

      setSnackbar({
        open: true,
        message: `${newKep.nomorKep} berhasil ditambahkan`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to create KEP:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal membuat KEP baru',
        severity: 'error',
      });
    } finally {
      setAddKepLoading(false);
    }
  };

  // Save progress changes
  const handleSave = async () => {
    if (!selectedRbsi) return;

    try {
      // Build batch update request
      const updates: Array<{
        kep_id: string;
        group_id: string;
        yearly_progress: Array<{ tahun: number; status: 'none' | 'planned' | 'realized' }>;
      }> = [];

      // Use pending changes (only items that were actually modified)
      pendingChangesRef.current.forEach((change) => {
        updates.push({
          kep_id: change.kepId,
          group_id: change.groupId,
          yearly_progress: change.yearlyProgress,
        });
      });

      if (updates.length > 0) {
        console.log('💾 Batch saving progress:', updates.length, 'updates');
        console.log('📦 Updates payload:', JSON.stringify(updates, null, 2));
        
        const response = await batchUpdateKepProgress(selectedRbsi.id, { updates });
        console.log('✅ Batch save successful:', response.data);
        
        // Clear pending changes after successful save
        pendingChangesRef.current.clear();
        
        // Refetch monitoring data to ensure consistency
        await fetchMonitoringData(selectedRbsi.id);
        
        setSnackbar({
          open: true,
          message: response.data.message || 'Perubahan berhasil disimpan',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Tidak ada perubahan untuk disimpan',
          severity: 'info',
        });
      }

      setHasChanges(false);
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal menyimpan perubahan',
        severity: 'error',
      });
    }
  };

  // Create RBSI
  const handleCreateRbsi = async (periode: string) => {
    const response = await createRbsi(periode);
    setRbsiList(prev => [...prev, response.data]);
    setSelectedRbsi(response.data);
    setSnackbar({
      open: true,
      message: 'RBSI berhasil dibuat',
      severity: 'success',
    });
  };

  // Open edit dialog for program
  const handleEditProgram = (program: RbsiProgramResponse) => {
    setEditDialogType('program');
    setEditingItem({
      id: program.id,
      nomor: program.nomor_program,
      nama: program.nama_program,
      rbsiId: program.rbsi_id,
      tahun: program.tahun ?? selectedTahun,
    });
    setEditNomor(program.nomor_program);
    setEditNama(program.nama_program);
    setEditDialogOpen(true);
  };

  // Open edit dialog for inisiatif
  const handleEditInisiatif = (inisiatif: { id: string; nomor_inisiatif: string; nama_inisiatif: string; program_id: string; tahun: number; group_id?: string | null }, programTahun?: number) => {
    setEditDialogType('inisiatif');
    setEditingItem({
      id: inisiatif.id,
      nomor: inisiatif.nomor_inisiatif,
      nama: inisiatif.nama_inisiatif,
      programId: inisiatif.program_id,
      tahun: inisiatif.tahun ?? programTahun ?? selectedTahun,
      groupId: inisiatif.group_id,
    });
    setEditNomor(inisiatif.nomor_inisiatif);
    setEditNama(inisiatif.nama_inisiatif);
    setEditGroupId(inisiatif.group_id || null);
    
    // Use cached groups - no API call needed! 🚀
    // Groups were already fetched when RBSI was selected
    
    setEditDialogOpen(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingItem || !selectedRbsi) return;

    // Validate required fields
    const tahun = editingItem.tahun || selectedTahun;
    if (!tahun) {
      setSnackbar({
        open: true,
        message: 'Tahun tidak valid',
        severity: 'error',
      });
      return;
    }

    setEditLoading(true);
    try {
      if (editDialogType === 'program') {
        await apiUpdateProgram(editingItem.id, {
          rbsi_id: editingItem.rbsiId || selectedRbsi.id,
          tahun: tahun,
          nomor_program: editNomor,
          nama_program: editNama,
        });
      } else {
        if (!editingItem.programId) {
          throw new Error('Program ID tidak ditemukan');
        }
        
        // Always send group_id: either new value or existing (to properly handle changes)
        const finalGroupId = editGroupId !== editingItem.groupId ? editGroupId : editingItem.groupId;
        
        await apiUpdateInisiatif(editingItem.id, {
          program_id: editingItem.programId,
          tahun: tahun,
          nomor_inisiatif: editNomor,
          nama_inisiatif: editNama,
          group_id: finalGroupId, // Always send (null, existing, or new)
        });
      }

      setSnackbar({
        open: true,
        message: `${editDialogType === 'program' ? 'Program' : 'Inisiatif'} berhasil diperbarui`,
        severity: 'success',
      });

      setEditDialogOpen(false);
      fetchPrograms(selectedRbsi.id, selectedTahun, true);
      
      // Refresh groups cache if inisiatif was edited (group might have changed)
      if (editDialogType === 'inisiatif') {
        fetchInisiatifGroups(selectedRbsi.id);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal memperbarui data',
        severity: 'error',
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Open delete dialog for program
  const handleDeleteProgram = (program: RbsiProgramResponse) => {
    setDeleteDialogType('program');
    setDeletingItem({
      id: program.id,
      nomor: program.nomor_program,
      nama: program.nama_program,
      inisiatifCount: program.inisiatifs?.length || 0,
    });
    setDeleteDialogOpen(true);
  };

  // Open delete dialog for inisiatif
  const handleDeleteInisiatif = (inisiatif: { id: string; nomor_inisiatif: string; nama_inisiatif: string }) => {
    setDeleteDialogType('inisiatif');
    setDeletingItem({
      id: inisiatif.id,
      nomor: inisiatif.nomor_inisiatif,
      nama: inisiatif.nama_inisiatif,
    });
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingItem || !selectedRbsi) return;

    setDeleteLoading(true);
    try {
      if (deleteDialogType === 'program') {
        await apiDeleteProgram(deletingItem.id);
      } else {
        await apiDeleteInisiatif(deletingItem.id);
      }

      setSnackbar({
        open: true,
        message: `${deleteDialogType === 'program' ? 'Program' : 'Inisiatif'} berhasil dihapus`,
        severity: 'success',
      });

      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchPrograms(selectedRbsi.id, selectedTahun, true);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal menghapus data',
        severity: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Status symbol rendering using Checkbox
  const renderStatus = (status: 'none' | 'planned' | 'realized', isEditable: boolean) => {
    const isChecked = status === 'realized';
    const isIndeterminate = status === 'planned';

    return (
      <Checkbox
        checked={isChecked}
        indeterminate={isIndeterminate}
        size="small"
        disabled={!isEditable}
        sx={{
          p: 0,
          '& .MuiSvgIcon-root': { fontSize: 20 },
          color: status === 'none' ? '#E0E0E0' : status === 'planned' ? '#FFC107' : '#4CAF50',
          '&.Mui-checked': { color: '#4CAF50' },
          '&.MuiCheckbox-indeterminate': { color: '#FFC107' },
          '&.Mui-disabled': {
            color: status === 'none' ? '#E0E0E0' : status === 'planned' ? '#FFC107' : '#4CAF50',
          },
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      />
    );
  };

  return (
    <Box
      sx={{
        p: 3.5,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <DashboardIcon sx={{ fontSize: 32, color: '#DA251C' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1d1d1f',
                letterSpacing: '-0.02em',
              }}
            >
              Manajemen RBSI
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#86868b' }}>
            Kelola program, inisiatif, dan progress KEP dalam satu tampilan
          </Typography>
        </Box>

        {/* RBSI (Periode) Dropdown */}
        <Box>
          <Button
            endIcon={rbsiLoading ? <CircularProgress size={16} /> : periodeAnchorEl ? <ArrowUpIcon /> : <ArrowDownIcon />}
            onClick={e => setPeriodeAnchorEl(e.currentTarget)}
            disabled={rbsiLoading}
            sx={{
              bgcolor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              py: 1,
              px: 2,
              color: '#1d1d1f',
              fontWeight: 600,
              fontSize: '0.95rem',
              minWidth: '180px',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              '&:hover': { bgcolor: '#fafafa', borderColor: '#DA251C' },
            }}
          >
            {selectedRbsi ? `Periode ${selectedRbsi.periode}` : 'Pilih Periode'}
          </Button>
          <Menu
            anchorEl={periodeAnchorEl}
            open={Boolean(periodeAnchorEl)}
            onClose={() => setPeriodeAnchorEl(null)}
            PaperProps={{
              sx: { mt: 1, borderRadius: '12px', minWidth: '200px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
            }}
          >
            {rbsiList.length === 0 && !rbsiLoading && (
              <MenuItem disabled>
                <Typography variant="body2" sx={{ color: '#86868b' }}>
                  Tidak ada data RBSI
                </Typography>
              </MenuItem>
            )}
            {rbsiList.map(rbsi => (
              <MenuItem
                key={rbsi.id}
                selected={selectedRbsi?.id === rbsi.id}
                onClick={() => {
                  setSelectedRbsi(rbsi);
                  setPeriodeAnchorEl(null);
                }}
              >
                {rbsi.periode}
              </MenuItem>
            ))}
            <Box sx={{ borderTop: '1px solid #e5e5e7', mt: 1, pt: 1 }}>
              <MenuItem
                onClick={() => {
                  setPeriodeAnchorEl(null);
                  setOpenAddPeriodeModal(true);
                }}
                sx={{
                  color: '#DA251C',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.05)' },
                }}
              >
                <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                Tambah Periode
              </MenuItem>
            </Box>
          </Menu>
        </Box>
      </Box>

      {/* View Mode Tabs */}
      <Paper sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs
          value={viewMode}
          onChange={(_, newValue) => setViewMode(newValue)}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#DA251C' },
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' },
            '& .Mui-selected': { color: '#DA251C' },
          }}
        >
          <Tab value="monitoring" label="Monitoring Progress" icon={<KepIcon />} iconPosition="start" />
          <Tab value="table" label="Daftar Program" icon={<FolderRounded />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Legend (only in monitoring mode) */}
      {viewMode === 'monitoring' && (
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
            Keterangan Progress:
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderStatus('none', false)}
              <Typography variant="caption">Tidak Ada</Typography>
            </Box>
            {/* TEMPORARY: Hidden 'planned' state - uncomment if needed */}
            {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderStatus('planned', false)}
              <Typography variant="caption">Direncanakan</Typography>
            </Box> */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderStatus('realized', false)}
              <Typography variant="caption">Terealisasi</Typography>
            </Box>
          </Box>
          <Box sx={{ width: '1px', height: 20, bgcolor: '#e0e0e0', mx: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
            Perbandingan KEP:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderRadius: '4px', px: 0.5, py: 0.25 }}>
                <NewIcon sx={{ fontSize: 14 }} />
              </Box>
              <Typography variant="caption">Baru</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#FF9800', borderRadius: '4px', px: 0.5, py: 0.25 }}>
                <ChangedIcon sx={{ fontSize: 14 }} />
              </Box>
              <Typography variant="caption">Diubah</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f44336', borderRadius: '4px', px: 0.5, py: 0.25 }}>
                <DeletedIcon sx={{ fontSize: 14 }} />
              </Box>
              <Typography variant="caption">Dihapus</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Main Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Cari program atau inisiatif..."
              size="small"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              sx={{
                width: 300,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f5f5f7',
                  borderRadius: '10px',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'transparent' },
                  '&.Mui-focused fieldset': { borderColor: '#DA251C', borderWidth: 2 },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#86868b', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Year Filter for Table mode */}
            {viewMode === 'table' && (
              <Stack direction="row" spacing={0.5}>
                {tahunOptions.map(tahun => {
                  const kep = kepList.find(k => k.tahunPelaporan === tahun);
                  return (
                    <Chip
                      key={tahun}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {tahun}
                          {kep && <KepIcon sx={{ fontSize: 12 }} />}
                        </Box>
                      }
                      size="small"
                      onClick={() => setSelectedTahun(tahun)}
                      sx={{
                        fontWeight: 600,
                        ...(selectedTahun === tahun
                          ? { bgcolor: '#DA251C', color: 'white' }
                          : { bgcolor: '#f5f5f7', color: '#666' }),
                      }}
                    />
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Action Buttons - Compact Design */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {/* Icon buttons for secondary actions */}
            <Tooltip title="Riwayat Perubahan">
              <IconButton
                size="small"
                onClick={() => setOpenHistoryModal(true)}
                sx={{
                  color: '#86868b',
                  '&:hover': { color: '#1d1d1f', bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                <HistoryIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {kepList.length >= 2 && (
              <Tooltip title="Analytics Progress">
                <IconButton
                  size="small"
                  onClick={() => setOpenAnalyticsModal(true)}
                  sx={{
                    color: '#7B1FA2',
                    '&:hover': { bgcolor: 'rgba(123, 31, 162, 0.08)' },
                  }}
                >
                  <AnalyticsIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}

            {previousTahun && (
              <Tooltip title={`Salin dari ${previousTahun}`}>
                <IconButton
                  size="small"
                  onClick={() => setOpenCopyModal(true)}
                  sx={{
                    color: '#DA251C',
                    '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.08)' },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Tambah KEP">
              <IconButton
                size="small"
                onClick={() => {
                  const maxYear = kepList.length > 0 ? Math.max(...kepList.map(k => k.tahunPelaporan)) : currentYear;
                  setNewKepYear(maxYear + 1);
                  setNewKepNomor(`KEP-${String(kepList.length + 1).padStart(3, '0')}/${maxYear + 1}`);
                  setAddKepDialogOpen(true);
                }}
                sx={{
                  color: '#1565C0',
                  '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' },
                }}
              >
                <KepIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* Divider */}
            <Box sx={{ width: 1, height: 24, bgcolor: '#e0e0e0', mx: 0.5 }} />

            {/* Primary action: Add Program */}
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => setOpenAddProgramModal(true)}
              sx={{
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                py: 0.75,
                px: 1.5,
                minWidth: 'auto',
                '&:hover': { background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)' },
              }}
            >
              Program
            </Button>

            {/* Save Button (monitoring mode only, shown when there are changes) */}
            {viewMode === 'monitoring' && hasChanges && (
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                onClick={handleSave}
                sx={{
                  ml: 0.5,
                  bgcolor: '#4CAF50',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: 0.75,
                  px: 1.5,
                  minWidth: 'auto',
                  '&:hover': { bgcolor: '#388E3C' },
                }}
              >
                Simpan
              </Button>
            )}
          </Box>
        </Box>

        {/* KEP Info Banner (only in table mode) */}
        {viewMode === 'table' && selectedKep && (
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: '#E3F2FD',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <KepIcon sx={{ color: '#1565C0', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#1565C0', fontWeight: 500 }}>
              Data untuk <strong>{selectedKep.nomorKep}</strong> (Tahun Pelaporan {selectedKep.tahunPelaporan})
            </Typography>
          </Box>
        )}

        {/* Table / Monitoring View */}
        {viewMode === 'monitoring' ? (
          /* ============ MONITORING VIEW - 2 Panel Layout ============ */
          <Box sx={{ maxHeight: 'calc(100vh - 320px)', minHeight: 400, overflow: 'auto' }}>
            {/* Loading State */}
            {(kepLoading || programsLoading || allYearsLoading) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                  Memuat data...
                </Typography>
              </Box>
            ) : filteredMonitoringPrograms.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <FolderOpenRounded sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {debouncedKeyword ? 'Tidak ada program yang sesuai pencarian' : 'Belum ada data program'}
                </Typography>
              </Box>
            ) : (
              <Box 
                data-resize-container
                sx={{ 
                  position: 'relative',
                  overflow: 'auto',
                }}
              >
                <Table size="small" stickyHeader>
                  <colgroup>
                    {/* Name columns - adjustable width */}
                    {kepList.map((kep) => (
                      <col key={`name-col-${kep.id}`} style={{ width: `${leftPanelWidth / kepList.length}%` }} />
                    ))}
                    {/* Progress columns - remaining width */}
                    {kepList.map((kep) => (
                      <col key={`progress-col-${kep.id}`} style={{ width: `${(100 - leftPanelWidth) / kepList.length}%` }} />
                    ))}
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      {/* Program/Inisiatif Name Headers */}
                      {kepList.map((kep, idx) => {
                        const isSelected = kep.tahunPelaporan === selectedTahun;
                        return (
                          <TableCell
                            key={`prog-header-${kep.id}`}
                            sx={{
                              fontWeight: 600,
                              color: isSelected ? '#DA251C' : '#2C3E50',
                              py: 1,
                              minWidth: 200,
                              bgcolor: isSelected ? 'rgba(218, 37, 28, 0.08)' : '#f8f9fa',
                              borderRight: idx === kepList.length - 1 ? '3px solid #DA251C' : '1px solid #e0e0e0',
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                              {kep.nomorKep}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#86868b', display: 'block', fontSize: '0.6rem' }}>
                              Program/Inisiatif
                            </Typography>
                          </TableCell>
                        );
                      })}
                      {/* Progress Headers */}
                      {kepList.map(kep => {
                        const isSelected = kep.tahunPelaporan === selectedTahun;
                        const periodYearsArray = Array.from(
                          { length: periodYears.end - periodYears.start + 1 },
                          (_, i) => periodYears.start + i
                        );
                        return (
                          <TableCell
                            key={`progress-header-${kep.id}`}
                            align="center"
                            sx={{
                              fontWeight: 600,
                              color: isSelected ? '#DA251C' : '#2C3E50',
                              py: 1,
                              minWidth: 160,
                              bgcolor: isSelected ? 'rgba(218, 37, 28, 0.08)' : '#f0f0f0',
                              borderRight: '1px solid #e0e0e0',
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                              Progress {kep.nomorKep}
                            </Typography>
                            <Chip
                              label="Edit"
                              size="small"
                              sx={{ height: 14, fontSize: '0.5rem', bgcolor: '#4CAF50', color: 'white', my: 0.25 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25, mt: 0.25 }}>
                              {periodYearsArray.map(year => (
                                <Typography
                                  key={year}
                                  variant="caption"
                                  sx={{
                                    fontSize: '0.55rem',
                                    color: year === currentYear ? '#DA251C' : '#86868b',
                                    fontWeight: year === currentYear ? 700 : 400,
                                    minWidth: 22,
                                    textAlign: 'center',
                                  }}
                                >
                                  {year.toString().slice(-2)}
                                </Typography>
                              ))}
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMonitoringPrograms.map(program => {
                        const periodYearsArray = Array.from(
                          { length: periodYears.end - periodYears.start + 1 },
                          (_, i) => periodYears.start + i
                        );
                        
                        // Use initiatives from filteredMonitoringPrograms (already filtered)
                        const filteredInitiatives = program.initiatives || [];
                        
                        return (
                          <React.Fragment key={`prog-${program.nomor_program}`}>
                            {/* Program Row */}
                            <TableRow
                              sx={{
                                bgcolor: '#f5f5f7',
                                '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' },
                              }}
                            >
                              {/* Program Name Columns */}
                              {kepList.map((kep, kepIndex) => {
                                const isSelected = kep.tahunPelaporan === selectedTahun;
                                const programVersion = program.versions_by_year[kep.tahunPelaporan]; // O(1) direct access!
                                
                                return (
                                  <TableCell
                                    key={`prog-name-${program.nomor_program}-${kep.id}`}
                                    sx={{
                                      py: 1.5,
                                      px: 1,
                                      borderRight: kepIndex === kepList.length - 1 ? '3px solid #DA251C' : '1px solid #e0e0e0',
                                      bgcolor: isSelected ? 'rgba(218, 37, 28, 0.04)' : '#f5f5f7',
                                      opacity: programVersion ? 1 : 0.4,
                                    }}
                                  >
                                    {programVersion ? (
                                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                        <FolderRounded sx={{ color: '#DA251C', fontSize: 14, mt: 0.1 }} />
                                        <Box sx={{ flex: 1 }}>
                                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#2C3E50', lineHeight: 1.2 }}>
                                            {program.nomor_program}
                                          </Typography>
                                          <Typography
                                            sx={{
                                              fontSize: '0.65rem',
                                              color: '#555',
                                              wordBreak: 'break-word',
                                              lineHeight: 1.3,
                                              mt: 0.25,
                                            }}
                                          >
                                            {programVersion.nama_program}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    ) : (
                                      <Typography sx={{ fontSize: '0.65rem', color: '#999', fontStyle: 'italic' }}>—</Typography>
                                    )}
                                  </TableCell>
                                );
                              })}
                              {/* Program Progress Columns */}
                              {kepList.map(kep => {
                                const isSelected = kep.tahunPelaporan === selectedTahun;
                                const programVersion = program.versions_by_year[kep.tahunPelaporan];
                                return (
                                  <TableCell
                                    key={`prog-progress-${program.nomor_program}-${kep.id}`}
                                    sx={{
                                      py: 1.5,
                                      px: 0.5,
                                      borderRight: '1px solid #e0e0e0',
                                      bgcolor: isSelected ? 'rgba(218, 37, 28, 0.04)' : '#f5f5f7',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {programVersion && (
                                      <Chip
                                        label={`${filteredInitiatives.length} inisiatif`}
                                        size="small"
                                        sx={{ height: 16, fontSize: '0.55rem' }}
                                      />
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>

                            {/* Inisiatif Rows */}
                            {filteredInitiatives.map(initiative => {
                              const groupId = initiative.group_id;
                              return (
                                <TableRow key={`ini-${program.nomor_program}-${groupId}`} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                  {/* Inisiatif Name Columns */}
                                  {kepList.map((kep, kepIndex) => {
                                    const isSelected = kep.tahunPelaporan === selectedTahun;
                                    const iniVersion = initiative.versions_by_year[kep.tahunPelaporan]; // O(1) direct access!
                                    
                                    return (
                                      <TableCell
                                        key={`ini-name-${groupId}-${kep.id}`}
                                        sx={{
                                          py: 1,
                                          px: 1,
                                          borderRight: kepIndex === kepList.length - 1 ? '3px solid #DA251C' : '1px solid #e0e0e0',
                                          bgcolor: isSelected ? 'rgba(218, 37, 28, 0.02)' : 'transparent',
                                          opacity: iniVersion ? 1 : 0.4,
                                        }}
                                      >
                                        {iniVersion ? (
                                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                            <AssignmentRounded sx={{ color: '#666', fontSize: 12, mt: 0.1 }} />
                                            <Box sx={{ flex: 1 }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexWrap: 'wrap' }}>
                                                <Typography
                                                  component="span"
                                                  sx={{
                                                    fontSize: '0.6rem',
                                                    color: '#555',
                                                    wordBreak: 'break-word',
                                                    lineHeight: 1.3,
                                                  }}
                                                >
                                                  <Box component="span" sx={{ fontWeight: 600, color: '#333' }}>
                                                    {iniVersion.nomor_inisiatif}
                                                  </Box>
                                                  {' - '}
                                                  {iniVersion.nama_inisiatif}
                                                </Typography>
                                                {iniVersion.status_badge === 'new' && (
                                                  <Tooltip title="Inisiatif baru di tahun ini" arrow>
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderRadius: '4px', px: 0.3, py: 0.1 }}>
                                                      <NewIcon sx={{ fontSize: 10 }} />
                                                    </Box>
                                                  </Tooltip>
                                                )}
                                                {iniVersion.status_badge === 'modified' && (
                                                  <Tooltip title="Inisiatif diubah dari tahun sebelumnya" arrow>
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#FF9800', borderRadius: '4px', px: 0.3, py: 0.1 }}>
                                                      <ChangedIcon sx={{ fontSize: 10 }} />
                                                    </Box>
                                                  </Tooltip>
                                                )}
                                                {iniVersion.status_badge === 'deleted' && (
                                                  <Tooltip title="Inisiatif dihapus setelah tahun ini" arrow>
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#F44336', borderRadius: '4px', px: 0.3, py: 0.1 }}>
                                                      <DeletedIcon sx={{ fontSize: 10 }} />
                                                    </Box>
                                                  </Tooltip>
                                                )}
                                              </Box>
                                            </Box>
                                          </Box>
                                        ) : (
                                          <Typography sx={{ fontSize: '0.6rem', color: '#ccc', fontStyle: 'italic' }}>—</Typography>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                  {/* Inisiatif Progress Columns */}
                                  {kepList.map(kep => {
                                    const iniVersion = initiative.versions_by_year[kep.tahunPelaporan];
                                    
                                    return (
                                      <TableCell
                                        key={`ini-progress-${groupId}-${kep.id}`}
                                        sx={{
                                          py: 1,
                                          px: 0.5,
                                          borderRight: '1px solid #e0e0e0',
                                          bgcolor: 'transparent',
                                          opacity: iniVersion ? 1 : 0.3,
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center', alignItems: 'center' }}>
                                          {periodYearsArray.map(year => {
                                            const cellKey = `${groupId}-${kep.id}-${year}`;
                                            const updateKey = cellUpdates.get(cellKey) || 0;
                                            
                                            return (
                                              <ProgressCell
                                                key={cellKey}
                                                groupId={groupId}
                                                kepId={kep.id}
                                                year={year}
                                                iniVersion={iniVersion}
                                                getProgress={getProgress}
                                                toggleProgress={toggleProgress}
                                                renderStatus={renderStatus}
                                                updateKey={updateKey}
                                              />
                                            );
                                          })}
                                        </Box>
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                  </TableBody>
                </Table>

                {/* RESIZE HANDLE OVERLAY */}
                <Box
                  onMouseDown={handleMouseDown}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: `${leftPanelWidth}%`,
                    width: 12,
                    height: '100%',
                    cursor: 'col-resize',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateX(-50%)',
                    '&:hover .resize-indicator': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    className="resize-indicator"
                    sx={{
                      width: 4,
                      height: 60,
                      bgcolor: isResizing ? '#DA251C' : '#999',
                      borderRadius: 2,
                      opacity: isResizing ? 1 : 0,
                      transition: 'all 0.2s',
                      boxShadow: isResizing ? '0 2px 8px rgba(218, 37, 28, 0.3)' : 'none',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          /* ============ TABLE VIEW ============ */
          <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', minHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#2C3E50',
                      py: 1.5,
                      minWidth: 400,
                      bgcolor: '#f8f9fa',
                    }}
                  >
                    Program
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(kepLoading || programsLoading) ? (
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                      <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                        Memuat data...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', py: 4 }}>
                      <FolderOpenRounded sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {keyword ? 'Tidak ada program yang sesuai pencarian' : 'Belum ada data program'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrograms.map(program => (
                  <React.Fragment key={program.id}>
                    {/* Program Row */}
                    <TableRow
                      sx={{
                        bgcolor: '#f5f5f7',
                        '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' },
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleExpand(program.id)}
                    >
                      <TableCell
                        sx={{
                          py: 1.5,
                          borderLeft: '4px solid #DA251C',
                          bgcolor: '#f5f5f7',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small">
                            {expandedPrograms.has(program.id) ? <ExpandIcon /> : <CollapseIcon />}
                          </IconButton>
                          <FolderRounded sx={{ color: '#DA251C', fontSize: 20 }} />
                          <Typography fontWeight={600} sx={{ color: '#2C3E50', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            {program.nomor_program}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              color: '#666',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 200,
                            }}
                            title={program.nama_program}
                          >
                            {program.nama_program}
                          </Typography>
                          <Tooltip title="Edit Program">
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleEditProgram(program);
                              }}
                              sx={{
                                p: 0.5,
                                color: '#86868b',
                                '&:hover': { color: '#DA251C', bgcolor: 'rgba(218, 37, 28, 0.08)' },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus Program">
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteProgram(program);
                              }}
                              sx={{
                                p: 0.5,
                                color: '#86868b',
                                '&:hover': { color: '#d32f2f', bgcolor: 'rgba(211, 47, 47, 0.08)' },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Chip
                            label={`${program.inisiatifs?.length || 0} Inisiatif`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', ml: 'auto' }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Inisiatif Rows - Table View */}
                    {expandedPrograms.has(program.id) && (
                      <TableRow>
                        <TableCell colSpan={1} sx={{ p: 0, border: 'none' }}>
                          <Collapse in={expandedPrograms.has(program.id)} timeout="auto">
                            <Box sx={{ bgcolor: '#fafafa', p: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                      Nomor
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                      Nama Inisiatif
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                      Tahun
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                      Aksi
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(program.inisiatifs?.length ?? 0) === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                                        <FolderOpenRounded sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                                        <Typography variant="body2">Belum ada inisiatif</Typography>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    [...(program.inisiatifs ?? [])]
                                      .sort((a, b) => compareNomor(a.nomor_inisiatif, b.nomor_inisiatif))
                                      .map(inisiatif => (
                                        <TableRow
                                          key={inisiatif.id}
                                          sx={{ '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' } }}
                                        >
                                          <TableCell>
                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                              {inisiatif.nomor_inisiatif}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                              <AssignmentRounded sx={{ color: '#666', fontSize: 18 }} />
                                              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                                {inisiatif.nama_inisiatif}
                                              </Typography>
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Typography sx={{ fontSize: '0.85rem' }}>{inisiatif.tahun}</Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                              <Tooltip title="Edit">
                                                <IconButton
                                                  size="small"
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    handleEditInisiatif(inisiatif, program.tahun);
                                                  }}
                                                  sx={{
                                                    color: '#FF9800',
                                                    '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.08)' },
                                                  }}
                                                >
                                                  <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Hapus">
                                                <IconButton
                                                  size="small"
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    handleDeleteInisiatif(inisiatif);
                                                  }}
                                                  sx={{
                                                    color: '#d32f2f',
                                                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' },
                                                  }}
                                                >
                                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                  )}
                                  {/* Tambah Inisiatif Row */}
                                  <TableRow>
                                    <TableCell colSpan={4} sx={{ py: 1.5 }}>
                                      <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={e => {
                                          e.stopPropagation();
                                          setSelectedProgramIdForInisiatif(program.id);
                                          setOpenAddInisiatifModal(true);
                                        }}
                                        sx={{
                                          color: '#DA251C',
                                          fontSize: '0.85rem',
                                          fontWeight: 500,
                                          '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.08)' },
                                        }}
                                      >
                                        Tambah Inisiatif
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add KEP Dialog */}
      <Dialog open={addKepDialogOpen} onClose={() => !addKepLoading && setAddKepDialogOpen(false)}>
        <DialogTitle>Tambah KEP Baru</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nomor KEP"
              value={newKepNomor}
              onChange={e => setNewKepNomor(e.target.value)}
              placeholder="KEP-001/2025"
              helperText="Contoh: KEP-001/2025"
              disabled={addKepLoading}
            />
            <TextField
              fullWidth
              label="Tahun Pelaporan"
              type="number"
              value={newKepYear}
              onChange={e => setNewKepYear(parseInt(e.target.value) || currentYear)}
              inputProps={{ min: periodYears.start, max: periodYears.end + 5 }}
              disabled={addKepLoading}
            />
            <Alert severity="info">
              KEP baru akan menggunakan data program dan inisiatif yang sama. Anda dapat mengubah progress per KEP setelahnya.
            </Alert>
            {addKepLoading && (
              <Alert severity="warning" icon={<CircularProgress size={20} />}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Sedang membuat KEP dan menyalin data progress...
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Proses ini mungkin memakan waktu beberapa detik. Mohon tunggu.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddKepDialogOpen(false)} disabled={addKepLoading}>Batal</Button>
          <Button 
            variant="contained" 
            onClick={handleAddKep} 
            disabled={addKepLoading}
            startIcon={addKepLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: '#DA251C', '&:hover': { bgcolor: '#B91C14' } }}
          >
            {addKepLoading ? 'Membuat...' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Program Modal */}
      <AddProgramModal
        open={openAddProgramModal}
        onClose={() => setOpenAddProgramModal(false)}
        onSuccess={() => {
          if (selectedRbsi) {
            fetchPrograms(selectedRbsi.id, selectedTahun, true);
          }
        }}
        rbsiId={selectedRbsi?.id || ''}
        tahun={selectedTahun}
      />

      {/* Add Inisiatif Modal */}
      <AddInisiatifModal
        open={openAddInisiatifModal}
        onClose={() => {
          setOpenAddInisiatifModal(false);
          setSelectedProgramIdForInisiatif('');
        }}
        onSuccess={() => {
          if (selectedRbsi) {
            fetchPrograms(selectedRbsi.id, selectedTahun, true);
            fetchInisiatifGroups(selectedRbsi.id); // Refresh groups cache
            if (viewMode === 'monitoring') {
              fetchMonitoringData(selectedRbsi.id);
            }
          }
        }}
        preselectedProgramId={selectedProgramIdForInisiatif}
        programs={programs}
      />

      {/* Add Periode (RBSI) Modal */}
      <AddPeriodeModal
        open={openAddPeriodeModal}
        onClose={() => setOpenAddPeriodeModal(false)}
        onSuccess={handleCreateRbsi}
        existingPeriodes={rbsiList.map(r => r.periode)}
      />

      {/* Copy From Year Modal */}
      {previousTahun && selectedRbsi && (
        <CopyFromYearModal
          open={openCopyModal}
          onClose={() => setOpenCopyModal(false)}
          onSuccess={() => {
            if (selectedRbsi) {
              fetchPrograms(selectedRbsi.id, selectedTahun, true);
            }
          }}
          rbsiId={selectedRbsi.id}
          fromTahun={previousTahun}
          toTahun={selectedTahun}
          existingPrograms={programs}
        />
      )}

      {/* History Comparison Modal */}
      {selectedRbsi && (
        <HistoryComparisonModal
          open={openHistoryModal}
          onClose={() => setOpenHistoryModal(false)}
          rbsiId={selectedRbsi.id}
          periode={selectedRbsi.periode}
        />
      )}

      {/* Analytics Modal */}
      {selectedRbsi && kepList.length >= 2 && (
        <AnalyticsModal
          open={openAnalyticsModal}
          onClose={() => setOpenAnalyticsModal(false)}
          rbsiId={selectedRbsi.id}
          periode={selectedRbsi.periode}
          kepList={kepList}
        />
      )}

      {/* Edit Program/Inisiatif Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editLoading && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e5e5e7',
          pb: 2,
          bgcolor: 'white',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            Edit {editDialogType === 'program' ? 'Program' : 'Inisiatif'}
          </Typography>
          <IconButton onClick={() => setEditDialogOpen(false)} size="small" disabled={editLoading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
            <TextField
              fullWidth
              label={editDialogType === 'program' ? 'Nomor Program' : 'Nomor Inisiatif'}
              value={editNomor}
              onChange={e => setEditNomor(e.target.value)}
              size="small"
            />
            <TextField
              fullWidth
              label={editDialogType === 'program' ? 'Nama Program' : 'Nama Inisiatif'}
              value={editNama}
              onChange={e => setEditNama(e.target.value)}
              multiline
              rows={2}
            />
            
            {/* Group Management (only for Inisiatif) */}
            {editDialogType === 'inisiatif' && (
              <>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Manajemen Grup Inisiatif
                </Typography>
                <Autocomplete
                  fullWidth
                  options={[{ id: 'NEW_GROUP', nama_inisiatif: '🆕 Buat Grup Baru (Pisahkan dari grup)', tahun_list: [], nomor_inisiatif_by_year: [] }, ...inisiatifGroups]}
                  value={
                    editGroupId === null
                      ? { id: 'NEW_GROUP', nama_inisiatif: '🆕 Buat Grup Baru (Pisahkan dari grup)', tahun_list: [], nomor_inisiatif_by_year: [] }
                      : inisiatifGroups.find(g => g.id === editGroupId) || null
                  }
                  onChange={(_, newValue) => {
                    if (!newValue) {
                      setEditGroupId(null);
                    } else if (newValue.id === 'NEW_GROUP') {
                      setEditGroupId(null);
                    } else {
                      setEditGroupId(newValue.id);
                    }
                  }}
                  getOptionLabel={(option) => option.nama_inisiatif}
                  disabled={loadingInisiatifGroups}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Grup Inisiatif"
                      size="small"
                      helperText={
                        loadingInisiatifGroups
                          ? 'Memuat grup...'
                          : editGroupId === null
                          ? 'Inisiatif ini akan membuat grup baru (terpisah dari grup lain)'
                          : 'Inisiatif ini akan di-link dengan grup yang dipilih'
                      }
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.id === 'NEW_GROUP' ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                          {option.nama_inisiatif}
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {option.nama_inisiatif}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                            Tahun: {option.tahun_list.join(', ')} • Nomor: {option.nomor_inisiatif_by_year[option.nomor_inisiatif_by_year.length - 1]?.nomor_inisiatif || '-'}
                          </Typography>
                        </Box>
                      )}
                    </li>
                  )}
                  ListboxProps={{
                    style: { maxHeight: 280 },
                  }}
                  noOptionsText="Tidak ada grup inisiatif"
                />
                {editingItem?.groupId && (
                  <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                    Grup saat ini: <strong>{inisiatifGroups.find(g => g.id === editingItem.groupId)?.nama_inisiatif || 'Unknown'}</strong>
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e5e5e7', bgcolor: 'white' }}>
          <Button 
            variant="outlined"
            onClick={() => setEditDialogOpen(false)} 
            disabled={editLoading}
            sx={{
              borderColor: '#86868b',
              color: '#86868b',
              '&:hover': {
                borderColor: '#1d1d1f',
                bgcolor: 'transparent',
              },
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            startIcon={editLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveEdit}
            disabled={editLoading || !editNomor?.trim() || !editNama?.trim()}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
              '&.Mui-disabled': {
                background: '#e5e5e7',
              },
            }}
          >
            {editLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#d32f2f', pb: 1 }}>
          Hapus {deleteDialogType === 'program' ? 'Program' : 'Inisiatif'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Apakah Anda yakin ingin menghapus {deleteDialogType === 'program' ? 'program' : 'inisiatif'} berikut?
            </Typography>
            {deletingItem && (
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                  {deletingItem.nomor}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {deletingItem.nama}
                </Typography>
                {deleteDialogType === 'program' && deletingItem.inisiatifCount && deletingItem.inisiatifCount > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Program ini memiliki <strong>{deletingItem.inisiatifCount} inisiatif</strong>. 
                      Semua inisiatif tersebut juga akan ikut dihapus.
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingItem(null);
            }} 
            disabled={deleteLoading} 
            sx={{ color: '#86868b' }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            sx={{
              bgcolor: '#d32f2f',
              '&:hover': { bgcolor: '#b71c1c' },
            }}
          >
            {deleteLoading ? <CircularProgress size={20} color="inherit" /> : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RbsiManagementPage;
