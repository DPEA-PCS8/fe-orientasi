import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  Popover,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  TuneRounded,
  KeyboardArrowDown as ArrowDownIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  PushPin as PushPinIcon,
  ListAltRounded,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { AddPksiModal, EditPksiModal, ViewPksiModal, FilePreviewModal } from '../components/modals';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';
import { deletePksiDocument, searchPksiDocuments, updatePksiStatus, type PksiDocumentData } from '../api/pksiApi';
import { getPksiFiles, downloadPksiFile, type PksiFileData } from '../api/pksiFileApi';
import { getAllTeams, type Team } from '../api/teamApi';
import { useSidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '../context/SidebarContext';

// Interface untuk data PKSI (transformed from API)
interface PksiData {
  id: string;
  namaPksi: string;
  namaAplikasi: string;
  picSatkerBA: string;
  jangkaWaktu: string;
  tanggalPengajuan: string;
  linkDocsT01: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui';
  // Timeline fields - support multiple phases per stage
  targetUsreq: string[];
  targetSit: string[];
  targetUat: string[];
  targetGoLive: string[];
}

// Group timelines by stage, sorting by phase
const groupTimelinesByStage = (timelines: { phase: number; target_date: string; stage: string }[]): {
  usreq: string[];
  sit: string[];
  uat: string[];
  goLive: string[];
} => {
  if (!timelines || timelines.length === 0) {
    return { usreq: [], sit: [], uat: [], goLive: [] };
  }

  const groups = {
    usreq: [] as string[],
    sit: [] as string[],
    uat: [] as string[],
    goLive: [] as string[],
  };

  // Group by stage
  const stageMap: { [key: string]: { phase: number; date: string }[] } = {
    USREQ: [],
    SIT: [],
    UAT: [],
    GO_LIVE: [],
  };

  timelines.forEach(t => {
    if (t.stage && t.target_date) {
      stageMap[t.stage].push({ phase: t.phase || 1, date: t.target_date });
    }
  });

  // Sort by phase and extract dates
  Object.keys(stageMap).forEach(stage => {
    const sorted = stageMap[stage].sort((a, b) => a.phase - b.phase);
    const dates = sorted.map(item => item.date);
    
    if (stage === 'USREQ') groups.usreq = dates;
    else if (stage === 'SIT') groups.sit = dates;
    else if (stage === 'UAT') groups.uat = dates;
    else if (stage === 'GO_LIVE') groups.goLive = dates;
  });

  return groups;
};

// Calculate jangka waktu based on timeline dates
const calculateJangkaWaktu = (apiData: PksiDocumentData): string => {
  // Get the earliest start date and latest end date from all tahap
  const startDates = [apiData.tahap1_awal, apiData.tahap5_awal, apiData.tahap7_awal]
    .filter(Boolean)
    .map(d => new Date(d!));
  
  const endDates = [apiData.tahap1_akhir, apiData.tahap5_akhir, apiData.tahap7_akhir]
    .filter(Boolean)
    .map(d => new Date(d!));

  if (startDates.length === 0 || endDates.length === 0) {
    return 'Single Year';
  }

  const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
  const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

  const startYear = earliestStart.getFullYear();
  const endYear = latestEnd.getFullYear();

  if (startYear === endYear) {
    return 'Single Year';
  } else {
    return `Multiyears ${startYear}-${endYear}`;
  }
};

// Transform API data to UI format
const transformApiData = (apiData: PksiDocumentData): PksiData => {
  const jangkaWaktu = calculateJangkaWaktu(apiData);
  
  // Map backend status to frontend status
  const mapStatus = (status: string): PksiData['status'] => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'disetujui' || statusLower === 'approved') return 'disetujui';
    if (statusLower === 'ditolak' || statusLower === 'rejected' || statusLower === 'tidak_disetujui') return 'tidak_disetujui';
    return 'pending';
  };

  // Parse timelines - prefer new flexible structure, fallback to legacy
  const timelineGroups = apiData.timelines && apiData.timelines.length > 0
    ? groupTimelinesByStage(apiData.timelines)
    : {
        usreq: apiData.target_usreq ? [apiData.target_usreq] : (apiData.tahap1_akhir ? [apiData.tahap1_akhir] : []),
        sit: apiData.target_sit ? [apiData.target_sit] : (apiData.tahap5_akhir ? [apiData.tahap5_akhir] : []),
        uat: apiData.target_uat ? [apiData.target_uat] : [],
        goLive: apiData.target_go_live ? [apiData.target_go_live] : (apiData.tahap7_akhir ? [apiData.tahap7_akhir] : []),
      };

  return {
    id: apiData.id,
    namaPksi: apiData.nama_pksi,
    namaAplikasi: apiData.nama_aplikasi || '-',
    picSatkerBA: apiData.pic_satker_names || apiData.pic_satker_ba || '-',
    jangkaWaktu: jangkaWaktu,
    tanggalPengajuan: apiData.tanggal_pengajuan || apiData.created_at || '',
    linkDocsT01: '', // Will be populated when document upload is implemented
    status: mapStatus(apiData.status),
    // Timeline - use grouped timelines
    targetUsreq: timelineGroups.usreq,
    targetSit: timelineGroups.sit,
    targetUat: timelineGroups.uat,
    targetGoLive: timelineGroups.goLive,
  };
};

type Order = 'asc' | 'desc';

// Status label mapping
const STATUS_LABELS: Record<PksiData['status'], string> = {
  pending: 'Pending',
  disetujui: 'Disetujui',
  tidak_disetujui: 'Tidak Disetujui',
};

const getStatusColor = (status: PksiData['status']) => {
  switch (status) {
    case 'disetujui':
      return '#31A24C';
    case 'tidak_disetujui':
      return '#FF3B30';
    case 'pending':
      return '#FF9500';
    default:
      return '#86868b';
  }
};

