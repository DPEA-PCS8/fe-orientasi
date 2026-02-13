import { useState, useEffect } from 'react';
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
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { createInisiatif } from '../../api/rbsiApi';
import type { RbsiProgramResponse } from '../../api/rbsiApi';

interface AddInisiatifModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedProgramId?: string;
  programs: RbsiProgramResponse[];
}

interface FormData {
  nomorInisiatifSuffix: string; // Only the suffix, e.g., "1" for "3.1.1"
  namaInisiatif: string;
  programId: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AddInisiatifModal = ({ open, onClose, onSuccess, preselectedProgramId, programs }: AddInisiatifModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    nomorInisiatifSuffix: '',
    namaInisiatif: '',
    programId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Get selected program details
  const selectedProgram = programs.find(p => p.id === formData.programId);
  const nomorPrefix = selectedProgram ? `${selectedProgram.nomor_program}.` : '';
  const tahunFromProgram = selectedProgram?.tahun || '';

  // Set preselected program when modal opens
  useEffect(() => {
    if (preselectedProgramId && open) {
      setFormData((prev) => ({ ...prev, programId: preselectedProgramId }));
    }
  }, [preselectedProgramId, open]);

  const resetForm = () => {
    setFormData({
      nomorInisiatifSuffix: '',
      namaInisiatif: '',
      programId: preselectedProgramId || '',
    });
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nomorInisiatifSuffix.trim()) {
      newErrors.nomorInisiatifSuffix = 'Nomor Inisiatif wajib diisi';
    }
    if (!formData.namaInisiatif.trim()) {
      newErrors.namaInisiatif = 'Nama Inisiatif wajib diisi';
    }
    if (!formData.programId) {
      newErrors.programId = 'Program wajib dipilih';
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

    if (!selectedProgram) {
      setErrorMessage('Program tidak valid');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const fullNomorInisiatif = `${nomorPrefix}${formData.nomorInisiatifSuffix.trim()}`;
      
      await createInisiatif({
        program_id: formData.programId,
        tahun: selectedProgram.tahun,
        nomor_inisiatif: fullNomorInisiatif,
        nama_inisiatif: formData.namaInisiatif.trim(),
      });

      setSuccessMessage('Inisiatif berhasil ditambahkan!');

      setTimeout(() => {
        resetForm();
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menyimpan inisiatif');
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
          Tambah Inisiatif Baru
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
            Informasi Inisiatif
          </Typography>

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
                {prog.nomor_program} - {prog.nama_program} ({prog.tahun})
              </MenuItem>
            ))}
          </TextField>

          {/* Tahun (Read-only, auto-filled from program) */}
          <TextField
            fullWidth
            label="Tahun"
            value={tahunFromProgram}
            disabled
            helperText="Tahun otomatis mengikuti program yang dipilih"
          />

          {/* Nomor Inisiatif with prefix */}
          <TextField
            fullWidth
            label="Nomor Inisiatif"
            name="nomorInisiatifSuffix"
            value={formData.nomorInisiatifSuffix}
            onChange={handleInputChange}
            error={!!errors.nomorInisiatifSuffix}
            helperText={errors.nomorInisiatifSuffix || (nomorPrefix ? `Nomor lengkap: ${nomorPrefix}${formData.nomorInisiatifSuffix || '...'}` : 'Pilih program terlebih dahulu')}
            placeholder="1"
            disabled={!formData.programId}
            slotProps={{
              input: {
                startAdornment: nomorPrefix ? (
                  <InputAdornment position="start">
                    <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>{nomorPrefix}</Typography>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />

          {/* Nama Inisiatif */}
          <TextField
            fullWidth
            label="Nama Inisiatif"
            name="namaInisiatif"
            value={formData.namaInisiatif}
            onChange={handleInputChange}
            error={!!errors.namaInisiatif}
            helperText={errors.namaInisiatif}
            placeholder="Contoh: Aplikasi Pelaporan Online OJK (APOLO)"
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
          {isSubmitting ? 'Menyimpan...' : 'Simpan Inisiatif'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddInisiatifModal;
