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
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  AccountTree as AccountTreeIcon,
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

            {/* Section 1: Pendahuluan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(218, 37, 28, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AssignmentIcon sx={{ color: '#DA251C', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  1. Pendahuluan
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>1.1 Deskripsi PKSI</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.deskripsi_pksi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>1.2 Mengapa PKSI Diperlukan</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.mengapa_pksi_diperlukan || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>1.3 Kapan Harus Diselesaikan</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                    {pksiData.kapan_harus_diselesaikan || '-'}
                  </Typography>
                </InfoRow>
              </Box>
            </GlassCard>

            {/* Section 2: Tujuan dan Kegunaan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FlagIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  2. Tujuan dan Kegunaan PKSI
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>2.1 Kegunaan PKSI</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.kegunaan_pksi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>2.2 Tujuan PKSI</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.tujuan_pksi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>2.3 Target PKSI</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.target_pksi || '-'}
                  </Typography>
                </InfoRow>
              </Box>
            </GlassCard>

            {/* Section 3: Cakupan PKSI */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AccountTreeIcon sx={{ color: '#059669', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  3. Cakupan PKSI
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.1 Ruang Lingkup</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.ruang_lingkup || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.2 Batasan PKSI</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.batasan_pksi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.3 Hubungan dengan Sistem Lain</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.hubungan_sistem_lain || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>3.4 Asumsi</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.asumsi || '-'}
                  </Typography>
                </InfoRow>
              </Box>
            </GlassCard>

            {/* Section 4: Risiko dan Batasan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WarningIcon sx={{ color: '#DC2626', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  4. Risiko dan Batasan PKSI
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>4.1 Batasan Desain</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.batasan_desain || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>4.2 Risiko Bisnis</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.risiko_bisnis || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>4.3 Risiko Sukses PKSI</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.risiko_sukses_pksi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>4.4 Pengendalian Risiko</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.pengendalian_risiko || '-'}
                  </Typography>
                </InfoRow>
              </Box>
            </GlassCard>

            {/* Section 5: Gambaran Umum Aplikasi */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SettingsIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  5. Gambaran Umum Aplikasi
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>5.1 Pengelola Aplikasi</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                    {pksiData.pengelola_aplikasi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>5.2 Pengguna Aplikasi</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f' }}>
                    {pksiData.pengguna_aplikasi || '-'}
                  </Typography>
                </InfoRow>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>5.3 Fungsi Aplikasi</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.fungsi_aplikasi || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>5.4 Informasi yang Dikelola</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.informasi_yang_dikelola || '-'}
                  </Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>5.5 Dasar Peraturan</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {pksiData.dasar_peraturan || '-'}
                  </Typography>
                </InfoRow>
              </Box>
            </GlassCard>

            {/* Section 6: Jadwal Pelaksanaan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScheduleIcon sx={{ color: '#D97706', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  6. Usulan Jadwal Pelaksanaan
                </Typography>
              </SectionHeader>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Tahap 1 */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(218, 37, 28, 0.03)', border: '1px solid rgba(218, 37, 28, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#DA251C', mb: 1.5 }}>
                    Penyusunan Spesifikasi Kebutuhan Aplikasi
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Awal</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(pksiData.tahap1_awal)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Akhir</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(pksiData.tahap1_akhir)}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* Tahap 5 */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.03)', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB', mb: 1.5 }}>
                    Pengujian Aplikasi – User Acceptance Test (UAT)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Awal</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(pksiData.tahap5_awal)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Akhir</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(pksiData.tahap5_akhir)}</Typography>
                    </InfoRow>
                  </Box>
                </Box>

                {/* Tahap 7 */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(5, 150, 105, 0.03)', border: '1px solid rgba(5, 150, 105, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669', mb: 1.5 }}>
                    Penggunaan Aplikasi (Go-Live)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Awal</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(pksiData.tahap7_awal)}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Akhir</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{formatDate(pksiData.tahap7_akhir)}</Typography>
                    </InfoRow>
                  </Box>
                </Box>
              </Box>
            </GlassCard>

            {/* Section 7: Rencana Pengelolaan */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(8, 145, 178, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BusinessIcon sx={{ color: '#0891B2', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                  7. Rencana Pengelolaan
                </Typography>
              </SectionHeader>

              <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                {pksiData.rencana_pengelolaan || '-'}
              </Typography>
            </GlassCard>

            {/* Section 8: Monitoring & Tracking (Only for DISETUJUI status and when showMonitoringSection is true) */}
            {showMonitoringSection && pksiData.status === 'DISETUJUI' && (
              <GlassCard>
                <SectionHeader>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(49, 162, 76, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MonitorHeartIcon sx={{ color: '#31A24C', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                    8. Monitoring & Tracking
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
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Progres</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontWeight: 500 }}>{pksiData.progress || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Inisiatif RBSI</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.inisiatif_rbsi || pksiData.program_inisiatif_rbsi || '-'}</Typography>
                    </InfoRow>
                  </Box>
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

                {/* Timeline */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.1)', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TimelineIcon sx={{ color: '#7C3AED', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED' }}>Timeline</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Target Usreq</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.target_usreq || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Target SIT</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.target_sit || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Target UAT/PDKK</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.target_uat || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Target Go Live</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{pksiData.target_go_live || '-'}</Typography>
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
