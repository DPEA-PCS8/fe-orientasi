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
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  WarningAmber as WarningIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  CompareArrows as CompareArrowsIcon,
  Gavel as GavelIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MonitorHeart as MonitorHeartIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getFs2DocumentById, type Fs2DocumentData } from '../../api/fs2Api';
import { getFs2Files, downloadFs2File, type Fs2FileData } from '../../api/fs2FileApi';
import FilePreviewModal from './FilePreviewModal';
import Fs2ChangeLog from '../Fs2ChangeLog';

// Glass Card Component - matching ViewPksiModal
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
  borderBottom: '1px solid rgba(49, 162, 76, 0.1)',
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

interface ViewFs2ModalProps {
  open: boolean;
  onClose: () => void;
  fs2Id: string | null;
  showMonitoringSection?: boolean;
}

// Constants for labels (matching those in Fs2List and Fs2Disetujui)
const STATUS_TAHAPAN_LABELS: Record<string, string> = {
  DESAIN: 'Desain',
  PEMELIHARAAN: 'Pemeliharaan',
};

const URGENSI_LABELS: Record<string, string> = {
  RENDAH: 'Rendah',
  SEDANG: 'Sedang',
  TINGGI: 'Tinggi',
};

const PROGRES_LABELS: Record<string, string> = {
  DESAIN: 'Desain',
  PENGEMBANGAN: 'Pengembangan',
  PENGUJIAN: 'Pengujian',
  DEPLOYMENT: 'Deployment',
  GO_LIVE: 'Go Live',
};

const FASE_LABELS: Record<string, string> = {
  FASE_1: 'Fase 1',
  FASE_2: 'Fase 2',
  FASE_3: 'Fase 3',
  TAMBAHAN: 'Tambahan',
};

const MEKANISME_LABELS: Record<string, string> = {
  INHOUSE: 'Inhouse',
  OUTSOURCE: 'Outsource',
};

const PELAKSANAAN_LABELS: Record<string, string> = {
  SINGLE_YEAR: 'Single Year',
  MULTIYEARS: 'Multiyears',
};

