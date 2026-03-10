import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/icons-material';
import {
  getAllRbsi,
  createRbsi,
  getProgramsByRbsi,
  getKepList as apiGetKepList,
  createKep as apiCreateKep,
  updateKepProgress,
  getKepProgress as apiGetKepProgress,
  updateProgram as apiUpdateProgram,
  updateInisiatif as apiUpdateInisiatif,
  deleteProgram as apiDeleteProgram,
  deleteInisiatif as apiDeleteInisiatif,
} from '../api/rbsiApi';
import type {
  RbsiResponse,
  RbsiProgramResponse,
  RbsiKepResponse,
  KepProgressFullResponse,
} from '../api/rbsiApi';
import {
  AddProgramModal,
  AddInisiatifModal,
  AddPeriodeModal,
  CopyFromYearModal,
  HistoryComparisonModal,
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

interface KepProgress {
  kepId: string;
  nomorKep: string;
  tahunPelaporan: number;
  yearlyProgress: YearProgress[];
}

interface InisiatifKepData {
  inisiatifId: string;
  kepProgress: Map<string, KepProgress>;
}

// ============ COMPONENT ============

function RbsiManagementPage() {
  // View mode: 'table' = simple program list, 'monitoring' = with KEP progress columns
  const [viewMode, setViewMode] = useState<'table' | 'monitoring'>('monitoring');

  const [keyword, setKeyword] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

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

  // Progress data
  const [progressMap, setProgressMap] = useState<Map<string, InisiatifKepData>>(new Map());

  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Modal states
  const [openAddProgramModal, setOpenAddProgramModal] = useState(false);
  const [openAddInisiatifModal, setOpenAddInisiatifModal] = useState(false);
  const [selectedProgramIdForInisiatif, setSelectedProgramIdForInisiatif] = useState<string>('');
  const [openAddPeriodeModal, setOpenAddPeriodeModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);

  // Add KEP dialog
  const [addKepDialogOpen, setAddKepDialogOpen] = useState(false);
  const [newKepNomor, setNewKepNomor] = useState<string>('');
  const [newKepYear, setNewKepYear] = useState<number>(new Date().getFullYear());

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
  } | null>(null);
  const [editNomor, setEditNomor] = useState('');
  const [editNama, setEditNama] = useState('');
  const [editLoading, setEditLoading] = useState(false);

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

  const currentYear = new Date().getFullYear();

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

    const fetchProgressData = useCallback(async (rbsiId: string, tahun: number) => {
    try {
      const response = await apiGetKepProgress(rbsiId, tahun);
      const progressData: KepProgressFullResponse = response.data;

      const newProgressMap = new Map<string, InisiatifKepData>();

      if (progressData.progress) {
        progressData.progress.forEach((inisiatifProgress) => {
          const kepProgress = new Map<string, KepProgress>();

          inisiatifProgress.kep_progress.forEach((kepItem) => {
            kepProgress.set(kepItem.kep_id, {
              kepId: kepItem.kep_id,
              nomorKep: kepItem.nomor_kep,
              tahunPelaporan: kepItem.tahun_pelaporan,
              yearlyProgress: kepItem.yearly_progress.map((yp) => ({
                tahun: yp.tahun,
                status: yp.status as 'none' | 'planned' | 'realized',
              })),
            });
          });

          newProgressMap.set(inisiatifProgress.inisiatif_id, {
            inisiatifId: inisiatifProgress.inisiatif_id,
            kepProgress,
          });
        });
      }

      setProgressMap(newProgressMap);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
      setProgressMap(new Map());
    }
  }, []);

  // Fetch RBSI list
  useEffect(() => {
    fetchRbsiList();
  }, []);

  // Fetch programs and KEP when RBSI selected
  useEffect(() => {
    if (selectedRbsi) {
      fetchKepList(selectedRbsi.id);
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

  // Fetch progress data when in monitoring mode or when selected year changes
  useEffect(() => {
    if (selectedRbsi && kepList.length > 0 && viewMode === 'monitoring' && selectedTahun) {
      // Reset unsaved changes when switching years (data will be refreshed from backend)
      setHasChanges(false);
      fetchProgressData(selectedRbsi.id, selectedTahun);
    }
  }, [selectedRbsi, kepList, viewMode, selectedTahun, fetchProgressData]);

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

  const tokenizeNomor = (value: string): Array<string | number> => {
    return value
      .split('.')
      .flatMap(part => part.match(/(\d+|[^\d]+)/g) || [])
      .map(token => (token.match(/^\d+$/) ? parseInt(token, 10) : token.toLowerCase()));
  };

  const compareNomor = (a: string, b: string): number => {
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

  const filteredPrograms = programs
    .filter(program => {
      const inisiatifs = program.inisiatifs || [];
      const matchKeyword =
        program.nama_program.toLowerCase().includes(keyword.toLowerCase()) ||
        program.nomor_program.toLowerCase().includes(keyword.toLowerCase()) ||
        inisiatifs.some(ini => ini.nama_inisiatif.toLowerCase().includes(keyword.toLowerCase()));
      return matchKeyword;
    })
    .sort((a, b) => compareNomor(a.nomor_program, b.nomor_program));

  // Get progress for inisiatif in specific KEP
  const getProgress = (inisiatifId: string, kepId: string, targetYear: number): 'none' | 'planned' | 'realized' => {
    const data = progressMap.get(inisiatifId);
    if (!data) {
      console.warn(`No progress data found for inisiatif ID: ${inisiatifId}`);
      console.log('Progress map:', progressMap);
      return 'none';
    }

    const kepProgress = data.kepProgress.get(kepId);
    if (!kepProgress) {
      console.warn(`No progress data found for KEP ID: ${kepId}`);
      return 'none';
    }

    const yearProgress = kepProgress.yearlyProgress.find(y => y.tahun === targetYear);
    return yearProgress?.status || 'none';
  };

  // Toggle progress status
  const toggleProgress = useCallback(
    (inisiatifId: string, kepId: string, targetYear: number) => {
      const currentData = progressMap.get(inisiatifId);
      const currentKepProgress = currentData?.kepProgress.get(kepId);
      const currentYearProgress = currentKepProgress?.yearlyProgress.find(yp => yp.tahun === targetYear);
      const oldStatus = currentYearProgress?.status || 'none';

      let newStatus: 'none' | 'planned' | 'realized';
      if (oldStatus === 'none') newStatus = 'planned';
      else if (oldStatus === 'planned') newStatus = 'realized';
      else newStatus = 'none';

      setProgressMap(prev => {
        const newMap = new Map(prev);
        let data = newMap.get(inisiatifId);

        if (!data) {
          data = {
            inisiatifId,
            kepProgress: new Map(),
          };
        }

        const newData = { ...data, kepProgress: new Map(data.kepProgress) };
        let kepProgress = newData.kepProgress.get(kepId);

        if (!kepProgress) {
          const kep = kepList.find(k => k.id === kepId);
          const yearlyProgress: YearProgress[] = [];
          for (let year = periodYears.start; year <= periodYears.end; year++) {
            yearlyProgress.push({ tahun: year, status: year === targetYear ? newStatus : 'none' });
          }
          kepProgress = {
            kepId,
            nomorKep: kep?.nomorKep || '',
            tahunPelaporan: kep?.tahunPelaporan || targetYear,
            yearlyProgress,
          };
        } else if (kepProgress.yearlyProgress.length === 0) {
          const yearlyProgress: YearProgress[] = [];
          for (let year = periodYears.start; year <= periodYears.end; year++) {
            yearlyProgress.push({ tahun: year, status: year === targetYear ? newStatus : 'none' });
          }
          kepProgress = {
            ...kepProgress,
            yearlyProgress,
          };
        } else {
          kepProgress = {
            ...kepProgress,
            yearlyProgress: kepProgress.yearlyProgress.map(yp => {
              if (yp.tahun === targetYear) {
                return { ...yp, status: newStatus };
              }
              return yp;
            }),
          };
        }

        newData.kepProgress.set(kepId, kepProgress);
        newMap.set(inisiatifId, newData);
        return newMap;
      });

      setHasChanges(true);

      setSnackbar({
        open: true,
        message: `Tahun ${targetYear}: ${newStatus === 'none' ? 'Tidak ada' : newStatus === 'planned' ? 'Direncanakan' : 'Terealisasi'}`,
        severity: 'success',
      });
    },
    [kepList, periodYears, progressMap]
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
        fetchProgressData(selectedRbsi.id, selectedTahun);
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
    }
  };

  // Save progress changes
  const handleSave = async () => {
    if (!selectedRbsi) return;

    try {
      const savePromises: Promise<unknown>[] = [];

      progressMap.forEach((data, inisiatifId) => {
        data.kepProgress.forEach((progress, kepId) => {
          savePromises.push(
            updateKepProgress(selectedRbsi.id, kepId, {
              inisiatif_id: inisiatifId,
              yearly_progress: progress.yearlyProgress,
            })
          );
        });
      });

      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }

      setSnackbar({
        open: true,
        message: 'Perubahan berhasil disimpan',
        severity: 'success',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving progress:', error);
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
  const handleEditInisiatif = (inisiatif: { id: string; nomor_inisiatif: string; nama_inisiatif: string; program_id: string; tahun: number }, programTahun?: number) => {
    setEditDialogType('inisiatif');
    setEditingItem({
      id: inisiatif.id,
      nomor: inisiatif.nomor_inisiatif,
      nama: inisiatif.nama_inisiatif,
      programId: inisiatif.program_id,
      tahun: inisiatif.tahun ?? programTahun ?? selectedTahun,
    });
    setEditNomor(inisiatif.nomor_inisiatif);
    setEditNama(inisiatif.nama_inisiatif);
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
        await apiUpdateInisiatif(editingItem.id, {
          program_id: editingItem.programId,
          tahun: tahun,
          nomor_inisiatif: editNomor,
          nama_inisiatif: editNama,
        });
      }

      setSnackbar({
        open: true,
        message: `${editDialogType === 'program' ? 'Program' : 'Inisiatif'} berhasil diperbarui`,
        severity: 'success',
      });

      setEditDialogOpen(false);
      fetchPrograms(selectedRbsi.id, selectedTahun, true);
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
            Keterangan:
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderStatus('none', false)}
              <Typography variant="caption">Tidak Ada</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderStatus('planned', false)}
              <Typography variant="caption">Direncanakan</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {renderStatus('realized', false)}
              <Typography variant="caption">Terealisasi</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', ml: 'auto' }}>
            Hanya KEP tahun yang dipilih yang dapat diedit
          </Typography>
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

            {/* Year Filter Chips */}
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

        {/* KEP Info Banner */}
        {selectedKep && (
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

        {/* Table */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', minHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#2C3E50',
                    py: 1.5,
                    minWidth: viewMode === 'monitoring' ? 350 : 400,
                    bgcolor: '#f8f9fa',
                    borderRight: viewMode === 'monitoring' ? '2px solid #e0e0e0' : undefined,
                    position: viewMode === 'monitoring' ? 'sticky' : undefined,
                    left: viewMode === 'monitoring' ? 0 : undefined,
                    zIndex: viewMode === 'monitoring' ? 3 : undefined,
                  }}
                >
                  {viewMode === 'monitoring' ? 'Inisiatif' : 'Program'}
                </TableCell>

                {/* KEP Columns (only in monitoring mode) */}
                {viewMode === 'monitoring' &&
                  kepList.map(kep => {
                    const isSelected = kep.tahunPelaporan === selectedTahun;
                    return (
                      <TableCell
                        key={`kep-header-${kep.id}`}
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: isSelected ? '#DA251C' : '#2C3E50',
                          py: 1,
                          minWidth: 80 + (periodYears.end - periodYears.start + 1) * 28,
                          bgcolor: isSelected ? 'rgba(218, 37, 28, 0.08)' : '#f8f9fa',
                          borderRight: '1px solid #e0e0e0',
                          opacity: isSelected ? 1 : 0.7,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          {kep.nomorKep}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#86868b', display: 'block', fontSize: '0.65rem' }}>
                          Tahun {kep.tahunPelaporan}
                        </Typography>
                        {isSelected && (
                          <Chip
                            label="Edit"
                            size="small"
                            sx={{ height: 16, fontSize: '0.55rem', bgcolor: '#4CAF50', color: 'white', mt: 0.25 }}
                          />
                        )}
                        {/* Sub-header: period years */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                          {Array.from({ length: periodYears.end - periodYears.start + 1 }, (_, i) => periodYears.start + i).map(
                            year => (
                              <Typography
                                key={year}
                                variant="caption"
                                sx={{
                                  fontSize: '0.6rem',
                                  color: year === currentYear ? '#DA251C' : '#86868b',
                                  fontWeight: year === currentYear ? 700 : 400,
                                  minWidth: 24,
                                  textAlign: 'center',
                                }}
                              >
                                {year.toString().slice(-2)}
                              </Typography>
                            )
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
              </TableRow>
            </TableHead>

            <TableBody>
              {kepLoading || programsLoading ? (
                <TableRow>
                  <TableCell colSpan={kepList.length + 1} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={kepList.length + 1} sx={{ textAlign: 'center', py: 4 }}>
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
                      onClick={() => toggleExpand(viewMode === 'monitoring' ? program.nomor_program : program.id)}
                    >
                      <TableCell
                        sx={{
                          py: 1.5,
                          borderLeft: '4px solid #DA251C',
                          borderRight: viewMode === 'monitoring' ? '2px solid #e0e0e0' : undefined,
                          position: viewMode === 'monitoring' ? 'sticky' : undefined,
                          left: viewMode === 'monitoring' ? 0 : undefined,
                          bgcolor: '#f5f5f7',
                          zIndex: viewMode === 'monitoring' ? 2 : undefined,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small">
                            {expandedPrograms.has(viewMode === 'monitoring' ? program.nomor_program : program.id) ? (
                              <ExpandIcon />
                            ) : (
                              <CollapseIcon />
                            )}
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

                      {/* Empty KEP Columns for Program Row */}
                      {viewMode === 'monitoring' &&
                        kepList.map(kep => {
                          const isSelected = kep.tahunPelaporan === selectedTahun;
                          return (
                            <TableCell
                              key={`program-${program.id}-kep-${kep.id}`}
                              sx={{
                                py: 1,
                                borderRight: '1px solid #e0e0e0',
                                bgcolor: isSelected ? 'rgba(218, 37, 28, 0.04)' : '#f5f5f7',
                                opacity: isSelected ? 1 : 0.6,
                              }}
                            />
                          );
                        })}
                    </TableRow>

                    {/* Inisiatif Rows */}
                    {expandedPrograms.has(viewMode === 'monitoring' ? program.nomor_program : program.id) && (
                      <>
                        {viewMode === 'monitoring' ? (
                          // Monitoring view: direct rows
                          (program.inisiatifs ?? [])
                            .sort((a, b) => compareNomor(a.nomor_inisiatif, b.nomor_inisiatif))
                            .map(inisiatif => (
                              <TableRow key={inisiatif.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <TableCell
                                  sx={{
                                    py: 1,
                                    pl: 6,
                                    borderRight: '2px solid #e0e0e0',
                                    position: 'sticky',
                                    left: 0,
                                    bgcolor: 'white',
                                    zIndex: 1,
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AssignmentRounded sx={{ color: '#666', fontSize: 16 }} />
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#333', whiteSpace: 'nowrap' }}>
                                      {inisiatif.nomor_inisiatif}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontSize: '0.8rem',
                                        color: '#666',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 180,
                                      }}
                                      title={inisiatif.nama_inisiatif}
                                    >
                                      {inisiatif.nama_inisiatif}
                                    </Typography>
                                    <Tooltip title="Edit Inisiatif">
                                      <IconButton
                                        size="small"
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleEditInisiatif(inisiatif, program.tahun);
                                        }}
                                        sx={{
                                          p: 0.25,
                                          color: '#86868b',
                                          '&:hover': { color: '#DA251C', bgcolor: 'rgba(218, 37, 28, 0.08)' },
                                        }}
                                      >
                                        <EditIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Hapus Inisiatif">
                                      <IconButton
                                        size="small"
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleDeleteInisiatif(inisiatif);
                                        }}
                                        sx={{
                                          p: 0.25,
                                          color: '#86868b',
                                          '&:hover': { color: '#d32f2f', bgcolor: 'rgba(211, 47, 47, 0.08)' },
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>

                                {/* KEP Progress Columns */}
                                {kepList.map(kep => {
                                  const periodYearsArray = Array.from(
                                    { length: periodYears.end - periodYears.start + 1 },
                                    (_, i) => periodYears.start + i
                                  );
                                  // Only allow editing for the KEP that matches selected year
                                  const isKepEditable = kep.tahunPelaporan === selectedTahun;

                                  return (
                                    <TableCell
                                      key={`${inisiatif.id}-kep-${kep.id}`}
                                      align="center"
                                      sx={{
                                        py: 0.5,
                                        px: 1,
                                        borderRight: '1px solid #e0e0e0',
                                        bgcolor: isKepEditable
                                          ? 'rgba(218, 37, 28, 0.04)'
                                          : 'transparent',
                                        opacity: isKepEditable ? 1 : 0.6,
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                        {periodYearsArray.map(year => {
                                          const status = getProgress(inisiatif.id, kep.id, year);
                                          console.log(`Inisiatif ${inisiatif.nomor_inisiatif} - KEP ${kep.nomorKep} - Tahun ${year}: Status = ${status}`);
                                          return (
                                            <Tooltip
                                              key={year}
                                              title={
                                                isKepEditable
                                                  ? `Klik untuk ubah status tahun ${year}`
                                                  : `${kep.nomorKep} - ${year}: ${status === 'none' ? 'Tidak ada' : status === 'planned' ? 'Direncanakan' : 'Terealisasi'}`
                                              }
                                            >
                                              <Box
                                                component="span"
                                                onClick={e => {
                                                  e.stopPropagation();
                                                  if (isKepEditable) {
                                                    toggleProgress(inisiatif.id, kep.id, year);
                                                  }
                                                }}
                                                sx={{
                                                  cursor: isKepEditable ? 'pointer' : 'default',
                                                  display: 'inline-flex',
                                                  p: 0.25,
                                                }}
                                              >
                                                {renderStatus(status, isKepEditable)}
                                              </Box>
                                            </Tooltip>
                                          );
                                        })}
                                      </Box>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))
                        ) : (
                          // Table view: collapsed with inner table
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

                        {/* Add Inisiatif button for monitoring view */}
                        {viewMode === 'monitoring' && (
                          <TableRow>
                            <TableCell
                              sx={{
                                py: 1,
                                pl: 6,
                                borderRight: '2px solid #e0e0e0',
                                position: 'sticky',
                                left: 0,
                                bgcolor: 'white',
                              }}
                            >
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
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.08)' },
                                }}
                              >
                                Tambah Inisiatif
                              </Button>
                            </TableCell>
                            {kepList.map(kep => (
                              <TableCell
                                key={`add-ini-${program.id}-${kep.id}`}
                                sx={{ borderRight: '1px solid #e0e0e0' }}
                              />
                            ))}
                          </TableRow>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add KEP Dialog */}
      <Dialog open={addKepDialogOpen} onClose={() => setAddKepDialogOpen(false)}>
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
            />
            <TextField
              fullWidth
              label="Tahun Pelaporan"
              type="number"
              value={newKepYear}
              onChange={e => setNewKepYear(parseInt(e.target.value) || currentYear)}
              inputProps={{ min: periodYears.start, max: periodYears.end + 5 }}
            />
            <Alert severity="info">
              KEP baru akan menggunakan data program dan inisiatif yang sama. Anda dapat mengubah progress per KEP setelahnya.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddKepDialogOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleAddKep} sx={{ bgcolor: '#DA251C' }}>
            Tambah
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
            if (viewMode === 'monitoring') {
              fetchProgressData(selectedRbsi.id, selectedTahun);
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

      {/* Edit Program/Inisiatif Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editLoading && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1d1d1f', pb: 1 }}>
          Edit {editDialogType === 'program' ? 'Program' : 'Inisiatif'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading} sx={{ color: '#86868b' }}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editLoading || !editNomor.trim() || !editNama.trim()}
            sx={{
              bgcolor: '#DA251C',
              '&:hover': { bgcolor: '#B91C14' },
            }}
          >
            {editLoading ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
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
