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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface FormData {
  // Basic Info
  namaPksi: string;
  tanggalPengajuan: string;

  // 1. Pendahuluan
  deskripsiPksi: string;
  mengapaPksiDiperlukan: string;
  kapanHarusDiselesaikan: string;
  picSatkerBA: string;

  // 2. Tujuan dan Kegunaan
  kegunaanPksi: string;
  tujuanPksi: string;
  targetPksi: string;

  // 3. Cakupan PKSI
  ruangLingkup: string;
  batasanPksi: string;
  hubunganSistemLain: string;
  asumsi: string;

  // 4. Risiko dan Batasan
  batasanDesain: string;
  riskoBisnis: string;
  risikoSuksesPksi: string;
  pengendalianRisiko: string;

  // 5. Gambaran Umum Aplikasi
  pengelolaAplikasi: string;
  penggunaAplikasi: string;
  programInisiatifRBSI: string;
  fungsiAplikasi: string;
  informasiYangDikelola: string;
  dasarPeraturan: string;

  // 6. Usulan Jadwal Pelaksanaan
  tahap1Awal: string;
  tahap1Akhir: string;
  tahap5Awal: string;
  tahap5Akhir: string;
  tahap7Awal: string;
  tahap7Akhir: string;

  // 7. Rencana Pengelolaan
  renanaPengelolaan: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AddPksi = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | false>('section1');
  const [formData, setFormData] = useState<FormData>({
    namaPksi: '',
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
    renanaPengelolaan: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    const requiredFields = [
      'namaPksi',
      'tanggalPengajuan',
      'deskripsiPksi',
      'mengapaPksiDiperlukan',
      'picSatkerBA',
      'kegunaanPksi',
      'tujuanPksi',
      'riskoBisnis',
      'pengelolaAplikasi',
      'fungsiAplikasi',
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = `${field} wajib diisi`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target as any;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setExpandedSection('section1');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Here you would normally call an API endpoint like:
      // POST /api/pksi with formData

      setSuccessMessage('PKSI berhasil ditambahkan!');

      // Reset form
      setFormData({
        namaPksi: '',
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
        renanaPengelolaan: '',
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          onClick={handleCancel}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            color: '#1d1d1f',
            '&:hover': {
              opacity: 0.7,
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '1.5rem' }} />
        </Box>
        <div>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            Tambah PKSI
          </Typography>
          <Typography variant="body1" sx={{ color: '#86868b' }}>
            Isi semua informasi yang diperlukan untuk membuat Program Kerja Sistem Informasi baru
          </Typography>
        </div>
      </Box>

      {/* Form Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {successMessage && (
          <Alert severity="success" sx={{ m: 3, mb: 0 }}>
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ p: 3 }}>
            {/* Basic Info */}
            <Box sx={{ mb: 3, pb: 3, borderBottom: '2px solid rgba(0, 0, 0, 0.15)' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: '#1d1d1f',
                }}
              >
                Informasi Dasar PKSI
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Nama PKSI"
                  name="namaPksi"
                  value={formData.namaPksi}
                  onChange={handleInputChange}
                  placeholder="Contoh: SIP Perbankan Modul Penyusunan KYBPR"
                  error={Boolean(errors.namaPksi)}
                  helperText={errors.namaPksi}
                  required
                  InputLabelProps={{ required: false }}
                  inputProps={{ maxLength: 255 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderWidth: '2px' },
                      '&:hover fieldset': { borderWidth: '2px' },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Tanggal Pengajuan"
                  name="tanggalPengajuan"
                  type="date"
                  value={formData.tanggalPengajuan}
                  onChange={handleInputChange}
                  error={Boolean(errors.tanggalPengajuan)}
                  required
                  InputLabelProps={{ shrink: true, required: false }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderWidth: '2px' },
                      '&:hover fieldset': { borderWidth: '2px' },
                    },
                  }}
                />
              </Stack>
            </Box>

            {/* Accordion Sections */}
            <Stack spacing={1}>
              {/* Section 1: Pendahuluan */}
              <Accordion
                expanded={expandedSection === 'section1'}
                onChange={handleAccordionChange('section1')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>1. Pendahuluan</Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Deskripsi, alasan, jadwal, dan PIC PKSI
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '2px solid rgba(0, 0, 0, 0.15)' }}>
                  <Stack spacing={2} sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      label="1.1 Deskripsi PKSI"
                      name="deskripsiPksi"
                      value={formData.deskripsiPksi}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      error={Boolean(errors.deskripsiPksi)}
                      helperText={errors.deskripsiPksi}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="1.2 Mengapa PKSI Diperlukan"
                      name="mengapaPksiDiperlukan"
                      value={formData.mengapaPksiDiperlukan}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      error={Boolean(errors.mengapaPksiDiperlukan)}
                      helperText={errors.mengapaPksiDiperlukan}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="1.3 Kapan Harus Diselesaikan"
                      name="kapanHarusDiselesaikan"
                      value={formData.kapanHarusDiselesaikan}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      placeholder="Misalnya: Q4 2026, sebelum tahun fiskal, dll"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="1.4 PIC Satker sebagai Business Analyst"
                      name="picSatkerBA"
                      value={formData.picSatkerBA}
                      onChange={handleInputChange}
                      placeholder="Nama, jabatan, kontak"
                      error={Boolean(errors.picSatkerBA)}
                      helperText={errors.picSatkerBA}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Section 2: Tujuan dan Kegunaan */}
              <Accordion
                expanded={expandedSection === 'section2'}
                onChange={handleAccordionChange('section2')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>2. Tujuan dan Kegunaan PKSI</Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Kegunaan, tujuan, dan target PKSI
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '2px solid rgba(0, 0, 0, 0.15)' }}>
                  <Stack spacing={2} sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      label="2.1 Kegunaan PKSI"
                      name="kegunaanPksi"
                      value={formData.kegunaanPksi}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      error={Boolean(errors.kegunaanPksi)}
                      helperText={errors.kegunaanPksi}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="2.2 Tujuan PKSI"
                      name="tujuanPksi"
                      value={formData.tujuanPksi}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      error={Boolean(errors.tujuanPksi)}
                      helperText={errors.tujuanPksi}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="2.3 Target PKSI"
                      name="targetPksi"
                      value={formData.targetPksi}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      placeholder="KPI, outcome yang diharapkan, dll"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Section 3: Cakupan PKSI */}
              <Accordion
                expanded={expandedSection === 'section3'}
                onChange={handleAccordionChange('section3')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>3. Cakupan PKSI</Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Ruang lingkup, batasan, hubungan sistem, dan asumsi
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '2px solid rgba(0, 0, 0, 0.15)' }}>
                  <Stack spacing={2} sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      label="3.1 Ruang Lingkup PKSI (Yang Termasuk)"
                      name="ruangLingkup"
                      value={formData.ruangLingkup}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="3.2 Batasan PKSI (Yang Tidak Termasuk)"
                      name="batasanPksi"
                      value={formData.batasanPksi}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="3.3 Hubungan dengan Sistem Lainnya"
                      name="hubunganSistemLain"
                      value={formData.hubunganSistemLain}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="3.4 Asumsi"
                      name="asumsi"
                      value={formData.asumsi}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Section 4: Risiko dan Batasan */}
              <Accordion
                expanded={expandedSection === 'section4'}
                onChange={handleAccordionChange('section4')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>4. Risiko dan Batasan PKSI</Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Batasan desain, risiko bisnis, dan mitigasi
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '2px solid rgba(0, 0, 0, 0.15)' }}>
                  <Stack spacing={2} sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      label="4.1 Batasan yang Mempengaruhi Desain PKSI"
                      name="batasanDesain"
                      value={formData.batasanDesain}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="4.2 Risiko-risiko yang Terkait dengan Proses Bisnis"
                      name="riskoBisnis"
                      value={formData.riskoBisnis}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      placeholder="Risiko strategis, hukum, operasional, reputasi, kepatuhan, kecurangan, keuangan, dll"
                      error={Boolean(errors.riskoBisnis)}
                      helperText={errors.riskoBisnis}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="4.3 Risiko yang Mempengaruhi Suksesnya Penyelesaian PKSI"
                      name="risikoSuksesPksi"
                      value={formData.risikoSuksesPksi}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="4.4 Pengendalian Risiko"
                      name="pengendalianRisiko"
                      value={formData.pengendalianRisiko}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Section 5: Gambaran Umum Aplikasi */}
              <Accordion
                expanded={expandedSection === 'section5'}
                onChange={handleAccordionChange('section5')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>5. Gambaran Umum Aplikasi yang Diharapkan</Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Pengelola, pengguna, fungsi, informasi, dan dasar hukum
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '2px solid rgba(0, 0, 0, 0.15)' }}>
                  <Stack spacing={2} sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      label="5.1 Pengelola Aplikasi"
                      name="pengelolaAplikasi"
                      value={formData.pengelolaAplikasi}
                      onChange={handleInputChange}
                      placeholder="Atasan satuan organizational"
                      error={Boolean(errors.pengelolaAplikasi)}
                      helperText={errors.pengelolaAplikasi}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="5.2 Pengguna Aplikasi"
                      name="penggunaAplikasi"
                      value={formData.penggunaAplikasi}
                      onChange={handleInputChange}
                      multiline
                      rows={2}
                      placeholder="Daftar role/pengguna aplikasi"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="5.3 Program Inisiatif RBSI"
                      name="programInisiatifRBSI"
                      value={formData.programInisiatifRBSI}
                      onChange={handleInputChange}
                      placeholder="Sesuai dengan program strategis OJK"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="5.4 Fungsi Aplikasi"
                      name="fungsiAplikasi"
                      value={formData.fungsiAplikasi}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      error={Boolean(errors.fungsiAplikasi)}
                      helperText={errors.fungsiAplikasi}
                      required
                      InputLabelProps={{ required: false }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="5.5 Informasi yang Akan Dikelola dalam Sistem"
                      name="informasiYangDikelola"
                      value={formData.informasiYangDikelola}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="5.6 Dasar Peraturan"
                      name="dasarPeraturan"
                      value={formData.dasarPeraturan}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderWidth: '2px' },
                          '&:hover fieldset': { borderWidth: '2px' },
                        },
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Section 6: Usulan Jadwal Pelaksanaan */}
              <Accordion
                expanded={expandedSection === 'section6'}
                onChange={handleAccordionChange('section6')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>6. Usulan Jadwal Pelaksanaan PKSI</Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Tahapan dan tanggal pelaksanaan
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '2px solid rgba(0, 0, 0, 0.15)' }}>
                  <Stack spacing={3} sx={{ width: '100%' }}>
                    {/* Tahap 1 */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Tahap 1: Penyusunan Spesifikasi Kebutuhan Aplikasi
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Awal Tahap"
                          name="tahap1Awal"
                          type="date"
                          value={formData.tahap1Awal}
                          onChange={handleInputChange}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderWidth: '2px' },
                              '&:hover fieldset': { borderWidth: '2px' },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Akhir Tahap"
                          name="tahap1Akhir"
                          type="date"
                          value={formData.tahap1Akhir}
                          onChange={handleInputChange}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderWidth: '2px' },
                              '&:hover fieldset': { borderWidth: '2px' },
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Tahap 5 */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Tahap 5: Pengujian Aplikasi – User Acceptance Test (UAT)
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Awal Tahap"
                          name="tahap5Awal"
                          type="date"
                          value={formData.tahap5Awal}
                          onChange={handleInputChange}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderWidth: '2px' },
                              '&:hover fieldset': { borderWidth: '2px' },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Akhir Tahap"
                          name="tahap5Akhir"
                          type="date"
                          value={formData.tahap5Akhir}
                          onChange={handleInputChange}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderWidth: '2px' },
                              '&:hover fieldset': { borderWidth: '2px' },
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Tahap 7 */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Tahap 7: Penggunaan Aplikasi (Go-Live)
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Awal Tahap"
                          name="tahap7Awal"
                          type="date"
                          value={formData.tahap7Awal}
                          onChange={handleInputChange}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderWidth: '2px' },
                              '&:hover fieldset': { borderWidth: '2px' },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Akhir Tahap"
                          name="tahap7Akhir"
                          type="date"
                          value={formData.tahap7Akhir}
                          onChange={handleInputChange}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderWidth: '2px' },
                              '&:hover fieldset': { borderWidth: '2px' },
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Section 7: Rencana Pengelolaan */}
              <Accordion
                expanded={expandedSection === 'section7'}
                onChange={handleAccordionChange('section7')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>7. Rencana Pengelolaan</Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Strategi pengelolaan aplikasi pasca go-live
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ borderTop: '2px solid rgba(0, 0, 0, 0.15)' }}>
                  <TextField
                    fullWidth
                    label="Rencana Pengelolaan"
                    name="renanaPengelolaan"
                    value={formData.renanaPengelolaan}
                    onChange={handleInputChange}
                    multiline
                    rows={5}
                    placeholder="Termasuk maintenance, update, monitoring, support, dll"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderWidth: '2px' },
                        '&:hover fieldset': { borderWidth: '2px' },
                      },
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              p: 3,
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              bgcolor: 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={handleCancel}
              sx={{
                color: '#1d1d1f',
                borderColor: 'rgba(0, 0, 0, 0.12)',
                '&:hover': {
                  borderColor: '#1d1d1f',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              type="submit"
              disabled={isSubmitting}
              sx={{
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                fontWeight: 500,
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.38)',
                },
              }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan PKSI'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddPksi;







