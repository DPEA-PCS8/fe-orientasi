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
  TableSortLabel,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
  styled,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
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
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  PushPin as PushPinIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';
import { 
  searchFs2Documents, 
  deleteFs2Document, 
  updateFs2Status, 
  createFs2Document,
  updateFs2Document,
  downloadAllFs2Excel,
  type Fs2DocumentData,
  type Fs2DocumentRequest 
} from '../api/fs2Api';
import { getAllAplikasi, type AplikasiData } from '../api/aplikasiApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { searchPksiDocuments, type PksiDocumentData } from '../api/pksiApi';
import { 
  uploadFs2TempFiles, 
  moveFs2TempFilesToPermanent, 
  deleteFs2TempFiles,
  deleteFs2File,
  getFs2Files,
  uploadFs2Files,
  downloadFs2File,
  type Fs2FileData 
} from '../api/fs2FileApi';
import ViewFs2Modal from '../components/modals/ViewFs2Modal';
import { FilePreviewModal } from '../components/modals';
import { useSidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '../context/SidebarContext';

// Interface for transformed data
interface Fs2Data {
  id: string;
  namaAplikasi: string;
  namaFs2: string;
  statusTahapan: string;
  skpa: string;
  urgensi: string;
  tanggalPengajuan: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui';
}

// Transform API data to UI format
const transformApiData = (apiData: Fs2DocumentData): Fs2Data => {
  const mapStatus = (status: string): Fs2Data['status'] => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'disetujui' || statusLower === 'approved') return 'disetujui';
    if (statusLower === 'ditolak' || statusLower === 'rejected' || statusLower === 'tidak_disetujui') return 'tidak_disetujui';
    return 'pending';
  };

  return {
    id: apiData.id,
    namaAplikasi: apiData.nama_aplikasi || '-',
    namaFs2: apiData.nama_fs2 || '-',
    statusTahapan: apiData.status_tahapan || '-',
    skpa: apiData.kode_skpa || apiData.nama_skpa || '-',
    urgensi: apiData.urgensi || '-',
    tanggalPengajuan: apiData.tanggal_pengajuan || '',
    status: mapStatus(apiData.status),
  };
};

type Order = 'asc' | 'desc';

// Status label mapping
const STATUS_LABELS: Record<Fs2Data['status'], string> = {
  pending: 'Pending',
  disetujui: 'Disetujui',
  tidak_disetujui: 'Tidak Disetujui',
};

// Status Tahapan label mapping
const STATUS_TAHAPAN_LABELS: Record<string, string> = {
  DESAIN: 'Desain',
  PEMELIHARAAN: 'Pemeliharaan',
};

const getStatusColor = (status: Fs2Data['status']) => {
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
  { bg: '#DA251C', text: '#FFFFFF' },
  { bg: '#2563EB', text: '#FFFFFF' },
  { bg: '#059669', text: '#FFFFFF' },
  { bg: '#7C3AED', text: '#FFFFFF' },
  { bg: '#D97706', text: '#FFFFFF' },
  { bg: '#0891B2', text: '#FFFFFF' },
  { bg: '#DB2777', text: '#FFFFFF' },
  { bg: '#4F46E5', text: '#FFFFFF' },
  { bg: '#65A30D', text: '#FFFFFF' },
  { bg: '#DC2626', text: '#FFFFFF' },
];

// Generate consistent color based on SKPA code
const getSkpaColor = (skpaCode: string): { bg: string; text: string } => {
  if (!skpaCode) return SKPA_COLORS[0];
  let hash = 0;
  for (let i = 0; i < skpaCode.length; i++) {
    hash = skpaCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SKPA_COLORS.length;
  return SKPA_COLORS[index];
};

// Styled TextField with glass effect
const GlassTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.08)',
      transition: 'all 0.2s ease-in-out',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.15)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DA251C',
      borderWidth: '1.5px',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 4px 20px rgba(218, 37, 28, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#86868b',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#DA251C',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#1d1d1f',
  },
});

// Month options for dropdown
const MONTH_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

// Generate years from 5 years ago to 10 years in future
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const year = currentYear - 5 + i;
  return { value: year.toString(), label: year.toString() };
});

// Helper to extract month from date string (YYYY-MM-DD or YYYY-MM)
const getMonthFromDate = (dateString?: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length >= 2 ? parts[1] : '';
};

// Helper to extract year from date string (YYYY-MM-DD or YYYY-MM)
const getYearFromDate = (dateString?: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length >= 1 ? parts[0] : '';
};

// Helper to build date string from month and year
const buildDateFromMonthYear = (month: string, year: string): string => {
  if (!month && !year) return '';
  // Allow partial dates - if only month or only year is selected
  const finalYear = year || new Date().getFullYear().toString(); // Use current year if not selected
  const finalMonth = month || '01'; // Use January if not selected
  return `${finalYear}-${finalMonth}-01`;
};

