import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, CircularProgress, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip,
  IconButton, Tooltip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { updatePksiApproval, type PksiDocumentData } from '../../api/pksiApi';
import { uploadPksiFiles, getPksiFiles, deletePksiFile, downloadPksiFile, type PksiFileData } from '../../api/pksiFileApi';
import { getAllTeams, type Team } from '../../api/teamApi';
import { getAllSkpa, type SkpaData } from '../../api/skpaApi';
import { StageSelector } from '../StageSelector';
import FilePreviewModal from './FilePreviewModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PksiData {
  id: string; namaPksi: string; namaAplikasi: string;
  picSatkerBA: string; picSatkerUuids: string; bidang: string;
  pic: string; picUuid: string; anggotaTim: string; anggotaTimUuids: string;
  teamId: string; teamName: string; iku: string; inhouseOutsource: string;
  jangkaWaktu: string; tanggalPengajuan: string; linkDocsT01: string;
  jenisPksi: string; isMendesak: boolean; progress: string;
  programRbsi: string; inisiatifRbsi: string;
  anggaranTotal: string; anggaranTahunIni: string; anggaranTahunDepan: string;
  targetUsreq: string[]; targetSit: string[]; targetUat: string[]; targetGoLive: string[];
  targetPengadaan: string[]; targetDesain: string[]; targetCoding: string[];
  targetUnitTest: string[]; targetDeployment: string[];
  statusT01T02: string; berkasT01T02: string; statusT11: string; berkasT11: string;
  statusCd: string; nomorCd: string;
  kontrakTanggalMulai: string; kontrakTanggalSelesai: string;
  kontrakNilai: string; kontrakJumlahTermin: string; kontrakDetailPembayaran: string;
  baDeploy: string;
  tanggalPengadaan: string; tanggalDesain: string; tanggalCoding: string; tanggalUnitTest: string;
  tahapanStatusUsreq: string; tahapanStatusPengadaan: string; tahapanStatusDesain: string;
  tahapanStatusCoding: string; tahapanStatusUnitTest: string; tahapanStatusSit: string;
  tahapanStatusUat: string; tahapanStatusDeployment: string; tahapanStatusSelesai: string;
  isNestedPksi?: boolean; parentPksiId?: string; parentPksiNama?: string;
}

interface TimelinePhases {
  usreq: string[]; sit: string[]; uat: string[]; goLive: string[];
  pengadaan: string[]; desain: string[]; coding: string[]; unitTest: string[]; deployment: string[];
}

type TahapanDateField = 'targetUsreq' | 'tanggalPengadaan' | 'tanggalDesain' | 'tanggalCoding' | 'tanggalUnitTest' | 'targetSit' | 'targetUat' | 'targetGoLive';
type PksiTargetField = 'targetUsreq' | 'targetPengadaan' | 'targetDesain' | 'targetCoding' | 'targetUnitTest' | 'targetSit' | 'targetUat' | 'targetDeployment' | 'targetGoLive';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROGRESS_OPTIONS = [
  'Penyusunan Usreq', 'Pengadaan', 'Desain', 'Coding', 'Unit Test',
  'SIT', 'UAT', 'Deployment', 'Selesai',
] as const;

const TAHAPAN_CONFIG: Array<{
  key: typeof PROGRESS_OPTIONS[number];
  label: string;
  dateField: TahapanDateField | null;
  stageKey: string;
  pksiTargetField: PksiTargetField;
}> = [
  { key: 'Penyusunan Usreq', label: 'Penyusunan Usreq', dateField: 'targetUsreq',      stageKey: 'USREQ',       pksiTargetField: 'targetUsreq' },
  { key: 'Pengadaan',         label: 'Pengadaan',         dateField: 'tanggalPengadaan', stageKey: 'PENGADAAN',   pksiTargetField: 'targetPengadaan' },
  { key: 'Desain',            label: 'Desain',            dateField: 'tanggalDesain',    stageKey: 'DESAIN',      pksiTargetField: 'targetDesain' },
  { key: 'Coding',            label: 'Coding',            dateField: 'tanggalCoding',    stageKey: 'CODING',      pksiTargetField: 'targetCoding' },
  { key: 'Unit Test',         label: 'Unit Test',         dateField: 'tanggalUnitTest',  stageKey: 'UNIT_TEST',   pksiTargetField: 'targetUnitTest' },
  { key: 'SIT',               label: 'SIT',               dateField: 'targetSit',        stageKey: 'SIT',         pksiTargetField: 'targetSit' },
  { key: 'UAT',               label: 'UAT',               dateField: 'targetUat',        stageKey: 'UAT',         pksiTargetField: 'targetUat' },
  { key: 'Deployment',        label: 'Deployment',        dateField: null,               stageKey: 'DEPLOYMENT',  pksiTargetField: 'targetDeployment' },
  { key: 'Selesai',           label: 'Selesai',           dateField: null,               stageKey: 'GO_LIVE',     pksiTargetField: 'targetGoLive' },
];

