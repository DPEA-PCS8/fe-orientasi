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
  Link,
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
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { AddPksiModal, EditPksiModal, ViewPksiModal } from '../components/modals';
import { usePermissions } from '../hooks/usePermissions';
import { deletePksiDocument, searchPksiDocuments, updatePksiStatus, type PksiDocumentData } from '../api/pksiApi';
import { getUsersByRole, type UserSimple } from '../api/userApi';
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
}

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
  // Map backend status to frontend status
  const mapStatus = (status: string): PksiData['status'] => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'disetujui' || statusLower === 'approved') return 'disetujui';
    if (statusLower === 'ditolak' || statusLower === 'rejected' || statusLower === 'tidak_disetujui') return 'tidak_disetujui';
    return 'pending';
  };

  return {
    id: apiData.id,
    namaPksi: apiData.nama_pksi,
    namaAplikasi: apiData.nama_aplikasi || '-',
    picSatkerBA: apiData.pic_satker_names || apiData.pic_satker_ba || '-',
    jangkaWaktu: calculateJangkaWaktu(apiData),
    tanggalPengajuan: apiData.tanggal_pengajuan || apiData.created_at || '',
    linkDocsT01: '', // Will be populated when document upload is implemented
    status: mapStatus(apiData.status),
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
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPksiId, setSelectedPksiId] = useState<string | null>(null);

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

  // Users with Pengembang role for PIC and Anggota Tim dropdowns
  const [pengembangUsers, setPengembangUsers] = useState<UserSimple[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Approval form state
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [pendingApprovalPksiId, setPendingApprovalPksiId] = useState<string | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    pic: '', // UUID of selected PIC
    picName: '', // Name for display
    anggotaTim: [] as string[], // UUIDs of selected team members
    anggotaTimNames: [] as string[], // Names for display
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

      const response = await searchPksiDocuments({
        search: keyword || undefined,
        status: statusFilter,
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
      console.log('PKSI Response:', response);
      console.log('Total Elements:', response.total_elements);
      console.log('========================');

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
  }, [keyword, page, rowsPerPage, orderBy, order, selectedStatus, userDepartment, userRoles, isAdminOrPengembang]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchPksiData();
  }, [fetchPksiData]);

  // Fetch users with Admin and Pengembang roles for PIC and Anggota Tim
  useEffect(() => {
    const fetchEligibleUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await getUsersByRole('Admin,Pengembang');
        setPengembangUsers(users);
      } catch (error) {
        console.error('Failed to fetch eligible users:', error);
        setPengembangUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchEligibleUsers();
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
        pic: '',
        picName: '',
        anggotaTim: [],
        anggotaTimNames: [],
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
    if (!pendingApprovalPksiId || !approvalForm.pic || approvalForm.anggotaTim.length === 0) {
      alert('Mohon isi semua field yang diperlukan');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      // Update status to DISETUJUI with approval data
      // Send UUIDs for storage, names for display
      await updatePksiStatus(pendingApprovalPksiId, 'DISETUJUI', {
        iku: approvalForm.iku,
        inhouse_outsource: approvalForm.inhouseOutsource,
        pic_approval: approvalForm.pic,
        pic_approval_name: approvalForm.picName,
        anggota_tim: approvalForm.anggotaTim.join(', '),
        anggota_tim_names: approvalForm.anggotaTimNames.join(', '),
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
      pic: '',
      picName: '',
      anggotaTim: [],
      anggotaTimNames: [],
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
  };

  // Generate year options from data
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

  // Filter locally for jangkaWaktu, year, aplikasi, and skpa
  const filteredPksi = useMemo(() => {
    let result = pksiData;
    
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

  const handleSort = (property: keyof PksiData) => {
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
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1d1d1f',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          Dashboard PKSI
        </Typography>
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

        {/* Table */}
        <TableContainer sx={{ 
          width: '100%', 
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.03)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 4,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 1)',
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
                    onClick={() => handleSort('namaAplikasi')}
                  >
                    Nama Aplikasi
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'namaPksi' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 200,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'namaPksi'}
                    direction={orderBy === 'namaPksi' ? order : 'asc'}
                    onClick={() => handleSort('namaPksi')}
                  >
                    Nama PKSI
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'picSatkerBA' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'picSatkerBA'}
                    direction={orderBy === 'picSatkerBA' ? order : 'asc'}
                    onClick={() => handleSort('picSatkerBA')}
                  >
                    SKPA
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'jangkaWaktu' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 120,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'jangkaWaktu'}
                    direction={orderBy === 'jangkaWaktu' ? order : 'asc'}
                    onClick={() => handleSort('jangkaWaktu')}
                  >
                    Jangka Waktu
                  </TableSortLabel>
                </TableCell>
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
                    onClick={() => handleSort('tanggalPengajuan')}
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
                  Docs T.01
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'status' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 130,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? order : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 100,
                  }}
                >
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#DA251C' }} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#86868b' }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      Tidak ada data PKSI ditemukan
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.map((item, index) => (
                <TableRow 
                  key={item.id}
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
                      {item.namaAplikasi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: '#1d1d1f',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.namaPksi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                                fontSize: '0.7rem',
                                height: 24,
                                borderRadius: '6px',
                              }}
                            />
                          );
                        })
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={item.jangkaWaktu === 'Single Year' ? 'Single Year' : 'Multiyears'}
                      size="small"
                      sx={{
                        bgcolor: item.jangkaWaktu === 'Single Year' 
                          ? 'rgba(139, 92, 246, 0.1)' 
                          : 'rgba(37, 99, 235, 0.1)',
                        color: item.jangkaWaktu === 'Single Year' ? '#8B5CF6' : '#2563EB',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 26,
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
                      {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Tooltip title="Buka dokumen T.01">
                      <IconButton
                        component={Link}
                        href={item.linkDocsT01}
                        target="_blank"
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
                  <TableCell sx={{ py: 2 }}>
                    <Box
                      onClick={(e) => handleStatusMenuOpen(e, item.id)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        bgcolor: `${getStatusColor(item.status)}15`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: `1px solid ${getStatusColor(item.status)}30`,
                        '&:hover': {
                          bgcolor: `${getStatusColor(item.status)}25`,
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: getStatusColor(item.status),
                        }}
                      >
                        {STATUS_LABELS[item.status]}
                      </Typography>
                      <ArrowDownIcon sx={{ fontSize: 14, color: getStatusColor(item.status) }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
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

            {/* PIC Field */}
            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <InputLabel id="pic-label">PIC (User) *</InputLabel>
              <Select
                labelId="pic-label"
                value={approvalForm.pic}
                label="PIC (User) *"
                onChange={(e) => {
                  const selectedUser = pengembangUsers.find(u => u.uuid === e.target.value);
                  setApprovalForm({ 
                    ...approvalForm, 
                    pic: e.target.value,
                    picName: selectedUser?.full_name || ''
                  });
                }}
                disabled={isLoadingUsers}
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
                <MenuItem value=""><em>{isLoadingUsers ? 'Memuat...' : 'Pilih PIC'}</em></MenuItem>
                {pengembangUsers.map((user) => (
                  <MenuItem key={user.uuid} value={user.uuid}>
                    {user.full_name} {user.department ? `(${user.department})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Anggota Tim Field */}
            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <Autocomplete
                multiple
                options={pengembangUsers}
                getOptionLabel={(option) => option.full_name || ''}
                value={pengembangUsers.filter(u => approvalForm.anggotaTim.includes(u.uuid))}
                onChange={(_, newValue) => setApprovalForm({ 
                  ...approvalForm, 
                  anggotaTim: newValue.map(u => u.uuid),
                  anggotaTimNames: newValue.map(u => u.full_name)
                })}
                isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
                loading={isLoadingUsers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Anggota Tim *"
                    placeholder="Pilih anggota tim"
                    sx={{
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
                          borderColor: '#31A24C',
                          borderWidth: '1.5px',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 4px 20px rgba(49, 162, 76, 0.1)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#86868b',
                        fontWeight: 500,
                        '&.Mui-focused': {
                          color: '#31A24C',
                        },
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
                        label={option.full_name}
                        size="small"
                        {...tagProps}
                        sx={{ 
                          bgcolor: '#31A24C', 
                          color: 'white',
                          fontWeight: 500,
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              color: 'white',
                            },
                          },
                        }}
                      />
                    );
                  })
                }
              />
            </FormControl>

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
