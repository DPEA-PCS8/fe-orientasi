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
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowRight as CollapseIcon,
  FolderRounded,
  AssignmentRounded,
  FolderOpenRounded,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { InisiatifProgress, PlanVersion, YearRealization } from '../components/YearlyChecklistProgress';
import { getAllRbsi, getProgramsByRbsi } from '../api/rbsiApi';
import type { RbsiResponse, RbsiProgramResponse } from '../api/rbsiApi';

// Generate realistic dummy data showing version changes over years
const generateDummyProgress = (
  inisiatifId: string,
  periodStart: number,
  periodEnd: number
): InisiatifProgress => {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const hash = hashCode(inisiatifId);
  const currentYear = new Date().getFullYear();
  const planVersions: PlanVersion[] = [];
  const realizations: YearRealization[] = [];

  // Determine initial planned years (at period start)
  const numPlannedYears = 2 + (hash % 3);
  const initialPlannedYears: number[] = [];

  for (let i = 0; i < numPlannedYears && periodStart + i <= periodEnd; i++) {
    if ((hash + i) % 2 === 0 || i === 0) {
      initialPlannedYears.push(periodStart + i);
    } else {
      initialPlannedYears.push(periodStart + i + 1);
    }
  }
  const uniqueInitial = [...new Set(initialPlannedYears)].filter(y => y <= periodEnd).sort((a, b) => a - b);

  planVersions.push({
    tahunPelaporan: periodStart,
    plannedYears: uniqueInitial,
    updatedAt: `${periodStart}-01-15T08:00:00Z`,
  });

  let currentPlannedYears = [...uniqueInitial];

  for (let year = periodStart + 1; year <= Math.min(currentYear, periodEnd); year++) {
    const yearHash = hashCode(`${inisiatifId}-${year}`);
    const shouldHaveChanges = yearHash % 3 === 0;

    if (shouldHaveChanges && currentPlannedYears.length > 0) {
      const newPlannedYears = [...currentPlannedYears];
      const yearToRemove = currentPlannedYears.find(y => y >= year && y <= periodEnd);
      if (yearToRemove && yearToRemove + 1 <= periodEnd) {
        const idx = newPlannedYears.indexOf(yearToRemove);
        if (idx >= 0) {
          newPlannedYears.splice(idx, 1);
          const nextYear = yearToRemove + 1;
          if (!newPlannedYears.includes(nextYear) && nextYear <= periodEnd) {
            newPlannedYears.push(nextYear);
            newPlannedYears.sort((a, b) => a - b);
          }
        }

        planVersions.push({
          tahunPelaporan: year,
          plannedYears: newPlannedYears,
          notes: `Rencana ${yearToRemove} ditunda ke ${yearToRemove + 1}`,
          updatedAt: `${year}-03-10T10:30:00Z`,
        });

        currentPlannedYears = newPlannedYears;
      }
    }
  }

  for (let year = periodStart; year < currentYear && year <= periodEnd; year++) {
    const wasPlannedInInitial = uniqueInitial.includes(year);
    const yearHash = hashCode(`${inisiatifId}-realized-${year}`);
    const realized = wasPlannedInInitial && (yearHash % 4 !== 0);

    if (wasPlannedInInitial || realized) {
      realizations.push({
        tahun: year,
        realized: realized,
      });
    }
  }

  return { planVersions, realizations };
};

