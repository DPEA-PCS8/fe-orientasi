import { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogContent, CircularProgress, Alert, Fade } from '@mui/material';
import { Close, Save, Folder } from '@mui/icons-material';
import { Add, Edit, Search } from '@mui/icons-material';
import { getAllBidang, createBidang, updateBidang, type BidangData, type BidangRequest } from '../api/bidangApi';

interface FormData {
  kode_bidang: string;
  nama_bidang: string;
}

const initialForm: FormData = { kode_bidang: '', nama_bidang: '' };

const BidangPage = () => {
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBidang();
      setBidangList(data || []);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data Bidang');
      setBidangList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (bidang?: BidangData) => {
    if (bidang) {
      setForm({
        kode_bidang: bidang.kode_bidang,
        nama_bidang: bidang.nama_bidang,
      });
      setEditId(bidang.id);
    } else {
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

  const handleSubmit = async () => {
    if (!form.kode_bidang || !form.nama_bidang) {
      setError('Kode Bidang dan Nama Bidang harus diisi');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: BidangRequest = {
        kode_bidang: form.kode_bidang.trim(),
        nama_bidang: form.nama_bidang.trim(),
      };

      if (editId) {
        await updateBidang(editId, payload);
      } else {
        await createBidang(payload);
      }
      await fetchData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data Bidang');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredBidangList = bidangList.filter(bidang => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      bidang.kode_bidang.toLowerCase().includes(searchLower) ||
      bidang.nama_bidang.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>Manajemen Bidang</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
        <TextField
          label="Cari kode/nama Bidang"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{ endAdornment: <Search /> }}
        />
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} disabled={loading}>Tambah Bidang</Button>
      </Box>
      {loading && <Box display="flex" justifyContent="center" my={3}><CircularProgress /></Box>}
      {!loading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kode Bidang</TableCell>
                <TableCell>Nama Bidang</TableCell>
                <TableCell align="right" width={100}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBidangList.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.kode_bidang}</TableCell>
                  <TableCell>{row.nama_bidang}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(row)} title="Edit"><Edit /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBidangList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">{search ? 'Tidak ada data yang sesuai' : 'Tidak ada data'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
              <Folder />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {editId ? 'Edit Bidang' : 'Tambah Bidang Baru'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {editId ? 'Perbarui data bidang' : 'Isi form untuk menambah bidang baru'}
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
              label="Kode Bidang"
              name="kode_bidang"
              value={form.kode_bidang}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
              placeholder="Contoh: BID001"
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
              label="Nama Bidang"
              name="nama_bidang"
              value={form.nama_bidang}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
              placeholder="Contoh: Bidang Infrastruktur"
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
            disabled={loading || !form.kode_bidang.trim() || !form.nama_bidang.trim()}
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

export default BidangPage;
