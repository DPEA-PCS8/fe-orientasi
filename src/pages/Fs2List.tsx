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
  Divider,
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
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';
import { 
  searchFs2Documents, 
  deleteFs2Document, 
  updateFs2Status, 
  createFs2Document,
  updateFs2Document,
  type Fs2DocumentData,
  type Fs2DocumentRequest 
} from '../api/fs2Api';
import { getAllAplikasi, type AplikasiData } from '../api/aplikasiApi';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { 
  uploadFs2TempFiles, 
  moveFs2TempFilesToPermanent, 
  deleteFs2TempFiles,
  deleteFs2File,
  type Fs2FileData 
} from '../api/fs2FileApi';

// Interface for transformed data
interface Fs2Data {
  id: string;
  namaAplikasi: string;
  bidang: string;
  skpa: string;
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
    bidang: apiData.nama_bidang || '-',
    skpa: apiData.kode_skpa || apiData.nama_skpa || '-',
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

function Fs2List() {
  const [keyword, setKeyword] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedFs2ForEdit, setSelectedFs2ForEdit] = useState<Fs2DocumentData | null>(null);
  const [selectedFs2ForView, setSelectedFs2ForView] = useState<Fs2DocumentData | null>(null);
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

  // Permission check for FS2 menu
  const { getMenuPermissions } = usePermissions();
  const fs2Permissions = getMenuPermissions('FS2_ALL');

