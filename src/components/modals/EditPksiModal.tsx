import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Autocomplete,
  CircularProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { getAllSkpa, type SkpaData } from '../../api/skpaApi';
import { getPksiDocumentById, updatePksiDocument, type PksiDocumentRequest } from '../../api/pksiApi';

interface SkpaOption {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
}

interface PksiEditData {
  id: string;
}

interface EditPksiModalProps {
  open: boolean;
  onClose: () => void;
  pksiData: PksiEditData | null;
  onSuccess: () => void;
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

const EditPksiModal: React.FC<EditPksiModalProps> = ({
  open,
  onClose,
  pksiData,
  onSuccess,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('section1');
  const [formData, setFormData] = useState<FormData>({
    namaPksi: '',
    tanggalPengajuan: '',
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
  const [skpaOptions, setSkpaOptions] = useState<SkpaOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // Fetch SKPA options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const skpaResponse = await getAllSkpa();
        const mappedSkpa: SkpaOption[] = (skpaResponse.data || []).map((skpa: SkpaData) => ({
          id: skpa.id,
          kode_skpa: skpa.kode_skpa,
          nama_skpa: skpa.nama_skpa,
        }));
        setSkpaOptions(mappedSkpa);
      } catch (error) {
        console.error('Error fetching SKPA options:', error);
      }
    };
    
    if (open) {
      fetchOptions();
    }
  }, [open]);

