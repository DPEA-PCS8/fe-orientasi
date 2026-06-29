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
import PageHeader from '../components/PageHeader';

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
    <Box>
      <PageHeader
        eyebrow="CONTROL CENTER"
        title="Tambah Program Baru"
        subtitle="Lengkapi informasi program di bawah ini."
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
          >
            Kembali
          </Button>
        }
      />

      <Box sx={{ p: 3 }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
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
            >
              Batal
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Program'}
            </Button>
          </Box>
        </Stack>
      </Paper>
      </Box>
    </Box>
  );
};

export default AddProgram;