const TIMELINE_CONFIGS = [
  { key: 'usreq' as const,      label: 'Target Usreq',      gradient: ['#6366F1', '#818CF8'], rgb: '99,102,241' },
  { key: 'sit' as const,        label: 'Target SIT',         gradient: ['#8B5CF6', '#A78BFA'], rgb: '139,92,246' },
  { key: 'uat' as const,        label: 'Target UAT/PDKK',    gradient: ['#F59E0B', '#FCD34D'], rgb: '245,158,11' },
  { key: 'goLive' as const,     label: 'Target Go Live',     gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
  { key: 'pengadaan' as const,  label: 'Target Pengadaan',   gradient: ['#EC4899', '#F472B6'], rgb: '236,72,153' },
  { key: 'desain' as const,     label: 'Target Desain',      gradient: ['#06B6D4', '#22D3EE'], rgb: '6,182,212' },
  { key: 'coding' as const,     label: 'Target Coding',      gradient: ['#8B5CF6', '#D8B4FE'], rgb: '139,92,246' },
  { key: 'unitTest' as const,   label: 'Target Unit Test',   gradient: ['#F59E0B', '#FBBF24'], rgb: '245,158,11' },
  { key: 'deployment' as const, label: 'Target Deployment',  gradient: ['#10B981', '#6EE7B7'], rgb: '16,185,129' },
];

const SKPA_COLORS = [
  { bg: '#DA251C', text: '#FFFFFF' }, { bg: '#2563EB', text: '#FFFFFF' },
  { bg: '#059669', text: '#FFFFFF' }, { bg: '#7C3AED', text: '#FFFFFF' },
  { bg: '#D97706', text: '#FFFFFF' }, { bg: '#0891B2', text: '#FFFFFF' },
  { bg: '#DB2777', text: '#FFFFFF' }, { bg: '#4F46E5', text: '#FFFFFF' },
  { bg: '#65A30D', text: '#FFFFFF' }, { bg: '#DC2626', text: '#FFFFFF' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lastDayOfMonth = (yearMonth: string): string => {
  if (!yearMonth) return '';
  const [y, m] = yearMonth.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(last).padStart(2, '0')}`;
};

const currentMonthValue = () => {
  const now = new Date();
  return lastDayOfMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
};

const getSkpaColor = (code: string) => {
  if (!code) return SKPA_COLORS[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return SKPA_COLORS[Math.abs(hash) % SKPA_COLORS.length];
};

const formatFileSize = (bytes: number | undefined | null): string => {
  if (!bytes) return '0 Bytes';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPreviewable = (ct: string | undefined) =>
  !!ct && (ct.startsWith('image/') || ct === 'application/pdf');

const groupTimelinesByStage = (timelines: PksiDocumentData['timelines']): TimelinePhases => {
  const empty: TimelinePhases = { usreq: [], sit: [], uat: [], goLive: [], pengadaan: [], desain: [], coding: [], unitTest: [], deployment: [] };
  if (!timelines?.length) return empty;
  const map: Record<string, string> = { USREQ: 'usreq', SIT: 'sit', UAT: 'uat', GO_LIVE: 'goLive', PENGADAAN: 'pengadaan', DESAIN: 'desain', CODING: 'coding', UNIT_TEST: 'unitTest', DEPLOYMENT: 'deployment' };
  const stageMap: Record<string, { phase: number; date: string }[]> = {};
  timelines.forEach(t => {
    if (t.stage && t.target_date) {
      (stageMap[t.stage] ??= []).push({ phase: t.phase || 1, date: t.target_date });
    }
  });
  const result = { ...empty };
  Object.keys(stageMap).forEach(stage => {
    const key = map[stage] as keyof TimelinePhases | undefined;
    if (key) result[key] = stageMap[stage].sort((a, b) => a.phase - b.phase).map(i => i.date);
  });
  return result;
};

const transformApiData = (api: PksiDocumentData): PksiData => {
  const tl = api.timelines?.length
    ? groupTimelinesByStage(api.timelines)
    : {
        usreq:      api.target_usreq      ? [api.target_usreq]      : api.tahap1_akhir ? [api.tahap1_akhir] : [],
        sit:        api.target_sit        ? [api.target_sit]        : api.tahap5_akhir ? [api.tahap5_akhir] : [],
        uat:        api.target_uat        ? [api.target_uat]        : [],
        goLive:     api.target_go_live    ? [api.target_go_live]    : api.tahap7_akhir ? [api.tahap7_akhir] : [],
        pengadaan:  api.tanggal_pengadaan ? [api.tanggal_pengadaan] : [],
        desain:     api.tanggal_desain    ? [api.tanggal_desain]    : [],
        coding:     api.tanggal_coding    ? [api.tanggal_coding]    : [],
        unitTest:   api.tanggal_unit_test ? [api.tanggal_unit_test] : [],
        deployment: [],
      };
  return {
    id: api.id,
    namaPksi: api.nama_pksi,
    namaAplikasi: api.nama_aplikasi || '-',
    picSatkerBA: api.pic_satker_names || api.pic_satker_ba || '-',
    picSatkerUuids: api.pic_satker_ba || '',
    bidang: '',
    pic: api.pic_approval_name || api.pic_approval || api.pengelola_aplikasi || '-',
    picUuid: api.pic_approval || '',
    anggotaTim: api.anggota_tim_names || api.anggota_tim || api.pengguna_aplikasi || '-',
    anggotaTimUuids: api.anggota_tim || '',
    teamId: api.team_id || '',
    teamName: api.team_name || '',
    iku: api.iku || '-',
    inhouseOutsource: api.inhouse_outsource || '-',
    jangkaWaktu: '',
    tanggalPengajuan: api.tanggal_pengajuan || api.created_at || '',
    linkDocsT01: '',
    jenisPksi: api.jenis_pksi || '-',
    isMendesak: api.jenis_pksi?.toLowerCase() === 'mendesak',
    progress: api.progress || 'Penyusunan Usreq',
    programRbsi: api.program_rbsi || '-',
    inisiatifRbsi: api.inisiatif_rbsi || api.program_inisiatif_rbsi?.split(' - ')[1] || '-',
    anggaranTotal: api.anggaran_total || '',
    anggaranTahunIni: api.anggaran_tahun_ini || '',
    anggaranTahunDepan: api.anggaran_tahun_depan || '',
    targetUsreq: tl.usreq, targetSit: tl.sit, targetUat: tl.uat, targetGoLive: tl.goLive,
    targetPengadaan: tl.pengadaan, targetDesain: tl.desain, targetCoding: tl.coding,
    targetUnitTest: tl.unitTest, targetDeployment: tl.deployment,
    statusT01T02: api.status_t01_t02 || '',
    berkasT01T02: api.berkas_t01_t02 || '',
    statusT11: api.status_t11 || '',
    berkasT11: api.berkas_t11 || '',
    statusCd: api.status_cd || '',
    nomorCd: api.nomor_cd || '',
    kontrakTanggalMulai: api.kontrak_tanggal_mulai || '',
    kontrakTanggalSelesai: api.kontrak_tanggal_selesai || '',
    kontrakNilai: api.kontrak_nilai || '',
    kontrakJumlahTermin: api.kontrak_jumlah_termin || '',
    kontrakDetailPembayaran: api.kontrak_detail_pembayaran || '',
    baDeploy: api.ba_deploy || '',
    tanggalPengadaan: api.tanggal_pengadaan || '',
    tanggalDesain: api.tanggal_desain || '',
    tanggalCoding: api.tanggal_coding || '',
    tanggalUnitTest: api.tanggal_unit_test || '',
    tahapanStatusUsreq: api.tahapan_status_usreq || '',
    tahapanStatusPengadaan: api.tahapan_status_pengadaan || '',
    tahapanStatusDesain: api.tahapan_status_desain || '',
    tahapanStatusCoding: api.tahapan_status_coding || '',
    tahapanStatusUnitTest: api.tahapan_status_unit_test || '',
    tahapanStatusSit: api.tahapan_status_sit || '',
    tahapanStatusUat: api.tahapan_status_uat || '',
    tahapanStatusDeployment: api.tahapan_status_deployment || '',
    tahapanStatusSelesai: api.tahapan_status_selesai || '',
    isNestedPksi: api.is_nested_pksi || false,
    parentPksiId: api.parent_pksi_id || '',
    parentPksiNama: api.parent_pksi_nama || '',
  };
};

// ─── TimelineStage sub-component ─────────────────────────────────────────────

interface TimelineStageProps {
  label: string; stages: string[]; gradient: string[]; rgb: string;
  onChange: (i: number, v: string) => void;
  onAddPhase: () => void;
  onRemovePhase: (i: number) => void;
  onRemoveStage?: () => void;
}

const TimelineStage: React.FC<TimelineStageProps> = ({ label, stages, gradient, rgb, onChange, onAddPhase, onRemovePhase, onRemoveStage }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 12px rgba(${rgb},0.35)` }}>
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>{stages.length}</Typography>
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d1d1f' }}>{label}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button size="small" startIcon={<AddIcon />} onClick={onAddPhase}
          sx={{ borderRadius: '10px', color: gradient[0], fontWeight: 600, fontSize: '0.7rem', px: 1.5, py: 0.4, textTransform: 'none', background: `rgba(${rgb},0.04)`, border: `1px solid rgba(${rgb},0.25)`, '&:hover': { background: `rgba(${rgb},0.08)` } }}>
          Tambah Fase
        </Button>
        {onRemoveStage && (
          <IconButton size="small" onClick={onRemoveStage} sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>
    </Box>
    <Stack spacing={1.2}>
      {stages.map((date, idx) => (
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1.5, borderRadius: '12px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 3px 12px rgba(0,0,0,0.04)' }}>
          <Box sx={{ minWidth: 32, height: 32, borderRadius: '8px', background: `rgba(${rgb},0.1)`, border: `1.5px solid rgba(${rgb},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: gradient[0] }}>{idx + 1}</Typography>
          </Box>
          <TextField fullWidth size="small" type="month" value={date ? date.substring(0, 7) : ''} onChange={e => onChange(idx, e.target.value)}
            InputLabelProps={{ shrink: true }} placeholder="Pilih bulan"
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', background: `rgba(${rgb},0.04)`, '& fieldset': { border: `1px solid rgba(${rgb},0.15)` }, '&:hover fieldset': { borderColor: `rgba(${rgb},0.3)` }, '&.Mui-focused fieldset': { borderColor: gradient[0], borderWidth: '1.5px' } }, '& .MuiInputBase-input': { fontSize: '0.8rem', fontWeight: 500, py: 1 } }}
          />
          {stages.length > 1 && (
            <IconButton size="small" onClick={() => onRemovePhase(idx)} sx={{ width: 28, height: 28, color: '#86868b', '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.06)' } }}>
              <CloseIcon sx={{ fontSize: 17 }} />
            </IconButton>
          )}
        </Box>
      ))}
    </Stack>
  </Box>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  pksiId: string;
  pksiData: PksiDocumentData;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EditPksiMonitoringModal: React.FC<Props> = ({ open, onClose, pksiId, pksiData, onSuccess }) => {
  const pksi = React.useMemo(() => transformApiData(pksiData), [pksiData]);

  const [editForm, setEditForm] = useState({
    teamId: '', iku: 'ya', inhouseOutsource: 'inhouse', progress: 'Penyusunan Usreq',
    inisiatifRbsi: '', anggaranTotal: '', anggaranTahunIni: '', anggaranTahunDepan: '',
    targetUsreq: '', targetSit: '', targetUat: '', targetGoLive: '',
    targetPengadaan: '', targetDesain: '', targetCoding: '', targetUnitTest: '', targetDeployment: '',
    tanggalPengadaan: '', tanggalDesain: '', tanggalCoding: '', tanggalUnitTest: '',
    statusT01T02: '', berkasT01T02: '', statusT11: '', berkasT11: '',
    statusCd: '', nomorCd: '',
    kontrakTanggalMulai: '', kontrakTanggalSelesai: '', kontrakNilai: '',
    kontrakJumlahTermin: '', kontrakDetailPembayaran: '', baDeploy: '',
  });

  const [timelinePhases, setTimelinePhases] = useState<TimelinePhases>({
    usreq: [currentMonthValue()], sit: [currentMonthValue()], uat: [currentMonthValue()],
    goLive: [currentMonthValue()], pengadaan: [currentMonthValue()], desain: [currentMonthValue()],
    coding: [currentMonthValue()], unitTest: [currentMonthValue()], deployment: [currentMonthValue()],
  });
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set(['usreq', 'sit', 'uat', 'goLive']));
  const [tahapanStatuses, setTahapanStatuses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerState, setDatePickerState] = useState<{ open: boolean; tahapanKey: string; dateField: TahapanDateField | null; value: string }>({ open: false, tahapanKey: '', dateField: null, value: '' });

  const [filesT01, setFilesT01] = useState<PksiFileData[]>([]);
  const [filesT11, setFilesT11] = useState<PksiFileData[]>([]);
  const [pendingT01, setPendingT01] = useState<{ file: File; tanggal: string }[]>([]);
  const [pendingT11, setPendingT11] = useState<{ file: File; tanggal: string }[]>([]);
  const [isDragT01, setIsDragT01] = useState(false);
  const [isDragT11, setIsDragT11] = useState(false);
  const [uploadingT01, setUploadingT01] = useState(false);
  const [uploadingT11, setUploadingT11] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PksiFileData | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [skpaMap, setSkpaMap] = useState<Map<string, SkpaData>>(new Map());

  // Load teams once
  useEffect(() => {
    (async () => {
      setLoadingTeams(true);
      try { setTeams(await getAllTeams()); } catch { setTeams([]); } finally { setLoadingTeams(false); }
    })();
  }, []);

  // Load SKPA map once
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllSkpa();
        const m = new Map<string, SkpaData>();
        (res.data || []).forEach((s: SkpaData) => m.set(s.id, s));
        setSkpaMap(m);
      } catch { /* non-critical */ }
    })();
  }, []);

  // Initialize form when dialog opens
  useEffect(() => {
    if (!open) return;
    const p = transformApiData(pksiData);

    setEditForm({
      teamId: p.teamId || '',
      iku: p.iku !== '-' ? p.iku : 'ya',
      inhouseOutsource: p.inhouseOutsource !== '-' ? p.inhouseOutsource : 'inhouse',
      progress: p.progress || 'Penyusunan Usreq',
      inisiatifRbsi: p.inisiatifRbsi !== '-' ? p.inisiatifRbsi : '',
      anggaranTotal: p.anggaranTotal !== '-' ? p.anggaranTotal : '',
      anggaranTahunIni: p.anggaranTahunIni !== '-' ? p.anggaranTahunIni : '',
      anggaranTahunDepan: p.anggaranTahunDepan !== '-' ? p.anggaranTahunDepan : '',
      targetUsreq: p.targetUsreq.filter(d => d !== '-').join(', '),
      targetSit: p.targetSit.filter(d => d !== '-').join(', '),
      targetUat: p.targetUat.filter(d => d !== '-').join(', '),
      targetGoLive: p.targetGoLive.filter(d => d !== '-').join(', '),
      targetPengadaan: p.targetPengadaan.filter(d => d !== '-').join(', '),
      targetDesain: p.targetDesain.filter(d => d !== '-').join(', '),
      targetCoding: p.targetCoding.filter(d => d !== '-').join(', '),
      targetUnitTest: p.targetUnitTest.filter(d => d !== '-').join(', '),
      targetDeployment: p.targetDeployment.filter(d => d !== '-').join(', '),
      tanggalPengadaan: p.tanggalPengadaan || '',
      tanggalDesain: p.tanggalDesain || '',
      tanggalCoding: p.tanggalCoding || '',
      tanggalUnitTest: p.tanggalUnitTest || '',
      statusT01T02: p.statusT01T02 || '',
      berkasT01T02: p.berkasT01T02 || '',
      statusT11: p.statusT11 || '',
      berkasT11: p.berkasT11 || '',
      statusCd: p.statusCd || '',
      nomorCd: p.nomorCd || '',
      kontrakTanggalMulai: p.kontrakTanggalMulai || '',
      kontrakTanggalSelesai: p.kontrakTanggalSelesai || '',
      kontrakNilai: p.kontrakNilai || '',
      kontrakJumlahTermin: p.kontrakJumlahTermin || '',
      kontrakDetailPembayaran: p.kontrakDetailPembayaran || '',
      baDeploy: p.baDeploy || '',
    });

    // Timeline phases
    const phases: TimelinePhases = {
      usreq:      p.targetUsreq.filter(d => d && d !== '-').length > 0 ? p.targetUsreq.filter(d => d && d !== '-') : [currentMonthValue()],
      sit:        p.targetSit.filter(d => d && d !== '-').length > 0   ? p.targetSit.filter(d => d && d !== '-')   : [currentMonthValue()],
      uat:        p.targetUat.filter(d => d && d !== '-').length > 0   ? p.targetUat.filter(d => d && d !== '-')   : [currentMonthValue()],
      goLive:     p.targetGoLive.filter(d => d && d !== '-').length > 0 ? p.targetGoLive.filter(d => d && d !== '-') : [currentMonthValue()],
      pengadaan:  p.targetPengadaan.filter(d => d && d !== '-').length > 0 ? p.targetPengadaan.filter(d => d && d !== '-') : [currentMonthValue()],
      desain:     p.targetDesain.filter(d => d && d !== '-').length > 0   ? p.targetDesain.filter(d => d && d !== '-')   : [currentMonthValue()],
      coding:     p.targetCoding.filter(d => d && d !== '-').length > 0   ? p.targetCoding.filter(d => d && d !== '-')   : [currentMonthValue()],
      unitTest:   p.targetUnitTest.filter(d => d && d !== '-').length > 0  ? p.targetUnitTest.filter(d => d && d !== '-')  : [currentMonthValue()],
      deployment: p.targetDeployment.filter(d => d && d !== '-').length > 0 ? p.targetDeployment.filter(d => d && d !== '-') : [currentMonthValue()],
    };
    setTimelinePhases(phases);

    const newSelected = new Set<string>();
    if (phases.usreq.length > 0 && p.targetUsreq.some(d => d && d !== '-')) newSelected.add('usreq');
    if (phases.sit.length > 0 && p.targetSit.some(d => d && d !== '-'))     newSelected.add('sit');
    if (phases.uat.length > 0 && p.targetUat.some(d => d && d !== '-'))     newSelected.add('uat');
    if (phases.goLive.length > 0 && p.targetGoLive.some(d => d && d !== '-')) newSelected.add('goLive');
    if (p.targetPengadaan.some(d => d && d !== '-')) newSelected.add('pengadaan');
    if (p.targetDesain.some(d => d && d !== '-'))    newSelected.add('desain');
    if (p.targetCoding.some(d => d && d !== '-'))    newSelected.add('coding');
    if (p.targetUnitTest.some(d => d && d !== '-'))  newSelected.add('unitTest');
    if (p.targetDeployment.some(d => d && d !== '-')) newSelected.add('deployment');
    setSelectedStages(newSelected.size > 0 ? newSelected : new Set(['usreq', 'sit', 'uat', 'goLive']));

    // Tahapan statuses
    const saved: Record<string, string> = {
      'Penyusunan Usreq': p.tahapanStatusUsreq,
      'Pengadaan':         p.tahapanStatusPengadaan,
      'Desain':            p.tahapanStatusDesain,
      'Coding':            p.tahapanStatusCoding,
      'Unit Test':         p.tahapanStatusUnitTest,
      'SIT':               p.tahapanStatusSit,
      'UAT':               p.tahapanStatusUat,
      'Deployment':        p.tahapanStatusDeployment,
      'Selesai':           p.tahapanStatusSelesai,
    };
    if (Object.values(saved).some(v => v)) {
      setTahapanStatuses(saved);
    } else {
      const initIdx = PROGRESS_OPTIONS.indexOf(p.progress as typeof PROGRESS_OPTIONS[number]);
      const init: Record<string, string> = {};
      TAHAPAN_CONFIG.forEach(t => {
        const tIdx = PROGRESS_OPTIONS.indexOf(t.key);
        init[t.key] = tIdx < initIdx ? 'Selesai' : tIdx === initIdx ? 'Dalam proses' : 'Belum dimulai';
      });
      setTahapanStatuses(init);
    }

    // Load files
    (async () => {
      try {
        const files = await getPksiFiles(pksiId);
        const arr = Array.isArray(files) ? files : [];
        const t01 = arr.filter(f => f.file_type === 'T01' || !f.file_type);
        const t11 = arr.filter(f => f.file_type === 'T11');
        setFilesT01(t01);
        setFilesT11(t11);
        if (t01.length > 0) setEditForm(prev => ({ ...prev, statusT01T02: 'Diterima' }));
        if (t11.length > 0) setEditForm(prev => ({ ...prev, statusT11: 'Diterima' }));
      } catch {
        setFilesT01([]);
        setFilesT11([]);
      }
    })();

    // Reset upload states
    setPendingT01([]);
    setPendingT11([]);
    setUploadingT01(false);
    setUploadingT11(false);
    setDownloadingId(null);
  }, [open, pksiData, pksiId]);

  const resolveSkpaCodes = (names: string) =>
    names && names !== '-' ? names.split(',').map(s => s.trim()).filter(Boolean) : [];

  const resolveBidangNames = useCallback((uuids: string) => {
    if (!uuids || uuids === '-') return [];
    const result = new Set<string>();
    uuids.split(',').map(s => s.trim()).forEach(uuid => {
      const s = skpaMap.get(uuid);
      if (s?.bidang?.kode_bidang) result.add(s.bidang.kode_bidang);
    });
    return Array.from(result);
  }, [skpaMap]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleTimelineChange = (stage: keyof TimelinePhases, phaseIndex: number, value: string) => {
    setTimelinePhases(prev => {
      const newDates = [...prev[stage]];
      newDates[phaseIndex] = value ? lastDayOfMonth(value) : '';
      return { ...prev, [stage]: newDates };
    });
  };

  const handleAddPhase    = (stage: keyof TimelinePhases) => setTimelinePhases(prev => ({ ...prev, [stage]: [...prev[stage], currentMonthValue()] }));
  const handleRemovePhase = (stage: keyof TimelinePhases, i: number)  => setTimelinePhases(prev => ({ ...prev, [stage]: prev[stage].filter((_, j) => j !== i) }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const firstDate = (v: string) => v ? v.split(',')[0].trim() || undefined : undefined;
    let effectiveProgress = editForm.progress;
    for (const opt of PROGRESS_OPTIONS) {
      const s = tahapanStatuses[opt] || 'Belum dimulai';
      if (s === 'Dalam proses' || s === 'Selesai') effectiveProgress = opt;
    }
    try {
      await updatePksiApproval(pksiId, {
        iku: editForm.iku,
        inhouse_outsource: editForm.inhouseOutsource,
        team_id: editForm.teamId || undefined,
        progress: effectiveProgress,
        anggaran_total: editForm.anggaranTotal || undefined,
        anggaran_tahun_ini: editForm.anggaranTahunIni || undefined,
        anggaran_tahun_depan: editForm.anggaranTahunDepan || undefined,
        target_usreq:    firstDate(editForm.targetUsreq),
        target_sit:      firstDate(editForm.targetSit),
        target_uat:      firstDate(editForm.targetUat),
        target_go_live:  firstDate(editForm.targetGoLive),
        tanggal_pengadaan:  editForm.tanggalPengadaan || undefined,
        tanggal_desain:     editForm.tanggalDesain    || undefined,
        tanggal_coding:     editForm.tanggalCoding    || undefined,
        tanggal_unit_test:  editForm.tanggalUnitTest  || undefined,
        tahapan_status_usreq:       tahapanStatuses['Penyusunan Usreq'] || undefined,
        tahapan_status_pengadaan:   tahapanStatuses['Pengadaan']        || undefined,
        tahapan_status_desain:      tahapanStatuses['Desain']           || undefined,
        tahapan_status_coding:      tahapanStatuses['Coding']           || undefined,
        tahapan_status_unit_test:   tahapanStatuses['Unit Test']        || undefined,
        tahapan_status_sit:         tahapanStatuses['SIT']              || undefined,
        tahapan_status_uat:         tahapanStatuses['UAT']              || undefined,
        tahapan_status_deployment:  tahapanStatuses['Deployment']       || undefined,
        tahapan_status_selesai:     tahapanStatuses['Selesai']          || undefined,
        status_t01_t02: editForm.statusT01T02 || undefined,
        berkas_t01_t02: editForm.berkasT01T02 || undefined,
        status_t11:     editForm.statusT11    || undefined,
        berkas_t11:     editForm.berkasT11    || undefined,
        status_cd:      editForm.statusCd     || undefined,
        nomor_cd:       editForm.nomorCd      || undefined,
        kontrak_tanggal_mulai:      editForm.kontrakTanggalMulai      || undefined,
        kontrak_tanggal_selesai:    editForm.kontrakTanggalSelesai    || undefined,
        kontrak_nilai:              editForm.kontrakNilai             || undefined,
        kontrak_jumlah_termin:      editForm.kontrakJumlahTermin      || undefined,
        kontrak_detail_pembayaran:  editForm.kontrakDetailPembayaran  || undefined,
        ba_deploy:                  editForm.baDeploy                 || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error('EditPksiMonitoringModal submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFilesT01([]); setFilesT11([]);
    setPendingT01([]); setPendingT11([]);
    setUploadingT01(false); setUploadingT11(false);
    setDownloadingId(null);
    onClose();
  };

  // T01 file ops
  const handleSelectT01 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setPendingT01(prev => [...prev, ...Array.from(e.target.files!).map(f => ({ file: f, tanggal: '' }))]);
    e.target.value = '';
  };
  const handleDropT01 = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); setIsDragT01(false);
    if (e.dataTransfer.files?.length) setPendingT01(prev => [...prev, ...Array.from(e.dataTransfer.files).map(f => ({ file: f, tanggal: '' }))]);
  };
  const handleUploadT01 = async () => {
    if (!pendingT01.length) return;
    setUploadingT01(true);
    try {
      const results: PksiFileData[] = [];
      for (const p of pendingT01) {
        const up = await uploadPksiFiles(pksiId, [p.file], 'T01', p.tanggal || undefined);
        results.push(...(Array.isArray(up) ? up : []));
      }
      setFilesT01(prev => [...prev, ...results]);
      setPendingT01([]);
      setEditForm(prev => ({ ...prev, statusT01T02: 'Diterima' }));
    } catch (err) { console.error(err); } finally { setUploadingT01(false); }
  };
  const handleRemoveT01 = async (id: string) => {
    try {
      await deletePksiFile(id);
      const next = filesT01.filter(f => f.id !== id);
      setFilesT01(next);
      setEditForm(prev => ({ ...prev, statusT01T02: next.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    } catch (err) { console.error(err); }
  };
  const handleDownloadT01 = async (f: PksiFileData) => {
    setDownloadingId(f.id);
    try { await downloadPksiFile(f.id, f.original_name); } catch { } finally { setDownloadingId(null); }
  };

  // T11 file ops
  const handleSelectT11 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setPendingT11(prev => [...prev, ...Array.from(e.target.files!).map(f => ({ file: f, tanggal: '' }))]);
    e.target.value = '';
  };
  const handleDropT11 = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); setIsDragT11(false);
    if (e.dataTransfer.files?.length) setPendingT11(prev => [...prev, ...Array.from(e.dataTransfer.files).map(f => ({ file: f, tanggal: '' }))]);
  };
  const handleUploadT11 = async () => {
    if (!pendingT11.length) return;
    setUploadingT11(true);
    try {
      const results: PksiFileData[] = [];
      for (const p of pendingT11) {
        const up = await uploadPksiFiles(pksiId, [p.file], 'T11', p.tanggal || undefined);
        results.push(...(Array.isArray(up) ? up : []));
      }
      setFilesT11(prev => [...prev, ...results]);
      setPendingT11([]);
      setEditForm(prev => ({ ...prev, statusT11: 'Diterima' }));
    } catch (err) { console.error(err); } finally { setUploadingT11(false); }
  };
  const handleRemoveT11 = async (id: string) => {
    try {
      await deletePksiFile(id);
      const next = filesT11.filter(f => f.id !== id);
      setFilesT11(next);
      setEditForm(prev => ({ ...prev, statusT11: next.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    } catch (err) { console.error(err); }
  };
  const handleDownloadT11 = async (f: PksiFileData) => {
    setDownloadingId(f.id);
    try { await downloadPksiFile(f.id, f.original_name); } catch { } finally { setDownloadingId(null); }
  };

  const inputSx = (color: string) => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '14px',
      backgroundColor: `rgba(${color}, 0.02)`,
      '& fieldset': { borderColor: `rgba(${color}, 0.15)` },
      '&:hover fieldset': { borderColor: `rgba(${color}, 0.4)` },
      '&.Mui-focused fieldset': { borderColor: `rgb(${color})` },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: `rgb(${color})` },
  });

  const selectSx = {
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(10px)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
    '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(217,119,6,0.3)' } },
    '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,1)', boxShadow: '0 4px 20px rgba(217,119,6,0.12)', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D97706', borderWidth: '1.5px' } },
  };

  const fileRowSx = (rgb: string) => ({
    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
    background: `linear-gradient(145deg, rgba(${rgb}, 0.06) 0%, rgba(${rgb}, 0.02) 100%)`,
    borderRadius: '12px', border: `1px solid rgba(${rgb}, 0.15)`,
  });

  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,252,0.9) 100%)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)', maxHeight: '90vh' } }}>

        {/* Title */}
        <DialogTitle sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(250,250,252,0.6) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 2, py: 2.5, px: 3 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(145deg, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0.08) 100%)', border: '1px solid rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(217,119,6,0.15)' }}>
            <EditIcon sx={{ color: '#D97706', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#1d1d1f', letterSpacing: '-0.02em' }}>Edit PKSI</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#86868b', mt: 0.25 }}>{pksi.namaPksi}</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          {/* PKSI Info Header */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '16px', background: 'linear-gradient(145deg, rgba(245,245,247,0.8) 0%, rgba(240,240,242,0.6) 100%)', border: '1px solid rgba(255,255,255,0.8)' }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 2.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Nama Aplikasi</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>{pksi.namaAplikasi}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>SKPA</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {resolveSkpaCodes(pksi.picSatkerBA).length > 0
                    ? resolveSkpaCodes(pksi.picSatkerBA).map((code, i) => {
                        const c = getSkpaColor(code);
                        return <Chip key={i} label={code} size="small" sx={{ bgcolor: c.bg, color: c.text, fontWeight: 600, fontSize: '0.65rem', height: 22, borderRadius: '6px' }} />;
                      })
                    : <Typography sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                  }
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Bidang</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {resolveBidangNames(pksi.picSatkerUuids).length > 0
                    ? resolveBidangNames(pksi.picSatkerUuids).map((b, i) => <Chip key={i} label={b} size="small" sx={{ bgcolor: 'rgba(107,114,128,0.12)', color: '#4B5563', fontWeight: 500, fontSize: '0.65rem', height: 22, borderRadius: '6px' }} />)
                    : <Typography sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                  }
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Jangka Waktu</Typography>
                <Chip label={pksi.jangkaWaktu || '-'} size="small" sx={{ bgcolor: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: '8px' }} />
              </Box>
            </Box>
          </Box>

          {/* RBSI Info */}
          <Box sx={{ mb: 3, p: 2.5, borderRadius: '16px', background: 'linear-gradient(145deg, rgba(217,119,6,0.08) 0%, rgba(251,191,36,0.05) 100%)', border: '1.5px solid rgba(217,119,6,0.2)', boxShadow: '0 4px 16px rgba(217,119,6,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(145deg, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0.08) 100%)', border: '1px solid rgba(217,119,6,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '1.1rem' }}>📋</Typography>
              </Box>
              <Typography sx={{ fontWeight: 600, color: '#D97706', fontSize: '0.9rem' }}>Informasi RBSI</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#92400E', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Inisiatif RBSI</Typography>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.95rem', lineHeight: 1.5 }}>{editForm.inisiatifRbsi || '-'}</Typography>
          </Box>

          <Typography sx={{ fontWeight: 600, color: '#1d1d1f', mb: 2, fontSize: '0.85rem' }}>Informasi Persetujuan</Typography>

          {/* Tim */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ '&.Mui-focused': { color: '#D97706' } }}>Tim *</InputLabel>
            <Select value={editForm.teamId} label="Tim *" onChange={e => setEditForm(p => ({ ...p, teamId: e.target.value }))} disabled={loadingTeams} sx={selectSx}>
              <MenuItem value=""><em>Pilih Tim</em></MenuItem>
              {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}{t.pic ? ` (PIC: ${t.pic.fullName})` : ''}</MenuItem>)}
            </Select>
          </FormControl>

          {editForm.teamId && (() => {
            const t = teams.find(x => x.id === editForm.teamId);
            return t ? (
              <Box sx={{ mb: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.1)' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#86868b', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>Info Tim</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>PIC</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1d1d1f' }}>{t.pic?.fullName || '-'}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>Jumlah Anggota</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1d1d1f' }}>{t.members?.length || 0} orang</Typography>
                  </Box>
                </Box>
                {t.members?.length ? (
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5 }}>Anggota</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {t.members.map(m => <Chip key={m.uuid} label={m.fullName} size="small" sx={{ bgcolor: 'rgba(217,119,6,0.1)', color: '#D97706', fontWeight: 500, fontSize: '0.7rem', height: 24 }} />)}
                    </Box>
                  </Box>
                ) : null}
              </Box>
            ) : null;
          })()}

          {/* IKU + Inhouse */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ '&.Mui-focused': { color: '#D97706' } }}>IKU</InputLabel>
              <Select value={editForm.iku} label="IKU" onChange={e => setEditForm(p => ({ ...p, iku: e.target.value }))} sx={selectSx}>
                <MenuItem value="ya">Ya</MenuItem>
                <MenuItem value="tidak">Tidak</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ '&.Mui-focused': { color: '#D97706' } }}>Inhouse/Outsource</InputLabel>
              <Select value={editForm.inhouseOutsource} label="Inhouse/Outsource" onChange={e => setEditForm(p => ({ ...p, inhouseOutsource: e.target.value }))} sx={selectSx}>
                <MenuItem value="inhouse">Inhouse</MenuItem>
                <MenuItem value="outsource">Outsource</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Progres Tahapan */}
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5, fontSize: '0.85rem' }}>Progres Tahapan</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: '14px', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(217,119,6,0.08)' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#D97706', py: 1.2, width: '22%' }}>Tahapan</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#D97706', py: 1.2, width: '22%' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#D97706', py: 1.2, width: '18%' }}>Tgl. Target</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#D97706', py: 1.2, width: '18%' }}>Tanggal Penyelesaian</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#D97706', py: 1.2 }}>Ketepatan Waktu</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TAHAPAN_CONFIG.filter(tahapan => {
                    const targets = pksi[tahapan.pksiTargetField] as string[];
                    return Array.isArray(targets) && targets.filter(d => d && d !== '-').length > 0;
                  }).map(tahapan => {
                    const status    = tahapanStatuses[tahapan.key] || 'Belum dimulai';
                    const isSelesai = status === 'Selesai';
                    const isDalam   = status === 'Dalam proses';
                    const rowBg     = isSelesai ? 'rgba(21,128,61,0.025)' : isDalam ? 'rgba(217,119,6,0.025)' : 'transparent';
                    const dateValue = tahapan.dateField ? ((editForm as Record<string, string>)[tahapan.dateField] || '').split(',')[0].trim().substring(0, 10) : '';
                    const targetDates = (pksi[tahapan.pksiTargetField] as string[]).filter(d => d && d !== '-');
                    const targetDate  = targetDates.length > 0 ? targetDates[targetDates.length - 1] : null;
                    const displayTarget = targetDate ? targetDate.substring(0, 10) : '—';
                    let kLabel: string | null = null, kColor = '#6B7280', kBg = '#F3F4F6';
                    if (isSelesai && dateValue && targetDate) {
                      if (new Date(dateValue) <= new Date(targetDate)) { kLabel = 'Tepat Waktu'; kColor = '#15803D'; kBg = '#F0FDF4'; }
                      else { kLabel = 'Terlambat'; kColor = '#DC2626'; kBg = '#FEF2F2'; }
                    } else if (isDalam && targetDate) {
                      if (new Date() <= new Date(targetDate)) { kLabel = 'Dalam Waktu'; kColor = '#2563EB'; kBg = '#EFF6FF'; }
                      else { kLabel = 'Melewati Target'; kColor = '#D97706'; kBg = '#FFFBEB'; }
                    }
                    return (
                      <TableRow key={tahapan.key} sx={{ '&:last-child td': { borderBottom: 0 }, bgcolor: rowBg }}>
                        <TableCell sx={{ fontSize: '0.82rem', py: 1, fontWeight: isDalam ? 600 : 400, color: isDalam ? '#D97706' : isSelesai ? '#15803D' : '#1d1d1f' }}>{tahapan.label}</TableCell>
                        <TableCell sx={{ py: 0.7 }}>
                          <Select size="small" value={status} onChange={e => {
                            const newStatus = e.target.value;
                            const newStatuses = { ...tahapanStatuses, [tahapan.key]: newStatus };
                            setTahapanStatuses(newStatuses);
                            let derived = 'Penyusunan Usreq';
                            for (const t of TAHAPAN_CONFIG) { const s = newStatuses[t.key] || 'Belum dimulai'; if (s === 'Selesai' || s === 'Dalam proses') derived = t.key; }
                            if (newStatus === 'Selesai' && tahapan.dateField) {
                              setDatePickerState({ open: true, tahapanKey: tahapan.key, dateField: tahapan.dateField, value: ((editForm as Record<string, string>)[tahapan.dateField] || '').substring(0, 10) });
                              setEditForm(prev => ({ ...prev, progress: derived }));
                            } else {
                              const newForm = tahapan.dateField ? { ...editForm, progress: derived, [tahapan.dateField]: '' } : { ...editForm, progress: derived };
                              setEditForm(newForm);
                            }
                          }}
                            sx={{ fontSize: '0.78rem', height: 30, borderRadius: '8px', color: isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280', fontWeight: 600, bgcolor: isSelesai ? '#F0FDF4' : isDalam ? '#FFFBEB' : '#F3F4F6', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.2)' }, '& .MuiSelect-icon': { color: isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280' }, minWidth: 138 }}>
                            <MenuItem value="Belum dimulai" sx={{ fontSize: '0.78rem' }}>Belum dimulai</MenuItem>
                            <MenuItem value="Dalam proses" sx={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 500 }}>Dalam proses</MenuItem>
                            <MenuItem value="Selesai" sx={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 500 }}>Selesai</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', py: 1, color: targetDate ? '#7C3AED' : '#86868b' }}>{displayTarget}</TableCell>
                        <TableCell sx={{ py: 1 }}>
                          {tahapan.dateField ? (
                            isSelesai && dateValue ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 500 }}>{dateValue}</Typography>
                                <IconButton size="small" onClick={() => setDatePickerState({ open: true, tahapanKey: tahapan.key, dateField: tahapan.dateField!, value: dateValue })} sx={{ p: 0.3, color: '#15803D', '&:hover': { bgcolor: 'rgba(21,128,61,0.1)' } }}>
                                  <EditIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Box>
                            ) : <Typography sx={{ fontSize: '0.78rem', color: '#86868b' }}>—</Typography>
                          ) : <Typography sx={{ fontSize: '0.78rem', color: '#86868b' }}>—</Typography>}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          {kLabel ? <Chip label={kLabel} size="small" sx={{ bgcolor: kBg, color: kColor, fontWeight: 600, fontSize: '0.7rem', height: 20 }} /> : <Typography sx={{ fontSize: '0.78rem', color: '#86868b' }}>—</Typography>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Anggaran */}
          <Box sx={{ mt: 3, mb: 2 }}><Typography sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.85rem' }}>Anggaran</Typography></Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField fullWidth label="Total Anggaran" value={editForm.anggaranTotal} onChange={e => setEditForm(p => ({ ...p, anggaranTotal: e.target.value }))} placeholder="Rp 0" sx={inputSx('37, 99, 235')} />
            <TextField fullWidth label={`Anggaran ${new Date().getFullYear()}`} value={editForm.anggaranTahunIni} onChange={e => setEditForm(p => ({ ...p, anggaranTahunIni: e.target.value }))} placeholder="Rp 0" sx={inputSx('37, 99, 235')} />
            <TextField fullWidth label={`Anggaran ${new Date().getFullYear() + 1}`} value={editForm.anggaranTahunDepan} onChange={e => setEditForm(p => ({ ...p, anggaranTahunDepan: e.target.value }))} placeholder="Rp 0" sx={inputSx('37, 99, 235')} />
          </Box>

          {/* Timeline */}
          <Box sx={{ mt: 3, mb: 2 }}><Typography sx={{ fontWeight: 600, color: '#8B5CF6', fontSize: '0.85rem' }}>Timeline</Typography></Box>
          <StageSelector selectedStages={selectedStages} onStagesChange={setSelectedStages} />
          {TIMELINE_CONFIGS.filter(c => selectedStages.has(c.key)).map(c => (
            <TimelineStage key={c.key} label={c.label} stages={timelinePhases[c.key]} gradient={c.gradient} rgb={c.rgb}
              onChange={(i, v) => handleTimelineChange(c.key, i, v)}
              onAddPhase={() => handleAddPhase(c.key)}
              onRemovePhase={i => handleRemovePhase(c.key, i)}
              onRemoveStage={() => { const s = new Set(selectedStages); s.delete(c.key); setSelectedStages(s); }}
            />
          ))}

          {/* T01 Section */}
          <Box sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 600, color: '#D97706', fontSize: '0.85rem' }}>Rencana PKSI (T01/T02)</Typography>
            <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', background: filesT01.length > 0 ? 'linear-gradient(145deg, rgba(5,150,105,0.15) 0%, rgba(5,150,105,0.08) 100%)' : 'linear-gradient(145deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)', border: filesT01.length > 0 ? '1px solid rgba(5,150,105,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: filesT01.length > 0 ? '#059669' : '#EF4444' }}>{filesT01.length > 0 ? '✓ Diterima' : '○ Belum Diterima'}</Typography>
            </Box>
          </Box>
          <label htmlFor="modal-t01-input" onDragOver={e => { e.preventDefault(); setIsDragT01(true); }} onDragLeave={() => setIsDragT01(false)} onDrop={handleDropT01}
            style={{ display: 'block', border: isDragT01 ? '2px solid #D97706' : '2px dashed rgba(217,119,6,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '16px', textAlign: 'center', background: isDragT01 ? 'rgba(217,119,6,0.08)' : 'rgba(217,119,6,0.03)', cursor: uploadingT01 ? 'not-allowed' : 'pointer', opacity: uploadingT01 ? 0.7 : 1 }}>
            <input id="modal-t01-input" type="file" multiple hidden onChange={handleSelectT01} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" disabled={uploadingT01} />
            {uploadingT01 ? (<><CircularProgress size={48} sx={{ color: '#D97706', mb: 1 }} /><Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>Mengupload file...</Typography></>) : (
              <><Box sx={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(145deg, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0.08) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}><CloudUploadIcon sx={{ fontSize: 26, color: '#D97706' }} /></Box>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem', mb: 0.5 }}>Drop dokumen T01, T02 dan ND Pendukung di sini</Typography>
              <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>atau klik untuk memilih file</Typography></>
            )}
          </label>
          {pendingT01.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5 }}>File akan diupload ({pendingT01.length})</Typography>
              <Stack spacing={1.5}>
                {pendingT01.map((p, i) => (
                  <Box key={i} sx={{ p: 1.5, background: 'rgba(217,119,6,0.05)', borderRadius: '12px', border: '1px solid rgba(217,119,6,0.2)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <FileIcon sx={{ color: '#D97706', fontSize: 18, flexShrink: 0 }} />
                      <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.file.name}</Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(p.file.size)}</Typography>
                      <IconButton size="small" onClick={() => setPendingT01(prev => prev.filter((_, j) => j !== i))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', bgcolor: 'rgba(220,38,38,0.08)' }}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton>
                    </Box>
                    <TextField fullWidth label="Tanggal Dokumen" type="date" size="small" value={p.tanggal} onChange={e => setPendingT01(prev => prev.map((x, j) => j === i ? { ...x, tanggal: e.target.value } : x))} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '&.Mui-focused fieldset': { borderColor: '#D97706' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#D97706' } }} />
                  </Box>
                ))}
              </Stack>
              <Button variant="contained" fullWidth onClick={handleUploadT01} disabled={uploadingT01} startIcon={uploadingT01 ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                sx={{ mt: 1.5, background: 'linear-gradient(145deg, #D97706 0%, #F59E0B 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #B45309 0%, #D97706 100%)' } }}>
                {uploadingT01 ? 'Mengupload...' : `Upload ${pendingT01.length} File T01`}
              </Button>
            </Box>
          )}
          {filesT01.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><FileIcon sx={{ color: '#D97706', fontSize: 18 }} />File yang diupload ({filesT01.length})</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filesT01.map(f => (
                  <Box key={f.id} sx={fileRowSx('217, 119, 6')}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileIcon sx={{ color: '#D97706', fontSize: 18 }} /></Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.display_name || f.original_name || f.file_name || 'File tidak bernama'}</Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem' }}>{formatFileSize(f.file_size)}{f.tanggal_dokumen ? ` • ${new Date(f.tanggal_dokumen).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {isPreviewable(f.content_type) && <Tooltip title="Preview"><IconButton size="small" onClick={() => { setPreviewFile(f); setPreviewOpen(true); }} sx={{ color: '#0891B2', bgcolor: 'rgba(8,145,178,0.08)', width: 32, height: 32, borderRadius: '10px' }}><VisibilityIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>}
                      <Tooltip title="Download"><IconButton size="small" onClick={() => handleDownloadT01(f)} disabled={downloadingId === f.id} sx={{ color: '#059669', bgcolor: 'rgba(5,150,105,0.08)', width: 32, height: 32, borderRadius: '10px' }}>{downloadingId === f.id ? <CircularProgress size={16} sx={{ color: '#059669' }} /> : <DownloadIcon sx={{ fontSize: 16 }} />}</IconButton></Tooltip>
                      <Tooltip title="Hapus"><IconButton size="small" onClick={() => handleRemoveT01(f.id)} sx={{ color: '#DC2626', bgcolor: 'rgba(220,38,38,0.08)', width: 32, height: 32, borderRadius: '10px' }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* T11 Section */}
          <Box sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 600, color: '#059669', fontSize: '0.85rem' }}>Spesifikasi Kebutuhan (T11)</Typography>
            <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', background: filesT11.length > 0 ? 'linear-gradient(145deg, rgba(5,150,105,0.15) 0%, rgba(5,150,105,0.08) 100%)' : 'linear-gradient(145deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)', border: filesT11.length > 0 ? '1px solid rgba(5,150,105,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: filesT11.length > 0 ? '#059669' : '#EF4444' }}>{filesT11.length > 0 ? '✓ Diterima' : '○ Belum Diterima'}</Typography>
            </Box>
          </Box>
          <label htmlFor="modal-t11-input" onDragOver={e => { e.preventDefault(); setIsDragT11(true); }} onDragLeave={() => setIsDragT11(false)} onDrop={handleDropT11}
            style={{ display: 'block', border: isDragT11 ? '2px solid #059669' : '2px dashed rgba(5,150,105,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '16px', textAlign: 'center', background: isDragT11 ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.03)', cursor: uploadingT11 ? 'not-allowed' : 'pointer', opacity: uploadingT11 ? 0.7 : 1 }}>
            <input id="modal-t11-input" type="file" multiple hidden onChange={handleSelectT11} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" disabled={uploadingT11} />
            {uploadingT11 ? (<><CircularProgress size={48} sx={{ color: '#059669', mb: 1 }} /><Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>Mengupload file...</Typography></>) : (
              <><Box sx={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(5,150,105,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}><CloudUploadIcon sx={{ fontSize: 26, color: '#059669' }} /></Box>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem', mb: 0.5 }}>Drop dokumen T11 dan ND Pendukung di sini</Typography>
              <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>atau klik untuk memilih file</Typography></>
            )}
          </label>
          {pendingT11.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5 }}>File akan diupload ({pendingT11.length})</Typography>
              <Stack spacing={1.5}>
                {pendingT11.map((p, i) => (
                  <Box key={i} sx={{ p: 1.5, background: 'rgba(5,150,105,0.05)', borderRadius: '12px', border: '1px solid rgba(5,150,105,0.2)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <FileIcon sx={{ color: '#059669', fontSize: 18, flexShrink: 0 }} />
                      <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.file.name}</Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(p.file.size)}</Typography>
                      <IconButton size="small" onClick={() => setPendingT11(prev => prev.filter((_, j) => j !== i))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', bgcolor: 'rgba(220,38,38,0.08)' }}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton>
                    </Box>
                    <TextField fullWidth label="Tanggal Dokumen" type="date" size="small" value={p.tanggal} onChange={e => setPendingT11(prev => prev.map((x, j) => j === i ? { ...x, tanggal: e.target.value } : x))} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', '&.Mui-focused fieldset': { borderColor: '#059669' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#059669' } }} />
                  </Box>
                ))}
              </Stack>
              <Button variant="contained" fullWidth onClick={handleUploadT11} disabled={uploadingT11} startIcon={uploadingT11 ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                sx={{ mt: 1.5, background: 'linear-gradient(145deg, #059669 0%, #10B981 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #047857 0%, #059669 100%)' } }}>
                {uploadingT11 ? 'Mengupload...' : `Upload ${pendingT11.length} File T11`}
              </Button>
            </Box>
          )}
          {filesT11.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><FileIcon sx={{ color: '#059669', fontSize: 18 }} />File yang diupload ({filesT11.length})</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filesT11.map(f => (
                  <Box key={f.id} sx={fileRowSx('5, 150, 105')}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileIcon sx={{ color: '#059669', fontSize: 18 }} /></Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.display_name || f.original_name || f.file_name || 'File tidak bernama'}</Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem' }}>{formatFileSize(f.file_size)}{f.tanggal_dokumen ? ` • ${new Date(f.tanggal_dokumen).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {isPreviewable(f.content_type) && <Tooltip title="Preview"><IconButton size="small" onClick={() => { setPreviewFile(f); setPreviewOpen(true); }} sx={{ color: '#0891B2', bgcolor: 'rgba(8,145,178,0.08)', width: 32, height: 32, borderRadius: '10px' }}><VisibilityIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>}
                      <Tooltip title="Download"><IconButton size="small" onClick={() => handleDownloadT11(f)} disabled={downloadingId === f.id} sx={{ color: '#059669', bgcolor: 'rgba(5,150,105,0.08)', width: 32, height: 32, borderRadius: '10px' }}>{downloadingId === f.id ? <CircularProgress size={16} sx={{ color: '#059669' }} /> : <DownloadIcon sx={{ fontSize: 16 }} />}</IconButton></Tooltip>
                      <Tooltip title="Hapus"><IconButton size="small" onClick={() => handleRemoveT11(f.id)} sx={{ color: '#DC2626', bgcolor: 'rgba(220,38,38,0.08)', width: 32, height: 32, borderRadius: '10px' }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* CD Prinsip */}
          <Box sx={{ mt: 3, mb: 2 }}><Typography sx={{ fontWeight: 600, color: '#DC2626', fontSize: '0.85rem' }}>CD Prinsip</Typography></Box>
          <TextField fullWidth label="Nomor CD Prinsip" value={editForm.nomorCd} onChange={e => setEditForm(p => ({ ...p, nomorCd: e.target.value }))} placeholder="Contoh: CD-001/PCS8/2026" sx={{ mb: 2, ...inputSx('220, 38, 38') }} />

          {/* Kontrak */}
          <Box sx={{ mt: 3, mb: 2 }}><Typography sx={{ fontWeight: 600, color: '#0891B2', fontSize: '0.85rem' }}>Kontrak</Typography></Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField fullWidth label="Tanggal Mulai" type="date" value={editForm.kontrakTanggalMulai} onChange={e => setEditForm(p => ({ ...p, kontrakTanggalMulai: e.target.value }))} InputLabelProps={{ shrink: true }} sx={inputSx('8, 145, 178')} />
            <TextField fullWidth label="Tanggal Selesai" type="date" value={editForm.kontrakTanggalSelesai} onChange={e => setEditForm(p => ({ ...p, kontrakTanggalSelesai: e.target.value }))} InputLabelProps={{ shrink: true }} sx={inputSx('8, 145, 178')} />
            <TextField fullWidth label="Nilai Kontrak" value={editForm.kontrakNilai} onChange={e => setEditForm(p => ({ ...p, kontrakNilai: e.target.value }))} placeholder="Rp 0" sx={inputSx('8, 145, 178')} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField fullWidth label="Jumlah Termin" value={editForm.kontrakJumlahTermin} onChange={e => setEditForm(p => ({ ...p, kontrakJumlahTermin: e.target.value }))} placeholder="0" sx={inputSx('8, 145, 178')} />
            <TextField fullWidth label="Detail Pembayaran" value={editForm.kontrakDetailPembayaran} onChange={e => setEditForm(p => ({ ...p, kontrakDetailPembayaran: e.target.value }))} placeholder="Detail pembayaran termin" sx={inputSx('8, 145, 178')} />
          </Box>

          {/* BA Deploy */}
          <Box sx={{ mt: 3, mb: 2 }}><Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>BA Deploy</Typography></Box>
          <TextField fullWidth label="Link BA Deploy" value={editForm.baDeploy} onChange={e => setEditForm(p => ({ ...p, baDeploy: e.target.value }))} placeholder="https://example.com/ba-deploy.pdf atau nama dokumen"
            helperText="Masukkan URL lengkap untuk dokumen BA Deploy"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.7)', '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' }, '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.3)' }, '&.Mui-focused fieldset': { borderColor: '#D97706' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#D97706' } }} />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, background: 'linear-gradient(180deg, rgba(250,250,252,0.6) 0%, rgba(245,245,247,0.8) 100%)', borderTop: '1px solid rgba(0,0,0,0.04)', gap: 1.5 }}>
          <Button onClick={handleCancel} sx={{ color: '#64748B', fontWeight: 500, px: 3, py: 1, borderRadius: '12px', fontSize: '0.875rem', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!editForm.teamId || isSubmitting} variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', fontWeight: 600, px: 3, py: 1, borderRadius: '12px', textTransform: 'none', fontSize: '0.875rem', boxShadow: '0 4px 16px rgba(217,119,6,0.3)', '&:hover': { background: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)', boxShadow: '0 6px 24px rgba(217,119,6,0.4)', transform: 'translateY(-1px)' }, '&:disabled': { background: 'rgba(217,119,6,0.3)', color: 'rgba(255,255,255,0.7)', boxShadow: 'none' } }}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog open={datePickerState.open} onClose={() => setDatePickerState(p => ({ ...p, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.15)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '0.95rem', pb: 0.5, pt: 2.5, px: 3, color: '#1d1d1f' }}>Tanggal Penyelesaian</DialogTitle>
        <Box sx={{ px: 3, pb: 0.5 }}><Typography sx={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 600 }}>{datePickerState.tahapanKey}</Typography></Box>
        <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <TextField fullWidth type="date" value={datePickerState.value} onChange={e => setDatePickerState(p => ({ ...p, value: e.target.value }))} InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', '& fieldset': { borderColor: 'rgba(21,128,61,0.25)' }, '&:hover fieldset': { borderColor: 'rgba(21,128,61,0.5)' }, '&.Mui-focused fieldset': { borderColor: '#15803D' } } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDatePickerState(p => ({ ...p, open: false }))} sx={{ borderRadius: '10px', color: '#6B7280', textTransform: 'none', fontWeight: 500 }}>Batal</Button>
          <Button variant="contained" disabled={!datePickerState.value}
            onClick={() => { if (datePickerState.dateField) setEditForm(p => ({ ...p, [datePickerState.dateField!]: datePickerState.value })); setDatePickerState(p => ({ ...p, open: false })); }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, bgcolor: '#15803D', boxShadow: '0 4px 12px rgba(21,128,61,0.3)', '&:hover': { bgcolor: '#166534' }, '&:disabled': { bgcolor: 'rgba(21,128,61,0.3)', color: 'white' } }}>
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
        onDownload={async () => {
          if (previewFile) { setDownloadingId(previewFile.id); try { await downloadPksiFile(previewFile.id, previewFile.original_name); } catch {} finally { setDownloadingId(null); } }
        }}
        downloadUrl={`/api/pksi/files/download/${previewFile?.id}`}
      />
    </>
  );
};

export default EditPksiMonitoringModal;
