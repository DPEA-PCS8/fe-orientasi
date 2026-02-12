import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  Alert,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface AddPeriodeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (periode: string) => void;
  existingPeriodes: string[];
}

const AddPeriodeModal = ({ open, onClose, onSuccess, existingPeriodes }: AddPeriodeModalProps) => {
  const [tahunAwal, setTahunAwal] = useState('');
  const [tahunAkhir, setTahunAkhir] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setTahunAwal('');
    setTahunAkhir('');
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!tahunAwal || !tahunAkhir) {
      setError('Tahun awal dan akhir wajib diisi');
      return;
    }

    const awal = parseInt(tahunAwal);
    const akhir = parseInt(tahunAkhir);

    if (isNaN(awal) || isNaN(akhir)) {
      setError('Tahun harus berupa angka');
      return;
    }

    if (awal > akhir) {
      setError('Tahun awal tidak boleh lebih besar dari tahun akhir');
      return;
    }

    if (awal < 2020 || akhir > 2030) {
      setError('Tahun harus antara 2020 - 2030');
      return;
    }

    const periodeString = `${awal}-${akhir}`;

    if (existingPeriodes.includes(periodeString)) {
      setError('Periode ini sudah ada');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setSuccessMessage('Periode berhasil ditambahkan!');
      
      setTimeout(() => {
        resetForm();
        onSuccess?.(periodeString);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: 'white',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e5e5e7',
        pb: 2,
        bgcolor: 'white',
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
          Tambah Periode Baru
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: 'white' }}>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: '#86868b' }}>
            Masukkan range tahun untuk periode baru
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Tahun Awal"
              type="number"
              value={tahunAwal}
              onChange={(e) => {
                setTahunAwal(e.target.value);
                setError('');
              }}
              slotProps={{
                htmlInput: { min: 2020, max: 2030 },
              }}
              sx={{ flex: 1 }}
            />
            <Typography sx={{ color: '#86868b' }}>—</Typography>
            <TextField
              label="Tahun Akhir"
              type="number"
              value={tahunAkhir}
              onChange={(e) => {
                setTahunAkhir(e.target.value);
                setError('');
              }}
              slotProps={{
                htmlInput: { min: 2020, max: 2030 },
              }}
              sx={{ flex: 1 }}
            />
          </Box>

          {tahunAwal && tahunAkhir && !error && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'rgba(218, 37, 28, 0.05)', 
              borderRadius: '8px',
              border: '1px solid rgba(218, 37, 28, 0.2)',
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#DA251C' }}>
                Preview: {tahunAwal}-{tahunAkhir}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e5e5e7', bgcolor: 'white' }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            borderColor: '#86868b',
            color: '#86868b',
            '&:hover': {
              borderColor: '#1d1d1f',
              bgcolor: 'transparent',
            },
          }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
            fontWeight: 500,
            '&:hover': {
              background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
            },
            '&.Mui-disabled': {
              background: '#e5e5e7',
            },
          }}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPeriodeModal;