const ViewFs2Modal: React.FC<ViewFs2ModalProps> = ({ open, onClose, fs2Id, showMonitoringSection = false }) => {
  const [fs2Data, setFs2Data] = useState<Fs2DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fs2Files, setFs2Files] = useState<Fs2FileData[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  
  // File preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<Fs2FileData | null>(null);

  // Fetch FS2 details
  useEffect(() => {
    const fetchFs2Details = async () => {
      if (!fs2Id || !open) return;

      setIsLoading(true);
      try {
        const data = await getFs2DocumentById(fs2Id);
        setFs2Data(data);
      } catch (error) {
        console.error('Error fetching F.S.2 details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFs2Details();
  }, [fs2Id, open]);

  // Fetch FS2 files
  useEffect(() => {
    const fetchFiles = async () => {
      if (!fs2Id || !open) return;

      setIsLoadingFiles(true);
      try {
        const files = await getFs2Files(fs2Id);
        setFs2Files(files);
      } catch (error) {
        console.error('Error fetching F.S.2 files:', error);
        setFs2Files([]);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [fs2Id, open]);

  const handleClose = () => {
    setFs2Data(null);
    setFs2Files([]);
    onClose();
  };

  // Handle file download
  const handleDownload = async (file: Fs2FileData) => {
    setDownloadingFileId(file.id);
    try {
      const blob = await downloadFs2File(file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Handle file view - open preview modal instead of new tab
  const handleViewFile = (file: Fs2FileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Check if file is previewable
  const isPreviewable = (contentType: string): boolean => {
    return contentType === 'application/pdf' || contentType.startsWith('image/');
  };

  // Handle preview close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Handle download from preview modal
  const handlePreviewDownload = async () => {
    if (previewFile) {
      await handleDownload(previewFile);
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
      case 'pending':
        return { bgcolor: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', label: 'Pending' };
      default:
        return { bgcolor: 'rgba(134, 134, 139, 0.1)', color: '#86868b', label: status || 'Draft' };
    }
  };

  // Get urgensi styling
  const getUrgensiStyle = (urgensi?: string) => {
    switch (urgensi?.toUpperCase()) {
      case 'TINGGI':
        return { bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' };
      case 'SEDANG':
        return { bgcolor: 'rgba(217, 119, 6, 0.1)', color: '#D97706' };
      case 'RENDAH':
        return { bgcolor: 'rgba(49, 162, 76, 0.1)', color: '#31A24C' };
      default:
        return { bgcolor: 'rgba(134, 134, 139, 0.1)', color: '#86868b' };
    }
  };

  const statusStyle = getStatusStyle(fs2Data?.status);

  // Render criteria check
  const renderCriteria = (value: boolean | undefined, label: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {value ? (
        <CheckCircleIcon sx={{ color: '#31A24C', fontSize: 18 }} />
      ) : (
        <CancelIcon sx={{ color: '#DC2626', fontSize: 18 }} />
      )}
      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
        {label}
      </Typography>
    </Box>
  );

  // Get pelaksanaan display text
  const getPelaksanaanDisplay = () => {
    if (!fs2Data) return '-';
    if (fs2Data.pelaksanaan === 'SINGLE_YEAR') {
      return `Single Year${fs2Data.tahun ? ` (${fs2Data.tahun})` : ''}`;
    }
    if (fs2Data.pelaksanaan === 'MULTIYEARS') {
      return `Multiyears${fs2Data.tahun_mulai && fs2Data.tahun_selesai ? ` (${fs2Data.tahun_mulai} - ${fs2Data.tahun_selesai})` : ''}`;
    }
    return PELAKSANAAN_LABELS[fs2Data.pelaksanaan || ''] || fs2Data.pelaksanaan || '-';
  };

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
              background: 'linear-gradient(135deg, #31A24C 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(49, 162, 76, 0.3)',
            }}
          >
            <DescriptionIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}
            >
              Detail F.S.2
            </Typography>
            <Typography variant="body2" sx={{ color: '#86868b' }}>
              Informasi lengkap dokumen F.S.2
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
            <CircularProgress sx={{ color: '#31A24C' }} />
          </Box>
        ) : fs2Data ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Header Info Card */}
            <GlassCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', mb: 1 }}
                  >
                    {fs2Data.nama_aplikasi || 'Dokumen F.S.2'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: '#86868b' }} />
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      Diajukan: {formatDate(fs2Data.tanggal_pengajuan || fs2Data.created_at)}
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
                    {fs2Data.nama_aplikasi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pengaju
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                    {fs2Data.user_name || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Bidang
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                    {fs2Data.nama_bidang || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SKPA
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {fs2Data.kode_skpa || fs2Data.nama_skpa ? (
                      <Chip
                        label={`${fs2Data.kode_skpa || ''} ${fs2Data.nama_skpa ? `- ${fs2Data.nama_skpa}` : ''}`}
                        size="small"
                        sx={{
                          bgcolor: '#31A24C',
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                    )}
                  </Box>
                </InfoRow>
              </Box>

              {/* Urgensi Badge */}
              {fs2Data.urgensi && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                    Urgensi
                  </Typography>
                  <Chip
                    label={URGENSI_LABELS[fs2Data.urgensi] || fs2Data.urgensi}
                    size="small"
                    sx={{
                      ...getUrgensiStyle(fs2Data.urgensi),
                      fontWeight: 600,
                      borderRadius: '6px',
                    }}
                  />
                </Box>
              )}
            </GlassCard>

            {/* Section 1: Deskripsi Pengubahan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(49, 162, 76, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AssignmentIcon sx={{ color: '#31A24C', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  1. Deskripsi Pengubahan
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Deskripsi Pengubahan</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {fs2Data.deskripsi_pengubahan || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Alasan Pengubahan</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {fs2Data.alasan_pengubahan || '-'}
                  </Typography>
                </InfoRow>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Status Tahapan Aplikasi</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                      {STATUS_TAHAPAN_LABELS[fs2Data.status_tahapan || ''] || fs2Data.status_tahapan || '-'}
                    </Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Urgensi</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                      {URGENSI_LABELS[fs2Data.urgensi || ''] || fs2Data.urgensi || '-'}
                    </Typography>
                  </InfoRow>
                </Box>
              </Box>
            </GlassCard>

            {/* Section 2: Kesesuaian Kriteria */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GavelIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  2. Kesesuaian Kriteria Pengubahan Aplikasi
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {renderCriteria(fs2Data.kriteria_1, '1. Tidak menambah fungsi baru')}
                {renderCriteria(fs2Data.kriteria_2, '2. Tidak menambah sumber data baru')}
                {renderCriteria(fs2Data.kriteria_3, '3. Tidak mengubah sumber data')}
                {renderCriteria(fs2Data.kriteria_4, '4. Tidak mengubah alur kerja')}
              </Box>
            </GlassCard>

            {/* Section 3: Aspek Perubahan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CompareArrowsIcon sx={{ color: '#059669', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  3. Aspek Perubahan
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.1 Terhadap Sistem yang Ada</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {fs2Data.aspek_sistem_ada || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.2 Terhadap Sistem Terkait</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {fs2Data.aspek_sistem_terkait || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.3 Terhadap Alur Kerja Bisnis</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {fs2Data.aspek_alur_kerja || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.4 Terhadap Struktur Organisasi</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {fs2Data.aspek_struktur_organisasi || '-'}
                  </Typography>
                </InfoRow>
              </Box>
            </GlassCard>

            {/* Section 4: Dokumentasi */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SettingsIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  4. Perubahan Dokumentasi
                </Typography>
              </SectionHeader>

              {/* T.01 */}
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.1)', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED', mb: 1.5 }}>
                  4.1 Dokumen T.0.1
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sebelum</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.dok_t01_sebelum || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sesudah</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.dok_t01_sesudah || '-'}</Typography>
                  </InfoRow>
                </Box>
              </Box>

              {/* T.11 */}
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.03)', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB', mb: 1.5 }}>
                  4.2 Dokumen T.1.1
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sebelum</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.dok_t11_sebelum || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sesudah</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.dok_t11_sesudah || '-'}</Typography>
                  </InfoRow>
                </Box>
              </Box>
            </GlassCard>

            {/* Section 5: Penggunaan Sistem */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WarningIcon sx={{ color: '#DC2626', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  5. Terhadap Penggunaan Sistem
                </Typography>
              </SectionHeader>

              {/* Jumlah Pengguna */}
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(220, 38, 38, 0.03)', border: '1px solid rgba(220, 38, 38, 0.1)', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626', mb: 1.5 }}>
                  5.1 Jumlah Pengguna
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sebelum</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.pengguna_sebelum || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sesudah</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.pengguna_sesudah || '-'}</Typography>
                  </InfoRow>
                </Box>
              </Box>

              {/* Jumlah Akses Bersamaan */}
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(217, 119, 6, 0.03)', border: '1px solid rgba(217, 119, 6, 0.1)', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706', mb: 1.5 }}>
                  5.2 Jumlah Akses Bersamaan
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sebelum</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.akses_bersamaan_sebelum || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sesudah</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.akses_bersamaan_sesudah || '-'}</Typography>
                  </InfoRow>
                </Box>
              </Box>

              {/* Pertumbuhan Data */}
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(8, 145, 178, 0.03)', border: '1px solid rgba(8, 145, 178, 0.1)' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0891B2', mb: 1.5 }}>
                  5.3 Pertumbuhan Data
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sebelum</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.pertumbuhan_data_sebelum || '-'}</Typography>
                  </InfoRow>
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Sesudah</Typography>
                    <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.pertumbuhan_data_sesudah || '-'}</Typography>
                  </InfoRow>
                </Box>
              </Box>
            </GlassCard>

            {/* Section 6: Jadwal Pelaksanaan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScheduleIcon sx={{ color: '#D97706', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  6. Jadwal Pelaksanaan
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.03)', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB', mb: 1.5 }}>
                    Target Pengujian
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                    {formatDate(fs2Data.target_pengujian)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED', mb: 1.5 }}>
                    Target Deployment
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                    {formatDate(fs2Data.target_deployment)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(5, 150, 105, 0.03)', border: '1px solid rgba(5, 150, 105, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669', mb: 1.5 }}>
                    Target Go Live
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                    {formatDate(fs2Data.target_go_live)}
                  </Typography>
                </Box>
              </Box>
            </GlassCard>

            {/* Section 7: Pernyataan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(8, 145, 178, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BusinessIcon sx={{ color: '#0891B2', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  7. Pernyataan
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {renderCriteria(fs2Data.pernyataan_1, '1. Bersedia menerima konsekuensi dari pengubahan')}
                {renderCriteria(fs2Data.pernyataan_2, '2. Satuan kerja terdampak telah menyetujui pengubahan')}
              </Box>
            </GlassCard>

            {/* Section 8: Dokumen F.S.2 */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(49, 162, 76, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AttachFileIcon sx={{ color: '#31A24C', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  8. Dokumen F.S.2
                </Typography>
              </SectionHeader>

              {isLoadingFiles ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} sx={{ color: '#31A24C' }} />
                </Box>
              ) : fs2Files.length > 0 ? (
                <List dense sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px', p: 1 }}>
                  {fs2Files.map((file, index) => (
                    <ListItem
                      key={file.id}
                      sx={{
                        borderRadius: '8px',
                        mb: index < fs2Files.length - 1 ? 1 : 0,
                        bgcolor: 'white',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <FileIcon sx={{ color: '#31A24C', fontSize: 24 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.original_name}
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
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {isPreviewable(file.content_type) && (
                            <IconButton
                              size="small"
                              onClick={() => handleViewFile(file)}
                              sx={{
                                color: '#31A24C',
                                '&:hover': { bgcolor: 'rgba(49, 162, 76, 0.1)' },
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file)}
                            disabled={downloadingFileId === file.id}
                            sx={{
                              color: '#31A24C',
                              '&:hover': { bgcolor: 'rgba(49, 162, 76, 0.1)' },
                            }}
                          >
                            {downloadingFileId === file.id ? (
                              <CircularProgress size={16} sx={{ color: '#31A24C' }} />
                            ) : (
                              <DownloadIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3, color: '#86868b' }}>
                  <AttachFileIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">Tidak ada dokumen yang diunggah</Typography>
                </Box>
              )}
            </GlassCard>

            {/* Section 9: Monitoring & Tracking (Only for approved FS2 and when showMonitoringSection is true) */}
            {showMonitoringSection && fs2Data.status === 'DISETUJUI' && (
              <GlassCard>
                <SectionHeader>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(49, 162, 76, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MonitorHeartIcon sx={{ color: '#31A24C', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                    9. Monitoring & Tracking
                  </Typography>
                </SectionHeader>

                {/* PIC & Progress Info */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(49, 162, 76, 0.03)', border: '1px solid rgba(49, 162, 76, 0.1)', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon sx={{ color: '#31A24C', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#31A24C' }}>PIC & Progres</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>PIC</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.pic_name || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Progres</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontWeight: 500 }}>
                        {PROGRES_LABELS[fs2Data.progres || ''] || fs2Data.progres || '-'}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Fase Pengajuan</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                        {FASE_LABELS[fs2Data.fase_pengajuan || ''] || fs2Data.fase_pengajuan || '-'}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>IKU</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                        {fs2Data.iku === 'Y' ? 'Ya' : fs2Data.iku === 'T' ? 'Tidak' : '-'}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Mekanisme</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                        {MEKANISME_LABELS[fs2Data.mekanisme || ''] || fs2Data.mekanisme || '-'}
                      </Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Pelaksanaan</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{getPelaksanaanDisplay()}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* Dokumen Pengajuan F.S.2 */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(49, 162, 76, 0.03)', border: '1px solid rgba(49, 162, 76, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#31A24C', mb: 1.5 }}>Dokumen Pengajuan F.S.2</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Nomor ND</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.nomor_nd || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Tanggal</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(fs2Data.tanggal_nd)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas ND</Typography>
                      {fs2Data.berkas_nd ? (
                        <Typography variant="body2" sx={{ color: '#31A24C', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_nd, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas F.S.2</Typography>
                      {fs2Data.berkas_fs2 ? (
                        <Typography variant="body2" sx={{ color: '#31A24C', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_fs2, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                  </Box>
                </Box>

                {/* CD Prinsip */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.03)', border: '1px solid rgba(37, 99, 235, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB', mb: 1.5 }}>CD Prinsip</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Nomor CD</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.nomor_cd || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Tanggal</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(fs2Data.tanggal_cd)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas CD</Typography>
                      {fs2Data.berkas_cd ? (
                        <Typography variant="body2" sx={{ color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_cd, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas F.S.2A</Typography>
                      {fs2Data.berkas_fs2a ? (
                        <Typography variant="body2" sx={{ color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_fs2a, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas F.S.2B</Typography>
                      {fs2Data.berkas_fs2b ? (
                        <Typography variant="body2" sx={{ color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_fs2b, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                  </Box>
                </Box>

                {/* Pengujian */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(217, 119, 6, 0.03)', border: '1px solid rgba(217, 119, 6, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706', mb: 1.5 }}>Pengujian</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Target</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(fs2Data.target_pengujian)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Realisasi</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(fs2Data.realisasi_pengujian)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas F45</Typography>
                      {fs2Data.berkas_f45 ? (
                        <Typography variant="body2" sx={{ color: '#D97706', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_f45, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas F46</Typography>
                      {fs2Data.berkas_f46 ? (
                        <Typography variant="body2" sx={{ color: '#D97706', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_f46, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                  </Box>
                </Box>

                {/* Deployment */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED', mb: 1.5 }}>Deployment</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Target</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(fs2Data.target_deployment)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Realisasi</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(fs2Data.realisasi_deployment)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Berkas ND/BA Deployment</Typography>
                      {fs2Data.berkas_nd_ba_deployment ? (
                        <Typography variant="body2" sx={{ color: '#7C3AED', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => window.open(fs2Data.berkas_nd_ba_deployment, '_blank')}>
                          Lihat Berkas
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                      )}
                    </InfoRow>
                  </Box>
                </Box>

                {/* Go Live */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(5, 150, 105, 0.03)', border: '1px solid rgba(5, 150, 105, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669', mb: 1.5 }}>Go Live</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Target</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(fs2Data.target_go_live)}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* Keterangan */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(107, 114, 128, 0.03)', border: '1px solid rgba(107, 114, 128, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#6B7280', mb: 1.5 }}>Keterangan</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {fs2Data.keterangan || '-'}
                  </Typography>
                </Box>
              </GlassCard>
            )}

            {/* Section: Riwayat Perubahan */}
            <Fs2ChangeLog fs2Id={fs2Id || ''} />
          </Box>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="body2" sx={{ color: '#86868b' }}>
              Data tidak ditemukan
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          p: 2.5,
          pt: 1.5,
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            bgcolor: '#31A24C',
            color: 'white',
            px: 4,
            borderRadius: '10px',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#059669',
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
        downloadUrl={`/api/fs2/files/download/${previewFile?.id}`}
      />
    </Dialog>
  );
};

export default ViewFs2Modal;
