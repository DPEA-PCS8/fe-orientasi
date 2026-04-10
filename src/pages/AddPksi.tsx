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
  deskripsiPksi: string;
  mengapaPksiDiperlukan: string;
  kapanHarusDiselesaikan: string;
  picSatkerBA: string;
  kegunaanPksi: string;
  tujuanPksi: string;
  targetPksi: string;
  ruangLingkup: string;
  batasanPksi: string;
  hubunganSistemLain: string;
  asumsi: string;
  batasanDesain: string;
  riskoBisnis: string;
  risikoSuksesPksi: string;
  pengendalianRisiko: string;
  pengelolaAplikasi: string;
  penggunaAplikasi: string;
  programInisiatifRBSI: string;
  fungsiAplikasi: string;
  informasiYangDikelola: string;
  dasarPeraturan: string;
  tahap1Awal: string;
  tahap1Akhir: string;
  tahap5Awal: string;
  tahap5Akhir: string;
  tahap7Awal: string;
  tahap7Akhir: string;
  rencanaPengelolaan: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AddPksi = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | false>('section1');
  const [aplikasiList, setAplikasiList] = useState<AplikasiData[]>([]);
  const [loadingAplikasi, setLoadingAplikasi] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    namaPksi: '',
    aplikasiId: '',
    tanggalPengajuan: new Date().toISOString().split('T')[0],
    deskripsiPksi: '',
    mengapaPksiDiperlukan: '',
    kapanHarusDiselesaikan: '',
    picSatkerBA: '',
    kegunaanPksi: '',
    tujuanPksi: '',
    targetPksi: '',
    ruangLingkup: '',
    batasanPksi: '',
    hubunganSistemLain: '',
    asumsi: '',
    batasanDesain: '',
    riskoBisnis: '',
    risikoSuksesPksi: '',
    pengendalianRisiko: '',
    pengelolaAplikasi: '',
    penggunaAplikasi: '',
    programInisiatifRBSI: '',
    fungsiAplikasi: '',
    informasiYangDikelola: '',
    dasarPeraturan: '',
    tahap1Awal: '',
    tahap1Akhir: '',
    tahap5Awal: '',
    tahap5Akhir: '',
    tahap7Awal: '',
    tahap7Akhir: '',
    rencanaPengelolaan: '',
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
    if (!formData.deskripsiPksi) newErrors.deskripsiPksi = 'Deskripsi PKSI wajib diisi';
    if (!formData.mengapaPksiDiperlukan) newErrors.mengapaPksiDiperlukan = 'Alasan PKSI diperlukan wajib diisi';
    if (!formData.picSatkerBA) newErrors.picSatkerBA = 'PIC Satker wajib diisi';
    if (!formData.kegunaanPksi) newErrors.kegunaanPksi = 'Kegunaan PKSI wajib diisi';
    if (!formData.tujuanPksi) newErrors.tujuanPksi = 'Tujuan PKSI wajib diisi';
    if (!formData.pengelolaAplikasi) newErrors.pengelolaAplikasi = 'Pengelola Aplikasi wajib diisi';
    if (!formData.fungsiAplikasi) newErrors.fungsiAplikasi = 'Fungsi Aplikasi wajib diisi';

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
      // Create PKSI document
      const pksiData = {
        aplikasi_id: formData.aplikasiId || undefined,
        nama_pksi: formData.namaPksi,
        tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        deskripsi_pksi: formData.deskripsiPksi,
        mengapa_pksi_diperlukan: formData.mengapaPksiDiperlukan,
        kapan_harus_diselesaikan: formData.kapanHarusDiselesaikan || undefined,
        pic_satker_ba: formData.picSatkerBA,
        kegunaan_pksi: formData.kegunaanPksi,
        tujuan_pksi: formData.tujuanPksi,
        target_pksi: formData.targetPksi || undefined,
        ruang_lingkup: formData.ruangLingkup || undefined,
        batasan_pksi: formData.batasanPksi || undefined,
        hubungan_sistem_lain: formData.hubunganSistemLain || undefined,
        asumsi: formData.asumsi || undefined,
        batasan_desain: formData.batasanDesain || undefined,
        risiko_bisnis: formData.riskoBisnis || undefined,
        risiko_sukses_pksi: formData.risikoSuksesPksi || undefined,
        pengendalian_risiko: formData.pengendalianRisiko || undefined,
        pengelola_aplikasi: formData.pengelolaAplikasi,
        pengguna_aplikasi: formData.penggunaAplikasi || undefined,
        program_inisiatif_rbsi: formData.programInisiatifRBSI || undefined,
        fungsi_aplikasi: formData.fungsiAplikasi,
        informasi_yang_dikelola: formData.informasiYangDikelola || undefined,
        dasar_peraturan: formData.dasarPeraturan || undefined,
        tahap1_awal: formData.tahap1Awal || undefined,
        tahap1_akhir: formData.tahap1Akhir || undefined,
        tahap5_awal: formData.tahap5Awal || undefined,
        tahap5_akhir: formData.tahap5Akhir || undefined,
        tahap7_awal: formData.tahap7Awal || undefined,
        tahap7_akhir: formData.tahap7Akhir || undefined,
        rencana_pengelolaan: formData.rencanaPengelolaan || undefined,
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
            expanded={expandedSection === 'section1'}
            onChange={handleAccordionChange('section1')}
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
                1. Pendahuluan
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="1.1 Deskripsi PKSI"
                  name="deskripsiPksi"
                  value={formData.deskripsiPksi}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  error={!!errors.deskripsiPksi}
                  helperText={errors.deskripsiPksi}
                  InputLabelProps={{ required: false }}
                />
                <TextField
                  fullWidth
                  label="1.2 Mengapa PKSI Diperlukan"
                  name="mengapaPksiDiperlukan"
                  value={formData.mengapaPksiDiperlukan}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  error={!!errors.mengapaPksiDiperlukan}
                  helperText={errors.mengapaPksiDiperlukan}
                  InputLabelProps={{ required: false }}
                />
                <TextField
                  fullWidth
                  label="1.3 Kapan Harus Diselesaikan"
                  name="kapanHarusDiselesaikan"
                  value={formData.kapanHarusDiselesaikan}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  label="1.4 Satuan Kerja Pemilik Aplikasi"
                  name="picSatkerBA"
                  value={formData.picSatkerBA}
                  onChange={handleInputChange}
                  error={!!errors.picSatkerBA}
                  helperText={errors.picSatkerBA}
                  InputLabelProps={{ required: false }}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSection === 'section2'}
            onChange={handleAccordionChange('section2')}
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
                2. Tujuan dan Kegunaan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="2.1 Kegunaan PKSI"
                  name="kegunaanPksi"
                  value={formData.kegunaanPksi}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  error={!!errors.kegunaanPksi}
                  helperText={errors.kegunaanPksi}
                  InputLabelProps={{ required: false }}
                />
                <TextField
                  fullWidth
                  label="2.2 Tujuan PKSI"
                  name="tujuanPksi"
                  value={formData.tujuanPksi}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  error={!!errors.tujuanPksi}
                  helperText={errors.tujuanPksi}
                  InputLabelProps={{ required: false }}
                />
                <TextField
                  fullWidth
                  label="2.3 Target PKSI"
                  name="targetPksi"
                  value={formData.targetPksi}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSection === 'section3'}
            onChange={handleAccordionChange('section3')}
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
                3. Cakupan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="3.1 Ruang Lingkup PKSI (Yang Termasuk)"
                  name="ruangLingkup"
                  value={formData.ruangLingkup}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
                <TextField
                  fullWidth
                  label="3.2 Batasan PKSI (Yang Tidak Termasuk)"
                  name="batasanPksi"
                  value={formData.batasanPksi}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
                <TextField
                  fullWidth
                  label="3.3 Hubungan dengan Sistem Lainnya"
                  name="hubunganSistemLain"
                  value={formData.hubunganSistemLain}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="3.4 Asumsi"
                  name="asumsi"
                  value={formData.asumsi}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSection === 'section4'}
            onChange={handleAccordionChange('section4')}
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
                4. Risiko dan Batasan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="4.1 Batasan yang dapat berpengaruh pada desain sistem PKSI"
                  name="batasanDesain"
                  value={formData.batasanDesain}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="4.2 Risiko-risiko yang terkait dengan proses bisnis"
                  name="riskoBisnis"
                  value={formData.riskoBisnis}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Misalnya: risiko strategis, hukum, operasional, reputasi, kepatuhan, kecurangan, keuangan, dll"
                />
                <TextField
                  fullWidth
                  label="4.3 Risiko-risiko yang dapat berpengaruh pada suksesnya penyelesaian PKSI"
                  name="risikoSuksesPksi"
                  value={formData.risikoSuksesPksi}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="4.4 Bagaimana risiko-risiko tersebut dapat dikendalikan"
                  name="pengendalianRisiko"
                  value={formData.pengendalianRisiko}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSection === 'section5'}
            onChange={handleAccordionChange('section5')}
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
                5. Gambaran Umum Aplikasi yang Diharapkan
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="5.1 Pengelola Aplikasi"
                  name="pengelolaAplikasi"
                  value={formData.pengelolaAplikasi}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  error={!!errors.pengelolaAplikasi}
                  helperText={errors.pengelolaAplikasi}
                  InputLabelProps={{ required: false }}
                />
                <TextField
                  fullWidth
                  label="5.2 Pengguna Aplikasi"
                  name="penggunaAplikasi"
                  value={formData.penggunaAplikasi}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  label="5.3 Program Inisiatif RBSI"
                  name="programInisiatifRBSI"
                  value={formData.programInisiatifRBSI}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  label="5.4 Fungsi Aplikasi"
                  name="fungsiAplikasi"
                  value={formData.fungsiAplikasi}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  error={!!errors.fungsiAplikasi}
                  helperText={errors.fungsiAplikasi}
                  InputLabelProps={{ required: false }}
                />
                <TextField
                  fullWidth
                  label="5.5 Informasi yang akan dikelola dalam sistem"
                  name="informasiYangDikelola"
                  value={formData.informasiYangDikelola}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="5.6 Dasar Peraturan"
                  name="dasarPeraturan"
                  value={formData.dasarPeraturan}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSection === 'section6'}
            onChange={handleAccordionChange('section6')}
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
                6. Usulan Jadwal Pelaksanaan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                    Tahap 1: Penyusunan Spesifikasi Kebutuhan Aplikasi
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Bulan Awal"
                      name="tahap1Awal"
                      type="month"
                      value={formData.tahap1Awal}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Bulan Akhir"
                      name="tahap1Akhir"
                      type="month"
                      value={formData.tahap1Akhir}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                    Tahap 5: Pengujian Aplikasi – User Acceptance Test (UAT)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Bulan Awal"
                      name="tahap5Awal"
                      type="month"
                      value={formData.tahap5Awal}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Bulan Akhir"
                      name="tahap5Akhir"
                      type="month"
                      value={formData.tahap5Akhir}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                    Tahap 7: Penggunaan Aplikasi (Go-Live)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Bulan Awal"
                      name="tahap7Awal"
                      type="month"
                      value={formData.tahap7Awal}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Bulan Akhir"
                      name="tahap7Akhir"
                      type="month"
                      value={formData.tahap7Akhir}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={expandedSection === 'section7'}
            onChange={handleAccordionChange('section7')}
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
                7. Rencana Pengelolaan
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              <TextField
                fullWidth
                label="Rencana Pengelolaan"
                name="rencanaPengelolaan"
                value={formData.rencanaPengelolaan}
                onChange={handleInputChange}
                multiline
                rows={6}
                placeholder="Jelaskan rencana pengelolaan PKSI..."
              />
            </AccordionDetails>
          </Accordion>

          {/* Upload File Section */}
          <Accordion
            expanded={expandedSection === 'section8'}
            onChange={handleAccordionChange('section8')}
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
                8. Upload Dokumen
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







