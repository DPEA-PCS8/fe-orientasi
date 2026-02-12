import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface FormData {
  namaProgram: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AddProgram = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    namaProgram: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Form Data:', formData);
      setSuccessMessage('Program berhasil ditambahkan!');

      setTimeout(() => {
        navigate('/program');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/program');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ color: '#86868b' }}
        >
          Kembali
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
          Tambah Program Baru
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 2, maxWidth: 600 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1d1d1f' }}>
              Informasi Program
            </Typography>
            <TextField
              fullWidth
              label="Nama Program"
              name="namaProgram"
              value={formData.namaProgram}
              onChange={handleInputChange}
              error={!!errors.namaProgram}
              helperText={errors.namaProgram}
              placeholder="Contoh: Transformasi Digital 2026"
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
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
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AddProgram;
