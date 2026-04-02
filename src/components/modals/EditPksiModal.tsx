import React, { useState, useEffect, useMemo } from 'react';
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
  styled,
  Popover,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getAllSkpa, type SkpaData } from '../../api/skpaApi';
import { getAllAplikasi, type AplikasiData } from '../../api/aplikasiApi';
import { getPksiDocumentById, updatePksiDocument, type PksiDocumentRequest } from '../../api/pksiApi';
import { getUserInfo } from '../../api/authApi';
import { getAllRbsi, getRbsiById, type RbsiResponse, type RbsiProgramResponse, type RbsiInisiatifResponse } from '../../api/rbsiApi';
import {
  uploadPksiFiles,
  getPksiFiles,
  deletePksiFile,
  downloadPksiFile,
  
  type PksiFileData,
} from '../../api/pksiFileApi';

// Styled TextField with glass effect
const GlassTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.08)',
      transition: 'all 0.2s ease-in-out',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.15)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DA251C',
      borderWidth: '1.5px',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      boxShadow: '0 4px 20px rgba(218, 37, 28, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#86868b',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#DA251C',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#1d1d1f',
  },
});

interface SkpaOption {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
}

interface PksiEditData {
  id: string;
  namaPksi: string;
  namaAplikasi: string;
  picSatkerBA: string;
  jangkaWaktu: string;
  tanggalPengajuan: string;
  linkDocsT01: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui';
}

interface EditPksiModalProps {
  open: boolean;
  onClose: () => void;
  pksiData: PksiEditData | null;
  onSuccess: () => void;
}

interface FormData {
  namaPksi: string;
  aplikasiId: string;
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
    aplikasiId: '',
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
  const [aplikasiOptions, setAplikasiOptions] = useState<AplikasiData[]>([]);
  const [rbsiOptions, setRbsiOptions] = useState<RbsiResponse[]>([]);
  const [programOptions, setProgramOptions] = useState<RbsiProgramResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<RbsiProgramResponse | null>(null);
  const [selectedInisiatif, setSelectedInisiatif] = useState<RbsiInisiatifResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [inisiatifPopoverAnchor, setInisiatifPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadedInisiatifId, setLoadedInisiatifId] = useState<string | null>(null);

  // File upload state - for edit mode we use existing files directly
  const [existingFiles, setExistingFiles] = useState<PksiFileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Period years derived from selected RBSI
  const periodYears = useMemo(() => {
    if (!selectedRbsi) return [];
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  }, [selectedRbsi]);

