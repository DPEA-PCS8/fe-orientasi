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
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { AddPksiModal, EditPksiModal } from '../components/modals';
import { usePermissions } from '../hooks/usePermissions';
import { deletePksiDocument, searchPksiDocuments, type PksiDocumentData } from '../api/pksiApi';
import { getAllSkpa } from '../api/skpaApi';

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
    picSatkerBA: apiData.pic_satker_ba || '-',
    jangkaWaktu: apiData.kapan_harus_diselesaikan || 'Single Year',
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

function PksiList() {
  const [keyword, setKeyword] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedPksiForEdit, setSelectedPksiForEdit] = useState<PksiData | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof PksiData>('namaPksi');
  const [order, setOrder] = useState<Order>('asc');
  const [pksiData, setPksiData] = useState<PksiData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPksiId, setSelectedPksiId] = useState<string | null>(null);

  // SKPA lookup data
  const [skpaMap, setSkpaMap] = useState<Map<string, string>>(new Map());

  // Permission check for PKSI menu
  const { getMenuPermissions } = usePermissions();
  const pksiPermissions = getMenuPermissions('PKSI_ALL');

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJangkaWaktu, setSelectedJangkaWaktu] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());

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

      const transformedData = response.content.map(transformApiData);
      setPksiData(transformedData);
      setTotalElements(response.total_elements);
    } catch (error) {
      console.error('Failed to fetch PKSI data:', error);
      setPksiData([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, rowsPerPage, orderBy, order, selectedStatus]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchPksiData();
  }, [fetchPksiData]);

  // Fetch SKPA lookup data
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const skpaResponse = await getAllSkpa();
        
        // Create lookup map
        const skpaLookup = new Map<string, string>();
        (skpaResponse.data || []).forEach((skpa) => {
          skpaLookup.set(skpa.id, skpa.kode_skpa);
        });
        setSkpaMap(skpaLookup);
      } catch (error) {
        console.error('Failed to fetch lookup data:', error);
      }
    };
    fetchLookupData();
  }, []);

  // Helper function to resolve SKPA GUIDs to codes array for Chip display
  const resolveSkpaCodes = (picSatkerBA: string): string[] => {
    if (!picSatkerBA || picSatkerBA === '-') return [];
    
    // Split by comma and resolve each GUID
    const guids = picSatkerBA.split(',').map(g => g.trim());
    return guids.map(guid => skpaMap.get(guid) || '').filter(Boolean);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>, pksiId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPksiId(pksiId);
  };

  const handleStatusMenuClose = () => {
    setAnchorEl(null);
    setSelectedPksiId(null);
  };

  const handleStatusChange = (newStatus: PksiData['status']) => {
    if (selectedPksiId) {
      setPksiData(prev => 
        prev.map(item => 
          item.id === selectedPksiId ? { ...item, status: newStatus } : item
        )
      );
    }
    handleStatusMenuClose();
  };

  const handleEditClick = (pksi: PksiData) => {
    setSelectedPksiForEdit(pksi);
    setOpenEditModal(true);
  };

  const handleEditSuccess = (updatedData: PksiData) => {
    setPksiData(prev =>
      prev.map(item =>
        item.id === updatedData.id ? updatedData : item
      )
    );
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
  };

  // Filter locally only for jangkaWaktu since API doesn't support it
  const filteredPksi = useMemo(() => {
    if (selectedJangkaWaktu.size === 0) {
      return pksiData;
    }
    return pksiData.filter(item => selectedJangkaWaktu.has(item.jangkaWaktu));
  }, [pksiData, selectedJangkaWaktu]);

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
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
                color: selectedJangkaWaktu.size > 0 || selectedStatus.size > 0 ? '#DA251C' : '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Filters
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
          
          <Box sx={{ p: 3, minWidth: 320, bgcolor: 'white' }}>

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
                      checked={selectedJangkaWaktu.has('Multiyears 2024-2025')}
                      onChange={() => handleJangkaWaktuChange('Multiyears 2024-2025')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#DA251C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Multiyears 2024-2025</Typography>}
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

        {/* Table */}
        <TableContainer sx={{ width: '100%' }}>
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    width: 50,
                    textAlign: 'center',
                  }}
                >
                  No
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'namaPksi' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
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
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    width: 150,
                  }}
                >
                  Nama Aplikasi
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    width: 180,
                  }}
                >
                  SKPA
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'jangkaWaktu' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    width: 130,
                    textAlign: 'center',
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
                    width: 140,
                    textAlign: 'center',
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
                    width: 80,
                    textAlign: 'center',
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
                    width: 140,
                    textAlign: 'center',
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
                    width: 120,
                    textAlign: 'center',
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
                  <TableCell sx={{ py: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: '#1d1d1f',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.namaPksi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.namaAplikasi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {resolveSkpaCodes(item.picSatkerBA).length > 0 ? (
                        resolveSkpaCodes(item.picSatkerBA).map((code, idx) => (
                          <Chip
                            key={idx}
                            label={code}
                            size="small"
                            sx={{
                              bgcolor: '#DA251C',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                              borderRadius: '6px',
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
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
                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
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
                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
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
                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
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
                  <TableCell sx={{ py: 2, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
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
    </Box>
  );
}

export default PksiList;