  // Accordion expanded state for Add/Edit modal
  const [expandedSection, setExpandedSection] = useState<string | false>('section0');

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());
  const [selectedBidangFilter, setSelectedBidangFilter] = useState<string>('');
  const [selectedSkpaFilter, setSelectedSkpaFilter] = useState<string>('');

  // Reference data for dropdowns
  const [aplikasiList, setAplikasiList] = useState<AplikasiData[]>([]);
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);

  // Form state for Add/Edit modal
  const [formData, setFormData] = useState<Fs2DocumentRequest>({
    aplikasi_id: '',
    bidang_id: '',
    skpa_id: '',
    tanggal_pengajuan: new Date().toISOString().split('T')[0],
    // New form fields
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
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileData, setUploadedFileData] = useState<Fs2FileData[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [fs2ToDelete, setFs2ToDelete] = useState<string | null>(null);

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

      const response = await searchFs2Documents({
        search: keyword || undefined,
        status: statusFilter,
        bidang_id: selectedBidangFilter || undefined,
        skpa_id: selectedSkpaFilter || undefined,
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
  }, [keyword, page, rowsPerPage, selectedStatus, selectedBidangFilter, selectedSkpaFilter]);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [aplikasiRes, bidang, skpaRes] = await Promise.all([
          getAllAplikasi(),
          getAllBidang(),
          getAllSkpa(),
        ]);
        setAplikasiList(aplikasiRes.data || []);
        setBidangList(bidang);
        setSkpaList(skpaRes.data || []);
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
    setSelectedBidangFilter('');
    setSelectedSkpaFilter('');
  };

  // Accordion change handler for Add/Edit modal
  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && sessionId) {
      // Only take the first file (single file upload)
      const file = files[0];
      
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
        alert('Gagal mengupload file. Silakan coba lagi.');
      } finally {
        setIsUploading(false);
      }
    }
    // Reset input value to allow uploading same file again
    event.target.value = '';
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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatus.size > 0) count++;
    if (selectedBidangFilter) count++;
    if (selectedSkpaFilter) count++;
    return count;
  }, [selectedStatus, selectedBidangFilter, selectedSkpaFilter]);

  // Add modal handlers
  const handleOpenAddModal = () => {
    // Generate a unique session ID for temp file uploads
    const newSessionId = `fs2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setUploadedFiles([]);
    setUploadedFileData([]);
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
    setOpenAddModal(false);
  };

  const handleAddFs2 = async () => {
    try {
      const createdFs2 = await createFs2Document(formData);
      
      // Move temp files to permanent storage
      if (sessionId && uploadedFileData.length > 0) {
        await moveFs2TempFilesToPermanent(createdFs2.id, sessionId);
      }
      
      setOpenAddModal(false);
      fetchFs2Data();
    } catch (error) {
      console.error('Failed to create F.S.2:', error);
    }
  };

  // Edit modal handlers
  const handleOpenEditModal = (fs2Id: string) => {
    const fs2 = rawData.find(item => item.id === fs2Id);
    if (fs2) {
      setSelectedFs2ForEdit(fs2);
      setFormData({
        aplikasi_id: fs2.aplikasi_id || '',
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
      });
      setOpenEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedFs2ForEdit(null);
  };

  const handleEditFs2 = async () => {
    if (!selectedFs2ForEdit) return;
    try {
      await updateFs2Document(selectedFs2ForEdit.id, formData);
      setOpenEditModal(false);
      setSelectedFs2ForEdit(null);
      fetchFs2Data();
    } catch (error) {
      console.error('Failed to update F.S.2:', error);
    }
  };

  // View modal handlers
  const handleOpenViewModal = (fs2Id: string) => {
    const fs2 = rawData.find(item => item.id === fs2Id);
    if (fs2) {
      setSelectedFs2ForView(fs2);
      setOpenViewModal(true);
    }
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setSelectedFs2ForView(null);
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

  const handleDeleteFs2 = async () => {
    if (!fs2ToDelete) return;
    try {
      await deleteFs2Document(fs2ToDelete);
      handleCloseDeleteDialog();
      fetchFs2Data();
    } catch (error) {
      console.error('Failed to delete F.S.2:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
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
          }}
        >
          {/* Search & Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
          </Box>
          {fs2Permissions.canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
              sx={{
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                fontWeight: 500,
                px: 2.5,
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

          {/* Bidang Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              Bidang
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="bidang-filter-label">Pilih Bidang</InputLabel>
              <Select
                labelId="bidang-filter-label"
                value={selectedBidangFilter}
                label="Pilih Bidang"
                onChange={(e) => setSelectedBidangFilter(e.target.value)}
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
                <MenuItem value=""><em>Semua Bidang</em></MenuItem>
                {bidangList.map((bidang) => (
                  <MenuItem key={bidang.id} value={bidang.id}>{bidang.nama_bidang}</MenuItem>
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
      <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1000 }}>
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
              <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', py: 2, minWidth: 120 }}>Bidang</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', py: 2, minWidth: 100 }}>SKPA</TableCell>
              <TableCell 
                sortDirection={orderBy === 'tanggalPengajuan' ? order : false}
                sx={{ 
                  fontWeight: 600, 
                  color: '#1d1d1f', 
                  py: 2,
                  minWidth: 150,
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
              <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', py: 2, minWidth: 130 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1d1d1f', py: 2, minWidth: 120 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={40} sx={{ color: '#DA251C' }} />
                  <Typography variant="body2" sx={{ mt: 2, color: '#86868b' }}>
                    Memuat data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : fs2Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" sx={{ color: '#86868b' }}>
                    Tidak ada data F.S.2 ditemukan
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              fs2Data.map((row, index) => {
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
                      }}
                    >
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ py: 2, whiteSpace: 'normal', wordWrap: 'break-word' }}>
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
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.85rem' }}>
                        {row.bidang}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
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
                    <TableCell sx={{ py: 2 }}>
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
                <FormControl fullWidth size="small">
                  <InputLabel>1.2 Status Tahapan Aplikasi</InputLabel>
                  <Select
                    value={formData.status_tahapan}
                    label="1.2 Status Tahapan Aplikasi"
                    onChange={(e) => setFormData({ ...formData, status_tahapan: e.target.value })}
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
                <Autocomplete
                  options={skpaList}
                  getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                  value={skpaList.find(s => s.id === formData.skpa_id) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, skpa_id: newValue?.id || '' })}
                  renderInput={(params) => (
                    <GlassTextField {...params} label="1.3 Satuan Kerja Pemilik Aplikasi (SKPA)" required size="small" />
                  )}
                  size="small"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>1.4 Urgensi</InputLabel>
                  <Select
                    value={formData.urgensi}
                    label="1.4 Urgensi"
                    onChange={(e) => setFormData({ ...formData, urgensi: e.target.value })}
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
                </FormControl>
                <GlassTextField
                  label="1.5 Deskripsi Pengubahan"
                  value={formData.deskripsi_pengubahan}
                  onChange={(e) => setFormData({ ...formData, deskripsi_pengubahan: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                />
                <GlassTextField
                  label="1.6 Alasan Pengubahan"
                  value={formData.alasan_pengubahan}
                  onChange={(e) => setFormData({ ...formData, alasan_pengubahan: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 2: Kesesuaian Kriteria Pengubahan Aplikasi */}
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
                  2. Kesesuaian Kriteria Pengubahan Aplikasi
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Pengubahan ini telah dipastikan memenuhi Kriteria Pengajuan berikut:
                  <br />
                  <em style={{ fontSize: '0.85rem' }}>
                    *Jika salah satu kriteria tidak terpenuhi, pengubahan Aplikasi tidak dapat diajukan melalui F.S.2
                  </em>
                </Typography>
                <FormGroup sx={{ '& .MuiFormControlLabel-root': { mb: 1.5, alignItems: 'flex-start' }, '& .MuiCheckbox-root': { pt: 0.5 } }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_1 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_1: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.1 Tidak menambah fungsi baru dan/atau tidak mengubah fungsi yang sudah ada, yang berdampak struktural terhadap Aplikasi dan/atau dengan cakupan besar"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_2 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_2: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.2 Tidak menambah sumber data baru dari sistem lainnya, kecuali pengubahan untuk Aplikasi Reference Management, Aplikasi Data Master Management dan Aplikasi Convertion Engine"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_3 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_3: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.3 Tidak mengubah sumber data yang berdampak struktural terhadap Aplikasi atau Database dan/atau dengan cakupan besar"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_4 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_4: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.4 Tidak mengubah alur kerja Aplikasi"
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Section 3: Aspek Perubahan */}
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
                  3. Aspek Perubahan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  *Apa saja aspek perubahan yang terjadi yang diakibatkannya
                </Typography>
                <Stack spacing={2}>
                  <GlassTextField
                    label="3.1 Terhadap sistem yang ada"
                    value={formData.aspek_sistem_ada}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_ada: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                  <GlassTextField
                    label="3.2 Terhadap sistem terkait"
                    value={formData.aspek_sistem_terkait}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_terkait: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                  <GlassTextField
                    label="3.3 Terhadap alur kerja bisnis"
                    value={formData.aspek_alur_kerja}
                    onChange={(e) => setFormData({ ...formData, aspek_alur_kerja: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                  <GlassTextField
                    label="3.4 Terhadap struktur organisasi"
                    value={formData.aspek_struktur_organisasi}
                    onChange={(e) => setFormData({ ...formData, aspek_struktur_organisasi: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 4: Aspek Perubahan Terhadap Dokumentasi */}
            <Accordion
              expanded={expandedSection === 'section3'}
              onChange={handleAccordionChange('section3')}
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
                  4. Aspek Perubahan Terhadap Dokumentasi
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="body2" fontWeight={500}>
                    4.1 Dokumen T.0.1
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t01_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t01_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="body2" fontWeight={500}>
                    4.2 Dokumen T.1.1
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t11_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t11_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 5: Aspek Perubahan Terhadap Penggunaan Sistem */}
            <Accordion
              expanded={expandedSection === 'section4'}
              onChange={handleAccordionChange('section4')}
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
                  5. Aspek Perubahan Terhadap Penggunaan Sistem
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="body2" fontWeight={500}>
                    5.1 Jumlah Pengguna
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.pengguna_sebelum}
                        onChange={(e) => setFormData({ ...formData, pengguna_sebelum: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.pengguna_sesudah}
                        onChange={(e) => setFormData({ ...formData, pengguna_sesudah: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="body2" fontWeight={500}>
                    5.2 Jumlah akses secara bersamaan
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.akses_bersamaan_sebelum}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sebelum: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.akses_bersamaan_sesudah}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sesudah: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="body2" fontWeight={500}>
                    5.3 Jumlah pertumbuhan data per hari/bulan/tahun
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.pertumbuhan_data_sebelum}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sebelum: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.pertumbuhan_data_sesudah}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sesudah: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 6: Jadwal Pelaksanaan */}
            <Accordion
              expanded={expandedSection === 'section5'}
              onChange={handleAccordionChange('section5')}
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
                  6. Jadwal Pelaksanaan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  *Diisi untuk pengajuan di tahap pemeliharaan
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <GlassTextField
                      label="6.1 Target Pengujian"
                      type="date"
                      value={formData.target_pengujian}
                      onChange={(e) => setFormData({ ...formData, target_pengujian: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <GlassTextField
                      label="6.2 Target Deployment"
                      type="date"
                      value={formData.target_deployment}
                      onChange={(e) => setFormData({ ...formData, target_deployment: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <GlassTextField
                      label="6.3 Target Go Live"
                      type="date"
                      value={formData.target_go_live}
                      onChange={(e) => setFormData({ ...formData, target_go_live: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Section 7: Pernyataan */}
            <Accordion
              expanded={expandedSection === 'section6'}
              onChange={handleAccordionChange('section6')}
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
                  7. Pernyataan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <FormGroup sx={{ '& .MuiFormControlLabel-root': { mb: 1.5, alignItems: 'flex-start' }, '& .MuiCheckbox-root': { pt: 0.5 } }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                      *Diisi jika pengajuan pengubahan Aplikasi pada tahap Desain Aplikasi
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.pernyataan_1 || false}
                          onChange={(e) => setFormData({ ...formData, pernyataan_1: e.target.checked })}
                          sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                        />
                      }
                      label="7.1 Kami selaku Satuan Kerja Pemilik Aplikasi menyatakan bersedia menerima konsekuensi pengunduran jadwal implementasi (apabila ada) akibat pengubahan Aplikasi ini."
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                      *Diisi jika pengajuan pengubahan Aplikasi berdampak pada pengubahan Aplikasi lain
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.pernyataan_2 || false}
                          onChange={(e) => setFormData({ ...formData, pernyataan_2: e.target.checked })}
                          sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                        />
                      }
                      label="7.2 Dalam hal pengubahan Aplikasi berdampak pada pengubahan Aplikasi lain, Satuan Kerja Pemilik Aplikasi terdampak telah menyetujui dan memiliki rencana terkait pengembangan atau pengubahan Aplikasi tersebut (melampirkan risalah rapat)"
                    />
                  </Box>
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Section 8: Upload Dokumen F.S.2 */}
            <Accordion
              expanded={expandedSection === 'section7'}
              onChange={handleAccordionChange('section7')}
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
                  8. Upload Dokumen F.S.2
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      border: '2px dashed #e5e5e7',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.7 : 1,
                      transition: 'all 0.2s ease-in-out',
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
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
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
                          Format yang didukung: PDF, Word, Excel, Gambar (max 20MB)
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
                <FormControl fullWidth size="small">
                  <InputLabel>1.2 Status Tahapan Aplikasi</InputLabel>
                  <Select
                    value={formData.status_tahapan}
                    label="1.2 Status Tahapan Aplikasi"
                    onChange={(e) => setFormData({ ...formData, status_tahapan: e.target.value })}
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
                <Autocomplete
                  options={skpaList}
                  getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                  value={skpaList.find(s => s.id === formData.skpa_id) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, skpa_id: newValue?.id || '' })}
                  renderInput={(params) => (
                    <GlassTextField {...params} label="1.3 Satuan Kerja Pemilik Aplikasi (SKPA)" required size="small" />
                  )}
                  size="small"
                />
                <FormControl fullWidth size="small">
                  <InputLabel>1.4 Urgensi</InputLabel>
                  <Select
                    value={formData.urgensi}
                    label="1.4 Urgensi"
                    onChange={(e) => setFormData({ ...formData, urgensi: e.target.value })}
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
                </FormControl>
                <GlassTextField
                  label="1.5 Deskripsi Pengubahan"
                  value={formData.deskripsi_pengubahan}
                  onChange={(e) => setFormData({ ...formData, deskripsi_pengubahan: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                />
                <GlassTextField
                  label="1.6 Alasan Pengubahan"
                  value={formData.alasan_pengubahan}
                  onChange={(e) => setFormData({ ...formData, alasan_pengubahan: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 2: Kesesuaian Kriteria Pengubahan Aplikasi */}
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
                  2. Kesesuaian Kriteria Pengubahan Aplikasi
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Pengubahan ini telah dipastikan memenuhi Kriteria Pengajuan berikut:
                  <br />
                  <em style={{ fontSize: '0.85rem' }}>
                    *Jika salah satu kriteria tidak terpenuhi, pengubahan Aplikasi tidak dapat diajukan melalui F.S.2
                  </em>
                </Typography>
                <FormGroup sx={{ '& .MuiFormControlLabel-root': { mb: 1.5, alignItems: 'flex-start' }, '& .MuiCheckbox-root': { pt: 0.5 } }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_1 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_1: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.1 Tidak menambah fungsi baru dan/atau tidak mengubah fungsi yang sudah ada, yang berdampak struktural terhadap Aplikasi dan/atau dengan cakupan besar"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_2 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_2: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.2 Tidak menambah sumber data baru dari sistem lainnya, kecuali pengubahan untuk Aplikasi Reference Management, Aplikasi Data Master Management dan Aplikasi Convertion Engine"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_3 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_3: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.3 Tidak mengubah sumber data yang berdampak struktural terhadap Aplikasi atau Database dan/atau dengan cakupan besar"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.kriteria_4 || false}
                        onChange={(e) => setFormData({ ...formData, kriteria_4: e.target.checked })}
                        sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                      />
                    }
                    label="2.4 Tidak mengubah alur kerja Aplikasi"
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Section 3: Aspek Perubahan */}
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
                  3. Aspek Perubahan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  *Apa saja aspek perubahan yang terjadi yang diakibatkannya
                </Typography>
                <Stack spacing={2}>
                  <GlassTextField
                    label="3.1 Terhadap sistem yang ada"
                    value={formData.aspek_sistem_ada}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_ada: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                  <GlassTextField
                    label="3.2 Terhadap sistem terkait"
                    value={formData.aspek_sistem_terkait}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_terkait: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                  <GlassTextField
                    label="3.3 Terhadap alur kerja bisnis"
                    value={formData.aspek_alur_kerja}
                    onChange={(e) => setFormData({ ...formData, aspek_alur_kerja: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                  <GlassTextField
                    label="3.4 Terhadap struktur organisasi"
                    value={formData.aspek_struktur_organisasi}
                    onChange={(e) => setFormData({ ...formData, aspek_struktur_organisasi: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 4: Aspek Perubahan Terhadap Dokumentasi */}
            <Accordion
              expanded={expandedSection === 'section3'}
              onChange={handleAccordionChange('section3')}
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
                  4. Aspek Perubahan Terhadap Dokumentasi
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="body2" fontWeight={500}>
                    4.1 Dokumen T.0.1
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t01_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t01_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="body2" fontWeight={500}>
                    4.2 Dokumen T.1.1
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t11_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t11_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 5: Aspek Perubahan Terhadap Penggunaan Sistem */}
            <Accordion
              expanded={expandedSection === 'section4'}
              onChange={handleAccordionChange('section4')}
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
                  5. Aspek Perubahan Terhadap Penggunaan Sistem
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="body2" fontWeight={500}>
                    5.1 Jumlah Pengguna
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.pengguna_sebelum}
                        onChange={(e) => setFormData({ ...formData, pengguna_sebelum: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.pengguna_sesudah}
                        onChange={(e) => setFormData({ ...formData, pengguna_sesudah: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="body2" fontWeight={500}>
                    5.2 Jumlah akses secara bersamaan
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.akses_bersamaan_sebelum}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sebelum: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.akses_bersamaan_sesudah}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sesudah: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="body2" fontWeight={500}>
                    5.3 Jumlah pertumbuhan data per hari/bulan/tahun
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sebelum Pengubahan"
                        value={formData.pertumbuhan_data_sebelum}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sebelum: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <GlassTextField
                        label="Sesudah Pengubahan"
                        value={formData.pertumbuhan_data_sesudah}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sesudah: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 6: Jadwal Pelaksanaan */}
            <Accordion
              expanded={expandedSection === 'section5'}
              onChange={handleAccordionChange('section5')}
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
                  6. Jadwal Pelaksanaan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  *Diisi untuk pengajuan di tahap pemeliharaan
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <GlassTextField
                      label="6.1 Target Pengujian"
                      type="date"
                      value={formData.target_pengujian}
                      onChange={(e) => setFormData({ ...formData, target_pengujian: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <GlassTextField
                      label="6.2 Target Deployment"
                      type="date"
                      value={formData.target_deployment}
                      onChange={(e) => setFormData({ ...formData, target_deployment: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <GlassTextField
                      label="6.3 Target Go Live"
                      type="date"
                      value={formData.target_go_live}
                      onChange={(e) => setFormData({ ...formData, target_go_live: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Section 7: Pernyataan */}
            <Accordion
              expanded={expandedSection === 'section6'}
              onChange={handleAccordionChange('section6')}
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
                  7. Pernyataan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <FormGroup sx={{ '& .MuiFormControlLabel-root': { mb: 1.5, alignItems: 'flex-start' }, '& .MuiCheckbox-root': { pt: 0.5 } }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                      *Diisi jika pengajuan pengubahan Aplikasi pada tahap Desain Aplikasi
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.pernyataan_1 || false}
                          onChange={(e) => setFormData({ ...formData, pernyataan_1: e.target.checked })}
                          sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                        />
                      }
                      label="7.1 Kami selaku Satuan Kerja Pemilik Aplikasi menyatakan bersedia menerima konsekuensi pengunduran jadwal implementasi (apabila ada) akibat pengubahan Aplikasi ini."
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                      *Diisi jika pengajuan pengubahan Aplikasi berdampak pada pengubahan Aplikasi lain
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.pernyataan_2 || false}
                          onChange={(e) => setFormData({ ...formData, pernyataan_2: e.target.checked })}
                          sx={{ '&.Mui-checked': { color: '#DA251C' } }}
                        />
                      }
                      label="7.2 Dalam hal pengubahan Aplikasi berdampak pada pengubahan Aplikasi lain, Satuan Kerja Pemilik Aplikasi terdampak telah menyetujui dan memiliki rencana terkait pengembangan atau pengubahan Aplikasi tersebut (melampirkan risalah rapat)"
                    />
                  </Box>
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Section 8: Upload Dokumen F.S.2 */}
            <Accordion
              expanded={expandedSection === 'section7'}
              onChange={handleAccordionChange('section7')}
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
                  8. Upload Dokumen F.S.2
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      border: '2px dashed #e5e5e7',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: '#DA251C',
                        bgcolor: 'rgba(218, 37, 28, 0.04)',
                      },
                    }}
                    onClick={() => document.getElementById('fs2-edit-file-upload-input')?.click()}
                  >
                    <input
                      id="fs2-edit-file-upload-input"
                      type="file"
                      hidden
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />
                    <CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
                    <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                      Klik untuk upload file
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
                      atau drag & drop file di sini
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>
                      Format yang didukung: PDF, Word, Excel, Gambar (max 20MB)
                    </Typography>
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
      <Dialog 
        open={openViewModal} 
        onClose={handleCloseViewModal} 
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
            Detail F.S.2
          </Typography>
          <IconButton
            onClick={handleCloseViewModal}
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
          {selectedFs2ForView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* Basic Information */}
              <Typography variant="subtitle1" fontWeight={600}>Informasi Dasar</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Aplikasi</Typography>
                  <Typography>{selectedFs2ForView.nama_aplikasi || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">SKPA</Typography>
                  <Typography>{selectedFs2ForView.kode_skpa || selectedFs2ForView.nama_skpa || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Bidang</Typography>
                  <Typography>{selectedFs2ForView.nama_bidang || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Tanggal Pengajuan</Typography>
                  <Typography>{formatDate(selectedFs2ForView.tanggal_pengajuan || '')}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography>{selectedFs2ForView.status}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Description */}
              <Typography variant="subtitle1" fontWeight={600}>Deskripsi Pengubahan</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Deskripsi Pengubahan</Typography>
                  <Typography>{selectedFs2ForView.deskripsi_pengubahan || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Alasan Pengubahan</Typography>
                  <Typography>{selectedFs2ForView.alasan_pengubahan || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Status Tahapan Aplikasi</Typography>
                  <Typography>{selectedFs2ForView.status_tahapan || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Urgensi</Typography>
                  <Typography>{selectedFs2ForView.urgensi || '-'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Kriteria */}
              <Typography variant="subtitle1" fontWeight={600}>Kesesuaian Kriteria Pengubahan Aplikasi</Typography>
              <Box>
                <Typography variant="body2">
                  1. Tidak menambah fungsi baru: {selectedFs2ForView.kriteria_1 ? '✓ Ya' : '✗ Tidak'}
                </Typography>
                <Typography variant="body2">
                  2. Tidak menambah sumber data baru: {selectedFs2ForView.kriteria_2 ? '✓ Ya' : '✗ Tidak'}
                </Typography>
                <Typography variant="body2">
                  3. Tidak mengubah sumber data: {selectedFs2ForView.kriteria_3 ? '✓ Ya' : '✗ Tidak'}
                </Typography>
                <Typography variant="body2">
                  4. Tidak mengubah alur kerja: {selectedFs2ForView.kriteria_4 ? '✓ Ya' : '✗ Tidak'}
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Aspek Perubahan */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>Aspek Perubahan</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">1. Terhadap sistem yang ada</Typography>
                      <Typography>{selectedFs2ForView.aspek_sistem_ada || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">2. Terhadap sistem terkait</Typography>
                      <Typography>{selectedFs2ForView.aspek_sistem_terkait || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">3. Terhadap alur kerja bisnis</Typography>
                      <Typography>{selectedFs2ForView.aspek_alur_kerja || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">4. Terhadap struktur organisasi</Typography>
                      <Typography>{selectedFs2ForView.aspek_struktur_organisasi || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" fontWeight={500}>5.1 Dokumen T.0.1</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sebelum</Typography>
                      <Typography>{selectedFs2ForView.dok_t01_sebelum || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sesudah</Typography>
                      <Typography>{selectedFs2ForView.dok_t01_sesudah || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" fontWeight={500}>5.2 Dokumen T.1.1</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sebelum</Typography>
                      <Typography>{selectedFs2ForView.dok_t11_sebelum || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sesudah</Typography>
                      <Typography>{selectedFs2ForView.dok_t11_sesudah || '-'}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Penggunaan Sistem */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={600}>6. Terhadap Penggunaan Sistem</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" fontWeight={500}>6.1 Jumlah Pengguna</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sebelum</Typography>
                      <Typography>{selectedFs2ForView.pengguna_sebelum || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sesudah</Typography>
                      <Typography>{selectedFs2ForView.pengguna_sesudah || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" fontWeight={500}>6.2 Jumlah akses bersamaan</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sebelum</Typography>
                      <Typography>{selectedFs2ForView.akses_bersamaan_sebelum || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sesudah</Typography>
                      <Typography>{selectedFs2ForView.akses_bersamaan_sesudah || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" fontWeight={500}>6.3 Pertumbuhan data</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sebelum</Typography>
                      <Typography>{selectedFs2ForView.pertumbuhan_data_sebelum || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Sesudah</Typography>
                      <Typography>{selectedFs2ForView.pertumbuhan_data_sesudah || '-'}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Divider sx={{ my: 1 }} />

              {/* Jadwal */}
              <Typography variant="subtitle1" fontWeight={600}>Jadwal Pelaksanaan</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">Target Pengujian</Typography>
                  <Typography>{formatDate(selectedFs2ForView.target_pengujian || '')}</Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">Target Deployment</Typography>
                  <Typography>{formatDate(selectedFs2ForView.target_deployment || '')}</Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">Target Go Live</Typography>
                  <Typography>{formatDate(selectedFs2ForView.target_go_live || '')}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Pernyataan */}
              <Typography variant="subtitle1" fontWeight={600}>Pernyataan</Typography>
              <Box>
                <Typography variant="body2">
                  1. Bersedia menerima konsekuensi: {selectedFs2ForView.pernyataan_1 ? '✓ Ya' : '✗ Tidak'}
                </Typography>
                <Typography variant="body2">
                  2. Satker terdampak telah menyetujui: {selectedFs2ForView.pernyataan_2 ? '✓ Ya' : '✗ Tidak'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseViewModal}
            sx={{
              color: '#86868b',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

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
            sx={{
              bgcolor: '#DC2626',
              '&:hover': {
                bgcolor: '#B91C1C',
              },
            }}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fs2List;