// Color palette for SKPA chips
const SKPA_COLORS = [
  { bg: '#DA251C', text: '#FFFFFF' }, // Red
  { bg: '#2563EB', text: '#FFFFFF' }, // Blue
  { bg: '#059669', text: '#FFFFFF' }, // Green
  { bg: '#7C3AED', text: '#FFFFFF' }, // Purple
  { bg: '#D97706', text: '#FFFFFF' }, // Amber
  { bg: '#0891B2', text: '#FFFFFF' }, // Cyan
  { bg: '#DB2777', text: '#FFFFFF' }, // Pink
  { bg: '#4F46E5', text: '#FFFFFF' }, // Indigo
  { bg: '#65A30D', text: '#FFFFFF' }, // Lime
  { bg: '#DC2626', text: '#FFFFFF' }, // Red-600
];

// Generate consistent color based on SKPA code
const getSkpaColor = (skpaCode: string): { bg: string; text: string } => {
  if (!skpaCode) return SKPA_COLORS[0];
  
  // Generate hash from skpaCode for consistent color assignment
  let hash = 0;
  for (let i = 0; i < skpaCode.length; i++) {
    hash = skpaCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SKPA_COLORS.length;
  return SKPA_COLORS[index];
};

function PksiList() {
  const { isCollapsed } = useSidebar();
  const [keyword, setKeyword] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPksiForEdit, setSelectedPksiForEdit] = useState<PksiData | null>(null);
  const [selectedPksiIdForView, setSelectedPksiIdForView] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof PksiData>('namaPksi');
  const [order, setOrder] = useState<Order>('asc');
  const [pksiData, setPksiData] = useState<PksiData[]>([]);
  const [rawPksiData, setRawPksiData] = useState<PksiDocumentData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPksiId, setSelectedPksiId] = useState<string | null>(null);

  // File preview state
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileDialogPksiName, setFileDialogPksiName] = useState<string>('');
  const [fileDialogFiles, setFileDialogFiles] = useState<PksiFileData[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PksiFileData | null>(null);

  // Permission check for PKSI menu
  const { getMenuPermissions } = usePermissions();
  const pksiPermissions = getMenuPermissions('PKSI_ALL');

  // Get user info for department-based filtering
  const userInfoStorage = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
  const userInfo = useMemo(() => userInfoStorage ? JSON.parse(userInfoStorage) : null, [userInfoStorage]);
  const userDepartment = useMemo(() => userInfo?.department || '', [userInfo]);
  const userRoles: string[] = useMemo(() => userInfo?.roles || [], [userInfo]);
  const isAdminOrPengembang = useMemo(() => userRoles.some((role: string) => 
    role.toLowerCase() === 'admin' || role.toLowerCase() === 'pengembang'
  ), [userRoles]);

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJangkaWaktu, setSelectedJangkaWaktu] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedAplikasi, setSelectedAplikasi] = useState<string>('');
  const [selectedSkpa, setSelectedSkpa] = useState<Set<string>>(new Set());
  
  // Year filter (exposed in toolbar) - default to current year
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>(new Date().getFullYear().toString());

  // Sticky columns configuration
  const [stickyColumnsAnchorEl, setStickyColumnsAnchorEl] = useState<null | HTMLElement>(null);
  const [stickyColumns, setStickyColumns] = useState<Set<string>>(new Set(['no', 'namaAplikasi', 'namaPksi']));
  
  // Column definitions for sticky configuration
  const COLUMN_OPTIONS = [
    { id: 'no', label: 'No', width: 50 },
    { id: 'namaAplikasi', label: 'Nama Aplikasi', width: 150 },
    { id: 'namaPksi', label: 'Nama PKSI', width: 200 },
    { id: 'skpa', label: 'SKPA', width: 150 },
    { id: 'jangkaWaktu', label: 'Jangka Waktu', width: 120 },
  ];

  // Calculate sticky left positions based on selected columns
  const getStickyLeft = useCallback((columnId: string): number | undefined => {
    if (!stickyColumns.has(columnId)) return undefined;
    
    const orderedSticky = COLUMN_OPTIONS.filter(col => stickyColumns.has(col.id));
    const colIndex = orderedSticky.findIndex(col => col.id === columnId);
    if (colIndex === -1) return undefined;
    
    let left = 0;
    for (let i = 0; i < colIndex; i++) {
      left += orderedSticky[i].width;
    }
    return left;
  }, [stickyColumns]);

  const isLastStickyColumn = useCallback((columnId: string): boolean => {
    if (!stickyColumns.has(columnId)) return false;
    const orderedSticky = COLUMN_OPTIONS.filter(col => stickyColumns.has(col.id));
    return orderedSticky[orderedSticky.length - 1]?.id === columnId;
  }, [stickyColumns]);

  const handleStickyColumnToggle = (columnId: string) => {
    setStickyColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  // Teams for approval dropdown
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Approval form state
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [pendingApprovalPksiId, setPendingApprovalPksiId] = useState<string | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    teamId: '', // ID of selected team
    iku: 'ya',
    inhouseOutsource: 'inhouse',
  });
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Map sortBy from UI field to API field
  const mapSortField = (field: keyof PksiData): string => {
    const fieldMap: Record<string, string> = {
      namaPksi: 'namaPksi',
      tanggalPengajuan: 'tanggalPengajuan',
      status: 'status',
    };
    return fieldMap[field] || 'namaPksi';
  };

  // Fetch PKSI data from API
  const fetchPksiData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Map status filter to API format
      const statusMapping: Record<string, string> = {
        pending: 'PENDING',
        disetujui: 'DISETUJUI',
        tidak_disetujui: 'DITOLAK',
      };
      const statusFilter = selectedStatus.size === 1 
        ? statusMapping[Array.from(selectedStatus)[0]] 
        : undefined;

      // Parse year filter for backend API
      const yearFilter = selectedYearFilter ? parseInt(selectedYearFilter, 10) : undefined;

      const response = await searchPksiDocuments({
        search: keyword || undefined,
        status: statusFilter,
        year: yearFilter,
        page: page,
        size: rowsPerPage,
        sortBy: mapSortField(orderBy),
        sortDir: order,
      });

      // DEBUG: Log response and user department
      console.log('=== DEBUG PKSI LIST ===');
      console.log('User Department:', userDepartment);
      console.log('User Roles:', userRoles);
      console.log('Is Admin/Pengembang:', isAdminOrPengembang);
      console.log('Year Filter:', yearFilter);
      console.log('PKSI Response:', response);
      console.log('Total Elements:', response.total_elements);
      console.log('========================');

      // Store raw data for year filtering
      setRawPksiData(response.content);
      
      let transformedData = response.content.map(transformApiData);
      
      // Filter by user department if not Admin/Pengembang
      if (!isAdminOrPengembang && userDepartment) {
        console.log('Filtering by department:', userDepartment);
        transformedData = transformedData.filter(pksi => {
          const skpaCodes = pksi.picSatkerBA.split(',').map(s => s.trim().toUpperCase());
          const matches = skpaCodes.includes(userDepartment.toUpperCase());
          console.log(`PKSI "${pksi.namaPksi}" - SKPA: [${skpaCodes.join(', ')}] - Matches ${userDepartment}: ${matches}`);
          return matches;
        });
        console.log('Filtered count:', transformedData.length);
      }
      
      setPksiData(transformedData);
      setTotalElements(isAdminOrPengembang ? response.total_elements : transformedData.length);
    } catch (error) {
      console.error('Failed to fetch PKSI data:', error);
      setPksiData([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, rowsPerPage, orderBy, order, selectedStatus, selectedYearFilter, userDepartment, userRoles, isAdminOrPengembang]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchPksiData();
  }, [fetchPksiData]);

  // Fetch teams for approval dropdown
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      try {
        const teamsData = await getAllTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        setTeams([]);
      } finally {
        setIsLoadingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  // Helper function to parse SKPA codes from pic_satker_names (comma-separated string from backend)
  const resolveSkpaCodes = useCallback((picSatkerNames: string): string[] => {
    if (!picSatkerNames || picSatkerNames === '-') return [];
    
    // Backend now sends comma-separated kode_skpa values directly (e.g., "DIMB, DLIK")
    return picSatkerNames.split(',').map(s => s.trim()).filter(Boolean);
  }, []);

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, pksiId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPksiId(pksiId);
  };

  const handleStatusMenuClose = () => {
    setAnchorEl(null);
    setSelectedPksiId(null);
  };

  // Map frontend status to backend status
  const mapFrontendToBackendStatus = (frontendStatus: PksiData['status']): 'PENDING' | 'DISETUJUI' | 'DITOLAK' => {
    switch (frontendStatus) {
      case 'disetujui':
        return 'DISETUJUI';
      case 'tidak_disetujui':
        return 'DITOLAK';
      default:
        return 'PENDING';
    }
  };

  const handleStatusChange = async (newStatus: PksiData['status']) => {
    if (!selectedPksiId) {
      handleStatusMenuClose();
      return;
    }

    // If approving, show approval form instead
    if (newStatus === 'disetujui') {
      setPendingApprovalPksiId(selectedPksiId);
      setApprovalForm({
        teamId: '',
        iku: 'ya',
        inhouseOutsource: 'inhouse',
      });
      setOpenApprovalDialog(true);
      handleStatusMenuClose();
      return;
    }

    // For other statuses, update directly
    try {
      const backendStatus = mapFrontendToBackendStatus(newStatus);
      await updatePksiStatus(selectedPksiId, backendStatus);
      
      // Update local state after successful API call
      setPksiData(prev => 
        prev.map(item => 
          item.id === selectedPksiId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
    handleStatusMenuClose();
  };

  const handleApprovalSubmit = async () => {
    if (!pendingApprovalPksiId || !approvalForm.teamId) {
      alert('Mohon pilih tim yang akan ditugaskan');
      return;
    }

    const selectedTeam = teams.find(t => t.id === approvalForm.teamId);
    if (!selectedTeam) {
      alert('Tim tidak ditemukan');
      return;
    }

    // Extract PIC and members from selected team
    const picUuid = selectedTeam.pic?.uuid || '';
    const picName = selectedTeam.pic?.fullName || '';
    const memberUuids = selectedTeam.members.map(m => m.uuid);
    const memberNames = selectedTeam.members.map(m => m.fullName);

    setIsSubmittingApproval(true);
    try {
      // Update status to DISETUJUI with team data
      await updatePksiStatus(pendingApprovalPksiId, 'DISETUJUI', {
        iku: approvalForm.iku,
        inhouse_outsource: approvalForm.inhouseOutsource,
        pic_approval: picUuid,
        pic_approval_name: picName,
        anggota_tim: memberUuids.join(', '),
        anggota_tim_names: memberNames.join(', '),
      });
      
      // Update local state after successful API call
      setPksiData(prev => 
        prev.map(item => 
          item.id === pendingApprovalPksiId ? { ...item, status: 'disetujui' } : item
        )
      );

      setOpenApprovalDialog(false);
      setPendingApprovalPksiId(null);
    } catch (error) {
      console.error('Error approving PKSI:', error);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleApprovalCancel = () => {
    setOpenApprovalDialog(false);
    setPendingApprovalPksiId(null);
    setApprovalForm({
      teamId: '',
      iku: 'ya',
      inhouseOutsource: 'inhouse',
    });
  };

  const handleEditClick = (pksi: PksiData) => {
    setSelectedPksiForEdit(pksi);
    setOpenEditModal(true);
  };

  const handleViewClick = (pksiId: string) => {
    setSelectedPksiIdForView(pksiId);
    setOpenViewModal(true);
  };

  // File dialog functions
  const handleOpenFileDialog = async (pksiId: string, pksiName: string) => {
    setFileDialogPksiName(pksiName);
    setFileDialogOpen(true);
    setIsLoadingFiles(true);
    
    try {
      const files = await getPksiFiles(pksiId);
      setFileDialogFiles(files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      setFileDialogFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleCloseFileDialog = () => {
    setFileDialogOpen(false);
    setFileDialogPksiName('');
    setFileDialogFiles([]);
  };

  const handleFileDownload = async (file: PksiFileData) => {
    setDownloadingFileId(file.id);
    try {
      await downloadPksiFile(file.id, file.original_name);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleFilePreview = (file: PksiFileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  const handlePreviewDownload = async () => {
    if (previewFile) {
      await handleFileDownload(previewFile);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isPreviewable = (contentType: string | undefined): boolean => {
    if (!contentType) return false;
    return contentType.startsWith('image/') || contentType === 'application/pdf';
  };

  const handleEditSuccess = () => {
    // Refresh data after successful edit
    fetchPksiData();
  };

  // Delete functionality
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [pksiToDelete, setPksiToDelete] = useState<PksiData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (pksi: PksiData) => {
    setPksiToDelete(pksi);
    setOpenDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setPksiToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!pksiToDelete) return;
    
    setIsDeleting(true);
    try {
      // Call API to delete PKSI
      await deletePksiDocument(pksiToDelete.id);
      
      // Remove from local state
      setPksiData(prev => prev.filter(item => item.id !== pksiToDelete.id));
      setOpenDeleteDialog(false);
      setPksiToDelete(null);
    } catch (error) {
      console.error('Failed to delete PKSI:', error);
      alert('Gagal menghapus PKSI. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleJangkaWaktuChange = (jangkaWaktu: string) => {
    const newSet = new Set(selectedJangkaWaktu);
    if (newSet.has(jangkaWaktu)) {
      newSet.delete(jangkaWaktu);
    } else {
      newSet.add(jangkaWaktu);
    }
    setSelectedJangkaWaktu(newSet);
  };

  const handleStatusFilterChange = (status: string) => {
    const newSet = new Set(selectedStatus);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedStatus(newSet);
  };

  const handleResetFilter = () => {
    setSelectedJangkaWaktu(new Set());
    setSelectedStatus(new Set());
    setSelectedYear('');
    setSelectedAplikasi('');
    setSelectedSkpa(new Set());
    setSelectedYearFilter(new Date().getFullYear().toString());
  };

  // Generate year options from timeline data (tahap1_awal to tahap7_akhir)
  const timelineYearOptions = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    // Add current year and surrounding years as defaults
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      years.add(y.toString());
    }
    // Extract years from raw PKSI timeline data
    rawPksiData.forEach(item => {
      const timelineFields = [
        item.tahap1_awal, item.tahap1_akhir,
        item.tahap5_awal, item.tahap5_akhir,
        item.tahap7_awal, item.tahap7_akhir
      ];
      timelineFields.forEach(dateStr => {
        if (dateStr) {
          const year = new Date(dateStr).getFullYear();
          if (!isNaN(year)) years.add(year.toString());
        }
      });
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [rawPksiData]);

  // Generate year options from data (legacy - for filter popover)
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    pksiData.forEach(item => {
      if (item.tanggalPengajuan) {
        const year = new Date(item.tanggalPengajuan).getFullYear().toString();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [pksiData]);

  // Generate aplikasi options from data
  const aplikasiOptions = useMemo(() => {
    const aplikasiSet = new Set<string>();
    pksiData.forEach(item => {
      if (item.namaAplikasi && item.namaAplikasi !== '-') {
        aplikasiSet.add(item.namaAplikasi);
      }
    });
    return Array.from(aplikasiSet).sort();
  }, [pksiData]);

  // Generate SKPA options from pksiData (pic_satker_names is now comma-separated codes)
  const skpaOptions = useMemo(() => {
    const skpaSet = new Set<string>();
    pksiData.forEach(item => {
      const codes = resolveSkpaCodes(item.picSatkerBA);
      codes.forEach(code => skpaSet.add(code));
    });
    return Array.from(skpaSet).sort();
  }, [pksiData, resolveSkpaCodes]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedJangkaWaktu.size > 0) count++;
    if (selectedStatus.size > 0) count++;
    if (selectedYear) count++;
    if (selectedAplikasi) count++;
    if (selectedSkpa.size > 0) count++;
    return count;
  }, [selectedJangkaWaktu, selectedStatus, selectedYear, selectedAplikasi, selectedSkpa]);

  // Filter locally for jangkaWaktu, year (tanggalPengajuan), aplikasi, skpa
  // Note: Timeline year filter (selectedYearFilter) is now handled by backend
  const filteredPksi = useMemo(() => {
    let result = pksiData;
    
    // selectedYearFilter is now sent to backend, no need to filter client-side
    
    if (selectedJangkaWaktu.size > 0) {
      result = result.filter(item => {
        if (selectedJangkaWaktu.has('Single Year') && item.jangkaWaktu === 'Single Year') return true;
        if (selectedJangkaWaktu.has('Multiyears') && item.jangkaWaktu.startsWith('Multiyears')) return true;
        return false;
      });
    }
    
    if (selectedYear) {
      result = result.filter(item => {
        if (!item.tanggalPengajuan) return false;
        const year = new Date(item.tanggalPengajuan).getFullYear().toString();
        return year === selectedYear;
      });
    }

    if (selectedAplikasi) {
      result = result.filter(item => item.namaAplikasi === selectedAplikasi);
    }

    if (selectedSkpa.size > 0) {
      result = result.filter(item => {
        const itemSkpaCodes = resolveSkpaCodes(item.picSatkerBA);
        return itemSkpaCodes.some(code => selectedSkpa.has(code));
      });
    }
    
    return result;
  }, [pksiData, selectedJangkaWaktu, selectedYear, selectedAplikasi, selectedSkpa, resolveSkpaCodes]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Use filtered data directly (pagination handled by API)
  const paginatedPksi = filteredPksi;

  return (
    <Box sx={{ 
      p: 3.5,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <ListAltRounded sx={{ fontSize: 32, color: '#DA251C' }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Semua PKSI
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Kelola data pengajuan PKSI
        </Typography>
      </Box>

      {/* Main Card */}
      <Paper
        elevation={0}
        sx={{
          width: isCollapsed 
            ? `calc(80vw + ${DRAWER_WIDTH - DRAWER_WIDTH_COLLAPSED}px)` 
            : '80vw',
          maxWidth: isCollapsed 
            ? `calc(80vw + ${DRAWER_WIDTH - DRAWER_WIDTH_COLLAPSED}px)` 
            : '80vw',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
          }}
        >
          {/* Search & Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Cari nama PKSI..."
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ 
                width: 280,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f5f5f7',
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'transparent',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#DA251C',
                    borderWidth: 2,
                  },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#86868b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            
            {/* Year Filter Dropdown - Enhanced UI */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: selectedYearFilter ? 'rgba(218, 37, 28, 0.08)' : '#f5f5f7',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                border: selectedYearFilter ? '1.5px solid rgba(218, 37, 28, 0.3)' : '1.5px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: selectedYearFilter ? 'rgba(218, 37, 28, 0.12)' : '#eeeeef',
                },
              }}
            >
              <CalendarIcon sx={{ fontSize: 18, color: selectedYearFilter ? '#DA251C' : '#86868b' }} />
              <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                <Select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  displayEmpty
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: selectedYearFilter ? '#DA251C' : '#1d1d1f',
                    '& .MuiSelect-select': {
                      py: 0.5,
                      pr: 3,
                    },
                    '& .MuiSvgIcon-root': {
                      color: selectedYearFilter ? '#DA251C' : '#86868b',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                    <em>Semua Tahun</em>
                  </MenuItem>
                  {timelineYearOptions.map((year) => (
                    <MenuItem 
                      key={year} 
                      value={year}
                      sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: year === new Date().getFullYear().toString() ? 600 : 400,
                        color: year === new Date().getFullYear().toString() ? '#DA251C' : 'inherit',
                      }}
                    >
                      {year}
                      {year === new Date().getFullYear().toString() && (
                        <Chip 
                          label="Now" 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            height: 18, 
                            fontSize: '0.65rem',
                            bgcolor: '#DA251C',
                            color: 'white',
                          }} 
                        />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Button
              variant="text"
              startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
              onClick={handleFilterOpen}
              sx={{
                color: activeFilterCount > 0 ? '#DA251C' : '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Filters
              {activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{ ml: 1, bgcolor: '#DA251C', color: 'white', height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Button>
            
            {/* Sticky Columns Settings Button */}
            <Tooltip title="Atur Kolom Sticky">
              <Button
                variant="text"
                startIcon={<PushPinIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setStickyColumnsAnchorEl(e.currentTarget)}
                sx={{
                  color: stickyColumns.size > 0 ? '#2563EB' : '#86868b',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Pin
                {stickyColumns.size > 0 && (
                  <Chip
                    label={stickyColumns.size}
                    size="small"
                    sx={{ ml: 1, bgcolor: '#2563EB', color: 'white', height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Button>
            </Tooltip>
          </Box>
          {pksiPermissions.canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddModal(true)}
              sx={{
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                fontWeight: 500,
                px: 2.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
                },
              }}
            >
              Tambah PKSI
            </Button>
          )}
        </Box>

        {/* Sticky Columns Popover */}
        <Popover
          open={Boolean(stickyColumnsAnchorEl)}
          anchorEl={stickyColumnsAnchorEl}
          onClose={() => setStickyColumnsAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              p: 2,
              minWidth: 280,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              Kolom Sticky
            </Typography>
            <IconButton size="small" onClick={() => setStickyColumnsAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mb: 2 }}>
            Pilih kolom yang akan tetap terlihat saat scroll horizontal
          </Typography>
          <FormGroup>
            {COLUMN_OPTIONS.map((col) => (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    checked={stickyColumns.has(col.id)}
                    onChange={() => handleStickyColumnToggle(col.id)}
                    size="small"
                    sx={{
                      '&.Mui-checked': { color: '#2563EB' },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{col.label}</Typography>
                    {stickyColumns.has(col.id) && (
                      <PushPinIcon sx={{ fontSize: 14, color: '#2563EB' }} />
                    )}
                  </Box>
                }
                sx={{ mb: 0.5 }}
              />
            ))}
          </FormGroup>
          <Button
            fullWidth
            variant="text"
            size="small"
            onClick={() => setStickyColumns(new Set())}
            sx={{ mt: 1, color: '#86868b' }}
          >
            Reset Semua
          </Button>
        </Popover>

        {/* Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(218, 37, 28, 0.1)',
              overflow: 'hidden',
              border: '1px solid #ffebeb',
            },
          }}
        >
          {/* Header */}
          <Box sx={{
            background: '#DA251C',
            p: 2.5,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TuneRounded sx={{ fontSize: 16, color: '#DA251C' }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                Filter
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleFilterClose}
              sx={{ 
                color: 'white', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          
          <Box sx={{ p: 3, minWidth: 320, maxHeight: 450, overflowY: 'auto', bgcolor: 'white' }}>

            {/* Nama Aplikasi Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                Nama Aplikasi
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="aplikasi-filter-label">Pilih Aplikasi</InputLabel>
                <Select
                  labelId="aplikasi-filter-label"
                  value={selectedAplikasi}
                  label="Pilih Aplikasi"
                  onChange={(e) => setSelectedAplikasi(e.target.value)}
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e5e7',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#DA251C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#DA251C',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Semua Aplikasi</em>
                  </MenuItem>
                  {aplikasiOptions.map((aplikasi) => (
                    <MenuItem key={aplikasi} value={aplikasi}>
                      {aplikasi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* SKPA Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                SKPA
              </Typography>
              <Autocomplete
                multiple
                size="small"
                options={skpaOptions}
                value={Array.from(selectedSkpa)}
                onChange={(_, newValue) => setSelectedSkpa(new Set(newValue))}
                disableCloseOnSelect
                renderOption={(props, option, { selected }) => {
                  const { key, ...restProps } = props;
                  return (
                    <li key={key} {...restProps}>
                      <Checkbox
                        size="small"
                        checked={selected}
                        sx={{ mr: 1, '&.Mui-checked': { color: '#DA251C' } }}
                      />
                      {option}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={selectedSkpa.size === 0 ? 'Pilih SKPA' : ''}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#e5e5e7' },
                        '&:hover fieldset': { borderColor: '#DA251C' },
                        '&.Mui-focused fieldset': { borderColor: '#DA251C' },
                      },
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option}
                        size="small"
                        {...tagProps}
                        sx={{ bgcolor: '#DA251C', color: 'white', '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } } }}
                      />
                    );
                  })
                }
              />
            </Box>

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* Year Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                Periode Tahun
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="year-filter-label">Pilih Tahun</InputLabel>
                <Select
                  labelId="year-filter-label"
                  value={selectedYear}
                  label="Pilih Tahun"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e5e7',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#DA251C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#DA251C',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Semua Tahun</em>
                  </MenuItem>
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* Jangka Waktu Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                Jangka Waktu
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedJangkaWaktu.has('Single Year')}
                      onChange={() => handleJangkaWaktuChange('Single Year')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Single Year</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedJangkaWaktu.has('Multiyears')}
                      onChange={() => handleJangkaWaktuChange('Multiyears')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Multiyears</Typography>}
                />
              </FormGroup>
            </Box>

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* Status Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                Status
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatus.has('disetujui')}
                      onChange={() => handleStatusFilterChange('disetujui')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Disetujui</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatus.has('tidak_disetujui')}
                      onChange={() => handleStatusFilterChange('tidak_disetujui')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Tidak Disetujui</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatus.has('pending')}
                      onChange={() => handleStatusFilterChange('pending')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Pending</Typography>}
                />
              </FormGroup>
            </Box>

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* Reset Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilter}
              sx={{
                py: 1,
                borderRadius: '8px',
                color: '#DA251C',
                borderColor: '#DA251C',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#fff5f5',
                  borderColor: '#DA251C',
                },
              }}
            >
              Reset Filter
            </Button>
          </Box>
        </Popover>

        {/* Add PKSI Modal */}
        <AddPksiModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSuccess={() => {
            fetchPksiData();
          }}
        />

        {/* Edit PKSI Modal */}
        <EditPksiModal
          open={openEditModal}
          onClose={() => {
            setOpenEditModal(false);
            setSelectedPksiForEdit(null);
          }}
          onSuccess={handleEditSuccess}
          pksiData={selectedPksiForEdit}
        />

        {/* View PKSI Modal */}
        <ViewPksiModal
          open={openViewModal}
          onClose={() => {
            setOpenViewModal(false);
            setSelectedPksiIdForView(null);
          }}
          pksiId={selectedPksiIdForView}
        />

        {/* File List Dialog */}
        <Dialog
          open={fileDialogOpen}
          onClose={handleCloseFileDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            pb: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(218, 37, 28, 0.25)',
                }}
              >
                <AttachFileIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '1rem' }}>
                  Dokumen T.01
                </Typography>
                <Typography sx={{ color: '#86868b', fontSize: '0.75rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileDialogPksiName}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseFileDialog} size="small" sx={{ color: '#86868b' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            {isLoadingFiles ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={32} sx={{ color: '#DA251C' }} />
              </Box>
            ) : fileDialogFiles.length > 0 ? (
              <List dense sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px', p: 1 }}>
                {fileDialogFiles.map((file, index) => (
                  <ListItem
                    key={file.id}
                    sx={{
                      borderRadius: '8px',
                      mb: index < fileDialogFiles.length - 1 ? 1 : 0,
                      bgcolor: 'white',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <FileIcon sx={{ color: '#DA251C', fontSize: 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{file.display_name || file.original_name || file.file_name || 'File'}</span>
                          {file.version && file.version > 1 && (
                            <Chip
                              label={`V${file.version}`}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: '#DA251C',
                                color: 'white',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={formatFileSize(file.file_size)}
                      primaryTypographyProps={{
                        sx: { fontWeight: 500, color: '#1d1d1f', fontSize: '0.9rem' },
                      }}
                      secondaryTypographyProps={{
                        sx: { color: '#86868b', fontSize: '0.75rem' },
                      }}
                    />
                    <ListItemSecondaryAction>
                      {isPreviewable(file.content_type) && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleFilePreview(file)}
                          sx={{
                            color: '#0891B2',
                            mr: 1,
                            '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' },
                          }}
                          title="Preview"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleFileDownload(file)}
                        disabled={downloadingFileId === file.id}
                        sx={{
                          color: '#059669',
                          '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' },
                        }}
                        title="Download"
                      >
                        {downloadingFileId === file.id ? (
                          <CircularProgress size={18} sx={{ color: '#059669' }} />
                        ) : (
                          <DownloadIcon fontSize="small" />
                        )}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: '12px',
                  bgcolor: 'rgba(245, 245, 247, 0.8)',
                }}
              >
                <AttachFileIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
                <Typography sx={{ color: '#86868b' }}>
                  Belum ada dokumen yang diupload
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* File Preview Modal */}
        <FilePreviewModal
          open={previewOpen}
          onClose={handlePreviewClose}
          fileId={previewFile?.id || null}
          fileName={previewFile?.original_name || ''}
          contentType={previewFile?.content_type || ''}
          onDownload={handlePreviewDownload}
        />

        {/* Data Count Display */}
        <DataCountDisplay
            count={pksiData.length}
            isLoading={isLoading}
            label="Total"
            unit="PKSI Documents"
        />

        {/* Table */}
        <TableContainer sx={{ 
          width: '100%', 
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.08)',
            borderRadius: 4,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.12)',
            },
          },
        }}>
          <Table sx={{ minWidth: 1800 }}>
            <TableHead>
              {/* First row - Grouped headers */}
              <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', textAlign: 'center', fontSize: '0.8rem', width: 50, minWidth: 50, ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('no') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                  No
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 150, ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                  Nama Aplikasi
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 200, ...(stickyColumns.has('namaPksi') && { position: 'sticky', left: getStickyLeft('namaPksi'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('namaPksi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                  Nama PKSI
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 150, ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                  SKPA
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('jangkaWaktu') && { position: 'sticky', left: getStickyLeft('jangkaWaktu'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('jangkaWaktu') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                  Jangka Waktu
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 150 }}>
                  Tanggal Pengajuan
                </TableCell>
                {/* Timeline - grouped */}
                <TableCell colSpan={4} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem' }}>
                  Timeline
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 90 }}>
                  Docs T.01
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 130 }}>
                  Status
                </TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100 }}>
                  Aksi
                </TableCell>
              </TableRow>
              {/* Second row - Timeline sub-headers */}
              <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 110 }}>
                  Target Usreq
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100 }}>
                  Target SIT
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>
                  Target UAT
                </TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 110 }}>
                  Target Go Live
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#DA251C' }} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#86868b' }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      Tidak ada data PKSI ditemukan
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.map((item, index) => (
                <TableRow 
                  key={item.id}
                  sx={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'rgba(218, 37, 28, 0.02)',
                    },
                    '&:not(:last-child)': {
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                    },
                  }}
                >
                  {/* No */}
                  <TableCell 
                    sx={{ 
                      color: '#86868b', 
                      py: 1.5,
                      px: 2,
                      textAlign: 'center',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      minWidth: 50,
                      ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 1, bgcolor: '#fff' }),
                      ...(isLastStickyColumn('no') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                    }}
                  >
                    {page * rowsPerPage + index + 1}
                  </TableCell>
                  {/* Nama Aplikasi */}
                  <TableCell sx={{ 
                    py: 1.5,
                    px: 2,
                    whiteSpace: 'normal', 
                    wordWrap: 'break-word',
                    minWidth: 150,
                    ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 1, bgcolor: '#fff' }),
                    ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.8rem',
                      }}
                    >
                      {item.namaAplikasi}
                    </Typography>
                  </TableCell>
                  {/* Nama PKSI */}
                  <TableCell sx={{ 
                    py: 1.5,
                    px: 2,
                    whiteSpace: 'normal', 
                    wordWrap: 'break-word',
                    minWidth: 200,
                    ...(stickyColumns.has('namaPksi') && { position: 'sticky', left: getStickyLeft('namaPksi'), zIndex: 1, bgcolor: '#fff' }),
                    ...(isLastStickyColumn('namaPksi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: '#1d1d1f',
                        fontSize: '0.8rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.namaPksi}
                    </Typography>
                  </TableCell>
                  {/* SKPA */}
                  <TableCell sx={{ 
                    py: 1.5,
                    px: 1,
                    minWidth: 150,
                    ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 1, bgcolor: '#fff' }),
                    ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                  }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                      {resolveSkpaCodes(item.picSatkerBA).length > 0 ? (
                        resolveSkpaCodes(item.picSatkerBA).map((code, idx) => {
                          const chipColor = getSkpaColor(code);
                          return (
                            <Chip
                              key={idx}
                              label={code}
                              size="small"
                              sx={{
                                bgcolor: chipColor.bg,
                                color: chipColor.text,
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                height: 20,
                                borderRadius: '4px',
                                '& .MuiChip-label': { px: 0.8 },
                              }}
                            />
                          );
                        })
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  {/* Jangka Waktu */}
                  <TableCell sx={{ 
                    py: 1.5,
                    px: 1.5,
                    minWidth: 120,
                    ...(stickyColumns.has('jangkaWaktu') && { position: 'sticky', left: getStickyLeft('jangkaWaktu'), zIndex: 1, bgcolor: '#fff' }),
                    ...(isLastStickyColumn('jangkaWaktu') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                  }}>
                    <Chip
                      label={item.jangkaWaktu === 'Single Year' ? 'Single Year' : 'Multiyears'}
                      size="small"
                      sx={{
                        background: item.jangkaWaktu === 'Single Year' 
                          ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
                        color: item.jangkaWaktu === 'Single Year' ? '#7C3AED' : '#1D4ED8',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24,
                        borderRadius: '6px',
                      }}
                    />
                  </TableCell>
                  {/* Tanggal Pengajuan */}
                  <TableCell sx={{ py: 1.5, px: 1.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.8rem',
                      }}
                    >
                      {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </TableCell>
                  {/* Timeline - Target USREQ */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    {item.targetUsreq && item.targetUsreq.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {item.targetUsreq.map((date, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                            {item.targetUsreq.length > 1 && <span style={{ fontWeight: 600 }}>F{idx + 1}: </span>}
                            {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                    )}
                  </TableCell>
                  {/* Timeline - Target SIT */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    {item.targetSit && item.targetSit.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {item.targetSit.map((date, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                            {item.targetSit.length > 1 && <span style={{ fontWeight: 600 }}>F{idx + 1}: </span>}
                            {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                    )}
                  </TableCell>
                  {/* Timeline - Target UAT */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    {item.targetUat && item.targetUat.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {item.targetUat.map((date, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                            {item.targetUat.length > 1 && <span style={{ fontWeight: 600 }}>F{idx + 1}: </span>}
                            {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                    )}
                  </TableCell>
                  {/* Timeline - Target Go Live */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    {item.targetGoLive && item.targetGoLive.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {item.targetGoLive.map((date, idx) => (
                          <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                            {item.targetGoLive.length > 1 && <span style={{ fontWeight: 600 }}>F{idx + 1}: </span>}
                            {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                    )}
                  </TableCell>
                  {/* Docs T.01 */}
                  <TableCell sx={{ py: 1.5, px: 1.5 }}>
                    <Tooltip title="Lihat dokumen T.01">
                      <IconButton
                        onClick={() => handleOpenFileDialog(item.id, item.namaPksi)}
                        size="small"
                        sx={{
                          color: '#DA251C',
                          bgcolor: 'rgba(218, 37, 28, 0.08)',
                          '&:hover': {
                            bgcolor: 'rgba(218, 37, 28, 0.15)',
                          },
                        }}
                      >
                        <AttachFileIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  {/* Status */}
                  <TableCell sx={{ py: 1.5, px: 1.5 }}>
                    <Box
                      onClick={(e) => handleStatusMenuOpen(e, item.id)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: '8px',
                        bgcolor: `${getStatusColor(item.status)}15`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: `1px solid ${getStatusColor(item.status)}30`,
                        '&:hover': {
                          bgcolor: `${getStatusColor(item.status)}25`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 2px 8px ${getStatusColor(item.status)}20`,
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: getStatusColor(item.status),
                        }}
                      >
                        {STATUS_LABELS[item.status]}
                      </Typography>
                      <ArrowDownIcon sx={{ fontSize: 12, color: getStatusColor(item.status) }} />
                    </Box>
                  </TableCell>
                  {/* Aksi */}
                  <TableCell sx={{ py: 1.5, px: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Lihat Detail PKSI">
                        <IconButton
                          size="small"
                          onClick={() => handleViewClick(item.id)}
                          sx={{
                            color: '#059669',
                            bgcolor: 'rgba(5, 150, 105, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(5, 150, 105, 0.15)',
                            },
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit PKSI">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(item)}
                          sx={{
                            color: '#2563EB',
                            bgcolor: 'rgba(37, 99, 235, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(37, 99, 235, 0.15)',
                            },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus PKSI">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(item)}
                          sx={{
                            color: '#DC2626',
                            bgcolor: 'rgba(220, 38, 38, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(220, 38, 38, 0.15)',
                            },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Status Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleStatusMenuClose}
        >
          <MenuItem onClick={() => handleStatusChange('disetujui')}>
            <Chip
              label="Disetujui"
              size="small"
              sx={{
                bgcolor: '#31A24C',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('tidak_disetujui')}>
            <Chip
              label="Tidak Disetujui"
              size="small"
              sx={{
                bgcolor: '#FF3B30',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('pending')}>
            <Chip
              label="Pending"
              size="small"
              sx={{
                bgcolor: '#FF9500',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </MenuItem>
        </Menu>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            '& .MuiTablePagination-select': {
              bgcolor: '#f5f5f7',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            maxWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: '#1d1d1f',
          pb: 1,
        }}>
          Konfirmasi Hapus
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#86868b' }}>
            Apakah Anda yakin ingin menghapus PKSI{' '}
            <strong style={{ color: '#1d1d1f' }}>
              {pksiToDelete?.namaPksi}
            </strong>
            ? Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            sx={{
              color: '#86868b',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Batal
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            variant="contained"
            sx={{
              bgcolor: '#DC2626',
              '&:hover': {
                bgcolor: '#B91C1C',
              },
            }}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Form Dialog */}
      <Dialog
        open={openApprovalDialog}
        onClose={handleApprovalCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxHeight: '90vh',
            bgcolor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            pb: 2,
            bgcolor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}
          >
            Persetujuan PKSI
          </Typography>
          <IconButton
            onClick={handleApprovalCancel}
            size="small"
            sx={{
              color: '#86868b',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            pb: 4,
            background: 'linear-gradient(135deg, rgba(245, 245, 247, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%)',
          }}
        >
          {/* Form Card */}
          <Box
            sx={{
              p: 3,
              borderRadius: '20px',
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2.5,
                fontWeight: 600,
                color: '#1d1d1f',
                letterSpacing: '-0.01em',
                fontSize: '1rem',
              }}
            >
              Informasi Persetujuan
            </Typography>
            <Typography variant="body2" sx={{ color: '#86868b', mb: 3 }}>
              Mohon lengkapi form di bawah untuk menyetujui PKSI ini:
            </Typography>

            {/* Tim Field */}
            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <InputLabel id="team-label">Tim *</InputLabel>
              <Select
                labelId="team-label"
                value={approvalForm.teamId}
                label="Tim *"
                onChange={(e) => setApprovalForm({ ...approvalForm, teamId: e.target.value })}
                disabled={isLoadingTeams}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease-in-out',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.15)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#31A24C',
                    borderWidth: '1.5px',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.1)',
                  },
                }}
              >
                <MenuItem value=""><em>{isLoadingTeams ? 'Memuat...' : 'Pilih Tim'}</em></MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {team.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b' }}>
                        PIC: {team.pic?.fullName || '-'} • {team.members.length} anggota
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Team Preview */}
            {approvalForm.teamId && (() => {
              const selectedTeam = teams.find(t => t.id === approvalForm.teamId);
              return selectedTeam ? (
                <Box 
                  sx={{ 
                    mb: 2.5, 
                    p: 2, 
                    bgcolor: 'rgba(49, 162, 76, 0.08)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(49, 162, 76, 0.2)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#31A24C', fontWeight: 600, display: 'block', mb: 1 }}>
                    Detail Tim
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', mb: 0.5 }}>
                    <strong>PIC:</strong> {selectedTeam.pic?.fullName || 'Belum ditentukan'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                    <strong>Anggota:</strong> {selectedTeam.members.length > 0 
                      ? selectedTeam.members.map(m => m.fullName).join(', ')
                      : 'Belum ada anggota'}
                  </Typography>
                </Box>
              ) : null;
            })()}

            {/* IKU Field */}
            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <InputLabel id="iku-label">IKU</InputLabel>
              <Select
                labelId="iku-label"
                value={approvalForm.iku}
                label="IKU"
                onChange={(e) => setApprovalForm({ ...approvalForm, iku: e.target.value })}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease-in-out',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.15)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#31A24C',
                    borderWidth: '1.5px',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.1)',
                  },
                }}
              >
                <MenuItem value="ya">Ya</MenuItem>
                <MenuItem value="tidak">Tidak</MenuItem>
              </Select>
            </FormControl>

            {/* Inhouse/Outsource Field */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="inhouse-label">Inhouse/Outsource</InputLabel>
              <Select
                labelId="inhouse-label"
                value={approvalForm.inhouseOutsource}
                label="Inhouse/Outsource"
                onChange={(e) => setApprovalForm({ ...approvalForm, inhouseOutsource: e.target.value })}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease-in-out',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.15)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#31A24C',
                    borderWidth: '1.5px',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.1)',
                  },
                }}
              >
                <MenuItem value="inhouse">Inhouse</MenuItem>
                <MenuItem value="outsource">Outsource</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" sx={{ color: '#FF3B30' }}>
              * Field yang wajib diisi
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions 
          sx={{ 
            p: 2.5, 
            bgcolor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Button
            onClick={handleApprovalCancel}
            disabled={isSubmittingApproval}
            sx={{
              color: '#86868b',
              borderRadius: '10px',
              px: 3,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Batal
          </Button>
          <Button
            onClick={handleApprovalSubmit}
            disabled={isSubmittingApproval}
            variant="contained"
            sx={{
              bgcolor: '#31A24C',
              borderRadius: '10px',
              px: 3,
              boxShadow: '0 4px 14px rgba(49, 162, 76, 0.3)',
              '&:hover': {
                bgcolor: '#2D8E41',
                boxShadow: '0 6px 20px rgba(49, 162, 76, 0.4)',
              },
              '&:disabled': {
                bgcolor: 'rgba(49, 162, 76, 0.5)',
              },
            }}
          >
            {isSubmittingApproval ? 'Menyetujui...' : 'Setujui'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PksiList;
