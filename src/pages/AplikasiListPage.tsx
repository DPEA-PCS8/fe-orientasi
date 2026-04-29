import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogContent, DialogActions, DialogTitle, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Chip, Skeleton,
  TablePagination, Popover, Autocomplete, Checkbox,
  Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add, Edit, Search, Delete, Visibility, Lock, Apps, Download, FilterList, ExpandMore, ExpandLess, CheckBoxOutlineBlank, CheckBox, IndeterminateCheckBox } from '@mui/icons-material';
import {
  searchAplikasi, deleteAplikasi, updateAplikasiStatusWithDetails, downloadAplikasiExcel,
  type AplikasiListItem, type AplikasiSearchParams, type AplikasiStatusUpdateRequest,
  APPLICATION_STATUS_LABELS, KATEGORI_IDLE_LABELS
} from '../api/aplikasiApi';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { getAllSubKategori, type SubKategoriData } from '../api/subKategoriApi';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';

const MENU_CODE = 'APLIKASI';

// Category color mapping (consistent with KategoriRbsiPage)
const CATEGORY_COLORS = {
  CS: { primary: '#1976d2', light: '#e3f2fd', chip: '#5e35b1' },
  SP: { primary: '#2e7d32', light: '#e8f5e9', chip: '#00897b' },
  DA: { primary: '#ed6c02', light: '#fff3e0', chip: '#d84315' },
  DM: { primary: '#d32f2f', light: '#ffebee', chip: '#c62828' },
} as const;