  // All inisiatifs grouped by program with year filter
  const groupedInisiatifs = useMemo(() => {
    if (!programOptions.length) return [];
    
    return programOptions
      .map(program => {
        const inisiatifs = (program.inisiatifs || []).filter(
          inisiatif => !selectedYear || inisiatif.tahun === selectedYear
        );
        return {
          program,
          inisiatifs,
        };
      })
      .filter(group => group.inisiatifs.length > 0);
  }, [programOptions, selectedYear]);

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // File upload handler - for Edit mode, upload directly to PKSI
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && pksiData?.id) {
      const file = files[0];
      
      setIsUploading(true);
      setErrorMessage('');
      try {
        await uploadPksiFiles(pksiData.id, [file]);
        // Refresh existing files list
        const existingFilesData = await getPksiFiles(pksiData.id);
        setExistingFiles(existingFilesData);
      } catch (error) {
        console.error('Failed to upload file:', error);
        setErrorMessage('Gagal mengupload file. Silakan coba lagi.');
      } finally {
        setIsUploading(false);
      }
    }
    event.target.value = '';
  };

  const handleRemoveFile = async (fileId: string) => {
    try {
      await deletePksiFile(fileId);
      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      setErrorMessage('Gagal menghapus file.');
    }
  };

  // Handle file download
  const handleDownload = async (file: PksiFileData) => {
    setDownloadingFileId(file.id);
    try {
      await downloadPksiFile(file.id, file.original_name);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Handle file preview in new tab
  const handlePreview = (file: PksiFileData) => {
    window.open(`/api/pksi/files/preview/${file.id}`, '_blank');
  };

  // Check if file is previewable
  const isPreviewable = (contentType: string): boolean => {
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return previewableTypes.includes(contentType);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch SKPA and Aplikasi options
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
        
        const aplikasiResponse = await getAllAplikasi();
        setAplikasiOptions(aplikasiResponse.data || []);

        const rbsiResponse = await getAllRbsi();
        setRbsiOptions(rbsiResponse.data || []);
      } catch (error) {
        console.error('Error fetching options:', error);
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
          aplikasiId: data.aplikasi_id || '',
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

        // Store inisiatif ID to set later when inisiatifs are loaded
        if (data.inisiatif_id) {
          setLoadedInisiatifId(data.inisiatif_id);
        }

        // Fetch existing files for this PKSI
        try {
          const existingFilesData = await getPksiFiles(pksiData.id);
          setExistingFiles(existingFilesData);
        } catch (fileError) {
          console.error('Error fetching PKSI files:', fileError);
        }
      } catch (error) {
        console.error('Error fetching PKSI details:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchPksiDetails();
  }, [pksiData?.id, open]);

  // Set selectedInisiatif when inisiatifs are loaded and we have an inisiatif_id
  useEffect(() => {
    if (!loadedInisiatifId || !programOptions.length) return;

    // Find the inisiatif with matching id
    for (const program of programOptions) {
      const matchingInisiatif = program.inisiatifs?.find(
        init => init.id === loadedInisiatifId
      );
      if (matchingInisiatif) {
        setSelectedInisiatif(matchingInisiatif);
        setSelectedProgram(program);
        setLoadedInisiatifId(null); // Clear to prevent re-setting
        break;
      }
    }
  }, [loadedInisiatifId, programOptions]);

  // Auto-select RBSI when editing with inisiatif_id
  useEffect(() => {
    const autoSelectRbsi = async () => {
      if (!loadedInisiatifId || !rbsiOptions.length || selectedRbsi) return;

      // Search through all RBSI to find which one contains this inisiatif
      for (const rbsi of rbsiOptions) {
        try {
          const response = await getRbsiById(rbsi.id);
          const programs = response.data?.programs || [];
          
          // Check if any program has an inisiatif with this id
          const hasMatchingInisiatif = programs.some(program =>
            program.inisiatifs?.some(init => init.id === loadedInisiatifId)
          );

          if (hasMatchingInisiatif) {
            setSelectedRbsi(rbsi);
            setProgramOptions(programs);
            break;
          }
        } catch (error) {
          console.error('Error checking RBSI:', error);
        }
      }
    };

    autoSelectRbsi();
  }, [loadedInisiatifId, rbsiOptions, selectedRbsi]);

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
        aplikasi_id: formData.aplikasiId || undefined,
        inisiatif_id: selectedInisiatif?.id || undefined,
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
        user_id: getUserInfo()?.uuid || '',
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
      aplikasiId: '',
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
    // Reset file upload state
    setExistingFiles([]);
    setIsUploading(false);
    setErrorMessage('');
    // Reset RBSI selection
    setSelectedRbsi(null);
    setSelectedProgram(null);
    setSelectedInisiatif(null);
    setSelectedYear(null);
    setLoadedInisiatifId(null);
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
          borderRadius: '20px',
          maxHeight: '90vh',
          bgcolor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        pb: 2,
        bgcolor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
          Edit PKSI
        </Typography>
        <IconButton 
          onClick={handleClose} 
          size="small"
          sx={{ 
            color: '#86868b',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        pt: 3, 
        pb: 4,
        background: 'linear-gradient(135deg, rgba(245, 245, 247, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%)' 
      }}>
        {isLoadingData ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress sx={{ color: '#DA251C' }} />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Informasi Dasar */}
            <Box sx={{ 
              p: 3,
              borderRadius: '20px', 
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              },
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em', fontSize: '1rem' }}>
                Informasi Dasar
              </Typography>
              <Stack spacing={2.5}>
                <GlassTextField
                  fullWidth
                  label="Nama PKSI"
                  name="namaPksi"
                  value={formData.namaPksi}
                  onChange={handleInputChange}
                  error={!!errors.namaPksi}
                  helperText={errors.namaPksi}
                  size="small"
                />
                <Autocomplete
                  fullWidth
                  options={aplikasiOptions}
                  getOptionLabel={(option) => `${option.kode_aplikasi} - ${option.nama_aplikasi}`}
                  value={aplikasiOptions.find(app => app.id === formData.aplikasiId) || null}
                  onChange={(_, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      aplikasiId: newValue?.id || ''
                    }));
                  }}
                  renderInput={(params) => (
                    <GlassTextField {...params} label="Nama Aplikasi" size="small" />
                  )}
                  size="small"
                />

                {/* RBSI Cascading Selection */}
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  borderRadius: '12px', 
                  bgcolor: 'rgba(218, 37, 28, 0.03)',
                  border: '1px solid rgba(218, 37, 28, 0.1)',
                }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, fontWeight: 600, color: "#DA251C", fontSize: '0.85rem' }}
                  >
                    Program Inisiatif RBSI
                  </Typography>
                  <Stack spacing={2}>
                    <Autocomplete
                  fullWidth
                  options={rbsiOptions}
                  getOptionLabel={(option) => option.periode}
                  value={selectedRbsi}
                  onChange={async (_, newValue) => {
                    setSelectedRbsi(newValue);
                    setSelectedProgram(null);
                    setSelectedInisiatif(null);
                    setSelectedYear(null);
                    setProgramOptions([]);
                    setFormData(prev => ({ ...prev, programInisiatifRBSI: '' }));
                    
                    if (newValue) {
                      try {
                        const response = await getRbsiById(newValue.id);
                        setProgramOptions(response.data.programs || []);
                      } catch (error) {
                        console.error('Error fetching RBSI programs:', error);
                      }
                    }
                  }}
                      renderInput={(params) => (
                        <GlassTextField
                          {...params}
                          label="Pilih RBSI (Periode)"
                          size="small"
                        />
                      )}
                      size="small"
                    />
                
                {/* Combined Program + Inisiatif Dropdown with Year Filter */}
                <Box>
                  <Box
                    onClick={(e) => {
                      if (selectedRbsi) {
                        setPopoverWidth(e.currentTarget.offsetWidth);
                        setInisiatifPopoverAnchor(e.currentTarget);
                      }
                    }}
                    sx={{
                      cursor: selectedRbsi ? 'pointer' : 'not-allowed',
                      py: 1.5,
                      px: 1.5,
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      bgcolor: selectedRbsi ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.04)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': selectedRbsi ? { bgcolor: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.2)' } : {},
                      minHeight: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: selectedRbsi ? 1 : 0.6,
                    }}
                  >
                    {selectedInisiatif && selectedProgram ? (
                      <Box sx={{ overflow: 'hidden', flex: 1 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#1d1d1f', fontWeight: 500, wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {selectedInisiatif.nomor_inisiatif} - {selectedInisiatif.nama_inisiatif}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#86868b', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {selectedProgram.nomor_program} - {selectedProgram.nama_program}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.875rem', color: '#86868b' }}>
                        Pilih Program & Inisiatif...
                      </Typography>
                    )}
                    <ExpandMoreIcon sx={{ color: '#86868b', fontSize: '1.2rem' }} />
                  </Box>
                  <Popover
                    open={Boolean(inisiatifPopoverAnchor)}
                    anchorEl={inisiatifPopoverAnchor}
                    onClose={() => {
                      setInisiatifPopoverAnchor(null);
                    }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    PaperProps={{ 
                      sx: { 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)', 
                        width: popoverWidth || 'auto',
                        maxHeight: 450,
                        mt: 0.5,
                      } 
                    }}
                  >
                    <Box sx={{ py: 1 }}>
                      {/* Year Filter */}
                      <Box sx={{ px: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block', fontWeight: 600 }}>
                          Filter berdasarkan tahun
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label="Semua"
                            size="small"
                            onClick={() => setSelectedYear(null)}
                            sx={{
                              bgcolor: selectedYear === null ? '#DA251C' : '#f5f5f5',
                              color: selectedYear === null ? 'white' : '#666',
                              fontSize: '0.7rem',
                              height: 24,
                              '&:hover': { opacity: 0.8 },
                            }}
                          />
                          {periodYears.map(year => (
                            <Chip
                              key={year}
                              label={year}
                              size="small"
                              onClick={() => setSelectedYear(year)}
                              sx={{
                                bgcolor: selectedYear === year ? '#DA251C' : '#f5f5f5',
                                color: selectedYear === year ? 'white' : '#666',
                                fontSize: '0.7rem',
                                height: 24,
                                '&:hover': { opacity: 0.8 },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Program + Inisiatif List */}
                      <Box sx={{ maxHeight: 330, overflow: 'auto' }}>
                        {groupedInisiatifs.length === 0 ? (
                          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#86868b' }}>
                              {selectedYear ? `Tidak ada inisiatif untuk tahun ${selectedYear}` : 'Tidak ada program & inisiatif'}
                            </Typography>
                          </Box>
                        ) : (
                          groupedInisiatifs.map(({ program, inisiatifs }) => (
                            <Box key={program.id}>
                              {/* Program Header */}
                              <Box
                                sx={{
                                  px: 2,
                                  py: 1,
                                  bgcolor: '#f8f8f8',
                                  borderBottom: '1px solid #e0e0e0',
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 1,
                                }}
                              >
                                <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#DA251C', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                  {program.nomor_program} - {program.nama_program}
                                </Typography>
                              </Box>
                              {/* Inisiatif Items */}
                              {inisiatifs.map(inisiatif => (
                                <MenuItem
                                  key={inisiatif.id}
                                  selected={selectedInisiatif?.id === inisiatif.id}
                                  onClick={() => {
                                    setSelectedProgram(program);
                                    setSelectedInisiatif(inisiatif);
                                    const label = `${inisiatif.nomor_inisiatif} - ${inisiatif.nama_inisiatif} (${program.nomor_program})`;
                                    setFormData(prev => ({ ...prev, programInisiatifRBSI: label }));
                                    setInisiatifPopoverAnchor(null);
                                  }}
                                  sx={{ 
                                    fontSize: '0.85rem', 
                                    py: 1.5, 
                                    px: 2,
                                    pl: 3,
                                    borderLeft: '3px solid transparent',
                                    '&.Mui-selected': {
                                      borderLeftColor: '#DA251C',
                                      bgcolor: 'rgba(218, 37, 28, 0.08)',
                                    },
                                    '&:hover': {
                                      borderLeftColor: '#DA251C',
                                    },
                                  }}
                                >
                                  <Box>
                                    <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                      {inisiatif.nomor_inisiatif} - {inisiatif.nama_inisiatif}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>
                                      Tahun {inisiatif.tahun}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  </Popover>
                </Box>
                  </Stack>
                </Box>

                <GlassTextField
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
              sx={{
                mt: expandedSection === 'section1' ? 1 : 0,
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
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  1. Pendahuluan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2.5}>
                  <GlassTextField
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
                  <GlassTextField
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
                  <GlassTextField
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
              sx={{ 
                mt: expandedSection === 'section2' ? 1 : 0,
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
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  2. Tujuan dan Kegunaan PKSI
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2.5}>
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
              sx={{ 
                mt: expandedSection === 'section3' ? 1 : 0,
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
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  3. Cakupan PKSI
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2.5}>
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
              sx={{ 
                mt: expandedSection === 'section4' ? 1 : 0,
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
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  4. Risiko dan Batasan PKSI
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2.5}>
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
              sx={{ 
                mt: expandedSection === 'section5' ? 1 : 0,
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
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  5. Gambaran Umum Aplikasi yang Diharapkan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2.5}>
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
                    value={formData.programInisiatifRBSI}
                    InputProps={{ readOnly: true }}
                    size="small"
                    helperText="Pilih dari dropdown di bagian Informasi Dasar"
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
              sx={{ 
                mt: expandedSection === 'section6' ? 1 : 0,
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
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  6. Usulan Jadwal Pelaksanaan PKSI
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>
                      Penyusunan Spesifikasi Kebutuhan Aplikasi
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <TextField fullWidth label="Awal Tahap" name="tahap1Awal" type="date" value={formData.tahap1Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                      <TextField fullWidth label="Akhir Tahap" name="tahap1Akhir" type="date" value={formData.tahap1Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>
                      Pengujian Aplikasi – User Acceptance Test (UAT)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                      <TextField fullWidth label="Awal Tahap" name="tahap5Awal" type="date" value={formData.tahap5Awal} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                      <TextField fullWidth label="Akhir Tahap" name="tahap5Akhir" type="date" value={formData.tahap5Akhir} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>
                      Penggunaan Aplikasi (Go-Live)
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
              sx={{ 
                mt: expandedSection === 'section7' ? 1 : 0,
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
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  7. Rencana Pengelolaan
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <GlassTextField
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

            {/* Section 8 - Upload File */}
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
                  8. Upload Dokumen T.0.1
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={2}>
                  {errorMessage && (
                    <Typography color="error" variant="body2">{errorMessage}</Typography>
                  )}
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
                    onClick={() => !isUploading && document.getElementById('edit-pksi-file-upload-input')?.click()}
                  >
                    <input
                      id="edit-pksi-file-upload-input"
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

                  {existingFiles.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>
                        File yang sudah diupload ({existingFiles.length})
                      </Typography>
                      <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px' }}>
                        {existingFiles.map((file, index) => (
                          <ListItem
                            key={file.id}
                            sx={{
                              borderBottom: index < existingFiles.length - 1 ? '1px solid #e5e5e7' : 'none',
                            }}
                          >
                            <ListItemIcon>
                              <FileIcon sx={{ color: '#DA251C' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={file.original_name}
                              secondary={formatFileSize(file.file_size)}
                              primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f' } }}
                              secondaryTypographyProps={{ sx: { color: '#86868b' } }}
                            />
                            <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                              {isPreviewable(file.content_type) && (
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handlePreview(file)}
                                  sx={{ color: '#0891B2', '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' } }}
                                  title="Preview"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleDownload(file)}
                                disabled={downloadingFileId === file.id}
                                sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' } }}
                                title="Download"
                              >
                                {downloadingFileId === file.id ? (
                                  <CircularProgress size={18} sx={{ color: '#059669' }} />
                                ) : (
                                  <DownloadIcon fontSize="small" />
                                )}
                              </IconButton>
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveFile(file.id)}
                                disabled={isUploading}
                                sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}
                                title="Hapus"
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
        )}
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: '1px solid rgba(0, 0, 0, 0.06)', 
        bgcolor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <Button 
          variant="outlined"
          onClick={handleClose} 
          disabled={isSubmitting}
          sx={{
            borderColor: 'rgba(0, 0, 0, 0.12)',
            color: '#86868b',
            borderRadius: 2,
            px: 3,
            fontWeight: 500,
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.24)',
              bgcolor: 'rgba(0, 0, 0, 0.02)',
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
            borderRadius: 2,
            px: 3,
            boxShadow: '0 4px 14px rgba(218, 37, 28, 0.25)',
            '&:hover': {
              background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              boxShadow: '0 6px 20px rgba(218, 37, 28, 0.35)',
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
