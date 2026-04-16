import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
  styled,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  MonitorHeart as MonitorHeartIcon,
  Payments as PaymentsIcon,
  Timeline as TimelineIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getPksiDocumentById, type PksiDocumentData } from '../../api/pksiApi';
import { getAllSkpa } from '../../api/skpaApi';
import { getPksiFiles, downloadPksiFile, type PksiFileData } from '../../api/pksiFileApi';
import FilePreviewModal from './FilePreviewModal';
import PksiChangeLog from '../PksiChangeLog';
import { FileVersionHistory } from '../FileVersionHistory';

const PROGRESS_OPTIONS_VIEW = [
  'Penyusunan Usreq',
  'Pengadaan',
  'Desain',
  'Coding',
  'Unit Test',
  'SIT',
  'UAT',
  'Deployment',
  'Selesai',
] as const;

const TAHAPAN_VIEW_CONFIG: Array<{
  key: typeof PROGRESS_OPTIONS_VIEW[number];
  label: string;
  dateField: keyof PksiDocumentData | null;
  statusField: keyof PksiDocumentData | null;
}> = [
  { key: 'Penyusunan Usreq', label: 'Penyusunan Usreq', dateField: 'target_usreq',   statusField: 'tahapan_status_usreq' },
  { key: 'Pengadaan',         label: 'Pengadaan',         dateField: 'tanggal_pengadaan', statusField: 'tahapan_status_pengadaan' },
  { key: 'Desain',            label: 'Desain',            dateField: 'tanggal_desain',    statusField: 'tahapan_status_desain' },
  { key: 'Coding',            label: 'Coding',            dateField: 'tanggal_coding',    statusField: 'tahapan_status_coding' },
  { key: 'Unit Test',         label: 'Unit Test',         dateField: 'tanggal_unit_test', statusField: 'tahapan_status_unit_test' },
  { key: 'SIT',               label: 'SIT',               dateField: 'target_sit',        statusField: 'tahapan_status_sit' },
  { key: 'UAT',               label: 'UAT',               dateField: 'target_uat',        statusField: 'tahapan_status_uat' },
  { key: 'Deployment',        label: 'Deployment',        dateField: 'target_go_live',    statusField: 'tahapan_status_deployment' },
  { key: 'Selesai',           label: 'Selesai',           dateField: null,                statusField: 'tahapan_status_selesai' },
];

// Glass Card Component
const GlassCard = styled(Box)({
  padding: '20px',
  borderRadius: '16px',
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    transform: 'translateY(-2px)',
  },
});

// Section Header Component
const SectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(218, 37, 28, 0.1)',
});

// Info Row Component
const InfoRow = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '12px',
  '&:last-child': {
    marginBottom: 0,
  },
});

interface ViewPksiModalProps {
  open: boolean;
  onClose: () => void;
  pksiId: string | null;
  showMonitoringSection?: boolean;
}

interface SkpaOption {
  id: string;
  kode_skpa: string;
  nama_skpa: string;
}

// Format date to show only month and year (e.g., "Apr 2026")
const formatMonthYear = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
};

