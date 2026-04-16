import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { getAllAplikasi, type AplikasiData } from '../api/aplikasiApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { createPksiDocument } from '../api/pksiApi';
import {
  uploadPksiTempFiles,
  movePksiTempFilesToPermanent,
  deletePksiTempFiles,
  deletePksiFile,
  type PksiFileData,
} from '../api/pksiFileApi';

interface SkpaOption {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// Each timeline stage can have multiple phases independently
interface TimelinePhases {
  usreq: string[];  // Array of dates for each phase
  sit: string[];
  uat: string[];
  goLive: string[];
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

const TIMELINE_CONFIGS = [
  { key: 'usreq' as const, label: 'Target Usreq', stage: 'USREQ', gradient: ['#6366F1', '#818CF8'], rgb: '99,102,241' },
  { key: 'sit' as const, label: 'Target SIT', stage: 'SIT', gradient: ['#8B5CF6', '#A78BFA'], rgb: '139,92,246' },
  { key: 'uat' as const, label: 'Target UAT/PDKK', stage: 'UAT', gradient: ['#F59E0B', '#FCD34D'], rgb: '245,158,11' },
  { key: 'goLive' as const, label: 'Target Go Live', stage: 'GO_LIVE', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
];

interface TimelineStageProps {
  label: string;
  stages: string[];  // Array of dates for each phase
  gradient: string[];
  rgb: string;
  onChange: (phaseIndex: number, value: string) => void;
  onAddPhase: () => void;
  onRemovePhase: (phaseIndex: number) => void;
}

const TimelineStage = ({ label, stages, gradient, rgb, onChange, onAddPhase, onRemovePhase }: TimelineStageProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Stage Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '10px',
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 12px rgba(${rgb},0.35)`,
          }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
              {stages.length}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>
            {label}
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddPhase}
          sx={{
            borderRadius: '10px',
            borderColor: `rgba(${rgb},0.25)`,
            color: gradient[0],
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 2,
            py: 0.5,
            textTransform: 'none',
            background: `rgba(${rgb},0.04)`,
            border: `1px solid rgba(${rgb},0.25)`,
            '&:hover': {
              borderColor: gradient[0],
              background: `rgba(${rgb},0.08)`,
            },
          }}
        >
          Tambah Fase
        </Button>
      </Box>

      {/* Phases */}
      <Stack spacing={1.5}>
        {stages.map((date, phaseIndex) => (
          <Box
            key={phaseIndex}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 2,
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                borderColor: `rgba(${rgb},0.2)`,
              },
            }}
          >
            {/* Phase Number */}
            <Box sx={{
              minWidth: 36,
              height: 36,
              borderRadius: '10px',
              background: `rgba(${rgb},0.1)`,
              border: `1.5px solid rgba(${rgb},0.25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: gradient[0] }}>
                {phaseIndex + 1}
              </Typography>
            </Box>

            {/* Date Input */}
            <TextField
              fullWidth
              size="small"
              type="month"
              value={date ? date.substring(0, 7) : ''}
              onChange={(e) => onChange(phaseIndex, e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="Pilih bulan"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  background: `rgba(${rgb},0.04)`,
                  '& fieldset': { border: `1px solid rgba(${rgb},0.15)` },
                  '&:hover fieldset': { borderColor: `rgba(${rgb},0.3)` },
                  '&.Mui-focused fieldset': { borderColor: gradient[0], borderWidth: '1.5px' },
                },
                '& .MuiInputBase-input': { fontSize: '0.85rem', color: '#1d1d1f', fontWeight: 500 },
              }}
            />