  // Fetch PKSI details and populate form
  useEffect(() => {
    const fetchPksiDetails = async () => {
      if (!pksiData?.id || !open) return;
      
      setIsLoadingData(true);
      try {
        const data = await getPksiDocumentById(pksiData.id);
        
        setFormData({
          namaPksi: data.nama_pksi || '',
          tanggalPengajuan: data.tanggal_pengajuan ? data.tanggal_pengajuan.split('T')[0] : '',
          deskripsiPksi: data.deskripsi_pksi || '',
          mengapaPksiDiperlukan: data.mengapa_pksi_diperlukan || '',
          kapanHarusDiselesaikan: data.kapan_harus_diselesaikan || '',
          picSatkerBA: data.pic_satker_ba ? data.pic_satker_ba.split(', ').filter(Boolean) : [],
          kegunaanPksi: data.kegunaan_pksi || '',
          tujuanPksi: data.tujuan_pksi || '',
          targetPksi: data.target_pksi || '',
          ruangLingkup: data.ruang_lingkup || '',
          batasanPksi: data.batasan_pksi || '',
          hubunganSistemLain: data.hubungan_sistem_lain || '',
          asumsi: data.asumsi || '',
          batasanDesain: data.batasan_desain || '',
          riskoBisnis: data.risiko_bisnis || '',
          risikoSuksesPksi: data.risiko_sukses_pksi || '',
          pengendalianRisiko: data.pengendalian_risiko || '',
          pengelolaAplikasi: data.pengelola_aplikasi || '',
          penggunaAplikasi: data.pengguna_aplikasi || '',
          programInisiatifRBSI: data.program_inisiatif_rbsi || '',
          fungsiAplikasi: data.fungsi_aplikasi || '',
          informasiYangDikelola: data.informasi_yang_dikelola || '',
          dasarPeraturan: data.dasar_peraturan || '',
          tahap1Awal: data.tahap1_awal ? data.tahap1_awal.split('T')[0] : '',
          tahap1Akhir: data.tahap1_akhir ? data.tahap1_akhir.split('T')[0] : '',
          tahap5Awal: data.tahap5_awal ? data.tahap5_awal.split('T')[0] : '',
          tahap5Akhir: data.tahap5_akhir ? data.tahap5_akhir.split('T')[0] : '',
          tahap7Awal: data.tahap7_awal ? data.tahap7_awal.split('T')[0] : '',
          tahap7Akhir: data.tahap7_akhir ? data.tahap7_akhir.split('T')[0] : '',
          rencanaPengelolaan: data.rencana_pengelolaan || '',
        });
      } catch (error) {
        console.error('Error fetching PKSI details:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchPksiDetails();
  }, [pksiData?.id, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.namaPksi.trim()) {
      newErrors.namaPksi = 'Nama PKSI wajib diisi';
    }
    if (!formData.deskripsiPksi.trim()) {
      newErrors.deskripsiPksi = 'Deskripsi PKSI wajib diisi';
    }
    if (!formData.mengapaPksiDiperlukan.trim()) {
      newErrors.mengapaPksiDiperlukan = 'Field ini wajib diisi';
    }
    if (formData.picSatkerBA.length === 0) {
      newErrors.picSatkerBA = 'Satuan Kerja Pemilik Aplikasi wajib dipilih';
    }
    if (!formData.kegunaanPksi.trim()) {
      newErrors.kegunaanPksi = 'Kegunaan PKSI wajib diisi';
    }
    if (!formData.tujuanPksi.trim()) {
      newErrors.tujuanPksi = 'Tujuan PKSI wajib diisi';
    }
    if (!formData.pengelolaAplikasi.trim()) {
      newErrors.pengelolaAplikasi = 'Pengelola Aplikasi wajib diisi';
    }
    if (!formData.fungsiAplikasi.trim()) {
      newErrors.fungsiAplikasi = 'Fungsi Aplikasi wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !pksiData?.id) return;

    setIsSubmitting(true);
    try {
      const requestData: PksiDocumentRequest = {
        nama_pksi: formData.namaPksi,
        tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        deskripsi_pksi: formData.deskripsiPksi,
        mengapa_pksi_diperlukan: formData.mengapaPksiDiperlukan,
        kapan_harus_diselesaikan: formData.kapanHarusDiselesaikan || undefined,
        pic_satker_ba: formData.picSatkerBA.join(', '),
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
        user_id: '', // Will be set by backend from auth token
      };

      await updatePksiDocument(pksiData.id, requestData);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating PKSI:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      namaPksi: '',
      tanggalPengajuan: '',
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
    setExpandedSection('section1');
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
        }
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
          Edit PKSI
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, bgcolor: 'white' }}>
        {isLoadingData ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
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

            {/* Section 1 - Pendahuluan */}
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
                  <TextField
                    fullWidth
                    label="1.1 Deskripsi PKSI"
                    name="deskripsiPksi"
                    value={formData.deskripsiPksi}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    error={!!errors.deskripsiPksi}
                    helperText={errors.deskripsiPksi}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="1.2 Mengapa PKSI Diperlukan"
                    name="mengapaPksiDiperlukan"
                    value={formData.mengapaPksiDiperlukan}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    error={!!errors.mengapaPksiDiperlukan}
                    helperText={errors.mengapaPksiDiperlukan}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="1.3 Kapan Harus Diselesaikan"
                    name="kapanHarusDiselesaikan"
                    value={formData.kapanHarusDiselesaikan}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
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

            {/* Section 2 - Tujuan dan Kegunaan */}
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
                  <TextField
                    fullWidth
                    label="2.1 Kegunaan PKSI"
                    name="kegunaanPksi"
                    value={formData.kegunaanPksi}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    error={!!errors.kegunaanPksi}
                    helperText={errors.kegunaanPksi}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="2.2 Tujuan PKSI"
                    name="tujuanPksi"
                    value={formData.tujuanPksi}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    error={!!errors.tujuanPksi}
                    helperText={errors.tujuanPksi}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="2.3 Target PKSI"
                    name="targetPksi"
                    value={formData.targetPksi}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 3 - Cakupan */}
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
                  <TextField
                    fullWidth
                    label="3.1 Ruang Lingkup PKSI (Yang Termasuk)"
                    name="ruangLingkup"
                    value={formData.ruangLingkup}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="3.2 Batasan PKSI (Yang Tidak Termasuk)"
                    name="batasanPksi"
                    value={formData.batasanPksi}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="3.3 Hubungan dengan Sistem Lainnya"
                    name="hubunganSistemLain"
                    value={formData.hubunganSistemLain}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="3.4 Asumsi"
                    name="asumsi"
                    value={formData.asumsi}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 4 - Risiko */}
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
                  <TextField
                    fullWidth
                    label="4.1 Batasan yang dapat berpengaruh pada desain sistem PKSI"
                    name="batasanDesain"
                    value={formData.batasanDesain}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="4.2 Risiko-risiko yang terkait dengan proses bisnis"
                    name="riskoBisnis"
                    value={formData.riskoBisnis}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    placeholder="Misalnya: risiko strategis, hukum, operasional, reputasi, kepatuhan, kecurangan, keuangan, dll"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="4.3 Risiko-risiko yang dapat berpengaruh pada suksesnya penyelesaian PKSI"
                    name="risikoSuksesPksi"
                    value={formData.risikoSuksesPksi}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="4.4 Bagaimana risiko-risiko tersebut dapat dikendalikan"
                    name="pengendalianRisiko"
                    value={formData.pengendalianRisiko}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 5 - Gambaran Umum */}
            <Accordion
              expanded={expandedSection === 'section5'}
              onChange={handleAccordionChange('section5')}
              sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                  5. Gambaran Umum Aplikasi yang Diharapkan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
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
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="5.2 Pengguna Aplikasi"
                    name="penggunaAplikasi"
                    value={formData.penggunaAplikasi}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="5.3 Program Inisiatif RBSI"
                    name="programInisiatifRBSI"
                    value={formData.programInisiatifRBSI}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="5.4 Fungsi Aplikasi"
                    name="fungsiAplikasi"
                    value={formData.fungsiAplikasi}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    error={!!errors.fungsiAplikasi}
                    helperText={errors.fungsiAplikasi}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="5.5 Informasi yang akan dikelola dalam sistem"
                    name="informasiYangDikelola"
                    value={formData.informasiYangDikelola}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="5.6 Dasar Peraturan"
                    name="dasarPeraturan"
                    value={formData.dasarPeraturan}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    size="small"
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 6 - Jadwal */}
            <Accordion
              expanded={expandedSection === 'section6'}
              onChange={handleAccordionChange('section6')}
              sx={{ boxShadow: 'none', border: '1px solid #e5e5e7', borderRadius: '8px !important' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                  6. Usulan Jadwal Pelaksanaan PKSI
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>
                      Tahap 1: Penyusunan Spesifikasi Kebutuhan Aplikasi
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <TextField fullWidth label="Awal Tahap" name="tahap1Awal" type="date" value={formData.tahap1Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                      <TextField fullWidth label="Akhir Tahap" name="tahap1Akhir" type="date" value={formData.tahap1Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>
                      Tahap 5: Pengujian Aplikasi – User Acceptance Test (UAT)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <TextField fullWidth label="Awal Tahap" name="tahap5Awal" type="date" value={formData.tahap5Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                      <TextField fullWidth label="Akhir Tahap" name="tahap5Akhir" type="date" value={formData.tahap5Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>
                      Tahap 7: Penggunaan Aplikasi (Go-Live)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <TextField fullWidth label="Awal Tahap" name="tahap7Awal" type="date" value={formData.tahap7Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                      <TextField fullWidth label="Akhir Tahap" name="tahap7Akhir" type="date" value={formData.tahap7Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                    </Box>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 7 - Rencana Pengelolaan */}
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
                <TextField
                  fullWidth
                  label="Rencana Pengelolaan"
                  name="rencanaPengelolaan"
                  value={formData.rencanaPengelolaan}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Jelaskan rencana pengelolaan PKSI..."
                  size="small"
                />
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e5e5e7', bgcolor: 'white' }}>
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
          onClick={handleSubmit}
          disabled={isSubmitting || isLoadingData}
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
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPksiModal;
