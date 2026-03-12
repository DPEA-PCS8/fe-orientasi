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
  CheckCircleRounded,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { searchPksiDocuments, updatePksiApproval, type PksiDocumentData } from '../api/pksiApi';
import { uploadPksiFiles, getPksiFiles, deletePksiFile, type PksiFileData } from '../api/fileApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { getUsersByRole, type UserSimple } from '../api/userApi';
import { ViewPksiModal } from '../components/modals';

// Interface untuk data PKSI (transformed from API)
interface PksiData {
  id: string;
  namaPksi: string;
  namaAplikasi: string;
  picSatkerBA: string;
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

type Order = 'asc' | 'desc';
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
  return {
    id: apiData.id,
    namaPksi: apiData.nama_pksi,
    namaAplikasi: apiData.nama_aplikasi || '-',
    picSatkerBA: apiData.pic_satker_ba || '-',
    bidang: '', // Will be resolved from SKPA lookup
    pic: apiData.pic_approval_name || apiData.pic_approval || apiData.pengelola_aplikasi || '-',
    picUuid: apiData.pic_approval || '',
    anggotaTim: apiData.anggota_tim_names || apiData.anggota_tim || apiData.pengguna_aplikasi || '-',
    anggotaTimUuids: apiData.anggota_tim || '',
    iku: apiData.iku || '-',
    inhouseOutsource: apiData.inhouse_outsource || '-',
    jangkaWaktu: calculateJangkaWaktu(apiData),
    tanggalPengajuan: apiData.tanggal_pengajuan || apiData.created_at || '',
    linkDocsT01: '', // Not available in API response
    progress: apiData.progress || 'Penyusunan Usreq',
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
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof PksiData>('namaPksi');
  const [order, setOrder] = useState<Order>('asc');
  const [pksiData, setPksiData] = useState<PksiData[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // SKPA lookup data
  const [skpaMap, setSkpaMap] = useState<Map<string, string>>(new Map());
  const [skpaFullMap, setSkpaFullMap] = useState<Map<string, SkpaData>>(new Map());

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJangkaWaktu, setSelectedJangkaWaktu] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedAplikasi, setSelectedAplikasi] = useState<string>('');
  const [selectedSkpa, setSelectedSkpa] = useState<Set<string>>(new Set());

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPksiForUpload, setSelectedPksiForUpload] = useState<PksiData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<PksiFileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

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
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

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

  // Map sortBy from UI field to API field
  const mapSortField = (field: keyof PksiData): string => {
    const fieldMap: Record<string, string> = {
      namaPksi: 'namaPksi',
      tanggalPengajuan: 'tanggalPengajuan',
      status: 'status',
    };
    return fieldMap[field] || 'namaPksi';
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
        sortBy: mapSortField(orderBy),
        sortDir: order,
      });

      const transformedData = response.content.map(transformApiData);
      setPksiData(transformedData);
      setTotalElements(response.total_elements);
    } catch (error) {
      console.error('Failed to fetch PKSI data:', error);
      setPksiData([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, rowsPerPage, orderBy, order]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchPksiData();
  }, [fetchPksiData]);

  // Fetch SKPA lookup data
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const skpaResponse = await getAllSkpa();
        
        const skpaLookup = new Map<string, string>();
        const skpaFullLookup = new Map<string, SkpaData>();
        (skpaResponse.data || []).forEach((skpa) => {
          skpaLookup.set(skpa.id, skpa.kode_skpa);
          skpaFullLookup.set(skpa.id, skpa);
        });
        setSkpaMap(skpaLookup);
        setSkpaFullMap(skpaFullLookup);
      } catch (error) {
        console.error('Failed to fetch lookup data:', error);
      }
    };
    fetchLookupData();
  }, []);

  // Helper function to resolve SKPA GUIDs to codes array for Chip display
  const resolveSkpaCodes = useCallback((picSatkerBA: string): string[] => {
    if (!picSatkerBA || picSatkerBA === '-') return [];
    
    const guids = picSatkerBA.split(',').map(g => g.trim());
    return guids.map(guid => skpaMap.get(guid) || '').filter(Boolean);
  }, [skpaMap]);

  // Helper function to resolve Bidang abbreviations from SKPA GUIDs
  const resolveBidangNames = useCallback((picSatkerBA: string): string[] => {
    if (!picSatkerBA || picSatkerBA === '-') return [];
    
    const guids = picSatkerBA.split(',').map(g => g.trim());
    const bidangNames = new Set<string>();
    guids.forEach(guid => {
      const skpa = skpaFullMap.get(guid);
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

  const handleResetFilter = () => {
    setSelectedJangkaWaktu(new Set());
    setSelectedYear('');
    setSelectedAplikasi('');
    setSelectedSkpa(new Set());
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

  // Generate SKPA options from skpaMap
  const skpaOptions = useMemo(() => {
    return Array.from(skpaMap.values()).sort();
  }, [skpaMap]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedJangkaWaktu.size > 0) count++;
    if (selectedYear) count++;
    if (selectedAplikasi) count++;
    if (selectedSkpa.size > 0) count++;
    return count;
  }, [selectedJangkaWaktu, selectedYear, selectedAplikasi, selectedSkpa]);

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
    
    return result;
  }, [pksiData, selectedJangkaWaktu, selectedYear, selectedAplikasi, selectedSkpa, resolveSkpaCodes]);

  const paginatedPksi = filteredPksi;

  const handleSort = (property: keyof PksiData) => {
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

  // Upload modal handlers
  const handleUploadClick = async (pksi: PksiData) => {
    setSelectedPksiForUpload(pksi);
    setUploadModalOpen(true);
    setUploadedFiles([]);
    
    // Fetch existing files for this PKSI
    setIsLoadingFiles(true);
    try {
      const files = await getPksiFiles(pksi.id);
      setExistingFiles(files);
    } catch (error) {
      console.error('Failed to fetch existing files:', error);
      setExistingFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleUploadModalClose = () => {
    setUploadModalOpen(false);
    setSelectedPksiForUpload(null);
    setUploadedFiles([]);
    setExistingFiles([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = async (fileId: string) => {
    try {
      await deletePksiFile(fileId);
      setExistingFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedPksiForUpload || uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      const uploadedResult = await uploadPksiFiles(selectedPksiForUpload.id, uploadedFiles);
      setExistingFiles(prev => [...prev, ...uploadedResult]);
      setUploadedFiles([]);
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ 
      p: 3.5,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <CheckCircleRounded sx={{ color: '#31A24C', fontSize: 32 }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            PKSI Disetujui
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#86868b', ml: 0.5 }}>
          Daftar PKSI yang telah disetujui ({totalElements} item)
        </Typography>
      </Box>

      {/* Main Card */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
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
          </Box>

          {/* Status Badge */}
          <Chip
            icon={<CheckCircleRounded sx={{ fontSize: 16 }} />}
            label="Disetujui"
            sx={{
              bgcolor: '#31A24C20',
              color: '#31A24C',
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: '#31A24C',
              },
            }}
          />
        </Box>

        {/* Filter Popover */}
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
              mt: 1,
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(49, 162, 76, 0.1)',
              overflow: 'hidden',
              border: '1px solid #e8f5e9',
            },
          }}
        >
          {/* Header */}
          <Box sx={{
            background: '#31A24C',
            p: 2.5,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TuneRounded sx={{ fontSize: 16, color: '#31A24C' }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                Filter
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleFilterClose}
              sx={{ 
                color: 'white', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          
          <Box sx={{ p: 3, minWidth: 320, maxHeight: 400, overflowY: 'auto', bgcolor: 'white' }}>

            {/* Nama Aplikasi Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
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
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e5e7',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
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

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* SKPA Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
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
                        sx={{ mr: 1, '&.Mui-checked': { color: '#31A24C' } }}
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
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#e5e5e7' },
                        '&:hover fieldset': { borderColor: '#31A24C' },
                        '&.Mui-focused fieldset': { borderColor: '#31A24C' },
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
                        sx={{ bgcolor: '#31A24C', color: 'white', '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } } }}
                      />
                    );
                  })
                }
              />
            </Box>

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* Year Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                Periode Tahun
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel id="year-filter-label-disetujui">Pilih Tahun</InputLabel>
                <Select
                  labelId="year-filter-label-disetujui"
                  value={selectedYear}
                  label="Pilih Tahun"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e5e5e7',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#31A24C',
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

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* Jangka Waktu Filter */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                Jangka Waktu
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedJangkaWaktu.has('Single Year')}
                      onChange={() => handleJangkaWaktuChange('Single Year')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#31A24C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Single Year</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedJangkaWaktu.has('Multiyears')}
                      onChange={() => handleJangkaWaktuChange('Multiyears')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#31A24C',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Multiyears</Typography>}
                />
              </FormGroup>
            </Box>

            <Box sx={{ borderTop: '2px solid #f5f5f5', my: 2.5 }} />

            {/* Reset Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilter}
              sx={{
                py: 1,
                borderRadius: '8px',
                color: '#31A24C',
                borderColor: '#31A24C',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#e8f5e9',
                  borderColor: '#31A24C',
                },
              }}
            >
              Reset Filter
            </Button>
          </Box>
        </Popover>

        {/* Table */}
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    width: 50,
                    minWidth: 50,
                    textAlign: 'center',
                  }}
                >
                  No
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'namaAplikasi' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'namaAplikasi'}
                    direction={orderBy === 'namaAplikasi' ? order : 'asc'}
                    onClick={() => handleSort('namaAplikasi')}
                  >
                    Nama Aplikasi
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'namaPksi' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 200,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'namaPksi'}
                    direction={orderBy === 'namaPksi' ? order : 'asc'}
                    onClick={() => handleSort('namaPksi')}
                  >
                    Nama PKSI
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'picSatkerBA' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'picSatkerBA'}
                    direction={orderBy === 'picSatkerBA' ? order : 'asc'}
                    onClick={() => handleSort('picSatkerBA')}
                  >
                    SKPA
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'bidang' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'bidang'}
                    direction={orderBy === 'bidang' ? order : 'asc'}
                    onClick={() => handleSort('bidang')}
                  >
                    Bidang
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'pic' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'pic'}
                    direction={orderBy === 'pic' ? order : 'asc'}
                    onClick={() => handleSort('pic')}
                  >
                    PIC
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'anggotaTim' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 180,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'anggotaTim'}
                    direction={orderBy === 'anggotaTim' ? order : 'asc'}
                    onClick={() => handleSort('anggotaTim')}
                  >
                    Anggota Tim
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'iku' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'iku'}
                    direction={orderBy === 'iku' ? order : 'asc'}
                    onClick={() => handleSort('iku')}
                  >
                    IKU
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'inhouseOutsource' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 140,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'inhouseOutsource'}
                    direction={orderBy === 'inhouseOutsource' ? order : 'asc'}
                    onClick={() => handleSort('inhouseOutsource')}
                  >
                    Inhouse/Outsource
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'jangkaWaktu' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 120,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'jangkaWaktu'}
                    direction={orderBy === 'jangkaWaktu' ? order : 'asc'}
                    onClick={() => handleSort('jangkaWaktu')}
                  >
                    Jangka Waktu
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'tanggalPengajuan' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'tanggalPengajuan'}
                    direction={orderBy === 'tanggalPengajuan' ? order : 'asc'}
                    onClick={() => handleSort('tanggalPengajuan')}
                  >
                    Tanggal Pengajuan
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sortDirection={orderBy === 'progress' ? order : false}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 160,
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'progress'}
                    direction={orderBy === 'progress' ? order : 'asc'}
                    onClick={() => handleSort('progress')}
                  >
                    Progres
                  </TableSortLabel>
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1d1d1f', 
                    py: 2,
                    minWidth: 100,
                  }}
                >
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={13} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#31A24C' }} />
                    <Typography variant="body2" sx={{ mt: 2, color: '#86868b' }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      Tidak ada data PKSI disetujui ditemukan
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedPksi.map((item, index) => (
                <TableRow 
                  key={item.id}
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(49, 162, 76, 0.02)',
                    },
                    '&:not(:last-child)': {
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                    },
                  }}
                >
                  <TableCell 
                    sx={{ 
                      color: '#86868b', 
                      py: 2,
                      textAlign: 'center',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                    }}
                  >
                    {page * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                      }}
                    >
                      {item.namaAplikasi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: '#1d1d1f',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.namaPksi}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                                fontSize: '0.7rem',
                                height: 24,
                                borderRadius: '6px',
                              }}
                            />
                          );
                        })
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  {/* Bidang Column */}
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {resolveBidangNames(item.picSatkerBA).length > 0 ? (
                        resolveBidangNames(item.picSatkerBA).map((bidang, idx) => (
                          <Chip
                            key={idx}
                            label={bidang}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(107, 114, 128, 0.1)',
                              color: '#4B5563',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              height: 24,
                              borderRadius: '6px',
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: '#86868b', fontSize: '0.85rem' }}>-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  {/* PIC Column */}
                  <TableCell sx={{ py: 2, whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                      }}
                    >
                      {item.pic}
                    </Typography>
                  </TableCell>
                  {/* Anggota Tim Column */}
                  <TableCell sx={{ py: 2, whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: 200 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.anggotaTim}
                    </Typography>
                  </TableCell>
                  {/* IKU Column */}
                  <TableCell sx={{ py: 2, whiteSpace: 'normal', wordWrap: 'break-word', maxWidth: 180 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.iku}
                    </Typography>
                  </TableCell>
                  {/* Inhouse/Outsource Column */}
                  <TableCell sx={{ py: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                      }}
                    >
                      {item.inhouseOutsource}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={item.jangkaWaktu === 'Single Year' ? 'Single Year' : 'Multiyears'}
                      size="small"
                      sx={{
                        bgcolor: item.jangkaWaktu === 'Single Year' 
                          ? 'rgba(139, 92, 246, 0.1)' 
                          : 'rgba(37, 99, 235, 0.1)',
                        color: item.jangkaWaktu === 'Single Year' ? '#8B5CF6' : '#2563EB',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 26,
                        borderRadius: '6px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#1d1d1f',
                        fontSize: '0.85rem',
                      }}
                    >
                      {new Date(item.tanggalPengajuan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      label={item.progress}
                      size="small"
                      sx={{
                        bgcolor: (() => {
                          const progressIndex = PROGRESS_OPTIONS.indexOf(item.progress as typeof PROGRESS_OPTIONS[number]);
                          if (progressIndex === -1) return 'rgba(107, 114, 128, 0.1)';
                          if (progressIndex === PROGRESS_OPTIONS.length - 1) return 'rgba(49, 162, 76, 0.15)'; // Selesai
                          if (progressIndex >= 6) return 'rgba(37, 99, 235, 0.12)'; // UAT, Deployment
                          if (progressIndex >= 3) return 'rgba(139, 92, 246, 0.12)'; // Coding, Unit Test, SIT
                          return 'rgba(217, 119, 6, 0.12)'; // Penyusunan Usreq, Pengadaan, Desain
                        })(),
                        color: (() => {
                          const progressIndex = PROGRESS_OPTIONS.indexOf(item.progress as typeof PROGRESS_OPTIONS[number]);
                          if (progressIndex === -1) return '#4B5563';
                          if (progressIndex === PROGRESS_OPTIONS.length - 1) return '#31A24C'; // Selesai
                          if (progressIndex >= 6) return '#2563EB'; // UAT, Deployment
                          if (progressIndex >= 3) return '#8B5CF6'; // Coding, Unit Test, SIT
                          return '#D97706'; // Penyusunan Usreq, Pengadaan, Desain
                        })(),
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 26,
                        borderRadius: '8px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Lihat Detail PKSI">
                        <IconButton
                          size="small"
                          onClick={() => handleViewClick(item.id)}
                          sx={{
                            color: '#059669',
                            bgcolor: 'rgba(5, 150, 105, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(5, 150, 105, 0.15)',
                            },
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit PKSI">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(item)}
                          sx={{
                            color: '#D97706',
                            bgcolor: 'rgba(217, 119, 6, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(217, 119, 6, 0.15)',
                            },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Upload Dokumen T.1.1">
                        <IconButton
                          size="small"
                          onClick={() => handleUploadClick(item)}
                          sx={{
                            color: '#2563EB',
                            bgcolor: 'rgba(37, 99, 235, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(37, 99, 235, 0.15)',
                            },
                          }}
                        >
                          <CloudUploadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
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
      />

      {/* Edit Approval Dialog - Apple Liquid Glass Style */}
      <Dialog
        open={openEditDialog}
        onClose={handleEditCancel}
        maxWidth="sm"
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
              Edit PKSI Disetujui
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
                    {resolveBidangNames(selectedPksiForEdit.picSatkerBA).length > 0 ? (
                      resolveBidangNames(selectedPksiForEdit.picSatkerBA).map((bidang, idx) => (
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

      {/* Upload Modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={handleUploadModalClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: '#1d1d1f',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          bgcolor: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2,
          px: 3,
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: 'rgba(37, 99, 235, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CloudUploadIcon sx={{ color: '#2563EB', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: '#1d1d1f' }}>
              Upload Dokumen T.1.1
            </Typography>
            {selectedPksiForUpload && (
              <Typography variant="caption" sx={{ color: '#86868b', display: 'block', mt: 0.25 }}>
                {selectedPksiForUpload.namaPksi}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* Upload Area */}
          <Box
            sx={{
              border: '2px dashed rgba(37, 99, 235, 0.25)',
              borderRadius: '12px',
              p: 3,
              textAlign: 'center',
              bgcolor: 'rgba(37, 99, 235, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#2563EB',
                bgcolor: 'rgba(37, 99, 235, 0.06)',
                transform: 'translateY(-1px)',
              },
            }}
            component="label"
          >
            <input
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
            <Box sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'rgba(37, 99, 235, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}>
              <CloudUploadIcon sx={{ fontSize: 28, color: '#2563EB' }} />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 0.5 }}>
              Klik untuk memilih file
            </Typography>
            <Typography variant="caption" sx={{ color: '#86868b' }}>
              Format: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
            </Typography>
          </Box>

          {/* Existing Files */}
          {isLoadingFiles ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={24} sx={{ color: '#31A24C' }} />
            </Box>
          ) : existingFiles.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <CheckCircleRounded sx={{ color: '#31A24C', fontSize: 18 }} />
                File Terupload ({existingFiles.length})
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1,
                maxHeight: 150,
                overflowY: 'auto',
                pr: 0.5,
              }}>
                {existingFiles.map((file) => (
                  <Box
                    key={file.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      bgcolor: 'rgba(49, 162, 76, 0.06)',
                      borderRadius: '10px',
                      border: '1px solid rgba(49, 162, 76, 0.15)',
                    }}
                  >
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: 'rgba(49, 162, 76, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileIcon sx={{ color: '#31A24C', fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: '#1d1d1f',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem',
                        }}
                      >
                        {file.original_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b', fontSize: '0.75rem' }}>
                        {formatFileSize(file.file_size)}
                      </Typography>
                    </Box>
                    <Tooltip title="Hapus file">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteExistingFile(file.id)}
                        sx={{ 
                          color: '#DC2626',
                          bgcolor: 'rgba(220, 38, 38, 0.08)',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'rgba(220, 38, 38, 0.15)',
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

          {/* Selected Files (new uploads) */}
          {uploadedFiles.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 600, 
                color: '#1d1d1f', 
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <FileIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                File Dipilih ({uploadedFiles.length})
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1,
                maxHeight: 150,
                overflowY: 'auto',
                pr: 0.5,
              }}>
                {uploadedFiles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      bgcolor: 'rgba(37, 99, 235, 0.04)',
                      borderRadius: '10px',
                      border: '1px solid rgba(37, 99, 235, 0.15)',
                    }}
                  >
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: 'rgba(37, 99, 235, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileIcon sx={{ color: '#2563EB', fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500, 
                          color: '#1d1d1f',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem',
                        }}
                      >
                        {file.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b', fontSize: '0.75rem' }}>
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    <Tooltip title="Hapus dari daftar">
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveFile(index)}
                        sx={{ 
                          color: '#DC2626',
                          bgcolor: 'rgba(220, 38, 38, 0.08)',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'rgba(220, 38, 38, 0.15)',
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid rgba(0,0,0,0.08)',
          bgcolor: '#fafafa',
          gap: 1.5,
        }}>
          <Button
            onClick={handleUploadModalClose}
            sx={{
              color: '#64748B',
              fontWeight: 500,
              px: 2.5,
              borderRadius: '8px',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            Tutup
          </Button>
          <Button
            onClick={handleUploadSubmit}
            disabled={uploadedFiles.length === 0 || isUploading}
            variant="contained"
            startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
            sx={{
              bgcolor: '#2563EB',
              fontWeight: 500,
              px: 2.5,
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#1D4ED8',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              },
              '&:disabled': {
                bgcolor: 'rgba(37, 99, 235, 0.4)',
                color: 'rgba(255, 255, 255, 0.8)',
              },
            }}
          >
            {isUploading ? 'Mengupload...' : 'Upload File'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PksiDisetujui;
