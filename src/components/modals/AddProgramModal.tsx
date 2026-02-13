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
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { createProgram } from '../../api/rbsiApi';

interface AddProgramModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  rbsiId: string;
  tahun: number;
}

interface FormData {
  nomorProgram: string;
  namaProgram: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AddProgramModal = ({ open, onClose, onSuccess, rbsiId, tahun }: AddProgramModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    nomorProgram: '',
    namaProgram: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setFormData({ nomorProgram: '', namaProgram: '' });
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nomorProgram.trim()) {
      newErrors.nomorProgram = 'Nomor Program wajib diisi';
    }

    if (!formData.namaProgram.trim()) {
      newErrors.namaProgram = 'Nama Program wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await createProgram({
        rbsi_id: rbsiId,
        tahun: tahun,
        nomor_program: formData.nomorProgram.trim(),
        nama_program: formData.namaProgram.trim(),
        inisiatifs: [],
      });

      setSuccessMessage('Program berhasil ditambahkan!');

      setTimeout(() => {
        resetForm();
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menyimpan program');
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
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
          Tambah Program Baru
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: 'white' }}>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            Informasi Program
          </Typography>
          <TextField
            fullWidth
            label="Tahun"
            value={tahun}
            disabled
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: '#1d1d1f',
                bgcolor: '#f5f5f7',
              },
            }}
          />
          <TextField
            fullWidth
            label="Nomor Program"
            name="nomorProgram"
            value={formData.nomorProgram}
            onChange={handleInputChange}
            error={!!errors.nomorProgram}
            helperText={errors.nomorProgram}
            placeholder="Contoh: 3.1"
          />
          <TextField
            fullWidth
            label="Nama Program"
            name="namaProgram"
            value={formData.namaProgram}
            onChange={handleInputChange}
            error={!!errors.namaProgram}
            helperText={errors.namaProgram}
            placeholder="Contoh: Aplikasi Pelaporan"
          />
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
          {isSubmitting ? 'Menyimpan...' : 'Simpan Program'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProgramModal;
