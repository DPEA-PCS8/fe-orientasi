import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Stack,
  MenuItem,
  Slider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface FormData {
  namaInisiatif: string;
  programId: string;
  tahun: string;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  progress: number;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// Dummy Program Data untuk dropdown - KEP 40 (2025)
interface Program {
  id: string;
  namaProgram: string;
}

const DUMMY_PROGRAMS: Program[] = [
  { id: '3.1', namaProgram: '3.1 – Aplikasi Pelaporan' },
  { id: '3.2', namaProgram: '3.2 – Aplikasi Bidang Pengawasan Perbankan' },
  { id: '3.3', namaProgram: '3.3 – Aplikasi Bidang Pengawasan Pasar Modal, Keuangan Derivatif, dan Bursa Karbon' },
  { id: '3.4', namaProgram: '3.4 – Aplikasi Bidang Pengawasan Sektor PPDP' },
  { id: '3.5', namaProgram: '3.5 – Aplikasi Bidang Pengawasan Sektor PVML' },
  { id: '3.6', namaProgram: '3.6 – Aplikasi Bidang IAKD' },
  { id: '3.7', namaProgram: '3.7 – Aplikasi Bidang PEPK' },
  { id: '3.8', namaProgram: '3.8 – Aplikasi Bidang Kebijakan Strategis - DPZT' },
  { id: '3.9', namaProgram: '3.9 – Aplikasi Bidang Kebijakan Strategis - DPDS' },
  { id: '3.10', namaProgram: '3.10 – Aplikasi Bidang Kebijakan Strategis - DINP' },
  { id: '3.11', namaProgram: '3.11 – Aplikasi Bidang Manajemen Strategis - DPJK' },
  { id: '3.12', namaProgram: '3.12 – Aplikasi Bidang Manajemen Strategis - DOSB' },
  { id: '3.13', namaProgram: '3.13 – Aplikasi Bidang Manajemen Strategis - DHUK' },
  { id: '3.14', namaProgram: '3.14 – Aplikasi Bidang Manajemen Strategis - DPSU' },
  { id: '3.15', namaProgram: '3.15 – Aplikasi Bidang Manajemen Strategis - DLOG' },
  { id: '3.16', namaProgram: '3.16 – Aplikasi Bidang Audit Internal dan Manajemen Risiko' },
];

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Perencanaan' },
  { value: 'ongoing', label: 'Berjalan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const AddInisiatif = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  
  const [programs] = useState<Program[]>(DUMMY_PROGRAMS);
  const [formData, setFormData] = useState<FormData>({
    namaInisiatif: '',
    programId: '',
    tahun: currentYear.toString(),
    status: 'planning',
    progress: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if there's a pre-selected program from URL params
  useEffect(() => {
    const programId = searchParams.get('programId');
    if (programId) {
      setFormData((prev) => ({ ...prev, programId }));
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.namaInisiatif.trim()) {
      newErrors.namaInisiatif = 'Nama Inisiatif wajib diisi';
    }
    if (!formData.programId) {
      newErrors.programId = 'Program wajib dipilih';
    }
    if (!formData.tahun) {
      newErrors.tahun = 'Tahun wajib diisi';
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

  const handleProgressChange = (_: Event, value: number | number[]) => {
    setFormData((prev) => ({
      ...prev,
      progress: value as number,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Form Data:', formData);
      setSuccessMessage('Inisiatif berhasil ditambahkan!');

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
          Tambah Inisiatif Baru
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
              Informasi Inisiatif
            </Typography>
            <Stack spacing={2.5}>
              {/* 1. Nama Inisiatif */}
              <TextField
                fullWidth
                label="Nama Inisiatif"
                name="namaInisiatif"
                value={formData.namaInisiatif}
                onChange={handleInputChange}
                error={!!errors.namaInisiatif}
                helperText={errors.namaInisiatif}
                placeholder="Contoh: Modernisasi Infrastruktur Cloud"
              />

              {/* Program Selection */}
              <TextField
                select
                fullWidth
                label="Program"
                name="programId"
                value={formData.programId}
                onChange={handleInputChange}
                error={!!errors.programId}
                helperText={errors.programId || 'Pilih program yang terkait'}
              >
                {programs.map((prog) => (
                  <MenuItem key={prog.id} value={prog.id}>
                    {prog.namaProgram}
                  </MenuItem>
                ))}
              </TextField>

              {/* 2. Tahun */}
              <TextField
                fullWidth
                label="Tahun"
                name="tahun"
                type="number"
                value={formData.tahun}
                onChange={handleInputChange}
                error={!!errors.tahun}
                helperText={errors.tahun}
                slotProps={{
                  htmlInput: { min: 2020, max: 2030 },
                }}
              />

              {/* 3. Status */}
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* 4. Progress */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>
                  Progress: {formData.progress}%
                </Typography>
                <Slider
                  value={formData.progress}
                  onChange={handleProgressChange}
                  min={0}
                  max={100}
                  step={5}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' },
                  ]}
                  sx={{
                    color: '#DA251C',
                    '& .MuiSlider-thumb': {
                      bgcolor: '#DA251C',
                    },
                    '& .MuiSlider-track': {
                      bgcolor: '#DA251C',
                    },
                  }}
                />
              </Box>
            </Stack>
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Inisiatif'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AddInisiatif;
