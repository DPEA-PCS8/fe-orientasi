import { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogContent, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Tooltip, Fade, Chip, Skeleton } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Close, Save, Category, Lock, Delete } from '@mui/icons-material';
import { Add, Edit, Search } from '@mui/icons-material';
import { getAllSkpa, createSkpa, updateSkpa, deleteSkpa, type SkpaData, type SkpaRequest } from '../api/skpaApi';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';

interface FormData {
  kode_skpa: string;
  nama_skpa: string;
  keterangan: string;
  bidang_id: string;
}

const initialForm: FormData = { kode_skpa: '', nama_skpa: '', keterangan: '', bidang_id: '' };

const MENU_CODE = 'SKPA';

const SkpaPage = () => {
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [bidangLoading, setBidangLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Permission hook
  const { getMenuPermissions, permissionsLoaded } = usePermissions();
  const { canView, canCreate, canUpdate, canDelete } = getMenuPermissions(MENU_CODE);

  const fetchBidang = async () => {
    setBidangLoading(true);
    try {
      const data = await getAllBidang();
      setBidangList(data || []);
    } catch (err: any) {
      console.error('Gagal mengambil data Bidang:', err);
      setBidangList([]);
    } finally {
      setBidangLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllSkpa();
      setSkpaList(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data SKPA');
      setSkpaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidang();
  }, []);

  useEffect(() => {
    if (permissionsLoaded && canView) {
      fetchData();
    }
  }, [permissionsLoaded, canView]);

  const handleOpenDialog = (skpa?: SkpaData) => {
    if (skpa) {
      if (!canUpdate) return;
      setForm({
        kode_skpa: skpa.kode_skpa,
        nama_skpa: skpa.nama_skpa,
        keterangan: skpa.keterangan || '',
        bidang_id: skpa.bidang?.id || '',
      });
      setEditId(skpa.id);
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

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!form.kode_skpa || !form.nama_skpa) {
      setError('Kode SKPA dan Nama SKPA harus diisi');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: SkpaRequest = {
        kode_skpa: form.kode_skpa.trim(),
        nama_skpa: form.nama_skpa.trim(),
        keterangan: form.keterangan?.trim() || null,
        bidang_id: form.bidang_id || undefined,
      };
      
      if (editId) {
        await updateSkpa(editId, payload);
      } else {
        await createSkpa(payload);
      }
      await fetchData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data SKPA');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredSkpaList = skpaList.filter(skpa => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      skpa.kode_skpa.toLowerCase().includes(searchLower) ||
      skpa.nama_skpa.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    
    setLoading(true);
    setError(null);
    try {
      await deleteSkpa(id);
      await fetchData();
      setDeleteConfirmId(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data SKPA');
    } finally {
      setLoading(false);
    }
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
            Anda tidak memiliki izin untuk mengakses halaman Manajemen SKPA.
            Silakan hubungi administrator untuk mendapatkan akses.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Manajemen SKPA</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <TextField
          label="Cari kode/nama SKPA"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{ endAdornment: <Search /> }}
        />
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} disabled={loading}>Tambah SKPA</Button>
        )}
      </Box>

      {/* Data Count Display */}
      <Box sx={{ my: 2.5 }}>
        <DataCountDisplay
          count={filteredSkpaList.length}
          isLoading={loading}
          label="Total"
          unit="SKPA"
        />
      </Box>

      {loading && <Box display="flex" justifyContent="center" my={3}><CircularProgress /></Box>}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kode SKPA</TableCell>
                <TableCell>Nama SKPA</TableCell>
                <TableCell>Bidang</TableCell>
                <TableCell>Keterangan</TableCell>
                {(canUpdate || canDelete) && (
                  <TableCell align="right" width={120}>Aksi</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSkpaList.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.kode_skpa}</TableCell>
                  <TableCell>{row.nama_skpa}</TableCell>
                  <TableCell>
                    {row.bidang ? (
                      <Tooltip title={row.bidang.nama_bidang}>
                        <span>{row.bidang.kode_bidang}</span>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{row.keterangan || '-'}</TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell align="right">
                      {canUpdate && (
                        <IconButton size="small" onClick={() => handleOpenDialog(row)} title="Edit"><Edit /></IconButton>
                      )}
                      {canDelete && (
                        <IconButton size="small" onClick={() => setDeleteConfirmId(row.id)} title="Hapus" color="error"><Delete /></IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredSkpaList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={(canUpdate || canDelete) ? 5 : 4} align="center">{search ? 'Tidak ada data yang sesuai' : 'Tidak ada data'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Konfirmasi Hapus</Typography>
          <Typography>Apakah Anda yakin ingin menghapus SKPA ini?</Typography>
          <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
            <Button onClick={() => setDeleteConfirmId(null)}>Batal</Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={loading}
            >
              Hapus
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog Form */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        TransitionProps={{
          onExited: handleDialogExited,
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        {/* Custom Header */}
        <Box
          sx={{
            background: editId 
              ? 'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
              : 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
            color: 'white',
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Category />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {editId ? 'Edit SKPA' : 'Tambah SKPA Baru'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {editId ? 'Perbarui data SKPA' : 'Isi form untuk menambah SKPA baru'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleCloseDialog} 
            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: '#fafbfc' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Kode SKPA"
              name="kode_skpa"
              value={form.kode_skpa}
              onChange={handleTextFieldChange}
              fullWidth
              required
              disabled={loading}
              placeholder="Contoh: DISHUB"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                    borderWidth: 2,
                  },
                },
              }}
            />
            <TextField
              label="Nama SKPA"
              name="nama_skpa"
              value={form.nama_skpa}
              onChange={handleTextFieldChange}
              fullWidth
              required
              disabled={loading}
              placeholder="Contoh: Dinas Perhubungan"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                    borderWidth: 2,
                  },
                },
              }}
            />
            <FormControl 
              fullWidth 
              disabled={loading || bidangLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                    borderWidth: 2,
                  },
                },
              }}
            >
              <InputLabel>Bidang (Opsional)</InputLabel>
              <Select
                name="bidang_id"
                value={form.bidang_id}
                onChange={handleSelectChange}
                label="Bidang (Opsional)"
              >
                <MenuItem value="">-- Pilih Bidang --</MenuItem>
                {bidangList.map(bidang => (
                  <MenuItem key={bidang.id} value={bidang.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={bidang.kode_bidang} size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600 }} />
                      {bidang.nama_bidang}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Keterangan (Opsional)"
              name="keterangan"
              value={form.keterangan}
              onChange={handleTextFieldChange}
              fullWidth
              disabled={loading}
              multiline
              rows={3}
              placeholder="Masukkan keterangan tentang SKPA ini"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f',
                    borderWidth: 2,
                  },
                },
              }}
            />
          </Box>
        </DialogContent>

        {/* Custom Footer */}
        <Box 
          sx={{ 
            px: 3, 
            py: 2, 
            bgcolor: 'white', 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button 
            onClick={handleCloseDialog} 
            disabled={loading}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 500,
              borderColor: '#d0d0d0',
              color: '#666',
              '&:hover': {
                borderColor: '#999',
                bgcolor: '#f5f5f5',
              },
            }}
          >
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !form.kode_skpa.trim() || !form.nama_skpa.trim()}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              background: editId 
                ? 'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
                : 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              },
              '&:disabled': {
                background: '#e0e0e0',
              },
            }}
          >
            {editId ? 'Update' : 'Simpan'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SkpaPage;
