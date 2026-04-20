import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Popover,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id as localeId } from 'date-fns/locale/id';
import {
  Search as SearchIcon,
  Add as AddIcon,
  TuneRounded,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  PushPin as PushPinIcon,
  AssessmentRounded,
  Download as DownloadIcon,
  CalendarMonth as CalendarIcon,
  AttachFile as AttachFileIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { searchPksiDocumentsForMonitoring, updatePksiApproval, type PksiDocumentData } from '../api/pksiApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { getUserRoles } from '../api/authApi';
import { ViewPksiModal, FilePreviewModal } from '../components/modals';
import { StageSelector } from '../components/StageSelector';
import { useSidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '../context/SidebarContext';
import { 
  uploadPksiFiles, 
  getPksiFiles, 
  deletePksiFile, 
  downloadPksiFile,
  type PksiFileData 
} from '../api/pksiFileApi';
import { getAllTeams, type Team } from '../api/teamApi';

// Interface untuk data PKSI (transformed from API)
interface PksiData {
  id: string;
  namaPksi: string;
  namaAplikasi: string;
  picSatkerBA: string; // Display value: kode_skpa names (e.g., "DIMB, DLIK")
  picSatkerUuids: string; // Original UUIDs for bidang lookup
  bidang: string;
  pic: string;
  picUuid: string;
  anggotaTim: string;
  anggotaTimUuids: string;
  teamId: string;
  teamName: string;
  iku: string;
  inhouseOutsource: string;
  jangkaWaktu: string;
  tanggalPengajuan: string;
  linkDocsT01: string;
  jenisPksi: string;
  isMendesak: boolean;
  progress: string;
  // New fields
  programRbsi: string;
  inisiatifRbsi: string;
  // Anggaran
  anggaranTotal: string;
  anggaranTahunIni: string;
  anggaranTahunDepan: string;
  // Timeline (supports multiple phases per stage - 9 stages total)
  targetUsreq: string[];
  targetSit: string[];
  targetUat: string[];
  targetGoLive: string[];
  targetPengadaan: string[];
  targetDesain: string[];
  targetCoding: string[];
  targetUnitTest: string[];
  targetDeployment: string[];
  // Rencana PKSI (T01/T02)
  statusT01T02: string;
  berkasT01T02: string;
  // Spesifikasi Kebutuhan (T11)
  statusT11: string;
  berkasT11: string;
  // CD Prinsip
  statusCd: string;
  nomorCd: string;
  // Kontrak
  kontrakTanggalMulai: string;
  kontrakTanggalSelesai: string;
  kontrakNilai: string;
  kontrakJumlahTermin: string;
  kontrakDetailPembayaran: string;
  // BA Deploy
  baDeploy: string;
  // Per-tahapan completion dates
  tanggalPengadaan: string;
  tanggalDesain: string;
  tanggalCoding: string;
  tanggalUnitTest: string;
  // Per-tahapan statuses
  tahapanStatusUsreq: string;
  tahapanStatusPengadaan: string;
  tahapanStatusDesain: string;
  tahapanStatusCoding: string;
  tahapanStatusUnitTest: string;
  tahapanStatusSit: string;
  tahapanStatusUat: string;
  tahapanStatusDeployment: string;
  tahapanStatusSelesai: string;
  // Nested PKSI fields
  isNestedPksi?: boolean;
  parentPksiId?: string;
  parentPksiNama?: string;
}

// Progress options for PKSI Disetujui
const PROGRESS_OPTIONS = [
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

type TahapanDateField = 'targetUsreq' | 'tanggalPengadaan' | 'tanggalDesain' | 'tanggalCoding' | 'tanggalUnitTest' | 'targetSit' | 'targetUat' | 'targetGoLive';
type PksiTargetField = 'targetUsreq' | 'targetPengadaan' | 'targetDesain' | 'targetCoding' | 'targetUnitTest' | 'targetSit' | 'targetUat' | 'targetDeployment' | 'targetGoLive';

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

const calculateJangkaWaktu = (apiData: PksiDocumentData): string => {
  const startDates = [apiData.tahap1_awal, apiData.tahap5_awal, apiData.tahap7_awal]
    .filter(Boolean)
    .map(d => new Date(d!));
  
  const endDates = [apiData.tahap1_akhir, apiData.tahap5_akhir, apiData.tahap7_akhir]
    .filter(Boolean)
    .map(d => new Date(d!));

  if (startDates.length === 0 || endDates.length === 0) {
    return 'Single Year';
  }

  const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
  const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

  const startYear = earliestStart.getFullYear();
  const endYear = latestEnd.getFullYear();

  if (startYear === endYear) {
    return 'Single Year';
  } else {
    return `Multiyears ${startYear}-${endYear}`;
  }
};

// Helper to group timelines by stage and extract dates
const groupTimelinesByStage = (timelines: any[] | undefined): {
  usreq: string[];
  sit: string[];
  uat: string[];
  goLive: string[];
  pengadaan: string[];
  desain: string[];
  coding: string[];
  unitTest: string[];
  deployment: string[];
} => {
  if (!timelines || timelines.length === 0) {
    return { usreq: [], sit: [], uat: [], goLive: [], pengadaan: [], desain: [], coding: [], unitTest: [], deployment: [] };
  }

  const groups = {
    usreq: [] as string[],
    sit: [] as string[],
    uat: [] as string[],
    goLive: [] as string[],
    pengadaan: [] as string[],
    desain: [] as string[],
    coding: [] as string[],
    unitTest: [] as string[],
    deployment: [] as string[],
  };

  // Map backend stage names to group keys
  const stageToGroupKey: { [key: string]: keyof typeof groups } = {
    'USREQ': 'usreq',
    'SIT': 'sit',
    'UAT': 'uat',
    'GO_LIVE': 'goLive',
    'PENGADAAN': 'pengadaan',
    'DESAIN': 'desain',
    'CODING': 'coding',
    'UNIT_TEST': 'unitTest',
    'DEPLOYMENT': 'deployment',
  };

  // Group by stage dynamically
  const stageMap: { [key: string]: { phase: number; date: string }[] } = {};

  timelines.forEach(t => {
    if (t.stage && t.target_date) {
      if (!stageMap[t.stage]) {
        stageMap[t.stage] = [];
      }
      stageMap[t.stage].push({ phase: t.phase || 1, date: t.target_date });
    }
  });

  // Sort by phase and extract dates
  Object.keys(stageMap).forEach(stage => {
    const sorted = stageMap[stage].sort((a, b) => a.phase - b.phase);
    const dates = sorted.map(item => item.date);
    
    const groupKey = stageToGroupKey[stage];
    if (groupKey) {
      groups[groupKey] = dates;
    }
  });

  return groups;
};

// Transform API data to UI format
const transformApiData = (apiData: PksiDocumentData): PksiData => {
  const jangkaWaktu = calculateJangkaWaktu(apiData);
  
  // Parse timelines - prefer new flexible structure, fallback to legacy
  const timelineGroups = apiData.timelines && apiData.timelines.length > 0
    ? groupTimelinesByStage(apiData.timelines)
    : {
        usreq: apiData.target_usreq ? [apiData.target_usreq] : (apiData.tahap1_akhir ? [apiData.tahap1_akhir] : []),
        pengadaan: apiData.tanggal_pengadaan ? [apiData.tanggal_pengadaan] : [],
        desain: apiData.tanggal_desain ? [apiData.tanggal_desain] : [],
        coding: apiData.tanggal_coding ? [apiData.tanggal_coding] : [],
        unitTest: apiData.tanggal_unit_test ? [apiData.tanggal_unit_test] : [],
        sit: apiData.target_sit ? [apiData.target_sit] : (apiData.tahap5_akhir ? [apiData.tahap5_akhir] : []),
        uat: apiData.target_uat ? [apiData.target_uat] : [],
        deployment: [],
        goLive: apiData.target_go_live ? [apiData.target_go_live] : (apiData.tahap7_akhir ? [apiData.tahap7_akhir] : []),
      };
  
  return {
    id: apiData.id,
    namaPksi: apiData.nama_pksi,
    namaAplikasi: apiData.nama_aplikasi || '-',
    picSatkerBA: apiData.pic_satker_names || apiData.pic_satker_ba || '-',
    picSatkerUuids: apiData.pic_satker_ba || '',
    bidang: '',
    pic: apiData.pic_approval_name || apiData.pic_approval || apiData.pengelola_aplikasi || '-',
    picUuid: apiData.pic_approval || '',
    anggotaTim: apiData.anggota_tim_names || apiData.anggota_tim || apiData.pengguna_aplikasi || '-',
    anggotaTimUuids: apiData.anggota_tim || '',
    teamId: apiData.team_id || '',
    teamName: apiData.team_name || '',
    iku: apiData.iku || '-',
    inhouseOutsource: apiData.inhouse_outsource || '-',
    jangkaWaktu: jangkaWaktu,
    tanggalPengajuan: apiData.tanggal_pengajuan || apiData.created_at || '',
    linkDocsT01: '',
    jenisPksi: apiData.jenis_pksi || '-',
    isMendesak: apiData.jenis_pksi?.toLowerCase() === 'mendesak',
    progress: apiData.progress || 'Penyusunan Usreq',
    programRbsi: apiData.program_rbsi || apiData.program_inisiatif_rbsi?.split(' - ')[0] || '-',
    inisiatifRbsi: apiData.inisiatif_rbsi || apiData.program_inisiatif_rbsi?.split(' - ')[1] || '-',
    // Anggaran
    anggaranTotal: apiData.anggaran_total || '',
    anggaranTahunIni: apiData.anggaran_tahun_ini || '',
    anggaranTahunDepan: apiData.anggaran_tahun_depan || '',
    // Timeline
    targetUsreq: timelineGroups.usreq,
    targetPengadaan: timelineGroups.pengadaan,
    targetDesain: timelineGroups.desain,
    targetCoding: timelineGroups.coding,
    targetUnitTest: timelineGroups.unitTest,
    targetSit: timelineGroups.sit,
    targetUat: timelineGroups.uat,
    targetDeployment: timelineGroups.deployment,
    targetGoLive: timelineGroups.goLive,
    // Rencana PKSI (T01/T02)
    statusT01T02: apiData.status_t01_t02 || '',
    berkasT01T02: apiData.berkas_t01_t02 || '',
    // Spesifikasi Kebutuhan (T11)
    statusT11: apiData.status_t11 || '',
    berkasT11: apiData.berkas_t11 || '',
    // CD Prinsip
    statusCd: apiData.status_cd || '',
    nomorCd: apiData.nomor_cd || '',
    // Kontrak
    kontrakTanggalMulai: apiData.kontrak_tanggal_mulai || '',
    kontrakTanggalSelesai: apiData.kontrak_tanggal_selesai || '',
    kontrakNilai: apiData.kontrak_nilai || '',
    kontrakJumlahTermin: apiData.kontrak_jumlah_termin || '',
    kontrakDetailPembayaran: apiData.kontrak_detail_pembayaran || '',
    // BA Deploy
    baDeploy: apiData.ba_deploy || '',
    // Per-tahapan completion dates
    tanggalPengadaan: apiData.tanggal_pengadaan || '',
    tanggalDesain: apiData.tanggal_desain || '',
    tanggalCoding: apiData.tanggal_coding || '',
    tanggalUnitTest: apiData.tanggal_unit_test || '',
    // Per-tahapan statuses
    tahapanStatusUsreq: apiData.tahapan_status_usreq || '',
    tahapanStatusPengadaan: apiData.tahapan_status_pengadaan || '',
    tahapanStatusDesain: apiData.tahapan_status_desain || '',
    tahapanStatusCoding: apiData.tahapan_status_coding || '',
    tahapanStatusUnitTest: apiData.tahapan_status_unit_test || '',
    tahapanStatusSit: apiData.tahapan_status_sit || '',
    tahapanStatusUat: apiData.tahapan_status_uat || '',
    tahapanStatusDeployment: apiData.tahapan_status_deployment || '',
    tahapanStatusSelesai: apiData.tahapan_status_selesai || '',
    // Nested PKSI fields
    isNestedPksi: apiData.is_nested_pksi || false,
    parentPksiId: apiData.parent_pksi_id || '',
    parentPksiNama: apiData.parent_pksi_nama || '',
  };
};

// Color palette for SKPA chips
const SKPA_COLORS = [
  { bg: '#DA251C', text: '#FFFFFF' },
  { bg: '#2563EB', text: '#FFFFFF' },
  { bg: '#059669', text: '#FFFFFF' },
  { bg: '#7C3AED', text: '#FFFFFF' },
  { bg: '#D97706', text: '#FFFFFF' },
  { bg: '#0891B2', text: '#FFFFFF' },
  { bg: '#DB2777', text: '#FFFFFF' },
  { bg: '#4F46E5', text: '#FFFFFF' },
  { bg: '#65A30D', text: '#FFFFFF' },
  { bg: '#DC2626', text: '#FFFFFF' },
];

// Generate consistent color based on SKPA code
const getSkpaColor = (skpaCode: string): { bg: string; text: string } => {
  if (!skpaCode) return SKPA_COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < skpaCode.length; i++) {
    hash = skpaCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SKPA_COLORS.length;
  return SKPA_COLORS[index];
};

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

// Helper functions for timeline phase management
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

// Timeline configuration with styling
interface TimelinePhases {
  usreq: string[];
  sit: string[];
  uat: string[];
  goLive: string[];
  pengadaan: string[];
  desain: string[];
  coding: string[];
  unitTest: string[];
  deployment: string[];
}

const TIMELINE_CONFIGS = [
  { key: 'usreq' as const, label: 'Target Usreq', stage: 'USREQ', gradient: ['#6366F1', '#818CF8'], rgb: '99,102,241' },
  { key: 'sit' as const, label: 'Target SIT', stage: 'SIT', gradient: ['#8B5CF6', '#A78BFA'], rgb: '139,92,246' },
  { key: 'uat' as const, label: 'Target UAT/PDKK', stage: 'UAT', gradient: ['#F59E0B', '#FCD34D'], rgb: '245,158,11' },
  { key: 'goLive' as const, label: 'Target Go Live', stage: 'GO_LIVE', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
  { key: 'pengadaan' as const, label: 'Target Pengadaan', stage: 'PENGADAAN', gradient: ['#EC4899', '#F472B6'], rgb: '236,72,153' },
  { key: 'desain' as const, label: 'Target Desain', stage: 'DESAIN', gradient: ['#06B6D4', '#22D3EE'], rgb: '6,182,212' },
  { key: 'coding' as const, label: 'Target Coding', stage: 'CODING', gradient: ['#8B5CF6', '#D8B4FE'], rgb: '139,92,246' },
  { key: 'unitTest' as const, label: 'Target Unit Test', stage: 'UNIT_TEST', gradient: ['#F59E0B', '#FBBF24'], rgb: '245,158,11' },
  { key: 'deployment' as const, label: 'Target Deployment', stage: 'DEPLOYMENT', gradient: ['#10B981', '#6EE7B7'], rgb: '16,185,129' },
];

interface TimelineStageProps {
  label: string;
  stages: string[];
  gradient: string[];
  rgb: string;
  onChange: (phaseIndex: number, value: string) => void;
  onAddPhase: () => void;
  onRemovePhase: (phaseIndex: number) => void;
  onRemoveStage?: () => void;
}

const TimelineStage = ({ label, stages, gradient, rgb, onChange, onAddPhase, onRemovePhase, onRemoveStage }: TimelineStageProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '10px',
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 12px rgba(${rgb},0.35)`,
          }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>
              {stages.length}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d1d1f', letterSpacing: '-0.01em' }}>
            {label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddPhase}
            sx={{
              borderRadius: '10px',
            borderColor: `rgba(${rgb},0.25)`,
            color: gradient[0],
            fontWeight: 600,
            fontSize: '0.7rem',
            px: 1.5,
            py: 0.4,
            textTransform: 'none',
            background: `rgba(${rgb},0.04)`,
            border: `1px solid rgba(${rgb},0.25)`,
            '&:hover': {
              borderColor: gradient[0],
              background: `rgba(${rgb},0.08)`,
            },
          }}
        >
          Tambah Fase
        </Button>
        {onRemoveStage && (
          <IconButton
            size="small"
            onClick={onRemoveStage}
            sx={{
              color: '#EF4444',
              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        </Box>
      </Box>

      <Stack spacing={1.2}>
        {stages.map((date, phaseIndex) => (
          <Box
            key={phaseIndex}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              p: 1.5,
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                borderColor: `rgba(${rgb},0.2)`,
              },
            }}
          >
            <Box sx={{
              minWidth: 32,
              height: 32,
              borderRadius: '8px',
              background: `rgba(${rgb},0.1)`,
              border: `1.5px solid rgba(${rgb},0.25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: gradient[0] }}>
                {phaseIndex + 1}
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              type="month"
              value={date ? date.substring(0, 7) : ''}
              onChange={(e) => onChange(phaseIndex, e.target.value)}
              InputLabelProps={{ shrink: true }}
              placeholder="Pilih bulan"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: `rgba(${rgb},0.04)`,
                  '& fieldset': { border: `1px solid rgba(${rgb},0.15)` },
                  '&:hover fieldset': { borderColor: `rgba(${rgb},0.3)` },
                  '&.Mui-focused fieldset': { borderColor: gradient[0], borderWidth: '1.5px' },
                },
                '& .MuiInputBase-input': { fontSize: '0.8rem', color: '#1d1d1f', fontWeight: 500, py: 1 },
              }}
            />

            {stages.length > 1 && (
              <IconButton
                size="small"
                onClick={() => onRemovePhase(phaseIndex)}
                sx={{
                  width: 28,
                  height: 28,
                  color: '#86868b',
                  '&:hover': { color: '#DC2626', bgcolor: 'rgba(220,38,38,0.06)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 17 }} />
              </IconButton>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

function PksiDisetujui() {
  const { isCollapsed } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [keyword, setKeyword] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pksiData, setPksiData] = useState<PksiData[]>([]);
  const [rawPksiData, setRawPksiData] = useState<PksiDocumentData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalCount, setTotalCount] = useState(0); // Total count for DataCountDisplay
  const [noInisiatifCount, setNoInisiatifCount] = useState(0); // Count of PKSI without initiative
  const [isLoading, setIsLoading] = useState(false);

  // Get user info for department-based filtering
  const userInfoStorage = localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
  const userInfo = useMemo(() => userInfoStorage ? JSON.parse(userInfoStorage) : null, [userInfoStorage]);
  const userDepartment = useMemo(() => userInfo?.department || '', [userInfo]);
  const userRoles: string[] = useMemo(() => userInfo?.roles || [], [userInfo]);
  const isAdminOrPengembang = useMemo(() => userRoles.some((role: string) => 
    role.toLowerCase() === 'admin' || role.toLowerCase() === 'pengembang'
  ), [userRoles]);

  // SKPA full lookup data (for resolving Bidang info)
  const [skpaFullMap, setSkpaFullMap] = useState<Map<string, SkpaData>>(new Map());

  // Filter state (applied filters - used for API calls)
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJangkaWaktu, setSelectedJangkaWaktu] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedAplikasi, setSelectedAplikasi] = useState<string>('');
  const [selectedSkpa, setSelectedSkpa] = useState<Set<string>>(new Set());
  const [selectedProgress, setSelectedProgress] = useState<Set<string>>(new Set());
  const [selectedIku, setSelectedIku] = useState<string>('');
  const [selectedInhouseOutsource, setSelectedInhouseOutsource] = useState<string>('');
  const [selectedBidang, setSelectedBidang] = useState<Set<string>>(new Set());
  const [selectedPic, setSelectedPic] = useState<Set<string>>(new Set());
  const [noInisiatif, setNoInisiatif] = useState(false); // Filter for PKSI with no initiative
  
  // Temporary filter state (for popup editing - not yet applied)
  const [tempJangkaWaktu, setTempJangkaWaktu] = useState<Set<string>>(new Set());
  const [tempYear, setTempYear] = useState<string>('');
  const [tempAplikasi, setTempAplikasi] = useState<string>('');
  const [tempSkpa, setTempSkpa] = useState<Set<string>>(new Set());
  const [tempProgress, setTempProgress] = useState<Set<string>>(new Set());
  const [tempIku, setTempIku] = useState<string>('');
  const [tempInhouseOutsource, setTempInhouseOutsource] = useState<string>('');
  const [tempBidang, setTempBidang] = useState<Set<string>>(new Set());
  const [tempPic, setTempPic] = useState<Set<string>>(new Set());
  const [tempNoInisiatif, setTempNoInisiatif] = useState(false);
  const [tempTimelineStage, setTempTimelineStage] = useState<string>('');
  const [tempTimelineFromDate, setTempTimelineFromDate] = useState<Date | null>(null);
  const [tempTimelineToDate, setTempTimelineToDate] = useState<Date | null>(null);
  
  // Year filter (exposed in toolbar) - default to current year
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>(new Date().getFullYear().toString());

  // Timeline filter state (applied filters)
  const [selectedTimelineStage, setSelectedTimelineStage] = useState<string>('');
  const [selectedTimelineFromDate, setSelectedTimelineFromDate] = useState<Date | null>(null);
  const [selectedTimelineToDate, setSelectedTimelineToDate] = useState<Date | null>(null);
  
  // Extract month and year from timeline dates for API
  const selectedTimelineFromMonth = selectedTimelineFromDate ? (selectedTimelineFromDate.getMonth() + 1).toString() : '';
  const selectedTimelineFromYear = selectedTimelineFromDate ? selectedTimelineFromDate.getFullYear().toString() : '';
  const selectedTimelineToMonth = selectedTimelineToDate ? (selectedTimelineToDate.getMonth() + 1).toString() : '';

  // Sticky columns configuration
  const [stickyColumnsAnchorEl, setStickyColumnsAnchorEl] = useState<null | HTMLElement>(null);
  const [stickyColumns, setStickyColumns] = useState<Set<string>>(new Set(['no', 'namaAplikasi', 'namaPksi']));
  
  // Column definitions for sticky configuration
  const COLUMN_OPTIONS = [
    { id: 'no', label: 'No', width: 50 },
    { id: 'namaAplikasi', label: 'Nama Aplikasi', width: 160 },
    { id: 'namaPksi', label: 'Nama PKSI', width: 180 },
    { id: 'skpa', label: 'SKPA', width: 100 },
    { id: 'bidang', label: 'Bidang', width: 120 },
    { id: 'inisiatifRbsi', label: 'Inisiatif RBSI', width: 160 },
    { id: 'pic', label: 'PIC', width: 140 },
  ];

  // Calculate sticky left positions based on selected columns
  const getStickyLeft = useCallback((columnId: string): number | undefined => {
    if (!stickyColumns.has(columnId)) return undefined;
    
    const orderedSticky = COLUMN_OPTIONS.filter(col => stickyColumns.has(col.id));
    const colIndex = orderedSticky.findIndex(col => col.id === columnId);
    if (colIndex === -1) return undefined;
    
    let left = 0;
    for (let i = 0; i < colIndex; i++) {
      left += orderedSticky[i].width;
    }
    return left;
  }, [stickyColumns]);

  const isLastStickyColumn = useCallback((columnId: string): boolean => {
    if (!stickyColumns.has(columnId)) return false;
    const orderedSticky = COLUMN_OPTIONS.filter(col => stickyColumns.has(col.id));
    return orderedSticky[orderedSticky.length - 1]?.id === columnId;
  }, [stickyColumns]);

  const handleStickyColumnToggle = (columnId: string) => {
    setStickyColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  // Timeline columns visibility configuration
  const [timelineColumnsAnchorEl, setTimelineColumnsAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleTimelineColumns, setVisibleTimelineColumns] = useState<Set<string>>(
    new Set(['usreq', 'sit', 'uat', 'goLive'])
  );

  const TIMELINE_COLUMN_OPTIONS = [
    { id: 'usreq', label: 'USREQ' },
    { id: 'pengadaan', label: 'Pengadaan' },
    { id: 'desain', label: 'Desain' },
    { id: 'coding', label: 'Coding' },
    { id: 'unitTest', label: 'Unit Test' },
    { id: 'sit', label: 'SIT' },
    { id: 'uat', label: 'UAT/PDKK' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'goLive', label: 'Go Live' },
  ];

  const handleTimelineColumnToggle = (columnId: string) => {
    setVisibleTimelineColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        // Prevent removing the last column
        if (newSet.size > 1) {
          newSet.delete(columnId);
        }
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const handleShowDefaultTimelineColumns = () => {
    setVisibleTimelineColumns(new Set(['usreq', 'sit', 'uat', 'goLive']));
  };

  const handleShowAllTimelineColumns = () => {
    setVisibleTimelineColumns(new Set(TIMELINE_COLUMN_OPTIONS.map(col => col.id)));
  };

  // View modal state
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPksiIdForView, setSelectedPksiIdForView] = useState<string | null>(null);
  const [viewingNestedPksiInfo, setViewingNestedPksiInfo] = useState<{isNested: boolean, nestedName?: string, parentName?: string} | null>(null);

  // Edit approval dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedPksiForEdit, setSelectedPksiForEdit] = useState<PksiData | null>(null);
  const [editForm, setEditForm] = useState({
    teamId: '',
    iku: 'ya',
    inhouseOutsource: 'inhouse',
    progress: 'Penyusunan Usreq',
    // New fields
    programRbsi: '',
    inisiatifRbsi: '',
    anggaranTotal: '',
    anggaranTahunIni: '',
    anggaranTahunDepan: '',
    targetUsreq: '',
    targetSit: '',
    targetUat: '',
    targetGoLive: '',
    targetPengadaan: '',
    targetDesain: '',
    targetCoding: '',
    targetUnitTest: '',
    targetDeployment: '',
    tanggalPengadaan: '',
    tanggalDesain: '',
    tanggalCoding: '',
    tanggalUnitTest: '',
    statusT01T02: '',
    berkasT01T02: '',
    statusT11: '',
    berkasT11: '',
    statusCd: '',
    nomorCd: '',
    kontrakTanggalMulai: '',
    kontrakTanggalSelesai: '',
    kontrakNilai: '',
    kontrakJumlahTermin: '',
    kontrakDetailPembayaran: '',
    baDeploy: '',
  });

  // Timeline phases state for phase-based editing
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhases>({
    usreq: [currentMonthValue()],
    sit: [currentMonthValue()],
    uat: [currentMonthValue()],
    goLive: [currentMonthValue()],
    pengadaan: [currentMonthValue()],
    desain: [currentMonthValue()],
    coding: [currentMonthValue()],
    unitTest: [currentMonthValue()],
    deployment: [currentMonthValue()],
  });

  // Selected stages to display in timeline (for dynamic form)
  const [selectedStages, setSelectedStages] = useState<Set<string>>(
    new Set(['usreq', 'sit', 'uat', 'goLive'])
  );

  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Per-tahapan individual statuses (independent selects)
  const [tahapanStatuses, setTahapanStatuses] = useState<Record<string, string>>({});

  // Date picker dialog state (opened when status = Selesai)
  const [datePickerState, setDatePickerState] = useState<{
    open: boolean;
    tahapanKey: string;
    dateField: TahapanDateField | null;
    value: string;
  }>({ open: false, tahapanKey: '', dateField: null, value: '' });

  // File upload state for T01 and T11 - API-based
  const [filesT01Data, setFilesT01Data] = useState<PksiFileData[]>([]);
  const [filesT11Data, setFilesT11Data] = useState<PksiFileData[]>([]);
  const [pendingFilesT01, setPendingFilesT01] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesT11, setPendingFilesT11] = useState<Array<{ file: File; tanggal: string }>>([]); 
  const [isDraggingT01, setIsDraggingT01] = useState(false);
  const [isDraggingT11, setIsDraggingT11] = useState(false);
  const [isUploadingT01, setIsUploadingT01] = useState(false);
  const [isUploadingT11, setIsUploadingT11] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<PksiFileData | null>(null);

  // File list dialog state (for View button in table)
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileDialogTitle, setFileDialogTitle] = useState('');
  const [fileDialogFiles, setFileDialogFiles] = useState<PksiFileData[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Teams for selection
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      try {
        const teamList = await getAllTeams();
        setTeams(teamList);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        setTeams([]);
      } finally {
        setIsLoadingTeams(false);
      }
    };
    
    fetchTeams();
  }, []);

  const handleViewClick = (item: PksiData) => {
    // If nested PKSI, show parent detail instead with explanation
    if (item.isNestedPksi && item.parentPksiId) {
      setSelectedPksiIdForView(item.parentPksiId);
      setViewingNestedPksiInfo({
        isNested: true,
        nestedName: item.namaPksi,
        parentName: item.parentPksiNama,
      });
    } else {
      setSelectedPksiIdForView(item.id);
      setViewingNestedPksiInfo(null);
    }
    setOpenViewModal(true);
  };

  const handleEditClick = async (pksi: PksiData) => {
    setSelectedPksiForEdit(pksi);
    
    setEditForm({
      teamId: pksi.teamId || '',
      iku: pksi.iku !== '-' ? pksi.iku : 'ya',
      inhouseOutsource: pksi.inhouseOutsource !== '-' ? pksi.inhouseOutsource : 'inhouse',
      progress: pksi.progress || 'Penyusunan Usreq',
      // New fields
      programRbsi: pksi.programRbsi !== '-' ? pksi.programRbsi : '',
      inisiatifRbsi: pksi.inisiatifRbsi !== '-' ? pksi.inisiatifRbsi : '',
      anggaranTotal: pksi.anggaranTotal !== '-' ? pksi.anggaranTotal : '',
      anggaranTahunIni: pksi.anggaranTahunIni !== '-' ? pksi.anggaranTahunIni : '',
      anggaranTahunDepan: pksi.anggaranTahunDepan !== '-' ? pksi.anggaranTahunDepan : '',
      // Convert timeline arrays to strings for form display
      targetUsreq: Array.isArray(pksi.targetUsreq) ? pksi.targetUsreq.filter(d => d !== '-').join(', ') : (pksi.targetUsreq !== '-' ? pksi.targetUsreq : ''),
      targetSit: Array.isArray(pksi.targetSit) ? pksi.targetSit.filter(d => d !== '-').join(', ') : (pksi.targetSit !== '-' ? pksi.targetSit : ''),
      targetUat: Array.isArray(pksi.targetUat) ? pksi.targetUat.filter(d => d !== '-').join(', ') : (pksi.targetUat !== '-' ? pksi.targetUat : ''),
      targetGoLive: Array.isArray(pksi.targetGoLive) ? pksi.targetGoLive.filter(d => d !== '-').join(', ') : (pksi.targetGoLive !== '-' ? pksi.targetGoLive : ''),
      targetPengadaan: Array.isArray(pksi.targetPengadaan) ? pksi.targetPengadaan.filter(d => d !== '-').join(', ') : (pksi.targetPengadaan !== '-' ? pksi.targetPengadaan : ''),
      targetDesain: Array.isArray(pksi.targetDesain) ? pksi.targetDesain.filter(d => d !== '-').join(', ') : (pksi.targetDesain !== '-' ? pksi.targetDesain : ''),
      targetCoding: Array.isArray(pksi.targetCoding) ? pksi.targetCoding.filter(d => d !== '-').join(', ') : (pksi.targetCoding !== '-' ? pksi.targetCoding : ''),
      targetUnitTest: Array.isArray(pksi.targetUnitTest) ? pksi.targetUnitTest.filter(d => d !== '-').join(', ') : (pksi.targetUnitTest !== '-' ? pksi.targetUnitTest : ''),
      targetDeployment: Array.isArray(pksi.targetDeployment) ? pksi.targetDeployment.filter(d => d !== '-').join(', ') : (pksi.targetDeployment !== '-' ? pksi.targetDeployment : ''),
      tanggalPengadaan: pksi.tanggalPengadaan || '',
      tanggalDesain: pksi.tanggalDesain || '',
      tanggalCoding: pksi.tanggalCoding || '',
      tanggalUnitTest: pksi.tanggalUnitTest || '',
      statusT01T02: pksi.statusT01T02 !== '-' ? pksi.statusT01T02 : '',
      berkasT01T02: pksi.berkasT01T02 !== '-' ? pksi.berkasT01T02 : '',
      statusT11: pksi.statusT11 !== '-' ? pksi.statusT11 : '',
      berkasT11: pksi.berkasT11 !== '-' ? pksi.berkasT11 : '',
      statusCd: pksi.statusCd !== '-' ? pksi.statusCd : '',
      nomorCd: pksi.nomorCd !== '-' ? pksi.nomorCd : '',
      kontrakTanggalMulai: pksi.kontrakTanggalMulai !== '-' ? pksi.kontrakTanggalMulai : '',
      kontrakTanggalSelesai: pksi.kontrakTanggalSelesai !== '-' ? pksi.kontrakTanggalSelesai : '',
      kontrakNilai: pksi.kontrakNilai !== '-' ? pksi.kontrakNilai : '',
      kontrakJumlahTermin: pksi.kontrakJumlahTermin !== '-' ? pksi.kontrakJumlahTermin : '',
      kontrakDetailPembayaran: pksi.kontrakDetailPembayaran !== '-' ? pksi.kontrakDetailPembayaran : '',
      baDeploy: pksi.baDeploy !== '-' ? pksi.baDeploy : '',
    });

    // Initialize timeline phases from pksi data (arrays)
    const newSelectedStages = new Set<string>();
    
    const initTimelinePhases: TimelinePhases = {
      usreq: Array.isArray(pksi.targetUsreq) ? pksi.targetUsreq.filter(d => d && d !== '-') : (pksi.targetUsreq && pksi.targetUsreq !== '-' ? [pksi.targetUsreq] : [currentMonthValue()]),
      sit: Array.isArray(pksi.targetSit) ? pksi.targetSit.filter(d => d && d !== '-') : (pksi.targetSit && pksi.targetSit !== '-' ? [pksi.targetSit] : [currentMonthValue()]),
      uat: Array.isArray(pksi.targetUat) ? pksi.targetUat.filter(d => d && d !== '-') : (pksi.targetUat && pksi.targetUat !== '-' ? [pksi.targetUat] : [currentMonthValue()]),
      goLive: Array.isArray(pksi.targetGoLive) ? pksi.targetGoLive.filter(d => d && d !== '-') : (pksi.targetGoLive && pksi.targetGoLive !== '-' ? [pksi.targetGoLive] : [currentMonthValue()]),
      pengadaan: [currentMonthValue()],
      desain: [currentMonthValue()],
      coding: [currentMonthValue()],
      unitTest: [currentMonthValue()],
      deployment: [currentMonthValue()],
    };
    
    // Set selectedStages based on existing data
    if (initTimelinePhases.usreq.length > 0) newSelectedStages.add('usreq');
    if (initTimelinePhases.sit.length > 0) newSelectedStages.add('sit');
    if (initTimelinePhases.uat.length > 0) newSelectedStages.add('uat');
    if (initTimelinePhases.goLive.length > 0) newSelectedStages.add('goLive');
    if (initTimelinePhases.pengadaan.length > 0) newSelectedStages.add('pengadaan');
    if (initTimelinePhases.desain.length > 0) newSelectedStages.add('desain');
    if (initTimelinePhases.coding.length > 0) newSelectedStages.add('coding');
    if (initTimelinePhases.unitTest.length > 0) newSelectedStages.add('unitTest');
    if (initTimelinePhases.deployment.length > 0) newSelectedStages.add('deployment');
    
    setTimelinePhases(initTimelinePhases);
    setSelectedStages(newSelectedStages.size > 0 ? newSelectedStages : new Set(['usreq', 'sit', 'uat', 'goLive']));
    
    // Load existing files for this PKSI
    // setIsLoadingFiles(true);
    try {
      const files = await getPksiFiles(pksi.id);
      console.log(`[Edit] Loaded ${files.length} files for PKSI ${pksi.id}:`, files);
      // Ensure files is an array and handle potential null/undefined response
      const fileArray = Array.isArray(files) ? files : [];
      // Separate T01 and T11 files based on file_type field
      const t01Files = fileArray.filter(f => f.file_type === 'T01' || !f.file_type);
      const t11Files = fileArray.filter(f => f.file_type === 'T11');
      console.log(`[Edit] T01 files: ${t01Files.length}, T11 files: ${t11Files.length}`);
      setFilesT01Data(t01Files);
      setFilesT11Data(t11Files);
      // Update status based on files
      if (t01Files.length > 0) {
        setEditForm(prev => ({ ...prev, statusT01T02: 'Diterima' }));
      }
      if (t11Files.length > 0) {
        setEditForm(prev => ({ ...prev, statusT11: 'Diterima' }));
      }
    } catch (error) {
      console.error('Failed to load existing files:', error);
      setFilesT01Data([]);
      setFilesT11Data([]);
    } finally {
      // setIsLoadingFiles(false);
    }

    // Initialize per-tahapan statuses from saved API data (fallback to progress-derived)
    const savedStatuses: Record<string, string> = {
      'Penyusunan Usreq': pksi.tahapanStatusUsreq,
      'Pengadaan':         pksi.tahapanStatusPengadaan,
      'Desain':            pksi.tahapanStatusDesain,
      'Coding':            pksi.tahapanStatusCoding,
      'Unit Test':         pksi.tahapanStatusUnitTest,
      'SIT':               pksi.tahapanStatusSit,
      'UAT':               pksi.tahapanStatusUat,
      'Deployment':        pksi.tahapanStatusDeployment,
      'Selesai':           pksi.tahapanStatusSelesai,
    };
    // If no statuses saved yet, derive from progress
    const hasSavedStatuses = Object.values(savedStatuses).some(v => v && v.length > 0);
    if (hasSavedStatuses) {
      setTahapanStatuses(savedStatuses);
    } else {
      const initProgress = pksi.progress || 'Penyusunan Usreq';
      const initProgressIdx = PROGRESS_OPTIONS.indexOf(initProgress as typeof PROGRESS_OPTIONS[number]);
      const initStatuses: Record<string, string> = {};
      TAHAPAN_CONFIG.forEach((t) => {
        const tIdx = PROGRESS_OPTIONS.indexOf(t.key);
        initStatuses[t.key] = tIdx < initProgressIdx ? 'Selesai' : tIdx === initProgressIdx ? 'Dalam proses' : 'Belum dimulai';
      });
      setTahapanStatuses(initStatuses);
    }

    setOpenEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPksiForEdit) return;

    setIsSubmittingEdit(true);
    // Helper: extract first date from a possibly comma-separated string
    const firstDate = (val: string) => val ? val.split(',')[0].trim() || undefined : undefined;

    // Derive effective progress from tahapan statuses (last one that is Dalam proses or Selesai)
    let effectiveProgress = editForm.progress;
    for (const option of PROGRESS_OPTIONS) {
      const s = tahapanStatuses[option] || 'Belum dimulai';
      if (s === 'Dalam proses' || s === 'Selesai') {
        effectiveProgress = option;
      }
    }

    try {
      await updatePksiApproval(selectedPksiForEdit.id, {
        iku: editForm.iku,
        inhouse_outsource: editForm.inhouseOutsource,
        team_id: editForm.teamId || undefined,
        progress: effectiveProgress,
        // New fields (removed program_rbsi, inisiatif_rbsi is read-only)
        anggaran_total: editForm.anggaranTotal || undefined,
        anggaran_tahun_ini: editForm.anggaranTahunIni || undefined,
        anggaran_tahun_depan: editForm.anggaranTahunDepan || undefined,
        target_usreq: firstDate(editForm.targetUsreq),
        target_sit: firstDate(editForm.targetSit),
        target_uat: firstDate(editForm.targetUat),
        target_go_live: firstDate(editForm.targetGoLive),
        tanggal_pengadaan: editForm.tanggalPengadaan || undefined,
        tanggal_desain: editForm.tanggalDesain || undefined,
        tanggal_coding: editForm.tanggalCoding || undefined,
        tanggal_unit_test: editForm.tanggalUnitTest || undefined,
        tahapan_status_usreq: tahapanStatuses['Penyusunan Usreq'] || undefined,
        tahapan_status_pengadaan: tahapanStatuses['Pengadaan'] || undefined,
        tahapan_status_desain: tahapanStatuses['Desain'] || undefined,
        tahapan_status_coding: tahapanStatuses['Coding'] || undefined,
        tahapan_status_unit_test: tahapanStatuses['Unit Test'] || undefined,
        tahapan_status_sit: tahapanStatuses['SIT'] || undefined,
        tahapan_status_uat: tahapanStatuses['UAT'] || undefined,
        tahapan_status_deployment: tahapanStatuses['Deployment'] || undefined,
        tahapan_status_selesai: tahapanStatuses['Selesai'] || undefined,
        status_t01_t02: editForm.statusT01T02 || undefined,
        berkas_t01_t02: editForm.berkasT01T02 || undefined,
        status_t11: editForm.statusT11 || undefined,
        berkas_t11: editForm.berkasT11 || undefined,
        status_cd: editForm.statusCd || undefined,
        nomor_cd: editForm.nomorCd || undefined,
        kontrak_tanggal_mulai: editForm.kontrakTanggalMulai || undefined,
        kontrak_tanggal_selesai: editForm.kontrakTanggalSelesai || undefined,
        kontrak_nilai: editForm.kontrakNilai || undefined,
        kontrak_jumlah_termin: editForm.kontrakJumlahTermin || undefined,
        kontrak_detail_pembayaran: editForm.kontrakDetailPembayaran || undefined,
        ba_deploy: editForm.baDeploy || undefined,
      });
      
      // Refresh data
      fetchPksiData();
      setOpenEditDialog(false);
      setSelectedPksiForEdit(null);
      setTahapanStatuses({});
      // Reset file states
      setFilesT01Data([]);
      setFilesT11Data([]);
      setPendingFilesT01([]);
      setPendingFilesT11([]);
      // setIsLoadingFiles(false);
      setIsUploadingT01(false);
      setIsUploadingT11(false);
      setDownloadingFileId(null);
    } catch (error) {
      console.error('Error updating PKSI:', error);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Timeline phase handlers
  const handleTimelineChange = (stage: keyof TimelinePhases, phaseIndex: number, value: string) => {
    setTimelinePhases(prev => {
      const updated = { ...prev };
      const newDates = [...updated[stage]];
      newDates[phaseIndex] = value ? lastDayOfMonth(value) : '';
      updated[stage] = newDates;
      return updated;
    });
  };

  const handleAddPhase = (stage: keyof TimelinePhases) => {
    setTimelinePhases(prev => ({
      ...prev,
      [stage]: [...prev[stage], currentMonthValue()],
    }));
  };

  const handleRemovePhase = (stage: keyof TimelinePhases, phaseIndex: number) => {
    setTimelinePhases(prev => ({
      ...prev,
      [stage]: prev[stage].filter((_, i) => i !== phaseIndex),
    }));
  };

  const handleEditCancel = () => {
    setOpenEditDialog(false);
    setSelectedPksiForEdit(null);
    setTahapanStatuses({});
    // Reset file states
    setFilesT01Data([]);
    setFilesT11Data([]);
    setPendingFilesT01([]);
    setPendingFilesT11([]);
    // setIsLoadingFiles(false);
    setIsUploadingT01(false);
    setIsUploadingT11(false);
    setDownloadingFileId(null);
  };

  // Fetch PKSI data from API - only approved
  const fetchPksiData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Parse year filter for backend API
      const yearFilter = selectedYearFilter ? parseInt(selectedYearFilter, 10) : undefined;
      
      // Parse timeline filter parameters
      // If both from and to dates are set, ensure they're in the same year for this implementation
      const timelineYear = selectedTimelineFromDate ? selectedTimelineFromDate.getFullYear() : undefined;
      const timelineFromMonth = selectedTimelineFromMonth ? parseInt(selectedTimelineFromMonth, 10) : undefined;
      const timelineToMonth = selectedTimelineToMonth ? parseInt(selectedTimelineToMonth, 10) : undefined;

      const response = await searchPksiDocumentsForMonitoring({
        search: keyword || undefined,
        status: 'DISETUJUI',
        year: yearFilter,
        noInisiatif: noInisiatif || undefined,
        timelineStage: selectedTimelineStage || undefined,
        timelineFromMonth: timelineFromMonth,
        timelineToMonth: timelineToMonth,
        timelineYear: timelineYear,
        page: page,
        size: rowsPerPage,
        sortBy: 'namaPksi',
        sortDir: 'asc',
      });

      // DEBUG: Log response and user department
      console.log('=== DEBUG PKSI DISETUJUI ===');
      console.log('User Department:', userDepartment);
      console.log('User Roles:', userRoles);
      console.log('Is Admin/Pengembang:', isAdminOrPengembang);
      console.log('Year Filter:', yearFilter);
      console.log('No Inisiatif Filter:', noInisiatif);
      console.log('Timeline Filter:', { stage: selectedTimelineStage, fromMonth: timelineFromMonth, toMonth: timelineToMonth, year: timelineYear });
      console.log('PKSI Response:', response);
      console.log('Total Elements:', response.total_elements);
      console.log('Total Count:', response.total_count);
      console.log('===========================');

      // Store raw data for year filtering
      setRawPksiData(response.content);
      
      let transformedData = response.content.map(transformApiData);
      
      // Filter by user department if not Admin/Pengembang
      if (!isAdminOrPengembang && userDepartment) {
        console.log('Filtering by department:', userDepartment);
        transformedData = transformedData.filter(pksi => {
          const skpaCodes = pksi.picSatkerBA.split(',').map(s => s.trim().toUpperCase());
          const matches = skpaCodes.includes(userDepartment.toUpperCase());
          console.log(`PKSI "${pksi.namaPksi}" - SKPA: [${skpaCodes.join(', ')}] - Matches ${userDepartment}: ${matches}`);
          return matches;
        });
        console.log('Filtered count:', transformedData.length);
      }
      
      setPksiData(transformedData);
      setTotalElements(isAdminOrPengembang ? response.total_elements : transformedData.length);
      setTotalCount(response.total_count || response.total_elements); // Use total_count from API
      
      // Fetch count of PKSI without initiative (for the clickable card)
      try {
        const noInisiatifResponse = await searchPksiDocumentsForMonitoring({
          status: 'DISETUJUI',
          year: selectedYear ? parseInt(selectedYear, 10) : undefined,
          noInisiatif: true,
          page: 0,
          size: 1, // We only need the count
        });
        setNoInisiatifCount(noInisiatifResponse.total_count || noInisiatifResponse.total_elements);
      } catch (countError) {
        console.error('Failed to fetch noInisiatif count:', countError);
        setNoInisiatifCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch PKSI data:', error);
      setPksiData([]);
      setTotalElements(0);
      setTotalCount(0);
      setNoInisiatifCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, rowsPerPage, selectedYearFilter, noInisiatif, selectedTimelineStage, selectedTimelineFromMonth, selectedTimelineToMonth, selectedTimelineFromYear, userDepartment, userRoles, isAdminOrPengembang]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    // Only fetch if there's at least one filter active
    const hasActiveFilter = keyword || selectedYearFilter || noInisiatif || selectedTimelineStage || selectedTimelineFromMonth || selectedTimelineToMonth;
    
    if (hasActiveFilter) {
      fetchPksiData();
    } else {
      // Clear data if no filters are active
      setPksiData([]);
      setTotalElements(0);
      setTotalCount(0);
      setNoInisiatifCount(0);
      setIsLoading(false);
    }
  }, [fetchPksiData, keyword, selectedYearFilter, noInisiatif, selectedTimelineStage, selectedTimelineFromMonth, selectedTimelineToMonth]);

  // Auto-open modal when id parameter is present in URL
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && pksiData.length > 0 && !isLoading && !openEditDialog) {
      const pksi = pksiData.find(p => p.id === idParam);
      if (pksi) {
        // Remove id param from URL to avoid re-triggering
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        setSearchParams(newParams, { replace: true });
        // Open modal
        handleViewClick(pksi);
      }
    }
  }, [pksiData, isLoading, searchParams, openEditDialog]);

  // Fetch SKPA lookup data (for Bidang resolution)
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const skpaResponse = await getAllSkpa();
        
        const skpaFullLookup = new Map<string, SkpaData>();
        (skpaResponse.data || []).forEach((skpa) => {
          skpaFullLookup.set(skpa.id, skpa);
        });
        setSkpaFullMap(skpaFullLookup);
      } catch (error) {
        console.error('Failed to fetch lookup data:', error);
      }
    };
    fetchLookupData();
  }, []);

  // Helper function to parse SKPA codes from pic_satker_names (comma-separated string from backend)
  const resolveSkpaCodes = useCallback((picSatkerNames: string): string[] => {
    if (!picSatkerNames || picSatkerNames === '-') return [];
    
    // Backend now sends comma-separated kode_skpa values directly (e.g., "DIMB, DLIK")
    return picSatkerNames.split(',').map(s => s.trim()).filter(Boolean);
  }, []);

  // Helper function to resolve Bidang abbreviations from SKPA UUIDs
  const resolveBidangNames = useCallback((picSatkerUuids: string): string[] => {
    if (!picSatkerUuids || picSatkerUuids === '-') return [];
    
    // picSatkerUuids contains comma-separated UUIDs
    const uuids = picSatkerUuids.split(',').map(g => g.trim()).filter(Boolean);
    const bidangNames = new Set<string>();
    uuids.forEach(uuid => {
      const skpa = skpaFullMap.get(uuid);
      if (skpa?.bidang?.kode_bidang) {
        bidangNames.add(skpa.bidang.kode_bidang);
      }
    });
    return Array.from(bidangNames);
  }, [skpaFullMap]);

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Copy current applied filters to temporary state
    setTempJangkaWaktu(new Set(selectedJangkaWaktu));
    setTempYear(selectedYear);
    setTempAplikasi(selectedAplikasi);
    setTempSkpa(new Set(selectedSkpa));
    setTempProgress(new Set(selectedProgress));
    setTempIku(selectedIku);
    setTempInhouseOutsource(selectedInhouseOutsource);
    setTempBidang(new Set(selectedBidang));
    setTempPic(new Set(selectedPic));
    setTempNoInisiatif(noInisiatif);
    setTempTimelineStage(selectedTimelineStage);
    setTempTimelineFromDate(selectedTimelineFromDate);
    setTempTimelineToDate(selectedTimelineToDate);
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyFilter = () => {
    // Apply temporary filters to actual filter state
    setSelectedJangkaWaktu(new Set(tempJangkaWaktu));
    setSelectedYear(tempYear);
    setSelectedAplikasi(tempAplikasi);
    setSelectedSkpa(new Set(tempSkpa));
    setSelectedProgress(new Set(tempProgress));
    setSelectedIku(tempIku);
    setSelectedInhouseOutsource(tempInhouseOutsource);
    setSelectedBidang(new Set(tempBidang));
    setSelectedPic(new Set(tempPic));
    setNoInisiatif(tempNoInisiatif);
    setSelectedTimelineStage(tempTimelineStage);
    setSelectedTimelineFromDate(tempTimelineFromDate);
    setSelectedTimelineToDate(tempTimelineToDate);
    setFilterAnchorEl(null);
  };

  const handleJangkaWaktuChange = (jangkaWaktu: string) => {
    const newSet = new Set(tempJangkaWaktu);
    if (newSet.has(jangkaWaktu)) {
      newSet.delete(jangkaWaktu);
    } else {
      newSet.add(jangkaWaktu);
    }
    setTempJangkaWaktu(newSet);
  };

  const handleProgressChange = (progress: string) => {
    const newSet = new Set(tempProgress);
    if (newSet.has(progress)) {
      newSet.delete(progress);
    } else {
      newSet.add(progress);
    }
    setTempProgress(newSet);
  };

  const handleResetFilter = () => {
    setTempJangkaWaktu(new Set());
    setTempYear('');
    setTempAplikasi('');
    setTempSkpa(new Set());
    setTempProgress(new Set());
    setTempIku('');
    setTempInhouseOutsource('');
    setTempBidang(new Set());
    setTempPic(new Set());
    setTempNoInisiatif(false);
    setTempTimelineStage('');
    setTempTimelineFromDate(null);
    setTempTimelineToDate(null);
  };

  // Generate year options - static range from 2020 to current year + 2
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let year = currentYear + 2; year >= 2020; year--) {
      years.push(year.toString());
    }
    return years;
  }, []);

  // Generate aplikasi options from data
  const aplikasiOptions = useMemo(() => {
    const aplikasiSet = new Set<string>();
    pksiData.forEach(item => {
      if (item.namaAplikasi && item.namaAplikasi !== '-') {
        aplikasiSet.add(item.namaAplikasi);
      }
    });
    return Array.from(aplikasiSet).sort();
  }, [pksiData]);

  // Generate SKPA options from pksiData (pic_satker_names is now comma-separated codes)
  const skpaOptions = useMemo(() => {
    const skpaSet = new Set<string>();
    pksiData.forEach(item => {
      const codes = resolveSkpaCodes(item.picSatkerBA);
      codes.forEach(code => skpaSet.add(code));
    });
    return Array.from(skpaSet).sort();
  }, [pksiData, resolveSkpaCodes]);

  // Generate Bidang options from pksiData
  const bidangOptions = useMemo(() => {
    const bidangSet = new Set<string>();
    pksiData.forEach(item => {
      const bidangs = resolveBidangNames(item.picSatkerBA);
      bidangs.forEach(bidang => bidangSet.add(bidang));
    });
    return Array.from(bidangSet).sort();
  }, [pksiData, resolveBidangNames]);

  // Generate PIC options from pksiData
  const picOptions = useMemo(() => {
    const picSet = new Set<string>();
    pksiData.forEach(item => {
      if (item.pic && item.pic !== '-') {
        picSet.add(item.pic);
      }
    });
    return Array.from(picSet).sort();
  }, [pksiData]);

  // Progress options - static list
  const progressOptions = [
    'Penyusunan Usreq',
    'SIT',
    'UAT',
    'Proses Go Live',
    'Selesai',
  ];

  // Generate year options from timeline data (tahap1_awal to tahap7_akhir)
  const timelineYearOptions = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    // Add current year and surrounding years as defaults
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      years.add(y.toString());
    }
    // Extract years from raw PKSI timeline data
    rawPksiData.forEach(item => {
      const timelineFields = [
        item.tahap1_awal, item.tahap1_akhir,
        item.tahap5_awal, item.tahap5_akhir,
        item.tahap7_awal, item.tahap7_akhir
      ];
      timelineFields.forEach(dateStr => {
        if (dateStr) {
          const year = new Date(dateStr).getFullYear();
          if (!isNaN(year)) years.add(year.toString());
        }
      });
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [rawPksiData]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedJangkaWaktu.size > 0) count++;
    if (selectedYear) count++;
    if (selectedAplikasi) count++;
    if (selectedSkpa.size > 0) count++;
    if (selectedProgress.size > 0) count++;
    if (selectedIku) count++;
    if (selectedInhouseOutsource) count++;
    if (selectedBidang.size > 0) count++;
    if (selectedPic.size > 0) count++;
    if (noInisiatif) count++;
    // Timeline filters
    if (selectedTimelineStage) count++;
    if (selectedTimelineFromDate || selectedTimelineToDate) count++;
    return count;
  }, [selectedJangkaWaktu, selectedYear, selectedAplikasi, selectedSkpa, selectedProgress, selectedIku, selectedInhouseOutsource, selectedBidang, selectedPic, noInisiatif, selectedTimelineStage, selectedTimelineFromDate, selectedTimelineToDate]);

  // Filter locally based on all filter criteria
  // Note: Timeline year filter (selectedYearFilter) is now handled by backend
  const filteredPksi = useMemo(() => {
    let result = pksiData;
    
    // selectedYearFilter is now sent to backend, no need to filter client-side
    
    if (selectedJangkaWaktu.size > 0) {
      result = result.filter(item => {
        if (selectedJangkaWaktu.has('Single Year') && item.jangkaWaktu === 'Single Year') return true;
        if (selectedJangkaWaktu.has('Multiyears') && item.jangkaWaktu.startsWith('Multiyears')) return true;
        return false;
      });
    }

    // Note: Year filter is now applied on the API side, no local filtering needed

    if (selectedAplikasi) {
      result = result.filter(item => item.namaAplikasi === selectedAplikasi);
    }

    if (selectedSkpa.size > 0) {
      result = result.filter(item => {
        const itemSkpaCodes = resolveSkpaCodes(item.picSatkerBA);
        return itemSkpaCodes.some(code => selectedSkpa.has(code));
      });
    }

    if (selectedProgress.size > 0) {
      result = result.filter(item => {
        const progress = item.progress || '';
        return selectedProgress.has(progress);
      });
    }

    if (selectedIku) {
      result = result.filter(item => {
        const iku = item.iku === 'ya' ? 'ya' : 'tidak';
        return iku === selectedIku;
      });
    }

    if (selectedInhouseOutsource) {
      result = result.filter(item => {
        const inhouseOutsource = item.inhouseOutsource?.toLowerCase() || '';
        return inhouseOutsource === selectedInhouseOutsource.toLowerCase();
      });
    }

    if (selectedBidang.size > 0) {
      result = result.filter(item => {
        const itemBidangs = resolveBidangNames(item.picSatkerBA);
        return itemBidangs.some(bidang => selectedBidang.has(bidang));
      });
    }

    if (selectedPic.size > 0) {
      result = result.filter(item => {
        const pic = item.pic || '';
        return selectedPic.has(pic);
      });
    }
    
    return result;
  }, [pksiData, selectedJangkaWaktu, selectedAplikasi, selectedSkpa, selectedProgress, selectedIku, selectedInhouseOutsource, selectedBidang, selectedPic, resolveSkpaCodes, resolveBidangNames]);

  const paginatedPksi = filteredPksi;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // File handling functions for T01 - stage then upload with per-file date
  const handleFileSelectT01 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newPending = Array.from(files).map(file => ({ file, tanggal: '' }));
      setPendingFilesT01(prev => [...prev, ...newPending]);
    }
    event.target.value = '';
  };

  const handleDropT01 = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingT01(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newPending = Array.from(files).map(file => ({ file, tanggal: '' }));
      setPendingFilesT01(prev => [...prev, ...newPending]);
    }
  };

  const handleUploadPendingT01 = async () => {
    if (pendingFilesT01.length === 0 || !selectedPksiForEdit) return;
    setIsUploadingT01(true);
    try {
      const results: PksiFileData[] = [];
      for (const pending of pendingFilesT01) {
        const uploaded = await uploadPksiFiles(selectedPksiForEdit.id, [pending.file], 'T01', pending.tanggal || undefined);
        results.push(...(Array.isArray(uploaded) ? uploaded : []));
      }
      setFilesT01Data(prev => [...prev, ...results]);
      setPendingFilesT01([]);
      setEditForm(prev => ({ ...prev, statusT01T02: 'Diterima' }));
    } catch (error) {
      console.error('Failed to upload T01 files:', error);
    } finally {
      setIsUploadingT01(false);
    }
  };

  const handleRemoveFileT01 = async (fileId: string) => {
    try {
      await deletePksiFile(fileId);
      const newFiles = filesT01Data.filter(f => f.id !== fileId);
      setFilesT01Data(newFiles);
      // Auto-update status based on remaining files
      setEditForm(prev => ({ ...prev, statusT01T02: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDownloadFileT01 = async (file: PksiFileData) => {
    setDownloadingFileId(file.id);
    try {
      await downloadPksiFile(file.id, file.original_name);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handlePreviewFileT01 = (file: PksiFileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Handle preview modal close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Handle download from preview modal
  const handlePreviewDownload = async () => {
    if (previewFile) {
      setDownloadingFileId(previewFile.id);
      try {
        await downloadPksiFile(previewFile.id, previewFile.original_name);
      } catch (error) {
        console.error('Failed to download file:', error);
      } finally {
        setDownloadingFileId(null);
      }
    }
  };

  const isPreviewableT01 = (contentType: string | undefined): boolean => {
    if (!contentType) return false;
    return contentType.startsWith('image/') || contentType === 'application/pdf';
  };

  // File handling functions for T11 - stage then upload with per-file date
  const handleFileSelectT11 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newPending = Array.from(files).map(file => ({ file, tanggal: '' }));
      setPendingFilesT11(prev => [...prev, ...newPending]);
    }
    event.target.value = '';
  };

  const handleDropT11 = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingT11(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const newPending = Array.from(files).map(file => ({ file, tanggal: '' }));
      setPendingFilesT11(prev => [...prev, ...newPending]);
    }
  };

  const handleUploadPendingT11 = async () => {
    if (pendingFilesT11.length === 0 || !selectedPksiForEdit) return;
    setIsUploadingT11(true);
    try {
      const results: PksiFileData[] = [];
      for (const pending of pendingFilesT11) {
        const uploaded = await uploadPksiFiles(selectedPksiForEdit.id, [pending.file], 'T11', pending.tanggal || undefined);
        results.push(...(Array.isArray(uploaded) ? uploaded : []));
      }
      setFilesT11Data(prev => [...prev, ...results]);
      setPendingFilesT11([]);
      setEditForm(prev => ({ ...prev, statusT11: 'Diterima' }));
    } catch (error) {
      console.error('Failed to upload T11 files:', error);
    } finally {
      setIsUploadingT11(false);
    }
  };

  const handleRemoveFileT11 = async (fileId: string) => {
    try {
      await deletePksiFile(fileId);
      const newFiles = filesT11Data.filter(f => f.id !== fileId);
      setFilesT11Data(newFiles);
      // Auto-update status based on remaining files
      setEditForm(prev => ({ ...prev, statusT11: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDownloadFileT11 = async (file: PksiFileData) => {
    setDownloadingFileId(file.id);
    try {
      await downloadPksiFile(file.id, file.original_name);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handlePreviewFileT11 = (file: PksiFileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Handler to view files directly from the table (without opening edit dialog)
  const handleViewFileFromTable = async (pksiId: string, fileType: 'T01' | 'T11') => {
    const title = fileType === 'T01' ? 'Rencana PKSI (T01/T02)' : 'Spesifikasi Kebutuhan (T11)';
    setFileDialogTitle(title);
    setFileDialogOpen(true);
    setIsLoadingFiles(true);
    
    try {
      const files = await getPksiFiles(pksiId);
      console.log(`[View Files] Fetched ${files.length} files for PKSI ${pksiId}:`, files);
      
      // Filter files appropriately
      // For T01: include files with file_type === 'T01' OR files without file_type set (legacy files)
      // For T11: only include files with file_type === 'T11'
      const filteredFiles = fileType === 'T01' 
        ? files.filter(f => f.file_type === 'T01' || !f.file_type)
        : files.filter(f => f.file_type === 'T11');
      
      console.log(`[View Files] Filtered to ${filteredFiles.length} ${fileType} files:`, filteredFiles);
      
      setFileDialogFiles(filteredFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFileDialogFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleCloseFileDialog = () => {
    setFileDialogOpen(false);
    setFileDialogTitle('');
    setFileDialogFiles([]);
  };

  const handleFileDownloadFromDialog = async (file: PksiFileData) => {
    setDownloadingFileId(file.id);
    try {
      await downloadPksiFile(file.id, file.original_name);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleFilePreviewFromDialog = (file: PksiFileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const isPreviewableFile = (contentType: string | undefined): boolean => {
    if (!contentType) return false;
    return contentType.startsWith('image/') || contentType === 'application/pdf';
  };

  // Format file size
  const formatFileSize = (bytes: number | undefined | null): string => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ 
      px: 2,
      py: 3,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <AssessmentRounded sx={{ fontSize: 32, color: '#DA251C' }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Monitoring PKSI
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#86868b', ml: 0.5 }}>
          Monitoring dan tracking PKSI
        </Typography>
      </Box>

      {/* Main Card */}
      <Paper
        elevation={0}
        sx={{
          width: isCollapsed 
            ? `calc(80vw + ${DRAWER_WIDTH - DRAWER_WIDTH_COLLAPSED}px)` 
            : '80vw',
          maxWidth: isCollapsed 
            ? `calc(80vw + ${DRAWER_WIDTH - DRAWER_WIDTH_COLLAPSED}px)` 
            : '80vw',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
          }}
        >
          {/* Search & Filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              placeholder="Cari nama PKSI..."
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ 
                width: 280,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f5f5f7',
                  borderRadius: '10px',
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'transparent',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#31A24C',
                    borderWidth: 2,
                  },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#86868b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            
            {/* Year Filter Dropdown - Enhanced UI */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: selectedYearFilter ? 'rgba(49, 162, 76, 0.08)' : '#f5f5f7',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                border: selectedYearFilter ? '1.5px solid rgba(49, 162, 76, 0.3)' : '1.5px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: selectedYearFilter ? 'rgba(49, 162, 76, 0.12)' : '#eeeeef',
                },
              }}
            >
              <CalendarIcon sx={{ fontSize: 18, color: selectedYearFilter ? '#31A24C' : '#86868b' }} />
              <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                <Select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  displayEmpty
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: selectedYearFilter ? '#31A24C' : '#1d1d1f',
                    '& .MuiSelect-select': {
                      py: 0.5,
                      pr: 3,
                    },
                    '& .MuiSvgIcon-root': {
                      color: selectedYearFilter ? '#31A24C' : '#86868b',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                    <em>Semua Tahun</em>
                  </MenuItem>
                  {timelineYearOptions.map((year) => (
                    <MenuItem 
                      key={year} 
                      value={year}
                      sx={{ 
                        fontSize: '0.875rem',
                        fontWeight: year === new Date().getFullYear().toString() ? 600 : 400,
                        color: year === new Date().getFullYear().toString() ? '#31A24C' : 'inherit',
                      }}
                    >
                      {year}
                      {year === new Date().getFullYear().toString() && (
                        <Chip 
                          label="Now" 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            height: 18, 
                            fontSize: '0.65rem',
                            bgcolor: '#31A24C',
                            color: 'white',
                          }} 
                        />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Button
              variant="text"
              startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
              onClick={handleFilterOpen}
              sx={{
                color: activeFilterCount > 0 ? '#31A24C' : '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Filters
              {activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{ ml: 1, bgcolor: '#31A24C', color: 'white', height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Button>
            
            {/* Sticky Columns Settings Button */}
            <Tooltip title="Atur Kolom Sticky">
              <Button
                variant="text"
                startIcon={<PushPinIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setStickyColumnsAnchorEl(e.currentTarget)}
                sx={{
                  color: stickyColumns.size > 0 ? '#2563EB' : '#86868b',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Pin
                {stickyColumns.size > 0 && (
                  <Chip
                    label={stickyColumns.size}
                    size="small"
                    sx={{ ml: 1, bgcolor: '#2563EB', color: 'white', height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Button>
            </Tooltip>
          </Box>

          {/* Status Badge - Removed */}
        </Box>

        {/* Sticky Columns Popover */}
        <Popover
          open={Boolean(stickyColumnsAnchorEl)}
          anchorEl={stickyColumnsAnchorEl}
          onClose={() => setStickyColumnsAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              p: 2,
              minWidth: 280,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              Kolom Sticky
            </Typography>
            <IconButton size="small" onClick={() => setStickyColumnsAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mb: 2 }}>
            Pilih kolom yang akan tetap terlihat saat scroll horizontal
          </Typography>
          <FormGroup>
            {COLUMN_OPTIONS.map((col) => (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    checked={stickyColumns.has(col.id)}
                    onChange={() => handleStickyColumnToggle(col.id)}
                    size="small"
                    sx={{
                      '&.Mui-checked': { color: '#2563EB' },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{col.label}</Typography>
                    {stickyColumns.has(col.id) && (
                      <PushPinIcon sx={{ fontSize: 14, color: '#2563EB' }} />
                    )}
                  </Box>
                }
                sx={{ mb: 0.5 }}
              />
            ))}
          </FormGroup>
          <Button
            fullWidth
            variant="text"
            size="small"
            onClick={() => setStickyColumns(new Set())}
            sx={{ mt: 1, color: '#86868b' }}
          >
            Reset Semua
          </Button>
        </Popover>

        {/* Timeline Columns Visibility Popover */}
        <Popover
          open={Boolean(timelineColumnsAnchorEl)}
          anchorEl={timelineColumnsAnchorEl}
          onClose={() => setTimelineColumnsAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.1)',
              p: 2,
              minWidth: 285,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              Timeline Columns
            </Typography>
            <IconButton size="small" onClick={() => setTimelineColumnsAnchorEl(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mb: 2 }}>
            Pilih stage yang ingin ditampilkan (minimal 1)
          </Typography>
          <FormGroup>
            {TIMELINE_COLUMN_OPTIONS.map((col) => (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    checked={visibleTimelineColumns.has(col.id)}
                    onChange={() => handleTimelineColumnToggle(col.id)}
                    size="small"
                    sx={{
                      '&.Mui-checked': { color: '#8B5CF6' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2">{col.label}</Typography>
                }
                sx={{ mb: 0.5 }}
              />
            ))}
          </FormGroup>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleShowDefaultTimelineColumns}
              sx={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              Default (4)
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleShowAllTimelineColumns}
              sx={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              Semua (9)
            </Button>
          </Box>
        </Popover>

        {/* Filter Popover - Apple Liquid Glass Style */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1.5,
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 12px 24px -8px rgba(49, 162, 76, 0.1)',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              width: 520,
            },
          }}
        >
          {/* Header - Liquid Glass */}
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(49, 162, 76, 0.95) 0%, rgba(34, 139, 60, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            p: 2.5,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}>
                <TuneRounded sx={{ fontSize: 20, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                  Filter Data
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
                  {activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Pilih kriteria filter'}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleFilterClose}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                transition: 'all 0.2s ease',
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          
          <Box sx={{ 
            p: 3, 
            maxHeight: 520, 
            overflowY: 'auto',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 252, 250, 0.98) 100%)',
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(49, 162, 76, 0.3)',
              borderRadius: 3,
              '&:hover': {
                background: 'rgba(49, 162, 76, 0.5)',
              },
            },
          }}>
            {/* Row 1: Nama Aplikasi (full width) */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#31A24C' }} />
                Nama Aplikasi
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="aplikasi-filter-label-disetujui">Pilih Aplikasi</InputLabel>
                <Select
                  labelId="aplikasi-filter-label-disetujui"
                  value={tempAplikasi}
                  label="Pilih Aplikasi"
                  onChange={(e) => setTempAplikasi(e.target.value)}
                  sx={{
                    borderRadius: '12px',
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                      borderWidth: 2,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Semua Aplikasi</em>
                  </MenuItem>
                  {aplikasiOptions.map((aplikasi) => (
                    <MenuItem key={aplikasi} value={aplikasi}>
                      {aplikasi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 2: SKPA & Bidang */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
              {/* SKPA Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0891B2' }} />
                  SKPA
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={skpaOptions}
                  value={Array.from(tempSkpa)}
                  onChange={(_, newValue) => setTempSkpa(new Set(newValue))}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => {
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          sx={{ mr: 1, '&.Mui-checked': { color: '#0891B2' } }}
                        />
                        {option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={tempSkpa.size === 0 ? 'Pilih SKPA' : ''}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.1)' },
                          '&:hover fieldset': { borderColor: '#0891B2' },
                          '&.Mui-focused fieldset': { borderColor: '#0891B2', borderWidth: 2 },
                        },
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option}
                          size="small"
                          {...tagProps}
                          sx={{ 
                            bgcolor: '#0891B2', 
                            color: 'white', 
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } } 
                          }}
                        />
                      );
                    })
                  }
                />
              </Box>

              {/* Bidang Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                  Bidang
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={bidangOptions}
                  value={Array.from(tempBidang)}
                  onChange={(_, newValue) => setTempBidang(new Set(newValue))}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => {
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          sx={{ mr: 1, '&.Mui-checked': { color: '#7C3AED' } }}
                        />
                        {option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={tempBidang.size === 0 ? 'Pilih Bidang' : ''}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.1)' },
                          '&:hover fieldset': { borderColor: '#7C3AED' },
                          '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: 2 },
                        },
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option}
                          size="small"
                          {...tagProps}
                          sx={{ 
                            bgcolor: '#7C3AED', 
                            color: 'white', 
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } } 
                          }}
                        />
                      );
                    })
                  }
                />
              </Box>
            </Box>

            {/* Row 3: PIC, Periode Tahun, Timeline Stage */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2.5 }}>
              {/* PIC Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#DC2626' }} />
                  PIC
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={picOptions}
                  value={Array.from(tempPic)}
                  onChange={(_, newValue) => setTempPic(new Set(newValue))}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => {
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          sx={{ mr: 1, '&.Mui-checked': { color: '#DC2626' } }}
                        />
                        {option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={tempPic.size === 0 ? 'Pilih PIC' : ''}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.1)' },
                          '&:hover fieldset': { borderColor: '#DC2626' },
                          '&.Mui-focused fieldset': { borderColor: '#DC2626', borderWidth: 2 },
                        },
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option}
                          size="small"
                          {...tagProps}
                          sx={{ 
                            bgcolor: '#DC2626', 
                            color: 'white', 
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } } 
                          }}
                        />
                      );
                    })
                  }
                />
              </Box>

              {/* Periode Tahun Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D97706' }} />
                  Periode Tahun
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={tempYear}
                    displayEmpty
                    onChange={(e) => setTempYear(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D97706',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D97706',
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Semua Tahun</em>
                    </MenuItem>
                    {yearOptions.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Timeline Stage Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563EB' }} />
                  Timeline Stage
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={tempTimelineStage}
                    displayEmpty
                    onChange={(e) => setTempTimelineStage(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563EB',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563EB',
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Semua Stage</em>
                    </MenuItem>
                    <MenuItem value="USREQ">USREQ</MenuItem>
                    <MenuItem value="PENGADAAN">Pengadaan</MenuItem>
                    <MenuItem value="DESAIN">Desain</MenuItem>
                    <MenuItem value="CODING">Coding</MenuItem>
                    <MenuItem value="UNIT_TEST">Unit Test</MenuItem>
                    <MenuItem value="SIT">SIT</MenuItem>
                    <MenuItem value="UAT">UAT</MenuItem>
                    <MenuItem value="DEPLOYMENT">Deployment</MenuItem>
                    <MenuItem value="GO_LIVE">Go Live</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 4: Timeline Periode Bulan (Full Width) */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563EB' }} />
                Timeline Periode Bulan
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={localeId}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {/* Dari Bulan/Tahun */}
                  <DatePicker
                    value={tempTimelineFromDate}
                    onChange={(newValue: Date | null) => setTempTimelineFromDate(newValue)}
                    views={['year', 'month']}
                    openTo="month"
                    label="Dari"
                    slotProps={{
                      textField: {  
                        size: 'small',
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '& fieldset': {
                              borderColor: 'rgba(0, 0, 0, 0.1)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#2563EB',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2563EB',
                              borderWidth: 2,
                            },
                          },
                        },
                      },  
                      actionBar: {
                        actions: ['clear', 'accept'],
                      },
                    }}
                  />
                  
                  {/* Sampai Bulan/Tahun */}
                  <DatePicker
                    value={tempTimelineToDate}
                    onChange={(newValue: Date | null) => setTempTimelineToDate(newValue)}
                    views={['year', 'month']}
                    openTo="month"
                    minDate={tempTimelineFromDate || undefined}
                    label="Sampai"
                    slotProps={{
                      textField: {  
                        size: 'small',
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '& fieldset': {
                              borderColor: 'rgba(0, 0, 0, 0.1)',
                            },
                            '&:hover fieldset': {
                              borderColor: '#2563EB',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2563EB',
                              borderWidth: 2,
                            },
                          },
                        },
                      },
                      actionBar: {
                        actions: ['clear', 'accept'],
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>
            </Box>

            {/* Row 5: Quick Filter Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2.5 }}>
              {/* Jangka Waktu Filter */}
              <Box sx={{ 
                p: 2, 
                borderRadius: '14px', 
                bgcolor: 'rgba(139, 92, 246, 0.06)', 
                border: '1px solid rgba(139, 92, 246, 0.15)',
              }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#7C3AED', mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                  Jangka Waktu
                </Typography>
                <FormGroup sx={{ gap: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={tempJangkaWaktu.has('Single Year')}
                        onChange={() => handleJangkaWaktuChange('Single Year')}
                        sx={{ py: 0.3, '&.Mui-checked': { color: '#7C3AED' } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>Single Year</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={tempJangkaWaktu.has('Multiyears')}
                        onChange={() => handleJangkaWaktuChange('Multiyears')}
                        sx={{ py: 0.3, '&.Mui-checked': { color: '#7C3AED' } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>Multiyears</Typography>}
                  />
                </FormGroup>
              </Box>

              {/* IKU Filter */}
              <Box sx={{ 
                p: 2, 
                borderRadius: '14px', 
                bgcolor: 'rgba(59, 130, 246, 0.06)', 
                border: '1px solid rgba(59, 130, 246, 0.15)',
              }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#2563EB', mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                  IKU
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={tempIku}
                    displayEmpty
                    onChange={(e) => setTempIku(e.target.value)}
                    sx={{
                      borderRadius: '10px',
                      bgcolor: 'white',
                      fontSize: '0.85rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59, 130, 246, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB', borderWidth: 2 },
                    }}
                  >
                    <MenuItem value=""><em>Semua</em></MenuItem>
                    <MenuItem value="ya">Ya</MenuItem>
                    <MenuItem value="tidak">Tidak</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Inhouse/Outsource Filter */}
              <Box sx={{ 
                p: 2, 
                borderRadius: '14px', 
                bgcolor: 'rgba(5, 150, 105, 0.06)', 
                border: '1px solid rgba(5, 150, 105, 0.15)',
              }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#059669', mb: 1, display: 'block', letterSpacing: '0.02em' }}>
                  Inhouse/Outsource
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={tempInhouseOutsource}
                    displayEmpty
                    onChange={(e) => setTempInhouseOutsource(e.target.value)}
                    sx={{
                      borderRadius: '10px',
                      bgcolor: 'white',
                      fontSize: '0.85rem',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(5, 150, 105, 0.2)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#059669' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#059669', borderWidth: 2 },
                    }}
                  >
                    <MenuItem value=""><em>Semua</em></MenuItem>
                    <MenuItem value="inhouse">Inhouse</MenuItem>
                    <MenuItem value="outsource">Outsource</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 5: Progress Filter */}
            <Box sx={{ 
              p: 2, 
              borderRadius: '14px', 
              bgcolor: 'rgba(251, 191, 36, 0.06)', 
              border: '1px solid rgba(251, 191, 36, 0.2)',
              mb: 3,
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#D97706', mb: 1.5, display: 'block', letterSpacing: '0.02em' }}>
                Progres
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {progressOptions.map((progress) => (
                  <Chip
                    key={progress}
                    label={progress}
                    size="small"
                    onClick={() => handleProgressChange(progress)}
                    sx={{
                      bgcolor: tempProgress.has(progress) 
                        ? '#F59E0B' 
                        : 'white',
                      color: tempProgress.has(progress) ? 'white' : '#374151',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      border: tempProgress.has(progress) 
                        ? '1px solid #F59E0B' 
                        : '1px solid rgba(0, 0, 0, 0.12)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: tempProgress.has(progress) 
                          ? '#D97706' 
                          : 'rgba(251, 191, 36, 0.12)',
                        borderColor: '#F59E0B',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Row 6: Tidak Ada Inisiatif Filter */}
            <Box sx={{ 
              p: 2, 
              borderRadius: '14px', 
              bgcolor: 'rgba(220, 38, 38, 0.06)', 
              border: '1px solid rgba(220, 38, 38, 0.15)',
              mb: 3,
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={noInisiatif}
                    onChange={(e) => setNoInisiatif(e.target.checked)}
                    sx={{ 
                      '&.Mui-checked': { color: '#DC2626' },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                      Tidak Ada Inisiatif
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      Tampilkan PKSI yang belum memiliki program/inisiatif RBSI
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleResetFilter}
                startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  color: '#6B7280',
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  bgcolor: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                  },
                }}
              >
                Reset
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleApplyFilter}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #31A24C 0%, #228B3B 100%)',
                  boxShadow: '0 4px 12px rgba(49, 162, 76, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2A8F42 0%, #1E7A34 100%)',
                    boxShadow: '0 6px 16px rgba(49, 162, 76, 0.35)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Terapkan Filter
              </Button>
            </Box>
          </Box>
        </Popover>

        {/* Data Count Display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            py: 1.5,
            px: 2,
            backgroundColor: '#F5F5F7',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Total PKSI Documents */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#DA251C',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {isLoading ? '...' : totalCount}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#86868b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {selectedYear ? `Total PKSI Tahun ${selectedYear}` : 'Total'}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1d1d1f',
                }}
              >
                {isLoading ? 'Loading...' : `${totalCount} PKSI Documents`}
              </Typography>
            </Box>
          </Box>

          {/* PKSI Tanpa Inisiatif - Clickable */}
          <Box
            onClick={() => setNoInisiatif(!noInisiatif)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              opacity: noInisiatif ? 1 : 0.8,
              transition: 'all 0.15s ease',
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: noInisiatif ? '#F59E0B' : '#F59E0B',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: noInisiatif ? '0 0 0 3px rgba(245, 158, 11, 0.3)' : 'none',
              }}
            >
              {isLoading ? '...' : noInisiatifCount}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#86868b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Tanpa Inisiatif
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1d1d1f',
                }}
              >
                {isLoading ? 'Loading...' : `${noInisiatifCount} PKSI`}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  color: noInisiatif ? '#F59E0B' : '#86868b',
                  fontStyle: 'italic',
                }}
              >
                {noInisiatif ? '✓ Filter aktif - Klik untuk nonaktifkan' : 'Klik untuk filter'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ 
          width: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.08)',
            borderRadius: 4,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.12)',
            },
          },
        }}>
          <Table sx={{ tableLayout: 'auto', minWidth: 3200 }}>
            <TableHead>
              {/* First row - Grouped headers */}
              <TableRow sx={{ 
                bgcolor: '#f5f5f7',
              }}>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', textAlign: 'center', fontSize: '0.8rem', minWidth: 50, ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('no') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>No</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 160, ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Nama Aplikasi</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 180, ...(stickyColumns.has('namaPksi') && { position: 'sticky', left: getStickyLeft('namaPksi'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('namaPksi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Nama PKSI</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120 }}>Jenis PKSI</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>SKPA</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('bidang') && { position: 'sticky', left: getStickyLeft('bidang'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('bidang') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Bidang</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 160, ...(stickyColumns.has('inisiatifRbsi') && { position: 'sticky', left: getStickyLeft('inisiatifRbsi'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('inisiatifRbsi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Inisiatif RBSI</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 140, ...(stickyColumns.has('pic') && { position: 'sticky', left: getStickyLeft('pic'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('pic') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>PIC</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 160 }}>Anggota Tim</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 80 }}>IKU</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 130 }}>Inhouse/Outsource</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120 }}>Jangka Waktu</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100 }}>Progres</TableCell>
                {/* Anggaran - grouped */}
                <TableCell colSpan={3} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem' }}>Anggaran</TableCell>
                {/* Timeline - grouped (9 stages) */}
                <TableCell 
                  colSpan={visibleTimelineColumns.size} 
                  align="center" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#6B7280', 
                    py: 1.5, 
                    px: 2, 
                    fontSize: '0.8rem', 
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(99, 102, 241, 0.03) 100%)',
                    cursor: 'pointer',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                    },
                  }}
                  onClick={(e) => setTimelineColumnsAnchorEl(e.currentTarget)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    Timeline Development
                    <IconButton 
                      size="small" 
                      sx={{ 
                        p: 0.5,
                        color: '#8B5CF6',
                        '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTimelineColumnsAnchorEl(e.currentTarget);
                      }}
                    >
                      <ViewColumnIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Chip
                      label={`${visibleTimelineColumns.size}/9`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(139, 92, 246, 0.1)',
                        color: '#8B5CF6',
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  </Box>
                </TableCell>
                {/* Rencana PKSI - grouped */}
                <TableCell colSpan={2} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem' }}>Rencana PKSI (T01/T02)</TableCell>
                {/* Spesifikasi Kebutuhan - grouped */}
                <TableCell colSpan={2} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem' }}>Spesifikasi Kebutuhan (T11)</TableCell>
                {/* CD Prinsip - grouped (only Nomor CD) */}
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120 }}>No. CD Prinsip</TableCell>
                {/* Kontrak - grouped */}
                <TableCell colSpan={5} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem' }}>Kontrak</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100 }}>BA Deploy</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100 }}>Aksi</TableCell>
              </TableRow>
              {/* Second row - Sub-headers */}
              <TableRow sx={{ 
                bgcolor: '#f5f5f7',
              }}>
                {/* Anggaran sub-headers */}
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>Tahun {new Date().getFullYear()}</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>Tahun {new Date().getFullYear() + 1}</TableCell>
                {/* Timeline sub-headers (conditionally visible, neutral colors) */}
                {visibleTimelineColumns.has('usreq') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 95, background: 'rgba(139, 92, 246, 0.03)' }}>USREQ</TableCell>
                )}
                {visibleTimelineColumns.has('pengadaan') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 100, background: 'rgba(5, 150, 105, 0.03)' }}>Pengadaan</TableCell>
                )}
                {visibleTimelineColumns.has('desain') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 90, background: 'rgba(220, 38, 38, 0.03)' }}>Desain</TableCell>
                )}
                {visibleTimelineColumns.has('coding') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 90, background: 'rgba(37, 99, 235, 0.03)' }}>Coding</TableCell>
                )}
                {visibleTimelineColumns.has('unitTest') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 100, background: 'rgba(217, 119, 6, 0.03)' }}>Unit Test</TableCell>
                )}
                {visibleTimelineColumns.has('sit') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 80, background: 'rgba(124, 58, 237, 0.03)' }}>SIT</TableCell>
                )}
                {visibleTimelineColumns.has('uat') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 100, background: 'rgba(8, 145, 178, 0.03)' }}>UAT/PDKK</TableCell>
                )}
                {visibleTimelineColumns.has('deployment') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 110, background: 'rgba(219, 39, 119, 0.03)' }}>Deployment</TableCell>
                )}
                {visibleTimelineColumns.has('goLive') && (
                  <TableCell sx={{ fontWeight: 500, color: '#9CA3AF', py: 1, px: 1.5, fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 95, background: 'rgba(5, 150, 105, 0.03)' }}>Go Live</TableCell>
                )}
                {/* Rencana PKSI sub-headers */}
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>Berkas Terbaru</TableCell>
                {/* Spesifikasi Kebutuhan sub-headers */}
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>Berkas Terbaru</TableCell>

                {/* Kontrak sub-headers */}
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100 }}>Tgl Mulai</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100 }}>Tgl Selesai</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>Nilai</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100 }}>Jml Termin</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 140 }}>Detail Pembayaran</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={21 + visibleTimelineColumns.size} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#31A24C' }} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#86868b' }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : !keyword && !selectedYearFilter && !noInisiatif && !selectedTimelineStage && !selectedTimelineFromMonth && !selectedTimelineToMonth ? (
                <TableRow>
                  <TableCell colSpan={21 + visibleTimelineColumns.size} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <TuneRounded sx={{ fontSize: 48, color: '#D1D5DB' }} />
                      <Box>
                        <Typography variant="body1" sx={{ color: '#1d1d1f', fontWeight: 600, mb: 0.5 }}>
                          Gunakan Filter untuk Melihat Data
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#86868b' }}>
                          Pilih filter (Tahun, Timeline, atau kata kunci) untuk menampilkan data PKSI
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={21 + visibleTimelineColumns.size} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      Tidak ada data PKSI disetujui ditemukan
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.map((item, index) => (
                <TableRow 
                  key={item.id}
                  sx={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: item.isNestedPksi 
                        ? 'linear-gradient(135deg, rgba(142, 142, 147, 0.08) 0%, rgba(200, 200, 205, 0.06) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 250, 245, 0.8) 100%)',
                      boxShadow: '0 4px 20px rgba(49, 162, 76, 0.08)',
                      transform: 'scale(1.001)',
                    },
                    '&:not(:last-child)': {
                      borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                    },
                    ...(item.isNestedPksi && {
                      bgcolor: 'rgba(142, 142, 147, 0.02)',
                    }),
                  }}
                >
                  {/* No */}
                  <TableCell sx={{ color: '#86868b', py: 1, px: 2, textAlign: 'center', fontWeight: 500, fontSize: '0.8rem', minWidth: 50, boxShadow: item.isMendesak ? 'inset 4px 0 0 #FF3B30' : 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('no') && { boxShadow: item.isMendesak ? 'inset 4px 0 0 #FF3B30, 2px 0 5px -2px rgba(0,0,0,0.1)' : '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    {page * rowsPerPage + index + 1}
                  </TableCell>
                  {/* Nama Aplikasi */}
                  <TableCell sx={{ py: 1, px: 2, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 160, ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.namaAplikasi}
                    </Typography>
                  </TableCell>
                  {/* Nama PKSI */}
                  <TableCell sx={{ py: 1, px: 2, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 180, ...(stickyColumns.has('namaPksi') && { position: 'sticky', left: getStickyLeft('namaPksi'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('namaPksi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {item.namaPksi}
                      </Typography>
                      {item.isNestedPksi && (
                        <Chip
                          label={`Mengikuti: ${item.parentPksiNama}`}
                          size="small"
                          icon={<Box component="span" sx={{ fontSize: '1rem' }}>→</Box>}
                          sx={{
                            mt: 0.5,
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            bgcolor: 'rgba(0, 122, 255, 0.08)',
                            color: '#007AFF',
                            border: '1px solid rgba(0, 122, 255, 0.2)',
                            '& .MuiChip-label': { px: 1 },
                            '& .MuiChip-icon': { fontSize: '1rem', ml: 0.5 },
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  {/* Jenis PKSI */}
                  <TableCell sx={{ py: 1, px: 2, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 120 }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.jenisPksi}
                    </Typography>
                  </TableCell>
                  {/* SKPA */}
                  <TableCell sx={{ py: 1, px: 1, minWidth: 100, ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                      {resolveSkpaCodes(item.picSatkerBA).length > 0 ? (
                        resolveSkpaCodes(item.picSatkerBA).map((code, idx) => {
                          const chipColor = getSkpaColor(code);
                          return (
                            <Chip
                              key={idx}
                              label={code}
                              size="small"
                              sx={{
                                bgcolor: chipColor.bg,
                                color: chipColor.text,
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                height: 20,
                                borderRadius: '4px',
                                '& .MuiChip-label': { px: 0.8 },
                              }}
                            />
                          );
                        })
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  {/* Bidang */}
                  <TableCell sx={{ py: 1, px: 1, minWidth: 120, ...(stickyColumns.has('bidang') && { position: 'sticky', left: getStickyLeft('bidang'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('bidang') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                      {resolveBidangNames(item.picSatkerUuids).length > 0 ? (
                        resolveBidangNames(item.picSatkerUuids).map((bidang, idx) => (
                          <Chip
                            key={idx}
                            label={bidang}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(107, 114, 128, 0.1)',
                              color: '#4B5563',
                              fontWeight: 500,
                              fontSize: '0.65rem',
                              height: 20,
                              borderRadius: '4px',
                              '& .MuiChip-label': { px: 0.8 },
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  {/* Inisiatif RBSI */}
                  <TableCell sx={{ py: 1, px: 1, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 160, ...(stickyColumns.has('inisiatifRbsi') && { position: 'sticky', left: getStickyLeft('inisiatifRbsi'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('inisiatifRbsi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.inisiatifRbsi}
                    </Typography>
                  </TableCell>
                  {/* PIC */}
                  <TableCell sx={{ py: 1, px: 1, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 140, ...(stickyColumns.has('pic') && { position: 'sticky', left: getStickyLeft('pic'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('pic') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.pic}
                    </Typography>
                  </TableCell>
                  {/* Anggota Tim */}
                  <TableCell sx={{ py: 1, px: 1, whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.anggotaTim}
                    </Typography>
                  </TableCell>
                  {/* IKU */}
                  <TableCell sx={{ py: 1, px: 1, whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.iku}
                    </Typography>
                  </TableCell>
                  {/* In/Out */}
                  <TableCell sx={{ py: 1, px: 1, whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.inhouseOutsource}
                    </Typography>
                  </TableCell>
                  {/* Jangka Waktu */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>
                    <Chip
                      label={item.jangkaWaktu === 'Single Year' ? 'Single Year' : 'Multiyears'}
                      size="small"
                      sx={{
                        background: item.jangkaWaktu === 'Single Year' 
                          ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
                        color: item.jangkaWaktu === 'Single Year' ? '#7C3AED' : '#1D4ED8',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      }}
                    />
                  </TableCell>
                  {/* Progres */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>
                    {(() => {
                      // Compute effective progress: last tahapan with status Dalam proses or Selesai
                      const tahapanStatusMap: Record<string, string> = {
                        'Penyusunan Usreq': item.tahapanStatusUsreq,
                        'Pengadaan':        item.tahapanStatusPengadaan,
                        'Desain':           item.tahapanStatusDesain,
                        'Coding':           item.tahapanStatusCoding,
                        'Unit Test':        item.tahapanStatusUnitTest,
                        'SIT':              item.tahapanStatusSit,
                        'UAT':              item.tahapanStatusUat,
                        'Deployment':       item.tahapanStatusDeployment,
                        'Selesai':          item.tahapanStatusSelesai,
                      };
                      let effectiveProgress = item.progress;
                      for (const option of PROGRESS_OPTIONS) {
                        const s = tahapanStatusMap[option];
                        if (s === 'Dalam proses' || s === 'Selesai') {
                          effectiveProgress = option;
                        }
                      }
                      const progressIndex = PROGRESS_OPTIONS.indexOf(effectiveProgress as typeof PROGRESS_OPTIONS[number]);
                      const bg = progressIndex === -1
                        ? 'linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(107, 114, 128, 0.15) 100%)'
                        : progressIndex === PROGRESS_OPTIONS.length - 1
                          ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.25) 0%, rgba(34, 197, 94, 0.2) 100%)'
                          : progressIndex >= 6
                            ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)'
                            : progressIndex >= 3
                              ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)';
                      const color = progressIndex === -1
                        ? '#4B5563'
                        : progressIndex === PROGRESS_OPTIONS.length - 1
                          ? '#15803D'
                          : progressIndex >= 6
                            ? '#1D4ED8'
                            : progressIndex >= 3
                              ? '#7C3AED'
                              : '#B45309';
                      return (
                        <Chip
                          label={effectiveProgress}
                          size="small"
                          sx={{
                            background: bg,
                            color,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 24,
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  {/* Anggaran - Total */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(59, 130, 246, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.anggaranTotal}
                    </Typography>
                  </TableCell>
                  {/* Anggaran - Tahun Ini */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(59, 130, 246, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.anggaranTahunIni}
                    </Typography>
                  </TableCell>
                  {/* Anggaran - Tahun Depan */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(59, 130, 246, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.jangkaWaktu.includes('Multiyears') ? item.anggaranTahunDepan : '-'}
                    </Typography>
                  </TableCell>
                  {/* Timeline - USREQ */}
                  {visibleTimelineColumns.has('usreq') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.02)' }}>
                      {item.targetUsreq && item.targetUsreq.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetUsreq.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetUsreq.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - Pengadaan */}
                  {visibleTimelineColumns.has('pengadaan') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.02)' }}>
                      {item.targetPengadaan && item.targetPengadaan.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetPengadaan.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetPengadaan.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - Desain */}
                  {visibleTimelineColumns.has('desain') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(220, 38, 38, 0.02)' }}>
                      {item.targetDesain && item.targetDesain.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetDesain.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetDesain.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - Coding */}
                  {visibleTimelineColumns.has('coding') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(37, 99, 235, 0.02)' }}>
                      {item.targetCoding && item.targetCoding.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetCoding.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetCoding.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - Unit Test */}
                  {visibleTimelineColumns.has('unitTest') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(217, 119, 6, 0.02)' }}>
                      {item.targetUnitTest && item.targetUnitTest.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetUnitTest.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetUnitTest.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - SIT */}
                  {visibleTimelineColumns.has('sit') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(124, 58, 237, 0.02)' }}>
                      {item.targetSit && item.targetSit.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetSit.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetSit.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - UAT/PDKK */}
                  {visibleTimelineColumns.has('uat') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(8, 145, 178, 0.02)' }}>
                      {item.targetUat && item.targetUat.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetUat.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetUat.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - Deployment */}
                  {visibleTimelineColumns.has('deployment') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(219, 39, 119, 0.02)' }}>
                      {item.targetDeployment && item.targetDeployment.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetDeployment.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetDeployment.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Timeline - Go Live */}
                  {visibleTimelineColumns.has('goLive') && (
                    <TableCell sx={{ py: 1.5, px: 1, whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.02)' }}>
                      {item.targetGoLive && item.targetGoLive.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {item.targetGoLive.map((date, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.75rem', fontWeight: 500 }}>
                              {item.targetGoLive.length > 1 && <span style={{ fontWeight: 700 }}>F{idx + 1}: </span>}
                              {formatMonthYear(date)}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</Typography>
                      )}
                    </TableCell>
                  )}
                  {/* Rencana PKSI - Status T01/T02 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(217, 119, 6, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.statusT01T02}
                    </Typography>
                  </TableCell>
                  {/* Rencana PKSI - Berkas Terbaru T01/T02 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(217, 119, 6, 0.04)' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleViewFileFromTable(item.id, 'T01')}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#D97706',
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.5,
                        background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(251, 191, 36, 0.08) 100%)',
                        border: '1px solid rgba(217, 119, 6, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(251, 191, 36, 0.12) 100%)',
                          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.15)',
                        },
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                  {/* Spesifikasi Kebutuhan - Status T11 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.statusT11}
                    </Typography>
                  </TableCell>
                  {/* Spesifikasi Kebutuhan - Berkas Terbaru T11 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.04)' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleViewFileFromTable(item.id, 'T11')}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#059669',
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.5,
                        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(52, 211, 153, 0.08) 100%)',
                        border: '1px solid rgba(5, 150, 105, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(52, 211, 153, 0.12) 100%)',
                          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)',
                        },
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                  {/* CD Prinsip - Nomor CD (only) */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(220, 38, 38, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.nomorCd}
                    </Typography>
                  </TableCell>
                  {/* Kontrak - Tgl Mulai */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(8, 145, 178, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.kontrakTanggalMulai}
                    </Typography>
                  </TableCell>
                  {/* Kontrak - Tgl Selesai */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(8, 145, 178, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.kontrakTanggalSelesai}
                    </Typography>
                  </TableCell>
                  {/* Kontrak - Nilai */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(8, 145, 178, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.kontrakNilai}
                    </Typography>
                  </TableCell>
                  {/* Kontrak - Jml Termin */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(8, 145, 178, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.kontrakJumlahTermin}
                    </Typography>
                  </TableCell>
                  {/* Kontrak - Detail Pembayaran */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(8, 145, 178, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.kontrakDetailPembayaran}
                    </Typography>
                  </TableCell>
                  {/* BA Deploy */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>
                    {item.baDeploy && item.baDeploy !== '-' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        href={item.baDeploy.startsWith('http') ? item.baDeploy : `https://${item.baDeploy}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          color: '#7C3AED',
                          borderColor: 'rgba(124, 58, 237, 0.3)',
                          bgcolor: 'rgba(124, 58, 237, 0.05)',
                          '&:hover': {
                            bgcolor: 'rgba(124, 58, 237, 0.1)',
                            borderColor: '#7C3AED',
                          },
                        }}
                      >
                        Lihat BA
                      </Button>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                    )}
                  </TableCell>
                  {/* Aksi */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Tooltip title="Lihat Detail PKSI">
                        <IconButton
                          size="small"
                          onClick={() => handleViewClick(item)}
                          sx={{
                            color: '#059669',
                            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)',
                              transform: 'scale(1.05)',
                              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)',
                            },
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      {!getUserRoles().includes('SKPA') && (
                        <Tooltip title="Edit PKSI">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(item)}
                            sx={{
                              color: '#D97706',
                              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '10px',
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%)',
                                transform: 'scale(1.05)',
                                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            '& .MuiTablePagination-select': {
              bgcolor: '#f5f5f7',
              borderRadius: '8px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
        />
      </Paper>

      {/* View PKSI Modal */}
      <ViewPksiModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedPksiIdForView(null);
          setViewingNestedPksiInfo(null);
        }}
        pksiId={selectedPksiIdForView}
        showMonitoringSection={true}
        nestedPksiInfo={viewingNestedPksiInfo}
      />

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

      {/* File List Dialog */}
      <Dialog
        open={fileDialogOpen}
        onClose={handleCloseFileDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          pb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: fileDialogTitle.includes('T01') 
                  ? 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: fileDialogTitle.includes('T01')
                  ? '0 4px 12px rgba(217, 119, 6, 0.25)'
                  : '0 4px 12px rgba(5, 150, 105, 0.25)',
              }}
            >
              <AttachFileIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '1rem' }}>
                {fileDialogTitle}
              </Typography>
              <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>
                {fileDialogFiles.length} dokumen
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseFileDialog} size="small" sx={{ color: '#86868b' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {isLoadingFiles ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} sx={{ color: fileDialogTitle.includes('T01') ? '#D97706' : '#059669' }} />
            </Box>
          ) : fileDialogFiles.length > 0 ? (
            <List dense sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '12px', p: 1 }}>
              {fileDialogFiles.map((file, index) => (
                <ListItem
                  key={file.id}
                  sx={{
                    borderRadius: '8px',
                    mb: index < fileDialogFiles.length - 1 ? 1 : 0,
                    bgcolor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FileIcon sx={{ 
                      color: fileDialogTitle.includes('T01') ? '#D97706' : '#059669', 
                      fontSize: 24 
                    }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{file.display_name || file.original_name || file.file_name || 'File'}</span>
                        {file.version && file.version > 1 && (
                          <Chip
                            label={`V${file.version}`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: fileDialogTitle.includes('T01') ? '#D97706' : '#059669',
                              color: 'white',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • Tgl. Dok: ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
                    primaryTypographyProps={{
                      sx: { fontWeight: 500, color: '#1d1d1f', fontSize: '0.9rem' },
                    }}
                    secondaryTypographyProps={{
                      sx: { color: '#86868b', fontSize: '0.75rem' },
                    }}
                  />
                  <ListItemSecondaryAction>
                    {isPreviewableFile(file.content_type) && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleFilePreviewFromDialog(file)}
                        sx={{
                          color: '#0891B2',
                          mr: 1,
                          '&:hover': { bgcolor: 'rgba(8, 145, 178, 0.1)' },
                        }}
                        title="Preview"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleFileDownloadFromDialog(file)}
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
                p: 4,
                textAlign: 'center',
                borderRadius: '12px',
                bgcolor: 'rgba(245, 245, 247, 0.8)',
              }}
            >
              <AttachFileIcon sx={{ fontSize: 48, color: '#86868b', mb: 1 }} />
              <Typography sx={{ color: '#86868b' }}>
                Belum ada dokumen yang diupload
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Approval Dialog - Apple Liquid Glass Style */}
      <Dialog
        open={openEditDialog}
        onClose={handleEditCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(250, 250, 252, 0.6) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2.5,
          px: 3,
        }}>
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(217, 119, 6, 0.15)',
          }}>
            <EditIcon sx={{ color: '#D97706', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ 
              fontWeight: 600, 
              fontSize: '1.1rem',
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}>
              Edit PKSI
            </Typography>
            {selectedPksiForEdit && (
              <Typography sx={{ 
                fontSize: '0.8rem', 
                color: '#86868b',
                mt: 0.25,
              }}>
                {selectedPksiForEdit.namaPksi}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          {selectedPksiForEdit && (
            <Box sx={{ 
              mb: 3,
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(145deg, rgba(245, 245, 247, 0.8) 0%, rgba(240, 240, 242, 0.6) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
            }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 2.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    color: '#86868b', 
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                  }}>
                    Nama Aplikasi
                  </Typography>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f',
                    fontSize: '0.9rem',
                  }}>
                    {selectedPksiForEdit.namaAplikasi}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    color: '#86868b', 
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                  }}>
                    SKPA
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {resolveSkpaCodes(selectedPksiForEdit.picSatkerBA).length > 0 ? (
                      resolveSkpaCodes(selectedPksiForEdit.picSatkerBA).map((code, idx) => {
                        const chipColor = getSkpaColor(code);
                        return (
                          <Chip
                            key={idx}
                            label={code}
                            size="small"
                            sx={{
                              bgcolor: chipColor.bg,
                              color: chipColor.text,
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 22,
                              borderRadius: '6px',
                            }}
                          />
                        );
                      })
                    ) : (
                      <Typography sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    color: '#86868b', 
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                  }}>
                    Bidang
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {resolveBidangNames(selectedPksiForEdit.picSatkerUuids).length > 0 ? (
                      resolveBidangNames(selectedPksiForEdit.picSatkerUuids).map((bidang, idx) => (
                        <Chip
                          key={idx}
                          label={bidang}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(107, 114, 128, 0.12)',
                            color: '#4B5563',
                            fontWeight: 500,
                            fontSize: '0.65rem',
                            height: 22,
                            borderRadius: '6px',
                          }}
                        />
                      ))
                    ) : (
                      <Typography sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ 
                    fontSize: '0.7rem', 
                    color: '#86868b', 
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                  }}>
                    Jangka Waktu
                  </Typography>
                  <Chip
                    label={selectedPksiForEdit.jangkaWaktu === 'Single Year' ? 'Single Year' : 'Multiyears'}
                    size="small"
                    sx={{
                      bgcolor: selectedPksiForEdit.jangkaWaktu === 'Single Year' 
                        ? 'rgba(139, 92, 246, 0.12)' 
                        : 'rgba(37, 99, 235, 0.12)',
                      color: selectedPksiForEdit.jangkaWaktu === 'Single Year' ? '#8B5CF6' : '#2563EB',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 24,
                      borderRadius: '8px',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Informasi RBSI - Highlighted Section */}
          <Box sx={{
            mb: 3,
            p: 2.5,
            borderRadius: '16px',
            background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.08) 0%, rgba(251, 191, 36, 0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(217, 119, 6, 0.2)',
            boxShadow: '0 4px 16px rgba(217, 119, 6, 0.08)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Typography sx={{ fontSize: '1.1rem' }}>📋</Typography>
              </Box>
              <Typography sx={{
                fontWeight: 600,
                color: '#D97706',
                fontSize: '0.9rem',
                letterSpacing: '-0.01em',
              }}>
                Informasi RBSI
              </Typography>
            </Box>
            <Box>
              <Typography sx={{
                fontSize: '0.7rem',
                color: '#92400E',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}>
                Inisiatif RBSI
              </Typography>
              <Typography sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                fontSize: '0.95rem',
                lineHeight: 1.5,
              }}>
                {editForm.inisiatifRbsi || '-'}
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ 
            fontWeight: 600, 
            color: '#1d1d1f', 
            mb: 2,
            fontSize: '0.85rem',
            letterSpacing: '-0.01em',
          }}>
            Informasi Persetujuan
          </Typography>

          {/* Tim Field - Liquid Glass Style */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel 
              id="edit-team-label"
              sx={{
                '&.Mui-focused': { color: '#D97706' },
              }}
            >
              Tim *
            </InputLabel>
            <Select
              labelId="edit-team-label"
              value={editForm.teamId}
              label="Tim *"
              onChange={(e) => {
                setEditForm({ 
                  ...editForm, 
                  teamId: e.target.value,
                });
              }}
              disabled={isLoadingTeams}
              sx={{
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(217, 119, 6, 0.3)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 4px 20px rgba(217, 119, 6, 0.12)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D97706',
                    borderWidth: '1.5px',
                  },
                },
              }}
            >
              <MenuItem value=""><em>Pilih Tim</em></MenuItem>
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name} {team.pic ? `(PIC: ${team.pic.fullName})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Display selected team info */}
          {editForm.teamId && teams.find(t => t.id === editForm.teamId) && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              borderRadius: '12px', 
              bgcolor: 'rgba(217, 119, 6, 0.05)',
              border: '1px solid rgba(217, 119, 6, 0.1)',
            }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#86868b', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                Info Tim
              </Typography>
              {(() => {
                const selectedTeam = teams.find(t => t.id === editForm.teamId);
                return (
                  <>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>PIC</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1d1d1f' }}>
                          {selectedTeam?.pic?.fullName || '-'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>Jumlah Anggota</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1d1d1f' }}>
                          {selectedTeam?.members?.length || 0} orang
                        </Typography>
                      </Box>
                    </Box>
                    {selectedTeam?.members && selectedTeam.members.length > 0 && (
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#86868b', mb: 0.5 }}>Anggota</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedTeam.members.map((member) => (
                            <Chip
                              key={member.uuid}
                              label={member.fullName}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(217, 119, 6, 0.1)',
                                color: '#D97706',
                                fontWeight: 500,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </>
                );
              })()}
            </Box>
          )}

          {/* IKU & Inhouse/Outsource - Side by Side */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* IKU Field */}
            <FormControl fullWidth>
              <InputLabel 
                id="edit-iku-label"
                sx={{ '&.Mui-focused': { color: '#D97706' } }}
              >
                IKU
              </InputLabel>
              <Select
                labelId="edit-iku-label"
                value={editForm.iku}
                label="IKU"
                onChange={(e) => setEditForm({ ...editForm, iku: e.target.value })}
                sx={{
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(217, 119, 6, 0.3)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 20px rgba(217, 119, 6, 0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D97706',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                <MenuItem value="ya">Ya</MenuItem>
                <MenuItem value="tidak">Tidak</MenuItem>
              </Select>
            </FormControl>

            {/* Inhouse/Outsource Field */}
            <FormControl fullWidth>
              <InputLabel 
                id="edit-inhouse-label"
                sx={{ '&.Mui-focused': { color: '#D97706' } }}
              >
                Inhouse/Outsource
              </InputLabel>
              <Select
                labelId="edit-inhouse-label"
                value={editForm.inhouseOutsource}
                label="Inhouse/Outsource"
                onChange={(e) => setEditForm({ ...editForm, inhouseOutsource: e.target.value })}
                sx={{
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(217, 119, 6, 0.3)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 20px rgba(217, 119, 6, 0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D97706',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                <MenuItem value="inhouse">Inhouse</MenuItem>
                <MenuItem value="outsource">Outsource</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Progress Tahapan Table */}
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5, fontSize: '0.85rem' }}>
              Progres Tahapan
            </Typography>
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
                  {TAHAPAN_CONFIG
                    .filter(tahapan => {
                      if (!selectedPksiForEdit) return true;
                      const targetDates = selectedPksiForEdit[tahapan.pksiTargetField] as string[];
                      return Array.isArray(targetDates) && targetDates.filter(d => d && d !== '-').length > 0;
                    })
                    .map((tahapan) => {
                    const status    = tahapanStatuses[tahapan.key] || 'Belum dimulai';
                    const isSelesai = status === 'Selesai';
                    const isDalam   = status === 'Dalam proses';
                    const rowBg     = isSelesai ? 'rgba(21,128,61,0.025)' : isDalam ? 'rgba(217,119,6,0.025)' : 'transparent';
                    const dateValue = tahapan.dateField
                      ? ((editForm as Record<string, string>)[tahapan.dateField] || '').split(',')[0].trim().substring(0, 10)
                      : '';

                    // Target date from PksiData target arrays
                    const targetDates = selectedPksiForEdit
                      ? (selectedPksiForEdit[tahapan.pksiTargetField] as string[]).filter(d => d && d !== '-')
                      : [];
                    const targetDate = targetDates.length > 0 ? targetDates[targetDates.length - 1] : null;
                    const displayTarget = targetDate ? targetDate.substring(0, 10) : '—';

                    // Ketepatan waktu
                    let ketepatanLabel: string | null = null;
                    let ketepatanColor = '#6B7280';
                    let ketepatanBg = '#F3F4F6';
                    if (isSelesai && dateValue && targetDate) {
                      const completion = new Date(dateValue);
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
                        sx={{ '&:last-child td': { borderBottom: 0 }, bgcolor: rowBg }}
                      >
                        <TableCell sx={{ fontSize: '0.82rem', py: 1, fontWeight: isDalam ? 600 : 400, color: isDalam ? '#D97706' : isSelesai ? '#15803D' : '#1d1d1f' }}>
                          {tahapan.label}
                        </TableCell>
                        <TableCell sx={{ py: 0.7 }}>
                          <Select
                            size="small"
                            value={status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              const newStatuses = { ...tahapanStatuses, [tahapan.key]: newStatus };
                              setTahapanStatuses(newStatuses);
                              // Sync progress: last tahapan that is Selesai or Dalam proses
                              let derivedProgress = 'Penyusunan Usreq';
                              for (const t of TAHAPAN_CONFIG) {
                                const s = newStatuses[t.key] || 'Belum dimulai';
                                if (s === 'Selesai' || s === 'Dalam proses') derivedProgress = t.key;
                              }
                              if (newStatus === 'Selesai' && tahapan.dateField) {
                                // Open date picker to set completion date
                                setDatePickerState({
                                  open: true,
                                  tahapanKey: tahapan.key,
                                  dateField: tahapan.dateField,
                                  value: ((editForm as Record<string, string>)[tahapan.dateField] || '').substring(0, 10),
                                });
                                setEditForm(prev => ({ ...prev, progress: derivedProgress }));
                              } else {
                                // Clear the date when status is not Selesai
                                const newForm = tahapan.dateField
                                  ? { ...editForm, progress: derivedProgress, [tahapan.dateField]: '' }
                                  : { ...editForm, progress: derivedProgress };
                                setEditForm(newForm);
                              }
                            }}
                            sx={{
                              fontSize: '0.78rem',
                              height: 30,
                              borderRadius: '8px',
                              color: isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280',
                              fontWeight: 600,
                              bgcolor: isSelesai ? '#F0FDF4' : isDalam ? '#FFFBEB' : '#F3F4F6',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: isSelesai ? 'rgba(21,128,61,0.4)' : isDalam ? 'rgba(217,119,6,0.4)' : 'rgba(107,114,128,0.4)' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280', borderWidth: '1px' },
                              '& .MuiSelect-icon': { color: isSelesai ? '#15803D' : isDalam ? '#D97706' : '#6B7280' },
                              minWidth: 138,
                            }}
                          >
                            <MenuItem value="Belum dimulai" sx={{ fontSize: '0.78rem' }}>Belum dimulai</MenuItem>
                            <MenuItem value="Dalam proses" sx={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 500 }}>Dalam proses</MenuItem>
                            <MenuItem value="Selesai" sx={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 500 }}>Selesai</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', py: 1, color: targetDate ? '#7C3AED' : '#86868b' }}>
                          {displayTarget}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          {tahapan.dateField ? (
                            isSelesai && dateValue ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography sx={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 500 }}>{dateValue}</Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => setDatePickerState({ open: true, tahapanKey: tahapan.key, dateField: tahapan.dateField!, value: dateValue })}
                                  sx={{ p: 0.3, color: '#15803D', '&:hover': { bgcolor: 'rgba(21,128,61,0.1)' } }}
                                >
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

          {/* Divider - Anggaran Section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#2563EB', 
              fontSize: '0.85rem',
              letterSpacing: '-0.01em',
            }}>
              Anggaran
            </Typography>
          </Box>

          {/* Anggaran Fields - 3 columns */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Total Anggaran"
              value={editForm.anggaranTotal}
              onChange={(e) => setEditForm({ ...editForm, anggaranTotal: e.target.value })}
              placeholder="Rp 0"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(37, 99, 235, 0.02)',
                  '& fieldset': { borderColor: 'rgba(37, 99, 235, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(37, 99, 235, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' },
              }}
            />
            <TextField
              fullWidth
              label={`Anggaran ${new Date().getFullYear()}`}
              value={editForm.anggaranTahunIni}
              onChange={(e) => setEditForm({ ...editForm, anggaranTahunIni: e.target.value })}
              placeholder="Rp 0"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(37, 99, 235, 0.02)',
                  '& fieldset': { borderColor: 'rgba(37, 99, 235, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(37, 99, 235, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' },
              }}
            />
            <TextField
              fullWidth
              label={`Anggaran ${new Date().getFullYear() + 1}`}
              value={editForm.anggaranTahunDepan}
              onChange={(e) => setEditForm({ ...editForm, anggaranTahunDepan: e.target.value })}
              placeholder="Rp 0"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(37, 99, 235, 0.02)',
                  '& fieldset': { borderColor: 'rgba(37, 99, 235, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(37, 99, 235, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' },
              }}
            />
          </Box>

          {/* Divider - Timeline Section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#8B5CF6', 
              fontSize: '0.85rem',
              letterSpacing: '-0.01em',
            }}>
              Timeline
            </Typography>
          </Box>

          {/* Stage Selector for Dynamic Timeline */}
          <StageSelector 
            selectedStages={selectedStages}
            onStagesChange={setSelectedStages}
          />

          {/* Timeline Stages with Phase Management */}
          {TIMELINE_CONFIGS.filter(config => selectedStages.has(config.key)).map(config => (
            <TimelineStage
              key={config.key}
              label={config.label}
              stages={timelinePhases[config.key]}
              gradient={config.gradient}
              rgb={config.rgb}
              onChange={(phaseIndex, value) => handleTimelineChange(config.key, phaseIndex, value)}
              onAddPhase={() => handleAddPhase(config.key)}
              onRemovePhase={(phaseIndex) => handleRemovePhase(config.key, phaseIndex)}
              onRemoveStage={() => {
                const newSelected = new Set(selectedStages);
                newSelected.delete(config.key);
                setSelectedStages(newSelected);
              }}
            />
          ))}

          {/* Divider - Rencana PKSI (T01/T02) Section */}
          <Box sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#D97706', 
              fontSize: '0.85rem',
              letterSpacing: '-0.01em',
            }}>
              Rencana PKSI (T01/T02)
            </Typography>
            {/* Auto Status Badge */}
            <Box sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '8px',
              background: filesT01Data.length > 0 
                ? 'linear-gradient(145deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                : 'linear-gradient(145deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
              border: filesT01Data.length > 0 ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <Typography sx={{ 
                fontSize: '0.7rem', 
                fontWeight: 600, 
                color: filesT01Data.length > 0 ? '#059669' : '#EF4444',
              }}>
                {filesT01Data.length > 0 ? '✓ Diterima' : '○ Belum Diterima'}
              </Typography>
            </Box>
          </Box>

          {/* T01/T02 File Dropzone */}
          <label
            htmlFor="t01-file-input"
            onDragOver={(e) => { e.preventDefault(); setIsDraggingT01(true); }}
            onDragLeave={() => setIsDraggingT01(false)}
            onDrop={handleDropT01}
            style={{
              display: 'block',
              border: isDraggingT01 ? '2px solid #D97706' : '2px dashed rgba(217, 119, 6, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
              textAlign: 'center',
              background: isDraggingT01 
                ? 'linear-gradient(145deg, rgba(217, 119, 6, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)'
                : 'linear-gradient(145deg, rgba(217, 119, 6, 0.04) 0%, rgba(217, 119, 6, 0.02) 100%)',
              cursor: isUploadingT01 ? 'not-allowed' : 'pointer',
              opacity: isUploadingT01 ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <input
              id="t01-file-input"
              type="file"
              multiple
              hidden
              onChange={handleFileSelectT01}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
              disabled={isUploadingT01}
            />
            {isUploadingT01 ? (
              <>
                <CircularProgress size={48} sx={{ color: '#D97706', mb: 1 }} />
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                  Mengupload file...
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                  border: '1px solid rgba(217, 119, 6, 0.2)',
                }}>
                  <CloudUploadIcon sx={{ fontSize: 26, color: '#D97706' }} />
                </Box>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem', mb: 0.5 }}>
                  Drop dokumen T01,T02 dan ND Pendukung di sini
                </Typography>
                <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>
                  atau klik untuk memilih file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Gambar)
                </Typography>
              </>
            )}
          </label>

          {/* T01/T02 Pending Files – set date per file then upload */}
          {pendingFilesT01.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon sx={{ color: '#D97706', fontSize: 18 }} />
                File akan diupload ({pendingFilesT01.length})
              </Typography>
              <Stack spacing={1.5}>
                {pendingFilesT01.map((pending, index) => (
                  <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.06) 0%, rgba(217, 119, 6, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <FileIcon sx={{ color: '#D97706', fontSize: 18, flexShrink: 0 }} />
                      <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                      <IconButton size="small" onClick={() => setPendingFilesT01(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                    <TextField
                      fullWidth
                      label="Tanggal Dokumen"
                      type="date"
                      size="small"
                      value={pending.tanggal}
                      onChange={(e) => setPendingFilesT01(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#D97706' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#D97706' } }}
                    />
                  </Box>
                ))}
              </Stack>
              <Button
                variant="contained"
                fullWidth
                onClick={handleUploadPendingT01}
                disabled={isUploadingT01}
                startIcon={isUploadingT01 ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                sx={{ mt: 1.5, background: 'linear-gradient(145deg, #D97706 0%, #F59E0B 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #B45309 0%, #D97706 100%)' } }}
              >
                {isUploadingT01 ? 'Mengupload...' : `Upload ${pendingFilesT01.length} File T01`}
              </Button>
            </Box>
          )}

          {/* T01/T02 Files List */}
          {filesT01Data.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                fontSize: '0.8rem',
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <FileIcon sx={{ color: '#D97706', fontSize: 18 }} />
                File yang diupload ({filesT01Data.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filesT01Data.map((file) => (
                  <Box
                    key={file.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.06) 0%, rgba(217, 119, 6, 0.02) 100%)',
                      borderRadius: '12px',
                      border: '1px solid rgba(217, 119, 6, 0.15)',
                    }}
                  >
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileIcon sx={{ color: '#D97706', fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ 
                        fontWeight: 500, 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {file.display_name || file.original_name || file.file_name || 'File tidak bernama'}
                      </Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem' }}>
                        {formatFileSize(file.file_size)}{file.tanggal_dokumen ? ` • Tgl. Dok: ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {isPreviewableT01(file.content_type) && (
                        <Tooltip title="Preview">
                          <IconButton 
                            size="small" 
                            onClick={() => handlePreviewFileT01(file)}
                            sx={{ 
                              color: '#0891B2',
                              background: 'linear-gradient(145deg, rgba(8, 145, 178, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%)',
                              width: 32,
                              height: 32,
                              borderRadius: '10px',
                              '&:hover': {
                                background: 'linear-gradient(145deg, rgba(8, 145, 178, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                              },
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Download">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownloadFileT01(file)}
                          disabled={downloadingFileId === file.id}
                          sx={{ 
                            color: '#059669',
                            background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            '&:hover': {
                              background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                            },
                          }}
                        >
                          {downloadingFileId === file.id ? (
                            <CircularProgress size={16} sx={{ color: '#059669' }} />
                          ) : (
                            <DownloadIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus file">
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveFileT01(file.id)}
                          sx={{ 
                            color: '#DC2626',
                            background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            '&:hover': {
                              background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                            },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Divider - Spesifikasi Kebutuhan (T11) Section */}
          <Box sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#059669', 
              fontSize: '0.85rem',
              letterSpacing: '-0.01em',
            }}>
              Spesifikasi Kebutuhan (T11)
            </Typography>
            {/* Auto Status Badge */}
            <Box sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '8px',
              background: filesT11Data.length > 0 
                ? 'linear-gradient(145deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                : 'linear-gradient(145deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
              border: filesT11Data.length > 0 ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <Typography sx={{ 
                fontSize: '0.7rem', 
                fontWeight: 600, 
                color: filesT11Data.length > 0 ? '#059669' : '#EF4444',
              }}>
                {filesT11Data.length > 0 ? '✓ Diterima' : '○ Belum Diterima'}
              </Typography>
            </Box>
          </Box>

          {/* T11 File Dropzone */}
          <label
            htmlFor="t11-file-input"
            onDragOver={(e) => { e.preventDefault(); setIsDraggingT11(true); }}
            onDragLeave={() => setIsDraggingT11(false)}
            onDrop={handleDropT11}
            style={{
              display: 'block',
              border: isDraggingT11 ? '2px solid #059669' : '2px dashed rgba(5, 150, 105, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
              textAlign: 'center',
              background: isDraggingT11 
                ? 'linear-gradient(145deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                : 'linear-gradient(145deg, rgba(5, 150, 105, 0.04) 0%, rgba(5, 150, 105, 0.02) 100%)',
              cursor: isUploadingT11 ? 'not-allowed' : 'pointer',
              opacity: isUploadingT11 ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <input
              id="t11-file-input"
              type="file"
              multiple
              hidden
              onChange={handleFileSelectT11}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
              disabled={isUploadingT11}
            />
            {isUploadingT11 ? (
              <>
                <CircularProgress size={48} sx={{ color: '#059669', mb: 1 }} />
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                  Mengupload file...
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                  border: '1px solid rgba(5, 150, 105, 0.2)',
                }}>
                  <CloudUploadIcon sx={{ fontSize: 26, color: '#059669' }} />
                </Box>
                <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem', mb: 0.5 }}>
                  Drop dokumen T11 dan ND Pendukung di sini
                </Typography>
                <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>
                  atau klik untuk memilih file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Gambar)
                </Typography>
              </>
            )}
          </label>

          {/* T11 Pending Files – set date per file then upload */}
          {pendingFilesT11.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon sx={{ color: '#059669', fontSize: 18 }} />
                File akan diupload ({pendingFilesT11.length})
              </Typography>
              <Stack spacing={1.5}>
                {pendingFilesT11.map((pending, index) => (
                  <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.06) 0%, rgba(5, 150, 105, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <FileIcon sx={{ color: '#059669', fontSize: 18, flexShrink: 0 }} />
                      <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                      <IconButton size="small" onClick={() => setPendingFilesT11(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                    <TextField
                      fullWidth
                      label="Tanggal Dokumen"
                      type="date"
                      size="small"
                      value={pending.tanggal}
                      onChange={(e) => setPendingFilesT11(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#059669' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#059669' } }}
                    />
                  </Box>
                ))}
              </Stack>
              <Button
                variant="contained"
                fullWidth
                onClick={handleUploadPendingT11}
                disabled={isUploadingT11}
                startIcon={isUploadingT11 ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                sx={{ mt: 1.5, background: 'linear-gradient(145deg, #059669 0%, #10B981 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #047857 0%, #059669 100%)' } }}
              >
                {isUploadingT11 ? 'Mengupload...' : `Upload ${pendingFilesT11.length} File T11`}
              </Button>
            </Box>
          )}

          {/* T11 Files List */}
          {filesT11Data.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                fontSize: '0.8rem',
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <FileIcon sx={{ color: '#059669', fontSize: 18 }} />
                File yang diupload ({filesT11Data.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filesT11Data.map((file) => (
                  <Box
                    key={file.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.06) 0%, rgba(5, 150, 105, 0.02) 100%)',
                      borderRadius: '12px',
                      border: '1px solid rgba(5, 150, 105, 0.15)',
                    }}
                  >
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileIcon sx={{ color: '#059669', fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ 
                        fontWeight: 500, 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {file.display_name || file.original_name || file.file_name || 'File tidak bernama'}
                      </Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem' }}>
                        {formatFileSize(file.file_size)}{file.tanggal_dokumen ? ` • Tgl. Dok: ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {isPreviewableT01(file.content_type) && (
                        <Tooltip title="Preview">
                          <IconButton 
                            size="small" 
                            onClick={() => handlePreviewFileT11(file)}
                            sx={{ 
                              color: '#0891B2',
                              background: 'linear-gradient(145deg, rgba(8, 145, 178, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%)',
                              width: 32,
                              height: 32,
                              borderRadius: '10px',
                              '&:hover': {
                                background: 'linear-gradient(145deg, rgba(8, 145, 178, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%)',
                              },
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Download">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownloadFileT11(file)}
                          disabled={downloadingFileId === file.id}
                          sx={{ 
                            color: '#059669',
                            background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            '&:hover': {
                              background: 'linear-gradient(145deg, rgba(5, 150, 105, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                            },
                          }}
                        >
                          {downloadingFileId === file.id ? (
                            <CircularProgress size={16} sx={{ color: '#059669' }} />
                          ) : (
                            <DownloadIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus file">
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveFileT11(file.id)}
                          sx={{ 
                            color: '#DC2626',
                            background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            '&:hover': {
                              background: 'linear-gradient(145deg, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                            },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Divider - CD Prinsip Section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#DC2626', 
              fontSize: '0.85rem',
              letterSpacing: '-0.01em',
            }}>
              CD Prinsip
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Nomor CD Prinsip"
            value={editForm.nomorCd}
            onChange={(e) => setEditForm({ ...editForm, nomorCd: e.target.value })}
            placeholder="Contoh: CD-001/PCS8/2026"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
                backgroundColor: 'rgba(220, 38, 38, 0.02)',
                '& fieldset': { borderColor: 'rgba(220, 38, 38, 0.15)' },
                '&:hover fieldset': { borderColor: 'rgba(220, 38, 38, 0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#DC2626' },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#DC2626' },
            }}
          />

          {/* Divider - Kontrak Section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#0891B2', 
              fontSize: '0.85rem',
              letterSpacing: '-0.01em',
            }}>
              Kontrak
            </Typography>
          </Box>

          {/* Kontrak Fields - 2 rows */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Tanggal Mulai"
              type="date"
              value={editForm.kontrakTanggalMulai}
              onChange={(e) => setEditForm({ ...editForm, kontrakTanggalMulai: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(8, 145, 178, 0.02)',
                  '& fieldset': { borderColor: 'rgba(8, 145, 178, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(8, 145, 178, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#0891B2' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0891B2' },
              }}
            />
            <TextField
              fullWidth
              label="Tanggal Selesai"
              type="date"
              value={editForm.kontrakTanggalSelesai}
              onChange={(e) => setEditForm({ ...editForm, kontrakTanggalSelesai: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(8, 145, 178, 0.02)',
                  '& fieldset': { borderColor: 'rgba(8, 145, 178, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(8, 145, 178, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#0891B2' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0891B2' },
              }}
            />
            <TextField
              fullWidth
              label="Nilai Kontrak"
              value={editForm.kontrakNilai}
              onChange={(e) => setEditForm({ ...editForm, kontrakNilai: e.target.value })}
              placeholder="Rp 0"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(8, 145, 178, 0.02)',
                  '& fieldset': { borderColor: 'rgba(8, 145, 178, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(8, 145, 178, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#0891B2' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0891B2' },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Jumlah Termin"
              value={editForm.kontrakJumlahTermin}
              onChange={(e) => setEditForm({ ...editForm, kontrakJumlahTermin: e.target.value })}
              placeholder="0"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(8, 145, 178, 0.02)',
                  '& fieldset': { borderColor: 'rgba(8, 145, 178, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(8, 145, 178, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#0891B2' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0891B2' },
              }}
            />
            <TextField
              fullWidth
              label="Detail Pembayaran"
              value={editForm.kontrakDetailPembayaran}
              onChange={(e) => setEditForm({ ...editForm, kontrakDetailPembayaran: e.target.value })}
              placeholder="Detail pembayaran termin"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(8, 145, 178, 0.02)',
                  '& fieldset': { borderColor: 'rgba(8, 145, 178, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(8, 145, 178, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#0891B2' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#0891B2' },
              }}
            />
          </Box>

          {/* Divider - BA Deploy Section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#1d1d1f', 
              fontSize: '0.85rem',
              letterSpacing: '-0.01em',
            }}>
              BA Deploy
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Link BA Deploy"
            value={editForm.baDeploy}
            onChange={(e) => setEditForm({ ...editForm, baDeploy: e.target.value })}
            placeholder="https://example.com/ba-deploy.pdf atau nama dokumen"
            helperText="Masukkan URL lengkap untuk dokumen BA Deploy"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(124, 58, 237, 0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#D97706' },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#D97706' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2.5, 
          background: 'linear-gradient(180deg, rgba(250, 250, 252, 0.6) 0%, rgba(245, 245, 247, 0.8) 100%)',
          borderTop: '1px solid rgba(0, 0, 0, 0.04)',
          gap: 1.5,
        }}>
          <Button
            onClick={handleEditCancel}
            sx={{
              color: '#64748B',
              fontWeight: 500,
              px: 3,
              py: 1,
              borderRadius: '12px',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Batal
          </Button>
          <Button
            onClick={handleEditSubmit}
            disabled={!editForm.teamId || isSubmittingEdit}
            variant="contained"
            startIcon={isSubmittingEdit ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '0.875rem',
              boxShadow: '0 4px 16px rgba(217, 119, 6, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
                boxShadow: '0 6px 24px rgba(217, 119, 6, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&:disabled': {
                background: 'rgba(217, 119, 6, 0.3)',
                color: 'rgba(255, 255, 255, 0.7)',
                boxShadow: 'none',
              },
            }}
          >
            {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Dialog — opened when tahapan status set to Selesai */}
      <Dialog
        open={datePickerState.open}
        onClose={() => setDatePickerState(prev => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '0.95rem', pb: 0.5, pt: 2.5, px: 3, color: '#1d1d1f' }}>
          Tanggal Penyelesaian
        </DialogTitle>
        <Box sx={{ px: 3, pb: 0.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 600 }}>
            {datePickerState.tahapanKey}
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <TextField
            fullWidth
            type="date"
            value={datePickerState.value}
            onChange={(e) => setDatePickerState(prev => ({ ...prev, value: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(21,128,61,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(21,128,61,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#15803D' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDatePickerState(prev => ({ ...prev, open: false }))}
            sx={{ borderRadius: '10px', color: '#6B7280', textTransform: 'none', fontWeight: 500 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            disabled={!datePickerState.value}
            onClick={() => {
              if (datePickerState.dateField) {
                setEditForm(prev => ({ ...prev, [datePickerState.dateField!]: datePickerState.value }));
              }
              setDatePickerState(prev => ({ ...prev, open: false }));
            }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#15803D',
              boxShadow: '0 4px 12px rgba(21,128,61,0.3)',
              '&:hover': { bgcolor: '#166534' },
              '&:disabled': { bgcolor: 'rgba(21,128,61,0.3)', color: 'white' },
            }}
          >
            Simpan Tanggal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PksiDisetujui;
