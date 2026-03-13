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
  Box,
  IconButton,
  Alert,
  MenuItem,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { createInisiatif, getInisiatifGroups, type InisiatifGroupResponse } from '../../api/rbsiApi';
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
  usePreviousYear: boolean; // Checkbox: sama seperti tahun sebelumnya?
  selectedGroupId: string; // Selected initiative group (when usePreviousYear = true)
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AddInisiatifModal = ({ open, onClose, onSuccess, preselectedProgramId, programs }: AddInisiatifModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    nomorInisiatifSuffix: '',
    namaInisiatif: '',
    programId: '',
    usePreviousYear: false,
    selectedGroupId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [inisiatifGroups, setInisiatifGroups] = useState<InisiatifGroupResponse[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

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

  // Fetch initiative groups when modal opens and selected program has RBSI ID
  useEffect(() => {
    if (open && selectedProgram && formData.usePreviousYear) {
      fetchInisiatifGroups(selectedProgram.rbsi_id);
    }
  }, [open, selectedProgram, formData.usePreviousYear]);

  // Auto-fill nama when group selected
  useEffect(() => {
    if (formData.selectedGroupId && inisiatifGroups.length > 0) {
      const selectedGroup = inisiatifGroups.find(g => g.id === formData.selectedGroupId);
      if (selectedGroup) {
        setFormData(prev => ({
          ...prev,
          namaInisiatif: selectedGroup.nama_inisiatif,
        }));
      }
    }
  }, [formData.selectedGroupId, inisiatifGroups]);

  const fetchInisiatifGroups = async (rbsiId: string) => {
    setLoadingGroups(true);
    try {
      const response = await getInisiatifGroups(rbsiId);
      setInisiatifGroups(response.data || []);
    } catch (error) {
      console.error('Failed to fetch inisiatif groups:', error);
      setInisiatifGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nomorInisiatifSuffix: '',
      namaInisiatif: '',
      programId: preselectedProgramId || '',
      usePreviousYear: false,
      selectedGroupId: '',
    });
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    setInisiatifGroups([]);
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
        ...(formData.usePreviousYear && formData.selectedGroupId ? { group_id: formData.selectedGroupId } : {}),
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

          {/* Checkbox: Sama seperti tahun sebelumnya */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.usePreviousYear}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    usePreviousYear: checked,
                    selectedGroupId: checked ? prev.selectedGroupId : '',
                  }));
                }}
                disabled={!formData.programId}
                sx={{
                  color: '#DA251C',
                  '&.Mui-checked': { color: '#DA251C' },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                Sama seperti tahun sebelumnya (grup inisiatif)
              </Typography>
            }
          />

          {/* Autocomplete: Select Initiative Group with Search (conditional) */}
          {formData.usePreviousYear && (
            <Autocomplete
              fullWidth
              options={inisiatifGroups}
              value={inisiatifGroups.find(g => g.id === formData.selectedGroupId) || null}
              onChange={(_, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  selectedGroupId: newValue?.id || '',
                }));
              }}
              getOptionLabel={(option) => option.nama_inisiatif}
              disabled={loadingGroups || inisiatifGroups.length === 0}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pilih Grup Inisiatif"
                  helperText={
                    loadingGroups
                      ? 'Memuat grup inisiatif...'
                      : inisiatifGroups.length === 0
                      ? 'Belum ada grup inisiatif tersedia'
                      : 'Ketik untuk mencari inisiatif dari tahun sebelumnya'
                  }
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {option.nama_inisiatif}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                      Tahun: {option.tahun_list.join(', ')} • Nomor: {option.nomor_inisiatif_by_year[option.nomor_inisiatif_by_year.length - 1]?.nomor_inisiatif || '-'}
                    </Typography>
                  </Box>
                </li>
              )}
              ListboxProps={{
                style: { maxHeight: 280 },
              }}
              noOptionsText="Tidak ada grup inisiatif"
            />
          )}

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
