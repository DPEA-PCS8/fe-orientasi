import { useState, useEffect, useMemo, useCallback } from 'react';
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
  TableSortLabel,
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
  Snackbar,
  Alert,
  Link,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  TuneRounded,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  PushPin as PushPinIcon,
  AssessmentRounded,
  CalendarMonth as CalendarIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { searchApprovedFs2Documents, updateFs2Document, downloadApprovedFs2Excel, type Fs2DocumentData, type Fs2DocumentRequest } from '../api/fs2Api';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { getAllTeams, type Team } from '../api/teamApi';
import { usePermissions } from '../hooks/usePermissions';
import { DataCountDisplay } from '../components/DataCountDisplay';
import ViewFs2Modal from '../components/modals/ViewFs2Modal';
import { FilePreviewModal } from '../components/modals';
import { useSidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '../context/SidebarContext';
import {
  uploadFs2Files,
  getFs2Files,
  deleteFs2File,
  downloadFs2File,
  type Fs2FileData,
} from '../api/fs2FileApi';

// Interface for transformed data
interface Fs2DisetujuiData {
  id: string;
  namaAplikasi: string;
  namaFs2: string;
  progres: string;
  progresStatus: string;
  tanggalProgres: string;
  fasePengajuan: string;
  iku: string;
  bidang: string;
  skpa: string;
  mekanisme: string;
  pelaksanaan: string;
  tahun: number | null;
  tahunMulai: number | null;
  tahunSelesai: number | null;
  pic: string;
  anggotaTim: string;
  dokumenPath: string;
  // Dokumen Pengajuan F.S.2
  nomorNd: string;
  tanggalNd: string;
  berkasNd: string;
  berkasFs2: string;
  tanggalBerkasFs2: string;
  // CD Prinsip
  nomorCd: string;
  tanggalCd: string;
  berkasCd: string;
  berkasFs2a: string;
  tanggalBerkasFs2a: string;
  berkasFs2b: string;
  tanggalBerkasFs2b: string;
  // Pengujian
  targetPengujian: string;
  realisasiPengujian: string;
  berkasF45: string;
  tanggalBerkasF45: string;
  berkasF46: string;
  tanggalBerkasF46: string;
  // Deployment
  targetDeployment: string;
  realisasiDeployment: string;
  berkasNdBaDeployment: string;
  tanggalBerkasNdBa: string;
  // Go Live
  targetGoLive: string;
  // Keterangan
  keterangan: string;
}

const PROGRES_OPTIONS = ['ASESMEN', 'CODING', 'PDKK', 'DEPLOY_SELESAI'] as const;
const PROGRES_STATUS_OPTIONS = ['BELUM_DIMULAI', 'DALAM_PROSES', 'SELESAI'] as const;
const FASE_PENGAJUAN_OPTIONS = ['DESAIN', 'PEMELIHARAAN'] as const;

// Type for tahapan date fields (completion dates)
type Fs2TahapanDateField = 'tanggal_pengajuan_selesai' | 'tanggal_asesmen' | 'tanggal_pemrograman' | 'tanggal_pengujian_selesai' | 'tanggal_deployment_selesai' | 'tanggal_go_live';

// Type for tahapan target fields
type Fs2TahapanTargetField = 'target_pemrograman' | 'target_pengujian' | 'target_deployment' | 'target_go_live';

// FS2 Progress Tahapan Configuration (6 stages as per requirement)
const FS2_TAHAPAN_CONFIG: Array<{
  key: string;
  label: string;
  color: string;
  gradient: [string, string];
  rgb: string;
  dateField: Fs2TahapanDateField;
  targetField: Fs2TahapanTargetField | null;
  statusApiField: string;
}> = [
  { key: 'PENGAJUAN', label: 'Pengajuan', color: '#6366F1', gradient: ['#6366F1', '#818CF8'], rgb: '99,102,241', dateField: 'tanggal_pengajuan_selesai', targetField: null, statusApiField: 'tahapan_status_pengajuan' },
  { key: 'ASESMEN', label: 'Asesmen', color: '#8B5CF6', gradient: ['#8B5CF6', '#A78BFA'], rgb: '139,92,246', dateField: 'tanggal_asesmen', targetField: null, statusApiField: 'tahapan_status_asesmen' },
  { key: 'PEMROGRAMAN', label: 'Pemrograman', color: '#F59E0B', gradient: ['#F59E0B', '#FCD34D'], rgb: '245,158,11', dateField: 'tanggal_pemrograman', targetField: 'target_pemrograman', statusApiField: 'tahapan_status_pemrograman' },
  { key: 'PENGUJIAN', label: 'Pengujian', color: '#0EA5E9', gradient: ['#0EA5E9', '#38BDF8'], rgb: '14,165,233', dateField: 'tanggal_pengujian_selesai', targetField: 'target_pengujian', statusApiField: 'tahapan_status_pengujian' },
  { key: 'DEPLOYMENT', label: 'Deployment/Selesai', color: '#31A24C', gradient: ['#31A24C', '#4ADE80'], rgb: '49,162,76', dateField: 'tanggal_deployment_selesai', targetField: 'target_deployment', statusApiField: 'tahapan_status_deployment' },
  { key: 'GO_LIVE', label: 'Go Live', color: '#10B981', gradient: ['#10B981', '#34D399'], rgb: '16,185,129', dateField: 'tanggal_go_live', targetField: 'target_go_live', statusApiField: 'tahapan_status_go_live' },
];

// FS2 Timeline Configuration (3 stages: Pengujian, Deployment, Go Live) - No realisasi field per requirement
const FS2_TIMELINE_CONFIGS = [
  { key: 'pengujian' as const, label: 'Target Pengujian', targetField: 'target_pengujian', gradient: ['#0EA5E9', '#38BDF8'], rgb: '14,165,233' },
  { key: 'deployment' as const, label: 'Target Deployment', targetField: 'target_deployment', gradient: ['#31A24C', '#4ADE80'], rgb: '49,162,76' },
  { key: 'goLive' as const, label: 'Target Go Live', targetField: 'target_go_live', gradient: ['#10B981', '#34D399'], rgb: '16,185,129' },
] as const;

// Helper to derive current tahapan progress from completion dates (for Table Progres column)
const deriveProgresTahapan = (apiData: Fs2DocumentData): { tahapanLabel: string; status: string; tanggal: string | null; color: string } => {
  const completionDates: Record<string, string | null | undefined> = {
    'PENGAJUAN': apiData.tanggal_pengajuan_selesai,
    'ASESMEN': apiData.tanggal_asesmen,
    'PEMROGRAMAN': apiData.tanggal_pemrograman,
    'PENGUJIAN': apiData.tanggal_pengujian_selesai,
    'DEPLOYMENT': apiData.tanggal_deployment_selesai,
    'GO_LIVE': apiData.tanggal_go_live,
  };

  let currentTahapan: typeof FS2_TAHAPAN_CONFIG[0] | null = null;
  let currentStatus = 'Belum dimulai';

  // Find the current tahapan (first one without completion date after all completed ones)
  for (let i = 0; i < FS2_TAHAPAN_CONFIG.length; i++) {
    const tahapan = FS2_TAHAPAN_CONFIG[i];
    const hasCompletionDate = completionDates[tahapan.key] && completionDates[tahapan.key]!.length > 0;

    if (!hasCompletionDate) {
      // This is the current tahapan
      currentTahapan = tahapan;
      // Check if all previous are completed
      const allPreviousCompleted = i === 0 || FS2_TAHAPAN_CONFIG.slice(0, i).every(
        prev => completionDates[prev.key] && completionDates[prev.key]!.length > 0
      );
      currentStatus = allPreviousCompleted ? 'Dalam proses' : 'Belum dimulai';
      break;
    }
  }

  // If all tahapan are completed (Go Live has date), show Go Live - Selesai
  if (!currentTahapan) {
    const goLiveTahapan = FS2_TAHAPAN_CONFIG.find(t => t.key === 'GO_LIVE')!;
    const goLiveDate = completionDates['GO_LIVE'];
    return {
      tahapanLabel: goLiveTahapan.label,
      status: 'Selesai',
      tanggal: goLiveDate || null,
      color: goLiveTahapan.color,
    };
  }

  return {
    tahapanLabel: currentTahapan.label,
    status: currentStatus,
    tanggal: null, // Only show date when Go Live is Selesai
    color: currentTahapan.color,
  };
};
const MEKANISME_OPTIONS = ['INHOUSE', 'OUTSOURCE'] as const;
const PELAKSANAAN_OPTIONS = ['SINGLE_YEAR', 'MULTIYEARS'] as const;

const PROGRES_LABELS: Record<string, string> = {
  ASESMEN: 'Asesmen',
  CODING: 'Coding',
  PDKK: 'PDKK',
  DEPLOY_SELESAI: 'Deploy',
};

const PROGRES_STATUS_LABELS: Record<string, string> = {
  BELUM_DIMULAI: 'Belum Dimulai',
  DALAM_PROSES: 'Dalam Proses',
  SELESAI: 'Selesai',
};

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

// Helper to format month and year only (for Jadwal Pelaksanaan fields)
const formatMonthYear = (dateString?: string | null): string => {
  if (!dateString || dateString === '-') return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

// Month options for dropdown
const MONTH_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

// Generate years from 5 years ago to 10 years in future
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const year = currentYear - 5 + i;
  return { value: year.toString(), label: year.toString() };
});

// Helper to extract month from date string (YYYY-MM-DD or YYYY-MM)
const getMonthFromDate = (dateString?: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length >= 2 ? parts[1] : '';
};

// Helper to extract year from date string (YYYY-MM-DD or YYYY-MM)
const getYearFromDate = (dateString?: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length >= 1 ? parts[0] : '';
};

// Helper to build date string from month and year
const buildDateFromMonthYear = (month: string, year: string): string => {
  if (!month || !year) return '';
  return `${year}-${month}-01`;
};

// Transform API data to UI format
const transformApiData = (apiData: Fs2DocumentData): Fs2DisetujuiData => {
  return {
    id: apiData.id,
    namaAplikasi: apiData.nama_aplikasi || '-',
    namaFs2: apiData.nama_fs2 || '-',
    progres: apiData.progres || '-',
    progresStatus: apiData.progres_status || '-',
    tanggalProgres: apiData.tanggal_progres || '-',
    fasePengajuan: apiData.fase_pengajuan || '-',
    iku: apiData.iku || '-',
    bidang: apiData.nama_bidang || '-',
    skpa: apiData.kode_skpa || apiData.nama_skpa || '-',
    mekanisme: apiData.mekanisme || '-',
    pelaksanaan: apiData.pelaksanaan || '-',
    tahun: apiData.tahun || null,
    tahunMulai: apiData.tahun_mulai || null,
    tahunSelesai: apiData.tahun_selesai || null,
    pic: apiData.pic_name || '-',
    anggotaTim: apiData.anggota_tim_names || '-',
    dokumenPath: apiData.dokumen_path || '',
    // Dokumen Pengajuan F.S.2
    nomorNd: apiData.nomor_nd || '-',
    tanggalNd: apiData.tanggal_nd || '-',
    berkasNd: apiData.berkas_nd || '',
    berkasFs2: apiData.berkas_fs2 || '',
    tanggalBerkasFs2: apiData.tanggal_berkas_fs2 || '-',
    // CD Prinsip
    nomorCd: apiData.nomor_cd || '-',
    tanggalCd: apiData.tanggal_cd || '-',
    berkasCd: apiData.berkas_cd || '',
    berkasFs2a: apiData.berkas_fs2a || '',
    tanggalBerkasFs2a: apiData.tanggal_berkas_fs2a || '-',
    berkasFs2b: apiData.berkas_fs2b || '',
    tanggalBerkasFs2b: apiData.tanggal_berkas_fs2b || '-',
    // Pengujian - format as Month Year
    targetPengujian: formatMonthYear(apiData.target_pengujian),
    realisasiPengujian: formatMonthYear(apiData.realisasi_pengujian),
    berkasF45: apiData.berkas_f45 || '',
    tanggalBerkasF45: apiData.tanggal_berkas_f45 || '-',
    berkasF46: apiData.berkas_f46 || '',
    tanggalBerkasF46: apiData.tanggal_berkas_f46 || '-',
    // Deployment - format as Month Year
    targetDeployment: formatMonthYear(apiData.target_deployment),
    realisasiDeployment: formatMonthYear(apiData.realisasi_deployment),
    berkasNdBaDeployment: apiData.berkas_nd_ba_deployment || '',
    tanggalBerkasNdBa: apiData.tanggal_berkas_nd_ba || '-',
    // Go Live - format as Month Year
    targetGoLive: formatMonthYear(apiData.target_go_live),
    // Keterangan
    keterangan: apiData.keterangan || '-',
  };
};

