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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { getAllSkpa, type SkpaData } from '../../api/skpaApi';
import { createPksiDocument, type PksiDocumentRequest } from '../../api/pksiApi';
import { getUserInfo } from '../../api/authApi';

interface SkpaOption {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
}

interface AddPksiModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  namaPksi: string;
  tanggalPengajuan: string;
  deskripsiPksi: string;
  mengapaPksiDiperlukan: string;
  kapanHarusDiselesaikan: string;
  picSatkerBA: string[];
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

const AddPksiModal = ({ open, onClose, onSuccess }: AddPksiModalProps) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('section1');
  const [formData, setFormData] = useState<FormData>({
    namaPksi: '',
    tanggalPengajuan: new Date().toISOString().split('T')[0],
    deskripsiPksi: '',
    mengapaPksiDiperlukan: '',
    kapanHarusDiselesaikan: '',
    picSatkerBA: [],
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
  const [skpaOptions, setSkpaOptions] = useState<SkpaOption[]>([]);

  // Fetch SKPA options on mount
  useEffect(() => {
    const fetchSkpaOptions = async () => {
      try {
        const response = await getAllSkpa();
        const mappedSkpa: SkpaOption[] = (response.data || []).map((skpa: SkpaData) => ({
          id: skpa.id,
          kode_skpa: skpa.kode_skpa,
          nama_skpa: skpa.nama_skpa,
        }));
        setSkpaOptions(mappedSkpa);
      } catch (error) {
        console.error('Error fetching SKPA options:', error);
      }
    };
    fetchSkpaOptions();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
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

  const resetForm = () => {
    setFormData({
      namaPksi: '',
      tanggalPengajuan: new Date().toISOString().split('T')[0],
      deskripsiPksi: '',
      mengapaPksiDiperlukan: '',
      kapanHarusDiselesaikan: '',
      picSatkerBA: [],
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
    setErrors({});
    setSuccessMessage('');
    setExpandedSection('section1');
    setUploadedFiles([]);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.namaPksi) newErrors.namaPksi = 'Nama PKSI wajib diisi';
    if (!formData.deskripsiPksi) newErrors.deskripsiPksi = 'Deskripsi PKSI wajib diisi';
    if (!formData.mengapaPksiDiperlukan) newErrors.mengapaPksiDiperlukan = 'Alasan PKSI diperlukan wajib diisi';
    if (formData.picSatkerBA.length === 0) newErrors.picSatkerBA = 'Satuan Kerja Pemilik Aplikasi wajib dipilih';
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
      const requestData: PksiDocumentRequest = {
        nama_pksi: formData.namaPksi,
        tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        deskripsi_pksi: formData.deskripsiPksi,
        mengapa_pksi_diperlukan: formData.mengapaPksiDiperlukan,
        kapan_harus_diselesaikan: formData.kapanHarusDiselesaikan || undefined,
        pic_satker_ba: formData.picSatkerBA.join(','),
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
        user_id: getUserInfo()?.uuid || '',
      };

      await createPksiDocument(requestData);
      setSuccessMessage('PKSI berhasil ditambahkan!');
      
      setTimeout(() => {
        resetForm();
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh',
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
          Tambah PKSI Baru
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

        <Stack spacing={2.5}>
          {/* Informasi Dasar */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#1d1d1f' }}>
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
                size="small"
              />
              <TextField
                fullWidth
                label="Tanggal Pengajuan"
                name="tanggalPengajuan"
                type="date"
                value={formData.tanggalPengajuan}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Stack>
          </Box>

          {/* Section 1 */}
          <Accordion
            expanded={expandedSection === 'section1'}
            onChange={handleAccordionChange('section1')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                1. Pendahuluan
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField fullWidth label="1.1 Deskripsi PKSI" name="deskripsiPksi" value={formData.deskripsiPksi} onChange={handleInputChange} multiline rows={3} error={!!errors.deskripsiPksi} helperText={errors.deskripsiPksi} size="small" />
                <TextField fullWidth label="1.2 Mengapa PKSI Diperlukan" name="mengapaPksiDiperlukan" value={formData.mengapaPksiDiperlukan} onChange={handleInputChange} multiline rows={3} error={!!errors.mengapaPksiDiperlukan} helperText={errors.mengapaPksiDiperlukan} size="small" />
                <TextField fullWidth label="1.3 Kapan Harus Diselesaikan" name="kapanHarusDiselesaikan" value={formData.kapanHarusDiselesaikan} onChange={handleInputChange} multiline rows={2} size="small" />
                <Autocomplete
                  multiple
                  fullWidth
                  options={skpaOptions}
                  getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                  value={skpaOptions.filter(skpa => formData.picSatkerBA.includes(skpa.id))}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      picSatkerBA: newValue.map(skpa => skpa.id)
                    }));
                    if (errors.picSatkerBA) {
                      setErrors(prev => ({ ...prev, picSatkerBA: undefined }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="1.4 Satuan Kerja Pemilik Aplikasi"
                      error={!!errors.picSatkerBA}
                      helperText={errors.picSatkerBA}
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.kode_skpa}
                        size="small"
                        sx={{
                          bgcolor: '#DA251C',
                          color: 'white',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              color: 'white',
                            },
                          },
                        }}
                      />
                    ))
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  size="small"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Section 2 */}
          <Accordion
            expanded={expandedSection === 'section2'}
            onChange={handleAccordionChange('section2')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                2. Tujuan dan Kegunaan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField fullWidth label="2.1 Kegunaan PKSI" name="kegunaanPksi" value={formData.kegunaanPksi} onChange={handleInputChange} multiline rows={3} error={!!errors.kegunaanPksi} helperText={errors.kegunaanPksi} size="small" />
                <TextField fullWidth label="2.2 Tujuan PKSI" name="tujuanPksi" value={formData.tujuanPksi} onChange={handleInputChange} multiline rows={3} error={!!errors.tujuanPksi} helperText={errors.tujuanPksi} size="small" />
                <TextField fullWidth label="2.3 Target PKSI" name="targetPksi" value={formData.targetPksi} onChange={handleInputChange} multiline rows={2} size="small" />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Section 3 */}
          <Accordion
            expanded={expandedSection === 'section3'}
            onChange={handleAccordionChange('section3')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                3. Cakupan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField fullWidth label="3.1 Ruang Lingkup PKSI" name="ruangLingkup" value={formData.ruangLingkup} onChange={handleInputChange} multiline rows={3} size="small" />
                <TextField fullWidth label="3.2 Batasan PKSI" name="batasanPksi" value={formData.batasanPksi} onChange={handleInputChange} multiline rows={3} size="small" />
                <TextField fullWidth label="3.3 Hubungan dengan Sistem Lainnya" name="hubunganSistemLain" value={formData.hubunganSistemLain} onChange={handleInputChange} multiline rows={2} size="small" />
                <TextField fullWidth label="3.4 Asumsi" name="asumsi" value={formData.asumsi} onChange={handleInputChange} multiline rows={2} size="small" />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Section 4 */}
          <Accordion
            expanded={expandedSection === 'section4'}
            onChange={handleAccordionChange('section4')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                4. Risiko dan Batasan PKSI
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField fullWidth label="4.1 Batasan Desain" name="batasanDesain" value={formData.batasanDesain} onChange={handleInputChange} multiline rows={2} size="small" />
                <TextField fullWidth label="4.2 Risiko Bisnis" name="riskoBisnis" value={formData.riskoBisnis} onChange={handleInputChange} multiline rows={3} size="small" />
                <TextField fullWidth label="4.3 Risiko Sukses PKSI" name="risikoSuksesPksi" value={formData.risikoSuksesPksi} onChange={handleInputChange} multiline rows={2} size="small" />
                <TextField fullWidth label="4.4 Pengendalian Risiko" name="pengendalianRisiko" value={formData.pengendalianRisiko} onChange={handleInputChange} multiline rows={2} size="small" />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Section 5 */}
          <Accordion
            expanded={expandedSection === 'section5'}
            onChange={handleAccordionChange('section5')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                5. Gambaran Umum Aplikasi
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <TextField fullWidth label="5.1 Pengelola Aplikasi" name="pengelolaAplikasi" value={formData.pengelolaAplikasi} onChange={handleInputChange} error={!!errors.pengelolaAplikasi} helperText={errors.pengelolaAplikasi} size="small" />
                <TextField fullWidth label="5.2 Pengguna Aplikasi" name="penggunaAplikasi" value={formData.penggunaAplikasi} onChange={handleInputChange} size="small" />
                <TextField fullWidth label="5.3 Program Inisiatif RBSI" name="programInisiatifRBSI" value={formData.programInisiatifRBSI} onChange={handleInputChange} size="small" />
                <TextField fullWidth label="5.4 Fungsi Aplikasi" name="fungsiAplikasi" value={formData.fungsiAplikasi} onChange={handleInputChange} multiline rows={2} error={!!errors.fungsiAplikasi} helperText={errors.fungsiAplikasi} size="small" />
                <TextField fullWidth label="5.5 Informasi yang Dikelola" name="informasiYangDikelola" value={formData.informasiYangDikelola} onChange={handleInputChange} multiline rows={2} size="small" />
                <TextField fullWidth label="5.6 Dasar Peraturan" name="dasarPeraturan" value={formData.dasarPeraturan} onChange={handleInputChange} size="small" />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Section 6 */}
          <Accordion
            expanded={expandedSection === 'section6'}
            onChange={handleAccordionChange('section6')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                6. Usulan Jadwal Pelaksanaan
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#86868b' }}>Tahap 1: Penyusunan Spesifikasi</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField fullWidth label="Awal" name="tahap1Awal" type="date" value={formData.tahap1Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                  <TextField fullWidth label="Akhir" name="tahap1Akhir" type="date" value={formData.tahap1Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#86868b' }}>Tahap 5: UAT</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField fullWidth label="Awal" name="tahap5Awal" type="date" value={formData.tahap5Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                  <TextField fullWidth label="Akhir" name="tahap5Akhir" type="date" value={formData.tahap5Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#86868b' }}>Tahap 7: Go-Live</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField fullWidth label="Awal" name="tahap7Awal" type="date" value={formData.tahap7Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                  <TextField fullWidth label="Akhir" name="tahap7Akhir" type="date" value={formData.tahap7Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Section 7 */}
          <Accordion
            expanded={expandedSection === 'section7'}
            onChange={handleAccordionChange('section7')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                7. Rencana Pengelolaan
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField fullWidth label="Rencana Pengelolaan" name="rencanaPengelolaan" value={formData.rencanaPengelolaan} onChange={handleInputChange} multiline rows={4} size="small" />
            </AccordionDetails>
          </Accordion>

          {/* Section 8 - Upload File */}
          <Accordion
            expanded={expandedSection === 'section8'}
            onChange={handleAccordionChange('section8')}
            sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
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
                  onClick={() => document.getElementById('modal-file-upload-input')?.click()}
                >
                  <input
                    id="modal-file-upload-input"
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileUpload}
                    accept=".pdf"
                  />
                  <CloudUploadIcon sx={{ fontSize: 40, color: '#86868b', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                    Klik untuk upload file
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 0.5 }}>
                    PDF
                  </Typography>
                </Box>

                {uploadedFiles.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                      File yang diupload ({uploadedFiles.length})
                    </Typography>
                    <List dense sx={{ bgcolor: '#f5f5f7', borderRadius: 1 }}>
                      {uploadedFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            borderBottom: index < uploadedFiles.length - 1 ? '1px solid #e5e5e7' : 'none',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FileIcon sx={{ color: '#DA251C', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={formatFileSize(file.size)}
                            primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem' } }}
                            secondaryTypographyProps={{ sx: { color: '#86868b', fontSize: '0.75rem' } }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleRemoveFile(index)}
                              sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}
                            >
                              <DeleteIcon fontSize="small" />
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
          {isSubmitting ? 'Menyimpan...' : 'Simpan PKSI'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPksiModal;
