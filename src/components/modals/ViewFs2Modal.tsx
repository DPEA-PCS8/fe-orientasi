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
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  MonitorHeart as MonitorHeartIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { getFs2DocumentById, type Fs2DocumentData } from '../../api/fs2Api';
import { getFs2Files, downloadFs2File, type Fs2FileData } from '../../api/fs2FileApi';
import FilePreviewModal from './FilePreviewModal';
import Fs2ChangeLog from '../Fs2ChangeLog';
import { FileVersionHistory } from '../FileVersionHistory';

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
  showDocumentSection?: boolean;
}

// Constants for labels (matching those in Fs2List and Fs2Disetujui)
// HIDDEN: Urgensi labels no longer needed
// const URGENSI_LABELS: Record<string, string> = {
//   RENDAH: 'Rendah',
//   SEDANG: 'Sedang',
//   TINGGI: 'Tinggi',
// };

const FASE_LABELS: Record<string, string> = {
  DESAIN: 'Desain',
  PEMELIHARAAN: 'Pemeliharaan',
};

const MEKANISME_LABELS: Record<string, string> = {
  INHOUSE: 'Inhouse',
  OUTSOURCE: 'Outsource',
};

const PELAKSANAAN_LABELS: Record<string, string> = {
  SINGLE_YEAR: 'Single Year',
  MULTIYEARS: 'Multiyears',
};

// FS2 Progress Options for View
const PROGRESS_OPTIONS_VIEW = [
  'Pengajuan',
  'Asesmen',
  'Pemrograman',
  'Pengujian',
  'Deployment',
  'Go Live',
] as const;

// FS2 Tahapan View Configuration (for Progres Tahapan table)
const FS2_TAHAPAN_VIEW_CONFIG: Array<{
  key: typeof PROGRESS_OPTIONS_VIEW[number];
  label: string;
  dateField: keyof Fs2DocumentData | null;
  statusField: keyof Fs2DocumentData | null;
  stageKey: string;
}> = [
  { key: 'Pengajuan', label: 'Pengajuan', dateField: 'tanggal_pengajuan_selesai', statusField: 'tahapan_status_pengajuan', stageKey: 'PENGAJUAN' },
  { key: 'Asesmen', label: 'Asesmen', dateField: 'tanggal_asesmen', statusField: 'tahapan_status_asesmen', stageKey: 'ASESMEN' },
  { key: 'Pemrograman', label: 'Pemrograman', dateField: 'tanggal_pemrograman', statusField: 'tahapan_status_pemrograman', stageKey: 'PEMROGRAMAN' },
  { key: 'Pengujian', label: 'Pengujian', dateField: 'tanggal_pengujian_selesai', statusField: 'tahapan_status_pengujian', stageKey: 'PENGUJIAN' },
  { key: 'Deployment', label: 'Deployment', dateField: 'tanggal_deployment_selesai', statusField: 'tahapan_status_deployment', stageKey: 'DEPLOYMENT' },
  { key: 'Go Live', label: 'Go Live', dateField: 'tanggal_go_live', statusField: 'tahapan_status_go_live', stageKey: 'GO_LIVE' },
];