            {/* Remove Button (only if more than 1 phase) */}
            {stages.length > 1 && (
              <IconButton
                size="small"
                onClick={() => onRemovePhase(phaseIndex)}
                sx={{
                  width: 32,
                  height: 32,
                  color: '#86868b',
                  '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.06)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const AddPksi = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | false>('jadwal');
  const [aplikasiList, setAplikasiList] = useState<AplikasiData[]>([]);
  const [loadingAplikasi, setLoadingAplikasi] = useState(false);
  const [skpaOptions, setSkpaOptions] = useState<SkpaOption[]>([]);
  const [formData, setFormData] = useState({
    namaPksi: '',
    aplikasiId: '',
    tanggalPengajuan: '',
    picSatkerBA: [] as string[],
    jenisPksi: 'Reguler',
  });

  // Each timeline stage can have multiple phases independently
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhases>({
    usreq: [currentMonthValue()],
    sit: [currentMonthValue()],
    uat: [currentMonthValue()],
    goLive: [currentMonthValue()],
  });

  const handleTimelineChange = (stage: keyof TimelinePhases, phaseIndex: number, value: string) => {
    setTimelinePhases(prev => {
      const updated = { ...prev };
      const newDates = [...updated[stage]];
      newDates[phaseIndex] = value ? lastDayOfMonth(value) : '';
      updated[stage] = newDates;
      return updated;
    });
  };

  const handleAddPhase = (stage: keyof TimelinePhases) => {
    setTimelinePhases(prev => ({
      ...prev,
      [stage]: [...prev[stage], currentMonthValue()],
    }));
  };

  const handleRemovePhase = (stage: keyof TimelinePhases, phaseIndex: number) => {
    setTimelinePhases(prev => ({
      ...prev,
      [stage]: prev[stage].filter((_, i) => i !== phaseIndex),
    }));
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; tanggal: string }>>([]);
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
    const fetchSkpaOptions = async () => {
      try {
        const response = await getAllSkpa();
        const mapped: SkpaOption[] = (response.data || []).map((skpa: SkpaData) => ({
          id: skpa.id,
          kode_skpa: skpa.kode_skpa,
          nama_skpa: skpa.nama_skpa,
        }));
        setSkpaOptions(mapped);
      } catch (error) {
        console.error('Failed to fetch SKPA:', error);
      }
    };
    fetchAplikasi();
    fetchSkpaOptions();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newPending = Array.from(files).map(file => ({ file, tanggal: '' }));
      setPendingFiles(prev => [...prev, ...newPending]);
    }
    event.target.value = '';
  };

  const handlePendingDateChange = (index: number, date: string) => {
    setPendingFiles(prev => prev.map((p, i) => i === index ? { ...p, tanggal: date } : p));
  };

  const handleRemovePending = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadPendingFiles = async () => {
    if (pendingFiles.length === 0 || !sessionId) return;
    setIsUploading(true);
    setErrorMessage('');
    try {
      const results: PksiFileData[] = [];
      for (const pending of pendingFiles) {
        const uploaded = await uploadPksiTempFiles(
          sessionId,
          [pending.file],
          'T01',
          pending.tanggal || undefined
        );
        results.push(...uploaded);
      }
      setUploadedFileData(prev => [...prev, ...results]);
      setPendingFiles([]);
    } catch (error) {
      console.error('Failed to upload files:', error);
      setErrorMessage('Gagal mengupload file. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
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
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const timelines: any[] = [];
      
      // Add USREQ phases
      timelinePhases.usreq.forEach((date, index) => {
        if (date) {
          timelines.push({ phase: index + 1, target_date: date, stage: 'USREQ' });
        }
      });
      
      // Add SIT phases (skip if Mendesak)
      if (formData.jenisPksi !== 'Mendesak') {
        timelinePhases.sit.forEach((date, index) => {
          if (date) {
            timelines.push({ phase: index + 1, target_date: date, stage: 'SIT' });
          }
        });
      }
      
      // Add UAT phases
      timelinePhases.uat.forEach((date, index) => {
        if (date) {
          timelines.push({ phase: index + 1, target_date: date, stage: 'UAT' });
        }
      });
      
      // Add GO_LIVE phases
      timelinePhases.goLive.forEach((date, index) => {
        if (date) {
          timelines.push({ phase: index + 1, target_date: date, stage: 'GO_LIVE' });
        }
      });

      const pksiData = {
        aplikasi_id: formData.aplikasiId || undefined,
        nama_pksi: formData.namaPksi,
        jenis_pksi: formData.jenisPksi,
        tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        pic_satker_ba: formData.picSatkerBA.length > 0 ? formData.picSatkerBA.join(',') : undefined,
        timelines: timelines.length > 0 ? timelines : undefined,
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
              <TextField
                select
                fullWidth
                label="Jenis PKSI"
                name="jenisPksi"
                value={formData.jenisPksi}
                onChange={handleInputChange}
              >
                <MenuItem value="Reguler">Reguler</MenuItem>
                <MenuItem value="Mendesak">Mendesak</MenuItem>
              </TextField>
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
              <Autocomplete
                multiple
                options={skpaOptions}
                getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                value={skpaOptions.filter(skpa => formData.picSatkerBA.includes(skpa.id))}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    picSatkerBA: newValue.map(skpa => skpa.id)
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="SKPA (Satuan Kerja Pemilik Aplikasi)"
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
                          '&:hover': { color: 'white' },
                        },
                      }}
                    />
                  ))
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
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
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              {/* Each timeline stage independently */}
              {TIMELINE_CONFIGS.map((config) => {
                // Skip SIT if Mendesak
                if (config.key === 'sit' && formData.jenisPksi === 'Mendesak') {
                  return null;
                }
                
                return (
                  <TimelineStage
                    key={config.key}
                    label={config.label}
                    stages={timelinePhases[config.key]}
                    gradient={config.gradient}
                    rgb={config.rgb}
                    onChange={(phaseIndex, value) => handleTimelineChange(config.key, phaseIndex, value)}
                    onAddPhase={() => handleAddPhase(config.key)}
                    onRemovePhase={(phaseIndex) => handleRemovePhase(config.key, phaseIndex)}
                  />
                );
              })}

              <Box sx={{
                mt: 2,
                p: 2,
                borderRadius: '12px',
                background: 'rgba(99,102,241,0.04)',
                border: '1px solid rgba(99,102,241,0.1)',
              }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#6366F1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ fontSize: '1rem' }}>💡</Box>
                  Tip: Setiap timeline dapat memiliki fase yang berbeda. Misal Target Usreq 1 fase, tetapi Target SIT 2 fase.
                </Typography>
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
                Upload Dokumen T.01 & Nota Dinas
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
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#DA251C',
                      bgcolor: 'rgba(218, 37, 28, 0.04)',
                    },
                  }}
                  onClick={() => document.getElementById('pksi-file-upload-input')?.click()}
                >
                  <input
                    id="pksi-file-upload-input"
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
                  <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                    Klik untuk upload file (bisa pilih beberapa)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
                    atau drag & drop file di sini
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>
                    Format yang didukung: PDF, Word, Excel, Gambar (max 20MB)
                  </Typography>
                </Box>

