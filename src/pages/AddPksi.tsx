import { useState, useEffect } from 'react';
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input value to allow uploading same file again
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log('Form Data:', formData);
      setSuccessMessage('PKSI berhasil ditambahkan!');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                1. Pendahuluan
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                2. Tujuan dan Kegunaan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                3. Cakupan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                4. Risiko dan Batasan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                5. Gambaran Umum Aplikasi yang Diharapkan
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ width: '100%' }}>
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                6. Usulan Jadwal Pelaksanaan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3} sx={{ width: '100%' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                    Tahap 1: Penyusunan Spesifikasi Kebutuhan Aplikasi
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Awal Tahap"
                      name="tahap1Awal"
                      type="date"
                      value={formData.tahap1Awal}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Akhir Tahap"
                      name="tahap1Akhir"
                      type="date"
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
                      label="Awal Tahap"
                      name="tahap5Awal"
                      type="date"
                      value={formData.tahap5Awal}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Akhir Tahap"
                      name="tahap5Akhir"
                      type="date"
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
                      label="Awal Tahap"
                      name="tahap7Awal"
                      type="date"
                      value={formData.tahap7Awal}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Akhir Tahap"
                      name="tahap7Akhir"
                      type="date"
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                7. Rencana Pengelolaan
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
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
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                8. Upload Dokumen T.0.1
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Box
                  sx={{
                    border: '2px dashed #e5e5e7',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#DA251C',
                      bgcolor: 'rgba(218, 37, 28, 0.04)',
                    },
                  }}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <input
                    id="file-upload-input"
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileUpload}
                    accept=".pdf"
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
                  <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                    Klik untuk upload file
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
                    atau drag & drop file di sini
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>
                    Format yang didukung: PDF
                  </Typography>
                </Box>

                {uploadedFiles.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                      File yang diupload ({uploadedFiles.length})
                    </Typography>
                    <List sx={{ bgcolor: '#f5f5f7', borderRadius: 1 }}>
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







