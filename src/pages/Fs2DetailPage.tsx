import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
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
  IconButton,
  Button,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  MonitorHeart as MonitorHeartIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getFs2DocumentById, type Fs2DocumentData } from '../api/fs2Api';
import { getFs2Files, downloadFs2File, type Fs2FileData } from '../api/fs2FileApi';
import FilePreviewModal from '../components/modals/FilePreviewModal';
import EditFs2MonitoringModal from '../components/modals/EditFs2MonitoringModal';
import Fs2ChangeLog from '../components/Fs2ChangeLog';
import { FileVersionHistory } from '../components/FileVersionHistory';
import PageHeader from '../components/PageHeader';
import { COLORS } from '../styles/theme';

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

const SectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(49, 162, 76, 0.1)',
});

const InfoRow = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '12px',
  '&:last-child': { marginBottom: 0 },
});

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

const PROGRESS_OPTIONS_VIEW = [
  'Asesmen',
  'Pemrograman',
  'Pengujian',
  'Deployment',
  'Go Live',
] as const;

const FS2_TAHAPAN_VIEW_CONFIG: Array<{
  key: typeof PROGRESS_OPTIONS_VIEW[number];
  label: string;
  dateField: keyof Fs2DocumentData | null;
  statusField: keyof Fs2DocumentData | null;
  stageKey: string;
}> = [
  { key: 'Asesmen', label: 'Asesmen', dateField: 'tanggal_asesmen', statusField: 'tahapan_status_asesmen', stageKey: 'ASESMEN' },
  { key: 'Pemrograman', label: 'Pemrograman', dateField: 'tanggal_pemrograman', statusField: 'tahapan_status_pemrograman', stageKey: 'PEMROGRAMAN' },
  { key: 'Pengujian', label: 'Pengujian', dateField: 'tanggal_pengujian_selesai', statusField: 'tahapan_status_pengujian', stageKey: 'PENGUJIAN' },
  { key: 'Deployment', label: 'Deployment', dateField: 'tanggal_deployment_selesai', statusField: 'tahapan_status_deployment', stageKey: 'DEPLOYMENT' },
  { key: 'Go Live', label: 'Go Live', dateField: 'tanggal_go_live', statusField: 'tahapan_status_go_live', stageKey: 'GO_LIVE' },
];