// Helper function to render text with clickable URLs
const renderTextWithLinks = (text: string) => {
  if (!text || text === '-') return text;
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <Link
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#0066CC',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

type Order = 'asc' | 'desc';

// Color palette for chips
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

const getChipColor = (code: string): { bg: string; text: string } => {
  if (!code) return SKPA_COLORS[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SKPA_COLORS.length;
  return SKPA_COLORS[index];
};

// Note: PROGRES_COLORS removed - Progres column now uses tahapan-based colors from FS2_TAHAPAN_CONFIG

function Fs2Disetujui() {
  const { isCollapsed } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [keyword, setKeyword] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Fs2DisetujuiData>('namaAplikasi');
  const [order, setOrder] = useState<Order>('asc');
  const [fs2Data, setFs2Data] = useState<Fs2DisetujuiData[]>([]);
  const [rawData, setRawData] = useState<Fs2DocumentData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Permission check
  const { getMenuPermissions } = usePermissions();
  const fs2Permissions = getMenuPermissions('FS2_APPROVED');

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProgres, setSelectedProgres] = useState<Set<string>>(new Set());
  const [selectedProgresStatus, setSelectedProgresStatus] = useState<Set<string>>(new Set());
  const [selectedFase, setSelectedFase] = useState<Set<string>>(new Set());
  const [selectedMekanisme, setSelectedMekanisme] = useState<Set<string>>(new Set());
  const [selectedPelaksanaan, setSelectedPelaksanaan] = useState<Set<string>>(new Set());
  const [selectedBidangFilter, setSelectedBidangFilter] = useState<string>('');
  const [selectedSkpaFilter, setSelectedSkpaFilter] = useState<string>('');
  
  // Year filter (exposed in toolbar) - default to current year, filters by tanggal_pengajuan
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>(new Date().getFullYear().toString());
  
  // Month range filter (exposed in toolbar) - filters by tanggal_pengajuan month
  const [selectedStartMonth, setSelectedStartMonth] = useState<string>('');
  const [selectedEndMonth, setSelectedEndMonth] = useState<string>('');

  // Snackbar notification
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' });

  // Sticky columns configuration
  const [stickyColumnsAnchorEl, setStickyColumnsAnchorEl] = useState<null | HTMLElement>(null);
  const [stickyColumns, setStickyColumns] = useState<Set<string>>(new Set(['no', 'namaAplikasi']));
  
  // Column definitions for sticky configuration - all table columns
  const COLUMN_OPTIONS = useMemo(() => [
    { id: 'no', label: 'No', width: 50 },
    { id: 'namaAplikasi', label: 'Nama Aplikasi', width: 160 },
    { id: 'namaFs2', label: 'Nama FS2', width: 180 },
    { id: 'progres', label: 'Progres', width: 100 },
    { id: 'fasePengajuan', label: 'Fase Pengajuan', width: 130 },
    { id: 'iku', label: 'IKU', width: 80 },
    { id: 'bidang', label: 'Bidang', width: 120 },
    { id: 'skpa', label: 'SKPA', width: 100 },
    { id: 'mekanisme', label: 'Mekanisme', width: 100 },
    { id: 'pelaksanaan', label: 'Pelaksanaan', width: 140 },
    { id: 'pic', label: 'PIC', width: 120 },
    { id: 'anggotaTim', label: 'Anggota Tim', width: 160 },
    { id: 'dokumenPengajuan', label: 'Dokumen Pengajuan F.S.2', width: 360 },
    { id: 'cdPrinsip', label: 'CD Prinsip Persetujuan FS2', width: 440 },
    { id: 'pengujian', label: 'Pengujian', width: 360 },
    { id: 'deployment', label: 'Deployment', width: 300 },
    { id: 'goLive', label: 'Go Live', width: 100 },
    { id: 'keterangan', label: 'Keterangan', width: 150 },
  ], []);

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
  }, [stickyColumns, COLUMN_OPTIONS]);

  const isLastStickyColumn = useCallback((columnId: string): boolean => {
    if (!stickyColumns.has(columnId)) return false;
    const orderedSticky = COLUMN_OPTIONS.filter(col => stickyColumns.has(col.id));
    return orderedSticky[orderedSticky.length - 1]?.id === columnId;
  }, [stickyColumns, COLUMN_OPTIONS]);

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

  // Reference data
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Edit modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedFs2, setSelectedFs2] = useState<Fs2DocumentData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Fs2DocumentRequest>>({});

  // Date picker dialog state (opened when editing completion date)
  const [datePickerState, setDatePickerState] = useState<{
    open: boolean;
    tahapanKey: string;
    dateField: Fs2TahapanDateField | null;
    value: string;
  }>({ open: false, tahapanKey: '', dateField: null, value: '' });

  // View modal state
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedFs2IdForView, setSelectedFs2IdForView] = useState<string | null>(null);

  // File preview modal state (popup preview for berkas links)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');

  // File upload state for Edit Modal - separate for each file type
  const [filesND, setFilesND] = useState<Fs2FileData[]>([]);
  const [filesFS2, setFilesFS2] = useState<Fs2FileData[]>([]);
  const [filesCD, setFilesCD] = useState<Fs2FileData[]>([]);
  const [filesFS2A, setFilesFS2A] = useState<Fs2FileData[]>([]);
  const [filesFS2B, setFilesFS2B] = useState<Fs2FileData[]>([]);
  const [filesF45, setFilesF45] = useState<Fs2FileData[]>([]);
  const [filesF46, setFilesF46] = useState<Fs2FileData[]>([]);
  const [filesNDBA, setFilesNDBA] = useState<Fs2FileData[]>([]);
  
  // Pending files state for PKSI-style upload (stage files with date before upload)
  const [pendingFilesND, setPendingFilesND] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesFS2, setPendingFilesFS2] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesCD, setPendingFilesCD] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesFS2A, setPendingFilesFS2A] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesFS2B, setPendingFilesFS2B] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesF45, setPendingFilesF45] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesF46, setPendingFilesF46] = useState<Array<{ file: File; tanggal: string }>>([]);
  const [pendingFilesNDBA, setPendingFilesNDBA] = useState<Array<{ file: File; tanggal: string }>>([]);
  
  // Upload loading state for each file type
  const [isUploadingND, setIsUploadingND] = useState(false);
  const [isUploadingFS2, setIsUploadingFS2] = useState(false);
  const [isUploadingCD, setIsUploadingCD] = useState(false);
  const [isUploadingFS2A, setIsUploadingFS2A] = useState(false);
  const [isUploadingFS2B, setIsUploadingFS2B] = useState(false);
  const [isUploadingF45, setIsUploadingF45] = useState(false);
  const [isUploadingF46, setIsUploadingF46] = useState(false);
  const [isUploadingNDBA, setIsUploadingNDBA] = useState(false);
  
  // Drag & drop state for each file type
  const [isDraggingND, setIsDraggingND] = useState(false);
  const [isDraggingFS2, setIsDraggingFS2] = useState(false);
  const [isDraggingCD, setIsDraggingCD] = useState(false);
  const [isDraggingFS2A, setIsDraggingFS2A] = useState(false);
  const [isDraggingFS2B, setIsDraggingFS2B] = useState(false);
  const [isDraggingF45, setIsDraggingF45] = useState(false);
  const [isDraggingF46, setIsDraggingF46] = useState(false);
  const [isDraggingNDBA, setIsDraggingNDBA] = useState(false);
  
  // File operation state
  const [fileErrorMessage, setFileErrorMessage] = useState('');
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<Fs2FileData | null>(null);
  
  // File list dialog state (for viewing files from table)
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileDialogTitle, setFileDialogTitle] = useState('');
  const [fileDialogFiles, setFileDialogFiles] = useState<Fs2FileData[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Fetch approved F.S.2 data
  const fetchFs2Data = useCallback(async () => {
    setIsLoading(true);
    try {
      const progresFilter = selectedProgres.size === 1 ? Array.from(selectedProgres)[0] : undefined;
      const progresStatusFilter = selectedProgresStatus.size === 1 ? Array.from(selectedProgresStatus)[0] : undefined;
      const faseFilter = selectedFase.size === 1 ? Array.from(selectedFase)[0] : undefined;
      const mekanismeFilter = selectedMekanisme.size === 1 ? Array.from(selectedMekanisme)[0] : undefined;
      const pelaksanaanFilter = selectedPelaksanaan.size === 1 ? Array.from(selectedPelaksanaan)[0] : undefined;

      // Parse year filter for backend API
      const yearFilter = selectedYearFilter ? parseInt(selectedYearFilter, 10) : undefined;
      
      // Parse month filters for backend API
      const startMonthFilter = selectedStartMonth ? parseInt(selectedStartMonth, 10) : undefined;
      const endMonthFilter = selectedEndMonth ? parseInt(selectedEndMonth, 10) : undefined;

      const response = await searchApprovedFs2Documents({
        search: keyword || undefined,
        bidang_id: selectedBidangFilter || undefined,
        skpa_id: selectedSkpaFilter || undefined,
        progres: progresFilter,
        progres_status: progresStatusFilter,
        fase_pengajuan: faseFilter,
        mekanisme: mekanismeFilter,
        pelaksanaan: pelaksanaanFilter,
        year: yearFilter,
        start_month: startMonthFilter,
        end_month: endMonthFilter,
        page: page,
        size: rowsPerPage,
      });

      const transformedData = response.content.map(transformApiData);
      setFs2Data(transformedData);
      setRawData(response.content);
      setTotalElements(response.total_elements);
    } catch (error) {
      console.error('Failed to fetch F.S.2 data:', error);
      setFs2Data([]);
      setRawData([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, rowsPerPage, selectedProgres, selectedProgresStatus, selectedFase, selectedMekanisme, selectedPelaksanaan, selectedBidangFilter, selectedSkpaFilter, selectedYearFilter, selectedStartMonth, selectedEndMonth]);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      setIsLoadingTeams(true);
      try {
        const [bidang, skpaRes, teamsData] = await Promise.all([
          getAllBidang(),
          getAllSkpa(),
          getAllTeams(),
        ]);
        setBidangList(bidang);
        setSkpaList(skpaRes.data || []);
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
      } finally {
        setIsLoadingTeams(false);
      }
    };
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchFs2Data();
  }, [fetchFs2Data]);

  // Auto-open modal when id parameter is present in URL
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && rawData.length > 0 && !isLoading && !openEditModal) {
      const fs2 = rawData.find(f => f.id === idParam);
      if (fs2) {
        // Remove id param from URL to avoid re-triggering
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        setSearchParams(newParams, { replace: true });
        // Open modal
        handleOpenViewModal(fs2.id);
      }
    }
  }, [rawData, isLoading, searchParams, openEditModal]);

  const handleRequestSort = (property: keyof Fs2DisetujuiData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const clearFilters = () => {
    setSelectedProgres(new Set());
    setSelectedProgresStatus(new Set());
    setSelectedFase(new Set());
    setSelectedMekanisme(new Set());
    setSelectedPelaksanaan(new Set());
    setSelectedBidangFilter('');
    setSelectedSkpaFilter('');
    setSelectedYearFilter(new Date().getFullYear().toString());
    setSelectedStartMonth('');
    setSelectedEndMonth('');
  };

  // Generate year options from rawData (tanggal_pengajuan or tahun field)
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    const currentYear = new Date().getFullYear();
    // Add current year and surrounding years as defaults
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      years.add(y.toString());
    }
    // Extract years from rawData
    rawData.forEach(item => {
      if (item.tanggal_pengajuan) {
        const year = new Date(item.tanggal_pengajuan).getFullYear();
        if (!isNaN(year)) years.add(year.toString());
      }
      if (item.tahun) {
        years.add(item.tahun.toString());
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [rawData]);

  // Month options for filtering
  const monthOptions = useMemo(() => [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ], []);

  // Filter fs2Data by selected year
  // Note: Year filter is now handled by backend
  const filteredFs2Data = useMemo(() => {
    // Year filtering is now done by backend, so just return the data as-is
    return fs2Data;
  }, [fs2Data]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedProgres.size > 0) count++;
    if (selectedProgresStatus.size > 0) count++;
    if (selectedFase.size > 0) count++;
    if (selectedMekanisme.size > 0) count++;
    if (selectedPelaksanaan.size > 0) count++;
    if (selectedBidangFilter) count++;
    if (selectedSkpaFilter) count++;
    return count;
  }, [selectedProgres, selectedProgresStatus, selectedFase, selectedMekanisme, selectedPelaksanaan, selectedBidangFilter, selectedSkpaFilter]);

  // View modal handlers
  const handleOpenViewModal = (fs2Id: string) => {
    setSelectedFs2IdForView(fs2Id);
    setOpenViewModal(true);
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setSelectedFs2IdForView(null);
  };

  // Get content type from URL
  const getContentTypeFromUrl = (url: string): string => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.pdf') || lowerUrl.includes('pdf')) return 'application/pdf';
    if (lowerUrl.endsWith('.png')) return 'image/png';
    if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) return 'image/jpeg';
    if (lowerUrl.endsWith('.gif')) return 'image/gif';
    return 'application/pdf'; // Default to PDF for preview
  };

  // Handler to view files from table (shows file list dialog)
  const handleViewFileFromTable = async (fs2Id: string, fileType: string) => {
    const fileTypeMap: Record<string, string> = {
      'ND': 'Berkas ND',
      'FS2': 'Berkas F.S.2',
      'CD': 'Berkas CD Prinsip',
      'FS2A': 'Berkas F.S.2A',
      'FS2B': 'Berkas F.S.2B',
      'F45': 'Berkas F45',
      'F46': 'Berkas F46',
      'NDBA': 'Berkas ND/BA Deployment',
    };
    
    const title = fileTypeMap[fileType] || 'Dokumen';
    setFileDialogTitle(title);
    setFileDialogOpen(true);
    setIsLoadingFiles(true);
    
    try {
      const files = await getFs2Files(fs2Id);
      const filteredFiles = files.filter(f => f.file_type === fileType);
      setFileDialogFiles(filteredFiles);
    } catch (error) {
      console.error('Error fetching F.S.2 files:', error);
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

  const handleFilePreviewFromDialog = (file: Fs2FileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleFileDownloadFromDialog = async (file: Fs2FileData) => {
    try {
      setDownloadingFileId(file.id);
      await downloadFs2File(file.id, file.original_name);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Edit modal handlers
  const handleOpenEditModal = async (fs2Id: string) => {
    const fs2 = rawData.find(item => item.id === fs2Id);
    if (fs2) {
      setSelectedFs2(fs2);
      setEditFormData({
        progres: fs2.progres || '',
        progres_status: fs2.progres_status || '',
        tanggal_progres: fs2.tanggal_progres || '',
        fase_pengajuan: fs2.fase_pengajuan || '',
        iku: fs2.iku || '',
        mekanisme: fs2.mekanisme || '',
        pelaksanaan: fs2.pelaksanaan || '',
        tahun: fs2.tahun || undefined,
        tahun_mulai: fs2.tahun_mulai || undefined,
        tahun_selesai: fs2.tahun_selesai || undefined,
        pic_id: fs2.pic_id || '',
        team_id: fs2.team_id || '',
        anggota_tim: fs2.anggota_tim || '',
        anggota_tim_names: fs2.anggota_tim_names || '',
        bidang_id: fs2.bidang_id || '',
        // PKSI Reference (for DESAIN status)
        pksi_id: fs2.pksi_id || '',
        // Dokumen Pengajuan F.S.2
        nomor_nd: fs2.nomor_nd || '',
        tanggal_nd: fs2.tanggal_nd || '',
        tanggal_berkas_fs2: fs2.tanggal_berkas_fs2 || '',
        // CD Prinsip
        nomor_cd: fs2.nomor_cd || '',
        tanggal_cd: fs2.tanggal_cd || '',
        tanggal_berkas_fs2a: fs2.tanggal_berkas_fs2a || '',
        tanggal_berkas_fs2b: fs2.tanggal_berkas_fs2b || '',
        // Pengujian
        target_pengujian: fs2.target_pengujian || '',
        realisasi_pengujian: fs2.realisasi_pengujian || '',
        tanggal_berkas_f45: fs2.tanggal_berkas_f45 || '',
        tanggal_berkas_f46: fs2.tanggal_berkas_f46 || '',
        // Deployment
        target_deployment: fs2.target_deployment || '',
        realisasi_deployment: fs2.realisasi_deployment || '',
        tanggal_berkas_nd_ba: fs2.tanggal_berkas_nd_ba || '',
        // Go Live
        target_go_live: fs2.target_go_live || '',
        // Keterangan
        keterangan: fs2.keterangan || '',
        // Tahapan completion dates
        tanggal_pengajuan_selesai: fs2.tanggal_pengajuan_selesai || '',
        tanggal_asesmen: fs2.tanggal_asesmen || '',
        target_pemrograman: fs2.target_pemrograman || '',
        tanggal_pemrograman: fs2.tanggal_pemrograman || '',
        tanggal_pengujian_selesai: fs2.tanggal_pengujian_selesai || '',
        tanggal_deployment_selesai: fs2.tanggal_deployment_selesai || '',
        tanggal_go_live: fs2.tanggal_go_live || '',
      });

      // Initialize per-tahapan statuses derived from completion dates
      // Logic: Status is derived from completion dates, not manually saved
      // - If a tahapan has a completion date, status = "Selesai"
      // - First tahapan without completion date (after all Selesai) = "Dalam proses"
      // - Others = "Belum dimulai"
      const completionDates: Record<string, string> = {
        'PENGAJUAN': fs2.tanggal_pengajuan_selesai || '',
        'ASESMEN': fs2.tanggal_asesmen || '',
        'PEMROGRAMAN': fs2.tanggal_pemrograman || '',
        'PENGUJIAN': fs2.tanggal_pengujian_selesai || '',
        'DEPLOYMENT': fs2.tanggal_deployment_selesai || '',
        'GO_LIVE': fs2.tanggal_go_live || '',
      };
      
      const derivedStatuses: Record<string, string> = {};
      let foundCurrentTahapan = false;
      
      FS2_TAHAPAN_CONFIG.forEach((tahapan, index) => {
        const hasCompletionDate = completionDates[tahapan.key] && completionDates[tahapan.key].length > 0;
        
        if (hasCompletionDate) {
          derivedStatuses[tahapan.key] = 'Selesai';
        } else if (!foundCurrentTahapan) {
          // First tahapan without completion date becomes "Dalam proses"
          // But only if it's the first one OR the previous one is "Selesai"
          if (index === 0) {
            derivedStatuses[tahapan.key] = 'Dalam proses';
            foundCurrentTahapan = true;
          } else {
            const prevTahapan = FS2_TAHAPAN_CONFIG[index - 1];
            const prevHasDate = completionDates[prevTahapan.key] && completionDates[prevTahapan.key].length > 0;
            if (prevHasDate) {
              derivedStatuses[tahapan.key] = 'Dalam proses';
              foundCurrentTahapan = true;
            } else {
              derivedStatuses[tahapan.key] = 'Belum dimulai';
            }
          }
        } else {
          derivedStatuses[tahapan.key] = 'Belum dimulai';
        }
      });
      // Note: statuses are derived from completion dates in real-time during render
      
      // Load existing files for this F.S.2 document
      try {
        const existingFiles = await getFs2Files(fs2Id);
        setFilesND(existingFiles.filter(f => f.file_type === 'ND'));
        setFilesFS2(existingFiles.filter(f => f.file_type === 'FS2'));
        setFilesCD(existingFiles.filter(f => f.file_type === 'CD'));
        setFilesFS2A(existingFiles.filter(f => f.file_type === 'FS2A'));
        setFilesFS2B(existingFiles.filter(f => f.file_type === 'FS2B'));
        setFilesF45(existingFiles.filter(f => f.file_type === 'F45'));
        setFilesF46(existingFiles.filter(f => f.file_type === 'F46'));
        setFilesNDBA(existingFiles.filter(f => f.file_type === 'NDBA'));
      } catch (error) {
        console.error('Failed to load existing files:', error);
      }
      
      setOpenEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedFs2(null);
    setEditFormData({});
    // Clear file states
    setFilesND([]);
    setFilesFS2([]);
    setFilesCD([]);
    setFilesFS2A([]);
    setFilesFS2B([]);
    setFilesF45([]);
    setFilesF46([]);
    setFilesNDBA([]);
    // Clear pending files states
    setPendingFilesND([]);
    setPendingFilesFS2([]);
    setPendingFilesCD([]);
    setPendingFilesFS2A([]);
    setPendingFilesFS2B([]);
    setPendingFilesF45([]);
    setPendingFilesF46([]);
    setPendingFilesNDBA([]);
    setFileErrorMessage('');
  };

  // Generic file select handler - PKSI-style staging (stage files with date before upload)
  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    _fileType: string,
    setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; tanggal: string }>>>
  ) => {
    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    const ALLOWED_FILE_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file size (max 8MB)
      if (!file.size || file.size <= 0) {
        alert('File tidak valid. Silakan pilih file yang valid.');
        event.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Ukuran file (${fileSizeMB} MB) melebihi batas maksimal 8MB. Silakan pilih file yang lebih kecil.`);
        event.target.value = '';
        return;
      }

      // Validate file type (PDF and Word only)
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        alert('Format file tidak didukung. Hanya file PDF dan Word (.pdf, .doc, .docx) yang diperbolehkan.');
        event.target.value = '';
        return;
      }

      // Stage the file with empty date
      setPendingFiles(prev => [...prev, { file, tanggal: '' }]);
    }
    event.target.value = '';
  };

  // File select handlers for each type
  const handleFileSelectND = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'ND', setPendingFilesND);
  const handleFileSelectFS2 = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'FS2', setPendingFilesFS2);
  const handleFileSelectCD = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'CD', setPendingFilesCD);
  const handleFileSelectFS2A = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'FS2A', setPendingFilesFS2A);
  const handleFileSelectFS2B = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'FS2B', setPendingFilesFS2B);
  const handleFileSelectF45 = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'F45', setPendingFilesF45);
  const handleFileSelectF46 = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'F46', setPendingFilesF46);
  const handleFileSelectNDBA = (e: React.ChangeEvent<HTMLInputElement>) => 
    handleFileSelect(e, 'NDBA', setPendingFilesNDBA);

  // Generic drag & drop handler - PKSI-style staging
  const handleFileDrop = (
    event: React.DragEvent<HTMLElement>,
    _fileType: string,
    setDragging: (val: boolean) => void,
    setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; tanggal: string }>>>
  ) => {
    event.preventDefault();
    setDragging(false);
    
    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    const ALLOWED_FILE_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file size (max 8MB)
      if (!file.size || file.size <= 0) {
        alert('File tidak valid. Silakan pilih file yang valid.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Ukuran file (${fileSizeMB} MB) melebihi batas maksimal 8MB. Silakan pilih file yang lebih kecil.`);
        return;
      }

      // Validate file type (PDF and Word only)
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        alert('Format file tidak didukung. Hanya file PDF dan Word (.pdf, .doc, .docx) yang diperbolehkan.');
        return;
      }

      // Stage the file with empty date
      setPendingFiles(prev => [...prev, { file, tanggal: '' }]);
    }
  };

  // File drop handlers for each type
  const handleFileDropND = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'ND', setIsDraggingND, setPendingFilesND);
  const handleFileDropFS2 = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'FS2', setIsDraggingFS2, setPendingFilesFS2);
  const handleFileDropCD = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'CD', setIsDraggingCD, setPendingFilesCD);
  const handleFileDropFS2A = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'FS2A', setIsDraggingFS2A, setPendingFilesFS2A);
  const handleFileDropFS2B = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'FS2B', setIsDraggingFS2B, setPendingFilesFS2B);
  const handleFileDropF45 = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'F45', setIsDraggingF45, setPendingFilesF45);
  const handleFileDropF46 = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'F46', setIsDraggingF46, setPendingFilesF46);
  const handleFileDropNDBA = (e: React.DragEvent<HTMLElement>) => 
    handleFileDrop(e, 'NDBA', setIsDraggingNDBA, setPendingFilesNDBA);

  // Generic upload pending files handler
  const handleUploadPendingFiles = async (
    pendingFiles: Array<{ file: File; tanggal: string }>,
    fileType: string,
    setUploading: (val: boolean) => void,
    setFiles: React.Dispatch<React.SetStateAction<Fs2FileData[]>>,
    setPendingFiles: React.Dispatch<React.SetStateAction<Array<{ file: File; tanggal: string }>>>,
    dateFormField?: keyof Fs2DocumentRequest
  ) => {
    if (pendingFiles.length === 0 || !selectedFs2?.id) return;
    setUploading(true);
    setFileErrorMessage('');
    try {
      const results: Fs2FileData[] = [];
      for (const pending of pendingFiles) {
        const uploaded = await uploadFs2Files(selectedFs2.id, [pending.file], fileType, pending.tanggal || undefined);
        results.push(...uploaded);
        // If a date was set and we have a date form field, update it
        if (pending.tanggal && dateFormField) {
          setEditFormData(prev => ({ ...prev, [dateFormField]: pending.tanggal }));
        }
      }
      setFiles(prev => [...prev, ...results]);
      setPendingFiles([]);
    } catch (error) {
      console.error('Failed to upload files:', error);
      setFileErrorMessage(`Gagal mengupload file ${fileType}. Silakan coba lagi.`);
    } finally {
      setUploading(false);
    }
  };

  // Upload pending files handlers for each type
  const handleUploadPendingND = () => 
    handleUploadPendingFiles(pendingFilesND, 'ND', setIsUploadingND, setFilesND, setPendingFilesND);
  const handleUploadPendingFS2 = () => 
    handleUploadPendingFiles(pendingFilesFS2, 'FS2', setIsUploadingFS2, setFilesFS2, setPendingFilesFS2, 'tanggal_berkas_fs2');
  const handleUploadPendingCD = () => 
    handleUploadPendingFiles(pendingFilesCD, 'CD', setIsUploadingCD, setFilesCD, setPendingFilesCD);
  const handleUploadPendingFS2A = () => 
    handleUploadPendingFiles(pendingFilesFS2A, 'FS2A', setIsUploadingFS2A, setFilesFS2A, setPendingFilesFS2A, 'tanggal_berkas_fs2a');
  const handleUploadPendingFS2B = () => 
    handleUploadPendingFiles(pendingFilesFS2B, 'FS2B', setIsUploadingFS2B, setFilesFS2B, setPendingFilesFS2B, 'tanggal_berkas_fs2b');
  const handleUploadPendingF45 = () => 
    handleUploadPendingFiles(pendingFilesF45, 'F45', setIsUploadingF45, setFilesF45, setPendingFilesF45, 'tanggal_berkas_f45');
  const handleUploadPendingF46 = () => 
    handleUploadPendingFiles(pendingFilesF46, 'F46', setIsUploadingF46, setFilesF46, setPendingFilesF46, 'tanggal_berkas_f46');
  const handleUploadPendingNDBA = () => 
    handleUploadPendingFiles(pendingFilesNDBA, 'NDBA', setIsUploadingNDBA, setFilesNDBA, setPendingFilesNDBA, 'tanggal_berkas_nd_ba');

  // Generic remove file handler
  const handleRemoveFile = async (
    fileId: string,
    fileType: string,
    setFiles: React.Dispatch<React.SetStateAction<Fs2FileData[]>>
  ) => {
    try {
      await deleteFs2File(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      setFileErrorMessage(`Gagal menghapus file ${fileType}.`);
    }
  };

  // Handle file download
  const handleDownloadFile = async (file: Fs2FileData) => {
    setDownloadingFileId(file.id);
    try {
      await downloadFs2File(file.id, file.original_name);
    } catch (error) {
      console.error('Error downloading file:', error);
      setFileErrorMessage('Gagal mengunduh file.');
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Handle file preview
  const handlePreviewFile = (file: Fs2FileData) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Check if file is previewable
  const isPreviewable = (contentType: string): boolean => {
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return previewableTypes.includes(contentType);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleEditSubmit = async () => {
    if (!selectedFs2) return;
    try {
      // Derive statuses from completion dates before submitting
      const completionDates: Record<string, string> = {
        'PENGAJUAN': (editFormData.tanggal_pengajuan_selesai || '').substring(0, 10),
        'ASESMEN': (editFormData.tanggal_asesmen || '').substring(0, 10),
        'PEMROGRAMAN': (editFormData.tanggal_pemrograman || '').substring(0, 10),
        'PENGUJIAN': (editFormData.tanggal_pengujian_selesai || '').substring(0, 10),
        'DEPLOYMENT': (editFormData.tanggal_deployment_selesai || '').substring(0, 10),
        'GO_LIVE': (editFormData.tanggal_go_live || '').substring(0, 10),
      };
      
      const derivedStatuses: Record<string, string> = {};
      let foundCurrentTahapan = false;
      
      FS2_TAHAPAN_CONFIG.forEach((tahapan, index) => {
        const hasCompletionDate = completionDates[tahapan.key] && completionDates[tahapan.key].length > 0;
        
        if (hasCompletionDate) {
          derivedStatuses[tahapan.key] = 'Selesai';
        } else if (!foundCurrentTahapan) {
          if (index === 0) {
            derivedStatuses[tahapan.key] = 'Dalam proses';
            foundCurrentTahapan = true;
          } else {
            const prevTahapan = FS2_TAHAPAN_CONFIG[index - 1];
            const prevHasDate = completionDates[prevTahapan.key] && completionDates[prevTahapan.key].length > 0;
            if (prevHasDate) {
              derivedStatuses[tahapan.key] = 'Dalam proses';
              foundCurrentTahapan = true;
            } else {
              derivedStatuses[tahapan.key] = 'Belum dimulai';
            }
          }
        } else {
          derivedStatuses[tahapan.key] = 'Belum dimulai';
        }
      });
      
      await updateFs2Document(selectedFs2.id, {
        ...editFormData,
        // Include tahapan statuses derived from completion dates
        tahapan_status_pengajuan: derivedStatuses['PENGAJUAN'] || undefined,
        tahapan_status_asesmen: derivedStatuses['ASESMEN'] || undefined,
        tahapan_status_pemrograman: derivedStatuses['PEMROGRAMAN'] || undefined,
        tahapan_status_pengujian: derivedStatuses['PENGUJIAN'] || undefined,
        tahapan_status_deployment: derivedStatuses['DEPLOYMENT'] || undefined,
        tahapan_status_go_live: derivedStatuses['GO_LIVE'] || undefined,
      } as Fs2DocumentRequest);
      setSnackbar({ open: true, message: 'F.S.2 berhasil diperbarui', severity: 'success' });
      handleCloseEditModal();
      fetchFs2Data();
    } catch (error) {
      console.error('Failed to update F.S.2:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memperbarui F.S.2';
      setSnackbar({ open: true, message: errMsg, severity: 'error' });
    }
  };

  // Handle Excel download
  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      // Get first selected filter value if any
      const progresFilter = selectedProgres.size === 1 ? Array.from(selectedProgres)[0] : undefined;
      const faseFilter = selectedFase.size === 1 ? Array.from(selectedFase)[0] : undefined;
      const mekanismeFilter = selectedMekanisme.size === 1 ? Array.from(selectedMekanisme)[0] : undefined;
      const pelaksanaanFilter = selectedPelaksanaan.size === 1 ? Array.from(selectedPelaksanaan)[0] : undefined;
      
      await downloadApprovedFs2Excel({
        search: keyword || undefined,
        bidang_id: selectedBidangFilter || undefined,
        skpa_id: selectedSkpaFilter || undefined,
        progres: progresFilter,
        fase_pengajuan: faseFilter,
        mekanisme: mekanismeFilter,
        pelaksanaan: pelaksanaanFilter,
        year: selectedYearFilter ? parseInt(selectedYearFilter, 10) : undefined,
        start_month: selectedStartMonth ? parseInt(selectedStartMonth, 10) : undefined,
        end_month: selectedEndMonth ? parseInt(selectedEndMonth, 10) : undefined,
      });
      setSnackbar({
        open: true,
        message: 'File Excel berhasil diunduh',
        severity: 'success',
      });
    } catch (error: unknown) {
      console.error('Failed to download Excel:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal mengunduh file Excel';
      setSnackbar({
        open: true,
        message: errMsg,
        severity: 'error',
      });
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  // Get pelaksanaan display
  const getPelaksanaanDisplay = (row: Fs2DisetujuiData): string => {
    if (row.pelaksanaan === 'SINGLE_YEAR') {
      return row.tahun ? `Single Year (${row.tahun})` : 'Single Year';
    } else if (row.pelaksanaan === 'MULTIYEARS') {
      if (row.tahunMulai && row.tahunSelesai) {
        return `Multiyears (${row.tahunMulai} - ${row.tahunSelesai})`;
      }
      return 'Multiyears';
    }
    return row.pelaksanaan;
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
          <AssessmentRounded sx={{ fontSize: 32, color: '#31A24C' }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Monitoring F.S.2
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#86868b', ml: 0.5 }}>
          Monitoring dan tracking F.S.2 ({totalElements} item)
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
              placeholder="Cari F.S.2..."
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
                  {yearOptions.map((year) => (
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

            {/* Month Range Filter - Start Month */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: selectedStartMonth ? 'rgba(49, 162, 76, 0.08)' : '#f5f5f7',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                border: selectedStartMonth ? '1.5px solid rgba(49, 162, 76, 0.3)' : '1.5px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: selectedStartMonth ? 'rgba(49, 162, 76, 0.12)' : '#eeeeef',
                },
              }}
            >
              <FormControl size="small" variant="standard" sx={{ minWidth: 110 }}>
                <Select
                  value={selectedStartMonth}
                  onChange={(e) => {
                    setSelectedStartMonth(e.target.value);
                    // Auto-adjust end month if it's less than start month
                    if (selectedEndMonth && parseInt(e.target.value) > parseInt(selectedEndMonth)) {
                      setSelectedEndMonth(e.target.value);
                    }
                  }}
                  displayEmpty
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: selectedStartMonth ? '#31A24C' : '#1d1d1f',
                    '& .MuiSelect-select': {
                      py: 0.5,
                      pr: 3,
                    },
                    '& .MuiSvgIcon-root': {
                      color: selectedStartMonth ? '#31A24C' : '#86868b',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                    <em>Bulan Mulai</em>
                  </MenuItem>
                  {monthOptions.map((month) => (
                    <MenuItem 
                      key={month.value} 
                      value={month.value}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Month Range Separator */}
            <Typography sx={{ color: '#86868b', fontSize: '0.875rem', fontWeight: 500 }}>
              s/d
            </Typography>

            {/* Month Range Filter - End Month */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: selectedEndMonth ? 'rgba(49, 162, 76, 0.08)' : '#f5f5f7',
                borderRadius: '12px',
                px: 1.5,
                py: 0.5,
                border: selectedEndMonth ? '1.5px solid rgba(49, 162, 76, 0.3)' : '1.5px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: selectedEndMonth ? 'rgba(49, 162, 76, 0.12)' : '#eeeeef',
                },
              }}
            >
              <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedEndMonth}
                  onChange={(e) => setSelectedEndMonth(e.target.value)}
                  displayEmpty
                  disableUnderline
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: selectedEndMonth ? '#31A24C' : '#1d1d1f',
                    '& .MuiSelect-select': {
                      py: 0.5,
                      pr: 3,
                    },
                    '& .MuiSvgIcon-root': {
                      color: selectedEndMonth ? '#31A24C' : '#86868b',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
                    <em>Bulan Selesai</em>
                  </MenuItem>
                  {monthOptions
                    .filter(month => !selectedStartMonth || parseInt(month.value) >= parseInt(selectedStartMonth))
                    .map((month) => (
                      <MenuItem 
                        key={month.value} 
                        value={month.value}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {month.label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
            
            <Button
              variant="text"
              startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
              onClick={handleFilterClick}
              sx={{
                color: activeFiltersCount > 0 ? '#31A24C' : '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
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
            
            {/* Download Excel Button */}
            <Tooltip title="Download Excel">
              <IconButton
                onClick={handleDownloadExcel}
                disabled={isDownloadingExcel}
                sx={{
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  width: 40,
                  height: 40,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                  },
                }}
              >
                {isDownloadingExcel ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <DownloadIcon />}
              </IconButton>
            </Tooltip>
          </Box>
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
                  {activeFiltersCount > 0 ? `${activeFiltersCount} filter aktif` : 'Pilih kriteria filter'}
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
            {/* Row 1: Progres, Status & Fase Pengajuan */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2.5 }}>
              {/* Progres Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#31A24C' }} />
                  Progres
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={[...PROGRES_OPTIONS]}
                  getOptionLabel={(option) => PROGRES_LABELS[option] || option}
                  value={Array.from(selectedProgres)}
                  onChange={(_, newValue) => setSelectedProgres(new Set(newValue))}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => {
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          sx={{ mr: 1, '&.Mui-checked': { color: '#31A24C' } }}
                        />
                        {PROGRES_LABELS[option] || option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedProgres.size === 0 ? 'Pilih Progres' : ''}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.1)' },
                          '&:hover fieldset': { borderColor: '#31A24C' },
                          '&.Mui-focused fieldset': { borderColor: '#31A24C', borderWidth: 2 },
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
                          label={PROGRES_LABELS[option] || option}
                          size="small"
                          {...tagProps}
                          sx={{ 
                            bgcolor: '#31A24C', 
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

              {/* Status Progres Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#DC2626' }} />
                  Status
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={[...PROGRES_STATUS_OPTIONS]}
                  getOptionLabel={(option) => PROGRES_STATUS_LABELS[option] || option}
                  value={Array.from(selectedProgresStatus)}
                  onChange={(_, newValue) => setSelectedProgresStatus(new Set(newValue))}
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
                        {PROGRES_STATUS_LABELS[option] || option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedProgresStatus.size === 0 ? 'Pilih Status' : ''}
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
                          label={PROGRES_STATUS_LABELS[option] || option}
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

              {/* Fase Pengajuan Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                  Fase Pengajuan
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={[...FASE_PENGAJUAN_OPTIONS]}
                  getOptionLabel={(option) => FASE_LABELS[option] || option}
                  value={Array.from(selectedFase)}
                  onChange={(_, newValue) => setSelectedFase(new Set(newValue))}
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
                        {FASE_LABELS[option] || option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedFase.size === 0 ? 'Pilih Fase' : ''}
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
                          label={FASE_LABELS[option] || option}
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

            {/* Row 2: Mekanisme & Pelaksanaan */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
              {/* Mekanisme Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0891B2' }} />
                  Mekanisme
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={[...MEKANISME_OPTIONS]}
                  getOptionLabel={(option) => MEKANISME_LABELS[option] || option}
                  value={Array.from(selectedMekanisme)}
                  onChange={(_, newValue) => setSelectedMekanisme(new Set(newValue))}
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
                        {MEKANISME_LABELS[option] || option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedMekanisme.size === 0 ? 'Pilih Mekanisme' : ''}
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
                          label={MEKANISME_LABELS[option] || option}
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

              {/* Pelaksanaan Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D97706' }} />
                  Pelaksanaan
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={[...PELAKSANAAN_OPTIONS]}
                  getOptionLabel={(option) => PELAKSANAAN_LABELS[option] || option}
                  value={Array.from(selectedPelaksanaan)}
                  onChange={(_, newValue) => setSelectedPelaksanaan(new Set(newValue))}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => {
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          sx={{ mr: 1, '&.Mui-checked': { color: '#D97706' } }}
                        />
                        {PELAKSANAAN_LABELS[option] || option}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedPelaksanaan.size === 0 ? 'Pilih Pelaksanaan' : ''}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.1)' },
                          '&:hover fieldset': { borderColor: '#D97706' },
                          '&.Mui-focused fieldset': { borderColor: '#D97706', borderWidth: 2 },
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
                          label={PELAKSANAAN_LABELS[option] || option}
                          size="small"
                          {...tagProps}
                          sx={{ 
                            bgcolor: '#D97706', 
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

            {/* Row 3: Bidang & SKPA */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
              {/* Bidang Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#DC2626' }} />
                  Bidang
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedBidangFilter}
                    displayEmpty
                    onChange={(e) => setSelectedBidangFilter(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#DC2626',
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Semua Bidang</em>
                    </MenuItem>
                    {bidangList.map((bidang) => (
                      <MenuItem key={bidang.id} value={bidang.id}>{bidang.nama_bidang}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* SKPA Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4F46E5' }} />
                  SKPA
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedSkpaFilter}
                    displayEmpty
                    onChange={(e) => setSelectedSkpaFilter(e.target.value)}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4F46E5',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4F46E5',
                        borderWidth: 2,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Semua SKPA</em>
                    </MenuItem>
                    {skpaList.map((skpa) => (
                      <MenuItem key={skpa.id} value={skpa.id}>{skpa.kode_skpa} - {skpa.nama_skpa}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Reset Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={clearFilters}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(49, 162, 76, 0.1) 0%, rgba(34, 139, 60, 0.15) 100%)',
                color: '#31A24C',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                boxShadow: 'none',
                border: '1px solid rgba(49, 162, 76, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(49, 162, 76, 0.15) 0%, rgba(34, 139, 60, 0.2) 100%)',
                  boxShadow: '0 4px 12px rgba(49, 162, 76, 0.15)',
                },
              }}
            >
              Reset Filter
            </Button>
          </Box>
        </Popover>

        {/* Data Count Display */}
        <Box sx={{ my: 2.5 }}>
          <DataCountDisplay
            count={totalElements}
            isLoading={isLoading}
            label="Total"
            unit="F.S.2 Documents"
          />
        </Box>

        {/* Table */}
        <TableContainer sx={{ 
          width: '100%',
          overflowX: 'auto',
          pb: 1.5,
          '&::-webkit-scrollbar': {
            height: 10,
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 4,
            marginBottom: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(49, 162, 76, 0.2)',
            borderRadius: 4,
            '&:hover': {
              background: 'rgba(49, 162, 76, 0.35)',
            },
          },
        }}>
        <Table sx={{ tableLayout: 'auto', minWidth: 3500 }}>
          <TableHead>
            {/* First row - Grouped headers */}
            <TableRow sx={{ bgcolor: '#f5f5f7' }}>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', textAlign: 'center', fontSize: '0.8rem', minWidth: 50, ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('no') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>No</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 160, ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                <TableSortLabel
                  active={orderBy === 'namaAplikasi'}
                  direction={orderBy === 'namaAplikasi' ? order : 'asc'}
                  onClick={() => handleRequestSort('namaAplikasi')}
                >
                  Nama Aplikasi
                </TableSortLabel>
              </TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 180, ...(stickyColumns.has('namaFs2') && { position: 'sticky', left: getStickyLeft('namaFs2'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('namaFs2') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                <TableSortLabel
                  active={orderBy === 'namaFs2'}
                  direction={orderBy === 'namaFs2' ? order : 'asc'}
                  onClick={() => handleRequestSort('namaFs2')}
                >
                  Nama FS2
                </TableSortLabel>
              </TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('progres') && { position: 'sticky', left: getStickyLeft('progres'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('progres') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Progres</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 130, ...(stickyColumns.has('fasePengajuan') && { position: 'sticky', left: getStickyLeft('fasePengajuan'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('fasePengajuan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Fase Pengajuan</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 80, ...(stickyColumns.has('iku') && { position: 'sticky', left: getStickyLeft('iku'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('iku') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>IKU</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('bidang') && { position: 'sticky', left: getStickyLeft('bidang'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('bidang') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Bidang</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>SKPA</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('mekanisme') && { position: 'sticky', left: getStickyLeft('mekanisme'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('mekanisme') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Mekanisme</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 140, ...(stickyColumns.has('pelaksanaan') && { position: 'sticky', left: getStickyLeft('pelaksanaan'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('pelaksanaan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Pelaksanaan</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('pic') && { position: 'sticky', left: getStickyLeft('pic'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('pic') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>PIC</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 160, ...(stickyColumns.has('anggotaTim') && { position: 'sticky', left: getStickyLeft('anggotaTim'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('anggotaTim') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Anggota Tim</TableCell>
              {/* Dokumen Pengajuan F.S.2 - grouped */}
              <TableCell colSpan={5} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(49, 162, 76, 0.08)' }}>Dokumen Pengajuan F.S.2</TableCell>
              {/* CD Prinsip - grouped */}
              <TableCell colSpan={7} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(37, 99, 235, 0.08)' }}>CD Prinsip Persetujuan FS2</TableCell>
              {/* Pengujian - grouped */}
              <TableCell colSpan={6} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(217, 119, 6, 0.08)' }}>Pengujian</TableCell>
              {/* Deployment - grouped */}
              <TableCell colSpan={4} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(124, 58, 237, 0.08)' }}>Deployment</TableCell>
              {/* Go Live - grouped */}
              <TableCell colSpan={1} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(5, 150, 105, 0.08)' }}>Go Live</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 150 }}>Keterangan</TableCell>
              <TableCell rowSpan={2} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100 }}>Aksi</TableCell>
            </TableRow>
            {/* Second row - Sub-headers */}
            <TableRow sx={{ bgcolor: '#f5f5f7' }}>
              {/* Dokumen Pengajuan F.S.2 sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Nomor ND</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Tgl Berkas ND</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Berkas ND</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Berkas F.S.2</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Tgl Berkas FS2</TableCell>
              {/* CD Prinsip sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Nomor CD Prinsip</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Tgl Berkas CD Prinsip</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Berkas CD Prinsip</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Berkas F.S.2A</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Tgl Berkas FS2A</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Berkas F.S.2B</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Tgl Berkas FS2B</TableCell>
              {/* Pengujian sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Realisasi</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Berkas F45</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Tgl Berkas F45</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Berkas F46</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Tgl Berkas F46</TableCell>
              {/* Deployment sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.04)' }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.04)' }}>Realisasi</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.04)' }}>Berkas ND/BA</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.04)' }}>Tgl Berkas NDBA</TableCell>
              {/* Go Live sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(5, 150, 105, 0.04)' }}>Target</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={36} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : filteredFs2Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={36} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Tidak ada data F.S.2 Disetujui</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFs2Data.map((row, index) => {
                const skpaColor = getChipColor(row.skpa);
                // Get rawData for tahapan progress derivation
                const rawItem = rawData.find(r => r.id === row.id);
                const progresTahapan = rawItem ? deriveProgresTahapan(rawItem) : { tahapanLabel: '-', status: '-', tanggal: null, color: '#86868b' };
                return (
                  <TableRow 
                    key={row.id} 
                    sx={{
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 250, 245, 0.8) 100%)',
                        boxShadow: '0 4px 20px rgba(49, 162, 76, 0.08)',
                        transform: 'scale(1.001)',
                      },
                      '&:not(:last-child)': {
                        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    {/* No */}
                    <TableCell sx={{ color: '#86868b', py: 1, px: 2, textAlign: 'center', fontWeight: 500, fontSize: '0.8rem', minWidth: 50, ...(stickyColumns.has('no') && { position: 'sticky', left: getStickyLeft('no'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('no') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    {/* Nama Aplikasi */}
                    <TableCell sx={{ py: 1, px: 2, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 160, ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>{row.namaAplikasi}</Typography>
                    </TableCell>
                    {/* Nama FS2 */}
                    <TableCell sx={{ py: 1, px: 2, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 180, ...(stickyColumns.has('namaFs2') && { position: 'sticky', left: getStickyLeft('namaFs2'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('namaFs2') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>{row.namaFs2}</Typography>
                    </TableCell>
                    {/* Progres - derived from tahapan completion dates */}
                    <TableCell sx={{ py: 1, px: 2, minWidth: 180, ...(stickyColumns.has('progres') && { position: 'sticky', left: getStickyLeft('progres'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('progres') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip 
                          label={`${progresTahapan.tahapanLabel} - ${progresTahapan.status}`} 
                          size="small" 
                          sx={{ 
                            bgcolor: `${progresTahapan.color}20`, 
                            color: progresTahapan.color, 
                            fontWeight: 500, 
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 },
                          }} 
                        />
                        {/* Only show date when Go Live is Selesai */}
                        {progresTahapan.tanggal && (
                          <Typography variant="caption" sx={{ color: '#86868b', fontSize: '0.6rem' }}>
                            {new Date(progresTahapan.tanggal).toLocaleDateString('id-ID')}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    {/* Fase Pengajuan */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 130, ...(stickyColumns.has('fasePengajuan') && { position: 'sticky', left: getStickyLeft('fasePengajuan'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('fasePengajuan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>{FASE_LABELS[row.fasePengajuan] || row.fasePengajuan}</TableCell>
                    {/* IKU */}
                    <TableCell sx={{ py: 1, px: 2, minWidth: 80, ...(stickyColumns.has('iku') && { position: 'sticky', left: getStickyLeft('iku'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('iku') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                      <Chip label={row.iku === 'Y' ? 'Ya' : row.iku === 'T' ? 'Tidak' : row.iku} size="small" sx={{ bgcolor: row.iku === 'Y' ? '#D1FAE5' : '#FEE2E2', color: row.iku === 'Y' ? '#059669' : '#DC2626', fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    {/* Bidang */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('bidang') && { position: 'sticky', left: getStickyLeft('bidang'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('bidang') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>{row.bidang}</TableCell>
                    {/* SKPA */}
                    <TableCell sx={{ py: 1, px: 2, minWidth: 100, ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                      <Chip label={row.skpa} size="small" sx={{ bgcolor: skpaColor.bg, color: skpaColor.text, fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    {/* Mekanisme */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('mekanisme') && { position: 'sticky', left: getStickyLeft('mekanisme'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('mekanisme') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>{MEKANISME_LABELS[row.mekanisme] || row.mekanisme}</TableCell>
                    {/* Pelaksanaan */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 140, ...(stickyColumns.has('pelaksanaan') && { position: 'sticky', left: getStickyLeft('pelaksanaan'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('pelaksanaan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>{getPelaksanaanDisplay(row)}</TableCell>
                    {/* PIC */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('pic') && { position: 'sticky', left: getStickyLeft('pic'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('pic') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>{row.pic}</TableCell>
                    {/* Anggota Tim */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 160, whiteSpace: 'normal', wordWrap: 'break-word', ...(stickyColumns.has('anggotaTim') && { position: 'sticky', left: getStickyLeft('anggotaTim'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('anggotaTim') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>{row.anggotaTim}</TableCell>
                    {/* Dokumen Pengajuan F.S.2 - Nomor ND */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>{row.nomorNd}</TableCell>
                    {/* Dokumen Pengajuan F.S.2 - Tanggal */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>{row.tanggalNd}</TableCell>
                    {/* Dokumen Pengajuan F.S.2 - Berkas ND */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>
                      {row.berkasNd ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'ND')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
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
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* Dokumen Pengajuan F.S.2 - Berkas F.S.2 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>
                      {row.berkasFs2 ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'FS2')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
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
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* Dokumen Pengajuan F.S.2 - Tanggal Berkas FS2 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>{row.tanggalBerkasFs2}</TableCell>
                    {/* CD Prinsip - Nomor CD */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>{row.nomorCd}</TableCell>
                    {/* CD Prinsip - Tanggal */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>{row.tanggalCd}</TableCell>
                    {/* CD Prinsip - Berkas CD */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>
                      {row.berkasCd ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'CD')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#2563EB',
                            borderRadius: '8px',
                            px: 1.5,
                            py: 0.5,
                            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(96, 165, 250, 0.08) 100%)',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(96, 165, 250, 0.12) 100%)',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
                            },
                          }}
                        >
                          View
                        </Button>
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* CD Prinsip - Berkas F.S.2A */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>
                      {row.berkasFs2a ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'FS2A')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#2563EB',
                            borderRadius: '8px',
                            px: 1.5,
                            py: 0.5,
                            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(96, 165, 250, 0.08) 100%)',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(96, 165, 250, 0.12) 100%)',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
                            },
                          }}
                        >
                          View
                        </Button>
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* CD Prinsip - Tanggal Berkas FS2A */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>{row.tanggalBerkasFs2a}</TableCell>
                    {/* CD Prinsip - Berkas F.S.2B */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>
                      {row.berkasFs2b ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'FS2B')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#2563EB',
                            borderRadius: '8px',
                            px: 1.5,
                            py: 0.5,
                            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(96, 165, 250, 0.08) 100%)',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(96, 165, 250, 0.12) 100%)',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
                            },
                          }}
                        >
                          View
                        </Button>
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* CD Prinsip - Tanggal Berkas FS2B */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>{row.tanggalBerkasFs2b}</TableCell>
                    {/* Pengujian - Target */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>{row.targetPengujian}</TableCell>
                    {/* Pengujian - Realisasi */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>{row.realisasiPengujian}</TableCell>
                    {/* Pengujian - Berkas F45 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>
                      {row.berkasF45 ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'F45')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
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
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* Pengujian - Tanggal Berkas F45 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>{row.tanggalBerkasF45}</TableCell>
                    {/* Pengujian - Berkas F46 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>
                      {row.berkasF46 ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'F46')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
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
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* Pengujian - Tanggal Berkas F46 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>{row.tanggalBerkasF46}</TableCell>
                    {/* Deployment - Target */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.02)' }}>{row.targetDeployment}</TableCell>
                    {/* Deployment - Realisasi */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.02)' }}>{row.realisasiDeployment}</TableCell>
                    {/* Deployment - Berkas ND/BA */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.02)' }}>
                      {row.berkasNdBaDeployment ? (
                        <Button
                          size="small"
                          onClick={() => handleViewFileFromTable(row.id, 'NDBA')}
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#7C3AED',
                            borderRadius: '8px',
                            px: 1.5,
                            py: 0.5,
                            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(167, 139, 250, 0.08) 100%)',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(167, 139, 250, 0.12) 100%)',
                              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.15)',
                            },
                          }}
                        >
                          View
                        </Button>
                      ) : <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>}
                    </TableCell>
                    {/* Deployment - Tanggal Berkas NDBA */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.02)' }}>{row.tanggalBerkasNdBa}</TableCell>
                    {/* Go Live - Target */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(5, 150, 105, 0.02)' }}>{row.targetGoLive}</TableCell>
                    {/* Keterangan */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 150 }}>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.keterangan}>
                        {renderTextWithLinks(row.keterangan)}
                      </Typography>
                    </TableCell>
                    {/* Aksi */}
                    <TableCell align="center" sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75 }}>
                        <Tooltip title="Lihat Detail F.S.2">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenViewModal(row.id)}
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
                        {fs2Permissions.canUpdate && (
                          <Tooltip title="Edit F.S.2">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModal(row.id)}
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
                );
              })
            )}
          </TableBody>
        </Table>
        </TableContainer>
        
        {/* Pagination - outside TableContainer for static positioning */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
          sx={{
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '& .MuiTablePagination-select': {
              borderRadius: '8px',
            },
          }}
        />
      </Paper>

      {/* View Modal */}
      <ViewFs2Modal
        open={openViewModal}
        onClose={handleCloseViewModal}
        fs2Id={selectedFs2IdForView}
        showMonitoringSection={true}
      />

      {/* Edit Modal */}
      <Dialog 
        open={openEditModal} 
        onClose={handleCloseEditModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            maxHeight: '90vh',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          pb: 2,
          bgcolor: 'rgba(255, 255, 255, 0.85)',
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #31A24C 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(49, 162, 76, 0.3)',
          }}>
            <EditIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
              Edit F.S.2
            </Typography>
            <Typography variant="body2" sx={{ color: '#86868b' }}>
              Update informasi monitoring F.S.2
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          pt: 3, 
          pb: 4,
          background: 'linear-gradient(135deg, rgba(245, 245, 247, 0.9) 0%, rgba(250, 250, 250, 0.95) 100%)',
        }}>
          {/* Nama Aplikasi & SKPA Display Section */}
          {selectedFs2 && (
            <Box sx={{ 
              mb: 3,
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(145deg, rgba(245, 245, 247, 0.8) 0%, rgba(240, 240, 242, 0.6) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
            }}>
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
                    Nama Aplikasi
                  </Typography>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f',
                    fontSize: '0.9rem',
                  }}>
                    {selectedFs2.nama_aplikasi || '-'}
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
                    Nama FS2
                  </Typography>
                  <Typography sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f',
                    fontSize: '0.9rem',
                  }}>
                    {selectedFs2.nama_fs2 || '-'}
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
                  {selectedFs2.kode_skpa ? (
                    <Chip
                      label={selectedFs2.kode_skpa}
                      size="small"
                      sx={{
                        bgcolor: getChipColor(selectedFs2.kode_skpa).bg,
                        color: getChipColor(selectedFs2.kode_skpa).text,
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '6px',
                      }}
                    />
                  ) : (
                    <Typography sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                  )}
                </Box>
                {/* PKSI field - only show when status_tahapan is DESAIN */}
                {selectedFs2.pksi_nama && (
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ 
                      fontSize: '0.7rem', 
                      color: '#86868b', 
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                    }}>
                      PKSI Terkait
                    </Typography>
                    <Chip
                      label={selectedFs2.pksi_nama}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(59, 130, 246, 0.15)',
                        color: '#3B82F6',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: 22,
                        borderRadius: '6px',
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Progress Tahapan Section (6 stages) */}
          {selectedFs2 && (
            <Box sx={{ 
              mb: 3,
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 252, 0.8) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 2.5, 
                fontWeight: 600, 
                color: '#6366F1', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: '0.85rem',
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366F1' }} />
                Progres Tahapan
              </Typography>

              {/* Progres Tahapan Table - Status derived from completion dates */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(99, 102, 241, 0.08)' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '22%' }}>Tahapan</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '20%' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '18%' }}>Tgl. Target</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2, width: '20%' }}>Tanggal Penyelesaian</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6366F1', py: 1.2 }}>Ketepatan Waktu</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {FS2_TAHAPAN_CONFIG.map((tahapan, index) => {
                      // Get completion date from editFormData
                      const dateValue = tahapan.dateField 
                        ? ((editFormData as Record<string, string>)[tahapan.dateField] || '').substring(0, 10)
                        : '';
                      
                      // Determine status based on completion dates (sequential logic)
                      // A tahapan is "Selesai" if it has a completion date
                      // A tahapan is "Dalam proses" if the previous one is "Selesai" and this one has no date
                      // Otherwise "Belum dimulai"
                      let derivedStatus = 'Belum dimulai';
                      if (dateValue) {
                        derivedStatus = 'Selesai';
                      } else if (index === 0) {
                        // First tahapan (Pengajuan) is always "Dalam proses" if no completion date
                        derivedStatus = 'Dalam proses';
                      } else {
                        // Check if previous tahapan is completed
                        const prevTahapan = FS2_TAHAPAN_CONFIG[index - 1];
                        const prevDateValue = prevTahapan.dateField 
                          ? ((editFormData as Record<string, string>)[prevTahapan.dateField] || '').substring(0, 10)
                          : '';
                        if (prevDateValue) {
                          derivedStatus = 'Dalam proses';
                        }
                      }
                      
                      const isSelesai = derivedStatus === 'Selesai';
                      const isDalam = derivedStatus === 'Dalam proses';
                      const rowBg = isSelesai ? 'rgba(21,128,61,0.025)' : isDalam ? 'rgba(99,102,241,0.025)' : 'transparent';
                      
                      // Check if this tahapan can be edited (only current active tahapan can fill completion date)
                      const canEditCompletionDate = isDalam;
                      
                      // Get target date - empty for Pengajuan and Asesmen
                      let targetDate: string | null = null;
                      if (tahapan.targetField && editFormData[tahapan.targetField as keyof typeof editFormData]) {
                        targetDate = editFormData[tahapan.targetField as keyof typeof editFormData] as string;
                      }
                      const displayTarget = targetDate ? formatMonthYear(targetDate) : '—';
                      
                      // Check if target date can be edited
                      // - Pemrograman: always editable
                      // - Pengujian, Deployment, Go Live: only editable if fase_pengajuan is PEMELIHARAAN
                      const isPemeliharaan = editFormData.fase_pengajuan === 'PEMELIHARAAN';
                      const canEditTargetDate = tahapan.key === 'PEMROGRAMAN' || 
                        (isPemeliharaan && ['PENGUJIAN', 'DEPLOYMENT', 'GO_LIVE'].includes(tahapan.key));
                      
                      // Ketepatan waktu calculation - always show "—" for Pengajuan and Asesmen
                      let ketepatanLabel: string | null = null;
                      let ketepatanColor = '#6B7280';
                      let ketepatanBg = '#F3F4F6';
                      
                      // Pengajuan and Asesmen always show "—" for Ketepatan Waktu
                      if (tahapan.key === 'PENGAJUAN' || tahapan.key === 'ASESMEN') {
                        ketepatanLabel = null; // Will show "—"
                      } else if (isSelesai && dateValue && targetDate) {
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
                          <TableCell sx={{ fontSize: '0.82rem', py: 1, fontWeight: isDalam ? 600 : 400, color: isDalam ? '#6366F1' : isSelesai ? '#15803D' : '#1d1d1f' }}>
                            {tahapan.label}
                          </TableCell>
                          <TableCell sx={{ py: 0.7 }}>
                            {/* Status is displayed as chip, not editable - derived from completion date */}
                            <Chip
                              label={derivedStatus}
                              size="small"
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                height: 26,
                                borderRadius: '8px',
                                bgcolor: isSelesai ? '#F0FDF4' : isDalam ? '#EEF2FF' : '#F3F4F6',
                                color: isSelesai ? '#15803D' : isDalam ? '#6366F1' : '#6B7280',
                                border: `1px solid ${isSelesai ? 'rgba(21,128,61,0.2)' : isDalam ? 'rgba(99,102,241,0.2)' : 'rgba(107,114,128,0.2)'}`,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {canEditTargetDate && tahapan.targetField ? (
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <FormControl size="small" sx={{ minWidth: 80 }}>
                                  <Select
                                    value={getMonthFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string)}
                                    displayEmpty
                                    onChange={(e) => {
                                      const newMonth = e.target.value;
                                      const currentYear = getYearFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string) || new Date().getFullYear().toString();
                                      const newDate = newMonth ? buildDateFromMonthYear(newMonth, currentYear) : '';
                                      setEditFormData({ ...editFormData, [tahapan.targetField!]: newDate });
                                    }}
                                    sx={{ fontSize: '0.75rem', height: 28, borderRadius: '6px', '& .MuiSelect-select': { py: 0.5 } }}
                                  >
                                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Bulan</em></MenuItem>
                                    {MONTH_OPTIONS.map(m => (
                                      <MenuItem key={m.value} value={m.value} sx={{ fontSize: '0.75rem' }}>{m.label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 70 }}>
                                  <Select
                                    value={getYearFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string)}
                                    displayEmpty
                                    onChange={(e) => {
                                      const newYear = e.target.value;
                                      const currentMonth = getMonthFromDate(editFormData[tahapan.targetField as keyof typeof editFormData] as string) || '01';
                                      const newDate = newYear ? buildDateFromMonthYear(currentMonth, newYear) : '';
                                      setEditFormData({ ...editFormData, [tahapan.targetField!]: newDate });
                                    }}
                                    sx={{ fontSize: '0.75rem', height: 28, borderRadius: '6px', '& .MuiSelect-select': { py: 0.5 } }}
                                  >
                                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}><em>Tahun</em></MenuItem>
                                    {YEAR_OPTIONS.map(y => (
                                      <MenuItem key={y.value} value={y.value} sx={{ fontSize: '0.75rem' }}>{y.label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize: '0.8rem', py: 1, color: targetDate ? '#7C3AED' : '#86868b' }}>
                                {displayTarget}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {tahapan.dateField ? (
                              canEditCompletionDate ? (
                                <TextField
                                  type="date"
                                  size="small"
                                  value={dateValue}
                                  onChange={(e) => {
                                    const newDate = e.target.value;
                                    setEditFormData(prev => ({ ...prev, [tahapan.dateField]: newDate }));
                                    // Status is derived automatically from completion dates
                                  }}
                                  slotProps={{ inputLabel: { shrink: true } }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      height: 32,
                                      bgcolor: 'rgba(99, 102, 241, 0.04)',
                                      '& fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
                                      '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.5)' },
                                      '&.Mui-focused fieldset': { borderColor: '#6366F1' },
                                    },
                                    minWidth: 140,
                                  }}
                                />
                              ) : isSelesai && dateValue ? (
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
          )}

          {/* Timeline Section (Pengujian, Deployment, Go Live) */}
          {selectedFs2 && (
            <Box sx={{ 
              mb: 3,
              p: 2.5,
              borderRadius: '16px',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 252, 250, 0.8) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
            }}>
              <Typography variant="subtitle2" sx={{ 
                mb: 2.5, 
                fontWeight: 600, 
                color: '#10B981', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: '0.85rem',
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                Timeline
              </Typography>
              
              {/* Timeline Visual - Editable for PEMELIHARAAN */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                {FS2_TIMELINE_CONFIGS.map((timeline, index) => {
                  const isPemeliharaan = editFormData.fase_pengajuan === 'PEMELIHARAAN';
                  const targetValue = editFormData[timeline.targetField as keyof typeof editFormData] as string || '';
                  
                  return (
                    <Box key={timeline.key} sx={{ 
                      flex: 1, 
                      p: 2, 
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, rgba(${timeline.rgb}, 0.08) 0%, rgba(${timeline.rgb}, 0.04) 100%)`,
                      border: `1px solid rgba(${timeline.rgb}, 0.2)`,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Box sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '8px',
                          background: `linear-gradient(135deg, ${timeline.gradient[0]}, ${timeline.gradient[1]})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 2px 8px rgba(${timeline.rgb}, 0.3)`,
                        }}>
                          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem' }}>
                            {index + 1}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1d1d1f' }}>
                          {timeline.label}
                        </Typography>
                      </Box>
                      {isPemeliharaan ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={getMonthFromDate(targetValue)}
                              displayEmpty
                              onChange={(e) => {
                                const newMonth = e.target.value;
                                const currentYear = getYearFromDate(targetValue) || new Date().getFullYear().toString();
                                const newDate = newMonth ? buildDateFromMonthYear(newMonth, currentYear) : '';
                                setEditFormData({ ...editFormData, [timeline.targetField]: newDate });
                              }}
                              sx={{ fontSize: '0.7rem', height: 26, borderRadius: '6px', '& .MuiSelect-select': { py: 0.3 } }}
                            >
                              <MenuItem value="" sx={{ fontSize: '0.7rem' }}><em>Bulan</em></MenuItem>
                              {MONTH_OPTIONS.map(m => (
                                <MenuItem key={m.value} value={m.value} sx={{ fontSize: '0.7rem' }}>{m.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 65 }}>
                            <Select
                              value={getYearFromDate(targetValue)}
                              displayEmpty
                              onChange={(e) => {
                                const newYear = e.target.value;
                                const currentMonth = getMonthFromDate(targetValue) || '01';
                                const newDate = newYear ? buildDateFromMonthYear(currentMonth, newYear) : '';
                                setEditFormData({ ...editFormData, [timeline.targetField]: newDate });
                              }}
                              sx={{ fontSize: '0.7rem', height: 26, borderRadius: '6px', '& .MuiSelect-select': { py: 0.3 } }}
                            >
                              <MenuItem value="" sx={{ fontSize: '0.7rem' }}><em>Tahun</em></MenuItem>
                              {YEAR_OPTIONS.map(y => (
                                <MenuItem key={y.value} value={y.value} sx={{ fontSize: '0.7rem' }}>{y.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      ) : (
                        <Typography sx={{ 
                          fontSize: '0.75rem', 
                          color: timeline.gradient[0],
                          fontWeight: 600,
                        }}>
                          {targetValue ? formatMonthYear(targetValue) : '-'}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Info Umum Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(49, 162, 76, 0.04)', border: '1px solid rgba(49, 162, 76, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#31A24C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#31A24C' }} />
              Informasi Umum
            </Typography>
            
            {/* Note: Progres Pengembangan section removed - now derived from tahapan completion dates */}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>

            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>Fase Pengajuan</InputLabel>
              <Select
                value={editFormData.fase_pengajuan || ''}
                label="Fase Pengajuan"
                onChange={(e) => setEditFormData({ ...editFormData, fase_pengajuan: e.target.value })}
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
                      borderColor: 'rgba(49, 162, 76, 0.3)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                {FASE_PENGAJUAN_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{FASE_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>IKU</InputLabel>
              <Select
                value={editFormData.iku || ''}
                label="IKU"
                onChange={(e) => setEditFormData({ ...editFormData, iku: e.target.value })}
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
                      borderColor: 'rgba(49, 162, 76, 0.3)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                <MenuItem value="Y">Ya</MenuItem>
                <MenuItem value="T">Tidak</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>Mekanisme</InputLabel>
              <Select
                value={editFormData.mekanisme || ''}
                label="Mekanisme"
                onChange={(e) => setEditFormData({ ...editFormData, mekanisme: e.target.value })}
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
                      borderColor: 'rgba(49, 162, 76, 0.3)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                {MEKANISME_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{MEKANISME_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>Pelaksanaan</InputLabel>
              <Select
                value={editFormData.pelaksanaan || ''}
                label="Pelaksanaan"
                onChange={(e) => setEditFormData({ ...editFormData, pelaksanaan: e.target.value })}
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
                      borderColor: 'rgba(49, 162, 76, 0.3)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                {PELAKSANAAN_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{PELAKSANAAN_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>Bidang</InputLabel>
              <Select
                value={editFormData.bidang_id || ''}
                label="Bidang"
                onChange={(e) => setEditFormData({ ...editFormData, bidang_id: e.target.value })}
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
                      borderColor: 'rgba(49, 162, 76, 0.3)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 4px 20px rgba(49, 162, 76, 0.12)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                      borderWidth: '1.5px',
                    },
                  },
                }}
              >
                {bidangList.map((bidang) => (
                  <MenuItem key={bidang.id} value={bidang.id}>{bidang.nama_bidang}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Tim Field */}
          <FormControl fullWidth sx={{ mb: 2, mt: 3 }}>
            <InputLabel 
              id="edit-team-label"
              sx={{
                '&.Mui-focused': { color: '#31A24C' },
              }}
            >
              Tim *
            </InputLabel>
            <Select
              labelId="edit-team-label"
              value={editFormData.team_id || ''}
              label="Tim *"
              onChange={(e) => {
                const selectedTeamId = e.target.value;
                const selectedTeam = teams.find(t => t.id === selectedTeamId);
                
                // Populate PIC and Anggota Tim from selected team
                const picId = selectedTeam?.pic?.uuid || '';
                const anggotaTimUuids = selectedTeam?.members?.map(m => m.uuid).join(',') || '';
                const anggotaTimNames = selectedTeam?.members?.map(m => m.fullName).join(', ') || '';
                
                setEditFormData({ 
                  ...editFormData, 
                  team_id: selectedTeamId,
                  pic_id: picId,
                  anggota_tim: anggotaTimUuids,
                  anggota_tim_names: anggotaTimNames,
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
                    borderColor: 'rgba(49, 162, 76, 0.3)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 4px 20px rgba(49, 162, 76, 0.12)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#31A24C',
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
          {editFormData.team_id && teams.find(t => t.id === editFormData.team_id) && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              borderRadius: '12px', 
              bgcolor: 'rgba(49, 162, 76, 0.05)',
              border: '1px solid rgba(49, 162, 76, 0.1)',
            }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#86868b', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                Info Tim
              </Typography>
              {(() => {
                const selectedTeam = teams.find(t => t.id === editFormData.team_id);
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
                                bgcolor: 'rgba(49, 162, 76, 0.1)',
                                color: '#31A24C',
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
          </Box>

          {/* Dokumen Pengajuan F.S.2 Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(49, 162, 76, 0.04)', border: '1px solid rgba(49, 162, 76, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#31A24C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#31A24C' }} />
              Dokumen Pengajuan F.S.2
            </Typography>
            {fileErrorMessage && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>{fileErrorMessage}</Typography>
            )}
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Nomor ND"
                size="small"
                value={editFormData.nomor_nd || ''}
                onChange={(e) => setEditFormData({ ...editFormData, nomor_nd: e.target.value })}
                fullWidth
              />
            </Box>
            
            {/* Berkas ND Dropzone - PKSI-style with date picker */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas ND</Typography>
              <Box
                sx={{
                  border: isDraggingND ? '2px dashed #31A24C' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingND ? 'rgba(49, 162, 76, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#31A24C',
                    bgcolor: 'rgba(49, 162, 76, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-nd')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingND(true); }}
                onDragLeave={() => setIsDraggingND(false)}
                onDrop={handleFileDropND}
              >
                <input
                  id="fs2-edit-file-upload-nd"
                  type="file"
                  hidden
                  onChange={handleFileSelectND}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingND ? '#31A24C' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingND ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesND.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#31A24C', fontSize: 18 }} />
                    File akan diupload ({pendingFilesND.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesND.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(49, 162, 76, 0.06) 0%, rgba(49, 162, 76, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(49, 162, 76, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#31A24C', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesND(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesND(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#31A24C' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#31A24C' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingND}
                    disabled={isUploadingND}
                    startIcon={isUploadingND ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #31A24C 0%, #4ADE80 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #059669 0%, #31A24C 100%)' } }}
                  >
                    {isUploadingND ? 'Mengupload...' : `Upload ${pendingFilesND.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesND.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesND.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#31A24C', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#31A24C', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'ND', setFilesND)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Berkas F.S.2 Dropzone - PKSI-style with date picker */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F.S.2</Typography>
              <Box
                sx={{
                  border: isDraggingFS2 ? '2px dashed #31A24C' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingFS2 ? 'rgba(49, 162, 76, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#31A24C',
                    bgcolor: 'rgba(49, 162, 76, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-fs2')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFS2(true); }}
                onDragLeave={() => setIsDraggingFS2(false)}
                onDrop={handleFileDropFS2}
              >
                <input
                  id="fs2-edit-file-upload-fs2"
                  type="file"
                  hidden
                  onChange={handleFileSelectFS2}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingFS2 ? '#31A24C' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingFS2 ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesFS2.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#31A24C', fontSize: 18 }} />
                    File akan diupload ({pendingFilesFS2.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesFS2.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(49, 162, 76, 0.06) 0%, rgba(49, 162, 76, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(49, 162, 76, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#31A24C', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesFS2(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesFS2(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#31A24C' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#31A24C' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingFS2}
                    disabled={isUploadingFS2}
                    startIcon={isUploadingFS2 ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #31A24C 0%, #4ADE80 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #059669 0%, #31A24C 100%)' } }}
                  >
                    {isUploadingFS2 ? 'Mengupload...' : `Upload ${pendingFilesFS2.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesFS2.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesFS2.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#31A24C', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#31A24C', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'FS2', setFilesFS2)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* CD Prinsip Persetujuan FS2 Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />
              CD Prinsip Persetujuan FS2
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Nomor CD Prinsip Persetujuan FS2"
                size="small"
                value={editFormData.nomor_cd || ''}
                onChange={(e) => setEditFormData({ ...editFormData, nomor_cd: e.target.value })}
                fullWidth
              />
            </Box>
            
            {/* Berkas CD Dropzone */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas CD Prinsip Persetujuan FS2</Typography>
              <Box
                sx={{
                  border: isDraggingCD ? '2px dashed #2563EB' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingCD ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#2563EB',
                    bgcolor: 'rgba(37, 99, 235, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-cd')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingCD(true); }}
                onDragLeave={() => setIsDraggingCD(false)}
                onDrop={handleFileDropCD}
              >
                <input
                  id="fs2-edit-file-upload-cd"
                  type="file"
                  hidden
                  onChange={handleFileSelectCD}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingCD ? '#2563EB' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingCD ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesCD.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                    File akan diupload ({pendingFilesCD.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesCD.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#2563EB', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesCD(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesCD(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#2563EB' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingCD}
                    disabled={isUploadingCD}
                    startIcon={isUploadingCD ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #2563EB 0%, #3B82F6 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #1D4ED8 0%, #2563EB 100%)' } }}
                  >
                    {isUploadingCD ? 'Mengupload...' : `Upload ${pendingFilesCD.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesCD.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesCD.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#2563EB', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#2563EB', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'CD', setFilesCD)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Berkas F.S.2A Dropzone */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F.S.2A</Typography>
              <Box
                sx={{
                  border: isDraggingFS2A ? '2px dashed #2563EB' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingFS2A ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#2563EB',
                    bgcolor: 'rgba(37, 99, 235, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-fs2a')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFS2A(true); }}
                onDragLeave={() => setIsDraggingFS2A(false)}
                onDrop={handleFileDropFS2A}
              >
                <input
                  id="fs2-edit-file-upload-fs2a"
                  type="file"
                  hidden
                  onChange={handleFileSelectFS2A}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingFS2A ? '#2563EB' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingFS2A ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesFS2A.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                    File akan diupload ({pendingFilesFS2A.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesFS2A.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#2563EB', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesFS2A(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesFS2A(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#2563EB' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingFS2A}
                    disabled={isUploadingFS2A}
                    startIcon={isUploadingFS2A ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #2563EB 0%, #3B82F6 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #1D4ED8 0%, #2563EB 100%)' } }}
                  >
                    {isUploadingFS2A ? 'Mengupload...' : `Upload ${pendingFilesFS2A.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesFS2A.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesFS2A.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#2563EB', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#2563EB', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'FS2A', setFilesFS2A)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Berkas F.S.2B Dropzone */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F.S.2B</Typography>
              <Box
                sx={{
                  border: isDraggingFS2B ? '2px dashed #2563EB' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingFS2B ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#2563EB',
                    bgcolor: 'rgba(37, 99, 235, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-fs2b')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFS2B(true); }}
                onDragLeave={() => setIsDraggingFS2B(false)}
                onDrop={handleFileDropFS2B}
              >
                <input
                  id="fs2-edit-file-upload-fs2b"
                  type="file"
                  hidden
                  onChange={handleFileSelectFS2B}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingFS2B ? '#2563EB' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingFS2B ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesFS2B.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                    File akan diupload ({pendingFilesFS2B.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesFS2B.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#2563EB', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesFS2B(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesFS2B(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#2563EB' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingFS2B}
                    disabled={isUploadingFS2B}
                    startIcon={isUploadingFS2B ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #2563EB 0%, #3B82F6 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #1D4ED8 0%, #2563EB 100%)' } }}
                  >
                    {isUploadingFS2B ? 'Mengupload...' : `Upload ${pendingFilesFS2B.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesFS2B.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesFS2B.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#2563EB', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#2563EB', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'FS2B', setFilesFS2B)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* Pengujian Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(217, 119, 6, 0.04)', border: '1px solid rgba(217, 119, 6, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D97706' }} />
              Pengujian
            </Typography>
            
            {/* Berkas F45 Dropzone */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F45</Typography>
              <Box
                sx={{
                  border: isDraggingF45 ? '2px dashed #D97706' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingF45 ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#D97706',
                    bgcolor: 'rgba(217, 119, 6, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-f45')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingF45(true); }}
                onDragLeave={() => setIsDraggingF45(false)}
                onDrop={handleFileDropF45}
              >
                <input
                  id="fs2-edit-file-upload-f45"
                  type="file"
                  hidden
                  onChange={handleFileSelectF45}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingF45 ? '#D97706' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingF45 ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesF45.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#D97706', fontSize: 18 }} />
                    File akan diupload ({pendingFilesF45.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesF45.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.06) 0%, rgba(217, 119, 6, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#D97706', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesF45(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesF45(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#D97706' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#D97706' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingF45}
                    disabled={isUploadingF45}
                    startIcon={isUploadingF45 ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #D97706 0%, #F59E0B 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #B45309 0%, #D97706 100%)' } }}
                  >
                    {isUploadingF45 ? 'Mengupload...' : `Upload ${pendingFilesF45.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesF45.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesF45.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#D97706', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#D97706', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'F45', setFilesF45)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Berkas F46 Dropzone */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas F46</Typography>
              <Box
                sx={{
                  border: isDraggingF46 ? '2px dashed #D97706' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingF46 ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#D97706',
                    bgcolor: 'rgba(217, 119, 6, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-f46')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingF46(true); }}
                onDragLeave={() => setIsDraggingF46(false)}
                onDrop={handleFileDropF46}
              >
                <input
                  id="fs2-edit-file-upload-f46"
                  type="file"
                  hidden
                  onChange={handleFileSelectF46}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingF46 ? '#D97706' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingF46 ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesF46.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#D97706', fontSize: 18 }} />
                    File akan diupload ({pendingFilesF46.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesF46.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(217, 119, 6, 0.06) 0%, rgba(217, 119, 6, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#D97706', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesF46(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesF46(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#D97706' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#D97706' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingF46}
                    disabled={isUploadingF46}
                    startIcon={isUploadingF46 ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #D97706 0%, #F59E0B 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #B45309 0%, #D97706 100%)' } }}
                  >
                    {isUploadingF46 ? 'Mengupload...' : `Upload ${pendingFilesF46.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesF46.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesF46.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#D97706', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#D97706', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'F46', setFilesF46)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* Deployment Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(124, 58, 237, 0.04)', border: '1px solid rgba(124, 58, 237, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />
              Deployment
            </Typography>
            
            {/* Berkas ND/BA Deployment Dropzone */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#1d1d1f' }}>Berkas ND/BA Deployment</Typography>
              <Box
                sx={{
                  border: isDraggingNDBA ? '2px dashed #7C3AED' : '2px dashed #e5e5e7',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isDraggingNDBA ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                  '&:hover': {
                    borderColor: '#7C3AED',
                    bgcolor: 'rgba(124, 58, 237, 0.04)',
                  },
                }}
                onClick={() => document.getElementById('fs2-edit-file-upload-ndba')?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingNDBA(true); }}
                onDragLeave={() => setIsDraggingNDBA(false)}
                onDrop={handleFileDropNDBA}
              >
                <input
                  id="fs2-edit-file-upload-ndba"
                  type="file"
                  hidden
                  onChange={handleFileSelectNDBA}
                  accept=".pdf,.doc,.docx"
                />
                <CloudUploadIcon sx={{ fontSize: 32, color: isDraggingNDBA ? '#7C3AED' : '#86868b', mb: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#1d1d1f' }}>{isDraggingNDBA ? 'Lepas untuk upload' : 'Klik atau seret file ke sini'}</Typography>
                <Typography variant="caption" sx={{ color: '#86868b' }}>PDF, Word (max 8MB)</Typography>
              </Box>
              
              {/* Pending files with date picker */}
              {pendingFilesNDBA.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.8rem', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: '#7C3AED', fontSize: 18 }} />
                    File akan diupload ({pendingFilesNDBA.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {pendingFilesNDBA.map((pending, index) => (
                      <Box key={index} sx={{ p: 1.5, background: 'linear-gradient(145deg, rgba(124, 58, 237, 0.06) 0%, rgba(124, 58, 237, 0.02) 100%)', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FileIcon sx={{ color: '#7C3AED', fontSize: 18, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pending.file.name}</Typography>
                          <Typography sx={{ color: '#86868b', fontSize: '0.7rem', whiteSpace: 'nowrap', mx: 1 }}>{formatFileSize(pending.file.size)}</Typography>
                          <IconButton size="small" onClick={() => setPendingFilesNDBA(prev => prev.filter((_, i) => i !== index))} sx={{ color: '#DC2626', width: 28, height: 28, borderRadius: '8px', background: 'rgba(220,38,38,0.08)', '&:hover': { background: 'rgba(220,38,38,0.15)' } }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Box>
                        <TextField
                          fullWidth
                          label="Tanggal Dokumen"
                          type="date"
                          size="small"
                          value={pending.tanggal}
                          onChange={(e) => setPendingFilesNDBA(prev => prev.map((p, i) => i === index ? { ...p, tanggal: e.target.value } : p))}
                          InputLabelProps={{ shrink: true }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', '&.Mui-focused fieldset': { borderColor: '#7C3AED' } }, '& .MuiInputLabel-root.Mui-focused': { color: '#7C3AED' } }}
                        />
                      </Box>
                    ))}
                  </Stack>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleUploadPendingNDBA}
                    disabled={isUploadingNDBA}
                    startIcon={isUploadingNDBA ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
                    sx={{ mt: 1.5, background: 'linear-gradient(145deg, #7C3AED 0%, #8B5CF6 100%)', borderRadius: '12px', fontWeight: 600, '&:hover': { background: 'linear-gradient(145deg, #6D28D9 0%, #7C3AED 100%)' } }}
                  >
                    {isUploadingNDBA ? 'Mengupload...' : `Upload ${pendingFilesNDBA.length} File`}
                  </Button>
                </Box>
              )}
              
              {/* Uploaded files list */}
              {filesNDBA.length > 0 && (
                <List sx={{ bgcolor: 'rgba(245, 245, 247, 0.8)', borderRadius: '8px', mt: 1 }}>
                  {filesNDBA.map((file) => (
                    <ListItem key={file.id} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><FileIcon sx={{ color: '#7C3AED', fontSize: 20 }} /></ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{file.display_name || file.original_name}</span>
                            {file.version && file.version > 1 && (
                              <Chip label={`V${file.version}`} size="small" sx={{ height: 16, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#7C3AED', color: 'white' }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatFileSize(file.file_size)}${file.tanggal_dokumen ? ` • ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID')}` : ''}`}
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
                        <IconButton size="small" onClick={() => handleRemoveFile(file.id, 'NDBA', setFilesNDBA)} sx={{ color: '#86868b', '&:hover': { color: '#DA251C' } }}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          {/* Keterangan Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(5, 150, 105, 0.04)', border: '1px solid rgba(5, 150, 105, 0.12)', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669' }} />
              Keterangan
            </Typography>
            <TextField
              label="Keterangan (Text dan/atau Link URL)"
              size="small"
              multiline
              rows={3}
              value={editFormData.keterangan || ''}
              onChange={(e) => setEditFormData({ ...editFormData, keterangan: e.target.value })}
              fullWidth
              placeholder="Masukkan keterangan atau link URL..."
              helperText="Anda dapat memasukkan teks biasa atau link URL"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'transparent' }}>
          <Button onClick={handleCloseEditModal} sx={{ borderRadius: '12px', px: 3 }}>Batal</Button>
          <Button variant="contained" onClick={handleEditSubmit} sx={{ borderRadius: '12px', px: 3, bgcolor: '#0066cc', '&:hover': { bgcolor: '#0052a3' } }}>Simpan</Button>
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
          <Typography sx={{ fontSize: '0.8rem', color: '#6366F1', fontWeight: 600 }}>
            {FS2_TAHAPAN_CONFIG.find(t => t.key === datePickerState.tahapanKey)?.label || datePickerState.tahapanKey}
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
          <TextField
            fullWidth
            type="date"
            value={datePickerState.value}
            onChange={(e) => setDatePickerState(prev => ({ ...prev, value: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(99,102,241,0.25)' },
                '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#6366F1' },
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
                setEditFormData(prev => ({ ...prev, [datePickerState.dateField!]: datePickerState.value }));
              }
              setDatePickerState(prev => ({ ...prev, open: false }));
            }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#6366F1',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              '&:hover': { bgcolor: '#4F46E5' },
              '&:disabled': { bgcolor: 'rgba(99,102,241,0.3)', color: 'white' },
            }}
          >
            Simpan Tanggal
          </Button>
        </DialogActions>
      </Dialog>

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
                background: 'linear-gradient(135deg, #31A24C 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(49, 162, 76, 0.25)',
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
              <CircularProgress size={32} sx={{ color: '#31A24C' }} />
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
                    <FileIcon sx={{ color: '#31A24C', fontSize: 24 }} />
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
                              bgcolor: '#31A24C',
                              color: 'white',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={`${file.file_size ? formatFileSize(file.file_size) : '-'}${file.tanggal_dokumen ? ` • Tgl. Dok: ${new Date(file.tanggal_dokumen).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
                    primaryTypographyProps={{
                      sx: { fontWeight: 500, color: '#1d1d1f', fontSize: '0.9rem' },
                    }}
                    secondaryTypographyProps={{
                      sx: { color: '#86868b', fontSize: '0.75rem' },
                    }}
                  />
                  <ListItemSecondaryAction>
                    {file.content_type && isPreviewable(file.content_type) && (
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

      {/* File Preview Modal - handles both external URLs and uploaded files */}
      <FilePreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewUrl('');
          setPreviewFileName('');
          setPreviewFile(null);
        }}
        fileId={previewFile?.id || null}
        fileName={previewFile?.original_name || previewFileName}
        contentType={previewFile?.content_type || getContentTypeFromUrl(previewUrl)}
        directUrl={previewFile ? undefined : previewUrl}
        downloadUrl={previewFile ? `/api/fs2/files/download/${previewFile.id}` : undefined}
      />
      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Fs2Disetujui;
