import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { getAllAplikasi, type AplikasiData } from '../api/aplikasiApi';
import { createPksiDocument } from '../api/pksiApi';
import {
  uploadPksiTempFiles,
  movePksiTempFilesToPermanent,
  deletePksiTempFiles,
  deletePksiFile,
  type PksiFileData,
} from '../api/pksiFileApi';

interface FormData {
  namaPksi: string;
  aplikasiId: string;
  tanggalPengajuan: string;
  targetUsreq: string;
  targetSit: string;
  targetUat: string;
  targetGoLive: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// Returns 'YYYY-MM-DD' for the last day of the given month string 'YYYY-MM'
const lastDayOfMonth = (yearMonth: string): string => {
  if (!yearMonth) return '';
  const [y, m] = yearMonth.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(last).padStart(2, '0')}`;
};

const currentMonthValue = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return lastDayOfMonth(`${y}-${m}`);
};

const AddPksi = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | false>('jadwal');
  const [aplikasiList, setAplikasiList] = useState<AplikasiData[]>([]);
  const [loadingAplikasi, setLoadingAplikasi] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    namaPksi: '',
    aplikasiId: '',
    tanggalPengajuan: new Date().toISOString().split('T')[0],
    targetUsreq: currentMonthValue(),
    targetSit: currentMonthValue(),
    targetUat: currentMonthValue(),
    targetGoLive: currentMonthValue(),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileData, setUploadedFileData] = useState<PksiFileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Generate session ID for temp file uploads
  const sessionId = useMemo(() => {
    return `pksi_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  useEffect(() => {
    const fetchAplikasi = async () => {
      setLoadingAplikasi(true);
      try {
        const response = await getAllAplikasi();
        setAplikasiList(response.data);
      } catch (error) {
        console.error('Failed to fetch aplikasi:', error);
      } finally {
        setLoadingAplikasi(false);
      }
    };
    fetchAplikasi();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && sessionId) {
      const file = files[0];
      
      // Delete existing file if any (single file upload)
      if (uploadedFileData.length > 0 && uploadedFileData[0]?.id) {
        try {
          await deletePksiFile(uploadedFileData[0].id);
        } catch (error) {
          console.error('Failed to delete existing file:', error);
        }
      }
      
      setIsUploading(true);
      setErrorMessage('');
      try {
        const uploadedData = await uploadPksiTempFiles(sessionId, [file]);
        setUploadedFiles([file]);
        setUploadedFileData(uploadedData);
      } catch (error) {
        console.error('Failed to upload file:', error);
        setErrorMessage('Gagal mengupload file. Silakan coba lagi.');
      } finally {
        setIsUploading(false);
      }
    }
    // Reset input value to allow uploading same file again
    event.target.value = '';
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = uploadedFileData[index];
    if (fileToRemove?.id) {
      try {
        await deletePksiFile(fileToRemove.id);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileData((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.namaPksi) newErrors.namaPksi = 'Nama PKSI wajib diisi';

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
      const pksiData = {
        aplikasi_id: formData.aplikasiId || undefined,
        nama_pksi: formData.namaPksi,
        tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        target_usreq: formData.targetUsreq || undefined,
        target_sit: formData.targetSit || undefined,
        target_uat: formData.targetUat || undefined,
        target_go_live: formData.targetGoLive || undefined,
      };

      const createdPksi = await createPksiDocument(pksiData);
      
      // Move temp files to permanent storage if any
      if (sessionId && uploadedFileData.length > 0) {
        await movePksiTempFilesToPermanent(createdPksi.id, sessionId);
      }
      
      setSuccessMessage('PKSI berhasil ditambahkan!');
      
      setTimeout(() => {
        navigate('/pksi');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage('Gagal menyimpan PKSI. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    // Clean up temp files when canceling
    if (sessionId && uploadedFileData.length > 0) {
      try {
        await deletePksiTempFiles(sessionId);
      } catch (error) {
        console.error('Failed to delete temp files:', error);
      }
    }
    navigate('/pksi');
  };

  return (
    <Box sx={{ p: 3 }}>
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
          Tambah PKSI Baru
        </Typography>
      </Box>

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

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1d1d1f' }}>
              Informasi Dasar
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nama PKSI"
                name="namaPksi"
                value={formData.namaPksi}
                onChange={handleInputChange}
                error={!!errors.namaPksi}
                helperText={errors.namaPksi}
                InputLabelProps={{ required: false }}
              />
              <TextField
                fullWidth
                label="Tanggal Pengajuan"
                name="tanggalPengajuan"
                type="date"
                value={formData.tanggalPengajuan}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true, required: false }}
              />
              <Autocomplete
                options={aplikasiList}
                getOptionLabel={(option) => option.nama_aplikasi || ''}
                loading={loadingAplikasi}
                value={aplikasiList.find(app => app.id === formData.aplikasiId) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    aplikasiId: newValue?.id || ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Aplikasi"
                    error={!!errors.aplikasiId}
                    helperText={errors.aplikasiId}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingAplikasi ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Stack>
          </Box>

          <Divider />

          <Accordion
            expanded={expandedSection === 'jadwal'}
            onChange={handleAccordionChange('jadwal')}
            sx={{
              borderRadius: '20px !important',
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              '&::before': { display: 'none' },
              '&.Mui-expanded': { margin: '0 !important' },
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
              sx={{
                borderRadius: '20px',
                px: 2.5,
                '&.Mui-expanded': { minHeight: 56 },
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  color: '#1d1d1f',
                  fontSize: '0.95rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Usulan Jadwal Pelaksanaan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 3, pt: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 1.5, alignItems: 'stretch' }}>

                {/* Card 1 — Target Usreq */}
                <Box sx={{ flex: 1, minWidth: { xs: 'calc(50% - 6px)', md: 0 }, borderRadius: '18px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #6366F1, #818CF8)' }} />
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.45)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem', lineHeight: 1 }}>1</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target Usreq</Typography>
                    </Box>
                    <TextField
                      fullWidth size='small' type='month'
                      value={formData.targetUsreq ? formData.targetUsreq.substring(0, 7) : ''}
                      onChange={(e) => setFormData(p => ({ ...p, targetUsreq: e.target.value ? lastDayOfMonth(e.target.value) : '' }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: 'rgba(99,102,241,0.07)', backdropFilter: 'blur(10px)', '& fieldset': { border: '1px solid rgba(99,102,241,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.82rem', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

                {/* Connector */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexShrink: 0 }}>
                  <Box sx={{ width: 20, height: 2, background: 'linear-gradient(90deg, #818CF8, #A78BFA)' }} />
                  <Box sx={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '7px solid #A78BFA' }} />
                </Box>

                {/* Card 2 — Target SIT */}
                <Box sx={{ flex: 1, minWidth: { xs: 'calc(50% - 6px)', md: 0 }, borderRadius: '18px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }} />
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(139,92,246,0.45)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem', lineHeight: 1 }}>2</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target SIT</Typography>
                    </Box>
                    <TextField
                      fullWidth size='small' type='month'
                      value={formData.targetSit ? formData.targetSit.substring(0, 7) : ''}
                      onChange={(e) => setFormData(p => ({ ...p, targetSit: e.target.value ? lastDayOfMonth(e.target.value) : '' }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: 'rgba(139,92,246,0.07)', backdropFilter: 'blur(10px)', '& fieldset': { border: '1px solid rgba(139,92,246,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(139,92,246,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#8B5CF6', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.82rem', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

                {/* Connector */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexShrink: 0 }}>
                  <Box sx={{ width: 20, height: 2, background: 'linear-gradient(90deg, #A78BFA, #FCD34D)' }} />
                  <Box sx={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '7px solid #FCD34D' }} />
                </Box>

                {/* Card 3 — Target UAT/PDKK */}
                <Box sx={{ flex: 1, minWidth: { xs: 'calc(50% - 6px)', md: 0 }, borderRadius: '18px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #F59E0B, #FCD34D)' }} />
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.45)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem', lineHeight: 1 }}>3</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target UAT/PDKK</Typography>
                    </Box>
                    <TextField
                      fullWidth size='small' type='month'
                      value={formData.targetUat ? formData.targetUat.substring(0, 7) : ''}
                      onChange={(e) => setFormData(p => ({ ...p, targetUat: e.target.value ? lastDayOfMonth(e.target.value) : '' }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: 'rgba(245,158,11,0.07)', backdropFilter: 'blur(10px)', '& fieldset': { border: '1px solid rgba(245,158,11,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(245,158,11,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#F59E0B', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.82rem', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

                {/* Connector */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexShrink: 0 }}>
                  <Box sx={{ width: 20, height: 2, background: 'linear-gradient(90deg, #FCD34D, #34D399)' }} />
                  <Box sx={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '7px solid #34D399' }} />
                </Box>

                {/* Card 4 — Target Go Live */}
                <Box sx={{ flex: 1, minWidth: { xs: 'calc(50% - 6px)', md: 0 }, borderRadius: '18px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.45)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem', lineHeight: 1 }}>4</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target Go Live</Typography>
                    </Box>
                    <TextField
                      fullWidth size='small' type='month'
                      value={formData.targetGoLive ? formData.targetGoLive.substring(0, 7) : ''}
                      onChange={(e) => setFormData(p => ({ ...p, targetGoLive: e.target.value ? lastDayOfMonth(e.target.value) : '' }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: 'rgba(16,185,129,0.07)', backdropFilter: 'blur(10px)', '& fieldset': { border: '1px solid rgba(16,185,129,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#10B981', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.82rem', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Upload Dokumen */}
          <Accordion
            expanded={expandedSection === 'upload'}
            onChange={handleAccordionChange('upload')}
            sx={{
              borderRadius: '20px !important',
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              '&::before': { display: 'none' },
              '&.Mui-expanded': { margin: '0 !important' },
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#86868b', transition: 'transform 0.3s ease' }} />}
              sx={{
                borderRadius: '20px',
                px: 2.5,
                '&.Mui-expanded': { minHeight: 56 },
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  color: '#1d1d1f',
                  fontSize: '0.95rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Upload Dokumen
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    border: '2px dashed #e5e5e7',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    opacity: isUploading ? 0.7 : 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: isUploading ? '#e5e5e7' : '#DA251C',
                      bgcolor: isUploading ? 'transparent' : 'rgba(218, 37, 28, 0.04)',
                    },
                  }}
                  onClick={() => !isUploading && document.getElementById('pksi-file-upload-input')?.click()}
                >
                  <input
                    id="pksi-file-upload-input"
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <>
                      <CircularProgress size={48} sx={{ color: '#DA251C', mb: 1 }} />
                      <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                        Mengupload file...
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
                      <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                        Klik untuk upload file
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
                        atau drag & drop file di sini
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>
                        Format yang didukung: PDF, Word, Excel, Gambar (max 20MB)
                      </Typography>
                    </>
                  )}
                </Box>

                {uploadedFiles.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                      File yang diupload ({uploadedFiles.length})
                    </Typography>
                    <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px' }}>
                      {uploadedFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            borderBottom: index < uploadedFiles.length - 1 ? '1px solid #e5e5e7' : 'none',
                          }}
                        >
                          <ListItemIcon>
                            <FileIcon sx={{ color: '#DA251C' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={formatFileSize(file.size)}
                            primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f' } }}
                            secondaryTypographyProps={{ sx: { color: '#86868b' } }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(index)}
                              disabled={isUploading}
                              sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isSubmitting}
              sx={{
                borderColor: '#86868b',
                color: '#86868b',
                '&:hover': {
                  borderColor: '#1d1d1f',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
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
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
                },
                '&:disabled': {
                  background: '#e5e5e7',
                },
              }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan PKSI'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AddPksi;