const FS2_TIMELINE_CONFIGS = [
  { key: 'pengujian' as const, label: 'Target Pengujian', gradient: ['#0EA5E9', '#38BDF8'], rgb: '14,165,233' },
  { key: 'deployment' as const, label: 'Target Deployment', gradient: ['#31A24C', '#4ADE80'], rgb: '49,162,76' },
  { key: 'goLive' as const, label: 'Target Go Live', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
] as const;

export default function Fs2DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fs2Data, setFs2Data] = useState<Fs2DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fs2Files, setFs2Files] = useState<Fs2FileData[]>([]);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<Fs2FileData | null>(null);
  const [openEditModal, setOpenEditModal] = useState(false);

  const fetchFs2Details = () => {
    if (!id) return;
    setIsLoading(true);
    getFs2DocumentById(id)
      .then(setFs2Data)
      .catch(err => console.error('Error fetching F.S.2:', err))
      .finally(() => setIsLoading(false));
    getFs2Files(id)
      .then(setFs2Files)
      .catch(() => setFs2Files([]));
  };

  useEffect(() => {
    fetchFs2Details();
  }, [id]);

  const handleDownload = async (file: Fs2FileData) => {
    setDownloadingFileId(file.id);
    try {
      await downloadFs2File(file.id, file.original_name);
    } catch (err) {
      console.error('Error downloading file:', err);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleViewFile = (file: Fs2FileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const isPreviewable = (contentType: string) =>
    contentType === 'application/pdf' || contentType.startsWith('image/');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatMonthYear = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const getEndOfMonthDate = (dateString?: string | null): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length < 2) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (isNaN(year) || isNaN(month)) return null;
    return new Date(year, month, 0);
  };

  const parseYMDToLocalDate = (dateString?: string | null): Date | null => {
    if (!dateString) return null;
    const m = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
    return new Date(y, mo - 1, d);
  };

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'disetujui': case 'approved':
        return { bgcolor: 'rgba(49, 162, 76, 0.1)', color: '#31A24C', label: 'Disetujui' };
      case 'ditolak': case 'rejected': case 'tidak_disetujui':
        return { bgcolor: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', label: 'Tidak Disetujui' };
      case 'pending':
        return { bgcolor: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', label: 'Pending' };
      default:
        return { bgcolor: 'rgba(134, 134, 139, 0.1)', color: '#86868b', label: status || 'Draft' };
    }
  };

  const getPelaksanaanDisplay = () => {
    if (!fs2Data) return '-';
    if (fs2Data.pelaksanaan === 'SINGLE_YEAR')
      return `Single Year${fs2Data.tahun ? ` (${fs2Data.tahun})` : ''}`;
    if (fs2Data.pelaksanaan === 'MULTIYEARS')
      return `Multiyears${fs2Data.tahun_mulai && fs2Data.tahun_selesai ? ` (${fs2Data.tahun_mulai} - ${fs2Data.tahun_selesai})` : ''}`;
    return PELAKSANAAN_LABELS[fs2Data.pelaksanaan || ''] || fs2Data.pelaksanaan || '-';
  };

  // Inline FileHistoryButton
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

  const renderFileListSection = (
    files: Fs2FileData[],
    title: string,
    fileTypes: string[],
    iconColor: string,
    emptyMessage: string
  ) => {
    const filteredFiles = files.filter(f => fileTypes.includes(f.file_type || ''));
    const latestFiles = filteredFiles.filter(f => f.is_latest_version !== false);
    const hasHistory = filteredFiles.some(f => (f.version || 1) > 1);

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: iconColor }}>{title}</Typography>
          {hasHistory && id && (
            <FileHistoryButtonInline documentId={id} fileType={fileTypes[0]} documentType="fs2" />
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
                          sx={{ height: 18, fontSize: '0.65rem', bgcolor: iconColor, color: 'white', fontWeight: 600 }}
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

  const renderTextWithLinks = (text: string) => {
    if (!text) return '-';
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    return parts.map((part, index) => {
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <Typography
            key={index}
            component="a"
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#2563EB', textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, wordBreak: 'break-all' }}
          >
            {part}
          </Typography>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const statusStyle = getStatusStyle(fs2Data?.status);

  return (
    <Box sx={{ minHeight: '100vh', background: COLORS.BACKGROUND }}>
      <PageHeader
        eyebrow="DETAIL F.S.2"
        title={fs2Data?.nama_aplikasi || fs2Data?.nama_fs2 || 'Detail F.S.2'}
        subtitle={fs2Data?.nama_fs2 || ''}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {fs2Data?.status === 'DISETUJUI' && (
              <Button
                variant="contained"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setOpenEditModal(true)}
                sx={{ bgcolor: COLORS.PRIMARY, '&:hover': { bgcolor: '#b71c1c' }, boxShadow: 'none' }}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{ borderColor: COLORS.BORDER, color: COLORS.TEXT_PRIMARY, '&:hover': { borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY } }}
            >
              Kembali
            </Button>
          </Box>
        }
      />

      <Box sx={{ px: { xs: 3, md: 4.5, xl: 6 }, py: 4, mx: 'auto' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress sx={{ color: '#31A24C' }} />
          </Box>
        ) : fs2Data ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header Info Card */}
            <GlassCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', mb: 1 }}>
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
                  sx={{ bgcolor: statusStyle.bgcolor, color: statusStyle.color, fontWeight: 600, fontSize: '0.85rem', px: 1, borderRadius: '8px' }}
                />
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(0, 0, 0, 0.06)' }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Aplikasi</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>{fs2Data.nama_aplikasi || '-'}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama FS2</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>{fs2Data.nama_fs2 || '-'}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pengaju</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>{fs2Data.user_name || '-'}</Typography>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKPA</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                    {fs2Data.kode_skpa || fs2Data.nama_skpa ? (
                      <Chip
                        label={`${fs2Data.kode_skpa || ''} ${fs2Data.nama_skpa ? `- ${fs2Data.nama_skpa}` : ''}`}
                        size="small"
                        sx={{ bgcolor: '#31A24C', color: 'white', fontWeight: 500, fontSize: '0.75rem', borderRadius: '6px' }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b' }}>-</Typography>
                    )}
                  </Box>
                </InfoRow>
                <InfoRow>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bidang</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#1d1d1f' }}>{fs2Data.nama_bidang || '-'}</Typography>
                </InfoRow>
                {fs2Data.pksi_nama && (
                  <InfoRow>
                    <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>PKSI Terkait</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={fs2Data.pksi_nama}
                        size="small"
                        sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: 500, fontSize: '0.75rem', borderRadius: '6px' }}
                      />
                    </Box>
                  </InfoRow>
                )}
              </Box>
            </GlassCard>

            {/* Berkas F.S.2 */}
            <GlassCard>
              <SectionHeader>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>Berkas F.S.2</Typography>
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

            {/* Monitoring & Tracking (only for DISETUJUI) */}
            {fs2Data.status === 'DISETUJUI' && (
              <>
                {/* Timeline Visual */}
                <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'rgba(14, 165, 233, 0.03)', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0EA5E9', mb: 2.5 }}>Timeline</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {FS2_TIMELINE_CONFIGS.map((timeline, index) => {
                      let targetDate = '-';
                      if (timeline.key === 'pengujian') targetDate = formatMonthYear(fs2Data.target_pengujian);
                      else if (timeline.key === 'deployment') targetDate = formatMonthYear(fs2Data.target_deployment);
                      else if (timeline.key === 'goLive') targetDate = formatMonthYear(fs2Data.target_go_live);

                      return (
                        <Box
                          key={timeline.key}
                          sx={{
                            flex: 1, p: 2, borderRadius: '12px',
                            background: `linear-gradient(135deg, rgba(${timeline.rgb}, 0.08), rgba(${timeline.rgb}, 0.03))`,
                            border: `1px solid rgba(${timeline.rgb}, 0.2)`,
                            transition: 'all 0.3s ease',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 20px rgba(${timeline.rgb}, 0.15)` },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Box sx={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: `linear-gradient(135deg, ${timeline.gradient[0]}, ${timeline.gradient[1]})`,
                              color: 'white', fontSize: '0.75rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {index + 1}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: timeline.gradient[0] }}>
                              {timeline.label}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>
                            Target: {targetDate}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Progres Tahapan Table */}
                <Box>
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
                        {FS2_TAHAPAN_VIEW_CONFIG.map((tahapan) => {
                          const savedStatus = tahapan.statusField ? (fs2Data[tahapan.statusField] as string | undefined) : undefined;
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
                            const normalizeProgressLabel = (p?: string) => {
                              if (!p) return '';
                              const s = p.toString();
                              const labelIndex = PROGRESS_OPTIONS_VIEW.findIndex(x => x.toLowerCase() === s.toLowerCase());
                              if (labelIndex !== -1) return PROGRESS_OPTIONS_VIEW[labelIndex];
                              const codeToLabel: Record<string, string> = {
                                'PENGAJUAN': 'Asesmen', 'ASESMEN': 'Asesmen', 'PEMROGRAMAN': 'Pemrograman',
                                'PENGUJIAN': 'Pengujian', 'DEPLOYMENT': 'Deployment', 'GO_LIVE': 'Go Live',
                              };
                              return codeToLabel[s.toUpperCase()] || s;
                            };
                            const normalizedProgress = normalizeProgressLabel(fs2Data.progres as any);
                            const progressIdx = normalizedProgress
                              ? PROGRESS_OPTIONS_VIEW.findIndex(x => x.toLowerCase() === normalizedProgress.toLowerCase())
                              : -1;
                            const tahapanIdx = PROGRESS_OPTIONS_VIEW.findIndex(x => x === tahapan.key);
                            status = tahapanIdx < progressIdx ? 'Selesai' : tahapanIdx === progressIdx ? 'Dalam proses' : 'Belum dimulai';
                          }

                          const isSelesai = status === 'Selesai';
                          const isDalam = status === 'Dalam proses';
                          const chipColor = isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280';
                          const chipBg = isSelesai ? '#F0FDF4' : isDalam ? '#FFFBEB' : '#F3F4F6';

                          let targetDate: string | null = null;
                          if (tahapan.stageKey === 'PEMROGRAMAN') targetDate = fs2Data.target_pemrograman || null;
                          else if (tahapan.stageKey === 'PENGUJIAN') targetDate = fs2Data.target_pengujian || null;
                          else if (tahapan.stageKey === 'DEPLOYMENT') targetDate = fs2Data.target_deployment || null;
                          else if (tahapan.stageKey === 'GO_LIVE') targetDate = fs2Data.target_go_live || null;

                          const displayTarget = targetDate ? formatMonthYear(targetDate) : '—';
                          const rawDate = (isSelesai && tahapan.dateField) ? (fs2Data[tahapan.dateField] as string | undefined) : undefined;
                          const displayDate = rawDate ? formatMonthYear(rawDate) : null;

                          let ketepatanLabel: string | null = null;
                          let ketepatanColor = '#6B7280';
                          let ketepatanBg = '#F3F4F6';
                          if (isSelesai && displayDate && targetDate) {
                            const completionDate = parseYMDToLocalDate(rawDate);
                            const targetDeadline = getEndOfMonthDate(targetDate);
                            if (completionDate && targetDeadline) {
                              completionDate.setHours(0, 0, 0, 0);
                              const deadlineEnd = new Date(targetDeadline);
                              deadlineEnd.setHours(23, 59, 59, 999);
                              if (completionDate.getTime() <= deadlineEnd.getTime()) {
                                ketepatanLabel = 'Tepat Waktu'; ketepatanColor = '#15803D'; ketepatanBg = '#F0FDF4';
                              } else {
                                ketepatanLabel = 'Terlambat'; ketepatanColor = '#DC2626'; ketepatanBg = '#FEF2F2';
                              }
                            }
                          } else if (isDalam && targetDate) {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const targetDeadline = getEndOfMonthDate(targetDate);
                            if (targetDeadline) {
                              const deadlineEnd = new Date(targetDeadline);
                              deadlineEnd.setHours(23, 59, 59, 999);
                              if (today.getTime() <= deadlineEnd.getTime()) {
                                ketepatanLabel = 'Dalam Waktu'; ketepatanColor = '#2563EB'; ketepatanBg = '#EFF6FF';
                              } else {
                                ketepatanLabel = 'Melewati Target'; ketepatanColor = '#D97706'; ketepatanBg = '#FFFBEB';
                              }
                            }
                          }

                          return (
                            <TableRow key={tahapan.key} sx={{ '&:last-child td': { borderBottom: 0 }, bgcolor: isDalam ? 'rgba(217,119,6,0.03)' : 'transparent' }}>
                              <TableCell sx={{ fontSize: '0.8rem', py: 0.9, fontWeight: isDalam ? 600 : 400, color: isDalam ? '#92400E' : '#1d1d1f' }}>
                                {tahapan.label}
                              </TableCell>
                              <TableCell sx={{ py: 0.9 }}>
                                <Chip label={status} size="small" sx={{ bgcolor: chipBg, color: chipColor, fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', py: 0.9, color: targetDate ? '#7C3AED' : '#86868b' }}>{displayTarget}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', py: 0.9, color: displayDate ? '#15803D' : '#86868b' }}>{displayDate || '—'}</TableCell>
                              <TableCell sx={{ py: 0.9 }}>
                                {ketepatanLabel ? (
                                  <Chip label={ketepatanLabel} size="small" sx={{ bgcolor: ketepatanBg, color: ketepatanColor, fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                                ) : (
                                  <Typography sx={{ fontSize: '0.78rem', color: '#86868b' }}>—</Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Monitoring & Tracking card */}
                <GlassCard>
                  <SectionHeader>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(49, 162, 76, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MonitorHeartIcon sx={{ color: '#31A24C', fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>Monitoring & Tracking</Typography>
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
                        <Typography variant="body2" sx={{ color: '#1d1d1f', whiteSpace: 'normal', wordBreak: 'break-word' }}>{fs2Data.anggota_tim_names || '-'}</Typography>
                      </InfoRow>
                      <InfoRow>
                        <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Fase Pengajuan</Typography>
                        <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{FASE_LABELS[fs2Data.fase_pengajuan || ''] || fs2Data.fase_pengajuan || '-'}</Typography>
                      </InfoRow>
                      <InfoRow>
                        <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>IKU</Typography>
                        <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{fs2Data.iku === 'Y' ? 'Ya' : fs2Data.iku === 'T' ? 'Tidak' : '-'}</Typography>
                      </InfoRow>
                      <InfoRow>
                        <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 500 }}>Mekanisme</Typography>
                        <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{MEKANISME_LABELS[fs2Data.mekanisme || ''] || fs2Data.mekanisme || '-'}</Typography>
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

            {/* Riwayat Perubahan */}
            <Fs2ChangeLog fs2Id={id || ''} />
          </Box>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="body2" sx={{ color: '#86868b' }}>Data tidak ditemukan</Typography>
          </Box>
        )}
      </Box>

      <FilePreviewModal
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
        fileId={previewFile?.id || null}
        fileName={previewFile?.original_name || ''}
        contentType={previewFile?.content_type || ''}
        onDownload={async () => { if (previewFile) await handleDownload(previewFile); }}
        downloadUrl={`/api/fs2/files/download/${previewFile?.id}`}
      />

      {fs2Data && (
        <EditFs2MonitoringModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          fs2Id={id || ''}
          fs2Data={fs2Data}
          onSuccess={fetchFs2Details}
        />
      )}
    </Box>
  );
}
