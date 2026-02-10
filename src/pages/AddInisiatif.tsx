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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface FormData {
  namaInisiatif: string;
  deskripsi: string;
  departemen: string;
  pic: string;
  prioritas: 'high' | 'medium' | 'low';
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  tanggalMulai: string;
  tanggalSelesai: string;
  objektif: string;
  target: string;
  budget: string;
  risiko: string;
  mitigasi: string;
  keterangan: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AddInisiatif = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | false>('section1');
  const [formData, setFormData] = useState<FormData>({
    namaInisiatif: '',
    deskripsi: '',
    departemen: '',
    pic: '',
    prioritas: 'medium',
    status: 'planning',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    objektif: '',
    target: '',
    budget: '',
    risiko: '',
    mitigasi: '',
    keterangan: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.namaInisiatif.trim()) {
      newErrors.namaInisiatif = 'Nama inisiatif wajib diisi';
    }
    if (!formData.departemen.trim()) {
      newErrors.departemen = 'Departemen wajib diisi';
    }
    if (!formData.pic.trim()) {
      newErrors.pic = 'PIC wajib diisi';
    }
    if (!formData.tanggalMulai) {
      newErrors.tanggalMulai = 'Tanggal mulai wajib diisi';
    }
    if (!formData.tanggalSelesai) {
      newErrors.tanggalSelesai = 'Tanggal selesai wajib diisi';
    }
    if (formData.tanggalMulai && formData.tanggalSelesai && formData.tanggalMulai > formData.tanggalSelesai) {
      newErrors.tanggalSelesai = 'Tanggal selesai harus lebih besar dari tanggal mulai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const handleSave = () => {
    if (validateForm()) {
      setSubmitted(true);
      console.log('Form Data:', formData);
      setTimeout(() => {
        navigate('/inisiatif');
      }, 1500);
    }
  };

  const handleCancel = () => {
    navigate('/inisiatif');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{
            color: '#86868b',
            minWidth: 'auto',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
          }}
        />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 0.5 }}>
            Tambah Inisiatif Baru
          </Typography>
          <Typography variant="body2" sx={{ color: '#86868b' }}>
            Buat inisiatif strategis baru untuk organisasi
          </Typography>
        </Box>
      </Box>

      {/* Success Alert */}
      {submitted && (
        <Alert severity="success" onClose={() => setSubmitted(false)}>
          Inisiatif berhasil ditambahkan! Redirecting...
        </Alert>
      )}

      {/* Form */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        {/* Section 1: Informasi Dasar */}
        <Accordion
          expanded={expandedSection === 'section1'}
          onChange={handleAccordionChange('section1')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              1. Informasi Dasar
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Nama Inisiatif"
                  name="namaInisiatif"
                  value={formData.namaInisiatif}
                  onChange={handleInputChange}
                  error={!!errors.namaInisiatif}
                  helperText={errors.namaInisiatif}
                  placeholder="Contoh: Transformasi Digital Pengawasan"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Deskripsi"
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Jelaskan deskripsi inisiatif ini..."
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Departemen"
                  name="departemen"
                  value={formData.departemen}
                  onChange={handleInputChange}
                  error={!!errors.departemen}
                  helperText={errors.departemen}
                  placeholder="Contoh: Teknologi Informasi"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="PIC (Person In Charge)"
                  name="pic"
                  value={formData.pic}
                  onChange={handleInputChange}
                  error={!!errors.pic}
                  helperText={errors.pic}
                  placeholder="Nama PIC"
                />
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Prioritas</InputLabel>
                  <Select
                    name="prioritas"
                    value={formData.prioritas}
                    onChange={handleSelectChange}
                    label="Prioritas"
                  >
                    <MenuItem value="high">Tinggi</MenuItem>
                    <MenuItem value="medium">Sedang</MenuItem>
                    <MenuItem value="low">Rendah</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status"
                  >
                    <MenuItem value="planning">Perencanaan</MenuItem>
                    <MenuItem value="ongoing">Berjalan</MenuItem>
                    <MenuItem value="completed">Selesai</MenuItem>
                    <MenuItem value="cancelled">Dibatalkan</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 2: Jadwal */}
        <Accordion
          expanded={expandedSection === 'section2'}
          onChange={handleAccordionChange('section2')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              2. Jadwal Pelaksanaan
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Tanggal Mulai"
                  name="tanggalMulai"
                  type="date"
                  value={formData.tanggalMulai}
                  onChange={handleInputChange}
                  error={!!errors.tanggalMulai}
                  helperText={errors.tanggalMulai}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Tanggal Selesai"
                  name="tanggalSelesai"
                  type="date"
                  value={formData.tanggalSelesai}
                  onChange={handleInputChange}
                  error={!!errors.tanggalSelesai}
                  helperText={errors.tanggalSelesai}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 3: Objektif dan Target */}
        <Accordion
          expanded={expandedSection === 'section3'}
          onChange={handleAccordionChange('section3')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              3. Objektif dan Target
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Objektif"
                  name="objektif"
                  value={formData.objektif}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Jelaskan objektif dari inisiatif ini..."
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Target"
                  name="target"
                  value={formData.target}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Jelaskan target yang ingin dicapai..."
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 4: Anggaran */}
        <Accordion
          expanded={expandedSection === 'section4'}
          onChange={handleAccordionChange('section4')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              4. Anggaran
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Anggaran"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="Contoh: Rp 500.000.000"
            />
          </AccordionDetails>
        </Accordion>

        {/* Section 5: Risiko dan Mitigasi */}
        <Accordion
          expanded={expandedSection === 'section5'}
          onChange={handleAccordionChange('section5')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              5. Risiko dan Mitigasi
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Risiko"
                  name="risiko"
                  value={formData.risiko}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  placeholder="Identifikasi risiko yang mungkin terjadi..."
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Strategi Mitigasi"
                  name="mitigasi"
                  value={formData.mitigasi}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  placeholder="Jelaskan strategi mitigasi untuk setiap risiko..."
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Section 6: Keterangan Tambahan */}
        <Accordion
          expanded={expandedSection === 'section6'}
          onChange={handleAccordionChange('section6')}
          sx={{ mb: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              6. Keterangan Tambahan
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              multiline
              rows={4}
              placeholder="Catatan atau keterangan tambahan..."
            />
          </AccordionDetails>
        </Accordion>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleCancel}
            sx={{
              color: '#86868b',
              borderColor: '#e5e5ea',
              '&:hover': {
                borderColor: '#d1d1d6',
                bgcolor: 'rgba(0, 0, 0, 0.02)',
              },
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              },
            }}
          >
            Simpan Inisiatif
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AddInisiatif;
