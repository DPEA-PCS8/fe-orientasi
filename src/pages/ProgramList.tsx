import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Typography,
  Paper,
  Button,
  IconButton,
  Collapse,
  Popover,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowRight as CollapseIcon,
  FolderRounded,
  AssignmentRounded,
  TuneRounded,
  Close as CloseIcon,
  FolderOpenRounded,
  ContentCopy as ContentCopyIcon,
  History as HistoryIcon,
  Description as KepIcon,
} from '@mui/icons-material';
import { AddProgramModal, AddInisiatifModal, AddPeriodeModal, CopyFromYearModal, HistoryComparisonModal } from '../components/modals';
import { getAllRbsi, createRbsi, getProgramsByRbsi, getKepList, createKep } from '../api/rbsiApi';
import type { RbsiResponse, RbsiProgramResponse, RbsiKepResponse } from '../api/rbsiApi';

// KEP data structure
interface KepData {
  id: string;
  nomorKep: string;
  tahunPelaporan: number;
}

function ProgramList() {
  const [programs, setPrograms] = useState<RbsiProgramResponse[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  // Modal states
  const [openAddProgramModal, setOpenAddProgramModal] = useState(false);
  const [openAddInisiatifModal, setOpenAddInisiatifModal] = useState(false);
  const [selectedProgramIdForInisiatif, setSelectedProgramIdForInisiatif] = useState<string>('');

  // Filter state
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());

  // RBSI (Periode) State
  const [rbsiList, setRbsiList] = useState<RbsiResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [rbsiLoading, setRbsiLoading] = useState(false);

  // KEP State
  const [kepList, setKepList] = useState<KepData[]>([]);
  const [selectedKep, setSelectedKep] = useState<KepData | null>(null);

  // Copy from year modal state
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);
  const [periodeAnchorEl, setPeriodeAnchorEl] = useState<null | HTMLElement>(null);
  const [openAddPeriodeModal, setOpenAddPeriodeModal] = useState(false);

  // KEP creation state
  const [kepCreating, setKepCreating] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch RBSI list on component mount
  useEffect(() => {
    fetchRbsiList();
  }, []);

  // Fetch programs and KEP when selectedRbsi changes
  useEffect(() => {
    if (selectedRbsi) {
      fetchKepListData(selectedRbsi.id);
    }
  }, [selectedRbsi]);

  // Fetch programs when selectedRbsi or selectedTahun changes
  useEffect(() => {
    if (selectedRbsi && selectedTahun) {
      fetchPrograms(selectedRbsi.id, selectedTahun);
    }
  }, [selectedRbsi, selectedTahun]);

  // Update selectedKep when selectedTahun or kepList changes
  useEffect(() => {
    if (selectedTahun && kepList.length > 0) {
      const kep = kepList.find(k => k.tahunPelaporan === selectedTahun);
      setSelectedKep(kep || null);
    }
  }, [selectedTahun, kepList]);

  // Set default tahun when selectedRbsi changes
  useEffect(() => {
    if (selectedRbsi) {
      const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
      const currentYear = new Date().getFullYear();
      
      // If current year is within periode range, use current year
      // Otherwise, use the last year of periode
      if (currentYear >= startYear && currentYear <= endYear) {
        setSelectedTahun(currentYear);
      } else {
        setSelectedTahun(endYear);
      }
    }
  }, [selectedRbsi]);

  const fetchRbsiList = async () => {
    setRbsiLoading(true);
    try {
      const response = await getAllRbsi();
      setRbsiList(response.data);
      if (response.data.length > 0 && !selectedRbsi) {
        setSelectedRbsi(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch RBSI list:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal mengambil data RBSI',
        severity: 'error',
      });
    } finally {
      setRbsiLoading(false);
    }
  };

  const fetchKepListData = async (rbsiId: string) => {
    try {
      const response = await getKepList(rbsiId);
      const apiKepList = response.data || [];

      // Map API response to local KepData format
      const mappedKepList: KepData[] = apiKepList.map((kep: RbsiKepResponse) => ({
        id: kep.id,
        nomorKep: kep.nomor_kep,
        tahunPelaporan: kep.tahun_pelaporan,
      }));

      setKepList(mappedKepList.sort((a, b) => a.tahunPelaporan - b.tahunPelaporan));
    } catch (error) {
      console.error('Failed to fetch KEP list:', error);
      setKepList([]);
    }
  };

  const fetchPrograms = async (rbsiId: string, tahun?: number) => {
    setProgramsLoading(true);
    try {
      const response = await getProgramsByRbsi(rbsiId, tahun);
      const fetchedPrograms = response.data || [];
      setPrograms(fetchedPrograms);
      setExpandedPrograms(new Set(fetchedPrograms.map(p => p.id)));
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal mengambil data program',
        severity: 'error',
      });
      setPrograms([]);
    } finally {
      setProgramsLoading(false);
    }
  };

  const handleCreateRbsi = async (periode: string) => {
    const response = await createRbsi(periode);
    setRbsiList(prev => [...prev, response.data]);
    setSelectedRbsi(response.data);
    setSnackbar({
      open: true,
      message: 'RBSI berhasil dibuat',
      severity: 'success',
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Create KEP for selected year
  const handleCreateKepForYear = async () => {
    if (!selectedRbsi || !selectedTahun) return;

    setKepCreating(true);
    try {
      const nomorKep = `KEP-${String(kepList.length + 1).padStart(3, '0')}/${selectedTahun}`;
      const response = await createKep(selectedRbsi.id, {
        nomor_kep: nomorKep,
        tahun_pelaporan: selectedTahun,
        copy_from_latest: kepList.length > 0, // Copy progress from latest if exists
      });

      const newKep: KepData = {
        id: response.data.id,
        nomorKep: response.data.nomor_kep,
        tahunPelaporan: response.data.tahun_pelaporan,
      };

      setKepList(prev => [...prev, newKep].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan));
      setSelectedKep(newKep);
      setSnackbar({
        open: true,
        message: `${nomorKep} berhasil dibuat`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to create KEP:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal membuat KEP',
        severity: 'error',
      });
    } finally {
      setKepCreating(false);
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (programId: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  // Filter handlers
  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleTahunChange = (tahun: number) => {
    setSelectedTahun(tahun);
    setFilterAnchorEl(null); // Close popover after selection
  };

  const tokenizeNomor = (value: string): Array<string | number> => {
    return value
      .split('.')
      .flatMap(part => part.match(/(\d+|[^\d]+)/g) || [])
      .map(token => (token.match(/^\d+$/) ? parseInt(token, 10) : token.toLowerCase()));
  };

  const compareNomor = (a: string, b: string): number => {
    const aTokens = tokenizeNomor(a);
    const bTokens = tokenizeNomor(b);
    const maxLength = Math.max(aTokens.length, bTokens.length);

    for (let i = 0; i < maxLength; i++) {
      const aToken = aTokens[i];
      const bToken = bTokens[i];

      if (aToken === undefined) return -1;
      if (bToken === undefined) return 1;

      if (typeof aToken === 'number' && typeof bToken === 'number') {
        if (aToken !== bToken) return aToken - bToken;
        continue;
      }

      if (typeof aToken === 'string' && typeof bToken === 'string') {
        if (aToken !== bToken) return aToken.localeCompare(bToken);
        continue;
      }

      if (typeof aToken === 'number') return -1;
      return 1;
    }

    return 0;
  };

  // Generate tahun options from RBSI periode
  const tahunOptions = React.useMemo(() => {
    if (!selectedRbsi) return [];
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  }, [selectedRbsi]);

  // Check if previous year exists for copy
  const previousTahun = React.useMemo(() => {
    if (!selectedRbsi || !selectedTahun) return null;
    const [startYear] = selectedRbsi.periode.split('-').map(Number);
    const prevYear = selectedTahun - 1;
    return prevYear >= startYear ? prevYear : null;
  }, [selectedRbsi, selectedTahun]);

  // Filter programs logic (keyword only, tahun is filtered by API)
  const filteredPrograms = programs.filter(program => {
    const inisiatifs = program.inisiatifs || [];
    const matchKeyword = 
      program.nama_program.toLowerCase().includes(keyword.toLowerCase()) ||
      program.nomor_program.toLowerCase().includes(keyword.toLowerCase()) ||
      inisiatifs.some(ini => ini.nama_inisiatif.toLowerCase().includes(keyword.toLowerCase()));

    return matchKeyword;
  }).sort((a, b) => compareNomor(a.nomor_program, b.nomor_program));

  const handleMappingClick = (inisiatifId: string) => {
    console.log('Mapping clicked for inisiatif:', inisiatifId);
    // TODO: Implement mapping functionality
  };

  const handleDetailClick = (inisiatifId: string) => {
    console.log('Detail clicked for inisiatif:', inisiatifId);
    // TODO: Implement detail view functionality
  };

  return (
    <Box sx={{ 
      p: 3.5,
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            Daftar Program & Inisiatif
          </Typography>
          <Typography variant="body1" sx={{ color: '#86868b' }}>
            Kelola data program dan inisiatif RBSI
          </Typography>
        </Box>

        {/* RBSI (Periode) Dropdown */}
        <Box>
          <Button
            endIcon={rbsiLoading ? <CircularProgress size={16} /> : (periodeAnchorEl ? <ArrowUpIcon /> : <ArrowDownIcon />)}
            onClick={(e) => setPeriodeAnchorEl(e.currentTarget)}
            disabled={rbsiLoading}
            sx={{
              bgcolor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              py: 1,
              px: 2,
              color: '#1d1d1f',
              fontWeight: 600,
              fontSize: '0.95rem',
              minWidth: '180px',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              '&:hover': {
                bgcolor: '#fafafa',
                borderColor: '#DA251C',
              },
              '&:disabled': {
                bgcolor: '#f5f5f5',
              },
            }}
          >
            {selectedRbsi ? `Periode ${selectedRbsi.periode}` : 'Pilih Periode'}
          </Button>
          <Menu
            anchorEl={periodeAnchorEl}
            open={Boolean(periodeAnchorEl)}
            onClose={() => setPeriodeAnchorEl(null)}
            PaperProps={{
              sx: { 
                mt: 1, 
                borderRadius: '12px', 
                minWidth: '200px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            {rbsiList.length === 0 && !rbsiLoading && (
              <MenuItem disabled>
                <Typography variant="body2" sx={{ color: '#86868b' }}>
                  Tidak ada data RBSI
                </Typography>
              </MenuItem>
            )}
            {rbsiList.map(rbsi => (
              <MenuItem 
                key={rbsi.id} 
                selected={selectedRbsi?.id === rbsi.id}
                onClick={() => { 
                  setSelectedRbsi(rbsi); 
                  setPeriodeAnchorEl(null); 
                }}
              >
                {rbsi.periode}
              </MenuItem>
            ))}
            <Box sx={{ borderTop: '1px solid #e5e5e7', mt: 1, pt: 1 }}>
              <MenuItem 
                onClick={() => { 
                  setPeriodeAnchorEl(null); 
                  setOpenAddPeriodeModal(true); 
                }}
                sx={{ 
                  color: '#DA251C', 
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(218, 37, 28, 0.05)',
                  }
                }}
              >
                <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                Tambah Periode
              </MenuItem>
            </Box>
          </Menu>
        </Box>
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
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              placeholder="Cari program atau inisiatif..."
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{ 
                width: 320,
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
                    borderColor: '#DA251C',
                    borderWidth: 2,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#86868b', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="text"
              startIcon={<TuneRounded sx={{ fontSize: 18 }} />}
              onClick={handleFilterOpen}
              sx={{
                color: selectedTahun !== null ? '#DA251C' : '#86868b',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {selectedTahun !== null ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Tahun {selectedTahun}</span>
                  {selectedKep && (
                    <Chip
                      icon={<KepIcon sx={{ fontSize: 12 }} />}
                      label={selectedKep.nomorKep}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: '#E3F2FD',
                        color: '#1565C0',
                        '& .MuiChip-icon': { color: '#1565C0' },
                      }}
                    />
                  )}
                </Box>
              ) : 'Filters'}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setOpenHistoryModal(true)}
              sx={{
                borderColor: '#86868b',
                color: '#86868b',
                fontWeight: 500,
                px: 2.5,
                '&:hover': {
                  borderColor: '#1d1d1f',
                  color: '#1d1d1f',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Riwayat
            </Button>
            {previousTahun && (
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => setOpenCopyModal(true)}
                sx={{
                  borderColor: '#DA251C',
                  color: '#DA251C',
                  fontWeight: 500,
                  px: 2.5,
                  '&:hover': {
                    borderColor: '#B91C14',
                    bgcolor: 'rgba(218, 37, 28, 0.04)',
                  },
                }}
              >
                Salin dari {previousTahun}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddProgramModal(true)}
              sx={{
                background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                fontWeight: 500,
                px: 2.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
                },
              }}
            >
              Tambah Program
            </Button>
          </Box>
        </Box>

        {/* KEP Info Banner */}
        {selectedKep && (
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: '#E3F2FD',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <KepIcon sx={{ color: '#1565C0', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#1565C0', fontWeight: 500 }}>
              Data Program & Inisiatif untuk <strong>{selectedKep.nomorKep}</strong> (Tahun Pelaporan {selectedKep.tahunPelaporan})
            </Typography>
          </Box>
        )}
        {!selectedKep && selectedTahun && (
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: '#FFF3E0',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <KepIcon sx={{ color: '#E65100', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#E65100', fontWeight: 500 }}>
                Tahun {selectedTahun} belum memiliki KEP. Program & Inisiatif yang dibuat akan ditampilkan di sini.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={kepCreating ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
              onClick={handleCreateKepForYear}
              disabled={kepCreating}
              sx={{
                bgcolor: '#E65100',
                fontWeight: 600,
                fontSize: '0.75rem',
                px: 2,
                py: 0.75,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#BF360C' },
              }}
            >
              {kepCreating ? 'Membuat...' : 'Tambah KEP'}
            </Button>
          </Box>
        )}

        {/* Table */}
        <TableContainer>
          <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 2 }}>Program</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programsLoading ? (
              <TableRow>
                <TableCell colSpan={1} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                  <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                    Memuat data program...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={1} sx={{ textAlign: 'center', py: 4 }}>
                  <FolderOpenRounded sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {keyword || selectedTahun !== null ? 'Tidak ada program yang sesuai filter' : 'Belum ada program'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
            filteredPrograms.map((program) => (
              <React.Fragment key={program.id}>
                {/* Program Row */}
                <TableRow
                  sx={{
                    borderLeft: '4px solid #DA251C',
                    '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' },
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleExpand(program.id)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton size="small">
                        {expandedPrograms.has(program.id) ? <ExpandIcon /> : <CollapseIcon />}
                      </IconButton>
                      <FolderRounded sx={{ color: '#DA251C', fontSize: 20 }} />
                      <Typography fontWeight={600} sx={{ color: '#2C3E50', fontSize: '0.95rem' }}>
                        {program.nomor_program} - {program.nama_program}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Inisiatif Rows */}
                <TableRow key={`${program.id}-inisiatif`}>
                  <TableCell colSpan={1} sx={{ p: 0, border: 'none' }}>
                    <Collapse in={expandedPrograms.has(program.id)} timeout="auto">
                      <Box sx={{ bgcolor: '#fafafa', p: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Nomor
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Nama Inisiatif
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Tahun
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#666' }}>
                                Aksi
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(program.inisiatifs?.length ?? 0) === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: '#999' }}>
                                  <FolderOpenRounded sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                                  <Typography variant="body2">Belum ada inisiatif</Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              [...(program.inisiatifs ?? [])]
                                .sort((a, b) => compareNomor(a.nomor_inisiatif, b.nomor_inisiatif))
                                .map((inisiatif) => (
                                <TableRow
                                  key={inisiatif.id}
                                  sx={{
                                    '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' },
                                  }}
                                >
                                  <TableCell>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                      {inisiatif.nomor_inisiatif}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <AssignmentRounded sx={{ color: '#666', fontSize: 18 }} />
                                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                        {inisiatif.nama_inisiatif}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: '0.85rem' }}>
                                      {inisiatif.tahun}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMappingClick(inisiatif.id);
                                        }}
                                        sx={{
                                          fontSize: '0.75rem',
                                          px: 2,
                                          py: 0.5,
                                          borderColor: '#2196F3',
                                          color: '#2196F3',
                                          '&:hover': {
                                            borderColor: '#1976D2',
                                            bgcolor: '#E3F2FD',
                                          },
                                        }}
                                      >
                                        Mapping
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDetailClick(inisiatif.id);
                                        }}
                                        sx={{
                                          fontSize: '0.75rem',
                                          px: 2,
                                          py: 0.5,
                                          borderColor: '#4CAF50',
                                          color: '#4CAF50',
                                          '&:hover': {
                                            borderColor: '#388E3C',
                                            bgcolor: '#E8F5E8',
                                          },
                                        }}
                                      >
                                        Detail
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                            {/* Tambah Inisiatif Row */}
                            <TableRow>
                              <TableCell colSpan={4} sx={{ py: 1.5 }}>
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProgramIdForInisiatif(program.id);
                                    setOpenAddInisiatifModal(true);
                                  }}
                                  sx={{
                                    color: '#DA251C',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    '&:hover': {
                                      bgcolor: 'rgba(218, 37, 28, 0.08)',
                                    },
                                  }}
                                >
                                  Tambah Inisiatif
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Paper>

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
            boxShadow: '0 20px 40px rgba(218, 37, 28, 0.1)',
            overflow: 'hidden',
            border: '1px solid #ffebeb',
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          background: '#DA251C',
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
              <TuneRounded sx={{ fontSize: 16, color: '#DA251C' }} />
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

        <Box sx={{ p: 3, minWidth: 360, bgcolor: 'white' }}>

          {/* Tahun & KEP Filter */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
              Tahun & KEP
            </Typography>
            <Stack spacing={1}>
              {tahunOptions.map((tahun) => {
                const kep = kepList.find(k => k.tahunPelaporan === tahun);
                return (
                  <Button
                    key={tahun}
                    fullWidth
                    variant={selectedTahun === tahun ? 'contained' : 'outlined'}
                    onClick={() => handleTahunChange(tahun)}
                    sx={{
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.5,
                      ...(selectedTahun === tahun ? {
                        bgcolor: '#DA251C',
                        color: 'white',
                        '&:hover': { bgcolor: '#B91C14' },
                      } : {
                        borderColor: '#e5e5e7',
                        color: '#1d1d1f',
                        '&:hover': { borderColor: '#DA251C', bgcolor: '#fff5f5' },
                      }),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{tahun}</Typography>
                    </Box>
                    {kep ? (
                      <Chip
                        icon={<KepIcon sx={{ fontSize: 14 }} />}
                        label={kep.nomorKep}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          bgcolor: selectedTahun === tahun ? 'rgba(255,255,255,0.2)' : '#E3F2FD',
                          color: selectedTahun === tahun ? 'white' : '#1565C0',
                          '& .MuiChip-icon': {
                            color: selectedTahun === tahun ? 'white' : '#1565C0',
                          },
                        }}
                      />
                    ) : (
                      <Chip
                        label="Belum ada KEP"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.65rem',
                          bgcolor: selectedTahun === tahun ? 'rgba(255,255,255,0.2)' : '#FFF3E0',
                          color: selectedTahun === tahun ? 'white' : '#E65100',
                        }}
                      />
                    )}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        </Box>
      </Popover>

      {/* Add Program Modal */}
      <AddProgramModal
        open={openAddProgramModal}
        onClose={() => setOpenAddProgramModal(false)}
        onSuccess={() => {
          if (selectedRbsi) {
            fetchPrograms(selectedRbsi.id, selectedTahun);
          }
        }}
        rbsiId={selectedRbsi?.id || ''}
        tahun={selectedTahun}
      />

      {/* Add Inisiatif Modal */}
      <AddInisiatifModal
        open={openAddInisiatifModal}
        onClose={() => {
          setOpenAddInisiatifModal(false);
          setSelectedProgramIdForInisiatif('');
        }}
        onSuccess={() => {
          if (selectedRbsi) {
            fetchPrograms(selectedRbsi.id, selectedTahun ?? undefined);
          }
        }}
        preselectedProgramId={selectedProgramIdForInisiatif}
        programs={programs}
      />

      {/* Add Periode (RBSI) Modal */}
      <AddPeriodeModal
        open={openAddPeriodeModal}
        onClose={() => setOpenAddPeriodeModal(false)}
        onSuccess={handleCreateRbsi}
        existingPeriodes={rbsiList.map(r => r.periode)}
      />

      {/* Copy From Year Modal */}
      {previousTahun && selectedRbsi && (
        <CopyFromYearModal
          open={openCopyModal}
          onClose={() => setOpenCopyModal(false)}
          onSuccess={() => {
            if (selectedRbsi) {
              fetchPrograms(selectedRbsi.id, selectedTahun);
            }
          }}
          rbsiId={selectedRbsi.id}
          fromTahun={previousTahun}
          toTahun={selectedTahun}
          existingPrograms={programs}
        />
      )}

      {/* History Comparison Modal */}
      {selectedRbsi && (
        <HistoryComparisonModal
          open={openHistoryModal}
          onClose={() => setOpenHistoryModal(false)}
          rbsiId={selectedRbsi.id}
          periode={selectedRbsi.periode}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProgramList;
