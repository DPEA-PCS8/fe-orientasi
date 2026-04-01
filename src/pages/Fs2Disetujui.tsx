import { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  TuneRounded,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  PushPin as PushPinIcon,
  AssessmentRounded,
} from '@mui/icons-material';
import { searchApprovedFs2Documents, updateFs2Document, type Fs2DocumentData, type Fs2DocumentRequest } from '../api/fs2Api';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { getUsersByRole, type UserSimple } from '../api/userApi';
import { usePermissions } from '../hooks/usePermissions';
import ViewFs2Modal from '../components/modals/ViewFs2Modal';
import { FilePreviewModal } from '../components/modals';
import { useSidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '../context/SidebarContext';

// Interface for transformed data
interface Fs2DisetujuiData {
  id: string;
  namaAplikasi: string;
  progres: string;
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
  dokumenPath: string;
  // Dokumen Pengajuan F.S.2
  nomorNd: string;
  tanggalNd: string;
  berkasNd: string;
  berkasFs2: string;
  // CD Prinsip
  nomorCd: string;
  tanggalCd: string;
  berkasCd: string;
  berkasFs2a: string;
  berkasFs2b: string;
  // Pengujian
  targetPengujian: string;
  realisasiPengujian: string;
  berkasF45: string;
  berkasF46: string;
  // Deployment
  targetDeployment: string;
  realisasiDeployment: string;
  berkasNdBaDeployment: string;
  // Go Live
  targetGoLive: string;
  // Keterangan
  keterangan: string;
}

const PROGRES_OPTIONS = ['ASESMEN', 'CODING', 'PDKK', 'DEPLOY_SELESAI'] as const;
const FASE_PENGAJUAN_OPTIONS = ['DESAIN', 'PEMELIHARAAN'] as const;
const MEKANISME_OPTIONS = ['INHOUSE', 'OUTSOURCE'] as const;
const PELAKSANAAN_OPTIONS = ['SINGLE_YEAR', 'MULTIYEARS'] as const;

const PROGRES_LABELS: Record<string, string> = {
  ASESMEN: 'Asesmen',
  CODING: 'Coding',
  PDKK: 'PDKK',
  DEPLOY_SELESAI: 'Deploy/Selesai',
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

// Transform API data to UI format
const transformApiData = (apiData: Fs2DocumentData): Fs2DisetujuiData => {
  return {
    id: apiData.id,
    namaAplikasi: apiData.nama_aplikasi || '-',
    progres: apiData.progres || '-',
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
    dokumenPath: apiData.dokumen_path || '',
    // Dokumen Pengajuan F.S.2
    nomorNd: apiData.nomor_nd || '-',
    tanggalNd: apiData.tanggal_nd || '-',
    berkasNd: apiData.berkas_nd || '',
    berkasFs2: apiData.berkas_fs2 || '',
    // CD Prinsip
    nomorCd: apiData.nomor_cd || '-',
    tanggalCd: apiData.tanggal_cd || '-',
    berkasCd: apiData.berkas_cd || '',
    berkasFs2a: apiData.berkas_fs2a || '',
    berkasFs2b: apiData.berkas_fs2b || '',
    // Pengujian
    targetPengujian: apiData.target_pengujian || '-',
    realisasiPengujian: apiData.realisasi_pengujian || '-',
    berkasF45: apiData.berkas_f45 || '',
    berkasF46: apiData.berkas_f46 || '',
    // Deployment
    targetDeployment: apiData.target_deployment || '-',
    realisasiDeployment: apiData.realisasi_deployment || '-',
    berkasNdBaDeployment: apiData.berkas_nd_ba_deployment || '',
    // Go Live
    targetGoLive: apiData.target_go_live || '-',
    // Keterangan
    keterangan: apiData.keterangan || '-',
  };
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

const PROGRES_COLORS: Record<string, { bg: string; text: string }> = {
  ASESMEN: { bg: '#FEF3C7', text: '#D97706' },
  CODING: { bg: '#DBEAFE', text: '#2563EB' },
  PDKK: { bg: '#E0E7FF', text: '#4F46E5' },
  DEPLOY_SELESAI: { bg: '#D1FAE5', text: '#059669' },
};

function Fs2Disetujui() {
  const { isCollapsed } = useSidebar();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Fs2DisetujuiData>('namaAplikasi');
  const [order, setOrder] = useState<Order>('asc');
  const [fs2Data, setFs2Data] = useState<Fs2DisetujuiData[]>([]);
  const [rawData, setRawData] = useState<Fs2DocumentData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Permission check
  const { getMenuPermissions } = usePermissions();
  const fs2Permissions = getMenuPermissions('FS2_APPROVED');

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProgres, setSelectedProgres] = useState<Set<string>>(new Set());
  const [selectedFase, setSelectedFase] = useState<Set<string>>(new Set());
  const [selectedMekanisme, setSelectedMekanisme] = useState<Set<string>>(new Set());
  const [selectedPelaksanaan, setSelectedPelaksanaan] = useState<Set<string>>(new Set());
  const [selectedBidangFilter, setSelectedBidangFilter] = useState<string>('');
  const [selectedSkpaFilter, setSelectedSkpaFilter] = useState<string>('');

  // Sticky columns configuration
  const [stickyColumnsAnchorEl, setStickyColumnsAnchorEl] = useState<null | HTMLElement>(null);
  const [stickyColumns, setStickyColumns] = useState<Set<string>>(new Set(['no', 'namaAplikasi']));
  
  // Column definitions for sticky configuration - all table columns
  const COLUMN_OPTIONS = useMemo(() => [
    { id: 'no', label: 'No', width: 50 },
    { id: 'namaAplikasi', label: 'Nama Aplikasi', width: 160 },
    { id: 'progres', label: 'Progres', width: 100 },
    { id: 'fasePengajuan', label: 'Fase Pengajuan', width: 130 },
    { id: 'iku', label: 'IKU', width: 80 },
    { id: 'bidang', label: 'Bidang', width: 120 },
    { id: 'skpa', label: 'SKPA', width: 100 },
    { id: 'mekanisme', label: 'Mekanisme', width: 100 },
    { id: 'pelaksanaan', label: 'Pelaksanaan', width: 140 },
    { id: 'pic', label: 'PIC', width: 120 },
    { id: 'dokumenPengajuan', label: 'Dokumen Pengajuan F.S.2', width: 360 },
    { id: 'cdPrinsip', label: 'CD Prinsip', width: 440 },
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
  const [userList, setUserList] = useState<UserSimple[]>([]);

  // Edit modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedFs2, setSelectedFs2] = useState<Fs2DocumentData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Fs2DocumentRequest>>({});

  // View modal state
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedFs2IdForView, setSelectedFs2IdForView] = useState<string | null>(null);

  // File preview modal state (popup preview for berkas links)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');

  // Fetch approved F.S.2 data
  const fetchFs2Data = useCallback(async () => {
    setIsLoading(true);
    try {
      const progresFilter = selectedProgres.size === 1 ? Array.from(selectedProgres)[0] : undefined;
      const faseFilter = selectedFase.size === 1 ? Array.from(selectedFase)[0] : undefined;
      const mekanismeFilter = selectedMekanisme.size === 1 ? Array.from(selectedMekanisme)[0] : undefined;
      const pelaksanaanFilter = selectedPelaksanaan.size === 1 ? Array.from(selectedPelaksanaan)[0] : undefined;

      const response = await searchApprovedFs2Documents({
        search: keyword || undefined,
        bidang_id: selectedBidangFilter || undefined,
        skpa_id: selectedSkpaFilter || undefined,
        progres: progresFilter,
        fase_pengajuan: faseFilter,
        mekanisme: mekanismeFilter,
        pelaksanaan: pelaksanaanFilter,
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
  }, [keyword, page, rowsPerPage, selectedProgres, selectedFase, selectedMekanisme, selectedPelaksanaan, selectedBidangFilter, selectedSkpaFilter]);

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [bidang, skpaRes, users] = await Promise.all([
          getAllBidang(),
          getAllSkpa(),
          getUsersByRole('Admin,Pengembang'),
        ]);
        setBidangList(bidang);
        setSkpaList(skpaRes.data || []);
        setUserList(users);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
      }
    };
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchFs2Data();
  }, [fetchFs2Data]);

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
    setSelectedFase(new Set());
    setSelectedMekanisme(new Set());
    setSelectedPelaksanaan(new Set());
    setSelectedBidangFilter('');
    setSelectedSkpaFilter('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedProgres.size > 0) count++;
    if (selectedFase.size > 0) count++;
    if (selectedMekanisme.size > 0) count++;
    if (selectedPelaksanaan.size > 0) count++;
    if (selectedBidangFilter) count++;
    if (selectedSkpaFilter) count++;
    return count;
  }, [selectedProgres, selectedFase, selectedMekanisme, selectedPelaksanaan, selectedBidangFilter, selectedSkpaFilter]);

  // View modal handlers
  const handleOpenViewModal = (fs2Id: string) => {
    setSelectedFs2IdForView(fs2Id);
    setOpenViewModal(true);
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setSelectedFs2IdForView(null);
  };

  // File preview handlers (for berkas links)
  const handleOpenPreview = (url: string, fileName: string) => {
    setPreviewUrl(url);
    setPreviewFileName(fileName);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl('');
    setPreviewFileName('');
  };

  // Check if URL is previewable
  const isPreviewableUrl = (url: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || 
           lowerUrl.endsWith('.png') || 
           lowerUrl.endsWith('.jpg') || 
           lowerUrl.endsWith('.jpeg') || 
           lowerUrl.endsWith('.gif') ||
           lowerUrl.includes('pdf') ||
           lowerUrl.includes('image');
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

  // Edit modal handlers
  const handleOpenEditModal = (fs2Id: string) => {
    const fs2 = rawData.find(item => item.id === fs2Id);
    if (fs2) {
      setSelectedFs2(fs2);
      setEditFormData({
        progres: fs2.progres || '',
        fase_pengajuan: fs2.fase_pengajuan || '',
        iku: fs2.iku || '',
        mekanisme: fs2.mekanisme || '',
        pelaksanaan: fs2.pelaksanaan || '',
        tahun: fs2.tahun || undefined,
        tahun_mulai: fs2.tahun_mulai || undefined,
        tahun_selesai: fs2.tahun_selesai || undefined,
        pic_id: fs2.pic_id || '',
        bidang_id: fs2.bidang_id || '',
        // Dokumen Pengajuan F.S.2
        nomor_nd: fs2.nomor_nd || '',
        tanggal_nd: fs2.tanggal_nd || '',
        berkas_nd: fs2.berkas_nd || '',
        berkas_fs2: fs2.berkas_fs2 || '',
        // CD Prinsip
        nomor_cd: fs2.nomor_cd || '',
        tanggal_cd: fs2.tanggal_cd || '',
        berkas_cd: fs2.berkas_cd || '',
        berkas_fs2a: fs2.berkas_fs2a || '',
        berkas_fs2b: fs2.berkas_fs2b || '',
        // Pengujian
        target_pengujian: fs2.target_pengujian || '',
        realisasi_pengujian: fs2.realisasi_pengujian || '',
        berkas_f45: fs2.berkas_f45 || '',
        berkas_f46: fs2.berkas_f46 || '',
        // Deployment
        target_deployment: fs2.target_deployment || '',
        realisasi_deployment: fs2.realisasi_deployment || '',
        berkas_nd_ba_deployment: fs2.berkas_nd_ba_deployment || '',
        // Go Live
        target_go_live: fs2.target_go_live || '',
        // Keterangan
        keterangan: fs2.keterangan || '',
      });
      setOpenEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setSelectedFs2(null);
    setEditFormData({});
  };

  const handleEditSubmit = async () => {
    if (!selectedFs2) return;
    try {
      await updateFs2Document(selectedFs2.id, {
        ...editFormData,
      } as Fs2DocumentRequest);
      handleCloseEditModal();
      fetchFs2Data();
    } catch (error) {
      console.error('Failed to update F.S.2:', error);
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
            {/* Row 1: Progres & Fase Pengajuan */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
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
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('progres') && { position: 'sticky', left: getStickyLeft('progres'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('progres') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Progres</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 130, ...(stickyColumns.has('fasePengajuan') && { position: 'sticky', left: getStickyLeft('fasePengajuan'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('fasePengajuan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Fase Pengajuan</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 80, ...(stickyColumns.has('iku') && { position: 'sticky', left: getStickyLeft('iku'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('iku') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>IKU</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('bidang') && { position: 'sticky', left: getStickyLeft('bidang'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('bidang') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Bidang</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('skpa') && { position: 'sticky', left: getStickyLeft('skpa'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('skpa') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>SKPA</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100, ...(stickyColumns.has('mekanisme') && { position: 'sticky', left: getStickyLeft('mekanisme'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('mekanisme') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Mekanisme</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 140, ...(stickyColumns.has('pelaksanaan') && { position: 'sticky', left: getStickyLeft('pelaksanaan'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('pelaksanaan') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>Pelaksanaan</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 120, ...(stickyColumns.has('pic') && { position: 'sticky', left: getStickyLeft('pic'), zIndex: 3, bgcolor: '#f5f5f7' }), ...(isLastStickyColumn('pic') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>PIC</TableCell>
              {/* Dokumen Pengajuan F.S.2 - grouped */}
              <TableCell colSpan={4} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(49, 162, 76, 0.08)' }}>Dokumen Pengajuan F.S.2</TableCell>
              {/* CD Prinsip - grouped */}
              <TableCell colSpan={5} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(37, 99, 235, 0.08)' }}>CD Prinsip</TableCell>
              {/* Pengujian - grouped */}
              <TableCell colSpan={4} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(217, 119, 6, 0.08)' }}>Pengujian</TableCell>
              {/* Deployment - grouped */}
              <TableCell colSpan={3} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(124, 58, 237, 0.08)' }}>Deployment</TableCell>
              {/* Go Live - grouped */}
              <TableCell colSpan={1} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, fontSize: '0.8rem', bgcolor: 'rgba(5, 150, 105, 0.08)' }}>Go Live</TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 150 }}>Keterangan</TableCell>
              <TableCell rowSpan={2} align="center" sx={{ fontWeight: 600, color: '#1d1d1f', py: 1.5, px: 2, whiteSpace: 'nowrap', fontSize: '0.8rem', minWidth: 100 }}>Aksi</TableCell>
            </TableRow>
            {/* Second row - Sub-headers */}
            <TableRow sx={{ bgcolor: '#f5f5f7' }}>
              {/* Dokumen Pengajuan F.S.2 sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Nomor ND</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Tanggal</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Berkas ND</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(49, 162, 76, 0.04)' }}>Berkas F.S.2</TableCell>
              {/* CD Prinsip sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Nomor CD</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Tanggal</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Berkas CD</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Berkas F.S.2A</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.04)' }}>Berkas F.S.2B</TableCell>
              {/* Pengujian sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Realisasi</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Berkas F45</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.04)' }}>Berkas F46</TableCell>
              {/* Deployment sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.04)' }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.04)' }}>Realisasi</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.04)' }}>Berkas ND/BA</TableCell>
              {/* Go Live sub-headers */}
              <TableCell sx={{ fontWeight: 500, color: '#6B7280', py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 100, bgcolor: 'rgba(5, 150, 105, 0.04)' }}>Target</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={28} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : fs2Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={28} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Tidak ada data F.S.2 Disetujui</Typography>
                </TableCell>
              </TableRow>
            ) : (
              fs2Data.map((row, index) => {
                const skpaColor = getChipColor(row.skpa);
                const progresColor = PROGRES_COLORS[row.progres] || { bg: '#f5f5f5', text: '#666' };
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
                    {/* Progres */}
                    <TableCell sx={{ py: 1, px: 2, minWidth: 100, ...(stickyColumns.has('progres') && { position: 'sticky', left: getStickyLeft('progres'), zIndex: 1, bgcolor: '#fff' }), ...(isLastStickyColumn('progres') && { boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }) }}>
                      <Chip label={PROGRES_LABELS[row.progres] || row.progres} size="small" sx={{ bgcolor: progresColor.bg, color: progresColor.text, fontWeight: 500, fontSize: '0.7rem' }} />
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
                    {/* Dokumen Pengajuan F.S.2 - Nomor ND */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>{row.nomorNd}</TableCell>
                    {/* Dokumen Pengajuan F.S.2 - Tanggal */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>{row.tanggalNd}</TableCell>
                    {/* Dokumen Pengajuan F.S.2 - Berkas ND */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(49, 162, 76, 0.02)' }}>
                      {row.berkasNd ? (
                        <Button
                          size="small"
                          onClick={() => handleOpenPreview(row.berkasNd, 'Berkas ND')}
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
                          onClick={() => handleOpenPreview(row.berkasFs2, 'Berkas F.S.2')}
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
                    {/* CD Prinsip - Nomor CD */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>{row.nomorCd}</TableCell>
                    {/* CD Prinsip - Tanggal */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>{row.tanggalCd}</TableCell>
                    {/* CD Prinsip - Berkas CD */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>
                      {row.berkasCd ? (
                        <Button
                          size="small"
                          onClick={() => handleOpenPreview(row.berkasCd, 'Berkas CD')}
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
                          onClick={() => handleOpenPreview(row.berkasFs2a, 'Berkas F.S.2A')}
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
                    {/* CD Prinsip - Berkas F.S.2B */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(37, 99, 235, 0.02)' }}>
                      {row.berkasFs2b ? (
                        <Button
                          size="small"
                          onClick={() => handleOpenPreview(row.berkasFs2b, 'Berkas F.S.2B')}
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
                    {/* Pengujian - Target */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>{row.targetPengujian}</TableCell>
                    {/* Pengujian - Realisasi */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>{row.realisasiPengujian}</TableCell>
                    {/* Pengujian - Berkas F45 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>
                      {row.berkasF45 ? (
                        <Button
                          size="small"
                          onClick={() => handleOpenPreview(row.berkasF45, 'Berkas F45')}
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
                    {/* Pengujian - Berkas F46 */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 80, bgcolor: 'rgba(217, 119, 6, 0.02)' }}>
                      {row.berkasF46 ? (
                        <Button
                          size="small"
                          onClick={() => handleOpenPreview(row.berkasF46, 'Berkas F46')}
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
                    {/* Deployment - Target */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.02)' }}>{row.targetDeployment}</TableCell>
                    {/* Deployment - Realisasi */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.02)' }}>{row.realisasiDeployment}</TableCell>
                    {/* Deployment - Berkas ND/BA */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(124, 58, 237, 0.02)' }}>
                      {row.berkasNdBaDeployment ? (
                        <Button
                          size="small"
                          onClick={() => handleOpenPreview(row.berkasNdBaDeployment, 'Berkas ND/BA Deployment')}
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
                    {/* Go Live - Target */}
                    <TableCell sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 100, bgcolor: 'rgba(5, 150, 105, 0.02)' }}>{row.targetGoLive}</TableCell>
                    {/* Keterangan */}
                    <TableCell align="center" sx={{ py: 1, px: 2, fontSize: '0.8rem', minWidth: 150 }}>
                      <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }} title={row.keterangan}>
                        {row.keterangan}
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
              </Box>
            </Box>
          )}

          {/* Info Umum Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(49, 162, 76, 0.04)', border: '1px solid rgba(49, 162, 76, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#31A24C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#31A24C' }} />
              Informasi Umum
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#31A24C' } }}>Progres</InputLabel>
              <Select
                value={editFormData.progres || ''}
                label="Progres"
                onChange={(e) => setEditFormData({ ...editFormData, progres: e.target.value })}
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
                {PROGRES_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{PROGRES_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

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

            <Autocomplete
              options={userList}
              getOptionLabel={(option) => option.full_name}
              value={userList.find(u => u.uuid === editFormData.pic_id) || null}
              onChange={(_, newValue) => setEditFormData({ ...editFormData, pic_id: newValue?.uuid || '' })}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="PIC" 
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)', transition: 'all 0.3s ease' },
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)', '& fieldset': { borderColor: 'rgba(49, 162, 76, 0.3)' } },
                      '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 1)', boxShadow: '0 4px 20px rgba(49, 162, 76, 0.12)', '& fieldset': { borderColor: '#31A24C', borderWidth: '1.5px' } },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#31A24C' },
                  }}
                />
              )}
            />
          </Box>
          </Box>

          {/* Dokumen Pengajuan F.S.2 Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(49, 162, 76, 0.04)', border: '1px solid rgba(49, 162, 76, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#31A24C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#31A24C' }} />
              Dokumen Pengajuan F.S.2
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Nomor ND"
              size="small"
              value={editFormData.nomor_nd || ''}
              onChange={(e) => setEditFormData({ ...editFormData, nomor_nd: e.target.value })}
              fullWidth
            />
            <TextField
              label="Tanggal ND"
              type="date"
              size="small"
              value={editFormData.tanggal_nd || ''}
              onChange={(e) => setEditFormData({ ...editFormData, tanggal_nd: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Berkas ND (URL)"
              size="small"
              value={editFormData.berkas_nd || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_nd: e.target.value })}
              fullWidth
            />
            <TextField
              label="Berkas F.S.2 (URL)"
              size="small"
              value={editFormData.berkas_fs2 || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_fs2: e.target.value })}
              fullWidth
            />
          </Box>
          </Box>

          {/* CD Prinsip Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />
              CD Prinsip
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Nomor CD"
              size="small"
              value={editFormData.nomor_cd || ''}
              onChange={(e) => setEditFormData({ ...editFormData, nomor_cd: e.target.value })}
              fullWidth
            />
            <TextField
              label="Tanggal CD"
              type="date"
              size="small"
              value={editFormData.tanggal_cd || ''}
              onChange={(e) => setEditFormData({ ...editFormData, tanggal_cd: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Berkas CD (URL)"
              size="small"
              value={editFormData.berkas_cd || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_cd: e.target.value })}
              fullWidth
            />
            <TextField
              label="Berkas F.S.2A (URL)"
              size="small"
              value={editFormData.berkas_fs2a || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_fs2a: e.target.value })}
              fullWidth
            />
            <TextField
              label="Berkas F.S.2B (URL)"
              size="small"
              value={editFormData.berkas_fs2b || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_fs2b: e.target.value })}
              fullWidth
            />
          </Box>
          </Box>

          {/* Pengujian Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(217, 119, 6, 0.04)', border: '1px solid rgba(217, 119, 6, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D97706' }} />
              Pengujian
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Target Pengujian"
              type="date"
              size="small"
              value={editFormData.target_pengujian || ''}
              onChange={(e) => setEditFormData({ ...editFormData, target_pengujian: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Realisasi Pengujian"
              type="date"
              size="small"
              value={editFormData.realisasi_pengujian || ''}
              onChange={(e) => setEditFormData({ ...editFormData, realisasi_pengujian: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Berkas F45 (URL)"
              size="small"
              value={editFormData.berkas_f45 || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_f45: e.target.value })}
              fullWidth
            />
            <TextField
              label="Berkas F46 (URL)"
              size="small"
              value={editFormData.berkas_f46 || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_f46: e.target.value })}
              fullWidth
            />
          </Box>
          </Box>

          {/* Deployment Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(124, 58, 237, 0.04)', border: '1px solid rgba(124, 58, 237, 0.12)', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />
              Deployment
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Target Deployment"
              type="date"
              size="small"
              value={editFormData.target_deployment || ''}
              onChange={(e) => setEditFormData({ ...editFormData, target_deployment: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Realisasi Deployment"
              type="date"
              size="small"
              value={editFormData.realisasi_deployment || ''}
              onChange={(e) => setEditFormData({ ...editFormData, realisasi_deployment: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Berkas ND/BA Deployment (URL)"
              size="small"
              value={editFormData.berkas_nd_ba_deployment || ''}
              onChange={(e) => setEditFormData({ ...editFormData, berkas_nd_ba_deployment: e.target.value })}
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
          </Box>
          </Box>

          {/* Go Live & Keterangan Section */}
          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(5, 150, 105, 0.04)', border: '1px solid rgba(5, 150, 105, 0.12)', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#059669' }} />
              Go Live & Keterangan
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Target Go Live"
              type="date"
              size="small"
              value={editFormData.target_go_live || ''}
              onChange={(e) => setEditFormData({ ...editFormData, target_go_live: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Keterangan"
              size="small"
              multiline
              rows={2}
              value={editFormData.keterangan || ''}
              onChange={(e) => setEditFormData({ ...editFormData, keterangan: e.target.value })}
              fullWidth
            />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'transparent' }}>
          <Button onClick={handleCloseEditModal} sx={{ borderRadius: '12px', px: 3 }}>Batal</Button>
          <Button variant="contained" onClick={handleEditSubmit} sx={{ borderRadius: '12px', px: 3, bgcolor: '#0066cc', '&:hover': { bgcolor: '#0052a3' } }}>Simpan</Button>
        </DialogActions>
      </Dialog>

      {/* File Preview Modal for external berkas URLs */}
      <FilePreviewModal
        open={previewOpen}
        onClose={handleClosePreview}
        fileId={null}
        fileName={previewFileName}
        contentType={getContentTypeFromUrl(previewUrl)}
        directUrl={previewUrl}
      />
    </Box>
  );
}

export default Fs2Disetujui;