function Fs2List() {
  const [keyword, setKeyword] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedFs2ForEdit, setSelectedFs2ForEdit] = useState<Fs2DocumentData | null>(null);
  const [selectedFs2IdForView, setSelectedFs2IdForView] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Fs2Data>('namaAplikasi');
  const [order, setOrder] = useState<Order>('asc');
  const [fs2Data, setFs2Data] = useState<Fs2Data[]>([]);
  const [rawData, setRawData] = useState<Fs2DocumentData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFs2Id, setSelectedFs2Id] = useState<string | null>(null);

  const { isCollapsed } = useSidebar();

  // Permission check for FS2 menu
  const { getMenuPermissions } = usePermissions();
  const fs2Permissions = getMenuPermissions('FS2_ALL');

  // Accordion expanded state for Add/Edit modal
  const [expandedSection, setExpandedSection] = useState<string | false>('section0');

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());
  const [selectedAplikasiFilter, setSelectedAplikasiFilter] = useState<string>('');
  const [selectedStatusTahapanFilter, setSelectedStatusTahapanFilter] = useState<string>('');
  const [selectedSkpaFilter, setSelectedSkpaFilter] = useState<string>('');
  
  // Year filter (exposed in toolbar) - default to current year, filters by tanggal_pengajuan
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>(new Date().getFullYear().toString());
  
  // Month range filter (exposed in toolbar) - filters by tanggal_pengajuan month
  const [selectedStartMonth, setSelectedStartMonth] = useState<string>('');
  const [selectedEndMonth, setSelectedEndMonth] = useState<string>('');

  // Sticky columns configuration
  const [stickyColumnsAnchorEl, setStickyColumnsAnchorEl] = useState<null | HTMLElement>(null);
  const [stickyColumns, setStickyColumns] = useState<Set<string>>(new Set(['no', 'namaAplikasi']));
  
  // Column definitions for sticky configuration - will dynamically include all columns
  const COLUMN_OPTIONS = useMemo(() => [
    { id: 'no', label: 'No', width: 50 },
    { id: 'namaAplikasi', label: 'Nama Aplikasi', width: 150 },
    { id: 'namaFs2', label: 'Nama FS2', width: 180 },
    { id: 'statusTahapan', label: 'Status Tahapan Aplikasi', width: 180 },
    { id: 'skpa', label: 'SKPA', width: 100 },
    // { id: 'urgensi', label: 'Urgensi', width: 100 }, // HIDDEN as per requirement
    { id: 'tanggalPengajuan', label: 'Tanggal Pengajuan', width: 150 },
    { id: 'docsFs2', label: 'Docs F.S.2', width: 90 },
    { id: 'tglBerkasFs2', label: 'Tgl Berkas FS2', width: 130 },
    { id: 'status', label: 'Status', width: 130 },
  ], []);

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
  }, [stickyColumns, COLUMN_OPTIONS]);

  const isLastStickyColumn = useCallback((columnId: string): boolean => {
    if (!stickyColumns.has(columnId)) return false;
    const orderedSticky = COLUMN_OPTIONS.filter(col => stickyColumns.has(col.id));
    return orderedSticky[orderedSticky.length - 1]?.id === columnId;
  }, [stickyColumns, COLUMN_OPTIONS]);

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

  // Reference data for dropdowns
  const [aplikasiList, setAplikasiList] = useState<AplikasiData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [pksiList, setPksiList] = useState<PksiDocumentData[]>([]);

  // Form state for Add/Edit modal
  const [formData, setFormData] = useState<Fs2DocumentRequest>({
    aplikasi_id: '',
    nama_fs2: '',
    bidang_id: '',
    skpa_id: '',
    tanggal_pengajuan: new Date().toISOString().split('T')[0],
    // New form fields
    deskripsi_pengubahan: '',
    alasan_pengubahan: '',
    status_tahapan: '',
    fase_pengajuan: '',
    urgensi: '',
    kriteria_1: false,
    kriteria_2: false,
    kriteria_3: false,
    kriteria_4: false,
    aspek_sistem_ada: '',
    aspek_sistem_terkait: '',
    aspek_alur_kerja: '',
    aspek_struktur_organisasi: '',
    dok_t01_sebelum: '',
    dok_t01_sesudah: '',
    dok_t11_sebelum: '',
    dok_t11_sesudah: '',
    pengguna_sebelum: '',
    pengguna_sesudah: '',
    akses_bersamaan_sebelum: '',
    akses_bersamaan_sesudah: '',
    pertumbuhan_data_sebelum: '',
    pertumbuhan_data_sesudah: '',
    target_pengujian: '',
    target_deployment: '',
    target_go_live: '',
    pernyataan_1: false,
    pernyataan_2: false,
    tanggal_berkas_fs2: '',
    pksi_id: '',
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileData, setUploadedFileData] = useState<Fs2FileData[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Existing files state for Edit modal
  const [existingFs2Files, setExistingFs2Files] = useState<Fs2FileData[]>([]);
  const [isLoadingExistingFiles, setIsLoadingExistingFiles] = useState(false);

  // Delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [fs2ToDelete, setFs2ToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Excel download state
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // File preview dialog state
  const [openFilePreviewDialog, setOpenFilePreviewDialog] = useState(false);
  const [filePreviewFiles, setFilePreviewFiles] = useState<Fs2FileData[]>([]);
  const [isLoadingFilePreview, setIsLoadingFilePreview] = useState(false);
  const [filePreviewDownloadingId, setFilePreviewDownloadingId] = useState<string | null>(null);
  
  // File preview modal state (popup preview)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<Fs2FileData | null>(null);

  // Form validation state
  interface FormErrors {
    [key: string]: string | undefined;
  }
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch F.S.2 data from API
  const fetchFs2Data = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusMapping: Record<string, string> = {
        pending: 'PENDING',
        disetujui: 'DISETUJUI',
        tidak_disetujui: 'TIDAK_DISETUJUI',
      };
      const statusFilter = selectedStatus.size === 1 
        ? statusMapping[Array.from(selectedStatus)[0]] 
        : undefined;

      // Parse year filter for backend API
      const yearFilter = selectedYearFilter ? parseInt(selectedYearFilter, 10) : undefined;
      
      // Parse month filters for backend API
      const startMonthFilter = selectedStartMonth ? parseInt(selectedStartMonth, 10) : undefined;
      const endMonthFilter = selectedEndMonth ? parseInt(selectedEndMonth, 10) : undefined;

      const response = await searchFs2Documents({
        search: keyword || undefined,
        status: statusFilter,
        aplikasi_id: selectedAplikasiFilter || undefined,
        status_tahapan: selectedStatusTahapanFilter || undefined,
        skpa_id: selectedSkpaFilter || undefined,
        year: yearFilter,
        start_month: startMonthFilter,
        end_month: endMonthFilter,
        page: page,
        size: rowsPerPage,
      });

      const transformedData = response.content.map(transformApiData);
      setFs2Data(transformedData);
      setRawData(response.content);
      setTotalElements(response.total_elements);
    } catch (error) {
      console.error('Failed to fetch F.S.2 data:', error);
      setFs2Data([]);
      setRawData([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, rowsPerPage, selectedStatus, selectedAplikasiFilter, selectedStatusTahapanFilter, selectedSkpaFilter, selectedYearFilter, selectedStartMonth, selectedEndMonth]);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [aplikasiRes, skpaRes, pksiRes] = await Promise.all([
          getAllAplikasi(),
          getAllSkpa(),
          searchPksiDocuments({ status: 'DISETUJUI', size: 1000 }),
        ]);
        setAplikasiList(aplikasiRes.data || []);
        setSkpaList(skpaRes.data || []);
        setPksiList(pksiRes.content || []);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
      }
    };
    fetchReferenceData();
  }, []);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchFs2Data();
  }, [fetchFs2Data]);

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, fs2Id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedFs2Id(fs2Id);
  };

  const handleStatusMenuClose = () => {
    setAnchorEl(null);
    setSelectedFs2Id(null);
  };

  const mapFrontendToBackendStatus = (frontendStatus: Fs2Data['status']): string => {
    switch (frontendStatus) {
      case 'disetujui':
        return 'DISETUJUI';
      case 'tidak_disetujui':
        return 'TIDAK_DISETUJUI';
      default:
        return 'PENDING';
    }
  };

  const handleStatusChange = async (newStatus: Fs2Data['status']) => {
    if (!selectedFs2Id) {
      handleStatusMenuClose();
      return;
    }

    try {
      const backendStatus = mapFrontendToBackendStatus(newStatus);
      await updateFs2Status(selectedFs2Id, backendStatus);
      
      setFs2Data(prev => 
        prev.map(item => 
          item.id === selectedFs2Id ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
    handleStatusMenuClose();
  };

  const handleRequestSort = (property: keyof Fs2Data) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setSelectedStatus(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(status);
      } else {
        newSet.delete(status);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSelectedStatus(new Set());
    setSelectedAplikasiFilter('');
    setSelectedStatusTahapanFilter('');
    setSelectedSkpaFilter('');
    setSelectedYearFilter(new Date().getFullYear().toString());
    setSelectedStartMonth('');
    setSelectedEndMonth('');
  };

  // Accordion change handler for Add/Edit modal
  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // File upload handlers - constants
  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && sessionId) {
      // Only take the first file (single file upload)
      const file = files[0];

      // Validate file size (max 8MB)
      console.log('File size:', file.size, 'bytes', 'Max allowed:', MAX_FILE_SIZE, 'bytes');
      if (!file.size || file.size <= 0) {
        alert('File tidak valid. Silakan pilih file yang valid.');
        event.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Ukuran file (${fileSizeMB} MB) melebihi batas maksimal 8MB. Silakan pilih file yang lebih kecil.`);
        event.target.value = '';
        return;
      }

      // Validate file type (PDF and Word only)
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        alert('Format file tidak didukung. Hanya file PDF dan Word (.pdf, .doc, .docx) yang diperbolehkan.');
        event.target.value = '';
        return;
      }
      
      // Delete existing file if any
      if (uploadedFileData.length > 0 && uploadedFileData[0]?.id) {
        try {
          await deleteFs2File(uploadedFileData[0].id);
        } catch (error) {
          console.error('Failed to delete existing file:', error);
        }
      }
      
      setIsUploading(true);
      try {
        // Upload to temp storage
        const uploadedData = await uploadFs2TempFiles(sessionId, [file]);
        setUploadedFiles([file]);
        setUploadedFileData(uploadedData);
      } catch (error) {
        console.error('Failed to upload file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload file. Silakan coba lagi.';
        alert(errorMessage);
      } finally {
        setIsUploading(false);
      }
    }
    // Reset input value to allow uploading same file again
    event.target.value = '';
  };

  const handleFileDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0 && sessionId) {
      const file = files[0];

      // Validate file size (max 8MB)
      console.log('File size (drop):', file.size, 'bytes', 'Max allowed:', MAX_FILE_SIZE, 'bytes');
      if (!file.size || file.size <= 0) {
        alert('File tidak valid. Silakan pilih file yang valid.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Ukuran file (${fileSizeMB} MB) melebihi batas maksimal 8MB. Silakan pilih file yang lebih kecil.`);
        return;
      }

      // Validate file type (PDF and Word only)
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        alert('Format file tidak didukung. Hanya file PDF dan Word (.pdf, .doc, .docx) yang diperbolehkan.');
        return;
      }
      
      // Delete existing file if any
      if (uploadedFileData.length > 0 && uploadedFileData[0]?.id) {
        try {
          await deleteFs2File(uploadedFileData[0].id);
        } catch (error) {
          console.error('Failed to delete existing file:', error);
        }
      }
      
      setIsUploading(true);
      try {
        // Upload to temp storage
        const uploadedData = await uploadFs2TempFiles(sessionId, [file]);
        setUploadedFiles([file]);
        setUploadedFileData(uploadedData);
      } catch (error) {
        console.error('Failed to upload file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload file. Silakan coba lagi.';
        alert(errorMessage);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = uploadedFileData[index];
    if (fileToRemove?.id) {
      try {
        await deleteFs2File(fileToRemove.id);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileData((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate year options from tanggal_pengajuan
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    // Add current year and surrounding years as defaults
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      years.add(y.toString());
    }
    // Extract years from rawData tanggal_pengajuan
    rawData.forEach(item => {
      if (item.tanggal_pengajuan) {
        const year = new Date(item.tanggal_pengajuan).getFullYear();
        if (!isNaN(year)) years.add(year.toString());
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [rawData]);

  // Month options for filtering
  const monthOptions = useMemo(() => [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ], []);

  // Filter fs2Data by selected year (tanggal_pengajuan)
  // Note: Year filter is now handled by backend, this is kept for compatibility
  const filteredFs2Data = useMemo(() => {
    // Year filtering is now done by backend, so just return the data as-is
    return fs2Data;
  }, [fs2Data]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatus.size > 0) count++;
    if (selectedAplikasiFilter) count++;
    if (selectedStatusTahapanFilter) count++;
    if (selectedSkpaFilter) count++;
    return count;
  }, [selectedStatus, selectedAplikasiFilter, selectedStatusTahapanFilter, selectedSkpaFilter]);

  // Add modal handlers
  const handleOpenAddModal = () => {
    // Generate a unique session ID for temp file uploads
    const newSessionId = `fs2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setUploadedFiles([]);
    setUploadedFileData([]);
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');
    setExpandedSection('section0');
    setFormData({
      aplikasi_id: '',
      bidang_id: '',
      skpa_id: '',
      tanggal_pengajuan: new Date().toISOString().split('T')[0],
      deskripsi_pengubahan: '',
      alasan_pengubahan: '',
      status_tahapan: '',
      urgensi: '',
      kriteria_1: false,
      kriteria_2: false,
      kriteria_3: false,
      kriteria_4: false,
      aspek_sistem_ada: '',
      aspek_sistem_terkait: '',
      aspek_alur_kerja: '',
      aspek_struktur_organisasi: '',
      dok_t01_sebelum: '',
      dok_t01_sesudah: '',
      dok_t11_sebelum: '',
      dok_t11_sesudah: '',
      pengguna_sebelum: '',
      pengguna_sesudah: '',
      akses_bersamaan_sebelum: '',
      akses_bersamaan_sesudah: '',
      pertumbuhan_data_sebelum: '',
      pertumbuhan_data_sesudah: '',
      target_pengujian: '',
      target_deployment: '',
      target_go_live: '',
      pernyataan_1: false,
      pernyataan_2: false,
      pksi_id: '',
    });
    setOpenAddModal(true);
  };

  const handleCloseAddModal = async () => {
    // Clean up temp files when canceling
    if (sessionId && uploadedFileData.length > 0) {
      try {
        await deleteFs2TempFiles(sessionId);
      } catch (error) {
        console.error('Failed to delete temp files:', error);
      }
    }
    setUploadedFiles([]);
    setUploadedFileData([]);
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');
    setOpenAddModal(false);
  };

  // Handle select/autocomplete change and clear errors
  const handleSelectChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Section 1: Informasi Dasar (only validate 1.1-1.5)
    if (!formData.aplikasi_id) newErrors.aplikasi_id = "Nama Aplikasi wajib dipilih";
    if (!formData.nama_fs2 || formData.nama_fs2.trim() === '') newErrors.nama_fs2 = "Nama FS2 wajib diisi";
    if (!formData.status_tahapan) newErrors.status_tahapan = "Status Tahapan wajib dipilih";
    if (!formData.skpa_id) newErrors.skpa_id = "SKPA wajib dipilih";
    // if (!formData.urgensi) newErrors.urgensi = "Urgensi wajib dipilih"; // HIDDEN as per requirement

    // Section 1.6: PKSI wajib dipilih jika Status Tahapan adalah "DESAIN"
    if (formData.status_tahapan === 'DESAIN' && !formData.pksi_id) {
      newErrors.pksi_id = "PKSI wajib dipilih untuk Status Tahapan Desain";
    }

    // Section 2: Jadwal Pelaksanaan - hanya wajib jika Status Tahapan adalah "PEMELIHARAAN"
    if (formData.status_tahapan === 'PEMELIHARAAN') {
      if (!formData.target_pengujian) newErrors.target_pengujian = "Target Pengujian wajib diisi";
      if (!formData.target_deployment) newErrors.target_deployment = "Target Deployment wajib diisi";
      if (!formData.target_go_live) newErrors.target_go_live = "Target Go Live wajib diisi";
    }

    // Section 3: Upload Berkas F.S.2 - WAJIB UPLOAD MINIMAL 1 FILE
    if (uploadedFiles.length === 0 && uploadedFileData.length === 0) {
      newErrors.upload_dokumen = "Dokumen F.S.2 wajib diupload!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddFs2 = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      setErrorMessage('Mohon lengkapi semua kolom yang wajib diisi');
      // Scroll to top to show error message
      const dialogContent = document.querySelector('.MuiDialogContent-root');
      if (dialogContent) {
        dialogContent.scrollTop = 0;
      }
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Auto-set tanggal_berkas_fs2 to current date when creating FS2 with uploaded files
      const dataToSubmit = { ...formData };
      if (uploadedFileData.length > 0 && !dataToSubmit.tanggal_berkas_fs2) {
        dataToSubmit.tanggal_berkas_fs2 = new Date().toISOString().split('T')[0];
      }
      
      const createdFs2 = await createFs2Document(dataToSubmit);
      
      // Move temp files to permanent storage
      if (sessionId && uploadedFileData.length > 0) {
        await moveFs2TempFilesToPermanent(createdFs2.id, sessionId);
      }
      
      setSnackbar({ open: true, message: 'F.S.2 berhasil ditambahkan!', severity: 'success' });
      setOpenAddModal(false);
      fetchFs2Data();
      setSuccessMessage('');
      setErrorMessage('');
      setErrors({});
    } catch (error) {
      console.error('Failed to create F.S.2:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal menambahkan F.S.2';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    }
  };

  // Edit modal handlers
  const handleOpenEditModal = async (fs2Id: string) => {
    const fs2 = rawData.find(item => item.id === fs2Id);
    if (fs2) {
      setSelectedFs2ForEdit(fs2);
      setFormData({
        aplikasi_id: fs2.aplikasi_id || '',
        nama_fs2: fs2.nama_fs2 || '',
        bidang_id: fs2.bidang_id || '',
        skpa_id: fs2.skpa_id || '',
        tanggal_pengajuan: fs2.tanggal_pengajuan || '',
        deskripsi_pengubahan: fs2.deskripsi_pengubahan || '',
        alasan_pengubahan: fs2.alasan_pengubahan || '',
        status_tahapan: fs2.status_tahapan || '',
        urgensi: fs2.urgensi || '',
        kriteria_1: fs2.kriteria_1 || false,
        kriteria_2: fs2.kriteria_2 || false,
        kriteria_3: fs2.kriteria_3 || false,
        kriteria_4: fs2.kriteria_4 || false,
        aspek_sistem_ada: fs2.aspek_sistem_ada || '',
        aspek_sistem_terkait: fs2.aspek_sistem_terkait || '',
        aspek_alur_kerja: fs2.aspek_alur_kerja || '',
        aspek_struktur_organisasi: fs2.aspek_struktur_organisasi || '',
        dok_t01_sebelum: fs2.dok_t01_sebelum || '',
        dok_t01_sesudah: fs2.dok_t01_sesudah || '',
        dok_t11_sebelum: fs2.dok_t11_sebelum || '',
        dok_t11_sesudah: fs2.dok_t11_sesudah || '',
        pengguna_sebelum: fs2.pengguna_sebelum || '',
        pengguna_sesudah: fs2.pengguna_sesudah || '',
        akses_bersamaan_sebelum: fs2.akses_bersamaan_sebelum || '',
        akses_bersamaan_sesudah: fs2.akses_bersamaan_sesudah || '',
        pertumbuhan_data_sebelum: fs2.pertumbuhan_data_sebelum || '',
        pertumbuhan_data_sesudah: fs2.pertumbuhan_data_sesudah || '',
        target_pengujian: fs2.target_pengujian || '',
        target_deployment: fs2.target_deployment || '',
        target_go_live: fs2.target_go_live || '',
        pernyataan_1: fs2.pernyataan_1 || false,
        pernyataan_2: fs2.pernyataan_2 || false,
        tanggal_berkas_fs2: fs2.tanggal_berkas_fs2 || '',
        team_id: fs2.team_id || undefined,
        // PKSI Reference (for Desain status)
        pksi_id: fs2.pksi_id || '',
      });
      
      // Fetch existing files
      setIsLoadingExistingFiles(true);
      try {
        const files = await getFs2Files(fs2Id);
        // Filter to only show base FS2 document files (not monitoring files like ND, CD, F45, etc.)
        const fs2DocFiles = files.filter(f => !f.file_type || f.file_type === 'FS2');
        setExistingFs2Files(fs2DocFiles);
      } catch (error) {
        console.error('Failed to fetch existing files:', error);
        setExistingFs2Files([]);
      } finally {
        setIsLoadingExistingFiles(false);
      }
      
      setOpenEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedFs2ForEdit(null);
    setExistingFs2Files([]);
  };

  const handleEditFs2 = async () => {
    if (!selectedFs2ForEdit) return;
    
    // Validate: check if nama_fs2 is filled
    if (!formData.nama_fs2 || formData.nama_fs2.trim() === '') {
      setErrors(prev => ({ ...prev, nama_fs2: "Nama FS2 wajib diisi" }));
      return;
    }
    
    // Validate: check if there are existing files
    if (existingFs2Files.length === 0) {
      setErrors(prev => ({ ...prev, upload_dokumen: "Dokumen F.S.2 wajib diupload!" }));
      return;
    }
    
    try {
      await updateFs2Document(selectedFs2ForEdit.id, formData);
      setSnackbar({ open: true, message: 'F.S.2 berhasil diperbarui', severity: 'success' });
      setOpenEditModal(false);
      setSelectedFs2ForEdit(null);
      setExistingFs2Files([]);
      fetchFs2Data();
    } catch (error) {
      console.error('Failed to update F.S.2:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memperbarui F.S.2';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    }
  };

  // Edit modal file handlers
  const handleEditFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && selectedFs2ForEdit) {
      const file = files[0];

      // Validate file size (max 8MB)
      console.log('File size (edit):', file.size, 'bytes', 'Max allowed:', MAX_FILE_SIZE, 'bytes');
      if (!file.size || file.size <= 0) {
        alert('File tidak valid. Silakan pilih file yang valid.');
        event.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Ukuran file (${fileSizeMB} MB) melebihi batas maksimal 8MB. Silakan pilih file yang lebih kecil.`);
        event.target.value = '';
        return;
      }

      // Validate file type (PDF and Word only)
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        alert('Format file tidak didukung. Hanya file PDF dan Word (.pdf, .doc, .docx) yang diperbolehkan.');
        event.target.value = '';
        return;
      }

      setIsUploading(true);
      try {
        // Upload directly to the F.S.2 document
        const uploadedData = await uploadFs2Files(selectedFs2ForEdit.id, [file]);
        // Add to existing files list
        setExistingFs2Files(prev => [...prev, ...uploadedData]);
      } catch (error) {
        console.error('Failed to upload file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload file. Silakan coba lagi.';
        alert(errorMessage);
      } finally {
        setIsUploading(false);
      }
    }
    event.target.value = '';
  };

  const handleEditFileDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0 && selectedFs2ForEdit) {
      const file = files[0];

      // Validate file size (max 8MB)
      console.log('File size (edit drop):', file.size, 'bytes', 'Max allowed:', MAX_FILE_SIZE, 'bytes');
      if (!file.size || file.size <= 0) {
        alert('File tidak valid. Silakan pilih file yang valid.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Ukuran file (${fileSizeMB} MB) melebihi batas maksimal 8MB. Silakan pilih file yang lebih kecil.`);
        return;
      }

      // Validate file type (PDF and Word only)
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        alert('Format file tidak didukung. Hanya file PDF dan Word (.pdf, .doc, .docx) yang diperbolehkan.');
        return;
      }

      setIsUploading(true);
      try {
        // Upload directly to the F.S.2 document
        const uploadedData = await uploadFs2Files(selectedFs2ForEdit.id, [file]);
        // Add to existing files list
        setExistingFs2Files(prev => [...prev, ...uploadedData]);
      } catch (error) {
        console.error('Failed to upload file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload file. Silakan coba lagi.';
        alert(errorMessage);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteExistingFile = async (fileId: string) => {
    try {
      await deleteFs2File(fileId);
      setExistingFs2Files(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Gagal menghapus file. Silakan coba lagi.');
    }
  };

  const handleDownloadExistingFile = async (file: Fs2FileData) => {
    try {
      await downloadFs2File(file.id, file.original_name || file.file_name);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Gagal mengunduh file. Silakan coba lagi.');
    }
  };

  // View modal handlers
  const handleOpenViewModal = (fs2Id: string) => {
    setSelectedFs2IdForView(fs2Id);
    setOpenViewModal(true);
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setSelectedFs2IdForView(null);
  };

  // Delete handlers
  const handleOpenDeleteDialog = (fs2Id: string) => {
    setFs2ToDelete(fs2Id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setFs2ToDelete(null);
  };

  // File preview dialog handlers
  const handleOpenFilePreviewDialog = async (fs2Id: string) => {
    setOpenFilePreviewDialog(true);
    setIsLoadingFilePreview(true);
    try {
      const files = await getFs2Files(fs2Id);
      // Filter to only show base FS2 document files (not monitoring files like ND, CD, F45, etc.)
      const fs2DocFiles = files.filter(f => !f.file_type || f.file_type === 'FS2');
      setFilePreviewFiles(fs2DocFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFilePreviewFiles([]);
    } finally {
      setIsLoadingFilePreview(false);
    }
  };

  const handleCloseFilePreviewDialog = () => {
    setOpenFilePreviewDialog(false);
    setFilePreviewFiles([]);
  };

  // Open preview modal instead of new tab
  const handleViewFileInNewTab = (file: Fs2FileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Check if file is previewable
  const isPreviewable = (contentType: string): boolean => {
    return contentType === 'application/pdf' || contentType.startsWith('image/');
  };

  // Handle preview close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Handle download from preview modal
  const handlePreviewDownload = async () => {
    if (previewFile) {
      await handleDownloadFilePreview(previewFile);
    }
  };

  const handleDownloadFilePreview = async (file: Fs2FileData) => {
    setFilePreviewDownloadingId(file.id);
    try {
      await downloadFs2File(file.id, file.original_name || file.file_name);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Gagal mengunduh file. Silakan coba lagi.');
    } finally {
      setFilePreviewDownloadingId(null);
    }
  };

  const handleDeleteFs2 = async () => {
    if (!fs2ToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFs2Document(fs2ToDelete);
      handleCloseDeleteDialog();
      setSnackbar({
        open: true,
        message: 'F.S.2 berhasil dihapus',
        severity: 'success',
      });
      fetchFs2Data();
    } catch (error: any) {
      console.error('Failed to delete F.S.2:', error);
      const errorMessage = error?.message || 'Gagal menghapus F.S.2. Silakan coba lagi.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Excel download
  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      // Map status filter
      const statusMapping: Record<string, string> = {
        pending: 'PENDING',
        disetujui: 'DISETUJUI',
        tidak_disetujui: 'TIDAK_DISETUJUI',
      };
      const statusFilter = selectedStatus.size === 1 
        ? statusMapping[Array.from(selectedStatus)[0]] 
        : undefined;
      
      await downloadAllFs2Excel({
        search: keyword || undefined,
        aplikasi_id: selectedAplikasiFilter || undefined,
        status_tahapan: selectedStatusTahapanFilter || undefined,
        skpa_id: selectedSkpaFilter || undefined,
        status: statusFilter,
        year: selectedYearFilter ? parseInt(selectedYearFilter, 10) : undefined,
        start_month: selectedStartMonth ? parseInt(selectedStartMonth, 10) : undefined,
        end_month: selectedEndMonth ? parseInt(selectedEndMonth, 10) : undefined,
      });
      setSnackbar({
        open: true,
        message: 'File Excel berhasil diunduh',
        severity: 'success',
      });
    } catch (error: unknown) {
      console.error('Failed to download Excel:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal mengunduh file Excel';
      setSnackbar({
        open: true,
        message: errMsg,
        severity: 'error',
      });
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ 
      p: 3.5,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1d1d1f',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          Dashboard F.S.2
        </Typography>
        <Typography variant="body1" sx={{ color: '#86868b' }}>
          Kelola data pengajuan F.S.2
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
            flexWrap: 'wrap',
            gap: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Search & Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Cari F.S.2..."
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
                  {yearOptions.map((year) => (
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

            {/* Month Range Filter - Start Month */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: selectedStartMonth ? 'rgba(218, 37, 28, 0.08)' : '#f5f5f7',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                border: selectedStartMonth ? '1.5px solid rgba(218, 37, 28, 0.3)' : '1.5px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: selectedStartMonth ? 'rgba(218, 37, 28, 0.12)' : '#eeeeef',
                },
              }}
            >
              <FormControl size="small" variant="standard" sx={{ minWidth: 110 }}>
                <Select
                  value={selectedStartMonth}
                  onChange={(e) => {
                    setSelectedStartMonth(e.target.value);
                    // Auto-adjust end month if it's less than start month
                    if (selectedEndMonth && parseInt(e.target.value) > parseInt(selectedEndMonth)) {
                      setSelectedEndMonth(e.target.value);
                    }
                  }}
                  displayEmpty
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: selectedStartMonth ? '#DA251C' : '#1d1d1f',
                    '& .MuiSelect-select': {
                      py: 0.5,
                      pr: 3,
                    },
                    '& .MuiSvgIcon-root': {
                      color: selectedStartMonth ? '#DA251C' : '#86868b',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                    <em>Bulan Mulai</em>
                  </MenuItem>
                  {monthOptions.map((month) => (
                    <MenuItem 
                      key={month.value} 
                      value={month.value}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Month Range Separator */}
            <Typography sx={{ color: '#86868b', fontSize: '0.875rem', fontWeight: 500 }}>
              s/d
            </Typography>

            {/* Month Range Filter - End Month */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: selectedEndMonth ? 'rgba(218, 37, 28, 0.08)' : '#f5f5f7',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                border: selectedEndMonth ? '1.5px solid rgba(218, 37, 28, 0.3)' : '1.5px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: selectedEndMonth ? 'rgba(218, 37, 28, 0.12)' : '#eeeeef',
                },
              }}
            >
              <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedEndMonth}
                  onChange={(e) => setSelectedEndMonth(e.target.value)}
                  displayEmpty
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: selectedEndMonth ? '#DA251C' : '#1d1d1f',
                    '& .MuiSelect-select': {
                      py: 0.5,
                      pr: 3,
                    },
                    '& .MuiSvgIcon-root': {
                      color: selectedEndMonth ? '#DA251C' : '#86868b',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                    <em>Bulan Selesai</em>
                  </MenuItem>
                  {monthOptions
                    .filter(month => !selectedStartMonth || parseInt(month.value) >= parseInt(selectedStartMonth))
                    .map((month) => (
                      <MenuItem 
                        key={month.value} 
                        value={month.value}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {month.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
            
            <Button
              variant="text"
              startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
              onClick={handleFilterClick}
              sx={{
                color: activeFiltersCount > 0 ? '#DA251C' : '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
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
          <Tooltip title="Download Excel">
            <IconButton
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel}
              sx={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: 'white',
                borderRadius: '10px',
                width: 40,
                height: 40,
                '&:hover': {
                  background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                },
                '&.Mui-disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)',
                },
              }}
            >
              {isDownloadingExcel ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <DownloadIcon />}
            </IconButton>
          </Tooltip>
          {fs2Permissions.canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
              sx={{
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                fontWeight: 500,
                px: 2.5,
                flexShrink: 0,
                '&:hover': {
                  background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
                },
              }}
            >
              Tambah F.S.2
            </Button>
          )}
        </Box>

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
          {/* Status Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              Status
            </Typography>
            <FormGroup sx={{ '& .MuiFormControlLabel-root': { mb: 1.5, alignItems: 'flex-start' }, '& .MuiCheckbox-root': { pt: 0.5 } }}>
              {['disetujui', 'tidak_disetujui', 'pending'].map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedStatus.has(status)}
                      onChange={(e) => handleStatusFilterChange(status, e.target.checked)}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>{STATUS_LABELS[status as Fs2Data['status']]}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>

          <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

          {/* Nama Aplikasi Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              Nama Aplikasi
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="aplikasi-filter-label">Pilih Aplikasi</InputLabel>
              <Select
                labelId="aplikasi-filter-label"
                value={selectedAplikasiFilter}
                label="Pilih Aplikasi"
                onChange={(e) => setSelectedAplikasiFilter(e.target.value)}
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
                <MenuItem value=""><em>Semua Aplikasi</em></MenuItem>
                {aplikasiList.map((aplikasi) => (
                  <MenuItem key={aplikasi.id} value={aplikasi.id}>{aplikasi.nama_aplikasi}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

          {/* Status Tahapan Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              Status Tahapan Aplikasi
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="status-tahapan-filter-label">Pilih Status Tahapan</InputLabel>
              <Select
                labelId="status-tahapan-filter-label"
                value={selectedStatusTahapanFilter}
                label="Pilih Status Tahapan"
                onChange={(e) => setSelectedStatusTahapanFilter(e.target.value)}
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
                <MenuItem value=""><em>Semua Status Tahapan</em></MenuItem>
                <MenuItem value="DESAIN">Desain</MenuItem>
                <MenuItem value="PEMELIHARAAN">Pemeliharaan</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

          {/* SKPA Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              SKPA
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="skpa-filter-label">Pilih SKPA</InputLabel>
              <Select
                labelId="skpa-filter-label"
                value={selectedSkpaFilter}
                label="Pilih SKPA"
                onChange={(e) => setSelectedSkpaFilter(e.target.value)}
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
                <MenuItem value=""><em>Semua SKPA</em></MenuItem>
                {skpaList.map((skpa) => (
                  <MenuItem key={skpa.id} value={skpa.id}>{skpa.kode_skpa} - {skpa.nama_skpa}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

          {/* Reset Button */}
          <Button
            fullWidth
            variant="outlined"
            onClick={clearFilters}
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

      {/* Data Count Display */}
      <Box sx={{ my: 2.5 }}>
        <DataCountDisplay
          count={totalElements}
          isLoading={isLoading}
          label="Total"
          unit="F.S.2 Documents"
        />
      </Box>

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
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f7' }}>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  py: 2,
                  width: 50,
                  minWidth: 50,
                  textAlign: 'center',
                  ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 3, bgcolor: '#f5f5f7' }),
                  ...(isLastStickyColumn('no') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                }}
              >
                No
              </TableCell>
              <TableCell 
                sortDirection={orderBy === 'namaAplikasi' ? order : false}
                sx={{ 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  py: 2,
                  minWidth: 150,
                  ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 3, bgcolor: '#f5f5f7' }),
                  ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                }}
              >
                <TableSortLabel
                  active={orderBy === 'namaAplikasi'}
                  direction={orderBy === 'namaAplikasi' ? order : 'asc'}
                  onClick={() => handleRequestSort('namaAplikasi')}
                >
                  Nama Aplikasi
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sortDirection={orderBy === 'namaFs2' ? order : false}
                sx={{ 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  py: 2,
                  minWidth: 180,
                  ...(stickyColumns.has('namaFs2') && { position: 'sticky', left: getStickyLeft('namaFs2'), zIndex: 3, bgcolor: '#f5f5f7' }),
                  ...(isLastStickyColumn('namaFs2') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                }}
              >
                <TableSortLabel
                  active={orderBy === 'namaFs2'}
                  direction={orderBy === 'namaFs2' ? order : 'asc'}
                  onClick={() => handleRequestSort('namaFs2')}
                >
                  Nama FS2
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                py: 2, 
                minWidth: 180,
                ...(stickyColumns.has('statusTahapan') && { position: 'sticky', left: getStickyLeft('statusTahapan'), zIndex: 3, bgcolor: '#f5f5f7' }),
                ...(isLastStickyColumn('statusTahapan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
              }}>Status Tahapan Aplikasi</TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                py: 2, 
                minWidth: 100,
                ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 3, bgcolor: '#f5f5f7' }),
                ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
              }}>SKPA</TableCell>
              {/* HIDDEN: Urgensi column as per requirement */}
              {/* <TableCell sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                py: 2, 
                minWidth: 100,
                ...(stickyColumns.has('urgensi') && { position: 'sticky', left: getStickyLeft('urgensi'), zIndex: 3, bgcolor: '#f5f5f7' }),
                ...(isLastStickyColumn('urgensi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
              }}>Urgensi</TableCell> */}
              <TableCell 
                sortDirection={orderBy === 'tanggalPengajuan' ? order : false}
                sx={{ 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  py: 2,
                  minWidth: 150,
                  ...(stickyColumns.has('tanggalPengajuan') && { position: 'sticky', left: getStickyLeft('tanggalPengajuan'), zIndex: 3, bgcolor: '#f5f5f7' }),
                  ...(isLastStickyColumn('tanggalPengajuan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                }}
              >
                <TableSortLabel
                  active={orderBy === 'tanggalPengajuan'}
                  direction={orderBy === 'tanggalPengajuan' ? order : 'asc'}
                  onClick={() => handleRequestSort('tanggalPengajuan')}
                >
                  Tanggal Pengajuan
                </TableSortLabel>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  py: 2,
                  minWidth: 90,
                }}
              >
                Docs F.S.2
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  py: 2,
                  minWidth: 130,
                }}
              >
                Tgl Berkas FS2
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                py: 2, 
                minWidth: 130,
                ...(stickyColumns.has('status') && { position: 'sticky', left: getStickyLeft('status'), zIndex: 3, bgcolor: '#f5f5f7' }),
                ...(isLastStickyColumn('status') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
              }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', py: 2, minWidth: 120 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={40} sx={{ color: '#DA251C' }} />
                  <Typography variant="body2" sx={{ mt: 2, color: '#86868b' }}>
                    Memuat data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredFs2Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" sx={{ color: '#86868b' }}>
                    Tidak ada data F.S.2 ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFs2Data.map((row, index) => {
                const skpaColor = getSkpaColor(row.skpa);
                return (
                  <TableRow 
                    key={row.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(218, 37, 28, 0.02)',
                      },
                      '&:not(:last-child)': {
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      },
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        color: '#86868b', 
                        py: 2,
                        textAlign: 'center',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        minWidth: 50,
                        ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 1, bgcolor: '#fff' }),
                        ...(isLastStickyColumn('no') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                      }}
                    >
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2, 
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
                          fontSize: '0.85rem',
                        }}
                      >
                        {row.namaAplikasi}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2, 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word',
                      minWidth: 180,
                      ...(stickyColumns.has('namaFs2') && { position: 'sticky', left: getStickyLeft('namaFs2'), zIndex: 1, bgcolor: '#fff' }),
                      ...(isLastStickyColumn('namaFs2') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1d1d1f',
                          fontSize: '0.85rem',
                        }}
                      >
                        {row.namaFs2}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2,
                      minWidth: 180,
                      ...(stickyColumns.has('statusTahapan') && { position: 'sticky', left: getStickyLeft('statusTahapan'), zIndex: 1, bgcolor: '#fff' }),
                      ...(isLastStickyColumn('statusTahapan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                    }}>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.85rem' }}>
                        {STATUS_TAHAPAN_LABELS[row.statusTahapan] || row.statusTahapan}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2,
                      minWidth: 100,
                      ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 1, bgcolor: '#fff' }),
                      ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                    }}>
                      <Chip
                        label={row.skpa}
                        size="small"
                        sx={{
                          bgcolor: skpaColor.bg,
                          color: skpaColor.text,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 24,
                          borderRadius: '6px',
                        }}
                      />
                    </TableCell>
                    {/* HIDDEN: Urgensi column as per requirement */}
                    {/* <TableCell sx={{ 
                      py: 2,
                      minWidth: 100,
                      ...(stickyColumns.has('urgensi') && { position: 'sticky', left: getStickyLeft('urgensi'), zIndex: 1, bgcolor: '#fff' }),
                      ...(isLastStickyColumn('urgensi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                    }}>
                      <Chip
                        label={row.urgensi}
                        size="small"
                        sx={{
                          bgcolor: row.urgensi === 'TINGGI' ? 'rgba(220, 38, 38, 0.1)' : row.urgensi === 'SEDANG' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: row.urgensi === 'TINGGI' ? '#DC2626' : row.urgensi === 'SEDANG' ? '#F59E0B' : '#22C55E',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 24,
                          borderRadius: '6px',
                        }}
                      />
                    </TableCell> */}
                    <TableCell sx={{ 
                      py: 2,
                      minWidth: 150,
                      ...(stickyColumns.has('tanggalPengajuan') && { position: 'sticky', left: getStickyLeft('tanggalPengajuan'), zIndex: 1, bgcolor: '#fff' }),
                      ...(isLastStickyColumn('tanggalPengajuan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1d1d1f',
                          fontSize: '0.85rem',
                        }}
                      >
                        {formatDate(row.tanggalPengajuan)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Tooltip title="Lihat Dokumen F.S.2">
                        <IconButton
                          onClick={() => handleOpenFilePreviewDialog(row.id)}
                          size="small"
                          sx={{
                            color: '#DA251C',
                            bgcolor: 'rgba(218, 37, 28, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(218, 37, 28, 0.15)',
                            },
                          }}
                        >
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ py: 2, minWidth: 130 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#1d1d1f',
                          fontSize: '0.85rem',
                        }}
                      >
                        {formatDate((rawData.find(d => d.id === row.id) as Fs2DocumentData)?.tanggal_berkas_fs2)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      py: 2,
                      minWidth: 130,
                      ...(stickyColumns.has('status') && { position: 'sticky', left: getStickyLeft('status'), zIndex: 1, bgcolor: '#fff' }),
                      ...(isLastStickyColumn('status') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }),
                    }}>
                      <Box
                        onClick={fs2Permissions.canUpdate ? (e) => handleStatusMenuOpen(e, row.id) : undefined}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          bgcolor: `${getStatusColor(row.status)}15`,
                          borderRadius: '6px',
                          cursor: fs2Permissions.canUpdate ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          border: `1px solid ${getStatusColor(row.status)}30`,
                          '&:hover': fs2Permissions.canUpdate ? {
                            bgcolor: `${getStatusColor(row.status)}25`,
                          } : {},
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            color: getStatusColor(row.status),
                          }}
                        >
                          {STATUS_LABELS[row.status]}
                        </Typography>
                        {fs2Permissions.canUpdate && (
                          <ArrowDownIcon sx={{ fontSize: 14, color: getStatusColor(row.status) }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Lihat Detail F.S.2">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenViewModal(row.id)}
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
                        {fs2Permissions.canUpdate && (
                          <Tooltip title="Edit F.S.2">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModal(row.id)}
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
                        )}
                        {fs2Permissions.canDelete && (
                          <Tooltip title="Hapus F.S.2">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(row.id)}
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
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalElements}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Baris per halaman:"
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

      {/* Add Modal */}
      <Dialog 
        open={openAddModal} 
        onClose={handleCloseAddModal} 
        maxWidth="md" 
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
            Tambah F.S.2
          </Typography>
          <IconButton
            onClick={handleCloseAddModal}
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
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Section 1: Informasi Dasar */}
            <Accordion
              expanded={expandedSection === 'section0'}
              onChange={handleAccordionChange('section0')}
              sx={{
                borderRadius: '20px !important',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                '&::before': { display: 'none' },
                '&.Mui-expanded': { margin: '0 !important' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  '&.Mui-expanded': { minHeight: 56 },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    fontSize: '0.95rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  1. Informasi Dasar
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Autocomplete
                    options={aplikasiList}
                    getOptionLabel={(option) => `${option.kode_aplikasi} - ${option.nama_aplikasi}`}
                    value={aplikasiList.find(a => a.id === formData.aplikasi_id) || null}
                    onChange={(_, newValue) => handleSelectChange('aplikasi_id', newValue?.id || '')}
                    renderInput={(params) => (
                      <GlassTextField 
                        {...params} 
                        label="1.1 Nama Aplikasi" 
                        required 
                        size="small"
                        error={!!errors.aplikasi_id}
                        helperText={errors.aplikasi_id}
                      />
                    )}
                    size="small"
                  />
                  <GlassTextField
                    label="1.2 Nama FS2"
                    size="small"
                    value={formData.nama_fs2 || ''}
                    onChange={(e) => setFormData({ ...formData, nama_fs2: e.target.value })}
                    required
                    error={!!errors.nama_fs2}
                    helperText={errors.nama_fs2}
                    fullWidth
                  />
                <FormControl fullWidth size="small" error={!!errors.status_tahapan}>
                  <InputLabel>1.3 Status Tahapan Aplikasi *</InputLabel>
                  <Select
                    value={formData.status_tahapan}
                    label="1.3 Status Tahapan Aplikasi *"
                    onChange={(e) => {
                      const value = e.target.value;
                      handleSelectChange('status_tahapan', value);
                      // Auto-sync fase_pengajuan with status_tahapan
                      setFormData(prev => ({ 
                        ...prev, 
                        fase_pengajuan: value,
                        // Clear PKSI and jadwal when switching status tahapan
                        pksi_id: '',
                        target_pengujian: '',
                        target_deployment: '',
                        target_go_live: '',
                      }));
                    }}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.6)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.08)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.15)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DA251C',
                      },
                    }}
                  >
                    <MenuItem value="DESAIN">Desain</MenuItem>
                    <MenuItem value="PEMELIHARAAN">Pemeliharaan</MenuItem>
                  </Select>
                  {errors.status_tahapan && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.status_tahapan}
                    </Typography>
                  )}
                </FormControl>
                {/* PKSI dropdown - only show when status_tahapan is DESAIN */}
                {formData.status_tahapan === 'DESAIN' && (
                  <Autocomplete
                    options={pksiList}
                    getOptionLabel={(option) => `${option.nama_aplikasi || ''} - ${option.nama_pksi}`}
                    value={pksiList.find(p => p.id === formData.pksi_id) || null}
                    onChange={(_, newValue) => {
                      const pksiId = newValue?.id || '';
                      handleSelectChange('pksi_id', pksiId);
                      
                      // Auto-fill jadwal pelaksanaan from PKSI
                      if (newValue) {
                        // Parse timelines - prefer new flexible structure, fallback to legacy
                        let targetUat = '';
                        let targetGoLive = '';
                        
                        if (newValue.timelines && newValue.timelines.length > 0) {
                          // Get the first UAT phase date
                          const uatTimeline = newValue.timelines.find(t => t.stage === 'UAT');
                          const goLiveTimeline = newValue.timelines.find(t => t.stage === 'GO_LIVE');
                          targetUat = uatTimeline?.target_date || '';
                          targetGoLive = goLiveTimeline?.target_date || '';
                        } else {
                          // Fallback to legacy fields
                          targetUat = newValue.target_uat || '';
                          targetGoLive = newValue.target_go_live || '';
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          pksi_id: pksiId,
                          // Target Pengujian FS2 = Target UAT dari PKSI
                          target_pengujian: targetUat,
                          // Target Deployment FS2 = Target Go Live dari PKSI
                          target_deployment: targetGoLive,
                          // Target Go Live FS2 = Target Go Live dari PKSI
                          target_go_live: targetGoLive,
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          pksi_id: '',
                          target_pengujian: '',
                          target_deployment: '',
                          target_go_live: '',
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <GlassTextField 
                        {...params} 
                        label="1.4 Pilih PKSI *" 
                        required 
                        size="small"
                        error={!!errors.pksi_id}
                        helperText={errors.pksi_id || "PKSI wajib dipilih untuk Status Tahapan Desain. Jadwal Pelaksanaan akan terisi otomatis."}
                      />
                    )}
                    size="small"
                  />
                )}
                <Autocomplete
                  options={skpaList}
                  getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                  value={skpaList.find(s => s.id === formData.skpa_id) || null}
                  onChange={(_, newValue) => handleSelectChange('skpa_id', newValue?.id || '')}
                  renderInput={(params) => (
                    <GlassTextField 
                      {...params} 
                      label={formData.status_tahapan === 'DESAIN' ? "1.5 Satuan Kerja Pemilik Aplikasi (SKPA)" : "1.4 Satuan Kerja Pemilik Aplikasi (SKPA)"} 
                      required 
                      size="small"
                      error={!!errors.skpa_id}
                      helperText={errors.skpa_id}
                    />
                  )}
                  size="small"
                />
                <GlassTextField
                  label={formData.status_tahapan === 'DESAIN' ? "1.6 Tanggal Pengajuan" : "1.5 Tanggal Pengajuan"}
                  type="date"
                  size="small"
                  value={formData.tanggal_pengajuan || ''}
                  onChange={(e) => handleSelectChange('tanggal_pengajuan', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                  error={!!errors.tanggal_pengajuan}
                  helperText={errors.tanggal_pengajuan}
                />
                {/* HIDDEN: Urgensi field as per requirement */}
                {/* <FormControl fullWidth size="small" error={!!errors.urgensi}>
                  <InputLabel>1.4 Urgensi *</InputLabel>
                  <Select
                    value={formData.urgensi}
                    label="1.4 Urgensi *"
                    onChange={(e) => handleSelectChange('urgensi', e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.6)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.08)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.15)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DA251C',
                      },
                    }}
                  >
                    <MenuItem value="RENDAH">Rendah</MenuItem>
                    <MenuItem value="SEDANG">Sedang</MenuItem>
                    <MenuItem value="TINGGI">Tinggi</MenuItem>
                  </Select>
                  {errors.urgensi && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {errors.urgensi}
                    </Typography>
                  )}
                </FormControl> */}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 2: Jadwal Pelaksanaan */}
            <Accordion
              expanded={expandedSection === 'section1'}
              onChange={handleAccordionChange('section1')}
              sx={{
                borderRadius: '20px !important',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                '&::before': { display: 'none' },
                '&.Mui-expanded': { margin: '0 !important' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  '&.Mui-expanded': { minHeight: 56 },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    fontSize: '0.95rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  2. Jadwal Pelaksanaan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                {/* Info alert when DESAIN is selected */}
                {formData.status_tahapan === 'DESAIN' && (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: '12px',
                      '& .MuiAlert-icon': { color: '#2563EB' }
                    }}
                  >
                    Jadwal Pelaksanaan terisi otomatis berdasarkan data PKSI yang dipilih. Target Pengujian = Target UAT PKSI, Target Deployment & Go Live = Target Go Live PKSI.
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, mb: 0.5, display: 'block' }}>
                      2.1 Target Pengujian {formData.status_tahapan === 'PEMELIHARAAN' ? '*' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_pengujian} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Bulan</InputLabel>
                        <Select
                          value={getMonthFromDate(formData.target_pengujian)}
                          label="Bulan"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_pengujian: buildDateFromMonthYear(e.target.value, getYearFromDate(formData.target_pengujian))
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {MONTH_OPTIONS.map((month) => (
                            <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_pengujian} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Tahun</InputLabel>
                        <Select
                          value={getYearFromDate(formData.target_pengujian)}
                          label="Tahun"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_pengujian: buildDateFromMonthYear(getMonthFromDate(formData.target_pengujian), e.target.value)
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {errors.target_pengujian && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>{errors.target_pengujian}</Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, mb: 0.5, display: 'block' }}>
                      2.2 Target Deployment {formData.status_tahapan === 'PEMELIHARAAN' ? '*' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_deployment} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Bulan</InputLabel>
                        <Select
                          value={getMonthFromDate(formData.target_deployment)}
                          label="Bulan"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_deployment: buildDateFromMonthYear(e.target.value, getYearFromDate(formData.target_deployment))
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {MONTH_OPTIONS.map((month) => (
                            <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_deployment} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Tahun</InputLabel>
                        <Select
                          value={getYearFromDate(formData.target_deployment)}
                          label="Tahun"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_deployment: buildDateFromMonthYear(getMonthFromDate(formData.target_deployment), e.target.value)
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {errors.target_deployment && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>{errors.target_deployment}</Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, mb: 0.5, display: 'block' }}>
                      2.3 Target Go Live {formData.status_tahapan === 'PEMELIHARAAN' ? '*' : ''}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_go_live} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Bulan</InputLabel>
                        <Select
                          value={getMonthFromDate(formData.target_go_live)}
                          label="Bulan"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_go_live: buildDateFromMonthYear(e.target.value, getYearFromDate(formData.target_go_live))
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {MONTH_OPTIONS.map((month) => (
                            <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_go_live} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Tahun</InputLabel>
                        <Select
                          value={getYearFromDate(formData.target_go_live)}
                          label="Tahun"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_go_live: buildDateFromMonthYear(getMonthFromDate(formData.target_go_live), e.target.value)
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {errors.target_go_live && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>{errors.target_go_live}</Typography>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Section 3: Upload Dokumen F.S.2 */}
            <Accordion
              expanded={expandedSection === 'section2'}
              onChange={handleAccordionChange('section2')}
              sx={{
                borderRadius: '20px !important',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                '&::before': { display: 'none' },
                '&.Mui-expanded': { margin: '0 !important' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  '&.Mui-expanded': { minHeight: 56 },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    fontSize: '0.95rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  3. Upload Berkas F.S.2
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  {/* Tanggal Berkas FS2 */}
                  <TextField
                    label="Tanggal Berkas FS2"
                    type="date"
                    value={formData.tanggal_berkas_fs2 || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal_berkas_fs2: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                        '&.Mui-focused': {
                          boxShadow: '0 4px 12px rgba(218, 37, 28, 0.15)',
                          '& fieldset': { borderColor: '#DA251C', borderWidth: '2px' },
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#DA251C', fontWeight: 600 },
                    }}
                  />
                  <Box
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    sx={{
                      border: isDragging ? '2px solid #DA251C' : '2px dashed #e5e5e7',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.7 : 1,
                      transition: 'all 0.2s ease-in-out',
                      background: isDragging
                        ? 'rgba(218, 37, 28, 0.08)'
                        : 'transparent',
                      '&:hover': {
                        borderColor: isUploading ? '#e5e5e7' : '#DA251C',
                        bgcolor: isUploading ? 'transparent' : 'rgba(218, 37, 28, 0.04)',
                      },
                    }}
                    onClick={() => !isUploading && document.getElementById('fs2-file-upload-input')?.click()}
                  >
                    <input
                      id="fs2-file-upload-input"
                      type="file"
                      hidden
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <>
                        <CircularProgress size={48} sx={{ color: '#DA251C', mb: 1 }} />
                        <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                          Mengupload file...
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
                        <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                          Klik untuk upload file
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
                          atau drag & drop file di sini
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>
                          Format yang didukung: PDF, Word (max 8MB)
                        </Typography>
                      </>
                    )}
                  </Box>

                  {uploadedFiles.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                        File yang diupload ({uploadedFiles.length})
                      </Typography>
                      <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px' }}>
                        {uploadedFiles.map((file, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              borderBottom: index < uploadedFiles.length - 1 ? '1px solid #e5e5e7' : 'none',
                            }}
                          >
                            <ListItemIcon>
                              <FileIcon sx={{ color: '#DA251C' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={file.name}
                              secondary={formatFileSize(file.size)}
                              primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f' } }}
                              secondaryTypographyProps={{ sx: { color: '#86868b' } }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveFile(index)}
                                disabled={isUploading}
                                sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {errors.upload_dokumen && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mt: 2, 
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { color: '#FF9500' }
                      }}
                    >
                      {errors.upload_dokumen}
                    </Alert>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseAddModal}
            disabled={isUploading}
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
            variant="contained" 
            onClick={handleAddFs2}
            disabled={isUploading}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog 
        open={openEditModal} 
        onClose={handleCloseEditModal} 
        maxWidth="md" 
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
            Edit F.S.2
          </Typography>
          <IconButton
            onClick={handleCloseEditModal}
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
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Section 1: Informasi Dasar */}
            <Accordion
              expanded={expandedSection === 'section0'}
              onChange={handleAccordionChange('section0')}
              sx={{
                borderRadius: '20px !important',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                '&::before': { display: 'none' },
                '&.Mui-expanded': { margin: '0 !important' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  '&.Mui-expanded': { minHeight: 56 },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    fontSize: '0.95rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  1. Informasi Dasar
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Autocomplete
                    options={aplikasiList}
                    getOptionLabel={(option) => `${option.kode_aplikasi} - ${option.nama_aplikasi}`}
                    value={aplikasiList.find(a => a.id === formData.aplikasi_id) || null}
                    onChange={(_, newValue) => setFormData({ ...formData, aplikasi_id: newValue?.id || '' })}
                    renderInput={(params) => (
                      <GlassTextField {...params} label="1.1 Nama Aplikasi" required size="small" />
                    )}
                    size="small"
                  />
                  <GlassTextField
                    label="1.2 Nama FS2"
                    size="small"
                    value={formData.nama_fs2 || ''}
                    onChange={(e) => setFormData({ ...formData, nama_fs2: e.target.value })}
                    required
                    fullWidth
                  />
                <FormControl fullWidth size="small">
                  <InputLabel>1.3 Status Tahapan Aplikasi</InputLabel>
                  <Select
                    value={formData.status_tahapan}
                    label="1.3 Status Tahapan Aplikasi"
                    onChange={(e) => {
                      const value = e.target.value;
                      
                      // If changing to DESAIN and there's already a PKSI selected, auto-fill target dates
                      if (value === 'DESAIN' && formData.pksi_id) {
                        const selectedPksi = pksiList.find(p => p.id === formData.pksi_id);
                        if (selectedPksi) {
                          let targetUat = '';
                          let targetGoLive = '';
                          
                          if (selectedPksi.timelines && selectedPksi.timelines.length > 0) {
                            const uatTimeline = selectedPksi.timelines.find(t => t.stage === 'UAT');
                            const goLiveTimeline = selectedPksi.timelines.find(t => t.stage === 'GO_LIVE');
                            targetUat = uatTimeline?.target_date || '';
                            targetGoLive = goLiveTimeline?.target_date || '';
                          } else {
                            targetUat = selectedPksi.target_uat || '';
                            targetGoLive = selectedPksi.target_go_live || '';
                          }
                          
                          setFormData(prev => ({
                            ...prev,
                            status_tahapan: value,
                            fase_pengajuan: value,
                            target_pengujian: targetUat,
                            target_deployment: targetGoLive,
                            target_go_live: targetGoLive,
                          }));
                          return;
                        }
                      }
                      
                      setFormData({ ...formData, status_tahapan: value, fase_pengajuan: value });
                    }}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.6)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.08)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.15)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DA251C',
                      },
                    }}
                  >
                    <MenuItem value="DESAIN">Desain</MenuItem>
                    <MenuItem value="PEMELIHARAAN">Pemeliharaan</MenuItem>
                  </Select>
                </FormControl>
                {/* PKSI dropdown - only show when status_tahapan is DESAIN (Edit Modal) */}
                {formData.status_tahapan === 'DESAIN' && (
                  <Autocomplete
                    options={pksiList}
                    getOptionLabel={(option) => `${option.nama_aplikasi || ''} - ${option.nama_pksi}`}
                    value={pksiList.find(p => p.id === formData.pksi_id) || null}
                    onChange={(_, newValue) => {
                      const pksiId = newValue?.id || '';
                      handleSelectChange('pksi_id', pksiId);
                      
                      // Auto-fill jadwal pelaksanaan from PKSI
                      if (newValue) {
                        // Parse timelines - prefer new flexible structure, fallback to legacy
                        let targetUat = '';
                        let targetGoLive = '';
                        
                        if (newValue.timelines && newValue.timelines.length > 0) {
                          // Get the first UAT phase date
                          const uatTimeline = newValue.timelines.find(t => t.stage === 'UAT');
                          const goLiveTimeline = newValue.timelines.find(t => t.stage === 'GO_LIVE');
                          targetUat = uatTimeline?.target_date || '';
                          targetGoLive = goLiveTimeline?.target_date || '';
                        } else {
                          // Fallback to legacy fields
                          targetUat = newValue.target_uat || '';
                          targetGoLive = newValue.target_go_live || '';
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          pksi_id: pksiId,
                          // Target Pengujian FS2 = Target UAT dari PKSI
                          target_pengujian: targetUat,
                          // Target Deployment FS2 = Target Go Live dari PKSI
                          target_deployment: targetGoLive,
                          // Target Go Live FS2 = Target Go Live dari PKSI
                          target_go_live: targetGoLive,
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          pksi_id: '',
                          target_pengujian: '',
                          target_deployment: '',
                          target_go_live: '',
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <GlassTextField 
                        {...params} 
                        label="1.4 PKSI Terkait" 
                        size="small"
                        helperText="PKSI yang dipilih saat membuat FS2"
                      />
                    )}
                    size="small"
                  />
                )}
                <Autocomplete
                  options={skpaList}
                  getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                  value={skpaList.find(s => s.id === formData.skpa_id) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, skpa_id: newValue?.id || '' })}
                  renderInput={(params) => (
                    <GlassTextField {...params} label={formData.status_tahapan === 'DESAIN' ? "1.5 Satuan Kerja Pemilik Aplikasi (SKPA)" : "1.4 Satuan Kerja Pemilik Aplikasi (SKPA)"} required size="small" />
                  )}
                  size="small"
                />
                <GlassTextField
                  label={formData.status_tahapan === 'DESAIN' ? "1.6 Tanggal Pengajuan" : "1.5 Tanggal Pengajuan"}
                  type="date"
                  size="small"
                  value={formData.tanggal_pengajuan || ''}
                  onChange={(e) => setFormData({ ...formData, tanggal_pengajuan: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                {/* HIDDEN: Urgensi field in Edit FS2 */}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 2: Jadwal Pelaksanaan */}
            <Accordion
              expanded={expandedSection === 'section1'}
              onChange={handleAccordionChange('section1')}
              sx={{
                borderRadius: '20px !important',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                '&::before': { display: 'none' },
                '&.Mui-expanded': { margin: '0 !important' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  '&.Mui-expanded': { minHeight: 56 },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    fontSize: '0.95rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  2. Jadwal Pelaksanaan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                {/* Info alert when DESAIN is selected */}
                {formData.status_tahapan === 'DESAIN' && (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: '12px',
                      '& .MuiAlert-icon': { color: '#2563EB' }
                    }}
                  >
                    Jadwal pelaksanaan pada tahapan Desain telah mengacu pada timeline dan target PKSI terkait.
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, mb: 0.5, display: 'block' }}>
                      2.1 Target Pengujian *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_pengujian} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Bulan</InputLabel>
                        <Select
                          value={getMonthFromDate(formData.target_pengujian)}
                          label="Bulan"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_pengujian: buildDateFromMonthYear(e.target.value, getYearFromDate(formData.target_pengujian))
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {MONTH_OPTIONS.map((month) => (
                            <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_pengujian} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Tahun</InputLabel>
                        <Select
                          value={getYearFromDate(formData.target_pengujian)}
                          label="Tahun"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_pengujian: buildDateFromMonthYear(getMonthFromDate(formData.target_pengujian), e.target.value)
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {errors.target_pengujian && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>{errors.target_pengujian}</Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, mb: 0.5, display: 'block' }}>
                      2.2 Target Deployment *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_deployment} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Bulan</InputLabel>
                        <Select
                          value={getMonthFromDate(formData.target_deployment)}
                          label="Bulan"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_deployment: buildDateFromMonthYear(e.target.value, getYearFromDate(formData.target_deployment))
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {MONTH_OPTIONS.map((month) => (
                            <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_deployment} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Tahun</InputLabel>
                        <Select
                          value={getYearFromDate(formData.target_deployment)}
                          label="Tahun"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_deployment: buildDateFromMonthYear(getMonthFromDate(formData.target_deployment), e.target.value)
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {errors.target_deployment && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>{errors.target_deployment}</Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, mb: 0.5, display: 'block' }}>
                      2.3 Target Go Live *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_go_live} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Bulan</InputLabel>
                        <Select
                          value={getMonthFromDate(formData.target_go_live)}
                          label="Bulan"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_go_live: buildDateFromMonthYear(e.target.value, getYearFromDate(formData.target_go_live))
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {MONTH_OPTIONS.map((month) => (
                            <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ flex: 1 }} error={!!errors.target_go_live} disabled={formData.status_tahapan === 'DESAIN'}>
                        <InputLabel>Tahun</InputLabel>
                        <Select
                          value={getYearFromDate(formData.target_go_live)}
                          label="Tahun"
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            target_go_live: buildDateFromMonthYear(getMonthFromDate(formData.target_go_live), e.target.value)
                          })}
                          sx={{ borderRadius: '12px', bgcolor: formData.status_tahapan === 'DESAIN' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.6)' }}
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year.value} value={year.value}>{year.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {errors.target_go_live && (
                      <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>{errors.target_go_live}</Typography>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Section 3: Upload Dokumen F.S.2 */}
            <Accordion
              expanded={expandedSection === 'section2'}
              onChange={handleAccordionChange('section2')}
              sx={{
                borderRadius: '20px !important',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                '&::before': { display: 'none' },
                '&.Mui-expanded': { margin: '0 !important' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
                sx={{
                  borderRadius: '20px',
                  px: 2.5,
                  '&.Mui-expanded': { minHeight: 56 },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    fontSize: '0.95rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  3. Upload Berkas F.S.2
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  {/* Tanggal Berkas FS2 */}
                  <TextField
                    label="Tanggal Berkas FS2"
                    type="date"
                    value={formData.tanggal_berkas_fs2 || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal_berkas_fs2: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                        '&.Mui-focused': {
                          boxShadow: '0 4px 12px rgba(218, 37, 28, 0.15)',
                          '& fieldset': { borderColor: '#DA251C', borderWidth: '2px' },
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#DA251C', fontWeight: 600 },
                    }}
                  />
                  {/* Existing Files Section */}
                  {isLoadingExistingFiles ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                    </Box>
                  ) : existingFs2Files.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                        File yang sudah diunggah ({existingFs2Files.length})
                      </Typography>
                      <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px' }}>
                        {existingFs2Files.map((file, index) => (
                          <ListItem
                            key={file.id}
                            sx={{
                              borderBottom: index < existingFs2Files.length - 1 ? '1px solid #e5e5e7' : 'none',
                            }}
                          >
                            <ListItemIcon>
                              <FileIcon sx={{ color: '#DA251C' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{file.display_name || file.original_name || file.file_name}</span>
                                  {file.version && file.version > 1 && (
                                    <Chip
                                      label={`V${file.version}`}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: '#31A24C',
                                        color: 'white',
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={formatFileSize(file.file_size)}
                              primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f' } }}
                              secondaryTypographyProps={{ sx: { color: '#86868b' } }}
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="Download">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDownloadExistingFile(file)}
                                  sx={{ color: '#86868b', '&:hover': { color: '#2563EB' }, mr: 0.5 }}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Hapus">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDeleteExistingFile(file.id)}
                                  sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#86868b', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                      Belum ada file yang diunggah
                    </Typography>
                  )}

                  {/* Upload New File Section */}
                  <Box
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleEditFileDrop}
                    sx={{
                      border: isDragging ? '2px solid #DA251C' : '2px dashed #e5e5e7',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.7 : 1,
                      transition: 'all 0.2s ease-in-out',
                      background: isDragging
                        ? 'rgba(218, 37, 28, 0.08)'
                        : 'transparent',
                      '&:hover': {
                        borderColor: isUploading ? '#e5e5e7' : '#DA251C',
                        bgcolor: isUploading ? 'transparent' : 'rgba(218, 37, 28, 0.04)',
                      },
                    }}
                    onClick={() => !isUploading && document.getElementById('fs2-edit-file-upload-input')?.click()}
                  >
                    <input
                      id="fs2-edit-file-upload-input"
                      type="file"
                      hidden
                      onChange={handleEditFileUpload}
                      accept=".pdf,.doc,.docx"
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <>
                        <CircularProgress size={48} sx={{ color: '#DA251C', mb: 1 }} />
                        <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                          Mengupload file...
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
                        <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                          Klik untuk upload file tambahan
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
                          atau drag & drop file di sini
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>
                          Format yang didukung: PDF, Word (max 8MB)
                        </Typography>
                      </>
                    )}
                  </Box>
                  {errors.upload_dokumen && existingFs2Files.length === 0 && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mt: 2, 
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { color: '#FF9500' }
                      }}
                    >
                      {errors.upload_dokumen}
                    </Alert>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseEditModal}
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
            variant="contained" 
            onClick={handleEditFs2}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              fontWeight: 500,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
      <ViewFs2Modal
        open={openViewModal}
        onClose={handleCloseViewModal}
        fs2Id={selectedFs2IdForView}
        showDocumentSection={true}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDeleteDialog}
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
            Apakah Anda yakin ingin menghapus F.S.2 ini? Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
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
            variant="contained" 
            onClick={handleDeleteFs2}
            disabled={isDeleting}
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

      {/* File Preview Dialog */}
      <Dialog
        open={openFilePreviewDialog}
        onClose={handleCloseFilePreviewDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: '#1d1d1f',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileIcon sx={{ color: '#DA251C' }} />
            Dokumen F.S.2
          </Box>
          <IconButton onClick={handleCloseFilePreviewDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isLoadingFilePreview ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: '#DA251C' }} />
            </Box>
          ) : filePreviewFiles.length > 0 ? (
            <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px', p: 1 }}>
              {filePreviewFiles.map((file, index) => (
                <ListItem
                  key={file.id}
                  sx={{
                    borderRadius: '8px',
                    mb: index < filePreviewFiles.length - 1 ? 1 : 0,
                    bgcolor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FileIcon sx={{ color: '#DA251C', fontSize: 24 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{file.display_name || file.original_name}</span>
                        {file.version && file.version > 1 && (
                          <Chip
                            label={`V${file.version}`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: '#31A24C',
                              color: 'white',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={formatFileSize(file.file_size)}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: 500,
                        color: '#1d1d1f',
                        fontSize: '0.9rem',
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: { color: '#86868b', fontSize: '0.75rem' },
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {isPreviewable(file.content_type) && (
                        <Tooltip title="Lihat">
                          <IconButton
                            size="small"
                            onClick={() => handleViewFileInNewTab(file)}
                            sx={{
                              color: '#DA251C',
                              '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.1)' },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Unduh">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadFilePreview(file)}
                          disabled={filePreviewDownloadingId === file.id}
                          sx={{
                            color: '#DA251C',
                            '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.1)' },
                          }}
                        >
                          {filePreviewDownloadingId === file.id ? (
                            <CircularProgress size={16} sx={{ color: '#DA251C' }} />
                          ) : (
                            <DownloadIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, color: '#86868b' }}>
              <FileIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">Tidak ada dokumen yang diunggah</Typography>
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
        downloadUrl={`/api/fs2/files/download/${previewFile?.id}`}
      />

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Fs2List;


