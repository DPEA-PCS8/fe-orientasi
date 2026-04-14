import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box,
  Typography, Autocomplete, CircularProgress, Stack, Accordion, AccordionSummary,
  AccordionDetails, IconButton, Chip, styled, Popover, MenuItem, List, ListItem,
  ListItemIcon, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, Close as CloseIcon, CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon, InsertDriveFile as FileIcon, Download as DownloadIcon,
  Visibility as VisibilityIcon, Add as AddIcon,
} from '@mui/icons-material';
import { getAllSkpa, type SkpaData } from '../../api/skpaApi';
import { getAllAplikasi, type AplikasiData } from '../../api/aplikasiApi';
import { getPksiDocumentById, updatePksiDocument, type PksiDocumentRequest } from '../../api/pksiApi';
import { getUserInfo } from '../../api/authApi';
import { getAllRbsi, getRbsiById, type RbsiResponse, type RbsiProgramResponse, type RbsiInisiatifResponse } from '../../api/rbsiApi';
import { uploadPksiFiles, getPksiFiles, deletePksiFile, downloadPksiFile, type PksiFileData } from '../../api/pksiFileApi';
import FilePreviewModal from './FilePreviewModal';

const GlassTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)', transition: 'all 0.2s ease-in-out' },
    '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
    '&.Mui-focused fieldset': { borderColor: '#DA251C', borderWidth: '1.5px' },
    '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 4px 20px rgba(218, 37, 28, 0.1)' },
  },
  '& .MuiInputLabel-root': { color: '#86868b', fontWeight: 500, '&.Mui-focused': { color: '#DA251C' } },
  '& .MuiOutlinedInput-input': { color: '#1d1d1f' },
});

interface SkpaOption { id: string; kode_skpa: string; nama_skpa: string; }

interface PksiEditData {
  id: string; namaPksi: string; namaAplikasi: string; picSatkerBA: string;
  jangkaWaktu: string; tanggalPengajuan: string; linkDocsT01: string;
  status: 'pending' | 'disetujui' | 'tidak_disetujui';
}

interface EditPksiModalProps {
  open: boolean; onClose: () => void; pksiData: PksiEditData | null; onSuccess: () => void;
}

interface FormData {
  namaPksi: string; aplikasiId: string; tanggalPengajuan: string; picSatkerBA: string[];
  programInisiatifRBSI: string; jenisPksi: string; targetUsreq: string; targetSit: string; targetUat: string; targetGoLive: string;
}

interface FormErrors { [key: string]: string | undefined; }

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

interface TimelinePhase { id: string; targetUsreq: string; targetSit: string; targetUat: string; targetGoLive: string; }