                {pendingFiles.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#1d1d1f' }}>
                      File akan diupload ({pendingFiles.length})
                    </Typography>
                    <Stack spacing={1.5}>
                      {pendingFiles.map((pending, index) => (
                        <Box
                          key={index}
                          sx={{ p: 1.5, bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px', border: '1px solid #e5e5e7' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FileIcon sx={{ color: '#DA251C', mr: 1, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1d1d1f', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {pending.file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#86868b', mx: 1, whiteSpace: 'nowrap' }}>
                              {formatFileSize(pending.file.size)}
                            </Typography>
                            <IconButton size="small" onClick={() => handleRemovePending(index)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <TextField
                            fullWidth
                            label="Tanggal Dokumen"
                            type="date"
                            size="small"
                            value={pending.tanggal}
                            onChange={(e) => handlePendingDateChange(index, e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Box>
                      ))}
                    </Stack>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleUploadPendingFiles}
                      disabled={isUploading}
                      startIcon={isUploading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                      sx={{ mt: 1.5, background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)', '&:hover': { background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)' } }}
                    >
                      {isUploading ? 'Mengupload...' : `Upload ${pendingFiles.length} File`}
                    </Button>
                  </Box>
                )}

                {uploadedFileData.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                      File yang diupload ({uploadedFileData.length})
                    </Typography>
                    <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px' }}>
                      {uploadedFileData.map((fileData, index) => (
                        <ListItem
                          key={fileData.id || index}
                          sx={{
                            borderBottom: index < uploadedFileData.length - 1 ? '1px solid #e5e5e7' : 'none',
                          }}
                        >
                          <ListItemIcon>
                            <FileIcon sx={{ color: '#DA251C' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={fileData.original_name}
                            secondary={formatFileSize(fileData.file_size)}
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







