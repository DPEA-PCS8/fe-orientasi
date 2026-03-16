import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  TuneRounded,
  Close as CloseIcon,
  CheckCircleRounded,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  PushPin as PushPinIcon,
  AssessmentRounded,
} from '@mui/icons-material';
import { searchPksiDocuments, updatePksiApproval, type PksiDocumentData } from '../api/pksiApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { getUsersByRole, type UserSimple } from '../api/userApi';
import { getUserRoles } from '../api/authApi';
import { ViewPksiModal } from '../components/modals';
import { useSidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '../context/SidebarContext';

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
  iku: string;
  inhouseOutsource: string;
  jangkaWaktu: string;
  tanggalPengajuan: string;
  linkDocsT01: string;
  progress: string;
  // New fields
  programRbsi: string;
  inisiatifRbsi: string;
  // Anggaran
  anggaranTotal: string;
  anggaranTahunIni: string;
  anggaranTahunDepan: string;
  // Timeline
  targetUsreq: string;
  targetSit: string;
  targetUat: string;
  targetGoLive: string;
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

// Transform API data to UI format
const transformApiData = (apiData: PksiDocumentData): PksiData => {
  const jangkaWaktu = calculateJangkaWaktu(apiData);
  
  return {
    id: apiData.id,
    namaPksi: apiData.nama_pksi,
    namaAplikasi: apiData.nama_aplikasi || '-',
    picSatkerBA: apiData.pic_satker_names || apiData.pic_satker_ba || '-', // Display kode_skpa names
    picSatkerUuids: apiData.pic_satker_ba || '', // Original UUIDs for bidang lookup
    bidang: '', // Will be resolved from SKPA lookup
    pic: apiData.pic_approval_name || apiData.pic_approval || apiData.pengelola_aplikasi || '-',
    picUuid: apiData.pic_approval || '',
    anggotaTim: apiData.anggota_tim_names || apiData.anggota_tim || apiData.pengguna_aplikasi || '-',
    anggotaTimUuids: apiData.anggota_tim || '',
    iku: apiData.iku || '-',
    inhouseOutsource: apiData.inhouse_outsource || '-',
    jangkaWaktu: jangkaWaktu,
    tanggalPengajuan: apiData.tanggal_pengajuan || apiData.created_at || '',
    linkDocsT01: '', // Not available in API response
    progress: apiData.progress || 'Penyusunan Usreq',
    // New fields - read from backend or fallback to program_inisiatif_rbsi split
    programRbsi: apiData.program_rbsi || apiData.program_inisiatif_rbsi?.split(' - ')[0] || '-',
    inisiatifRbsi: apiData.inisiatif_rbsi || apiData.program_inisiatif_rbsi?.split(' - ')[1] || '-',
    // Anggaran - with dummy data
    anggaranTotal: apiData.anggaran_total || 'Rp 2.500.000.000',
    anggaranTahunIni: apiData.anggaran_tahun_ini || `Rp 1.500.000.000 (${new Date().getFullYear()})`,
    anggaranTahunDepan: apiData.anggaran_tahun_depan || (jangkaWaktu.includes('Multiyears') ? `Rp 1.000.000.000 (${new Date().getFullYear() + 1})` : '-'),
    // Timeline - use existing tahap data or new fields with dummy
    targetUsreq: apiData.target_usreq || apiData.tahap1_akhir || '2026-06-30',
    targetSit: apiData.target_sit || apiData.tahap5_akhir || '2026-09-30',
    targetUat: apiData.target_uat || '2026-11-15',
    targetGoLive: apiData.target_go_live || apiData.tahap7_akhir || '2026-12-31',
    // Rencana PKSI (T01/T02) - with dummy data
    statusT01T02: apiData.status_t01_t02 || 'Diterima',
    berkasT01T02: apiData.berkas_t01_t02 || 'T01_T02_Rencana_PKSI_v2.pdf',
    // Spesifikasi Kebutuhan (T11) - with dummy data
    statusT11: apiData.status_t11 || 'Diterima',
    berkasT11: apiData.berkas_t11 || 'T11_Spesifikasi_Kebutuhan_v1.pdf',
    // CD Prinsip - with dummy data
    statusCd: apiData.status_cd || 'Diterima',
    nomorCd: apiData.nomor_cd || `CD-${Math.floor(Math.random() * 900 + 100)}/PCS8/${new Date().getFullYear()}`,
    // Kontrak - with dummy data
    kontrakTanggalMulai: apiData.kontrak_tanggal_mulai || '2026-07-01',
    kontrakTanggalSelesai: apiData.kontrak_tanggal_selesai || '2026-12-31',
    kontrakNilai: apiData.kontrak_nilai || 'Rp 2.250.000.000',
    kontrakJumlahTermin: apiData.kontrak_jumlah_termin || '3 Termin',
    kontrakDetailPembayaran: apiData.kontrak_detail_pembayaran || '40% - 40% - 20%',
    // BA Deploy - with dummy data
    baDeploy: apiData.ba_deploy || `BA-DEPLOY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
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

function PksiDisetujui() {
  const { isCollapsed } = useSidebar();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pksiData, setPksiData] = useState<PksiData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
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

  // Filter state
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

  // View modal state
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPksiIdForView, setSelectedPksiIdForView] = useState<string | null>(null);

  // Edit approval dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedPksiForEdit, setSelectedPksiForEdit] = useState<PksiData | null>(null);
  const [editForm, setEditForm] = useState({
    pic: '',
    picName: '',
    anggotaTim: [] as string[],
    anggotaTimNames: [] as string[],
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
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // File upload state for T01 and T11
  const [filesT01, setFilesT01] = useState<File[]>([]);
  const [filesT11, setFilesT11] = useState<File[]>([]);
  const [isDraggingT01, setIsDraggingT01] = useState(false);
  const [isDraggingT11, setIsDraggingT11] = useState(false);

  // Eligible users for PIC/Anggota Tim (Admin + Pengembang)
  const [eligibleUsers, setEligibleUsers] = useState<UserSimple[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch eligible users on mount
  useEffect(() => {
    const fetchEligibleUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await getUsersByRole('Admin,Pengembang');
        setEligibleUsers(users);
      } catch (error) {
        console.error('Failed to fetch eligible users:', error);
        setEligibleUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchEligibleUsers();
  }, []);

  const handleViewClick = (pksiId: string) => {
    setSelectedPksiIdForView(pksiId);
    setOpenViewModal(true);
  };

  const handleEditClick = (pksi: PksiData) => {
    setSelectedPksiForEdit(pksi);
    
    // Parse existing anggota tim UUIDs and names
    const existingUuids = pksi.anggotaTimUuids && pksi.anggotaTimUuids !== '-' 
      ? pksi.anggotaTimUuids.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const existingNames = pksi.anggotaTim && pksi.anggotaTim !== '-'
      ? pksi.anggotaTim.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    
    setEditForm({
      pic: pksi.picUuid || '',
      picName: pksi.pic !== '-' ? pksi.pic : '',
      anggotaTim: existingUuids,
      anggotaTimNames: existingNames,
      iku: pksi.iku !== '-' ? pksi.iku : 'ya',
      inhouseOutsource: pksi.inhouseOutsource !== '-' ? pksi.inhouseOutsource : 'inhouse',
      progress: pksi.progress || 'Penyusunan Usreq',
      // New fields
      programRbsi: pksi.programRbsi !== '-' ? pksi.programRbsi : '',
      inisiatifRbsi: pksi.inisiatifRbsi !== '-' ? pksi.inisiatifRbsi : '',
      anggaranTotal: pksi.anggaranTotal !== '-' ? pksi.anggaranTotal : '',
      anggaranTahunIni: pksi.anggaranTahunIni !== '-' ? pksi.anggaranTahunIni : '',
      anggaranTahunDepan: pksi.anggaranTahunDepan !== '-' ? pksi.anggaranTahunDepan : '',
      targetUsreq: pksi.targetUsreq !== '-' ? pksi.targetUsreq : '',
      targetSit: pksi.targetSit !== '-' ? pksi.targetSit : '',
      targetUat: pksi.targetUat !== '-' ? pksi.targetUat : '',
      targetGoLive: pksi.targetGoLive !== '-' ? pksi.targetGoLive : '',
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
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPksiForEdit) return;

    setIsSubmittingEdit(true);
    try {
      await updatePksiApproval(selectedPksiForEdit.id, {
        iku: editForm.iku,
        inhouse_outsource: editForm.inhouseOutsource,
        pic_approval: editForm.pic,
        pic_approval_name: editForm.picName,
        anggota_tim: editForm.anggotaTim.join(', '),
        anggota_tim_names: editForm.anggotaTimNames.join(', '),
        progress: editForm.progress,
        // New fields (removed program_rbsi, inisiatif_rbsi is read-only)
        anggaran_total: editForm.anggaranTotal || undefined,
        anggaran_tahun_ini: editForm.anggaranTahunIni || undefined,
        anggaran_tahun_depan: editForm.anggaranTahunDepan || undefined,
        target_usreq: editForm.targetUsreq || undefined,
        target_sit: editForm.targetSit || undefined,
        target_uat: editForm.targetUat || undefined,
        target_go_live: editForm.targetGoLive || undefined,
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
    } catch (error) {
      console.error('Error updating PKSI:', error);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleEditCancel = () => {
    setOpenEditDialog(false);
    setSelectedPksiForEdit(null);
  };

  // Fetch PKSI data from API - only approved
  const fetchPksiData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await searchPksiDocuments({
        search: keyword || undefined,
        status: 'DISETUJUI',
        page: page,
        size: rowsPerPage,
        sortBy: 'nama_pksi',
        sortDir: 'asc',
      });

      // DEBUG: Log response and user department
      console.log('=== DEBUG PKSI DISETUJUI ===');
      console.log('User Department:', userDepartment);
      console.log('User Roles:', userRoles);
      console.log('Is Admin/Pengembang:', isAdminOrPengembang);
      console.log('PKSI Response:', response);
      console.log('Total Elements:', response.total_elements);
      console.log('===========================');

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
    } catch (error) {
      console.error('Failed to fetch PKSI data:', error);
      setPksiData([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, rowsPerPage, userDepartment, userRoles, isAdminOrPengembang]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchPksiData();
  }, [fetchPksiData]);

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
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleJangkaWaktuChange = (jangkaWaktu: string) => {
    const newSet = new Set(selectedJangkaWaktu);
    if (newSet.has(jangkaWaktu)) {
      newSet.delete(jangkaWaktu);
    } else {
      newSet.add(jangkaWaktu);
    }
    setSelectedJangkaWaktu(newSet);
  };

  const handleProgressChange = (progress: string) => {
    const newSet = new Set(selectedProgress);
    if (newSet.has(progress)) {
      newSet.delete(progress);
    } else {
      newSet.add(progress);
    }
    setSelectedProgress(newSet);
  };

  const handleResetFilter = () => {
    setSelectedJangkaWaktu(new Set());
    setSelectedYear('');
    setSelectedAplikasi('');
    setSelectedSkpa(new Set());
    setSelectedProgress(new Set());
    setSelectedIku('');
    setSelectedInhouseOutsource('');
    setSelectedBidang(new Set());
    setSelectedPic(new Set());
  };

  // Generate year options from data
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    pksiData.forEach(item => {
      if (item.tanggalPengajuan) {
        const year = new Date(item.tanggalPengajuan).getFullYear().toString();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [pksiData]);

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
    return count;
  }, [selectedJangkaWaktu, selectedYear, selectedAplikasi, selectedSkpa, selectedProgress, selectedIku, selectedInhouseOutsource, selectedBidang, selectedPic]);

  // Filter locally based on all filter criteria
  const filteredPksi = useMemo(() => {
    let result = pksiData;
    
    if (selectedJangkaWaktu.size > 0) {
      result = result.filter(item => {
        if (selectedJangkaWaktu.has('Single Year') && item.jangkaWaktu === 'Single Year') return true;
        if (selectedJangkaWaktu.has('Multiyears') && item.jangkaWaktu.startsWith('Multiyears')) return true;
        return false;
      });
    }

    if (selectedYear) {
      result = result.filter(item => {
        if (!item.tanggalPengajuan) return false;
        const year = new Date(item.tanggalPengajuan).getFullYear().toString();
        return year === selectedYear;
      });
    }

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
  }, [pksiData, selectedJangkaWaktu, selectedYear, selectedAplikasi, selectedSkpa, selectedProgress, selectedIku, selectedInhouseOutsource, selectedBidang, selectedPic, resolveSkpaCodes, resolveBidangNames]);

  const paginatedPksi = filteredPksi;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // File handling functions for T01
  const handleFileSelectT01 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = [...filesT01, ...Array.from(files)];
      setFilesT01(newFiles);
      // Auto-update status based on files
      setEditForm(prev => ({ ...prev, statusT01T02: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    }
  };

  const handleDropT01 = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingT01(false);
    const files = event.dataTransfer.files;
    if (files) {
      const newFiles = [...filesT01, ...Array.from(files)];
      setFilesT01(newFiles);
      // Auto-update status based on files
      setEditForm(prev => ({ ...prev, statusT01T02: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    }
  };

  const handleRemoveFileT01 = (index: number) => {
    const newFiles = filesT01.filter((_, i) => i !== index);
    setFilesT01(newFiles);
    // Auto-update status based on remaining files
    setEditForm(prev => ({ ...prev, statusT01T02: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
  };

  // File handling functions for T11
  const handleFileSelectT11 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = [...filesT11, ...Array.from(files)];
      setFilesT11(newFiles);
      // Auto-update status based on files
      setEditForm(prev => ({ ...prev, statusT11: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    }
  };

  const handleDropT11 = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingT11(false);
    const files = event.dataTransfer.files;
    if (files) {
      const newFiles = [...filesT11, ...Array.from(files)];
      setFilesT11(newFiles);
      // Auto-update status based on files
      setEditForm(prev => ({ ...prev, statusT11: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
    }
  };

  const handleRemoveFileT11 = (index: number) => {
    const newFiles = filesT11.filter((_, i) => i !== index);
    setFilesT11(newFiles);
    // Auto-update status based on remaining files
    setEditForm(prev => ({ ...prev, statusT11: newFiles.length > 0 ? 'Diterima' : 'Belum Diterima' }));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
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
          Monitoring dan tracking PKSI ({totalElements} item)
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
                  value={selectedAplikasi}
                  label="Pilih Aplikasi"
                  onChange={(e) => setSelectedAplikasi(e.target.value)}
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
                  value={Array.from(selectedSkpa)}
                  onChange={(_, newValue) => setSelectedSkpa(new Set(newValue))}
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
                      placeholder={selectedSkpa.size === 0 ? 'Pilih SKPA' : ''}
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
                  value={Array.from(selectedBidang)}
                  onChange={(_, newValue) => setSelectedBidang(new Set(newValue))}
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
                      placeholder={selectedBidang.size === 0 ? 'Pilih Bidang' : ''}
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

            {/* Row 3: Tahun & PIC */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
              {/* Year Filter */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D97706' }} />
                  Periode Tahun
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedYear}
                    displayEmpty
                    onChange={(e) => setSelectedYear(e.target.value)}
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
                  value={Array.from(selectedPic)}
                  onChange={(_, newValue) => setSelectedPic(new Set(newValue))}
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
                      placeholder={selectedPic.size === 0 ? 'Pilih PIC' : ''}
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
            </Box>

            {/* Row 4: Quick Filter Cards */}
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
                        checked={selectedJangkaWaktu.has('Single Year')}
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
                        checked={selectedJangkaWaktu.has('Multiyears')}
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
                    value={selectedIku}
                    displayEmpty
                    onChange={(e) => setSelectedIku(e.target.value)}
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
                    value={selectedInhouseOutsource}
                    displayEmpty
                    onChange={(e) => setSelectedInhouseOutsource(e.target.value)}
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
                      bgcolor: selectedProgress.has(progress) 
                        ? '#F59E0B' 
                        : 'white',
                      color: selectedProgress.has(progress) ? 'white' : '#374151',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      border: selectedProgress.has(progress) 
                        ? '1px solid #F59E0B' 
                        : '1px solid rgba(0, 0, 0, 0.12)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: selectedProgress.has(progress) 
                          ? '#D97706' 
                          : 'rgba(251, 191, 36, 0.12)',
                        borderColor: '#F59E0B',
                      },
                    }}
                  />
                ))}
              </Box>
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
                onClick={handleFilterClose}
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
                {/* Timeline - grouped */}
                <TableCell colSpan={4} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem' }}>Timeline</TableCell>
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
                {/* Timeline sub-headers */}
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 110 }}>Target Usreq</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100 }}>Target SIT</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 120 }}>Target UAT/PDKK</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 110 }}>Target Go Live</TableCell>
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
                  <TableCell colSpan={30} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#31A24C' }} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#86868b' }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={30} sx={{ textAlign: 'center', py: 6 }}>
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
                  {/* Nama Aplikasi */}
                  <TableCell sx={{ py: 1, px: 2, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 160, ...(stickyColumns.has('namaAplikasi') && { position: 'sticky', left: getStickyLeft('namaAplikasi'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('namaAplikasi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.namaAplikasi}
                    </Typography>
                  </TableCell>
                  {/* Nama PKSI */}
                  <TableCell sx={{ py: 1, px: 2, whiteSpace: 'normal', wordWrap: 'break-word', minWidth: 180, ...(stickyColumns.has('namaPksi') && { position: 'sticky', left: getStickyLeft('namaPksi'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('namaPksi') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      {item.namaPksi}
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
                    <Chip
                      label={item.progress}
                      size="small"
                      sx={{
                        background: (() => {
                          const progressIndex = PROGRESS_OPTIONS.indexOf(item.progress as typeof PROGRESS_OPTIONS[number]);
                          if (progressIndex === -1) return 'linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(107, 114, 128, 0.15) 100%)';
                          if (progressIndex === PROGRESS_OPTIONS.length - 1) return 'linear-gradient(135deg, rgba(74, 222, 128, 0.25) 0%, rgba(34, 197, 94, 0.2) 100%)';
                          if (progressIndex >= 6) return 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)';
                          if (progressIndex >= 3) return 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)';
                          return 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)';
                        })(),
                        color: (() => {
                          const progressIndex = PROGRESS_OPTIONS.indexOf(item.progress as typeof PROGRESS_OPTIONS[number]);
                          if (progressIndex === -1) return '#4B5563';
                          if (progressIndex === PROGRESS_OPTIONS.length - 1) return '#15803D';
                          if (progressIndex >= 6) return '#1D4ED8';
                          if (progressIndex >= 3) return '#7C3AED';
                          return '#B45309';
                        })(),
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
                  {/* Timeline - Target Usreq */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.targetUsreq !== '-' && item.targetUsreq ? new Date(item.targetUsreq).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </Typography>
                  </TableCell>
                  {/* Timeline - Target SIT */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.targetSit !== '-' && item.targetSit ? new Date(item.targetSit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </Typography>
                  </TableCell>
                  {/* Timeline - Target UAT/PDKK */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.targetUat !== '-' && item.targetUat ? new Date(item.targetUat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </Typography>
                  </TableCell>
                  {/* Timeline - Target Go Live */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(139, 92, 246, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.targetGoLive !== '-' && item.targetGoLive ? new Date(item.targetGoLive).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </Typography>
                  </TableCell>
                  {/* Rencana PKSI - Status T01/T02 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(217, 119, 6, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.statusT01T02}
                    </Typography>
                  </TableCell>
                  {/* Rencana PKSI - Berkas Terbaru T01/T02 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(217, 119, 6, 0.04)' }}>
                    {item.berkasT01T02 && item.berkasT01T02 !== '-' ? (
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                        onClick={() => alert(`View document: ${item.berkasT01T02}`)}
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
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                    )}
                  </TableCell>
                  {/* Spesifikasi Kebutuhan - Status T11 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.statusT11}
                    </Typography>
                  </TableCell>
                  {/* Spesifikasi Kebutuhan - Berkas Terbaru T11 */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap', background: 'rgba(5, 150, 105, 0.04)' }}>
                    {item.berkasT11 && item.berkasT11 !== '-' ? (
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                        onClick={() => alert(`View document: ${item.berkasT11}`)}
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
                    ) : (
                      <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.8rem' }}>-</Typography>
                    )}
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
                    <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem' }}>
                      {item.baDeploy || '-'}
                    </Typography>
                  </TableCell>
                  {/* Aksi */}
                  <TableCell sx={{ py: 1.5, px: 1.5, whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Tooltip title="Lihat Detail PKSI">
                        <IconButton
                          size="small"
                          onClick={() => handleViewClick(item.id)}
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
        }}
        pksiId={selectedPksiIdForView}
        showMonitoringSection={true}
      />

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

          {/* PIC Field - Liquid Glass Style */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel 
              id="edit-pic-label"
              sx={{
                '&.Mui-focused': { color: '#D97706' },
              }}
            >
              PIC *
            </InputLabel>
            <Select
              labelId="edit-pic-label"
              value={editForm.pic}
              label="PIC *"
              onChange={(e) => {
                const selectedUser = eligibleUsers.find(u => u.uuid === e.target.value);
                setEditForm({ 
                  ...editForm, 
                  pic: e.target.value,
                  picName: selectedUser?.full_name || '',
                });
              }}
              disabled={isLoadingUsers}
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
              <MenuItem value=""><em>Pilih PIC</em></MenuItem>
              {eligibleUsers.map((user) => (
                <MenuItem key={user.uuid} value={user.uuid}>
                  {user.full_name} ({user.department || 'No Dept'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Anggota Tim Field - Liquid Glass Style */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              options={eligibleUsers}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.full_name}
              value={eligibleUsers.filter(u => editForm.anggotaTim.includes(u.uuid))}
              onChange={(_, newValue) => {
                const users = newValue as UserSimple[];
                setEditForm({ 
                  ...editForm, 
                  anggotaTim: users.map(u => u.uuid),
                  anggotaTimNames: users.map(u => u.full_name),
                });
              }}
              loading={isLoadingUsers}
              isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Anggota Tim *"
                  placeholder="Pilih anggota tim"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        '& fieldset': {
                          borderColor: 'rgba(217, 119, 6, 0.3)',
                        },
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 4px 20px rgba(217, 119, 6, 0.12)',
                        '& fieldset': {
                          borderColor: '#D97706',
                          borderWidth: '1.5px',
                        },
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#D97706',
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
                      label={option.full_name}
                      size="small"
                      {...tagProps}
                      sx={{ 
                        background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                        '& .MuiChip-deleteIcon': {
                          color: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            color: 'white',
                          },
                        },
                      }}
                    />
                  );
                })
              }
            />
          </FormControl>

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

          {/* Progress Field - Full Width */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel 
              id="edit-progress-label"
              sx={{ '&.Mui-focused': { color: '#D97706' } }}
            >
              Progres
            </InputLabel>
            <Select
              labelId="edit-progress-label"
              value={editForm.progress}
              label="Progres"
              onChange={(e) => setEditForm({ ...editForm, progress: e.target.value })}
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
              {PROGRESS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

          {/* Timeline Fields - 2 rows */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Target Usreq"
              type="date"
              value={editForm.targetUsreq}
              onChange={(e) => setEditForm({ ...editForm, targetUsreq: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(139, 92, 246, 0.02)',
                  '& fieldset': { borderColor: 'rgba(139, 92, 246, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(139, 92, 246, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8B5CF6' },
              }}
            />
            <TextField
              fullWidth
              label="Target SIT"
              type="date"
              value={editForm.targetSit}
              onChange={(e) => setEditForm({ ...editForm, targetSit: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(139, 92, 246, 0.02)',
                  '& fieldset': { borderColor: 'rgba(139, 92, 246, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(139, 92, 246, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8B5CF6' },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Target UAT/PDKK"
              type="date"
              value={editForm.targetUat}
              onChange={(e) => setEditForm({ ...editForm, targetUat: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(139, 92, 246, 0.02)',
                  '& fieldset': { borderColor: 'rgba(139, 92, 246, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(139, 92, 246, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8B5CF6' },
              }}
            />
            <TextField
              fullWidth
              label="Target Go Live"
              type="date"
              value={editForm.targetGoLive}
              onChange={(e) => setEditForm({ ...editForm, targetGoLive: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: 'rgba(139, 92, 246, 0.02)',
                  '& fieldset': { borderColor: 'rgba(139, 92, 246, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(139, 92, 246, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8B5CF6' },
              }}
            />
          </Box>

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
              background: filesT01.length > 0 
                ? 'linear-gradient(145deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                : 'linear-gradient(145deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
              border: filesT01.length > 0 ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <Typography sx={{ 
                fontSize: '0.7rem', 
                fontWeight: 600, 
                color: filesT01.length > 0 ? '#059669' : '#EF4444',
              }}>
                {filesT01.length > 0 ? '✓ Diterima' : '○ Belum Diterima'}
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
              cursor: 'pointer',
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
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
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
              Drop dokumen T01/T02 di sini
            </Typography>
            <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>
              atau klik untuk memilih file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
            </Typography>
          </label>

          {/* T01/T02 Files List */}
          {filesT01.length > 0 && (
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
                File Terpilih ({filesT01.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filesT01.map((file, index) => (
                  <Box
                    key={index}
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
                        {file.name}
                      </Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem' }}>
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    <Tooltip title="Hapus file">
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveFileT01(index)}
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
              background: filesT11.length > 0 
                ? 'linear-gradient(145deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                : 'linear-gradient(145deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
              border: filesT11.length > 0 ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <Typography sx={{ 
                fontSize: '0.7rem', 
                fontWeight: 600, 
                color: filesT11.length > 0 ? '#059669' : '#EF4444',
              }}>
                {filesT11.length > 0 ? '✓ Diterima' : '○ Belum Diterima'}
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
              cursor: 'pointer',
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
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
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
              Drop dokumen T11 di sini
            </Typography>
            <Typography sx={{ color: '#86868b', fontSize: '0.75rem' }}>
              atau klik untuk memilih file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
            </Typography>
          </label>

          {/* T11 Files List */}
          {filesT11.length > 0 && (
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
                File Terpilih ({filesT11.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filesT11.map((file, index) => (
                  <Box
                    key={index}
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
                        {file.name}
                      </Typography>
                      <Typography sx={{ color: '#86868b', fontSize: '0.7rem' }}>
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    <Tooltip title="Hapus file">
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveFileT11(index)}
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
            label="BA Deploy"
            value={editForm.baDeploy}
            onChange={(e) => setEditForm({ ...editForm, baDeploy: e.target.value })}
            placeholder="Link atau nama dokumen BA Deploy"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(217, 119, 6, 0.3)' },
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
            disabled={!editForm.pic || editForm.anggotaTim.length === 0 || isSubmittingEdit}
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
    </Box>
  );
}

export default PksiDisetujui;
