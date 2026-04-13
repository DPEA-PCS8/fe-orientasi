import React, { useState, useEffect, useRef, useMemo } from "react";
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
  styled,
  CircularProgress,
  Popover,
  MenuItem,
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { getAllSkpa, type SkpaData } from "../../api/skpaApi";
import { getAllAplikasi, type AplikasiData } from "../../api/aplikasiApi";
import {
  createPksiDocument,
  type PksiDocumentRequest,
} from "../../api/pksiApi";
import { getUserInfo } from "../../api/authApi";
import {
  getAllRbsi,
  getRbsiById,
  type RbsiResponse,
  type RbsiProgramResponse,
  type RbsiInisiatifResponse,
} from "../../api/rbsiApi";
import { 
  uploadPksiTempFiles, 
  movePksiTempFilesToPermanent, 
  deletePksiTempFiles,
  deletePksiFile,
  downloadPksiFile,
  previewPksiFile,
  type PksiFileData 
} from "../../api/pksiFileApi";

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

interface AddPksiModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  namaPksi: string;
  aplikasiId: string;
  tanggalPengajuan: string;
  picSatkerBA: string[];
  programInisiatifRBSI: string;
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

const AddPksiModal = ({ open, onClose, onSuccess }: AddPksiModalProps) => {
  const [expandedSection, setExpandedSection] = useState<string | false>(
    "jadwal",
  );
  const [, setSkpaOptions] = useState<SkpaOption[]>([]);
  const [aplikasiOptions, setAplikasiOptions] = useState<AplikasiData[]>([]);
  const [rbsiOptions, setRbsiOptions] = useState<RbsiResponse[]>([]);
  const [programOptions, setProgramOptions] = useState<RbsiProgramResponse[]>(
    [],
  );
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [selectedProgram, setSelectedProgram] =
    useState<RbsiProgramResponse | null>(null);
  const [selectedInisiatif, setSelectedInisiatif] =
    useState<RbsiInisiatifResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [inisiatifPopoverAnchor, setInisiatifPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverWidth, setPopoverWidth] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    namaPksi: "",
    aplikasiId: "",
    tanggalPengajuan: new Date().toISOString().split("T")[0],
    picSatkerBA: [],
    programInisiatifRBSI: "",
    targetUsreq: currentMonthValue(),
    targetSit: currentMonthValue(),
    targetUat: currentMonthValue(),
    targetGoLive: currentMonthValue(),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // File upload state - matching FS2 pattern
  const [uploadedFileData, setUploadedFileData] = useState<PksiFileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(`pksi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

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

  // Fetch SKPA and Aplikasi options on mount
  useEffect(() => {
    const fetchSkpaOptions = async () => {
      try {
        const response = await getAllSkpa();
        const mappedSkpa: SkpaOption[] = (response.data || []).map(
          (skpa: SkpaData) => ({
            id: skpa.id,
            kode_skpa: skpa.kode_skpa,
            nama_skpa: skpa.nama_skpa,
          }),
        );
        setSkpaOptions(mappedSkpa);
      } catch (error) {
        console.error("Error fetching SKPA options:", error);
      }
    };
    const fetchAplikasiOptions = async () => {
      try {
        const response = await getAllAplikasi();
        setAplikasiOptions(response.data || []);
      } catch (error) {
        console.error("Error fetching Aplikasi options:", error);
      }
    };
    const fetchRbsiOptions = async () => {
      try {
        const response = await getAllRbsi();
        setRbsiOptions(response.data || []);
      } catch (error) {
        console.error("Error fetching RBSI options:", error);
      }
    };
    fetchSkpaOptions();
    fetchAplikasiOptions();
    fetchRbsiOptions();
  }, []);

  // File upload handler - matching FS2 pattern
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && sessionIdRef.current) {
      // Only take the first file (single file upload)
      const file = files[0];
      
      // Delete existing file if any
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
        // Upload to temp storage
        const uploadedData = await uploadPksiTempFiles(sessionIdRef.current, [file]);
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
    setUploadedFileData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownload = async (fileData: PksiFileData) => {
    if (!fileData?.id) return;
    setDownloadingFileId(fileData.id);
    try {
      await downloadPksiFile(fileData.id, fileData.original_name);
    } catch (error) {
      console.error('Failed to download file:', error);
      setErrorMessage('Gagal mengunduh file. Silakan coba lagi.');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handlePreview = async (fileData: PksiFileData) => {
    if (!fileData?.id) return;
    try {
      await previewPksiFile(fileData.id);
    } catch (error) {
      console.error('Failed to preview file:', error);
      setErrorMessage('Gagal membuka preview file. Silakan coba lagi.');
    }
  };

  const isPreviewable = (contentType: string | undefined): boolean => {
    if (!contentType) return false;
    return contentType.startsWith('image/') || contentType === 'application/pdf';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? panel : false);
    };

  const resetForm = () => {
    setFormData({
      namaPksi: "",
      aplikasiId: "",
      tanggalPengajuan: new Date().toISOString().split("T")[0],
      picSatkerBA: [],
      programInisiatifRBSI: "",
      targetUsreq: currentMonthValue(),
      targetSit: currentMonthValue(),
      targetUat: currentMonthValue(),
      targetGoLive: currentMonthValue(),
    });
    setErrors({});
    setSuccessMessage("");
    setErrorMessage("");
    setExpandedSection("jadwal");
    setUploadedFileData([]);
    setIsUploading(false);
    setSelectedRbsi(null);
    setSelectedProgram(null);
    setSelectedInisiatif(null);
    setSelectedYear(null);
    setProgramOptions([]);
    // Generate new session ID for next form
    sessionIdRef.current = `pksi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.namaPksi) newErrors.namaPksi = "Nama PKSI wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
    setErrorMessage("");

    try {
      const requestData: PksiDocumentRequest = {
        aplikasi_id: formData.aplikasiId || undefined,
        inisiatif_id: selectedInisiatif?.id || undefined,
        nama_pksi: formData.namaPksi,
        tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        pic_satker_ba: formData.picSatkerBA.length > 0 ? formData.picSatkerBA.join(",") : undefined,
        program_inisiatif_rbsi: formData.programInisiatifRBSI || undefined,
        target_usreq: formData.targetUsreq || undefined,
        target_sit: formData.targetSit || undefined,
        target_uat: formData.targetUat || undefined,
        target_go_live: formData.targetGoLive || undefined,
        user_id: getUserInfo()?.uuid || "",
      };

      const createdPksi = await createPksiDocument(requestData);

      // Move temp files to permanent storage if any were uploaded
      if (uploadedFileData.length > 0 && createdPksi.id) {
        try {
          await movePksiTempFilesToPermanent(createdPksi.id, sessionIdRef.current);
        } catch (uploadError) {
          console.error("Error moving files to permanent storage:", uploadError);
          // PKSI created but files failed - show warning but don't fail
          setSuccessMessage("PKSI berhasil ditambahkan! (Namun ada error saat memindahkan file)");
          setErrorMessage("");
          setTimeout(() => {
            resetForm();
            onSuccess?.();
            onClose();
          }, 2000);
          return;
        }
      }

      setSuccessMessage("PKSI berhasil ditambahkan!");
      setErrorMessage("");

      setTimeout(() => {
        resetForm();
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error submitting form:", error);
      const errMsg =
        error instanceof Error ? error.message : "Gagal menambahkan PKSI";
      setErrorMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    // Clean up temp files if user cancels
    if (uploadedFileData.length > 0) {
      try {
        await deletePksiTempFiles(sessionIdRef.current);
      } catch (error) {
        console.error("Error cleaning up temp files:", error);
      }
    }
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
          borderRadius: "20px",
          maxHeight: "90vh",
          bgcolor: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        },
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
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          pb: 2,
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.02em" }}
        >
          Tambah PKSI Baru
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: "#86868b",
            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 3,
          pb: 4,
          background: "linear-gradient(135deg, rgba(245, 245, 247, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%)",
        }}
      >
        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Informasi Dasar */}
          <Box
            sx={{
              p: 3,
              borderRadius: "20px",
              bgcolor: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2.5,
                fontWeight: 600,
                color: "#1d1d1f",
                letterSpacing: "-0.01em",
                fontSize: '1rem',
              }}
            >
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
                getOptionLabel={(option) =>
                  `${option.kode_aplikasi} - ${option.nama_aplikasi}`
                }
                value={
                  aplikasiOptions.find(
                    (app) => app.id === formData.aplikasiId,
                  ) || null
                }
                onChange={(_, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    aplikasiId: newValue?.id || "",
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
                      setFormData((prev) => ({
                        ...prev,
                        programInisiatifRBSI: "",
                      }));

                      if (newValue) {
                        try {
                          const response = await getRbsiById(newValue.id);
                          setProgramOptions(response.data.programs || []);
                        } catch (error) {
                          console.error("Error fetching RBSI programs:", error);
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
                                  setFormData((prev) => ({
                                    ...prev,
                                    programInisiatifRBSI: label,
                                  }));
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

          {/* Usulan Jadwal Pelaksanaan */}
          <Accordion
            expanded={expandedSection === "jadwal"}
            onChange={handleAccordionChange("jadwal")}
            sx={{
              mt: expandedSection === "jadwal" ? 1 : 0,
              borderRadius: "16px !important",
              bgcolor: "rgba(255, 255, 255, 0.72)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow:
                "0 4px 30px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
              "&::before": { display: "none" },
              "&.Mui-expanded": { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "#86868b" }} />}
              sx={{
                borderRadius: "16px",
                "&.Mui-expanded": { minHeight: 48 },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  color: "#1d1d1f",
                  fontSize: "0.9rem",
                  letterSpacing: "-0.01em",
                }}
              >
                Usulan Jadwal Pelaksanaan
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1.5, pb: 2, px: 2 }}>
              {/* 2x2 grid of glass milestone cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>

                {/* Card 1 — Target Usreq */}
                <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 6px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #6366F1, #818CF8)' }} />
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(99,102,241,0.4)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>1</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target Usreq</Typography>
                    </Box>
                    <TextField
                      fullWidth size="small" type="month"
                      value={formData.targetUsreq ? formData.targetUsreq.substring(0, 7) : ""}
                      onChange={(e) => setFormData(p => ({ ...p, targetUsreq: e.target.value ? lastDayOfMonth(e.target.value) : "" }))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: 'rgba(99,102,241,0.07)', '& fieldset': { border: '1px solid rgba(99,102,241,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.78rem', py: '6px', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

                {/* Card 2 — Target SIT */}
                <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 6px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }} />
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(139,92,246,0.4)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>2</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target SIT</Typography>
                    </Box>
                    <TextField
                      fullWidth size="small" type="month"
                      value={formData.targetSit ? formData.targetSit.substring(0, 7) : ""}
                      onChange={(e) => setFormData(p => ({ ...p, targetSit: e.target.value ? lastDayOfMonth(e.target.value) : "" }))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: 'rgba(139,92,246,0.07)', '& fieldset': { border: '1px solid rgba(139,92,246,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(139,92,246,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#8B5CF6', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.78rem', py: '6px', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

                {/* Card 3 — Target UAT/PDKK */}
                <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 6px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #F59E0B, #FCD34D)' }} />
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(245,158,11,0.4)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>3</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target UAT/PDKK</Typography>
                    </Box>
                    <TextField
                      fullWidth size="small" type="month"
                      value={formData.targetUat ? formData.targetUat.substring(0, 7) : ""}
                      onChange={(e) => setFormData(p => ({ ...p, targetUat: e.target.value ? lastDayOfMonth(e.target.value) : "" }))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: 'rgba(245,158,11,0.07)', '& fieldset': { border: '1px solid rgba(245,158,11,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(245,158,11,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#F59E0B', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.78rem', py: '6px', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

                {/* Card 4 — Target Go Live */}
                <Box sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 6px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden' }}>
                  <Box sx={{ height: 3, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(16,185,129,0.4)', flexShrink: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>4</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>Target Go Live</Typography>
                    </Box>
                    <TextField
                      fullWidth size="small" type="month"
                      value={formData.targetGoLive ? formData.targetGoLive.substring(0, 7) : ""}
                      onChange={(e) => setFormData(p => ({ ...p, targetGoLive: e.target.value ? lastDayOfMonth(e.target.value) : "" }))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: 'rgba(16,185,129,0.07)', '& fieldset': { border: '1px solid rgba(16,185,129,0.18)' }, '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.4)' }, '&.Mui-focused fieldset': { borderColor: '#10B981', borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.78rem', py: '6px', color: '#1d1d1f' } }}
                    />
                  </Box>
                </Box>

              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Upload Dokumen */}
          <Accordion
            expanded={expandedSection === "upload"}
            onChange={handleAccordionChange("upload")}
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
                Upload Dokumen T.0.1
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
                  onClick={() => !isUploading && document.getElementById('pksi-modal-file-upload-input')?.click()}
                >
                  <input
                    id="pksi-modal-file-upload-input"
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
                          <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                            {isPreviewable(fileData.content_type) && (
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handlePreview(fileData)}
                                sx={{ color: '#0891B2', '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' } }}
                                title="Preview"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleDownload(fileData)}
                              disabled={downloadingFileId === fileData.id}
                              sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' } }}
                              title="Download"
                            >
                              {downloadingFileId === fileData.id ? (
                                <CircularProgress size={18} sx={{ color: '#059669' }} />
                              ) : (
                                <DownloadIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleRemoveFile(index)}
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
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            borderColor: "rgba(0, 0, 0, 0.12)",
            color: "#86868b",
            borderRadius: 2,
            px: 3,
            fontWeight: 500,
            "&:hover": {
              borderColor: "rgba(0, 0, 0, 0.24)",
              bgcolor: "rgba(0, 0, 0, 0.02)",
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
            background: "linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)",
            fontWeight: 500,
            borderRadius: 2,
            px: 3,
            boxShadow: "0 4px 14px rgba(218, 37, 28, 0.25)",
            "&:hover": {
              background: "linear-gradient(135deg, #B91C14 0%, #D83A32 100%)",
              boxShadow: "0 6px 20px rgba(218, 37, 28, 0.35)",
            },
            "&.Mui-disabled": {
              background: "#e5e5e7",
              
            },
          }}
        >
          {isSubmitting ? "Menyimpan..." : "Simpan PKSI"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPksiModal;
