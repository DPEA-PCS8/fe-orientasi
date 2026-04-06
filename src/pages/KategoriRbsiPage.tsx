import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Dialog, DialogContent, DialogTitle,
  CircularProgress, Alert, Skeleton, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, Chip, Accordion, AccordionSummary, AccordionDetails, Badge
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Close, Save, Lock, Delete, Add, Edit, Search, History, Photo, ExpandMore } from '@mui/icons-material';
import {
  getAllSubKategori, createSubKategori, updateSubKategori, deleteSubKategori,
  getDistinctSnapshotYears, getSnapshotsByYear, createYearlySnapshot,
  CATEGORY_CODE_OPTIONS,
  type SubKategoriData, type SubKategoriRequest, type SubKategoriSnapshotData
} from '../api/subKategoriApi';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';

interface FormData {
  kode: string;
  nama: string;
  category_code: string;
  category_name: string;
}

const initialForm: FormData = { kode: '', nama: '', category_code: '', category_name: '' };

const MENU_CODE = 'KATEGORI_RBSI';

// Category color mapping
const CATEGORY_COLORS = {
  CS: { 
    primary: '#1976d2', 
    light: '#e3f2fd', 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    chip: '#5e35b1'
  },
  SP: { 
    primary: '#2e7d32', 
    light: '#e8f5e9', 
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    chip: '#00897b'
  },
  DA: { 
    primary: '#ed6c02', 
    light: '#fff3e0', 
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    chip: '#d84315'
  },
  DM: { 
    primary: '#d32f2f', 
    light: '#ffebee', 
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    chip: '#c62828'
  },
} as const;

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
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  // Fetch main data
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

  // Fetch snapshot years
  const fetchSnapshotYears = async () => {
    try {
      const years = await getDistinctSnapshotYears();
      setSnapshotYears(years || []);
    } catch (err) {
      console.error('Failed to fetch snapshot years:', err);
    }
  };

  // Fetch snapshots by year
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

  // Dialog handlers
  const handleOpenDialog = (item?: SubKategoriData) => {
    if (item) {
      if (!canUpdate) return;
      setForm({
        kode: item.kode,
        nama: item.nama,
        category_code: item.category_code,
        category_name: item.category_name,
      });
      setEditId(item.id);
    } else {
      if (!canCreate) return;
      setForm(initialForm);
      setEditId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDialogExited = () => {
    setForm(initialForm);
    setEditId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name === 'category_code') {
      // Auto-fill category_name based on category_code
      const selected = CATEGORY_CODE_OPTIONS.find(opt => opt.code === value);
      setForm({
        ...form,
        category_code: value,
        category_name: selected?.name || '',
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    if (!form.kode || !form.nama || !form.category_code || !form.category_name) {
      setError('Semua field wajib diisi');
      return;
    }
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
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan data Sub Kategori';
      setError(errorMessage);
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
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus data Sub Kategori';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Snapshot handlers
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
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat snapshot';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredList = subKategoriList.filter(item => {
    const matchesSearch = !search || 
      item.kode.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.category_code.toLowerCase().includes(search.toLowerCase()) ||
      item.category_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !filterCategory || item.category_code === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group by category for accordion display
  const groupedByCategory = filteredList.reduce((acc, item) => {
    const key = item.category_code;
    if (!acc[key]) {
      acc[key] = { 
        name: item.category_name, 
        code: key,
        items: [] 
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; code: string; items: SubKategoriData[] }>);

  // Get category stats
  const categoryStats = Object.entries(groupedByCategory).map(([code, data]) => ({
    code,
    name: data.name,
    count: data.items.length,
    color: CATEGORY_COLORS[code as keyof typeof CATEGORY_COLORS],
  }));

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
          sx={{ borderRadius: 2, '& .MuiAlert-icon': { alignItems: 'center' } }}
        >
          <Typography variant="h6" gutterBottom>Akses Ditolak</Typography>
          <Typography variant="body2">
            Anda tidak memiliki izin untuk mengakses halaman Kategori RBSI.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'CREATED': return 'success';
      case 'UPDATED': return 'info';
      case 'DELETED': return 'error';
      case 'SNAPSHOT': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Manajemen Kategori RBSI</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Data Master" />
          <Tab label="Historis Snapshot" icon={<History />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab 0: Main Data */}
      <TabPanel value={tabValue} index={0}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2} flexWrap="wrap">
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Cari kode/nama"
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              InputProps={{ endAdornment: <Search /> }}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter Kategori</InputLabel>
              <Select
                value={filterCategory}
                label="Filter Kategori"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">Semua</MenuItem>
                {CATEGORY_CODE_OPTIONS.map(opt => (
                  <MenuItem key={opt.code} value={opt.code}>{opt.code} - {opt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} disabled={loading}>
              Tambah Sub Kategori
            </Button>
          )}
        </Box>

        {loading && <Box display="flex" justifyContent="center" my={3}><CircularProgress /></Box>}

        {!loading && filteredList.length === 0 && (
          <Alert severity="info">
            {search || filterCategory ? 'Tidak ada data yang sesuai dengan pencarian' : 'Belum ada data Sub Kategori'}
          </Alert>
        )}

        {!loading && filteredList.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Category Overview Cards */}
            {!filterCategory && !search && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                {categoryStats.map(stat => (
                  <Paper
                    key={stat.code}
                    elevation={2}
                    sx={{
                      p: 2,
                      background: stat.color.gradient,
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      }
                    }}
                    onClick={() => setFilterCategory(stat.code)}
                  >
                    <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>{stat.count}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', fontWeight: 500 }}>
                      {stat.code} - {stat.name}
                    </Typography>
                    <Box sx={{ 
                      position: 'absolute', 
                      right: -10, 
                      bottom: -10, 
                      fontSize: 80, 
                      opacity: 0.2,
                      fontWeight: 700
                    }}>
                      {stat.code}
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Accordion View by Category */}
            {Object.entries(groupedByCategory).map(([categoryCode, categoryData]) => {
              const color = CATEGORY_COLORS[categoryCode as keyof typeof CATEGORY_COLORS];
              return (
                <Accordion
                  key={categoryCode}
                  defaultExpanded={Object.keys(groupedByCategory).length === 1}
                  sx={{
                    border: `2px solid ${color.primary}`,
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                    boxShadow: `0 2px 8px ${color.primary}40`,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: color.primary }} />}
                    sx={{
                      background: color.light,
                      borderRadius: '10px',
                      '&:hover': { background: color.light },
                      '& .MuiAccordionSummary-content': { my: 1.5 }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Badge 
                        badgeContent={categoryData.items.length} 
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: color.chip,
                            color: 'white',
                            fontWeight: 700
                          }
                        }}
                      >
                        <Chip
                          label={categoryCode}
                          sx={{
                            bgcolor: color.primary,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            height: 36,
                            minWidth: 60
                          }}
                        />
                      </Badge>
                      <Box>
                        <Typography variant="h6" fontWeight={600} sx={{ color: color.primary }}>
                          {categoryData.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {categoryData.items.length} sub kategori
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: color.light }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Kode</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Nama Sub Kategori</TableCell>
                            {(canUpdate || canDelete) && (
                              <TableCell align="right" width={120} sx={{ fontWeight: 600 }}>Aksi</TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryData.items.map(item => (
                            <TableRow 
                              key={item.id}
                              sx={{
                                '&:hover': { bgcolor: color.light },
                                transition: 'background-color 0.2s'
                              }}
                            >
                              <TableCell>
                                <Chip
                                  label={item.kode}
                                  size="small"
                                  sx={{
                                    bgcolor: color.chip,
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{item.nama}</Typography>
                              </TableCell>
                              {(canUpdate || canDelete) && (
                                <TableCell align="right">
                                  {canUpdate && (
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleOpenDialog(item)} 
                                      title="Edit"
                                      sx={{ color: color.primary }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  )}
                                  {canDelete && (
                                    <IconButton 
                                      size="small" 
                                      onClick={() => setDeleteConfirmId(item.id)} 
                                      title="Hapus" 
                                      color="error"
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
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
          <>
            <Box sx={{ my: 2.5 }}>
              <DataCountDisplay count={snapshotData.length} isLoading={loadingSnapshot} label="Total" unit="Record Snapshot" />
            </Box>

            {snapshotData.length === 0 && (
              <Alert severity="info">Tidak ada data snapshot untuk tahun ini</Alert>
            )}

            {snapshotData.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Group snapshot data by category */}
                {(() => {
                  const groupedSnapshots = snapshotData.reduce((acc, item) => {
                    const cat = item.category_code;
                    if (!acc[cat]) {
                      acc[cat] = {
                        name: item.category_name,
                        code: cat,
                        items: []
                      };
                    }
                    acc[cat].items.push(item);
                    return acc;
                  }, {} as Record<string, { name: string; code: string; items: typeof snapshotData }>);

                  return Object.entries(groupedSnapshots).map(([categoryCode, categoryData]) => {
                    const color = CATEGORY_COLORS[categoryCode as keyof typeof CATEGORY_COLORS];
                    return (
                      <Accordion
                        key={categoryCode}
                        defaultExpanded
                        sx={{
                          border: `2px solid ${color.primary}`,
                          borderRadius: '12px !important',
                          '&:before': { display: 'none' },
                          boxShadow: `0 2px 8px ${color.primary}40`,
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore sx={{ color: color.primary }} />}
                          sx={{
                            background: color.light,
                            borderRadius: '10px',
                            '&:hover': { background: color.light },
                            '& .MuiAccordionSummary-content': { my: 1.5 }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={2} width="100%">
                            <Badge 
                              badgeContent={categoryData.items.length} 
                              color="primary"
                              sx={{
                                '& .MuiBadge-badge': {
                                  bgcolor: color.chip,
                                  color: 'white',
                                  fontWeight: 700
                                }
                              }}
                            >
                              <Chip
                                label={categoryCode}
                                sx={{
                                  bgcolor: color.primary,
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '1rem',
                                  height: 36,
                                  minWidth: 60
                                }}
                              />
                            </Badge>
                            <Box>
                              <Typography variant="h6" fontWeight={600} sx={{ color: color.primary }}>
                                {categoryData.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {categoryData.items.length} record snapshot
                              </Typography>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <TableContainer>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: color.light }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Kode</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Nama Sub Kategori</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Perubahan</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Tanggal</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Oleh</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {categoryData.items.map(row => (
                                  <TableRow 
                                    key={row.id}
                                    sx={{
                                      '&:hover': { bgcolor: color.light },
                                      transition: 'background-color 0.2s'
                                    }}
                                  >
                                    <TableCell>
                                      <Chip
                                        label={row.kode}
                                        size="small"
                                        sx={{
                                          bgcolor: color.chip,
                                          color: 'white',
                                          fontWeight: 600,
                                          fontSize: '0.75rem'
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">{row.nama}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={row.change_type} 
                                        size="small" 
                                        color={getChangeTypeColor(row.change_type) as any}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="caption">
                                        {new Date(row.snapshot_date).toLocaleString('id-ID')}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="caption">{row.created_by || '-'}</Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    );
                  });
                })()}
              </Box>
            )}
          </>
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
              <Select
                name="category_code"
                value={form.category_code}
                label="Kategori Utama"
                onChange={handleSelectChange}
              >
                {CATEGORY_CODE_OPTIONS.map(opt => (
                  <MenuItem key={opt.code} value={opt.code}>{opt.code} - {opt.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Nama Kategori (Panjang)"
              name="category_name"
              value={form.category_name}
              onChange={handleChange}
              fullWidth
              required
              helperText="Contoh: Core System, Supporting System"
            />
            <TextField
              label="Kode Sub Kategori"
              name="kode"
              value={form.kode}
              onChange={handleChange}
              fullWidth
              required
              helperText="Contoh: CS1, CS2, SP1, DA1"
            />
            <TextField
              label="Nama Sub Kategori"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              fullWidth
              required
              helperText="Contoh: Core System 1, Supporting System 2"
            />
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button onClick={handleCloseDialog}>Batal</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={<Save />}>
                {loading ? <CircularProgress size={20} /> : 'Simpan'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
    </Box>
  );
};

export default KategoriRbsiPage;