// FS2 Timeline Configuration (3 stages)
const FS2_TIMELINE_CONFIGS = [
  { key: 'pengujian' as const, label: 'Target Pengujian', gradient: ['#0EA5E9', '#38BDF8'], rgb: '14,165,233' },
  { key: 'deployment' as const, label: 'Target Deployment', gradient: ['#31A24C', '#4ADE80'], rgb: '49,162,76' },
  { key: 'goLive' as const, label: 'Target Go Live', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
] as const;

const ViewFs2Modal: React.FC<ViewFs2ModalProps> = ({ open, onClose, fs2Id, showMonitoringSection = false, showDocumentSection = false }) => {
  const [fs2Data, setFs2Data] = useState<Fs2DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fs2Files, setFs2Files] = useState<Fs2FileData[]>([]);
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

      try {
        const files = await getFs2Files(fs2Id);
        setFs2Files(files);
      } catch (error) {
        console.error('Error fetching F.S.2 files:', error);
        setFs2Files([]);
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
      await downloadFs2File(file.id, file.original_name);
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

  // Helper to format month and year only (for Jadwal Pelaksanaan fields)
  const formatMonthYear = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
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

  // HIDDEN: Urgensi styling no longer needed
  // const getUrgensiStyle = (urgensi?: string) => {
  //   switch (urgensi?.toUpperCase()) {
  //     case 'TINGGI':
  //       return { bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' };
  //     case 'SEDANG':
  //       return { bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
  //     case 'RENDAH':
  //       return { bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' };
  //     default:
  //       return { bgcolor: 'rgba(156, 163, 175, 0.1)', color: '#6B7280' };
  //   }
  // };

  const statusStyle = getStatusStyle(fs2Data?.status);

  // Render file list section with versioning support
  const renderFileListSection = (
    files: Fs2FileData[],
    title: string,
    fileTypes: string[],
    iconColor: string,
    emptyMessage: string
  ) => {
    const filteredFiles = files.filter(f => fileTypes.includes(f.file_type || ''));
    // Get only the latest version of each file type
    const latestFiles = filteredFiles.filter(f => f.is_latest_version !== false);
    // Check if any file has more than one version
    const hasHistory = filteredFiles.some(f => (f.version || 1) > 1);
    
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: iconColor }}>{title}</Typography>
          {hasHistory && fs2Id && (
            <FileHistoryButtonInline 
              documentId={fs2Id} 
              fileType={fileTypes[0]} 
              documentType="fs2" 
            />
          )}
        </Box>
        {latestFiles.length > 0 ? (
          <List dense sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '10px', p: 0.5 }}>
            {latestFiles.map((file, index) => (
              <ListItem
                key={file.id}
                sx={{
                  borderRadius: '8px',
                  mb: index < latestFiles.length - 1 ? 0.5 : 0,
                  bgcolor: 'white',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  py: 0.75,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <FileIcon sx={{ color: iconColor, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{file.display_name || file.original_name}</span>
                      {file.version && file.version > 0 && (
                        <Chip 
                          label={`V${file.version}`} 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: '0.65rem', 
                            bgcolor: iconColor, 
                            color: 'white',
                            fontWeight: 600,
                          }} 
                        />
                      )}
                    </Box>
                  }
                  secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • Tgl. Dok: ${formatDate(file.tanggal_dokumen)}` : ''}`}
                  primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem' } }}
                  secondaryTypographyProps={{ sx: { color: '#86868b', fontSize: '0.7rem' } }}
                />
                <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                  {isPreviewable(file.content_type) && (
                    <IconButton
                      size="small"
                      onClick={() => handleViewFile(file)}
                      sx={{ color: '#0891B2', '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' } }}
                      title="Lihat"
                    >
                      <VisibilityIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingFileId === file.id}
                    sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' } }}
                    title="Download"
                  >
                    {downloadingFileId === file.id ? (
                      <CircularProgress size={16} sx={{ color: '#059669' }} />
                    ) : (
                      <DownloadIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ color: '#86868b', fontStyle: 'italic', fontSize: '0.85rem' }}>
            {emptyMessage}
          </Typography>
        )}
      </Box>
    );
  };

  // Inline FileHistoryButton component
  const FileHistoryButtonInline: React.FC<{
    documentId: string;
    fileType: string;
    documentType: 'pksi' | 'fs2';
  }> = ({ documentId, fileType, documentType }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    
    return (
      <>
        <IconButton
          size="small"
          onClick={() => setIsModalOpen(true)}
          sx={{ color: '#6b7280', '&:hover': { bgcolor: 'rgba(107, 114, 128, 0.1)' } }}
          title="Lihat Riwayat Versi"
        >
          <HistoryIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <FileVersionHistory
          documentId={documentId}
          fileType={fileType}
          documentType={documentType}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  };

  // Render text with clickable URLs
  const renderTextWithLinks = (text: string) => {
    if (!text) return '-';
    
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    
    return parts.map((part, index) => {
      // Check if part is a URL (starts with http or https)
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <Typography
            key={index}
            component="a"
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: '#2563EB',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
              wordBreak: 'break-all',
            }}
          >
            {part}
          </Typography>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

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
                    Nama FS2
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>
                    {fs2Data.nama_fs2 || '-'}
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
                {/* PKSI field - only show when status_tahapan is DESAIN */}
                {fs2Data.pksi_nama && (
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PKSI Terkait
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={fs2Data.pksi_nama}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(59, 130, 246, 0.15)',
                          color: '#3B82F6',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                        }}
                      />
                    </Box>
                  </InfoRow>
                )}
              </Box>

              {/* HIDDEN: Urgensi Badge as per requirement */}
              {/* {fs2Data.urgensi && (
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
              )} */}
            </GlassCard>

            {/* Section 1: Jadwal Pelaksanaan - Removed: targets now derived from Progres Tahapan */}

            {/* Section 2: Berkas F.S.2 (Only when showDocumentSection is true) */}
            {showDocumentSection && (
              <GlassCard>
                <SectionHeader>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                    2. Berkas F.S.2
          </Typography>
                </SectionHeader>

                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.03)', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                  {(() => {
                    const fs2DocumentFiles = fs2Files.filter(f => !f.file_type || f.file_type === 'FS2');
                    return fs2DocumentFiles.length > 0 ? (
                      <List dense sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '10px', p: 0.5 }}>
                        {fs2DocumentFiles.map((file, index) => (
                          <ListItem
                            key={file.id}
                            sx={{
                              borderRadius: '8px',
                              mb: index < fs2DocumentFiles.length - 1 ? 0.5 : 0,
                              bgcolor: 'white',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                              py: 0.75,
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <FileIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={file.original_name}
                              secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • Tgl. Dok: ${formatDate(file.tanggal_dokumen)}` : ''}`}
                              primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem' } }}
                              secondaryTypographyProps={{ sx: { color: '#86868b', fontSize: '0.7rem' } }}
                            />
                            <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                              {isPreviewable(file.content_type) && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewFile(file)}
                                  sx={{ color: '#0891B2', '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' } }}
                                  title="Lihat"
                                >
                                  <VisibilityIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(file)}
                                disabled={downloadingFileId === file.id}
                                sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' } }}
                                title="Download"
                              >
                                {downloadingFileId === file.id ? (
                                  <CircularProgress size={16} sx={{ color: '#059669' }} />
                                ) : (
                                  <DownloadIcon sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        Belum ada dokumen F.S.2 yang diunggah
                      </Typography>
                    );
                  })()}
                </Box>
              </GlassCard>
            )}

            {/* Section 2/3: Monitoring & Tracking (Only for approved FS2 and when showMonitoringSection is true) */}
            {showMonitoringSection && fs2Data.status === 'DISETUJUI' && (
              <>
                {/* Timeline Visual */}
                <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(14, 165, 233, 0.03)', border: '1px solid rgba(14, 165, 233, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0EA5E9', mb: 2.5 }}>
                    Timeline
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                    {FS2_TIMELINE_CONFIGS.map((timeline, index) => {
                      let targetDate = '-';
                      
                      if (timeline.key === 'pengujian') {
                        targetDate = formatMonthYear(fs2Data.target_pengujian);
                      } else if (timeline.key === 'deployment') {
                        targetDate = formatMonthYear(fs2Data.target_deployment);
                      } else if (timeline.key === 'goLive') {
                        targetDate = formatMonthYear(fs2Data.target_go_live);
                      }
                      
                      return (
                        <Box
                          key={timeline.key}
                          sx={{
                            flex: 1,
                            p: 2,
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, rgba(${timeline.rgb}, 0.08), rgba(${timeline.rgb}, 0.03))`,
                            border: `1px solid rgba(${timeline.rgb}, 0.2)`,
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px rgba(${timeline.rgb}, 0.15)`,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${timeline.gradient[0]}, ${timeline.gradient[1]})`,
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: timeline.gradient[0] }}>
                              {timeline.label}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>
                              Target: {targetDate}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
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
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1, width: '25%' }}>Tahapan</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1, width: '20%' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1, width: '20%' }}>Tgl. Target</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1, width: '20%' }}>Tanggal Penyelesaian</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#D97706', py: 1.1 }}>Ketepatan Waktu</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          // Show ALL tahapan (no filtering by presentStages)
                          return FS2_TAHAPAN_VIEW_CONFIG.map((tahapan) => {
                            const savedStatus = tahapan.statusField
                              ? (fs2Data[tahapan.statusField] as string | undefined)
                              : undefined;
                            let status: string;
                            if (savedStatus) {
                              const s = (savedStatus || '').toString().trim().toLowerCase();
                              if (s.includes('selesai')) status = 'Selesai';
                              else if (s.includes('dalam') || s.includes('proses') || s.includes('dalam_proses')) status = 'Dalam proses';
                              else if (s.includes('belum')) status = 'Belum dimulai';
                              else if (s.includes('ditunda')) status = 'Ditunda';
                              else if (s.includes('dibatalkan')) status = 'Dibatalkan';
                              else status = (savedStatus as string).toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            } else {
                              // Fallback logic based on progres
                              const progressIdx = fs2Data.progres ? PROGRESS_OPTIONS_VIEW.indexOf(fs2Data.progres as any) : -1;
                              const tahapanIdx = PROGRESS_OPTIONS_VIEW.indexOf(tahapan.key);
                              const isDoneFallback = tahapanIdx < progressIdx;
                              const isActiveFallback = tahapanIdx === progressIdx;
                              status = isDoneFallback ? 'Selesai' : isActiveFallback ? 'Dalam proses' : 'Belum dimulai';
                            }
                            const isSelesai = status === 'Selesai';
                            const isDalam = status === 'Dalam proses';
                            const chipColor = isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280';
                            const chipBg = isSelesai ? '#F0FDF4' : isDalam ? '#FFFBEB' : '#F3F4F6';

                            // Target date logic based on tahapan type
                            // Pengajuan & Asesmen: empty
                            // Pemrograman: from target_pemrograman
                            // Pengujian, Deployment, Go Live: from Jadwal Pelaksanaan
                            let targetDate: string | null = null;
                            if (tahapan.stageKey === 'PENGAJUAN' || tahapan.stageKey === 'ASESMEN') {
                              targetDate = null; // Always empty for Pengajuan and Asesmen
                            } else if (tahapan.stageKey === 'PEMROGRAMAN') {
                              targetDate = fs2Data.target_pemrograman || null;
                            } else if (tahapan.stageKey === 'PENGUJIAN') {
                              targetDate = fs2Data.target_pengujian || null;
                            } else if (tahapan.stageKey === 'DEPLOYMENT') {
                              targetDate = fs2Data.target_deployment || null;
                            } else if (tahapan.stageKey === 'GO_LIVE') {
                              targetDate = fs2Data.target_go_live || null;
                            }
                            const displayTarget = targetDate ? formatMonthYear(targetDate) : '—';

                            const rawDate = (isSelesai && tahapan.dateField)
                              ? (fs2Data[tahapan.dateField] as string | undefined)
                              : undefined;
                            const displayDate = rawDate ? formatMonthYear(rawDate) : null;

                            let ketepatanLabel: string | null = null;
                            let ketepatanColor = '#6B7280';
                            let ketepatanBg = '#F3F4F6';
                            if (isSelesai && displayDate && targetDate) {
                              const completion = new Date(rawDate || '');
                              const target = new Date(targetDate);
                              if (completion <= target) {
                                ketepatanLabel = 'Tepat Waktu';
                                ketepatanColor = '#15803D';
                                ketepatanBg = '#F0FDF4';
                              } else {
                                ketepatanLabel = 'Terlambat';
                                ketepatanColor = '#DC2626';
                                ketepatanBg = '#FEF2F2';
                              }
                            } else if (isDalam && targetDate) {
                              const today = new Date();
                              const target = new Date(targetDate);
                              if (today <= target) {
                                ketepatanLabel = 'Dalam Waktu';
                                ketepatanColor = '#2563EB';
                                ketepatanBg = '#EFF6FF';
                              } else {
                                ketepatanLabel = 'Melewati Target';
                                ketepatanColor = '#D97706';
                                ketepatanBg = '#FFFBEB';
                              }
                            }

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
                                <TableCell sx={{ fontSize: '0.8rem', py: 0.9, color: targetDate ? '#7C3AED' : '#86868b' }}>
                                  {displayTarget}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', py: 0.9, color: displayDate ? '#15803D' : '#86868b' }}>
                                  {displayDate || '—'}
                                </TableCell>
                                <TableCell sx={{ py: 0.9 }}>
                                  {ketepatanLabel ? (
                                    <Chip label={ketepatanLabel} size="small" sx={{ bgcolor: ketepatanBg, color: ketepatanColor, fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                                  ) : (
                                    <Typography sx={{ fontSize: '0.78rem', color: '#86868b' }}>—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <GlassCard>
                  <SectionHeader>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(49, 162, 76, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MonitorHeartIcon sx={{ color: '#31A24C', fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                      Monitoring & Tracking
                    </Typography>
                  </SectionHeader>

                {/* PIC & Team Info */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(49, 162, 76, 0.03)', border: '1px solid rgba(49, 162, 76, 0.1)', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PersonIcon sx={{ color: '#31A24C', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#31A24C' }}>PIC & Tim</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>PIC</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.pic_name || '-'}</Typography>
                    </InfoRow>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Anggota Tim</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {fs2Data.anggota_tim_names || '-'}
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Nomor ND</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.nomor_nd || '-'}</Typography>
                    </InfoRow>
                  </Box>
                  {renderFileListSection(fs2Files, 'Berkas ND', ['ND'], '#31A24C', 'Belum ada file')}
                  {renderFileListSection(fs2Files, 'Berkas F.S.2', ['FS2'], '#31A24C', 'Belum ada file')}
                </Box>

                {/* CD Prinsip Persetujuan FS2 */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(37, 99, 235, 0.03)', border: '1px solid rgba(37, 99, 235, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2563EB', mb: 1.5 }}>CD Prinsip Persetujuan FS2</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <InfoRow>
                      <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Nomor CD Prinsip Persetujuan FS2</Typography>
                      <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.nomor_cd || '-'}</Typography>
                    </InfoRow>
                  </Box>
                  {renderFileListSection(fs2Files, 'Berkas CD Prinsip Persetujuan FS2', ['CD'], '#2563EB', 'Belum ada file')}
                  {renderFileListSection(fs2Files, 'Berkas F.S.2A', ['FS2A'], '#2563EB', 'Belum ada file')}
                  {renderFileListSection(fs2Files, 'Berkas F.S.2B', ['FS2B'], '#2563EB', 'Belum ada file')}
                </Box>

                {/* Pengujian */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(217, 119, 6, 0.03)', border: '1px solid rgba(217, 119, 6, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706', mb: 1.5 }}>Pengujian</Typography>
                  {renderFileListSection(fs2Files, 'Berkas F45', ['F45'], '#D97706', 'Belum ada file')}
                  {renderFileListSection(fs2Files, 'Berkas F46', ['F46'], '#D97706', 'Belum ada file')}
                </Box>

                {/* Deployment */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.1)', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#7C3AED', mb: 1.5 }}>Deployment</Typography>
                  {renderFileListSection(fs2Files, 'Berkas ND/BA Deployment', ['NDBA'], '#7C3AED', 'Belum ada file')}
                </Box>

                {/* Keterangan */}
                <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(107, 114, 128, 0.03)', border: '1px solid rgba(107, 114, 128, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#6B7280', mb: 1.5 }}>Keterangan</Typography>
                  <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'pre-wrap' }}>
                    {renderTextWithLinks(fs2Data.keterangan || '')}
                  </Typography>
                </Box>
              </GlassCard>
              </>
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