const ViewPksiModal: React.FC<ViewPksiModalProps> = ({ open, onClose, pksiId, showMonitoringSection = false }) => {
  const [pksiData, setPksiData] = useState<PksiDocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [skpaMap, setSkpaMap] = useState<Map<string, SkpaOption>>(new Map());
  const [pksiFiles, setPksiFiles] = useState<PksiFileData[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PksiFileData | null>(null);

  // Fetch SKPA lookup data
  useEffect(() => {
    const fetchSkpaData = async () => {
      try {
        const response = await getAllSkpa();
        const skpaLookup = new Map<string, SkpaOption>();
        (response.data || []).forEach((skpa: SkpaOption) => {
          skpaLookup.set(skpa.id, skpa);
        });
        setSkpaMap(skpaLookup);
      } catch (error) {
        console.error('Error fetching SKPA data:', error);
      }
    };
    fetchSkpaData();
  }, []);

  // Fetch PKSI details
  useEffect(() => {
    const fetchPksiDetails = async () => {
      if (!pksiId || !open) return;

      setIsLoading(true);
      try {
        const data = await getPksiDocumentById(pksiId);
        setPksiData(data);
      } catch (error) {
        console.error('Error fetching PKSI details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPksiDetails();
  }, [pksiId, open]);

  // Fetch PKSI files
  useEffect(() => {
    const fetchFiles = async () => {
      if (!pksiId || !open) return;

      setIsLoadingFiles(true);
      try {
        const files = await getPksiFiles(pksiId);
        setPksiFiles(files);
      } catch (error) {
        console.error('Error fetching PKSI files:', error);
        setPksiFiles([]);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [pksiId, open]);

  const handleClose = () => {
    setPksiData(null);
    setPksiFiles([]);
    onClose();
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

  // Handle file preview in popup modal
  const handleViewFile = (file: PksiFileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Handle preview modal close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Handle download from preview modal
  const handlePreviewDownload = () => {
    if (previewFile) {
      handleDownload(previewFile);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Helper to resolve SKPA codes
  const resolveSkpaCodes = (picSatkerBA?: string): SkpaOption[] => {
    if (!picSatkerBA) return [];
    const guids = picSatkerBA.split(',').map(g => g.trim());
    return guids.map(guid => skpaMap.get(guid)).filter(Boolean) as SkpaOption[];
  };

  // Get status styling
  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'disetujui':
      case 'approved':
        return { bgcolor: 'rgba(49, 162, 76, 0.1)', color: '#31A24C', label: 'Disetujui' };
      case 'ditolak':
      case 'rejected':
      case 'tidak_disetujui':
        return { bgcolor: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', label: 'Tidak Disetujui' };
      default:
        return { bgcolor: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', label: 'Pending' };
    }
  };

  const statusStyle = getStatusStyle(pksiData?.status);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          maxHeight: '90vh',
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
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          pb: 2,
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(218, 37, 28, 0.3)',
            }}
          >
            <DescriptionIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}
            >
              Detail PKSI
            </Typography>
            <Typography variant="body2" sx={{ color: '#86868b' }}>
              Informasi lengkap dokumen PKSI
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: '#86868b',
            bgcolor: 'rgba(0, 0, 0, 0.04)',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          pt: 3,
          pb: 4,
          background: 'linear-gradient(135deg, rgba(245, 245, 247, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%)',
        }}
      >
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress sx={{ color: '#DA251C' }} />
          </Box>
        ) : pksiData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Header Info Card */}
            <GlassCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', mb: 1 }}
                  >
                    {pksiData.nama_pksi}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: '#86868b' }} />
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      Diajukan: {formatDate(pksiData.tanggal_pengajuan || pksiData.created_at)}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={statusStyle.label}
                  sx={{
                    bgcolor: statusStyle.bgcolor,
                    color: statusStyle.color,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 1,
                    borderRadius: '8px',
                  }}
                />
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(0, 0, 0, 0.06)' }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nama Aplikasi
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                    {pksiData.nama_aplikasi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pengaju
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                    {pksiData.user_name || '-'}
                  </Typography>
                </InfoRow>
              </Box>

              {/* SKPA Chips */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                  Satuan Kerja Pemilik Aplikasi
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {resolveSkpaCodes(pksiData.pic_satker_ba).length > 0 ? (
                    resolveSkpaCodes(pksiData.pic_satker_ba).map((skpa, idx) => (
                      <Chip
                        key={idx}
                        label={`${skpa.kode_skpa} - ${skpa.nama_skpa}`}
                        size="small"
                        sx={{
                          bgcolor: '#DA251C',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                  )}
                </Box>
              </Box>

              {/* Program Inisiatif RBSI */}
              {pksiData.program_inisiatif_rbsi && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  borderRadius: '12px', 
                  bgcolor: 'rgba(218, 37, 28, 0.03)',
                  border: '1px solid rgba(218, 37, 28, 0.1)',
                }}>
                  <Typography variant="caption" sx={{ color: '#DA251C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                    Program Inisiatif RBSI
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                    {pksiData.program_inisiatif_rbsi}
                  </Typography>
                </Box>
              )}
            </GlassCard>

            {/* Timeline Section - Always visible */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TimelineIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  Timeline
                </Typography>
              </SectionHeader>

              {/* Progress Stepper */}
              <Box sx={{ mb: 3, p: 3, borderRadius: '12px', bgcolor: 'rgba(139, 92, 246, 0.02)', border: '1px solid rgba(139, 92, 246, 0.08)' }}>
                <Stepper 
                  activeStep={(() => {
                    const stages = ['USREQ', 'PENGADAAN', 'DESAIN', 'CODING', 'UNIT_TEST', 'SIT', 'UAT', 'DEPLOYMENT', 'GO_LIVE'];
                    const hasData = (stage: string) => {
                      const phases = (pksiData.timelines || []).filter(t => t.stage === stage);
                      return phases.length > 0;
                    };
                    // Find the last stage with data
                    for (let i = stages.length - 1; i >= 0; i--) {
                      if (hasData(stages[i])) return i + 1;
                    }
                    return 0;
                  })()} 
                  orientation="horizontal"
                  sx={{
                    '& .MuiStepConnector-root': {
                      top: 20,
                    },
                    '& .MuiStepConnector-line': {
                      borderColor: 'rgba(139, 92, 246, 0.2)',
                      borderTopWidth: 2,
                    },
                    '& .MuiStep-root': {
                      padding: 0,
                    },
                  }}
                >
                  {[
                    { stage: 'USREQ', label: 'USREQ' },
                    { stage: 'PENGADAAN', label: 'Pengadaan' },
                    { stage: 'DESAIN', label: 'Desain' },
                    { stage: 'CODING', label: 'Coding' },
                    { stage: 'UNIT_TEST', label: 'Unit Test' },
                    { stage: 'SIT', label: 'SIT' },
                    { stage: 'UAT', label: 'UAT' },
                    { stage: 'DEPLOYMENT', label: 'Deployment' },
                    { stage: 'GO_LIVE', label: 'Go Live' },
                  ].map(({ stage, label }) => {
                    const phases = (pksiData.timelines || []).filter(t => t.stage === stage).sort((a, b) => a.phase - b.phase);
                    const hasData = phases.length > 0;
                    
                    return (
                      <Step key={stage}>
                        <StepLabel
                          sx={{
                            flexDirection: 'column',
                            '& .MuiStepLabel-iconContainer': {
                              paddingRight: 0,
                              marginBottom: 0.5,
                            },
                            '& .MuiStepLabel-labelContainer': {
                              textAlign: 'center',
                            },
                          }}
                          StepIconProps={{
                            sx: {
                              color: hasData ? 'rgba(139, 92, 246, 0.2)' : 'rgba(156, 163, 175, 0.15)',
                              '&.Mui-active': {
                                color: 'rgba(139, 92, 246, 0.3)',
                              },
                              '&.Mui-completed': {
                                color: 'rgba(139, 92, 246, 0.2)',
                              },
                              '& .MuiStepIcon-text': {
                                display: 'none',
                              },
                            },
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#1d1d1f', fontWeight: 500, fontSize: '0.7rem', mb: 0.5 }}>
                            {label}
                          </Typography>
                          {phases.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                              {phases.map((phase, idx) => (
                                <Typography key={idx} variant="caption" sx={{ color: '#6B7280', fontSize: '0.65rem' }}>
                                  {phases.length > 1 ? `F${phase.phase}: ` : ''}{formatMonthYear(phase.target_date)}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#D1D5DB', fontSize: '0.65rem' }}>
                              -
                            </Typography>
                          )}
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              </Box>
            </GlassCard>

            {/* Section 8: Monitoring & Tracking (Only for DISETUJUI status and when showMonitoringSection is true) */}
            {showMonitoringSection && pksiData.status === 'DISETUJUI' && (
              <GlassCard>
                <SectionHeader>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(49, 162, 76, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MonitorHeartIcon sx={{ color: '#31A24C', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                    Monitoring & Tracking
                  </Typography>
                </SectionHeader>

                {/* Tim & PIC */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(49, 162, 76, 0.03)', border: '1px solid rgba(49, 162, 76, 0.1)', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon sx={{ color: '#31A24C', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#31A24C' }}>Tim & PIC</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>PIC</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.pic_approval_name || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Anggota Tim</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.anggota_tim_names || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>IKU</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.iku === 'ya' ? 'Ya' : 'Tidak'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Inhouse/Outsource</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.inhouse_outsource || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Inisiatif RBSI</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.inisiatif_rbsi || pksiData.program_inisiatif_rbsi || '-'}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* Progres Tahapan Table */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D97706' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706' }}>Progres Tahapan</Typography>
                  </Box>
                  <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid rgba(217,119,6,0.15)', overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(217,119,6,0.06)' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1, width: '38%' }}>Tahapan</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1, width: '30%' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1 }}>Tanggal Penyelesaian</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {TAHAPAN_VIEW_CONFIG.map((tahapan) => {
                          // Use saved per-tahapan status if available, else derive from progress
                          const savedStatus = tahapan.statusField
                            ? (pksiData[tahapan.statusField] as string | undefined)
                            : undefined;
                          let status: string;
                          if (savedStatus) {
                            status = savedStatus;
                          } else {
                            const progressIdx = PROGRESS_OPTIONS_VIEW.indexOf(pksiData.progress as typeof PROGRESS_OPTIONS_VIEW[number]);
                            const tahapanIdx  = PROGRESS_OPTIONS_VIEW.indexOf(tahapan.key);
                            const isDoneFallback   = tahapanIdx < progressIdx;
                            const isActiveFallback = tahapanIdx === progressIdx;
                            status = isDoneFallback ? 'Selesai' : isActiveFallback ? 'Dalam proses' : 'Belum dimulai';
                          }
                          const isSelesai  = status === 'Selesai';
                          const isDalam    = status === 'Dalam proses';
                          const chipColor  = isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280';
                          const chipBg     = isSelesai ? '#F0FDF4' : isDalam ? '#FFFBEB' : '#F3F4F6';
                          // Only show date when the tahapan is actually completed
                          const rawDate     = (isSelesai && tahapan.dateField)
                            ? (pksiData[tahapan.dateField] as string | undefined)
                            : undefined;
                          const displayDate = rawDate ? rawDate.split(',')[0].trim().substring(0, 10) : null;
                          return (
                            <TableRow
                              key={tahapan.key}
                              sx={{ '&:last-child td': { borderBottom: 0 }, bgcolor: isDalam ? 'rgba(217,119,6,0.03)' : 'transparent' }}
                            >
                              <TableCell sx={{ fontSize: '0.8rem', py: 0.9, fontWeight: isDalam ? 600 : 400, color: isDalam ? '#92400E' : '#1d1d1f' }}>
                                {tahapan.label}
                              </TableCell>
                              <TableCell sx={{ py: 0.9 }}>
                                <Chip label={status} size="small" sx={{ bgcolor: chipBg, color: chipColor, fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', py: 0.9, color: displayDate ? '#15803D' : '#86868b' }}>
                                {displayDate || '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Anggaran */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.1)', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PaymentsIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB' }}>Anggaran</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Total</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.anggaran_total || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Tahun Ini</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.anggaran_tahun_ini || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Tahun Depan</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.anggaran_tahun_depan || '-'}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* Dokumen */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(217, 119, 6, 0.03)', border: '1px solid rgba(217, 119, 6, 0.1)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706', mb: 1.5 }}>Rencana PKSI (T01/T02)</Typography>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Status</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.status_t01_t02 || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas Terbaru</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.berkas_t01_t02 || '-'}</Typography>
                    </InfoRow>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(5, 150, 105, 0.03)', border: '1px solid rgba(5, 150, 105, 0.1)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669', mb: 1.5 }}>Spesifikasi Kebutuhan (T11)</Typography>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Status</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.status_t11 || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas Terbaru</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.berkas_t11 || '-'}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* CD Prinsip */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(220, 38, 38, 0.03)', border: '1px solid rgba(220, 38, 38, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626', mb: 1.5 }}>CD Prinsip</Typography>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Nomor CD</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.nomor_cd || '-'}</Typography>
                  </InfoRow>
                </Box>

                {/* Kontrak */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(8, 145, 178, 0.03)', border: '1px solid rgba(8, 145, 178, 0.1)', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <GavelIcon sx={{ color: '#0891B2', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0891B2' }}>Kontrak</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Tanggal Mulai</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.kontrak_tanggal_mulai || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Tanggal Selesai</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.kontrak_tanggal_selesai || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Nilai Kontrak</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.kontrak_nilai || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Jumlah Termin</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.kontrak_jumlah_termin || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Detail Pembayaran</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.kontrak_detail_pembayaran || '-'}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* BA Deploy */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED', mb: 1.5 }}>BA Deploy</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.ba_deploy || '-'}</Typography>
                </Box>
              </GlassCard>
            )}

            {/* Section 9: Dokumen */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(218, 37, 28, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AttachFileIcon sx={{ color: '#DA251C', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  9. Dokumen
                </Typography>
              </SectionHeader>

              {isLoadingFiles ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} sx={{ color: '#DA251C' }} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* T01 - Rencana PKSI */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                        Rencana PKSI (T01/T02)
                      </Typography>
                      {pksiFiles.filter(f => f.file_type === 'T01' || !f.file_type).some(f => (f.version || 1) > 1) && (
                        <FileVersionHistory
                          documentId={pksiId || ''}
                          fileType="T01"
                          documentType="pksi"
                          isOpen={false}
                          onClose={() => {}}
                        />
                      )}
                    </Box>
                    {pksiFiles.filter(f => (f.file_type === 'T01' || !f.file_type) && f.is_latest_version !== false).length > 0 ? (
                      <List dense sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px', p: 1 }}>
                        {pksiFiles.filter(f => (f.file_type === 'T01' || !f.file_type) && f.is_latest_version !== false).map((file, index, arr) => (
                          <ListItem
                            key={file.id}
                            sx={{
                              borderRadius: '8px',
                              mb: index < arr.length - 1 ? 1 : 0,
                              bgcolor: 'white',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <FileIcon sx={{ color: '#DA251C', fontSize: 24 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{file.display_name || file.original_name}</span>
                                  {file.version && file.version > 1 && (
                                    <Chip
                                      label={`V${file.version}`}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: '#059669',
                                        color: 'white',
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={formatFileSize(file.file_size)}
                              primaryTypographyProps={{
                                sx: {
                                  fontWeight: 500,
                                  color: '#1d1d1f',
                                  fontSize: '0.9rem',
                                },
                              }}
                              secondaryTypographyProps={{
                                sx: { color: '#86868b', fontSize: '0.75rem' },
                              }}
                            />
                            <ListItemSecondaryAction>
                              {(file.content_type === 'application/pdf' || file.content_type?.startsWith('image/')) && (
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handleViewFile(file)}
                                  sx={{
                                    color: '#0891B2',
                                    mr: 1,
                                    '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' },
                                  }}
                                  title="Lihat"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleDownload(file)}
                                disabled={downloadingFileId === file.id}
                                sx={{
                                  color: '#059669',
                                  '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' },
                                }}
                                title="Download"
                              >
                                {downloadingFileId === file.id ? (
                                  <CircularProgress size={18} sx={{ color: '#059669' }} />
                                ) : (
                                  <DownloadIcon fontSize="small" />
                                )}
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          borderRadius: '12px',
                          bgcolor: 'rgba(245, 245, 247, 0.8)',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#86868b' }}>
                          Belum ada dokumen Rencana PKSI
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* T11 - Spesifikasi Kebutuhan */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                        Spesifikasi Kebutuhan (T11)
                      </Typography>
                      {pksiFiles.filter(f => f.file_type === 'T11').some(f => (f.version || 1) > 1) && (
                        <FileVersionHistory
                          documentId={pksiId || ''}
                          fileType="T11"
                          documentType="pksi"
                          isOpen={false}
                          onClose={() => {}}
                        />
                      )}
                    </Box>
                    {pksiFiles.filter(f => f.file_type === 'T11' && f.is_latest_version !== false).length > 0 ? (
                      <List dense sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px', p: 1 }}>
                        {pksiFiles.filter(f => f.file_type === 'T11' && f.is_latest_version !== false).map((file, index, arr) => (
                          <ListItem
                            key={file.id}
                            sx={{
                              borderRadius: '8px',
                              mb: index < arr.length - 1 ? 1 : 0,
                              bgcolor: 'white',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <FileIcon sx={{ color: '#0891B2', fontSize: 24 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{file.display_name || file.original_name}</span>
                                  {file.version && file.version > 1 && (
                                    <Chip
                                      label={`V${file.version}`}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: '#0891B2',
                                        color: 'white',
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={formatFileSize(file.file_size)}
                              primaryTypographyProps={{
                                sx: {
                                  fontWeight: 500,
                                  color: '#1d1d1f',
                                  fontSize: '0.9rem',
                                },
                              }}
                              secondaryTypographyProps={{
                                sx: { color: '#86868b', fontSize: '0.75rem' },
                              }}
                            />
                            <ListItemSecondaryAction>
                              {(file.content_type === 'application/pdf' || file.content_type?.startsWith('image/')) && (
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handleViewFile(file)}
                                  sx={{
                                    color: '#0891B2',
                                    mr: 1,
                                    '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' },
                                  }}
                                  title="Lihat"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleDownload(file)}
                                disabled={downloadingFileId === file.id}
                                sx={{
                                  color: '#059669',
                                  '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' },
                                }}
                                title="Download"
                              >
                                {downloadingFileId === file.id ? (
                                  <CircularProgress size={18} sx={{ color: '#059669' }} />
                                ) : (
                                  <DownloadIcon fontSize="small" />
                                )}
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          borderRadius: '12px',
                          bgcolor: 'rgba(245, 245, 247, 0.8)',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#86868b' }}>
                          Belum ada dokumen Spesifikasi Kebutuhan
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </GlassCard>

            {/* Section 10: Riwayat Perubahan */}
            <PksiChangeLog pksiId={pksiId || ''} />

            {/* Metadata */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, pt: 1 }}>
              <Typography variant="caption" sx={{ color: '#86868b' }}>
                Dibuat: {formatDate(pksiData.created_at)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#86868b' }}>
                Diperbarui: {formatDate(pksiData.updated_at)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="body2" sx={{ color: '#86868b' }}>
              Data tidak ditemukan
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          p: 2.5,
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            borderColor: 'rgba(0, 0, 0, 0.12)',
            color: '#86868b',
            borderRadius: 2,
            px: 4,
            fontWeight: 500,
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.24)',
              bgcolor: 'rgba(0, 0, 0, 0.02)',
            },
          }}
        >
          Tutup
        </Button>
      </DialogActions>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={previewOpen}
        onClose={handlePreviewClose}
        fileId={previewFile?.id || null}
        fileName={previewFile?.original_name || ''}
        contentType={previewFile?.content_type || ''}
        onDownload={handlePreviewDownload}
        downloadUrl={`/api/pksi/files/download/${previewFile?.id}`}
      />
    </Dialog>
  );
};

export default ViewPksiModal;
