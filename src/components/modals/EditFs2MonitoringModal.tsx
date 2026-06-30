import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, CircularProgress, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip,
  IconButton, List, ListItem, ListItemIcon, ListItemText,
  ListItemSecondaryAction, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Stack, Snackbar, Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { updateFs2Document, type Fs2DocumentData, type Fs2DocumentRequest } from '../../api/fs2Api';
import { uploadFs2Files, getFs2Files, deleteFs2File, downloadFs2File, type Fs2FileData } from '../../api/fs2FileApi';
import { getAllTeams, type Team } from '../../api/teamApi';
import FilePreviewModal from './FilePreviewModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Fs2TahapanDateField = 'tanggal_asesmen' | 'tanggal_pemrograman' | 'tanggal_pengujian_selesai' | 'tanggal_deployment_selesai' | 'tanggal_go_live';
type Fs2TahapanTargetField = 'target_pemrograman' | 'target_pengujian' | 'target_deployment' | 'target_go_live';

interface EditFs2MonitoringModalProps {
  open: boolean;
  onClose: () => void;
  fs2Id: string;
  fs2Data: Fs2DocumentData;
  onSuccess: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FASE_PENGAJUAN_OPTIONS = ['DESAIN', 'PEMELIHARAAN'] as const;
const MEKANISME_OPTIONS = ['INHOUSE', 'OUTSOURCE'] as const;
const PELAKSANAAN_OPTIONS = ['SINGLE_YEAR', 'MULTIYEARS'] as const;

const FASE_LABELS: Record<string, string> = { DESAIN: 'Desain', PEMELIHARAAN: 'Pemeliharaan' };
const MEKANISME_LABELS: Record<string, string> = { INHOUSE: 'Inhouse', OUTSOURCE: 'Outsource' };
const PELAKSANAAN_LABELS: Record<string, string> = { SINGLE_YEAR: 'Single Year', MULTIYEARS: 'Multiyears' };

const FS2_TAHAPAN_CONFIG: Array<{
  key: string; label: string; color: string; gradient: [string, string]; rgb: string;
  dateField: Fs2TahapanDateField; targetField: Fs2TahapanTargetField | null; statusApiField: string;
}> = [
  { key: 'ASESMEN', label: 'Asesmen', color: '#8B5CF6', gradient: ['#8B5CF6', '#A78BFA'], rgb: '139,92,246', dateField: 'tanggal_asesmen', targetField: null, statusApiField: 'tahapan_status_asesmen' },
  { key: 'PEMROGRAMAN', label: 'Pemrograman', color: '#F59E0B', gradient: ['#F59E0B', '#FCD34D'], rgb: '245,158,11', dateField: 'tanggal_pemrograman', targetField: 'target_pemrograman', statusApiField: 'tahapan_status_pemrograman' },
  { key: 'PENGUJIAN', label: 'Pengujian', color: '#0EA5E9', gradient: ['#0EA5E9', '#38BDF8'], rgb: '14,165,233', dateField: 'tanggal_pengujian_selesai', targetField: 'target_pengujian', statusApiField: 'tahapan_status_pengujian' },
  { key: 'DEPLOYMENT', label: 'Deployment', color: '#31A24C', gradient: ['#31A24C', '#4ADE80'], rgb: '49,162,76', dateField: 'tanggal_deployment_selesai', targetField: 'target_deployment', statusApiField: 'tahapan_status_deployment' },
  { key: 'GO_LIVE', label: 'Go Live', color: '#10B981', gradient: ['#10B981', '#34D399'], rgb: '16,185,129', dateField: 'tanggal_go_live', targetField: 'target_go_live', statusApiField: 'tahapan_status_go_live' },
];

const FS2_TIMELINE_CONFIGS = [
  { key: 'pengujian' as const, label: 'Target Pengujian', targetField: 'target_pengujian', gradient: ['#0EA5E9', '#38BDF8'], rgb: '14,165,233' },
  { key: 'deployment' as const, label: 'Target Deployment', targetField: 'target_deployment', gradient: ['#31A24C', '#4ADE80'], rgb: '49,162,76' },
  { key: 'goLive' as const, label: 'Target Go Live', targetField: 'target_go_live', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
] as const;

const MONTH_OPTIONS = [
  { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
  { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const year = currentYear - 5 + i;
  return { value: year.toString(), label: year.toString() };
});

const SKPA_COLORS = [
  { bg: '#DA251C', text: '#FFFFFF' }, { bg: '#2563EB', text: '#FFFFFF' }, { bg: '#059669', text: '#FFFFFF' },
  { bg: '#7C3AED', text: '#FFFFFF' }, { bg: '#D97706', text: '#FFFFFF' }, { bg: '#0891B2', text: '#FFFFFF' },
  { bg: '#DB2777', text: '#FFFFFF' }, { bg: '#4F46E5', text: '#FFFFFF' }, { bg: '#65A30D', text: '#FFFFFF' },
  { bg: '#DC2626', text: '#FFFFFF' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getChipColor = (code: string) => {
  if (!code) return SKPA_COLORS[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return SKPA_COLORS[Math.abs(hash) % SKPA_COLORS.length];
};

const formatMonthYear = (dateString?: string | null): string => {
  if (!dateString || dateString === '-') return '-';
  try { return new Date(dateString).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); } catch { return '-'; }
};

const getMonthFromDate = (dateString?: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length >= 2 ? parts[1] : '';
};

const getYearFromDate = (dateString?: string): string => {
  if (!dateString) return '';
  return dateString.split('-')[0] || '';
};

const buildDateFromMonthYear = (month: string, year: string): string => {
  if (!month || !year) return '';
  return `${year}-${month}-01`;
};

const getEndOfMonthDate = (dateString?: string | null): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length < 2) return null;
  const year = parseInt(parts[0], 10), month = parseInt(parts[1], 10);
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isPreviewable = (contentType: string) =>
  ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(contentType);

// ─── Component ────────────────────────────────────────────────────────────────

const EditFs2MonitoringModal: React.FC<EditFs2MonitoringModalProps> = ({ open, onClose, fs2Id, fs2Data, onSuccess }) => {
  const [editFormData, setEditFormData] = useState<Partial<Fs2DocumentRequest>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileErrorMessage, setFileErrorMessage] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Teams
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Date picker dialog state
  const [datePickerState, setDatePickerState] = useState<{
    open: boolean; tahapanKey: string; dateField: Fs2TahapanDateField | null; value: string;
  }>({ open: false, tahapanKey: '', dateField: null, value: '' });

  // File preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<Fs2FileData | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Uploaded file states
  const [filesND, setFilesND] = useState<Fs2FileData[]>([]);
  const [filesFS2, setFilesFS2] = useState<Fs2FileData[]>([]);
  const [filesCD, setFilesCD] = useState<Fs2FileData[]>([]);
  const [filesFS2A, setFilesFS2A] = useState<Fs2FileData[]>([]);
  const [filesFS2B, setFilesFS2B] = useState<Fs2FileData[]>([]);
  const [filesF45, setFilesF45] = useState<Fs2FileData[]>([]);
  const [filesF46, setFilesF46] = useState<Fs2FileData[]>([]);
  const [filesNDBA, setFilesNDBA] = useState<Fs2FileData[]>([]);

  // Pending files
  const [pendingFilesND, setPendingFilesND] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesFS2, setPendingFilesFS2] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesCD, setPendingFilesCD] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesFS2A, setPendingFilesFS2A] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesFS2B, setPendingFilesFS2B] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesF45, setPendingFilesF45] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesF46, setPendingFilesF46] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesNDBA, setPendingFilesNDBA] = useState<Array<{ file: File; tanggal: string }>>([]);

  // Upload loading
  const [isUploadingND, setIsUploadingND] = useState(false);
  const [isUploadingFS2, setIsUploadingFS2] = useState(false);
  const [isUploadingCD, setIsUploadingCD] = useState(false);
  const [isUploadingFS2A, setIsUploadingFS2A] = useState(false);
  const [isUploadingFS2B, setIsUploadingFS2B] = useState(false);
  const [isUploadingF45, setIsUploadingF45] = useState(false);
  const [isUploadingF46, setIsUploadingF46] = useState(false);
  const [isUploadingNDBA, setIsUploadingNDBA] = useState(false);

  // Drag states
  const [isDraggingND, setIsDraggingND] = useState(false);
  const [isDraggingFS2, setIsDraggingFS2] = useState(false);
  const [isDraggingCD, setIsDraggingCD] = useState(false);
  const [isDraggingFS2A, setIsDraggingFS2A] = useState(false);
  const [isDraggingFS2B, setIsDraggingFS2B] = useState(false);
  const [isDraggingF45, setIsDraggingF45] = useState(false);
  const [isDraggingF46, setIsDraggingF46] = useState(false);
  const [isDraggingNDBA, setIsDraggingNDBA] = useState(false);

  // Initialize when opened
  useEffect(() => {
    if (!open || !fs2Data) return;

    setEditFormData({
      progres: fs2Data.progres || '',
      progres_status: fs2Data.progres_status || '',
      tanggal_progres: fs2Data.tanggal_progres || '',
      fase_pengajuan: fs2Data.fase_pengajuan || '',
      iku: fs2Data.iku || '',
      mekanisme: fs2Data.mekanisme || '',
      pelaksanaan: fs2Data.pelaksanaan || '',
      tahun: fs2Data.tahun || undefined,
      tahun_mulai: fs2Data.tahun_mulai || undefined,
      tahun_selesai: fs2Data.tahun_selesai || undefined,
      pic_id: fs2Data.pic_id || '',
      team_id: fs2Data.team_id || '',
      anggota_tim: fs2Data.anggota_tim || '',
      anggota_tim_names: fs2Data.anggota_tim_names || '',
      pksi_id: fs2Data.pksi_id || '',
      nomor_nd: fs2Data.nomor_nd || '',
      tanggal_nd: fs2Data.tanggal_nd || '',
      tanggal_berkas_fs2: fs2Data.tanggal_berkas_fs2 || '',
      nomor_cd: fs2Data.nomor_cd || '',
      tanggal_cd: fs2Data.tanggal_cd || '',
      tanggal_berkas_fs2a: fs2Data.tanggal_berkas_fs2a || '',
      tanggal_berkas_fs2b: fs2Data.tanggal_berkas_fs2b || '',
      target_pengujian: fs2Data.target_pengujian || '',
      realisasi_pengujian: fs2Data.realisasi_pengujian || '',
      tanggal_berkas_f45: fs2Data.tanggal_berkas_f45 || '',
      tanggal_berkas_f46: fs2Data.tanggal_berkas_f46 || '',
      target_deployment: fs2Data.target_deployment || '',
      realisasi_deployment: fs2Data.realisasi_deployment || '',
      tanggal_berkas_nd_ba: fs2Data.tanggal_berkas_nd_ba || '',
      target_go_live: fs2Data.target_go_live || '',
      keterangan: fs2Data.keterangan || '',
      tanggal_asesmen: fs2Data.tanggal_asesmen || '',
      target_pemrograman: fs2Data.target_pemrograman || '',
      tanggal_pemrograman: fs2Data.tanggal_pemrograman || '',
      tanggal_pengujian_selesai: fs2Data.tanggal_pengujian_selesai || '',
      tanggal_deployment_selesai: fs2Data.tanggal_deployment_selesai || '',
      tanggal_go_live: fs2Data.tanggal_go_live || '',
    });

    // Load files
    getFs2Files(fs2Id).then(existingFiles => {
      setFilesND(existingFiles.filter(f => f.file_type === 'ND'));
      setFilesFS2(existingFiles.filter(f => f.file_type === 'FS2'));
      setFilesCD(existingFiles.filter(f => f.file_type === 'CD'));
      setFilesFS2A(existingFiles.filter(f => f.file_type === 'FS2A'));
      setFilesFS2B(existingFiles.filter(f => f.file_type === 'FS2B'));
      setFilesF45(existingFiles.filter(f => f.file_type === 'F45'));
      setFilesF46(existingFiles.filter(f => f.file_type === 'F46'));
      setFilesNDBA(existingFiles.filter(f => f.file_type === 'NDBA'));
    }).catch(err => console.error('Failed to load files:', err));

    // Load teams
    setIsLoadingTeams(true);
    getAllTeams().then(setTeams).catch(console.error).finally(() => setIsLoadingTeams(false));
  }, [open, fs2Data, fs2Id]);

  const handleClose = () => {
    setEditFormData({});
    setFilesND([]); setFilesFS2([]); setFilesCD([]); setFilesFS2A([]); setFilesFS2B([]);
    setFilesF45([]); setFilesF46([]); setFilesNDBA([]);
    setPendingFilesND([]); setPendingFilesFS2([]); setPendingFilesCD([]); setPendingFilesFS2A([]); setPendingFilesFS2B([]);
    setPendingFilesF45([]); setPendingFilesF46([]); setPendingFilesNDBA([]);
    setFileErrorMessage('');
    onClose();
  };

  // File validation
  const validateFile = (file: File): boolean => {
    const MAX_FILE_SIZE = 8 * 1024 * 1024;
    const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ALLOWED_EXT = ['.pdf', '.doc', '.docx'];
    if (!file.size || file.size <= 0) { alert('File tidak valid.'); return false; }
    if (file.size > MAX_FILE_SIZE) { alert(`File (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi 8MB.`); return false; }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) { alert('Hanya PDF dan Word (.pdf, .doc, .docx).'); return false; }
    return true;
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; tanggal: string }>>>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0 && validateFile(files[0])) {
      setPendingFiles(prev => [...prev, { file: files[0], tanggal: '' }]);
    }
    event.target.value = '';
  };

  const handleFileDrop = (
    event: React.DragEvent<HTMLElement>,
    setDragging: (v: boolean) => void,
    setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; tanggal: string }>>>
  ) => {
    event.preventDefault();
    setDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0 && validateFile(files[0])) {
      setPendingFiles(prev => [...prev, { file: files[0], tanggal: '' }]);
    }
  };

  const handleUploadPendingFiles = async (
    pendingFiles: Array<{ file: File; tanggal: string }>,
    fileType: string,
    setUploading: (v: boolean) => void,
    setFiles: React.Dispatch<React.SetStateAction<Fs2FileData[]>>,
    setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; tanggal: string }>>>,
    dateFormField?: keyof Fs2DocumentRequest
  ) => {
    if (pendingFiles.length === 0 || !fs2Id) return;
    setUploading(true);
    setFileErrorMessage('');
    try {
      const results: Fs2FileData[] = [];
      for (const pending of pendingFiles) {
        const uploaded = await uploadFs2Files(fs2Id, [pending.file], fileType, pending.tanggal || undefined);
        results.push(...uploaded);
        if (pending.tanggal && dateFormField) {
          setEditFormData(prev => ({ ...prev, [dateFormField]: pending.tanggal }));
        }
      }
      setFiles(prev => [...prev, ...results]);
      setPendingFiles([]);
    } catch (err) {
      console.error('Failed to upload:', err);
      setFileErrorMessage(`Gagal mengupload file ${fileType}.`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async (fileId: string, fileType: string, setFiles: React.Dispatch<React.SetStateAction<Fs2FileData[]>>) => {
    try {
      await deleteFs2File(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error('Failed to delete:', err);
      setFileErrorMessage(`Gagal menghapus file ${fileType}.`);
    }
  };

  const handleDownloadFile = async (file: Fs2FileData) => {
    setDownloadingFileId(file.id);
    try { await downloadFs2File(file.id, file.original_name); }
    catch (err) { console.error('Download error:', err); }
    finally { setDownloadingFileId(null); }
  };

  const handlePreviewFile = (file: Fs2FileData) => { setPreviewFile(file); setPreviewOpen(true); };

  // Submit
  const handleEditSubmit = async () => {
    if (!fs2Id) return;
    setIsSubmitting(true);
    try {
      const completionDates: Record<string, string> = {
        'ASESMEN': (editFormData.tanggal_asesmen || '').substring(0, 10),
        'PEMROGRAMAN': (editFormData.tanggal_pemrograman || '').substring(0, 10),
        'PENGUJIAN': (editFormData.tanggal_pengujian_selesai || '').substring(0, 10),
        'DEPLOYMENT': (editFormData.tanggal_deployment_selesai || '').substring(0, 10),
        'GO_LIVE': (editFormData.tanggal_go_live || '').substring(0, 10),
      };

      const derivedStatuses: Record<string, string> = {};
      let foundCurrentTahapan = false;
      let currentTahapanKey: string | null = null;
      let currentTahapanStatus = 'belum_dimulai';

      FS2_TAHAPAN_CONFIG.forEach((tahapan, index) => {
        const hasDate = completionDates[tahapan.key] && completionDates[tahapan.key].length > 0;
        if (hasDate) {
          derivedStatuses[tahapan.key] = 'Selesai';
        } else if (!foundCurrentTahapan) {
          const prevHasDate = index === 0 || (completionDates[FS2_TAHAPAN_CONFIG[index - 1].key]?.length > 0);
          if (index === 0 || prevHasDate) {
            derivedStatuses[tahapan.key] = 'Dalam proses';
            foundCurrentTahapan = true;
            currentTahapanKey = tahapan.key;
            currentTahapanStatus = 'dalam_proses';
          } else {
            derivedStatuses[tahapan.key] = 'Belum dimulai';
          }
        } else {
          derivedStatuses[tahapan.key] = 'Belum dimulai';
        }
      });

      if (!currentTahapanKey && completionDates['GO_LIVE']?.length > 0) {
        currentTahapanKey = 'GO_LIVE';
        currentTahapanStatus = 'selesai';
      }

      await updateFs2Document(fs2Id, {
        ...editFormData,
        progres: currentTahapanKey || undefined,
        progres_status: currentTahapanStatus,
        tahapan_status_asesmen: derivedStatuses['ASESMEN'] || undefined,
        tahapan_status_pemrograman: derivedStatuses['PEMROGRAMAN'] || undefined,
        tahapan_status_pengujian: derivedStatuses['PENGUJIAN'] || undefined,
        tahapan_status_deployment: derivedStatuses['DEPLOYMENT'] || undefined,
        tahapan_status_go_live: derivedStatuses['GO_LIVE'] || undefined,
      } as Fs2DocumentRequest);

      setSnackbar({ open: true, message: 'F.S.2 berhasil diperbarui', severity: 'success' });
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Failed to update F.S.2:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui F.S.2';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Dropzone render helper ──────────────────────────────────────────────────

  const renderDropzone = (
    id: string,
    isDragging: boolean,
    color: string,
    setDragging: (v: boolean) => void,
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onDrop: (e: React.DragEvent<HTMLElement>) => void,
    pendingFiles: Array<{ file: File; tanggal: string }>,
    setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; tanggal: string }>>>,
    isUploading: boolean,
    onUpload: () => void,
    uploadedFiles: Fs2FileData[],
    fileType: string,
    setFiles: React.Dispatch<React.SetStateAction<Fs2FileData[]>>,
    dateFormField?: keyof Fs2DocumentRequest
  ) => (
    <Box>
      <Box
        sx={{
          border: isDragging ? `2px dashed ${color}` : '2px dashed #e5e5e7',
          borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.2s', bgcolor: isDragging ? `${color}14` : 'transparent',
          '&:hover': { borderColor: color, bgcolor: `${color}08` },
        }}
        onClick={() => document.getElementById(id)?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input id={id} type="file" hidden onChange={onSelect} accept=".pdf,.doc,.docx" />
        <CloudUploadIcon sx={{ fontSize: 32, color: isDragging ? color : '#86868b', mb: 0.5 }} />
        <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDragging ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
        <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
      </Box>

      {pendingFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileIcon sx={{ color, fontSize: 18 }} />
            File akan diupload ({pendingFiles.length})
          </Typography>
          <Stack spacing={1.5}>
            {pendingFiles.map((pending, index) => (
              <Box key={index} sx={{ p: 1.5, background: `linear-gradient(145deg, ${color}0F 0%, ${color}05 100%)`, borderRadius: '12px', border: `1px solid ${color}33` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                  <FileIcon sx={{ color, fontSize: 18, flexShrink: 0 }} />
                  <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                  <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                  <IconButton size="small" onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth label="Tanggal Dokumen" type="date" size="small" value={pending.tanggal}
                  onChange={(e) => setPendingFiles(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: color } }, '& .MuiInputLabel-root.Mui-focused': { color } }}
                />
              </Box>
            ))}
          </Stack>
          <Button
            variant="contained" fullWidth onClick={onUpload} disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
            sx={{ mt: 1.5, bgcolor: color, borderRadius: '12px', fontWeight: 600, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' } }}
          >
            {isUploading ? 'Mengupload...' : `Upload ${pendingFiles.length} File`}
          </Button>
        </Box>
      )}

      {uploadedFiles.length > 0 && (
        <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
          {uploadedFiles.map((file) => (
            <ListItem key={file.id} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color, fontSize: 20 }} /></ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{file.display_name || file.original_name}</span>
                    {file.version && file.version > 1 && (
                      <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: color, color: 'white' }} />
                    )}
                  </Box>
                }
                secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • Tgl. Dok: ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
                primaryTypographyProps={{ sx: { fontSize: '0.85rem' } }}
                secondaryTypographyProps={{ sx: { fontSize: '0.75rem' } }}
              />
              <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                {isPreviewable(file.content_type) && (
                  <IconButton size="small" onClick={() => handlePreviewFile(file)} sx={{ color: '#0891B2' }}><VisibilityIcon fontSize="small" /></IconButton>
                )}
                <IconButton size="small" onClick={() => handleDownloadFile(file)} disabled={downloadingFileId === file.id} sx={{ color: '#059669' }}>
                  {downloadingFileId === file.id ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                </IconButton>
                <IconButton size="small" onClick={() => handleRemoveFile(file.id, fileType, setFiles)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px', maxHeight: '90vh',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(0,0,0,0.06)', pb: 2, bgcolor: 'rgba(255,255,255,0.85)' }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #31A24C 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(49,162,76,0.3)' }}>
            <EditIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>Edit F.S.2</Typography>
            <Typography variant="body2" sx={{ color: '#86868b' }}>Update informasi monitoring F.S.2</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={handleClose} size="small" sx={{ color: '#86868b', bgcolor: 'rgba(0,0,0,0.04)', '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 4, background: 'linear-gradient(135deg, rgba(245,245,247,0.9) 0%, rgba(250,250,250,0.95) 100%)' }}>
          {/* Header info display */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '16px', background: 'linear-gradient(145deg, rgba(245,245,247,0.8) 0%, rgba(240,240,242,0.6) 100%)', border: '1px solid rgba(255,255,255,0.8)' }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Nama Aplikasi</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>{fs2Data?.nama_aplikasi || '-'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Nama FS2</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>{fs2Data?.nama_fs2 || '-'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>SKPA</Typography>
                {fs2Data?.kode_skpa ? (
                  <Chip label={fs2Data.kode_skpa} size="small" sx={{ bgcolor: getChipColor(fs2Data.kode_skpa).bg, color: getChipColor(fs2Data.kode_skpa).text, fontWeight: 600, fontSize: '0.65rem', height: 22, borderRadius: '6px' }} />
                ) : (
                  <Typography sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                )}
              </Box>
            </Box>
            {fs2Data?.pksi_nama && fs2Data?.fase_pengajuan === 'DESAIN' && (
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>PKSI Terkait</Typography>
                <Chip label={fs2Data.pksi_nama} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 600, fontSize: '0.65rem', height: 22, borderRadius: '6px' }} />
              </Box>
            )}
          </Box>

          {/* Progres Tahapan */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '16px', background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,250,252,0.8) 100%)', border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <Typography variant="subtitle2" sx={{ mb: 2.5, fontWeight: 600, color: '#6366F1', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366F1' }} />
              Progres Tahapan
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(99,102,241,0.08)' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '22%' }}>Tahapan</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '20%' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '18%' }}>Tgl. Target</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '20%' }}>Tanggal Penyelesaian</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2 }}>Ketepatan Waktu</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {FS2_TAHAPAN_CONFIG.map((tahapan, index) => {
                    const dateValue = tahapan.dateField ? ((editFormData as Record<string, string>)[tahapan.dateField] || '').substring(0, 10) : '';
                    let derivedStatus = 'Belum dimulai';
                    if (dateValue) {
                      derivedStatus = 'Selesai';
                    } else if (index === 0) {
                      derivedStatus = 'Dalam proses';
                    } else {
                      const prevDateValue = FS2_TAHAPAN_CONFIG[index - 1].dateField
                        ? ((editFormData as Record<string, string>)[FS2_TAHAPAN_CONFIG[index - 1].dateField] || '').substring(0, 10)
                        : '';
                      if (prevDateValue) derivedStatus = 'Dalam proses';
                    }
                    const isSelesai = derivedStatus === 'Selesai', isDalam = derivedStatus === 'Dalam proses';
                    const canEditCompletionDate = isDalam;
                    const isPemeliharaan = editFormData.fase_pengajuan === 'PEMELIHARAAN';
                    const canEditTargetDate = tahapan.key === 'PEMROGRAMAN' || (isPemeliharaan && ['PENGUJIAN', 'DEPLOYMENT', 'GO_LIVE'].includes(tahapan.key));
                    let targetDate: string | null = null;
                    if (tahapan.targetField && editFormData[tahapan.targetField as keyof typeof editFormData]) {
                      targetDate = editFormData[tahapan.targetField as keyof typeof editFormData] as string;
                    }
                    const displayTarget = targetDate ? formatMonthYear(targetDate) : '—';

                    let ketepatanLabel: string | null = null, ketepatanColor = '#6B7280', ketepatanBg = '#F3F4F6';
                    if (tahapan.key !== 'ASESMEN' && isSelesai && dateValue && targetDate) {
                      const cd = parseYMDToLocalDate(dateValue), td = getEndOfMonthDate(targetDate);
                      if (cd && td) {
                        cd.setHours(0, 0, 0, 0); td.setHours(23, 59, 59, 999);
                        if (cd.getTime() <= td.getTime()) { ketepatanLabel = 'Tepat Waktu'; ketepatanColor = '#15803D'; ketepatanBg = '#F0FDF4'; }
                        else { ketepatanLabel = 'Terlambat'; ketepatanColor = '#DC2626'; ketepatanBg = '#FEF2F2'; }
                      }
                    } else if (tahapan.key !== 'ASESMEN' && isDalam && targetDate) {
                      const today = new Date(); today.setHours(0, 0, 0, 0);
                      const td = getEndOfMonthDate(targetDate);
                      if (td) {
                        td.setHours(23, 59, 59, 999);
                        if (today.getTime() <= td.getTime()) { ketepatanLabel = 'Dalam Waktu'; ketepatanColor = '#2563EB'; ketepatanBg = '#EFF6FF'; }
                        else { ketepatanLabel = 'Melewati Target'; ketepatanColor = '#D97706'; ketepatanBg = '#FFFBEB'; }
                      }
                    }

                    return (
                      <TableRow key={tahapan.key} sx={{ '&:last-child td': { borderBottom: 0 }, bgcolor: isSelesai ? 'rgba(21,128,61,0.025)' : isDalam ? 'rgba(99,102,241,0.025)' : 'transparent' }}>
                        <TableCell sx={{ fontSize: '0.82rem', py: 1, fontWeight: isDalam ? 600 : 400, color: isDalam ? '#6366F1' : isSelesai ? '#15803D' : '#1d1d1f' }}>{tahapan.label}</TableCell>
                        <TableCell sx={{ py: 0.7 }}>
                          <Chip label={derivedStatus} size="small" sx={{ fontSize: '0.75rem', fontWeight: 600, height: 26, borderRadius: '8px', bgcolor: isSelesai ? '#F0FDF4' : isDalam ? '#EEF2FF' : '#F3F4F6', color: isSelesai ? '#15803D' : isDalam ? '#6366F1' : '#6B7280', border: `1px solid ${isSelesai ? 'rgba(21,128,61,0.2)' : isDalam ? 'rgba(99,102,241,0.2)' : 'rgba(107,114,128,0.2)'}` }} />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          {canEditTargetDate && tahapan.targetField ? (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select value={getMonthFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string)} displayEmpty onChange={(e) => { const m = e.target.value, y = getYearFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string) || new Date().getFullYear().toString(); setEditFormData({ ...editFormData, [tahapan.targetField!]: m ? buildDateFromMonthYear(m, y) : '' }); }} sx={{ fontSize: '0.75rem', height: 28, borderRadius: '6px', '& .MuiSelect-select': { py: 0.5 } }}>
                                  <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Bulan</em></MenuItem>
                                  {MONTH_OPTIONS.map(m => <MenuItem key={m.value} value={m.value} sx={{ fontSize: '0.75rem' }}>{m.label}</MenuItem>)}
                                </Select>
                              </FormControl>
                              <FormControl size="small" sx={{ minWidth: 70 }}>
                                <Select value={getYearFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string)} displayEmpty onChange={(e) => { const y = e.target.value, m = getMonthFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string) || '01'; setEditFormData({ ...editFormData, [tahapan.targetField!]: y ? buildDateFromMonthYear(m, y) : '' }); }} sx={{ fontSize: '0.75rem', height: 28, borderRadius: '6px', '& .MuiSelect-select': { py: 0.5 } }}>
                                  <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Tahun</em></MenuItem>
                                  {YEAR_OPTIONS.map(y => <MenuItem key={y.value} value={y.value} sx={{ fontSize: '0.75rem' }}>{y.label}</MenuItem>)}
                                </Select>
                              </FormControl>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '0.8rem', py: 1, color: targetDate ? '#7C3AED' : '#86868b' }}>{displayTarget}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          {tahapan.dateField ? (
                            canEditCompletionDate ? (
                              <TextField type="date" size="small" value={dateValue} onChange={(e) => setEditFormData(prev => ({ ...prev, [tahapan.dateField!]: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.8rem', height: 32, bgcolor: 'rgba(99,102,241,0.04)', '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.5)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } }, minWidth: 140 }} />
                            ) : isSelesai && dateValue ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 500 }}>{dateValue}</Typography>
                                <IconButton size="small" onClick={() => setDatePickerState({ open: true, tahapanKey: tahapan.key, dateField: tahapan.dateField!, value: dateValue })} sx={{ p: 0.3, color: '#15803D', '&:hover': { bgcolor: 'rgba(21,128,61,0.1)' } }}>
                                  <EditIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize: '0.78rem', color: '#86868b' }}>—</Typography>
                            )
                          ) : (
                            <Typography sx={{ fontSize: '0.78rem', color: '#86868b' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
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

          {/* Timeline */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '16px', background: 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,252,250,0.8) 100%)', border: '1px solid rgba(16,185,129,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <Typography variant="subtitle2" sx={{ mb: 2.5, fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />Timeline
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {FS2_TIMELINE_CONFIGS.map((timeline, index) => {
                const isPemeliharaan = editFormData.fase_pengajuan === 'PEMELIHARAAN';
                const targetValue = editFormData[timeline.targetField as keyof typeof editFormData] as string || '';
                return (
                  <Box key={timeline.key} sx={{ flex: 1, p: 2, borderRadius: '12px', background: `linear-gradient(135deg, rgba(${timeline.rgb}, 0.08) 0%, rgba(${timeline.rgb}, 0.04) 100%)`, border: `1px solid rgba(${timeline.rgb}, 0.2)` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '8px', background: `linear-gradient(135deg, ${timeline.gradient[0]}, ${timeline.gradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px rgba(${timeline.rgb}, 0.3)` }}>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem' }}>{index + 1}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1d1d1f' }}>{timeline.label}</Typography>
                    </Box>
                    {isPemeliharaan ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select value={getMonthFromDate(targetValue)} displayEmpty onChange={(e) => { const m = e.target.value, y = getYearFromDate(targetValue) || new Date().getFullYear().toString(); setEditFormData({ ...editFormData, [timeline.targetField]: m ? buildDateFromMonthYear(m, y) : '' }); }} sx={{ fontSize: '0.7rem', height: 26, borderRadius: '6px', '& .MuiSelect-select': { py: 0.3 } }}>
                            <MenuItem value="" sx={{ fontSize: '0.7rem' }}><em>Bulan</em></MenuItem>
                            {MONTH_OPTIONS.map(m => <MenuItem key={m.value} value={m.value} sx={{ fontSize: '0.7rem' }}>{m.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 65 }}>
                          <Select value={getYearFromDate(targetValue)} displayEmpty onChange={(e) => { const y = e.target.value, m = getMonthFromDate(targetValue) || '01'; setEditFormData({ ...editFormData, [timeline.targetField]: y ? buildDateFromMonthYear(m, y) : '' }); }} sx={{ fontSize: '0.7rem', height: 26, borderRadius: '6px', '& .MuiSelect-select': { py: 0.3 } }}>
                            <MenuItem value="" sx={{ fontSize: '0.7rem' }}><em>Tahun</em></MenuItem>
                            {YEAR_OPTIONS.map(y => <MenuItem key={y.value} value={y.value} sx={{ fontSize: '0.7rem' }}>{y.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.75rem', color: timeline.gradient[0], fontWeight: 600 }}>
                        {targetValue ? formatMonthYear(targetValue) : '-'}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Info Umum */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(49,162,76,0.04)', border: '1px solid rgba(49,162,76,0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#31A24C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#31A24C' }} />Informasi Umum
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { label: 'Fase Pengajuan', field: 'fase_pengajuan', options: FASE_PENGAJUAN_OPTIONS, labels: FASE_LABELS },
                { label: 'Mekanisme', field: 'mekanisme', options: MEKANISME_OPTIONS, labels: MEKANISME_LABELS },
                { label: 'Pelaksanaan', field: 'pelaksanaan', options: PELAKSANAAN_OPTIONS, labels: PELAKSANAAN_LABELS },
              ].map(({ label, field, options, labels }) => (
                <FormControl fullWidth size="small" key={field}>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>{label}</InputLabel>
                  <Select value={(editFormData as Record<string, string>)[field] || ''} label={label} onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })}
                    sx={{ borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.7)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }, '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 4px 20px rgba(49,162,76,0.12)', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#31A24C', borderWidth: '1.5px' } } }}>
                    {options.map(o => <MenuItem key={o} value={o}>{(labels as Record<string, string>)[o]}</MenuItem>)}
                  </Select>
                </FormControl>
              ))}
              <FormControl fullWidth size="small">
                <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>IKU</InputLabel>
                <Select value={editFormData.iku || ''} label="IKU" onChange={(e) => setEditFormData({ ...editFormData, iku: e.target.value })}
                  sx={{ borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.7)', '&.Mui-focused': { bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#31A24C', borderWidth: '1.5px' } } }}>
                  <MenuItem value="Y">Ya</MenuItem>
                  <MenuItem value="T">Tidak</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Tim */}
            <FormControl fullWidth sx={{ mb: 2, mt: 3 }}>
              <InputLabel id="edit-fs2-team-label" sx={{ '&.Mui-focused': { color: '#31A24C' } }}>Tim *</InputLabel>
              <Select
                labelId="edit-fs2-team-label"
                value={editFormData.team_id || ''}
                label="Tim *"
                disabled={isLoadingTeams}
                onChange={(e) => {
                  const t = teams.find(t => t.id === e.target.value);
                  setEditFormData({ ...editFormData, team_id: e.target.value, pic_id: t?.pic?.uuid || '', anggota_tim: t?.members?.map(m => m.uuid).join(',') || '', anggota_tim_names: t?.members?.map(m => m.fullName).join(', ') || '' });
                }}
                sx={{ borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.7)', '&.Mui-focused': { bgcolor: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#31A24C', borderWidth: '1.5px' } } }}
              >
                <MenuItem value=""><em>Pilih Tim</em></MenuItem>
                {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}{t.pic ? ` (PIC: ${t.pic.fullName})` : ''}</MenuItem>)}
              </Select>
            </FormControl>

            {editFormData.team_id && teams.find(t => t.id === editFormData.team_id) && (() => {
              const selectedTeam = teams.find(t => t.id === editFormData.team_id);
              return (
                <Box sx={{ mb: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(49,162,76,0.05)', border: '1px solid rgba(49,162,76,0.1)' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#86868b', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>Info Tim</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>PIC</Typography>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1d1d1f' }}>{selectedTeam?.pic?.fullName || '-'}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>Jumlah Anggota</Typography>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1d1d1f' }}>{selectedTeam?.members?.length || 0} orang</Typography>
                    </Box>
                  </Box>
                  {selectedTeam?.members && selectedTeam.members.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5 }}>Anggota</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedTeam.members.map(m => (
                          <Chip key={m.uuid} label={m.fullName} size="small" sx={{ bgcolor: 'rgba(49,162,76,0.1)', color: '#31A24C', fontWeight: 500, fontSize: '0.7rem', height: 24 }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })()}
          </Box>

          {/* Dokumen Pengajuan F.S.2 */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(49,162,76,0.04)', border: '1px solid rgba(49,162,76,0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#31A24C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#31A24C' }} />Dokumen Pengajuan F.S.2
            </Typography>
            {fileErrorMessage && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{fileErrorMessage}</Typography>}
            <Box sx={{ mb: 2 }}>
              <TextField label="Nomor ND" size="small" value={editFormData.nomor_nd || ''} onChange={(e) => setEditFormData({ ...editFormData, nomor_nd: e.target.value })} fullWidth />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas ND</Typography>
              {renderDropzone('fs2-modal-edit-nd', isDraggingND, '#31A24C', setIsDraggingND, (e) => handleFileSelect(e, setPendingFilesND), (e) => handleFileDrop(e, setIsDraggingND, setPendingFilesND), pendingFilesND, setPendingFilesND, isUploadingND, () => handleUploadPendingFiles(pendingFilesND, 'ND', setIsUploadingND, setFilesND, setPendingFilesND), filesND, 'ND', setFilesND)}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F.S.2</Typography>
              {renderDropzone('fs2-modal-edit-fs2', isDraggingFS2, '#31A24C', setIsDraggingFS2, (e) => handleFileSelect(e, setPendingFilesFS2), (e) => handleFileDrop(e, setIsDraggingFS2, setPendingFilesFS2), pendingFilesFS2, setPendingFilesFS2, isUploadingFS2, () => handleUploadPendingFiles(pendingFilesFS2, 'FS2', setIsUploadingFS2, setFilesFS2, setPendingFilesFS2, 'tanggal_berkas_fs2'), filesFS2, 'FS2', setFilesFS2, 'tanggal_berkas_fs2')}
            </Box>
          </Box>

          {/* CD Prinsip */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />CD Prinsip Persetujuan FS2
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField label="Nomor CD Prinsip Persetujuan FS2" size="small" value={editFormData.nomor_cd || ''} onChange={(e) => setEditFormData({ ...editFormData, nomor_cd: e.target.value })} fullWidth />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas CD Prinsip Persetujuan FS2</Typography>
              {renderDropzone('fs2-modal-edit-cd', isDraggingCD, '#2563EB', setIsDraggingCD, (e) => handleFileSelect(e, setPendingFilesCD), (e) => handleFileDrop(e, setIsDraggingCD, setPendingFilesCD), pendingFilesCD, setPendingFilesCD, isUploadingCD, () => handleUploadPendingFiles(pendingFilesCD, 'CD', setIsUploadingCD, setFilesCD, setPendingFilesCD), filesCD, 'CD', setFilesCD)}
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F.S.2A</Typography>
              {renderDropzone('fs2-modal-edit-fs2a', isDraggingFS2A, '#2563EB', setIsDraggingFS2A, (e) => handleFileSelect(e, setPendingFilesFS2A), (e) => handleFileDrop(e, setIsDraggingFS2A, setPendingFilesFS2A), pendingFilesFS2A, setPendingFilesFS2A, isUploadingFS2A, () => handleUploadPendingFiles(pendingFilesFS2A, 'FS2A', setIsUploadingFS2A, setFilesFS2A, setPendingFilesFS2A, 'tanggal_berkas_fs2a'), filesFS2A, 'FS2A', setFilesFS2A, 'tanggal_berkas_fs2a')}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F.S.2B</Typography>
              {renderDropzone('fs2-modal-edit-fs2b', isDraggingFS2B, '#2563EB', setIsDraggingFS2B, (e) => handleFileSelect(e, setPendingFilesFS2B), (e) => handleFileDrop(e, setIsDraggingFS2B, setPendingFilesFS2B), pendingFilesFS2B, setPendingFilesFS2B, isUploadingFS2B, () => handleUploadPendingFiles(pendingFilesFS2B, 'FS2B', setIsUploadingFS2B, setFilesFS2B, setPendingFilesFS2B, 'tanggal_berkas_fs2b'), filesFS2B, 'FS2B', setFilesFS2B, 'tanggal_berkas_fs2b')}
            </Box>
          </Box>

          {/* Pengujian */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(217,119,6,0.04)', border: '1px solid rgba(217,119,6,0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D97706' }} />Pengujian
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F45</Typography>
              {renderDropzone('fs2-modal-edit-f45', isDraggingF45, '#D97706', setIsDraggingF45, (e) => handleFileSelect(e, setPendingFilesF45), (e) => handleFileDrop(e, setIsDraggingF45, setPendingFilesF45), pendingFilesF45, setPendingFilesF45, isUploadingF45, () => handleUploadPendingFiles(pendingFilesF45, 'F45', setIsUploadingF45, setFilesF45, setPendingFilesF45, 'tanggal_berkas_f45'), filesF45, 'F45', setFilesF45, 'tanggal_berkas_f45')}
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F46</Typography>
              {renderDropzone('fs2-modal-edit-f46', isDraggingF46, '#D97706', setIsDraggingF46, (e) => handleFileSelect(e, setPendingFilesF46), (e) => handleFileDrop(e, setIsDraggingF46, setPendingFilesF46), pendingFilesF46, setPendingFilesF46, isUploadingF46, () => handleUploadPendingFiles(pendingFilesF46, 'F46', setIsUploadingF46, setFilesF46, setPendingFilesF46, 'tanggal_berkas_f46'), filesF46, 'F46', setFilesF46, 'tanggal_berkas_f46')}
            </Box>
          </Box>

          {/* Deployment */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />Deployment
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas ND/BA Deployment</Typography>
              {renderDropzone('fs2-modal-edit-ndba', isDraggingNDBA, '#7C3AED', setIsDraggingNDBA, (e) => handleFileSelect(e, setPendingFilesNDBA), (e) => handleFileDrop(e, setIsDraggingNDBA, setPendingFilesNDBA), pendingFilesNDBA, setPendingFilesNDBA, isUploadingNDBA, () => handleUploadPendingFiles(pendingFilesNDBA, 'NDBA', setIsUploadingNDBA, setFilesNDBA, setPendingFilesNDBA, 'tanggal_berkas_nd_ba'), filesNDBA, 'NDBA', setFilesNDBA, 'tanggal_berkas_nd_ba')}
            </Box>
          </Box>

          {/* Keterangan */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669' }} />Keterangan
            </Typography>
            <TextField label="Keterangan (Text dan/atau Link URL)" size="small" multiline rows={3} value={editFormData.keterangan || ''} onChange={(e) => setEditFormData({ ...editFormData, keterangan: e.target.value })} fullWidth placeholder="Masukkan keterangan atau link URL..." helperText="Anda dapat memasukkan teks biasa atau link URL" />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: 'transparent' }}>
          <Button onClick={handleClose} sx={{ borderRadius: '12px', px: 3 }}>Batal</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={16} sx={{ color: 'white' }} /> : undefined} sx={{ borderRadius: '12px', px: 3, bgcolor: '#0066cc', '&:hover': { bgcolor: '#0052a3' } }}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog open={datePickerState.open} onClose={() => setDatePickerState(prev => ({ ...prev, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.15)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '0.95rem', pb: 0.5, pt: 2.5, px: 3, color: '#1d1d1f' }}>Tanggal Penyelesaian</DialogTitle>
        <Box sx={{ px: 3, pb: 0.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#6366F1', fontWeight: 600 }}>
            {FS2_TAHAPAN_CONFIG.find(t => t.key === datePickerState.tahapanKey)?.label || datePickerState.tahapanKey}
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <TextField fullWidth type="date" value={datePickerState.value} onChange={(e) => setDatePickerState(prev => ({ ...prev, value: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', '& fieldset': { borderColor: 'rgba(99,102,241,0.25)' }, '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.5)' }, '&.Mui-focused fieldset': { borderColor: '#6366F1' } } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDatePickerState(prev => ({ ...prev, open: false }))} sx={{ borderRadius: '10px', color: '#6B7280', textTransform: 'none', fontWeight: 500 }}>Batal</Button>
          <Button variant="contained" disabled={!datePickerState.value} onClick={() => { if (datePickerState.dateField) setEditFormData(prev => ({ ...prev, [datePickerState.dateField!]: datePickerState.value })); setDatePickerState(prev => ({ ...prev, open: false })); }} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' }, '&:disabled': { bgcolor: 'rgba(99,102,241,0.3)', color: 'white' } }}>
            Simpan Tanggal
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Preview */}
      <FilePreviewModal
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
        fileId={previewFile?.id || null}
        fileName={previewFile?.original_name || ''}
        contentType={previewFile?.content_type || ''}
        onDownload={async () => { if (previewFile) await handleDownloadFile(previewFile); }}
        downloadUrl={previewFile ? `/api/fs2/files/download/${previewFile.id}` : undefined}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default EditFs2MonitoringModal;
