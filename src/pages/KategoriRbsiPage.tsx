import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogContent, DialogTitle,
  CircularProgress, Alert, Skeleton, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, Chip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Close, Save, Lock, Delete, Add, Edit, Search, History, Photo, LibraryAdd } from '@mui/icons-material';
import {
  getAllSubKategori, createSubKategori, updateSubKategori, deleteSubKategori,
  bulkCreateSubKategori, getDistinctSnapshotYears, getSnapshotsByYear, createYearlySnapshot,
  CATEGORY_CODE_OPTIONS,
  type SubKategoriData, type SubKategoriRequest, type SubKategoriSnapshotData
} from '../api/subKategoriApi';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';
import { COLORS } from '../styles/theme';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

interface FormData {
  kode: string;
  nama: string;
  category_code: string;
  category_name: string;
}

const initialForm: FormData = { kode: '', nama: '', category_code: '', category_name: '' };

const MENU_CODE = 'KATEGORI_RBSI';

// Professional per-category accent — one color per group for visual distinction,
// no rainbow gradients. All derived from a restrained palette.
const CATEGORY_ACCENTS: Record<string, string> = {
  CS: '#2563EB',
  SP: '#0891B2',
  DA: '#D97706',
  DM: '#7C3AED',
};
const getCategoryAccent = (code: string) => CATEGORY_ACCENTS[code] ?? COLORS.TEXT_SECONDARY;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const KategoriRbsiPage = () => {
  // Main list state
  const [subKategoriList, setSubKategoriList] = useState<SubKategoriData[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Bulk insert state
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('CS');
  const [bulkCategoryName, setBulkCategoryName] = useState('Core System');
  const [bulkPreview, setBulkPreview] = useState<Array<{ kode: string; nama: string; valid: boolean; error?: string }>>([]);

  // Tab & Snapshot state
  const [tabValue, setTabValue] = useState(0);
  const [snapshotYears, setSnapshotYears] = useState<number[]>([]);
  const [selectedSnapshotYear, setSelectedSnapshotYear] = useState<number | ''>('');
  const [snapshotData, setSnapshotData] = useState<SubKategoriSnapshotData[]>([]);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [openSnapshotDialog, setOpenSnapshotDialog] = useState(false);
  const [newSnapshotYear, setNewSnapshotYear] = useState<number>(new Date().getFullYear());

  // Permission hook
  const { getMenuPermissions, permissionsLoaded } = usePermissions();
  const { canView, canCreate, canUpdate, canDelete } = getMenuPermissions(MENU_CODE);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSubKategori();
      setSubKategoriList(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data Sub Kategori';
      setError(errorMessage);
      setSubKategoriList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshotYears = async () => {
    try {
      const years = await getDistinctSnapshotYears();
      setSnapshotYears(years || []);
    } catch (err) {
      console.error('Failed to fetch snapshot years:', err);
    }
  };

  const fetchSnapshotData = async (year: number) => {
    setLoadingSnapshot(true);
    try {
      const data = await getSnapshotsByYear(year);
      setSnapshotData(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data snapshot';
      setError(errorMessage);
      setSnapshotData([]);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSnapshotYears();
  }, []);

  useEffect(() => {
    if (permissionsLoaded && canView) {
      fetchData();
      fetchSnapshotYears();
    }
  }, [permissionsLoaded, canView]);

  useEffect(() => {
    if (selectedSnapshotYear && typeof selectedSnapshotYear === 'number') {
      fetchSnapshotData(selectedSnapshotYear);
    }
  }, [selectedSnapshotYear]);

  const handleOpenDialog = (item?: SubKategoriData) => {
    if (item) {
      if (!canUpdate) return;
      setForm({ kode: item.kode, nama: item.nama, category_code: item.category_code, category_name: item.category_name });
      setEditId(item.id);
    } else {
      if (!canCreate) return;
      setForm(initialForm);
      setEditId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);
  const handleDialogExited = () => { setForm(initialForm); setEditId(null); };

  const handleOpenBulkDialog = () => {
    setOpenBulkDialog(true);
    setBulkText('');
    setBulkCategory('CS');
    setBulkCategoryName('Core System');
    setBulkPreview([]);
  };

  const handleBulkCategoryChange = (categoryCode: string) => {
    setBulkCategory(categoryCode);
    const categoryName = CATEGORY_CODE_OPTIONS.find(c => c.code === categoryCode)?.name || '';
    setBulkCategoryName(categoryName);
    parseBulkText(bulkText);
  };

  const parseBulkText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const preview = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) return { kode: line, nama: '', valid: false, error: 'Format tidak valid. Gunakan: KODE,NAMA' };
      const [kode, ...namaParts] = parts;
      const nama = namaParts.join(',').trim();
      if (!kode) return { kode, nama, valid: false, error: 'Kode tidak boleh kosong' };
      if (!nama) return { kode, nama, valid: false, error: 'Nama tidak boleh kosong' };
      return { kode, nama, valid: true };
    });
    setBulkPreview(preview);
  };

  const handleBulkTextChange = (text: string) => { setBulkText(text); parseBulkText(text); };

  const handleBulkSubmit = async () => {
    const validItems = bulkPreview.filter(item => item.valid);
    if (validItems.length === 0) { setError('Tidak ada data valid untuk disimpan'); return; }
    setLoading(true);
    setError(null);
    try {
      const requests: SubKategoriRequest[] = validItems.map(item => ({
        kode: item.kode, nama: item.nama, category_code: bulkCategory, category_name: bulkCategoryName
      }));
      const results = await bulkCreateSubKategori(requests);
      setLoading(false);
      setSuccess(`Berhasil menambahkan ${results.length} sub kategori`);
      await fetchData();
      setOpenBulkDialog(false);
      setBulkText('');
      setBulkPreview([]);
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data bulk');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name === 'category_code') {
      const selected = CATEGORY_CODE_OPTIONS.find(opt => opt.code === value);
      setForm({ ...form, category_code: value, category_name: selected?.name || '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    if (!form.kode || !form.nama || !form.category_code || !form.category_name) { setError('Semua field wajib diisi'); return; }
    setLoading(true);
    setError(null);
    try {
      const payload: SubKategoriRequest = {
        kode: form.kode.trim().toUpperCase(),
        nama: form.nama.trim(),
        category_code: form.category_code.trim().toUpperCase(),
        category_name: form.category_name.trim(),
      };
      if (editId) {
        await updateSubKategori(editId, payload);
        setSuccess('Sub Kategori berhasil diupdate');
      } else {
        await createSubKategori(payload);
        setSuccess('Sub Kategori berhasil dibuat');
      }
      await fetchData();
      await fetchSnapshotYears();
      handleCloseDialog();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data Sub Kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    setLoading(true);
    setError(null);
    try {
      await deleteSubKategori(id);
      setSuccess('Sub Kategori berhasil dihapus');
      await fetchData();
      await fetchSnapshotYears();
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data Sub Kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!newSnapshotYear) return;
    setLoading(true);
    setError(null);
    try {
      await createYearlySnapshot(newSnapshotYear);
      setSuccess(`Snapshot tahun ${newSnapshotYear} berhasil dibuat`);
      await fetchSnapshotYears();
      setSelectedSnapshotYear(newSnapshotYear);
      setOpenSnapshotDialog(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat snapshot');
    } finally {
      setLoading(false);
    }
  };

  const filteredList = subKategoriList.filter(item => {
    const matchesSearch = !search ||
      item.kode.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.category_code.toLowerCase().includes(search.toLowerCase()) ||
      item.category_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || item.category_code === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (!permissionsLoaded) {
    return (
      <Box p={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (!canView) {
    return (
      <Box p={3}>
        <Alert severity="error" icon={<Lock />} sx={{ borderRadius: 2, '& .MuiAlert-icon': { alignItems: 'center' } }}>
          <Typography variant="h6" gutterBottom>Akses Ditolak</Typography>
          <Typography variant="body2">Anda tidak memiliki izin untuk mengakses halaman Kategori RBSI.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Master Data"
        title="Kategori RBSI"
        actions={canCreate ? (
          <>
            <Button variant="outlined" startIcon={<LibraryAdd />} onClick={handleOpenBulkDialog} disabled={loading}>
              Bulk Insert
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} disabled={loading}>
              Tambah
            </Button>
          </>
        ) : undefined}
      />

      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Data Master" />
            <Tab label="Historis Snapshot" icon={<History />} iconPosition="start" />
          </Tabs>
        </Box>

      {/* Tab 0: Main Data */}
      <TabPanel value={tabValue} index={0}>
        {/* Search */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Cari kode/nama"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{ endAdornment: <Search sx={{ fontSize: 18, color: COLORS.TEXT_SUBTLE }} /> }}
            sx={{ minWidth: 220 }}
          />
        </Box>

        {loading && <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>}

        {!loading && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, alignItems: 'start' }}>
            {CATEGORY_CODE_OPTIONS.map(opt => {
              const accent = getCategoryAccent(opt.code);
              const items = filteredList.filter(i => i.category_code === opt.code);
              return (
                <Paper key={opt.code} elevation={0} sx={{ overflow: 'hidden' }}>
                  {/* Column header */}
                  <Box sx={{ borderTop: `3px solid ${accent}`, px: 2, py: 1.5, borderBottom: `1px solid ${COLORS.BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: accent }}>{opt.code}</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.TEXT_SECONDARY }}>{opt.name}</Typography>
                    </Box>
                    <Chip label={items.length} size="small" sx={{ bgcolor: accent, color: 'white', fontWeight: 700, height: 22, fontSize: '0.75rem' }} />
                  </Box>

                  {/* Items */}
                  {items.length === 0 ? (
                    <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.disabled">Kosong</Typography>
                    </Box>
                  ) : (
                    <Box>
                      {items.map((item, idx) => (
                        <Box
                          key={item.id}
                          sx={{
                            px: 2, py: 1,
                            display: 'flex', alignItems: 'center', gap: 1,
                            borderBottom: idx < items.length - 1 ? `1px solid ${COLORS.BORDER}` : 'none',
                            '&:hover': { bgcolor: COLORS.SOFT, '& .item-actions': { opacity: 1 } },
                          }}
                        >
                          <Chip label={item.kode} size="small" sx={{ bgcolor: accent, color: 'white', fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ flex: 1, color: COLORS.TEXT_PRIMARY, fontSize: '0.8125rem' }}>
                            {item.nama}
                          </Typography>
                          {(canUpdate || canDelete) && (
                            <Box className="item-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', gap: 0.25 }}>
                              {canUpdate && (
                                <IconButton size="small" onClick={() => handleOpenDialog(item)} sx={{ color: accent, p: 0.5 }}>
                                  <Edit sx={{ fontSize: 15 }} />
                                </IconButton>
                              )}
                              {canDelete && (
                                <IconButton size="small" onClick={() => setDeleteConfirmId(item.id)} color="error" sx={{ p: 0.5 }}>
                                  <Delete sx={{ fontSize: 15 }} />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}

        {!loading && filteredList.length === 0 && search && (
          <Alert severity="info" sx={{ mt: 2 }}>Tidak ada data yang sesuai pencarian</Alert>
        )}
      </TabPanel>

      {/* Tab 1: Snapshot History */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Pilih Tahun</InputLabel>
            <Select
              value={selectedSnapshotYear}
              label="Pilih Tahun"
              onChange={(e) => setSelectedSnapshotYear(e.target.value as number | '')}
            >
              <MenuItem value="">-- Pilih --</MenuItem>
              {snapshotYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {canCreate && (
            <Button variant="outlined" startIcon={<Photo />} onClick={() => setOpenSnapshotDialog(true)}>
              Buat Snapshot Baru
            </Button>
          )}
        </Box>

        {loadingSnapshot && <Box display="flex" justifyContent="center" my={3}><CircularProgress /></Box>}

        {!loadingSnapshot && selectedSnapshotYear && (
          <Paper elevation={0}>
            <DataCountDisplay count={snapshotData.length} isLoading={loadingSnapshot} label="Total" unit="Record Snapshot" />

            {snapshotData.length === 0 && <Box p={3}><Alert severity="info">Tidak ada data snapshot untuk tahun ini</Alert></Box>}

            {snapshotData.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="left" width={110}>Kode</TableCell>
                      <TableCell align="left">Nama Sub Kategori</TableCell>
                      <TableCell align="left" width={200}>Kategori</TableCell>
                      <TableCell align="left" width={110}>Perubahan</TableCell>
                      <TableCell align="left" width={170}>Tanggal</TableCell>
                      <TableCell align="left" width={140}>Oleh</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {snapshotData.map(row => {
                      const accent = getCategoryAccent(row.category_code);
                      return (
                        <TableRow key={row.id}>
                          <TableCell align="left">
                            <Chip label={row.kode} size="small" sx={{ bgcolor: accent, color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
                          </TableCell>
                          <TableCell align="left">
                            <Typography variant="body2">{row.nama}</Typography>
                          </TableCell>
                          <TableCell align="left">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 3, height: 16, borderRadius: 1, bgcolor: accent, flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ color: COLORS.TEXT_SECONDARY }}>
                                {row.category_code} — {row.category_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="left">
                            <StatusBadge status={row.change_type} />
                          </TableCell>
                          <TableCell align="left">
                            <Typography variant="caption">{new Date(row.snapshot_date).toLocaleString('id-ID')}</Typography>
                          </TableCell>
                          <TableCell align="left">
                            <Typography variant="caption">{row.created_by || '-'}</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {!selectedSnapshotYear && !loadingSnapshot && (
          <Alert severity="info">Pilih tahun untuk melihat data historis snapshot</Alert>
        )}
      </TabPanel>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth TransitionProps={{ onExited: handleDialogExited }}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{editId ? 'Edit Sub Kategori' : 'Tambah Sub Kategori'}</Typography>
            <IconButton onClick={handleCloseDialog}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth required>
              <InputLabel>Kategori Utama</InputLabel>
              <Select name="category_code" value={form.category_code} label="Kategori Utama" onChange={handleSelectChange}>
                {CATEGORY_CODE_OPTIONS.map(opt => (
                  <MenuItem key={opt.code} value={opt.code}>{opt.code} - {opt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Nama Kategori (Panjang)" name="category_name" value={form.category_name} onChange={handleChange} fullWidth required helperText="Contoh: Core System, Supporting System" />
            <TextField label="Kode Sub Kategori" name="kode" value={form.kode} onChange={handleChange} fullWidth required helperText="Contoh: CS1, CS2, SP1, DA1" />
            <TextField label="Nama Sub Kategori" name="nama" value={form.nama} onChange={handleChange} fullWidth required helperText="Contoh: Core System 1, Supporting System 2" />
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button onClick={handleCloseDialog}>Batal</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={<Save />}>
                {loading ? <CircularProgress size={20} /> : 'Simpan'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Bulk Insert Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Bulk Insert Sub Kategori</Typography>
            <IconButton onClick={() => setOpenBulkDialog(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Alert severity="info">
              <Typography variant="body2" fontWeight={600} gutterBottom>Format Input:</Typography>
              <Typography variant="body2" component="div">
                • Satu baris = satu sub kategori<br />
                • Format: <code>KODE,NAMA</code><br />
                • Contoh: <code>CS1,Sistem Informasi Kepegawaian</code><br />
                • Semua data akan masuk ke kategori yang dipilih di bawah
              </Typography>
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Kategori Utama</InputLabel>
              <Select value={bulkCategory} label="Kategori Utama" onChange={(e) => handleBulkCategoryChange(e.target.value)}>
                {CATEGORY_CODE_OPTIONS.map(opt => (
                  <MenuItem key={opt.code} value={opt.code}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={opt.code}
                        size="small"
                        sx={{ bgcolor: getCategoryAccent(opt.code), color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                      <Typography>{opt.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Data Sub Kategori"
              multiline
              rows={12}
              value={bulkText}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              placeholder="CS1,Sistem Informasi Kepegawaian&#10;CS2,Sistem Keuangan&#10;CS3,Sistem Perencanaan"
              fullWidth
              helperText={`${bulkPreview.length} baris terdeteksi, ${bulkPreview.filter(p => p.valid).length} valid`}
            />

            {bulkPreview.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  Preview ({bulkPreview.filter(p => p.valid).length} dari {bulkPreview.length} valid):
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
                  {bulkPreview.map((item, idx) => (
                    <Box
                      key={idx}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      py={0.5}
                      sx={{
                        borderBottom: idx < bulkPreview.length - 1 ? `1px solid ${COLORS.BORDER}` : 'none',
                        bgcolor: item.valid ? 'transparent' : 'rgba(185,28,28,0.06)',
                        px: 1,
                        borderRadius: 0.5,
                      }}
                    >
                      {item.valid ? (
                        <>
                          <Chip label={item.kode} size="small" sx={{ bgcolor: getCategoryAccent(bulkCategory), color: 'white', fontWeight: 600, fontSize: '0.7rem', minWidth: 60 }} />
                          <Typography variant="body2" flex={1}>{item.nama}</Typography>
                          <Chip label="✓" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" color="error" flex={1}>{item.kode || '(kosong)'} - {item.error}</Typography>
                          <Chip label="✗" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </>
                      )}
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}

            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={() => setOpenBulkDialog(false)}>Batal</Button>
              <Button
                variant="contained"
                onClick={handleBulkSubmit}
                disabled={loading || bulkPreview.filter(p => p.valid).length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              >
                {loading ? 'Menyimpan...' : `Simpan ${bulkPreview.filter(p => p.valid).length} Data`}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Konfirmasi Hapus</Typography>
          <Typography>Apakah Anda yakin ingin menghapus Sub Kategori ini?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Data yang dihapus akan tersimpan dalam snapshot historis.
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
            <Button onClick={() => setDeleteConfirmId(null)}>Batal</Button>
            <Button color="error" variant="contained" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Hapus'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Create Snapshot Dialog */}
      <Dialog open={openSnapshotDialog} onClose={() => setOpenSnapshotDialog(false)}>
        <DialogTitle>Buat Snapshot Baru</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Snapshot akan menyimpan semua data Sub Kategori saat ini untuk tahun yang dipilih.
          </Typography>
          <TextField
            label="Tahun Snapshot"
            type="number"
            value={newSnapshotYear}
            onChange={(e) => setNewSnapshotYear(parseInt(e.target.value))}
            fullWidth
            sx={{ mt: 1 }}
          />
          <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
            <Button onClick={() => setOpenSnapshotDialog(false)}>Batal</Button>
            <Button variant="contained" onClick={handleCreateSnapshot} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Buat Snapshot'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      </Box>{/* end padded content */}
    </Box>
  );
};

export default KategoriRbsiPage;