const AplikasiListPage = () => {
  const navigate = useNavigate();
  const [aplikasiList, setAplikasiList] = useState<AplikasiListItem[]>([]);
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [subKategoriList, setSubKategoriList] = useState<SubKategoriData[]>([]);
  const [search, setSearch] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
  const [filterSkpa, setFilterSkpa] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSubKategori, setFilterSubKategori] = useState<string[]>([]);
  const [subKategoriFilterAnchor, setSubKategoriFilterAnchor] = useState<HTMLElement | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['CS', 'SP', 'DA', 'DM']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Download states
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Status popover
  const [statusAnchor, setStatusAnchor] = useState<{ el: HTMLElement; appId: string; currentStatus: string } | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusFormData, setStatusFormData] = useState({
    tanggal_status: '',
    kategori_idle: '',
    alasan_idle: '',
    rencana_pengakhiran: '',
    alasan_belum_diakhiri: ''
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Permission hook
  const { getMenuPermissions, permissionsLoaded } = usePermissions();
  const { canView, canCreate, canUpdate, canDelete } = getMenuPermissions(MENU_CODE);

  const fetchFilters = useCallback(async () => {
    try {
      const [bidangRes, skpaRes, subKategoriRes] = await Promise.all([
        getAllBidang(),
        getAllSkpa(),
        getAllSubKategori()
      ]);
      setBidangList(bidangRes || []);
      setSkpaList(skpaRes.data || []);
      setSubKategoriList(subKategoriRes || []);
    } catch (err) {
      console.error('Failed to load filter data:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load ALL data without pagination - client-side rendering
      const params: AplikasiSearchParams = {
        page: 0,
        size: 9999, // Load all data
      };
      const response = await searchAplikasi(params);
      setAplikasiList(response.data?.content || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data aplikasi';
      setError(errorMessage);
      setAplikasiList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    if (permissionsLoaded && canView) {
      fetchData();
    }
  }, [permissionsLoaded, canView, fetchData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page
  };

  const handleFilterChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name === 'bidang') setFilterBidang(value);
    else if (name === 'skpa') setFilterSkpa(value);
    else if (name === 'status') setFilterStatus(value);
    setPage(0); // Reset to first page
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when rows per page changes
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;

    setLoading(true);
    setError(null);
    try {
      await deleteAplikasi(id);
      await fetchData();
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus aplikasi';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>, app: AplikasiListItem) => {
    if (!canUpdate) return;
    setStatusAnchor({ el: event.currentTarget, appId: app.id, currentStatus: app.status_aplikasi });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!statusAnchor) return;
    
    // Always show form for status change with date input
    setSelectedStatus(newStatus);
    setShowStatusForm(true);
    // Initialize with today's date
    setStatusFormData(prev => ({ 
      ...prev, 
      tanggal_status: new Date().toISOString().split('T')[0]
    }));
  };

  const handleStatusFormSubmit = async () => {
    if (!statusAnchor || !selectedStatus) return;
    
    setUpdatingStatusId(statusAnchor.appId);
    const appId = statusAnchor.appId;
    setStatusAnchor(null);
    setShowStatusForm(false);
    
    try {
      const request: AplikasiStatusUpdateRequest = {
        status: selectedStatus,
        tanggal_status: statusFormData.tanggal_status || undefined,
        kategori_idle: selectedStatus === 'IDLE' ? statusFormData.kategori_idle || undefined : undefined,
        alasan_idle: selectedStatus === 'IDLE' ? statusFormData.alasan_idle || undefined : undefined,
        rencana_pengakhiran: selectedStatus === 'IDLE' ? statusFormData.rencana_pengakhiran || undefined : undefined,
        alasan_belum_diakhiri: selectedStatus === 'IDLE' ? statusFormData.alasan_belum_diakhiri || undefined : undefined
      };
      await updateAplikasiStatusWithDetails(appId, request);
      await fetchData();
      // Reset form
      setStatusFormData({
        tanggal_status: '',
        kategori_idle: '',
        alasan_idle: '',
        rencana_pengakhiran: '',
        alasan_belum_diakhiri: ''
      });
      setSelectedStatus('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengupdate status';
      setError(errorMessage);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleStatusPopoverClose = () => {
    setStatusAnchor(null);
    setShowStatusForm(false);
    setSelectedStatus('');
    setStatusFormData({
      tanggal_status: '',
      kategori_idle: '',
      alasan_idle: '',
      rencana_pengakhiran: '',
      alasan_belum_diakhiri: ''
    });
  };

  const handleDownload = async () => {
    setDownloadLoading(true);
    setError(null);
    try {
      await downloadAplikasiExcel();
      setShowDownloadDialog(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengunduh file Excel';
      setError(errorMessage);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Sub Kategori Hierarchical Filter Helpers
  const groupedSubKategori = subKategoriList.reduce((acc, item) => {
    if (!acc[item.category_code]) {
      acc[item.category_code] = {
        name: item.category_name,
        code: item.category_code,
        items: []
      };
    }
    acc[item.category_code].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; code: string; items: SubKategoriData[] }>);

  const toggleCategory = (categoryCode: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryCode) 
        ? prev.filter(c => c !== categoryCode)
        : [...prev, categoryCode]
    );
  };

  const handleCategoryCheckbox = (categoryCode: string, checked: boolean) => {
    const categoryItems = groupedSubKategori[categoryCode]?.items || [];
    const categoryItemIds = categoryItems.map(item => item.id);
    
    if (checked) {
      setFilterSubKategori(prev => [...new Set([...prev, ...categoryItemIds])]);
    } else {
      setFilterSubKategori(prev => prev.filter(id => !categoryItemIds.includes(id)));
    }
    setPage(0);
  };

  const handleSubKategoriCheckbox = (subKategoriId: string, checked: boolean) => {
    if (checked) {
      setFilterSubKategori(prev => [...prev, subKategoriId]);
    } else {
      setFilterSubKategori(prev => prev.filter(id => id !== subKategoriId));
    }
    setPage(0);
  };

  const isCategoryChecked = (categoryCode: string) => {
    const categoryItems = groupedSubKategori[categoryCode]?.items || [];
    const categoryItemIds = categoryItems.map(item => item.id);
    return categoryItemIds.length > 0 && categoryItemIds.every(id => filterSubKategori.includes(id));
  };

  const isCategoryIndeterminate = (categoryCode: string) => {
    const categoryItems = groupedSubKategori[categoryCode]?.items || [];
    const categoryItemIds = categoryItems.map(item => item.id);
    const checkedCount = categoryItemIds.filter(id => filterSubKategori.includes(id)).length;
    return checkedCount > 0 && checkedCount < categoryItemIds.length;
  };

  const clearSubKategoriFilter = () => {
    setFilterSubKategori([]);
    setPage(0);
  };

  // Apply frontend filtering for sub kategori
  const filteredAplikasiList = aplikasiList.filter(app => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      app.nama_aplikasi.toLowerCase().includes(searchLower) ||
      (app.kode_aplikasi && app.kode_aplikasi.toLowerCase().includes(searchLower));
    
    // Bidang filter
    const matchesBidang = !filterBidang || (app.bidang && app.bidang.id === filterBidang);
    
    // SKPA filter
    const matchesSkpa = !filterSkpa || (app.skpa && app.skpa.id === filterSkpa);
    
    // Status filter
    const matchesStatus = !filterStatus || app.status_aplikasi === filterStatus;
    
    // Sub kategori filter
    const matchesSubKategori = filterSubKategori.length === 0 || 
      (app.sub_kategori && filterSubKategori.includes(app.sub_kategori.id));
    
    return matchesSearch && matchesBidang && matchesSkpa && matchesStatus && matchesSubKategori;
  });

  // Client-side pagination
  const totalElements = filteredAplikasiList.length;
  const paginatedList = filteredAplikasiList.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusChip = (status: string, isClickable: boolean = false, loading: boolean = false) => {
    const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      AKTIF: 'success',
      IDLE: 'warning',
      DIAKHIRI: 'error',
    };
    return (
      <Chip
        label={loading ? <CircularProgress size={14} color="inherit" /> : (APPLICATION_STATUS_LABELS[status] || status)}
        color={colorMap[status] || 'default'}
        size="small"
        sx={{
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': isClickable ? { opacity: 0.8 } : {},
        }}
      />
    );
  };

  // Loading state for permissions
  if (!permissionsLoaded) {
    return (
      <Box p={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // No view permission
  if (!canView) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          icon={<Lock />}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Akses Ditolak
          </Typography>
          <Typography variant="body2">
            Anda tidak memiliki izin untuk mengakses halaman Manajemen Aplikasi.
            Silakan hubungi administrator untuk mendapatkan akses.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Apps color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Manajemen Aplikasi
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Download Excel">
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => setShowDownloadDialog(true)}
            >
              Download
            </Button>
          </Tooltip>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/aplikasi/tambah')}
            >
              Tambah Aplikasi
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Cari nama atau kode aplikasi..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
            }}
            sx={{ minWidth: 250 }}
          />
          <Autocomplete
            size="small"
            options={bidangList}
            getOptionLabel={(option) => `${option.kode_bidang} - ${option.nama_bidang}`}
            value={bidangList.find(b => b.id === filterBidang) || null}
            onChange={(_, newValue) => {
              setFilterBidang(newValue?.id || '');
              setPage(0);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Bidang" placeholder="Cari bidang..." />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{option.kode_bidang}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{option.nama_bidang}</Typography>
                </Box>
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(opt => 
                opt.kode_bidang.toLowerCase().includes(search) ||
                opt.nama_bidang.toLowerCase().includes(search)
              );
            }}
            sx={{ minWidth: 200 }}
          />
          <Autocomplete
            size="small"
            options={skpaList}
            getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
            value={skpaList.find(s => s.id === filterSkpa) || null}
            onChange={(_, newValue) => {
              setFilterSkpa(newValue?.id || '');
              setPage(0);
            }}
            renderInput={(params) => (
              <TextField {...params} label="SKPA" placeholder="Cari SKPA..." />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{option.kode_skpa}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{option.nama_skpa}</Typography>
                </Box>
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(opt => 
                opt.kode_skpa.toLowerCase().includes(search) ||
                opt.nama_skpa.toLowerCase().includes(search)
              );
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filterStatus}
              label="Status"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            size="small"
            variant={filterSubKategori.length > 0 ? "contained" : "outlined"}
            startIcon={<FilterList />}
            onClick={(e) => setSubKategoriFilterAnchor(e.currentTarget)}
            sx={{ 
              height: 40,
              position: 'relative',
              pr: filterSubKategori.length > 0 ? 5 : 2
            }}
          >
            Sub Kategori
            {filterSubKategori.length > 0 && (
              <Chip
                label={filterSubKategori.length}
                size="small"
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: 20,
                  minWidth: 20,
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
          </Button>
        </Box>
      </Paper>

      {/* Data Count Display */}
      <Box sx={{ my: 2.5 }}>
        <DataCountDisplay
          count={totalElements}
          isLoading={loading}
          label="Total"
          unit="Aplikasi"
        />
        {(search || filterBidang || filterSkpa || filterStatus || filterSubKategori.length > 0) && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            (Difilter dari {aplikasiList.length} aplikasi)
          </Typography>
        )}
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Nama Aplikasi</strong></TableCell>
              <TableCell><strong>Bidang</strong></TableCell>
              <TableCell><strong>SKPA</strong></TableCell>
              <TableCell><strong>Sub Kategori</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginatedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {search || filterBidang || filterSkpa || filterStatus || filterSubKategori.length > 0 
                      ? 'Tidak ada aplikasi yang sesuai dengan filter' 
                      : 'Tidak ada data aplikasi'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedList.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Box>
                      <Typography fontWeight={500}>
                        {app.nama_aplikasi}
                      </Typography>
                      {app.kode_aplikasi && app.kode_aplikasi !== app.nama_aplikasi && (
                        <Typography variant="caption" color="text.secondary">
                          {app.kode_aplikasi}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {app.bidang ? (
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{app.bidang.kode_bidang}</Typography>
                        <Typography variant="caption" color="text.secondary">{app.bidang.nama_bidang}</Typography>
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {app.skpa ? (
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{app.skpa.kode_skpa}</Typography>
                        <Typography variant="caption" color="text.secondary">{app.skpa.nama_skpa}</Typography>
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {app.sub_kategori ? (
                      <Tooltip title={app.sub_kategori.nama} arrow placement="top">
                        <Chip
                          label={app.sub_kategori.kode}
                          size="small"
                          sx={{
                            bgcolor: CATEGORY_COLORS[app.sub_kategori.category_code as keyof typeof CATEGORY_COLORS]?.chip || '#666',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            cursor: 'help',
                          }}
                        />
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {canUpdate ? (
                      <Tooltip title="Klik untuk mengubah status">
                        <span onClick={(e) => handleStatusClick(e, app)}>
                          {getStatusChip(app.status_aplikasi, true, updatingStatusId === app.id)}
                        </span>
                      </Tooltip>
                    ) : (
                      getStatusChip(app.status_aplikasi)
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={0.5}>
                      <Tooltip title="Lihat Detail">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/aplikasi/${app.id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/aplikasi/edit/${app.id}`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Hapus">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirmId(app.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
        />
      </TableContainer>

      {/* Status Popover */}
      <Popover
        open={Boolean(statusAnchor)}
        anchorEl={statusAnchor?.el}
        onClose={handleStatusPopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, minWidth: 280 }}>
          {!showStatusForm ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                <MenuItem
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  selected={statusAnchor?.currentStatus === key}
                  sx={{ borderRadius: 1, minWidth: 120 }}
                >
                  {getStatusChip(key)} 
                  <Typography sx={{ ml: 1 }}>{label}</Typography>
                </MenuItem>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Ubah Status ke {APPLICATION_STATUS_LABELS[selectedStatus] || selectedStatus}
              </Typography>
              <TextField
                size="small"
                type="date"
                label="Tanggal Status"
                InputLabelProps={{ shrink: true }}
                value={statusFormData.tanggal_status}
                onChange={(e) => setStatusFormData(prev => ({ ...prev, tanggal_status: e.target.value }))}
                fullWidth
                required
                helperText="Tanggal status mulai berlaku"
              />
              {selectedStatus === 'IDLE' && (
                <>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Kategori Idle</InputLabel>
                    <Select
                      value={statusFormData.kategori_idle}
                      label="Kategori Idle"
                      onChange={(e) => setStatusFormData(prev => ({ ...prev, kategori_idle: e.target.value }))}
                    >
                      {Object.entries(KATEGORI_IDLE_LABELS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Alasan Idle"
                    value={statusFormData.alasan_idle}
                    onChange={(e) => setStatusFormData(prev => ({ ...prev, alasan_idle: e.target.value }))}
                    multiline
                    rows={2}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Rencana Pengakhiran"
                    value={statusFormData.rencana_pengakhiran}
                    onChange={(e) => setStatusFormData(prev => ({ ...prev, rencana_pengakhiran: e.target.value }))}
                    multiline
                    rows={2}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Alasan Belum Diakhiri"
                    value={statusFormData.alasan_belum_diakhiri}
                    onChange={(e) => setStatusFormData(prev => ({ ...prev, alasan_belum_diakhiri: e.target.value }))}
                    multiline
                    rows={2}
                    fullWidth
                  />
                </>
              )}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setShowStatusForm(false)}>
                  Kembali
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleStatusFormSubmit}
                  disabled={!statusFormData.tanggal_status}
                >
                  Simpan
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Sub Kategori Filter Popover */}
      <Popover
        open={Boolean(subKategoriFilterAnchor)}
        anchorEl={subKategoriFilterAnchor}
        onClose={() => setSubKategoriFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              minWidth: 350,
              maxWidth: 400
            }
          }
        }}
      >
        <Box>
          {/* Header */}
          <Box sx={{ p: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Filter Sub Kategori
            </Typography>
            {filterSubKategori.length > 0 && (
              <Button 
                size="small" 
                onClick={clearSubKategoriFilter}
                sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
              >
                Clear ({filterSubKategori.length})
              </Button>
            )}
          </Box>
          <Divider />
          
          {/* Category List */}
          <List sx={{ py: 0, maxHeight: 450, overflowY: 'auto' }}>
            {Object.entries(groupedSubKategori).map(([categoryCode, categoryData]) => {
              const color = CATEGORY_COLORS[categoryCode as keyof typeof CATEGORY_COLORS];
              const isExpanded = expandedCategories.includes(categoryCode);
              const isChecked = isCategoryChecked(categoryCode);
              const isIndeterminate = isCategoryIndeterminate(categoryCode);
              const selectedCount = categoryData.items.filter(item => filterSubKategori.includes(item.id)).length;
              
              return (
                <Box key={categoryCode}>
                  {/* Category Header */}
                  <ListItem
                    disablePadding
                    sx={{
                      bgcolor: color.light,
                      borderBottom: `1px solid ${color.primary}20`
                    }}
                  >
                    <ListItemButton
                      onClick={() => toggleCategory(categoryCode)}
                      sx={{ py: 1.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={isChecked}
                          indeterminate={isIndeterminate}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCategoryCheckbox(categoryCode, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          icon={<CheckBoxOutlineBlank />}
                          checkedIcon={<CheckBox />}
                          indeterminateIcon={<IndeterminateCheckBox />}
                          sx={{
                            color: color.primary,
                            '&.Mui-checked': { color: color.primary },
                            '&.MuiCheckbox-indeterminate': { color: color.primary }
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={categoryCode}
                              size="small"
                              sx={{
                                bgcolor: color.primary,
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 24,
                                minWidth: 45
                              }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {categoryData.name}
                            </Typography>
                            {selectedCount > 0 && (
                              <Chip
                                label={selectedCount}
                                size="small"
                                sx={{
                                  bgcolor: color.chip,
                                  color: 'white',
                                  fontWeight: 600,
                                  height: 20,
                                  minWidth: 20,
                                  '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' }
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {categoryData.items.length} item
                          </Typography>
                        }
                      />
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  
                  {/* Sub Items */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {categoryData.items.map((item) => (
                        <ListItem
                          key={item.id}
                          disablePadding
                          sx={{
                            borderLeft: `3px solid ${color.chip}`,
                            '&:hover': { bgcolor: color.light }
                          }}
                        >
                          <ListItemButton
                            dense
                            onClick={() => handleSubKategoriCheckbox(item.id, !filterSubKategori.includes(item.id))}
                            sx={{ pl: 4 }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Checkbox
                                edge="start"
                                checked={filterSubKategori.includes(item.id)}
                                size="small"
                                sx={{
                                  color: color.chip,
                                  '&.Mui-checked': { color: color.chip }
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip
                                    label={item.kode}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: color.chip,
                                      color: color.chip,
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      height: 22,
                                      minWidth: 45,
                                      '& .MuiChip-label': { px: 0.75 }
                                    }}
                                  />
                                  <Typography variant="body2" fontSize="0.85rem">
                                    {item.nama}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
          </List>
        </Box>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
      >
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus aplikasi ini?
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Confirmation Dialog */}
      <Dialog
        open={showDownloadDialog}
        onClose={() => !downloadLoading && setShowDownloadDialog(false)}
      >
        <DialogTitle>Download Daftar Aplikasi</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda ingin mengunduh daftar aplikasi dalam format Excel?
            File akan berisi semua data aplikasi yang tersedia.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDownloadDialog(false)} disabled={downloadLoading}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownload}
            disabled={downloadLoading}
            startIcon={downloadLoading ? <CircularProgress size={20} /> : <Download />}
          >
            {downloadLoading ? 'Mengunduh...' : 'Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AplikasiListPage;
