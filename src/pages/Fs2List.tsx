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
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
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

// Interface for transformed data
interface Fs2Data {
  id: string;
  namaAplikasi: string;
  namaFs2: string;
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
    namaFs2: apiData.nama_fs2,
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

function Fs2List() {
  const [keyword, setKeyword] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedFs2ForEdit, setSelectedFs2ForEdit] = useState<Fs2DocumentData | null>(null);
  const [selectedFs2ForView, setSelectedFs2ForView] = useState<Fs2DocumentData | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Fs2Data>('namaFs2');
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
    nama_fs2: '',
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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatus.size > 0) count++;
    if (selectedBidangFilter) count++;
    if (selectedSkpaFilter) count++;
    return count;
  }, [selectedStatus, selectedBidangFilter, selectedSkpaFilter]);

  // Add modal handlers
  const handleOpenAddModal = () => {
    setFormData({
      nama_fs2: '',
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

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleAddFs2 = async () => {
    try {
      await createFs2Document(formData);
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
        nama_fs2: fs2.nama_fs2,
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Semua F.S.2
        </Typography>
        {fs2Permissions.canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            sx={{ borderRadius: 2 }}
          >
            Tambah F.S.2
          </Button>
        )}
      </Box>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Cari F.S.2..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<TuneRounded />}
          onClick={handleFilterClick}
          sx={{ borderRadius: 2 }}
        >
          Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
      </Box>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Filter</Typography>
            <IconButton size="small" onClick={handleFilterClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Status Filter */}
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Status</Typography>
          <FormGroup>
            {['pending', 'disetujui', 'tidak_disetujui'].map((status) => (
              <FormControlLabel
                key={status}
                control={
                  <Checkbox
                    checked={selectedStatus.has(status)}
                    onChange={(e) => handleStatusFilterChange(status, e.target.checked)}
                    size="small"
                  />
                }
                label={STATUS_LABELS[status as Fs2Data['status']]}
              />
            ))}
          </FormGroup>

          {/* Bidang Filter */}
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Bidang</InputLabel>
            <Select
              value={selectedBidangFilter}
              label="Bidang"
              onChange={(e) => setSelectedBidangFilter(e.target.value)}
            >
              <MenuItem value="">Semua</MenuItem>
              {bidangList.map((bidang) => (
                <MenuItem key={bidang.id} value={bidang.id}>{bidang.nama_bidang}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* SKPA Filter */}
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>SKPA</InputLabel>
            <Select
              value={selectedSkpaFilter}
              label="SKPA"
              onChange={(e) => setSelectedSkpaFilter(e.target.value)}
            >
              <MenuItem value="">Semua</MenuItem>
              {skpaList.map((skpa) => (
                <MenuItem key={skpa.id} value={skpa.id}>{skpa.kode_skpa} - {skpa.nama_skpa}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="text"
            onClick={clearFilters}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Box>
      </Popover>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>No</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'namaAplikasi'}
                  direction={orderBy === 'namaAplikasi' ? order : 'asc'}
                  onClick={() => handleRequestSort('namaAplikasi')}
                >
                  Nama Aplikasi
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'namaFs2'}
                  direction={orderBy === 'namaFs2' ? order : 'asc'}
                  onClick={() => handleRequestSort('namaFs2')}
                >
                  Nama F.S.2
                </TableSortLabel>
              </TableCell>
              <TableCell>Bidang</TableCell>
              <TableCell>SKPA</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'tanggalPengajuan'}
                  direction={orderBy === 'tanggalPengajuan' ? order : 'asc'}
                  onClick={() => handleRequestSort('tanggalPengajuan')}
                >
                  Tanggal Pengajuan
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : fs2Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Tidak ada data F.S.2</Typography>
                </TableCell>
              </TableRow>
            ) : (
              fs2Data.map((row, index) => {
                const skpaColor = getSkpaColor(row.skpa);
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{row.namaAplikasi}</TableCell>
                    <TableCell>{row.namaFs2}</TableCell>
                    <TableCell>{row.bidang}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.skpa}
                        size="small"
                        sx={{
                          bgcolor: skpaColor.bg,
                          color: skpaColor.text,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(row.tanggalPengajuan)}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[row.status]}
                        size="small"
                        onClick={fs2Permissions.canUpdate ? (e) => handleStatusMenuOpen(e, row.id) : undefined}
                        deleteIcon={fs2Permissions.canUpdate ? <ArrowDownIcon /> : undefined}
                        onDelete={fs2Permissions.canUpdate ? (e) => handleStatusMenuOpen(e as unknown as React.MouseEvent<HTMLElement>, row.id) : undefined}
                        sx={{
                          bgcolor: getStatusColor(row.status),
                          color: '#fff',
                          fontWeight: 500,
                          cursor: fs2Permissions.canUpdate ? 'pointer' : 'default',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Lihat Detail">
                          <IconButton size="small" onClick={() => handleOpenViewModal(row.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {fs2Permissions.canUpdate && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEditModal(row.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {fs2Permissions.canDelete && (
                          <Tooltip title="Hapus">
                            <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(row.id)}>
                              <DeleteIcon fontSize="small" />
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
        />
      </TableContainer>

      {/* Status Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('pending')}>Pending</MenuItem>
        <MenuItem onClick={() => handleStatusChange('disetujui')}>Disetujui</MenuItem>
        <MenuItem onClick={() => handleStatusChange('tidak_disetujui')}>Tidak Disetujui</MenuItem>
      </Menu>

      {/* Add Modal */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal} maxWidth="md" fullWidth>
        <DialogTitle>Tambah F.S.2</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Basic Information */}
            <Typography variant="subtitle1" fontWeight={600}>Informasi Dasar</Typography>
            <TextField
              label="Nama F.S.2"
              value={formData.nama_fs2}
              onChange={(e) => setFormData({ ...formData, nama_fs2: e.target.value })}
              fullWidth
              required
            />
            <Autocomplete
              options={aplikasiList}
              getOptionLabel={(option) => `${option.kode_aplikasi} - ${option.nama_aplikasi}`}
              value={aplikasiList.find(a => a.id === formData.aplikasi_id) || null}
              onChange={(_, newValue) => setFormData({ ...formData, aplikasi_id: newValue?.id || '' })}
              renderInput={(params) => <TextField {...params} label="Nama Aplikasi" required />}
            />
            <Autocomplete
              options={skpaList}
              getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
              value={skpaList.find(s => s.id === formData.skpa_id) || null}
              onChange={(_, newValue) => setFormData({ ...formData, skpa_id: newValue?.id || '' })}
              renderInput={(params) => <TextField {...params} label="Satuan Kerja Pemilik Aplikasi (SKPA)" required />}
            />
            <Autocomplete
              options={bidangList}
              getOptionLabel={(option) => option.nama_bidang}
              value={bidangList.find(b => b.id === formData.bidang_id) || null}
              onChange={(_, newValue) => setFormData({ ...formData, bidang_id: newValue?.id || '' })}
              renderInput={(params) => <TextField {...params} label="Bidang" />}
            />
            <TextField
              label="Tanggal Pengajuan"
              type="date"
              value={formData.tanggal_pengajuan}
              onChange={(e) => setFormData({ ...formData, tanggal_pengajuan: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Divider sx={{ my: 1 }} />

            {/* Description Section */}
            <Typography variant="subtitle1" fontWeight={600}>Deskripsi Pengubahan</Typography>
            <TextField
              label="Deskripsi Pengubahan"
              value={formData.deskripsi_pengubahan}
              onChange={(e) => setFormData({ ...formData, deskripsi_pengubahan: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Alasan Pengubahan"
              value={formData.alasan_pengubahan}
              onChange={(e) => setFormData({ ...formData, alasan_pengubahan: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Status Tahapan Aplikasi</InputLabel>
                  <Select
                    value={formData.status_tahapan}
                    label="Status Tahapan Aplikasi"
                    onChange={(e) => setFormData({ ...formData, status_tahapan: e.target.value })}
                  >
                    <MenuItem value="DESAIN">Desain</MenuItem>
                    <MenuItem value="PEMELIHARAAN">Pemeliharaan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Urgensi</InputLabel>
                  <Select
                    value={formData.urgensi}
                    label="Urgensi"
                    onChange={(e) => setFormData({ ...formData, urgensi: e.target.value })}
                  >
                    <MenuItem value="RENDAH">Rendah</MenuItem>
                    <MenuItem value="SEDANG">Sedang</MenuItem>
                    <MenuItem value="TINGGI">Tinggi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Kesesuaian Kriteria Pengubahan Aplikasi */}
            <Typography variant="subtitle1" fontWeight={600}>Kesesuaian Kriteria Pengubahan Aplikasi</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Pengubahan ini telah dipastikan memenuhi Kriteria Pengajuan berikut:
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_1 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_1: e.target.checked })}
                  />
                }
                label="1. Tidak menambah fungsi baru dan/atau tidak mengubah fungsi yang sudah ada, yang berdampak struktural terhadap Aplikasi dan/atau dengan cakupan besar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_2 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_2: e.target.checked })}
                  />
                }
                label="2. Tidak menambah sumber data baru dari sistem lainnya, kecuali pengubahan untuk Aplikasi Reference Management, Aplikasi Data Master Management dan Aplikasi Convertion Engine"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_3 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_3: e.target.checked })}
                  />
                }
                label="3. Tidak mengubah sumber data yang berdampak struktural terhadap Aplikasi atau Database dan/atau dengan cakupan besar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_4 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_4: e.target.checked })}
                  />
                }
                label="4. Tidak mengubah alur kerja Aplikasi"
              />
            </FormGroup>

            <Divider sx={{ my: 1 }} />

            {/* Aspek Perubahan */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={600}>Aspek Perubahan</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="1. Terhadap sistem yang ada"
                    value={formData.aspek_sistem_ada}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_ada: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="2. Terhadap sistem terkait"
                    value={formData.aspek_sistem_terkait}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_terkait: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="3. Terhadap alur kerja bisnis"
                    value={formData.aspek_alur_kerja}
                    onChange={(e) => setFormData({ ...formData, aspek_alur_kerja: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="4. Terhadap struktur organisasi"
                    value={formData.aspek_struktur_organisasi}
                    onChange={(e) => setFormData({ ...formData, aspek_struktur_organisasi: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />

                  {/* Dokumentasi T.0.1 */}
                  <Typography variant="body2" fontWeight={500} sx={{ mt: 1 }}>5.1 Dokumen T.0.1</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t01_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t01_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>

                  {/* Dokumentasi T.1.1 */}
                  <Typography variant="body2" fontWeight={500}>5.2 Dokumen T.1.1</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t11_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t11_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Penggunaan Sistem */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={600}>6. Terhadap Penggunaan Sistem</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Jumlah Pengguna */}
                  <Typography variant="body2" fontWeight={500}>6.1 Jumlah Pengguna</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.pengguna_sebelum}
                        onChange={(e) => setFormData({ ...formData, pengguna_sebelum: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.pengguna_sesudah}
                        onChange={(e) => setFormData({ ...formData, pengguna_sesudah: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  {/* Akses Bersamaan */}
                  <Typography variant="body2" fontWeight={500}>6.2 Jumlah akses secara bersamaan</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.akses_bersamaan_sebelum}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sebelum: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.akses_bersamaan_sesudah}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sesudah: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  {/* Pertumbuhan Data */}
                  <Typography variant="body2" fontWeight={500}>6.3 Jumlah pertumbuhan data per hari/bulan/tahun</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.pertumbuhan_data_sebelum}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sebelum: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.pertumbuhan_data_sesudah}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sesudah: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 1 }} />

            {/* Jadwal Pelaksanaan */}
            <Typography variant="subtitle1" fontWeight={600}>Jadwal Pelaksanaan</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Target Pengujian"
                  type="date"
                  value={formData.target_pengujian}
                  onChange={(e) => setFormData({ ...formData, target_pengujian: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Target Deployment"
                  type="date"
                  value={formData.target_deployment}
                  onChange={(e) => setFormData({ ...formData, target_deployment: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Target Go Live"
                  type="date"
                  value={formData.target_go_live}
                  onChange={(e) => setFormData({ ...formData, target_go_live: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Pernyataan */}
            <Typography variant="subtitle1" fontWeight={600}>Pernyataan</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pernyataan_1 || false}
                    onChange={(e) => setFormData({ ...formData, pernyataan_1: e.target.checked })}
                  />
                }
                label="1. Kami selaku Satuan Kerja Pemilik Aplikasi menyatakan bersedia menerima konsekuensi pengunduran jadwal implementasi (apabila ada) akibat pengubahan Aplikasi ini."
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pernyataan_2 || false}
                    onChange={(e) => setFormData({ ...formData, pernyataan_2: e.target.checked })}
                  />
                }
                label="2. Dalam hal pengubahan Aplikasi berdampak pada pengubahan Aplikasi lain, Satuan Kerja Pemilik Aplikasi terdampak telah menyetujui dan memiliki rencana terkait pengembangan atau pengubahan Aplikasi tersebut (melampirkan risalah rapat)"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Batal</Button>
          <Button variant="contained" onClick={handleAddFs2}>Simpan</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle>Edit F.S.2</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Basic Information */}
            <Typography variant="subtitle1" fontWeight={600}>Informasi Dasar</Typography>
            <TextField
              label="Nama F.S.2"
              value={formData.nama_fs2}
              onChange={(e) => setFormData({ ...formData, nama_fs2: e.target.value })}
              fullWidth
              required
            />
            <Autocomplete
              options={aplikasiList}
              getOptionLabel={(option) => `${option.kode_aplikasi} - ${option.nama_aplikasi}`}
              value={aplikasiList.find(a => a.id === formData.aplikasi_id) || null}
              onChange={(_, newValue) => setFormData({ ...formData, aplikasi_id: newValue?.id || '' })}
              renderInput={(params) => <TextField {...params} label="Nama Aplikasi" required />}
            />
            <Autocomplete
              options={skpaList}
              getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
              value={skpaList.find(s => s.id === formData.skpa_id) || null}
              onChange={(_, newValue) => setFormData({ ...formData, skpa_id: newValue?.id || '' })}
              renderInput={(params) => <TextField {...params} label="Satuan Kerja Pemilik Aplikasi (SKPA)" required />}
            />
            <Autocomplete
              options={bidangList}
              getOptionLabel={(option) => option.nama_bidang}
              value={bidangList.find(b => b.id === formData.bidang_id) || null}
              onChange={(_, newValue) => setFormData({ ...formData, bidang_id: newValue?.id || '' })}
              renderInput={(params) => <TextField {...params} label="Bidang" />}
            />
            <TextField
              label="Tanggal Pengajuan"
              type="date"
              value={formData.tanggal_pengajuan}
              onChange={(e) => setFormData({ ...formData, tanggal_pengajuan: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Divider sx={{ my: 1 }} />

            {/* Description Section */}
            <Typography variant="subtitle1" fontWeight={600}>Deskripsi Pengubahan</Typography>
            <TextField
              label="Deskripsi Pengubahan"
              value={formData.deskripsi_pengubahan}
              onChange={(e) => setFormData({ ...formData, deskripsi_pengubahan: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Alasan Pengubahan"
              value={formData.alasan_pengubahan}
              onChange={(e) => setFormData({ ...formData, alasan_pengubahan: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Status Tahapan Aplikasi</InputLabel>
                  <Select
                    value={formData.status_tahapan}
                    label="Status Tahapan Aplikasi"
                    onChange={(e) => setFormData({ ...formData, status_tahapan: e.target.value })}
                  >
                    <MenuItem value="DESAIN">Desain</MenuItem>
                    <MenuItem value="PEMELIHARAAN">Pemeliharaan</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Urgensi</InputLabel>
                  <Select
                    value={formData.urgensi}
                    label="Urgensi"
                    onChange={(e) => setFormData({ ...formData, urgensi: e.target.value })}
                  >
                    <MenuItem value="RENDAH">Rendah</MenuItem>
                    <MenuItem value="SEDANG">Sedang</MenuItem>
                    <MenuItem value="TINGGI">Tinggi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Kesesuaian Kriteria Pengubahan Aplikasi */}
            <Typography variant="subtitle1" fontWeight={600}>Kesesuaian Kriteria Pengubahan Aplikasi</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Pengubahan ini telah dipastikan memenuhi Kriteria Pengajuan berikut:
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_1 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_1: e.target.checked })}
                  />
                }
                label="1. Tidak menambah fungsi baru dan/atau tidak mengubah fungsi yang sudah ada, yang berdampak struktural terhadap Aplikasi dan/atau dengan cakupan besar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_2 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_2: e.target.checked })}
                  />
                }
                label="2. Tidak menambah sumber data baru dari sistem lainnya, kecuali pengubahan untuk Aplikasi Reference Management, Aplikasi Data Master Management dan Aplikasi Convertion Engine"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_3 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_3: e.target.checked })}
                  />
                }
                label="3. Tidak mengubah sumber data yang berdampak struktural terhadap Aplikasi atau Database dan/atau dengan cakupan besar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.kriteria_4 || false}
                    onChange={(e) => setFormData({ ...formData, kriteria_4: e.target.checked })}
                  />
                }
                label="4. Tidak mengubah alur kerja Aplikasi"
              />
            </FormGroup>

            <Divider sx={{ my: 1 }} />

            {/* Aspek Perubahan */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={600}>Aspek Perubahan</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="1. Terhadap sistem yang ada"
                    value={formData.aspek_sistem_ada}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_ada: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="2. Terhadap sistem terkait"
                    value={formData.aspek_sistem_terkait}
                    onChange={(e) => setFormData({ ...formData, aspek_sistem_terkait: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="3. Terhadap alur kerja bisnis"
                    value={formData.aspek_alur_kerja}
                    onChange={(e) => setFormData({ ...formData, aspek_alur_kerja: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />
                  <TextField
                    label="4. Terhadap struktur organisasi"
                    value={formData.aspek_struktur_organisasi}
                    onChange={(e) => setFormData({ ...formData, aspek_struktur_organisasi: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                  />

                  {/* Dokumentasi T.0.1 */}
                  <Typography variant="body2" fontWeight={500} sx={{ mt: 1 }}>5.1 Dokumen T.0.1</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t01_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t01_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t01_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>

                  {/* Dokumentasi T.1.1 */}
                  <Typography variant="body2" fontWeight={500}>5.2 Dokumen T.1.1</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.dok_t11_sebelum}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sebelum: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.dok_t11_sesudah}
                        onChange={(e) => setFormData({ ...formData, dok_t11_sesudah: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Penggunaan Sistem */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" fontWeight={600}>6. Terhadap Penggunaan Sistem</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Jumlah Pengguna */}
                  <Typography variant="body2" fontWeight={500}>6.1 Jumlah Pengguna</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.pengguna_sebelum}
                        onChange={(e) => setFormData({ ...formData, pengguna_sebelum: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.pengguna_sesudah}
                        onChange={(e) => setFormData({ ...formData, pengguna_sesudah: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  {/* Akses Bersamaan */}
                  <Typography variant="body2" fontWeight={500}>6.2 Jumlah akses secara bersamaan</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.akses_bersamaan_sebelum}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sebelum: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.akses_bersamaan_sesudah}
                        onChange={(e) => setFormData({ ...formData, akses_bersamaan_sesudah: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  {/* Pertumbuhan Data */}
                  <Typography variant="body2" fontWeight={500}>6.3 Jumlah pertumbuhan data per hari/bulan/tahun</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sebelum Pengubahan"
                        value={formData.pertumbuhan_data_sebelum}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sebelum: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        label="Sesudah Pengubahan"
                        value={formData.pertumbuhan_data_sesudah}
                        onChange={(e) => setFormData({ ...formData, pertumbuhan_data_sesudah: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 1 }} />

            {/* Jadwal Pelaksanaan */}
            <Typography variant="subtitle1" fontWeight={600}>Jadwal Pelaksanaan</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Target Pengujian"
                  type="date"
                  value={formData.target_pengujian}
                  onChange={(e) => setFormData({ ...formData, target_pengujian: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Target Deployment"
                  type="date"
                  value={formData.target_deployment}
                  onChange={(e) => setFormData({ ...formData, target_deployment: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  label="Target Go Live"
                  type="date"
                  value={formData.target_go_live}
                  onChange={(e) => setFormData({ ...formData, target_go_live: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Pernyataan */}
            <Typography variant="subtitle1" fontWeight={600}>Pernyataan</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pernyataan_1 || false}
                    onChange={(e) => setFormData({ ...formData, pernyataan_1: e.target.checked })}
                  />
                }
                label="1. Kami selaku Satuan Kerja Pemilik Aplikasi menyatakan bersedia menerima konsekuensi pengunduran jadwal implementasi (apabila ada) akibat pengubahan Aplikasi ini."
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pernyataan_2 || false}
                    onChange={(e) => setFormData({ ...formData, pernyataan_2: e.target.checked })}
                  />
                }
                label="2. Dalam hal pengubahan Aplikasi berdampak pada pengubahan Aplikasi lain, Satuan Kerja Pemilik Aplikasi terdampak telah menyetujui dan memiliki rencana terkait pengembangan atau pengubahan Aplikasi tersebut (melampirkan risalah rapat)"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Batal</Button>
          <Button variant="contained" onClick={handleEditFs2}>Simpan</Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
      <Dialog open={openViewModal} onClose={handleCloseViewModal} maxWidth="md" fullWidth>
        <DialogTitle>Detail F.S.2</DialogTitle>
        <DialogContent>
          {selectedFs2ForView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* Basic Information */}
              <Typography variant="subtitle1" fontWeight={600}>Informasi Dasar</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Nama F.S.2</Typography>
                  <Typography>{selectedFs2ForView.nama_fs2}</Typography>
                </Grid>
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
                  1. Tidak menambah fungsi baru: {selectedFs2ForView.kriteria_1 ? 'âœ“ Ya' : 'âœ— Tidak'}
                </Typography>
                <Typography variant="body2">
                  2. Tidak menambah sumber data baru: {selectedFs2ForView.kriteria_2 ? 'âœ“ Ya' : 'âœ— Tidak'}
                </Typography>
                <Typography variant="body2">
                  3. Tidak mengubah sumber data: {selectedFs2ForView.kriteria_3 ? 'âœ“ Ya' : 'âœ— Tidak'}
                </Typography>
                <Typography variant="body2">
                  4. Tidak mengubah alur kerja: {selectedFs2ForView.kriteria_4 ? 'âœ“ Ya' : 'âœ— Tidak'}
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
                  1. Bersedia menerima konsekuensi: {selectedFs2ForView.pernyataan_1 ? 'âœ“ Ya' : 'âœ— Tidak'}
                </Typography>
                <Typography variant="body2">
                  2. Satker terdampak telah menyetujui: {selectedFs2ForView.pernyataan_2 ? 'âœ“ Ya' : 'âœ— Tidak'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewModal}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus F.S.2 ini? Tindakan ini tidak dapat dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleDeleteFs2}>Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fs2List;


