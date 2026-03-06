import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogContent, DialogActions, DialogTitle, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Chip, Skeleton,
  TablePagination, Popover, Autocomplete
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add, Edit, Search, Delete, Visibility, Lock, Apps } from '@mui/icons-material';
import {
  searchAplikasi, deleteAplikasi, updateAplikasiStatusWithDetails,
  type AplikasiData, type AplikasiSearchParams, type AplikasiStatusUpdateRequest,
  APPLICATION_STATUS_LABELS, KATEGORI_IDLE_LABELS
} from '../api/aplikasiApi';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { usePermissions } from '../hooks/usePermissions';

const MENU_CODE = 'APLIKASI';

const AplikasiListPage = () => {
  const navigate = useNavigate();
  const [aplikasiList, setAplikasiList] = useState<AplikasiData[]>([]);
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [search, setSearch] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
  const [filterSkpa, setFilterSkpa] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
  const [totalElements, setTotalElements] = useState(0);

  // Permission hook
  const { getMenuPermissions, permissionsLoaded } = usePermissions();
  const { canView, canCreate, canUpdate, canDelete } = getMenuPermissions(MENU_CODE);

  const fetchFilters = useCallback(async () => {
    try {
      const [bidangRes, skpaRes] = await Promise.all([
        getAllBidang(),
        getAllSkpa()
      ]);
      setBidangList(bidangRes || []);
      setSkpaList(skpaRes.data || []);
    } catch (err) {
      console.error('Failed to load filter data:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AplikasiSearchParams = {
        search: search || undefined,
        bidang_id: filterBidang || undefined,
        skpa_id: filterSkpa || undefined,
        status: filterStatus || undefined,
        page,
        size: rowsPerPage,
      };
      const response = await searchAplikasi(params);
      setAplikasiList(response.data?.content || []);
      setTotalElements(response.data?.total_elements || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data aplikasi';
      setError(errorMessage);
      setAplikasiList([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterBidang, filterSkpa, filterStatus, page, rowsPerPage]);

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
    setPage(0);
  };

  const handleFilterChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name === 'bidang') setFilterBidang(value);
    else if (name === 'skpa') setFilterSkpa(value);
    else if (name === 'status') setFilterStatus(value);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const handleStatusClick = (event: React.MouseEvent<HTMLElement>, app: AplikasiData) => {
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
            onChange={(_, newValue) => setFilterBidang(newValue?.id || '')}
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
            onChange={(_, newValue) => setFilterSkpa(newValue?.id || '')}
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
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Nama Aplikasi</strong></TableCell>
              <TableCell><strong>Bidang</strong></TableCell>
              <TableCell><strong>SKPA</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Aksi</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : aplikasiList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Tidak ada data aplikasi
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              aplikasiList.map((app) => (
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
    </Box>
  );
};

export default AplikasiListPage;