function InisiatifChecklistPage() {
  const [keyword, setKeyword] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  // RBSI State
  const [rbsiList, setRbsiList] = useState<RbsiResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [rbsiLoading, setRbsiLoading] = useState(false);
  const [periodeAnchorEl, setPeriodeAnchorEl] = useState<null | HTMLElement>(null);

  // Programs State
  const [programs, setPrograms] = useState<RbsiProgramResponse[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  // Progress data (with dummy)
  const [inisiatifProgressMap, setInisiatifProgressMap] = useState<Map<string, InisiatifProgress>>(new Map());

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const currentYear = new Date().getFullYear();

  // Period years
  const periodYears = React.useMemo(() => {
    if (!selectedRbsi) return { start: 2024, end: 2027 };
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    return { start: startYear, end: endYear };
  }, [selectedRbsi]);

  // Get all unique KEP years across all inisiatifs
  const allKepYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    inisiatifProgressMap.forEach(progress => {
      progress.planVersions.forEach(version => {
        yearsSet.add(version.tahunPelaporan);
      });
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [inisiatifProgressMap]);

  useEffect(() => {
    fetchRbsiList();
  }, []);

  useEffect(() => {
    if (selectedRbsi) {
      fetchAllPrograms(selectedRbsi.id);
    }
  }, [selectedRbsi]);

  useEffect(() => {
    if (programs.length > 0 && selectedRbsi) {
      const newProgressMap = new Map<string, InisiatifProgress>();
      programs.forEach(program => {
        program.inisiatifs?.forEach(inisiatif => {
          const progress = generateDummyProgress(
            inisiatif.id,
            periodYears.start,
            periodYears.end
          );
          newProgressMap.set(inisiatif.id, progress);
        });
      });
      setInisiatifProgressMap(newProgressMap);
    }
  }, [programs, selectedRbsi, periodYears]);

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

  const fetchAllPrograms = async (rbsiId: string) => {
    setProgramsLoading(true);
    try {
      const response = await getProgramsByRbsi(rbsiId);
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

  const filteredPrograms = programs.filter(program => {
    const inisiatifs = program.inisiatifs || [];
    const matchKeyword =
      program.nama_program.toLowerCase().includes(keyword.toLowerCase()) ||
      program.nomor_program.toLowerCase().includes(keyword.toLowerCase()) ||
      inisiatifs.some(ini => ini.nama_inisiatif.toLowerCase().includes(keyword.toLowerCase()));

    return matchKeyword;
  }).sort((a, b) => compareNomor(a.nomor_program, b.nomor_program));

  // Get plan for specific KEP year
  const getPlanForKepYear = (progress: InisiatifProgress, kepYear: number): number[] => {
    const version = progress.planVersions.find(v => v.tahunPelaporan === kepYear);
    return version ? version.plannedYears : [];
  };

  // Toggle year in KEP plan
  const toggleYearInKepPlan = (inisiatifId: string, kepYear: number, targetYear: number) => {
    setInisiatifProgressMap(prev => {
      const newMap = new Map(prev);
      const progress = newMap.get(inisiatifId);
      if (!progress) return prev;

      const newProgress = { ...progress, planVersions: [...progress.planVersions] };
      const versionIndex = newProgress.planVersions.findIndex(v => v.tahunPelaporan === kepYear);

      if (versionIndex >= 0) {
        const version = { ...newProgress.planVersions[versionIndex] };
        if (version.plannedYears.includes(targetYear)) {
          version.plannedYears = version.plannedYears.filter(y => y !== targetYear);
        } else {
          version.plannedYears = [...version.plannedYears, targetYear].sort((a, b) => a - b);
        }
        version.updatedAt = new Date().toISOString();
        newProgress.planVersions[versionIndex] = version;
      }

      newMap.set(inisiatifId, newProgress);
      return newMap;
    });
    setHasChanges(true);
  };

  // Toggle realization
  const toggleRealization = (inisiatifId: string, targetYear: number) => {
    setInisiatifProgressMap(prev => {
      const newMap = new Map(prev);
      const progress = newMap.get(inisiatifId);
      if (!progress) return prev;

      const newProgress = { ...progress, realizations: [...progress.realizations] };
      const existingIndex = newProgress.realizations.findIndex(r => r.tahun === targetYear);

      if (existingIndex >= 0) {
        newProgress.realizations[existingIndex] = {
          ...newProgress.realizations[existingIndex],
          realized: !newProgress.realizations[existingIndex].realized,
        };
      } else {
        newProgress.realizations.push({ tahun: targetYear, realized: true });
      }

      newMap.set(inisiatifId, newProgress);
      return newMap;
    });
    setHasChanges(true);
  };

  // Add new KEP for all inisiatifs
  const addNewKep = () => {
    const newKepYear = currentYear;

    // Check if current year KEP already exists
    if (allKepYears.includes(newKepYear)) {
      setSnackbar({
        open: true,
        message: `KEP ${newKepYear} sudah ada`,
        severity: 'warning',
      });
      return;
    }

    setInisiatifProgressMap(prev => {
      const newMap = new Map(prev);

      newMap.forEach((progress, inisiatifId) => {
        // Get the latest plan to copy
        const sortedVersions = [...progress.planVersions].sort((a, b) => b.tahunPelaporan - a.tahunPelaporan);
        const latestPlan = sortedVersions.length > 0 ? sortedVersions[0].plannedYears : [];

        const newProgress = {
          ...progress,
          planVersions: [
            ...progress.planVersions,
            {
              tahunPelaporan: newKepYear,
              plannedYears: [...latestPlan],
              updatedAt: new Date().toISOString(),
            },
          ],
        };
        newMap.set(inisiatifId, newProgress);
      });

      return newMap;
    });

    setHasChanges(true);
    setSnackbar({
      open: true,
      message: `KEP ${newKepYear} berhasil ditambahkan`,
      severity: 'success',
    });
  };

  // Save changes
  const handleSave = () => {
    // In real app, this would call API
    setSnackbar({
      open: true,
      message: 'Perubahan berhasil disimpan',
      severity: 'success',
    });
    setHasChanges(false);
    setEditMode(false);
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <TimelineIcon sx={{ fontSize: 32, color: '#DA251C' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1d1d1f',
                letterSpacing: '-0.02em',
              }}
            >
              Progress Tahunan Inisiatif
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#86868b' }}>
            Pantau progress dan riwayat perubahan rencana PKSI per tahun
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
          </Menu>
        </Box>
      </Box>

      {/* Legend */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>Keterangan:</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
            <Typography variant="caption">Terealisasi</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <UncheckedIcon sx={{ fontSize: 16, color: '#FFC107' }} />
            <Typography variant="caption">Direncanakan</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CancelIcon sx={{ fontSize: 16, color: '#EF5350' }} />
            <Typography variant="caption">Tidak Tercapai</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              width: 14, height: 14, borderRadius: '50%',
              bgcolor: '#F5F5F5', border: '2px solid #E0E0E0'
            }} />
            <Typography variant="caption">Tidak Ada</Typography>
          </Box>
        </Box>
      </Paper>

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
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Cari program atau inisiatif..."
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{
                width: 300,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f5f5f7',
                  borderRadius: '10px',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'transparent' },
                  '&.Mui-focused fieldset': { borderColor: '#DA251C', borderWidth: 2 },
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
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!allKepYears.includes(currentYear) && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addNewKep}
                sx={{
                  borderColor: '#2196F3',
                  color: '#1565C0',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#1976D2', bgcolor: '#E3F2FD' },
                }}
              >
                Tambah KEP {currentYear}
              </Button>
            )}
            {editMode ? (
              <>
                <Button
                  onClick={() => { setEditMode(false); setHasChanges(false); }}
                  sx={{ color: '#86868b' }}
                >
                  Batal
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={!hasChanges}
                  sx={{
                    bgcolor: '#4CAF50',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#388E3C' },
                  }}
                >
                  Simpan
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => setEditMode(true)}
                sx={{
                  bgcolor: '#DA251C',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#B91C14' },
                }}
              >
                Edit Planning
              </Button>
            )}
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#2C3E50',
                    py: 1.5,
                    minWidth: 250,
                    bgcolor: '#f8f9fa',
                    borderRight: '2px solid #e0e0e0',
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                  }}
                >
                  Inisiatif
                </TableCell>
                {/* KEP Year Columns */}
                {allKepYears.map(kepYear => (
                  <TableCell
                    key={`kep-${kepYear}`}
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: kepYear === currentYear ? '#DA251C' : '#2C3E50',
                      py: 1,
                      minWidth: 120,
                      bgcolor: kepYear === currentYear ? 'rgba(218, 37, 28, 0.08)' : '#f8f9fa',
                      borderRight: '1px solid #e0e0e0',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      KEP {kepYear}
                    </Typography>
                    {kepYear === currentYear && (
                      <Chip label="Aktif" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#DA251C', color: 'white', mt: 0.5 }} />
                    )}
                  </TableCell>
                ))}
                {/* Realisasi Column */}
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    color: '#2E7D32',
                    py: 1,
                    minWidth: 120,
                    bgcolor: '#E8F5E9',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Realisasi
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {programsLoading ? (
                <TableRow>
                  <TableCell colSpan={allKepYears.length + 2} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>Memuat data...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={allKepYears.length + 2} sx={{ textAlign: 'center', py: 4 }}>
                    <FolderOpenRounded sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {keyword ? 'Tidak ada program yang sesuai pencarian' : 'Belum ada program'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((program) => (
                  <React.Fragment key={program.id}>
                    {/* Program Row */}
                    <TableRow
                      sx={{
                        bgcolor: '#f5f5f7',
                        '&:hover': { bgcolor: 'rgba(218, 37, 28, 0.04)' },
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleExpand(program.id)}
                    >
                      <TableCell
                        colSpan={allKepYears.length + 2}
                        sx={{
                          py: 1.5,
                          borderLeft: '4px solid #DA251C',
                          position: 'sticky',
                          left: 0,
                          bgcolor: '#f5f5f7',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small">
                            {expandedPrograms.has(program.id) ? <ExpandIcon /> : <CollapseIcon />}
                          </IconButton>
                          <FolderRounded sx={{ color: '#DA251C', fontSize: 20 }} />
                          <Typography fontWeight={600} sx={{ color: '#2C3E50', fontSize: '0.9rem' }}>
                            {program.nomor_program} - {program.nama_program}
                          </Typography>
                          <Chip label={`${program.inisiatifs?.length || 0} Inisiatif`} size="small" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} />
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Inisiatif Rows */}
                    {expandedPrograms.has(program.id) && (program.inisiatifs ?? [])
                      .sort((a, b) => compareNomor(a.nomor_inisiatif, b.nomor_inisiatif))
                      .map((inisiatif) => {
                        const progress = inisiatifProgressMap.get(inisiatif.id) || { planVersions: [], realizations: [] };

                        return (
                          <TableRow
                            key={inisiatif.id}
                            sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                          >
                            {/* Inisiatif Name */}
                            <TableCell
                              sx={{
                                py: 1,
                                pl: 6,
                                borderRight: '2px solid #e0e0e0',
                                position: 'sticky',
                                left: 0,
                                bgcolor: 'white',
                                zIndex: 1,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssignmentRounded sx={{ color: '#666', fontSize: 16 }} />
                                <Box>
                                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#333' }}>
                                    {inisiatif.nomor_inisiatif}
                                  </Typography>
                                  <Tooltip title={inisiatif.nama_inisiatif}>
                                    <Typography
                                      sx={{
                                        fontSize: '0.7rem',
                                        color: '#666',
                                        maxWidth: 200,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {inisiatif.nama_inisiatif}
                                    </Typography>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </TableCell>

                            {/* KEP Year Columns - each shows planned period years */}
                            {allKepYears.map(kepYear => {
                              const kepPlan = getPlanForKepYear(progress, kepYear);
                              const periodYearsArray = Array.from(
                                { length: periodYears.end - periodYears.start + 1 },
                                (_, i) => periodYears.start + i
                              );

                              return (
                                <TableCell
                                  key={`${inisiatif.id}-kep-${kepYear}`}
                                  align="center"
                                  sx={{
                                    py: 0.5,
                                    borderRight: '1px solid #e0e0e0',
                                    bgcolor: kepYear === currentYear ? 'rgba(218, 37, 28, 0.02)' : 'transparent',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                    {periodYearsArray.map(year => {
                                      const isPlanned = kepPlan.includes(year);

                                      return (
                                        <Box
                                          key={year}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 0.5,
                                            p: 0.25,
                                            borderRadius: 1,
                                            bgcolor: isPlanned ? '#FFF8E1' : 'transparent',
                                            border: isPlanned ? '1px solid #FFC107' : '1px solid transparent',
                                            cursor: editMode ? 'pointer' : 'default',
                                            '&:hover': editMode ? { bgcolor: '#FFFDE7' } : {},
                                          }}
                                          onClick={() => editMode && toggleYearInKepPlan(inisiatif.id, kepYear, year)}
                                        >
                                          {editMode ? (
                                            <Checkbox
                                              size="small"
                                              checked={isPlanned}
                                              sx={{
                                                p: 0,
                                                '& .MuiSvgIcon-root': { fontSize: 14 },
                                                color: '#FFC107',
                                                '&.Mui-checked': { color: '#FFC107' },
                                              }}
                                            />
                                          ) : (
                                            isPlanned && <UncheckedIcon sx={{ fontSize: 12, color: '#FFC107' }} />
                                          )}
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontSize: '0.65rem',
                                              color: isPlanned ? '#F57C00' : '#ccc',
                                              fontWeight: isPlanned ? 600 : 400,
                                            }}
                                          >
                                            {year}
                                          </Typography>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                </TableCell>
                              );
                            })}

                            {/* Realisasi Column */}
                            <TableCell align="center" sx={{ py: 0.5, bgcolor: 'rgba(232, 245, 233, 0.3)' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                {Array.from(
                                  { length: periodYears.end - periodYears.start + 1 },
                                  (_, i) => periodYears.start + i
                                ).map(year => {
                                  const isRealized = progress.realizations.some(r => r.tahun === year && r.realized);
                                  const isPast = year < currentYear;

                                  // Get latest plan to check if it was planned
                                  const sortedVersions = [...progress.planVersions].sort((a, b) => b.tahunPelaporan - a.tahunPelaporan);
                                  const latestPlan = sortedVersions.length > 0 ? sortedVersions[0].plannedYears : [];
                                  const wasPlanned = latestPlan.includes(year);
                                  const isMissed = wasPlanned && isPast && !isRealized;

                                  let bgColor = 'transparent';
                                  let borderColor = 'transparent';
                                  let textColor = '#ccc';

                                  if (isRealized) {
                                    bgColor = '#E8F5E9';
                                    borderColor = '#4CAF50';
                                    textColor = '#2E7D32';
                                  } else if (isMissed) {
                                    bgColor = '#FFEBEE';
                                    borderColor = '#EF5350';
                                    textColor = '#C62828';
                                  }

                                  return (
                                    <Box
                                      key={year}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.5,
                                        p: 0.25,
                                        borderRadius: 1,
                                        bgcolor: bgColor,
                                        border: `1px solid ${borderColor}`,
                                        cursor: editMode && isPast ? 'pointer' : 'default',
                                        '&:hover': editMode && isPast ? { bgcolor: '#C8E6C9' } : {},
                                      }}
                                      onClick={() => editMode && isPast && toggleRealization(inisiatif.id, year)}
                                    >
                                      {editMode && isPast ? (
                                        <Checkbox
                                          size="small"
                                          checked={isRealized}
                                          sx={{
                                            p: 0,
                                            '& .MuiSvgIcon-root': { fontSize: 14 },
                                            color: '#4CAF50',
                                            '&.Mui-checked': { color: '#4CAF50' },
                                          }}
                                        />
                                      ) : (
                                        isRealized ? (
                                          <CheckCircleIcon sx={{ fontSize: 12, color: '#4CAF50' }} />
                                        ) : isMissed ? (
                                          <CancelIcon sx={{ fontSize: 12, color: '#EF5350' }} />
                                        ) : null
                                      )}
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: '0.65rem',
                                          color: textColor,
                                          fontWeight: isRealized || isMissed ? 600 : 400,
                                        }}
                                      >
                                        {year}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbar */}
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

export default InisiatifChecklistPage;