const TIMELINE_CARDS = [
  { key: 'targetUsreq' as const, label: 'Target Usreq', gradient: ['#6366F1', '#818CF8'], rgb: '99,102,241' },
  { key: 'targetSit' as const, label: 'Target SIT', gradient: ['#8B5CF6', '#A78BFA'], rgb: '139,92,246' },
  { key: 'targetUat' as const, label: 'Target UAT/PDKK', gradient: ['#F59E0B', '#FCD34D'], rgb: '245,158,11' },
  { key: 'targetGoLive' as const, label: 'Target Go Live', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
];

interface PhaseTimelineProps {
  phaseNumber: number; targetUsreq: string; targetSit: string; targetUat: string; targetGoLive: string;
  onChangeUsreq: (v: string) => void; onChangeSit: (v: string) => void;
  onChangeUat: (v: string) => void; onChangeGoLive: (v: string) => void; onRemove?: () => void;
  hideSit?: boolean;
}

const PhaseTimeline = ({ phaseNumber, targetUsreq, targetSit, targetUat, targetGoLive, onChangeUsreq, onChangeSit, onChangeUat, onChangeGoLive, onRemove, hideSit }: PhaseTimelineProps) => {
  const cardsToShow = hideSit ? TIMELINE_CARDS.filter(c => c.key !== 'targetSit') : TIMELINE_CARDS;
  const allValues: Record<string, string> = { targetUsreq, targetSit, targetUat, targetGoLive };
  const allHandlers: Record<string, (v: string) => void> = { targetUsreq: onChangeUsreq, targetSit: onChangeSit, targetUat: onChangeUat, targetGoLive: onChangeGoLive };
  const values = cardsToShow.map(c => allValues[c.key]);
  const handlers = cardsToShow.map(c => allHandlers[c.key]);
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ px: 1.5, py: 0.4, borderRadius: '8px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6366F1', letterSpacing: '0.02em' }}>Tahap {phaseNumber}</Typography>
          </Box>
          {phaseNumber === 1 && (
            <Box sx={{ px: 1, py: 0.3, borderRadius: '6px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.65rem', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</Typography>
            </Box>
          )}
        </Box>
        {onRemove && (
          <IconButton size="small" onClick={onRemove} sx={{ width: 28, height: 28, color: '#86868b', '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.06)' } }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        {cardsToShow.map((card, i) => (
          <Box key={card.key} sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 6px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)', overflow: 'hidden' }}>
            <Box sx={{ height: 3, background: `linear-gradient(90deg, ${card.gradient[0]}, ${card.gradient[1]})` }} />
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${card.gradient[0]}, ${card.gradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 6px rgba(${card.rgb},0.4)`, flexShrink: 0 }}>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>{i + 1}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>{card.label}</Typography>
              </Box>
              <TextField fullWidth size="small" type="month" value={values[i] ? values[i].substring(0, 7) : ''} onChange={(e) => handlers[i](e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', background: `rgba(${card.rgb},0.07)`, '& fieldset': { border: `1px solid rgba(${card.rgb},0.18)` }, '&:hover fieldset': { borderColor: `rgba(${card.rgb},0.4)` }, '&.Mui-focused fieldset': { borderColor: card.gradient[0], borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.78rem', py: '6px', color: '#1d1d1f' } }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const EditPksiModal: React.FC<EditPksiModalProps> = ({ open, onClose, pksiData, onSuccess }) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('jadwal');
  const [formData, setFormData] = useState<FormData>({
    namaPksi: '', aplikasiId: '', tanggalPengajuan: '', picSatkerBA: [], programInisiatifRBSI: '', jenisPksi: 'Reguler',
    targetUsreq: currentMonthValue(), targetSit: currentMonthValue(), targetUat: currentMonthValue(), targetGoLive: currentMonthValue(),
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
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhase[]>([]);

  const addPhase = () => {
    setTimelinePhases(prev => [...prev, { id: `phase_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, targetUsreq: currentMonthValue(), targetSit: currentMonthValue(), targetUat: currentMonthValue(), targetGoLive: currentMonthValue() }]);
  };
  const removePhase = (id: string) => setTimelinePhases(prev => prev.filter(p => p.id !== id));
  const updatePhase = (id: string, field: keyof Omit<TimelinePhase, 'id'>, value: string) => {
    setTimelinePhases(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const [filesT01, setFilesT01] = useState<PksiFileData[]>([]);
  const [isUploadingT01, setIsUploadingT01] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PksiFileData | null>(null);

  const periodYears = useMemo(() => {
    if (!selectedRbsi) return [];
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) years.push(year);
    return years;
  }, [selectedRbsi]);

  const groupedInisiatifs = useMemo(() => {
    if (!programOptions.length) return [];
    return programOptions.map(program => {
      const inisiatifs = (program.inisiatifs || []).filter(i => !selectedYear || i.tahun === selectedYear);
      return { program, inisiatifs };
    }).filter(g => g.inisiatifs.length > 0);
  }, [programOptions, selectedYear]);

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const handleFileUploadT01 = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && pksiData?.id) {
      setIsUploadingT01(true); setErrorMessage('');
      try {
        await uploadPksiFiles(pksiData.id, [files[0]], 'T01');
        const all = await getPksiFiles(pksiData.id);
        setFilesT01(all.filter(f => f.file_type === 'T01' || !f.file_type));
      } catch (error) { console.error('Upload T01 failed:', error); setErrorMessage('Gagal mengupload file T01.'); }
      finally { setIsUploadingT01(false); }
    }
    event.target.value = '';
  };


  const handleRemoveFile = async (fileId: string, _fileType: string) => {
    try {
      await deletePksiFile(fileId);
      setFilesT01(prev => prev.filter(f => f.id !== fileId));
    } catch (error) { console.error('Delete failed:', error); setErrorMessage('Gagal menghapus file.'); }
  };

  const handleDownload = async (file: PksiFileData) => {
    setDownloadingFileId(file.id);
    try { await downloadPksiFile(file.id, file.original_name); }
    catch (error) { console.error('Download error:', error); }
    finally { setDownloadingFileId(null); }
  };

  const handlePreview = (file: PksiFileData) => { setPreviewFile(file); setPreviewOpen(true); };
  const handlePreviewClose = () => { setPreviewOpen(false); setPreviewFile(null); };
  const handlePreviewDownload = async () => { if (previewFile) await handleDownload(previewFile); };
  const isPreviewable = (ct: string) => ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(ct);
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [skpaResp, appResp, rbsiResp] = await Promise.all([getAllSkpa(), getAllAplikasi(), getAllRbsi()]);
        setSkpaOptions((skpaResp.data || []).map((s: SkpaData) => ({ id: s.id, kode_skpa: s.kode_skpa, nama_skpa: s.nama_skpa })));
        setAplikasiOptions(appResp.data || []);
        setRbsiOptions(rbsiResp.data || []);
      } catch (error) { console.error('Error fetching options:', error); }
    };
    if (open) fetchOptions();
  }, [open]);

  useEffect(() => {
    const fetchPksiDetails = async () => {
      if (!pksiData?.id || !open) return;
      setIsLoadingData(true);
      try {
        const data = await getPksiDocumentById(pksiData.id);
        setFormData({
          namaPksi: data.nama_pksi || '', aplikasiId: data.aplikasi_id || '',
          tanggalPengajuan: data.tanggal_pengajuan ? data.tanggal_pengajuan.split('T')[0] : '',
          picSatkerBA: data.pic_satker_ba ? data.pic_satker_ba.split(/[,]\s*/).filter(Boolean) : [],
          programInisiatifRBSI: data.program_inisiatif_rbsi || '',
          jenisPksi: data.jenis_pksi || 'Reguler',
          targetUsreq: data.target_usreq ? data.target_usreq.split('T')[0] : currentMonthValue(),
          targetSit: data.target_sit ? data.target_sit.split('T')[0] : currentMonthValue(),
          targetUat: data.target_uat ? data.target_uat.split('T')[0] : currentMonthValue(),
          targetGoLive: data.target_go_live ? data.target_go_live.split('T')[0] : currentMonthValue(),
        });
        if (data.inisiatif_id) setLoadedInisiatifId(data.inisiatif_id);
        try {
          const existingFiles = await getPksiFiles(pksiData.id);
          setFilesT01(existingFiles.filter(f => f.file_type === 'T01' || !f.file_type));
        } catch (fileErr) { console.error('Error fetching files:', fileErr); }
      } catch (error) { console.error('Error fetching PKSI details:', error); }
      finally { setIsLoadingData(false); }
    };
    fetchPksiDetails();
  }, [pksiData?.id, open]);

  useEffect(() => {
    if (!loadedInisiatifId || !programOptions.length) return;
    for (const program of programOptions) {
      const match = program.inisiatifs?.find(i => i.id === loadedInisiatifId);
      if (match) { setSelectedInisiatif(match); setSelectedProgram(program); setLoadedInisiatifId(null); break; }
    }
  }, [loadedInisiatifId, programOptions]);

  useEffect(() => {
    if (!loadedInisiatifId || !rbsiOptions.length || selectedRbsi) return;
    // getAllRbsi already returns nested programs+inisiatifs — no extra API calls needed
    for (const rbsi of rbsiOptions) {
      const programs = rbsi.programs || [];
      if (programs.some(p => p.inisiatifs?.some(i => i.id === loadedInisiatifId))) {
        setSelectedRbsi(rbsi);
        setProgramOptions(programs);
        break;
      }
    }
  }, [loadedInisiatifId, rbsiOptions, selectedRbsi]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.namaPksi.trim()) newErrors.namaPksi = 'Nama PKSI wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !pksiData?.id) return;
    setIsSubmitting(true);
    try {
      const requestData: PksiDocumentRequest = {
        aplikasi_id: formData.aplikasiId || undefined, inisiatif_id: selectedInisiatif?.id || undefined,
        nama_pksi: formData.namaPksi, jenis_pksi: formData.jenisPksi, tanggal_pengajuan: formData.tanggalPengajuan || undefined,
        pic_satker_ba: formData.picSatkerBA.length > 0 ? formData.picSatkerBA.join(',') : undefined,
        program_inisiatif_rbsi: formData.programInisiatifRBSI || undefined,
        target_usreq: formData.targetUsreq || undefined, target_sit: formData.jenisPksi === 'Mendesak' ? (formData.targetUat || undefined) : (formData.targetSit || undefined),
        target_uat: formData.targetUat || undefined, target_go_live: formData.targetGoLive || undefined,
        user_id: getUserInfo()?.uuid || '',
      };
      await updatePksiDocument(pksiData.id, requestData);
      onSuccess(); handleClose();
    } catch (error) { console.error('Error updating PKSI:', error); }
    finally { setIsSubmitting(false); }
  };

  const handleClose = () => {
    setFormData({ namaPksi: '', aplikasiId: '', tanggalPengajuan: '', picSatkerBA: [], programInisiatifRBSI: '', jenisPksi: 'Reguler', targetUsreq: currentMonthValue(), targetSit: currentMonthValue(), targetUat: currentMonthValue(), targetGoLive: currentMonthValue() });
    setErrors({}); setExpandedSection('jadwal'); setFilesT01([]);
    setIsUploadingT01(false); setErrorMessage('');
    setPreviewOpen(false); setPreviewFile(null); setTimelinePhases([]);
    setSelectedRbsi(null); setSelectedProgram(null); setSelectedInisiatif(null);
    setSelectedYear(null); setLoadedInisiatifId(null); onClose();
  };

  const renderFileSection = (title: string, fileType: string, files: PksiFileData[], isUploading: boolean, handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, uploadId: string, iconColor: string) => (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: '#1d1d1f' }}>{title}</Typography>
      <Box sx={{ border: '2px dashed #e5e5e7', borderRadius: 2, p: 3, textAlign: 'center', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1, transition: 'all 0.2s ease-in-out', '&:hover': { borderColor: isUploading ? '#e5e5e7' : iconColor, bgcolor: isUploading ? 'transparent' : `${iconColor}08` } }}
        onClick={() => !isUploading && document.getElementById(uploadId)?.click()}>
        <input id={uploadId} type="file" hidden onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" disabled={isUploading} />
        {isUploading ? (<><CircularProgress size={48} sx={{ color: iconColor, mb: 1 }} /><Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>Mengupload file...</Typography></>) : (<><CloudUploadIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} /><Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 500 }}>Klik untuk upload file {title}</Typography><Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>atau drag & drop file di sini</Typography><Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 1 }}>Format: PDF, Word, Excel, Gambar (max 20MB)</Typography></>)}
      </Box>
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1d1d1f' }}>File {title} ({files.length})</Typography>
          <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px' }}>
            {files.map((file, index) => (
              <ListItem key={file.id} sx={{ borderBottom: index < files.length - 1 ? '1px solid #e5e5e7' : 'none' }}>
                <ListItemIcon><FileIcon sx={{ color: iconColor }} /></ListItemIcon>
                <ListItemText primary={file.original_name} secondary={formatFileSize(file.file_size)} primaryTypographyProps={{ sx: { fontWeight: 500, color: '#1d1d1f' } }} secondaryTypographyProps={{ sx: { color: '#86868b' } }} />
                <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                  {isPreviewable(file.content_type) && <IconButton edge="end" size="small" onClick={() => handlePreview(file)} sx={{ color: '#0891B2', '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' } }} title="Preview"><VisibilityIcon fontSize="small" /></IconButton>}
                  <IconButton edge="end" size="small" onClick={() => handleDownload(file)} disabled={downloadingFileId === file.id} sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(5, 150, 105, 0.1)' } }} title="Download">{downloadingFileId === file.id ? <CircularProgress size={18} sx={{ color: '#059669' }} /> : <DownloadIcon fontSize="small" />}</IconButton>
                  <IconButton edge="end" size="small" onClick={() => handleRemoveFile(file.id, fileType)} disabled={isUploading} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }} title="Hapus"><DeleteIcon fontSize="small" /></IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '20px', maxHeight: '90vh', bgcolor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' } }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)' } } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', pb: 2, bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}>Edit PKSI</Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#86868b', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 4, background: 'linear-gradient(135deg, rgba(245, 245, 247, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%)' }}>
        {isLoadingData ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}><CircularProgress sx={{ color: '#DA251C' }} /></Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Informasi Dasar */}
            <Box sx={{ p: 3, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' } }}>
              <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.01em', fontSize: '1rem' }}>Informasi Dasar</Typography>
              <Stack spacing={2.5}>
                <GlassTextField fullWidth label="Nama PKSI" name="namaPksi" value={formData.namaPksi} onChange={handleInputChange} error={!!errors.namaPksi} helperText={errors.namaPksi} size="small" />
                <GlassTextField select fullWidth label="Jenis PKSI" name="jenisPksi" value={formData.jenisPksi} onChange={handleInputChange} size="small">
                  <MenuItem value="Reguler">Reguler</MenuItem>
                  <MenuItem value="Mendesak">Mendesak</MenuItem>
                </GlassTextField>
                <Autocomplete fullWidth options={aplikasiOptions} getOptionLabel={(o) => `${o.kode_aplikasi} - ${o.nama_aplikasi}`} value={aplikasiOptions.find(a => a.id === formData.aplikasiId) || null} onChange={(_, v) => setFormData(prev => ({ ...prev, aplikasiId: v?.id || '' }))} renderInput={(params) => <GlassTextField {...params} label="Nama Aplikasi" size="small" />} size="small" />
                <Autocomplete multiple fullWidth options={skpaOptions} getOptionLabel={(o) => `${o.kode_skpa} - ${o.nama_skpa}`} value={skpaOptions.filter(s => formData.picSatkerBA.includes(s.id))} onChange={(_, v) => setFormData(prev => ({ ...prev, picSatkerBA: v.map(s => s.id) }))}
                  renderInput={(params) => <GlassTextField {...params} label="SKPA (Satuan Kerja Pemilik Aplikasi)" size="small" />}
                  renderTags={(value, getTagProps) => value.map((option, index) => (<Chip {...getTagProps({ index })} key={option.id} label={option.kode_skpa} size="small" sx={{ bgcolor: '#DA251C', color: 'white', '& .MuiChip-deleteIcon': { color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: 'white' } } }} />))}
                  isOptionEqualToValue={(o, v) => o.id === v.id} size="small" />
                {/* RBSI Cascading Selection */}
                <Box sx={{ mt: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(218, 37, 28, 0.03)', border: '1px solid rgba(218, 37, 28, 0.1)' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#DA251C', fontSize: '0.85rem' }}>Program Inisiatif RBSI</Typography>
                  <Stack spacing={2}>
                    <Autocomplete fullWidth options={rbsiOptions} getOptionLabel={(o) => o.periode} value={selectedRbsi}
                      onChange={async (_, v) => { setSelectedRbsi(v); setSelectedProgram(null); setSelectedInisiatif(null); setSelectedYear(null); setProgramOptions([]); setFormData(prev => ({ ...prev, programInisiatifRBSI: '' })); if (v) { try { const r = await getRbsiById(v.id); setProgramOptions(r.data.programs || []); } catch (e) { console.error('Error:', e); } } }}
                      renderInput={(params) => <GlassTextField {...params} label="Pilih RBSI (Periode)" size="small" />} size="small" />
                    <Box>
                      <Box onClick={(e) => { if (selectedRbsi) { setPopoverWidth(e.currentTarget.offsetWidth); setInisiatifPopoverAnchor(e.currentTarget); } }}
                        sx={{ cursor: selectedRbsi ? 'pointer' : 'not-allowed', py: 1.5, px: 1.5, borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.08)', bgcolor: selectedRbsi ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.04)', backdropFilter: 'blur(10px)', '&:hover': selectedRbsi ? { bgcolor: 'rgba(255, 255, 255, 0.8)', borderColor: 'rgba(0, 0, 0, 0.2)' } : {}, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: selectedRbsi ? 1 : 0.6 }}>
                        {selectedInisiatif && selectedProgram ? (
                          <Box sx={{ overflow: 'hidden', flex: 1 }}>
                            <Typography sx={{ fontSize: '0.875rem', color: '#1d1d1f', fontWeight: 500, wordWrap: 'break-word', whiteSpace: 'normal' }}>{selectedInisiatif.nomor_inisiatif} - {selectedInisiatif.nama_inisiatif}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#86868b', wordWrap: 'break-word', whiteSpace: 'normal' }}>{selectedProgram.nomor_program} - {selectedProgram.nama_program}</Typography>
                          </Box>
                        ) : (<Typography sx={{ fontSize: '0.875rem', color: '#86868b' }}>Pilih Program & Inisiatif...</Typography>)}
                        <ExpandMoreIcon sx={{ color: '#86868b', fontSize: '1.2rem' }} />
                      </Box>
                      <Popover open={Boolean(inisiatifPopoverAnchor)} anchorEl={inisiatifPopoverAnchor} onClose={() => setInisiatifPopoverAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: popoverWidth || 'auto', maxHeight: 450, mt: 0.5 } }}>
                        <Box sx={{ py: 1 }}>
                          <Box sx={{ px: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block', fontWeight: 600 }}>Filter berdasarkan tahun</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip label="Semua" size="small" onClick={() => setSelectedYear(null)} sx={{ bgcolor: selectedYear === null ? '#DA251C' : '#f5f5f5', color: selectedYear === null ? 'white' : '#666', fontSize: '0.7rem', height: 24, '&:hover': { opacity: 0.8 } }} />
                              {periodYears.map(yr => <Chip key={yr} label={yr} size="small" onClick={() => setSelectedYear(yr)} sx={{ bgcolor: selectedYear === yr ? '#DA251C' : '#f5f5f5', color: selectedYear === yr ? 'white' : '#666', fontSize: '0.7rem', height: 24, '&:hover': { opacity: 0.8 } }} />)}
                            </Box>
                          </Box>
                          <Box sx={{ maxHeight: 330, overflow: 'auto' }}>
                            {groupedInisiatifs.length === 0 ? (
                              <Box sx={{ px: 2, py: 3, textAlign: 'center' }}><Typography variant="body2" sx={{ color: '#86868b' }}>{selectedYear ? `Tidak ada inisiatif untuk tahun ${selectedYear}` : 'Tidak ada program & inisiatif'}</Typography></Box>
                            ) : groupedInisiatifs.map(({ program, inisiatifs }) => (
                              <Box key={program.id}>
                                <Box sx={{ px: 2, py: 1, bgcolor: '#f8f8f8', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 1 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#DA251C', wordWrap: 'break-word', whiteSpace: 'normal' }}>{program.nomor_program} - {program.nama_program}</Typography>
                                </Box>
                                {inisiatifs.map(inisiatif => (
                                  <MenuItem key={inisiatif.id} selected={selectedInisiatif?.id === inisiatif.id}
                                    onClick={() => { setSelectedProgram(program); setSelectedInisiatif(inisiatif); setFormData(prev => ({ ...prev, programInisiatifRBSI: `${inisiatif.nomor_inisiatif} - ${inisiatif.nama_inisiatif} (${program.nomor_program})` })); setInisiatifPopoverAnchor(null); }}
                                    sx={{ fontSize: '0.85rem', py: 1.5, px: 2, pl: 3, borderLeft: '3px solid transparent', '&.Mui-selected': { borderLeftColor: '#DA251C', bgcolor: 'rgba(218, 37, 28, 0.08)' }, '&:hover': { borderLeftColor: '#DA251C' } }}>
                                    <Box>
                                      <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', wordWrap: 'break-word', whiteSpace: 'normal' }}>{inisiatif.nomor_inisiatif} - {inisiatif.nama_inisiatif}</Typography>
                                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>Tahun {inisiatif.tahun}</Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Popover>
                    </Box>
                  </Stack>
                </Box>
                <GlassTextField fullWidth label="Tanggal Pengajuan" name="tanggalPengajuan" type="date" value={formData.tanggalPengajuan} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size="small" />
              </Stack>
            </Box>

            {/* Usulan Jadwal Pelaksanaan */}
            <Accordion expanded={expandedSection === 'jadwal'} onChange={handleAccordionChange('jadwal')} sx={{ mt: expandedSection === 'jadwal' ? 1 : 0, borderRadius: '16px !important', bgcolor: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)', '&::before': { display: 'none' }, '&.Mui-expanded': { margin: 0 } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#86868b' }} />} sx={{ borderRadius: '16px', '&.Mui-expanded': { minHeight: 48 } }}>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>Usulan Jadwal Pelaksanaan</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1.5, pb: 2, px: 2 }}>
                <PhaseTimeline phaseNumber={1} targetUsreq={formData.targetUsreq} targetSit={formData.targetSit} targetUat={formData.targetUat} targetGoLive={formData.targetGoLive}
                  onChangeUsreq={(v) => setFormData(p => ({ ...p, targetUsreq: v ? lastDayOfMonth(v) : '' }))} onChangeSit={(v) => setFormData(p => ({ ...p, targetSit: v ? lastDayOfMonth(v) : '' }))}
                  onChangeUat={(v) => setFormData(p => ({ ...p, targetUat: v ? lastDayOfMonth(v) : '' }))} onChangeGoLive={(v) => setFormData(p => ({ ...p, targetGoLive: v ? lastDayOfMonth(v) : '' }))}
                  hideSit={formData.jenisPksi === 'Mendesak'} />
                {timelinePhases.map((phase, idx) => (
                  <PhaseTimeline key={phase.id} phaseNumber={idx + 2} targetUsreq={phase.targetUsreq} targetSit={phase.targetSit} targetUat={phase.targetUat} targetGoLive={phase.targetGoLive}
                    onChangeUsreq={(v) => updatePhase(phase.id, 'targetUsreq', v ? lastDayOfMonth(v) : '')} onChangeSit={(v) => updatePhase(phase.id, 'targetSit', v ? lastDayOfMonth(v) : '')}
                    onChangeUat={(v) => updatePhase(phase.id, 'targetUat', v ? lastDayOfMonth(v) : '')} onChangeGoLive={(v) => updatePhase(phase.id, 'targetGoLive', v ? lastDayOfMonth(v) : '')}
                    onRemove={() => removePhase(phase.id)} hideSit={formData.jenisPksi === 'Mendesak'} />
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={addPhase} sx={{ borderRadius: '14px', borderColor: 'rgba(99,102,241,0.3)', color: '#6366F1', fontWeight: 600, fontSize: '0.82rem', px: 3, py: 1, textTransform: 'none', backdropFilter: 'blur(10px)', background: 'rgba(99,102,241,0.04)', '&:hover': { borderColor: '#6366F1', background: 'rgba(99,102,241,0.08)' } }}>Tambah Tahap</Button>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Upload Dokumen */}
            <Accordion expanded={expandedSection === 'upload'} onChange={handleAccordionChange('upload')} sx={{ borderRadius: '20px !important', bgcolor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', '&::before': { display: 'none' }, '&.Mui-expanded': { margin: '0 !important' }, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#86868b' }} />} sx={{ borderRadius: '20px', px: 2.5, '&.Mui-expanded': { minHeight: 56 }, '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' } }}>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>Upload Dokumen T.01 & Nota Dinas</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                <Stack spacing={3}>
                  {errorMessage && <Typography color="error" variant="body2">{errorMessage}</Typography>}
                  {renderFileSection('Rencana PKSI (T01/T02)', 'T01', filesT01, isUploadingT01, handleFileUploadT01, 'edit-pksi-file-upload-t01', '#DA251C')}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)', bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting} sx={{ borderColor: 'rgba(0, 0, 0, 0.12)', color: '#86868b', borderRadius: 2, px: 3, fontWeight: 500, '&:hover': { borderColor: 'rgba(0, 0, 0, 0.24)', bgcolor: 'rgba(0, 0, 0, 0.02)' } }}>Batal</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting || isLoadingData} sx={{ background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)', fontWeight: 500, borderRadius: 2, px: 3, boxShadow: '0 4px 14px rgba(218, 37, 28, 0.25)', '&:hover': { background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)', boxShadow: '0 6px 20px rgba(218, 37, 28, 0.35)' }, '&.Mui-disabled': { background: '#e5e5e7' } }}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </DialogActions>
      <FilePreviewModal open={previewOpen} onClose={handlePreviewClose} fileId={previewFile?.id || null} fileName={previewFile?.original_name || ''} contentType={previewFile?.content_type || ''} onDownload={handlePreviewDownload} downloadUrl={previewFile ? `/api/pksi/files/download/${previewFile.id}` : undefined} />
    </Dialog>
  );
};

export default EditPksiModal;
