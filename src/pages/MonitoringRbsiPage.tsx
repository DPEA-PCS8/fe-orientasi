import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
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
  MonitorHeart as MonitorIcon,
  Add as AddIcon,
  Save as SaveIcon,
  InfoOutlined as InfoIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import { getAllRbsi, getProgramsByRbsi, getKepList as apiGetKepList, createKep as apiCreateKep, updateKepProgress, getKepProgress as apiGetKepProgress } from '../api/rbsiApi';
import type { RbsiResponse, RbsiProgramResponse, RbsiInisiatifResponse, RbsiKepResponse, KepProgressFullResponse } from '../api/rbsiApi';

// ============ TYPES ============

// KEP (Keputusan) - entitas dengan nomor dan tahun
interface KepData {
  id: string;
  nomorKep: string; // e.g., "KEP-001/2022", "KEP-002/2023"
  tahunPelaporan: number; // Tahun pelaporan KEP
  createdAt?: string;
}

// KEP Progress untuk satu inisiatif di satu KEP
interface KepProgress {
  kepId: string;
  nomorKep: string;
  tahunPelaporan: number;
  yearlyProgress: YearProgress[]; // Status per tahun periode
}

// Status progres per tahun
interface YearProgress {
  tahun: number; // Tahun periode (e.g., 2024, 2025, 2026, 2027)
  status: 'none' | 'planned' | 'realized'; // none = tidak ada, planned = ○, realized = ●
}

// Data lengkap inisiatif dengan progress per KEP
interface InisiatifKepData {
  inisiatifId: string;
  kepProgress: Map<string, KepProgress>; // Map<KEP id, progress>
}

// Versioned name per KEP (untuk edit nama per KEP)
interface KepVersionedName {
  kepId: string;
  nomorKep: string;
  tahunPelaporan: number;
  namaProgram?: string;
  namaInisiatif?: string;
}

// ============ COMPONENT ============

function MonitoringRbsiPage() {
  const [keyword, setKeyword] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  // RBSI State
  const [rbsiList, setRbsiList] = useState<RbsiResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [rbsiLoading, setRbsiLoading] = useState(false);
  const [periodeAnchorEl, setPeriodeAnchorEl] = useState<null | HTMLElement>(null);

  // Programs data (same as ProgramList)
  const [programs, setPrograms] = useState<RbsiProgramResponse[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  // KEP data
  const [kepList, setKepList] = useState<KepData[]>([]);
  const [kepLoading, setKepLoading] = useState(false);

  // Versioned names per KEP (for name versioning per KEP)
  const [kepVersionedNames, setKepVersionedNames] = useState<Map<string, KepVersionedName[]>>(new Map());

  // Progress data (dummy)
  const [progressMap, setProgressMap] = useState<Map<string, InisiatifKepData>>(new Map());

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Add KEP dialog
  const [addKepDialogOpen, setAddKepDialogOpen] = useState(false);
  const [newKepNomor, setNewKepNomor] = useState<string>('');
  const [newKepYear, setNewKepYear] = useState<number>(new Date().getFullYear());

  // Version detail modal
  const [versionDetailOpen, setVersionDetailOpen] = useState(false);
  const [selectedKepForDetail, setSelectedKepForDetail] = useState<KepData | null>(null);
  const [selectedInisiatifForDetail, setSelectedInisiatifForDetail] = useState<{
    nomor: string;
    nama: string;
    programNama: string;
  } | null>(null);

  // Edit KEP content modal
  const [editKepModalOpen, setEditKepModalOpen] = useState(false);
  const [editingKep, setEditingKep] = useState<KepData | null>(null);
  const [editingProgram, setEditingProgram] = useState<{
    nomorProgram: string;
    namaProgram: string;
    inisiatifs: { nomorInisiatif: string; namaInisiatif: string; id: string }[];
  } | null>(null);
  const [tempProgramName, setTempProgramName] = useState('');
  const [tempInisiatifNames, setTempInisiatifNames] = useState<Map<string, string>>(new Map());

  // Program history modal
  const [programHistoryOpen, setProgramHistoryOpen] = useState(false);
  const [selectedProgramForHistory, setSelectedProgramForHistory] = useState<string | null>(null);

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

  // Fetch RBSI list
  useEffect(() => {
    fetchRbsiList();
  }, []);

  // Fetch programs and KEP when RBSI selected
  useEffect(() => {
    if (selectedRbsi) {
      fetchPrograms(selectedRbsi.id);
      fetchKepList(selectedRbsi.id);
    }
  }, [selectedRbsi]);

  // Fetch progress data from API when programs and KEP list change
  useEffect(() => {
    if (selectedRbsi && kepList.length > 0) {
      fetchProgressData(selectedRbsi.id);
    }
  }, [selectedRbsi, kepList]);

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

  // Fetch programs using the same API as ProgramList
  const fetchPrograms = async (rbsiId: string) => {
    setProgramsLoading(true);
    try {
      // Use getProgramsByRbsi without tahun to get all programs
      // Or get the latest year's programs
      const response = await getProgramsByRbsi(rbsiId);
      const fetchedPrograms = response.data || [];
      setPrograms(fetchedPrograms);

      // Expand all programs by default
      const allProgramIds = new Set<string>();
      fetchedPrograms.forEach(p => allProgramIds.add(p.nomor_program));
      setExpandedPrograms(allProgramIds);
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

  // Fetch KEP list using real API
  const fetchKepList = async (rbsiId: string) => {
    setKepLoading(true);
    try {
      const response = await apiGetKepList(rbsiId);
      const apiKepList = response.data || [];

      // Map API response to local KepData format
      const mappedKepList: KepData[] = apiKepList.map((kep: RbsiKepResponse) => ({
        id: kep.id,
        nomorKep: kep.nomor_kep,
        tahunPelaporan: kep.tahun_pelaporan,
        createdAt: kep.created_at,
      }));

      setKepList(mappedKepList);

      // Initialize versioned names
      const versionedNames = new Map<string, KepVersionedName[]>();
      setKepVersionedNames(versionedNames);
    } catch (error) {
      console.error('Failed to fetch KEP list:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal mengambil data KEP',
        severity: 'error',
      });
      setKepList([]);
    } finally {
      setKepLoading(false);
    }
  };

  // Fetch progress data from real API
  const fetchProgressData = useCallback(async (rbsiId: string) => {
    try {
      const response = await apiGetKepProgress(rbsiId);
      const progressData: KepProgressFullResponse = response.data;

      const newProgressMap = new Map<string, InisiatifKepData>();

      // Map API response to local progress format
      if (progressData.progress) {
        progressData.progress.forEach((inisiatifProgress) => {
          const kepProgress = new Map<string, KepProgress>();

          inisiatifProgress.kep_progress.forEach((kepItem) => {
            kepProgress.set(kepItem.kep_id, {
              kepId: kepItem.kep_id,
              nomorKep: kepItem.nomor_kep,
              tahunPelaporan: kepItem.tahun_pelaporan,
              yearlyProgress: kepItem.yearly_progress.map((yp) => ({
                tahun: yp.tahun,
                status: yp.status as 'none' | 'planned' | 'realized',
              })),
            });
          });

          newProgressMap.set(inisiatifProgress.inisiatif_id, {
            inisiatifId: inisiatifProgress.inisiatif_id,
            kepProgress,
          });
        });
      }

      setProgressMap(newProgressMap);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
      // Initialize empty progress map
      setProgressMap(new Map());
    }
  }, []);

  const toggleExpand = (programNomor: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programNomor)) {
        newSet.delete(programNomor);
      } else {
        newSet.add(programNomor);
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

  // Get progress for inisiatif in specific KEP
  const getProgress = (inisiatifId: string, kepId: string, targetYear: number): 'none' | 'planned' | 'realized' => {
    const data = progressMap.get(inisiatifId);
    if (!data) return 'none';

    const kepProgress = data.kepProgress.get(kepId);
    if (!kepProgress) return 'none';

    const yearProgress = kepProgress.yearlyProgress.find(y => y.tahun === targetYear);
    return yearProgress?.status || 'none';
  };

  // Toggle progress status
  const toggleProgress = useCallback((inisiatifId: string, kepId: string, targetYear: number) => {
    console.log('=== TOGGLE PROGRESS START ===');
    console.log('Params:', { inisiatifId, kepId, targetYear });
    console.log('periodYears:', periodYears);

    // Get current status first
    const currentData = progressMap.get(inisiatifId);
    const currentKepProgress = currentData?.kepProgress.get(kepId);
    const currentYearProgress = currentKepProgress?.yearlyProgress.find(yp => yp.tahun === targetYear);
    const oldStatus = currentYearProgress?.status || 'none';

    // Calculate new status
    let newStatus: 'none' | 'planned' | 'realized';
    if (oldStatus === 'none') newStatus = 'planned';
    else if (oldStatus === 'planned') newStatus = 'realized';
    else newStatus = 'none';

    console.log('STATUS CHANGE:', { year: targetYear, from: oldStatus, to: newStatus });

    setProgressMap(prev => {
      const newMap = new Map(prev);
      let data = newMap.get(inisiatifId);

      // Initialize progress data if it doesn't exist
      if (!data) {
        console.log('Creating NEW data for inisiatif:', inisiatifId);
        data = {
          inisiatifId,
          kepProgress: new Map(),
        };
      }

      const newData = { ...data, kepProgress: new Map(data.kepProgress) };
      let kepProgress = newData.kepProgress.get(kepId);

      // Initialize KEP progress if it doesn't exist
      if (!kepProgress) {
        const kep = kepList.find(k => k.id === kepId);
        console.log('Creating NEW KEP progress for kepId:', kepId);
        const yearlyProgress: YearProgress[] = [];
        for (let year = periodYears.start; year <= periodYears.end; year++) {
          yearlyProgress.push({ tahun: year, status: year === targetYear ? newStatus : 'none' });
        }
        kepProgress = {
          kepId,
          nomorKep: kep?.nomorKep || '',
          tahunPelaporan: kep?.tahunPelaporan || targetYear,
          yearlyProgress,
        };
        console.log('Created yearlyProgress:', yearlyProgress);
      } else if (kepProgress.yearlyProgress.length === 0) {
        // yearlyProgress is empty from API - initialize it with all period years
        console.log('Initializing empty yearlyProgress for kepId:', kepId);
        const yearlyProgress: YearProgress[] = [];
        for (let year = periodYears.start; year <= periodYears.end; year++) {
          yearlyProgress.push({ tahun: year, status: year === targetYear ? newStatus : 'none' });
        }
        kepProgress = {
          ...kepProgress,
          yearlyProgress,
        };
        console.log('Initialized yearlyProgress:', yearlyProgress);
      } else {
        // Update existing progress
        kepProgress = {
          ...kepProgress,
          yearlyProgress: kepProgress.yearlyProgress.map(yp => {
            if (yp.tahun === targetYear) {
              return { ...yp, status: newStatus };
            }
            return yp;
          }),
        };
      }

      newData.kepProgress.set(kepId, kepProgress);
      newMap.set(inisiatifId, newData);
      console.log('Progress map updated, new size:', newMap.size);
      console.log('=== TOGGLE PROGRESS END ===');

      return newMap;
    });

    setHasChanges(true);

    // Show feedback OUTSIDE of setProgressMap
    setSnackbar({
      open: true,
      message: `Tahun ${targetYear}: ${newStatus === 'none' ? 'Tidak ada' : newStatus === 'planned' ? 'Direncanakan' : 'Terealisasi'}`,
      severity: 'success',
    });
  }, [kepList, periodYears, progressMap]);

  // Add new KEP using real API
  const handleAddKep = async () => {
    if (!selectedRbsi) return;

    // Check if KEP with same nomor already exists
    const existingKep = kepList.find(k => k.nomorKep === newKepNomor || k.tahunPelaporan === newKepYear);
    if (existingKep) {
      setSnackbar({
        open: true,
        message: `KEP dengan nomor atau tahun tersebut sudah ada`,
        severity: 'warning',
      });
      return;
    }

    try {
      const response = await apiCreateKep(selectedRbsi.id, {
        nomor_kep: newKepNomor || `KEP-${String(kepList.length + 1).padStart(3, '0')}/${newKepYear}`,
        tahun_pelaporan: newKepYear,
        copy_from_latest: true,
      });

      const newKep: KepData = {
        id: response.data.id,
        nomorKep: response.data.nomor_kep,
        tahunPelaporan: response.data.tahun_pelaporan,
        createdAt: response.data.created_at,
      };

      setKepList(prev => [...prev, newKep].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan));
      setAddKepDialogOpen(false);
      setNewKepNomor('');

      // Refresh progress data after adding new KEP
      fetchProgressData(selectedRbsi.id);

      setSnackbar({
        open: true,
        message: `${newKep.nomorKep} berhasil ditambahkan`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to create KEP:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal membuat KEP baru',
        severity: 'error',
      });
    }
  };

  // Save changes using real API
  const handleSave = async () => {
    if (!selectedRbsi) {
      console.log('handleSave: No selectedRbsi');
      return;
    }

    console.log('handleSave called, progressMap size:', progressMap.size);

    try {
      // For each inisiatif with changes, save progress to each KEP
      const savePromises: Promise<unknown>[] = [];

      progressMap.forEach((data, inisiatifId) => {
        console.log('Processing inisiatif:', inisiatifId, 'kepProgress size:', data.kepProgress.size);
        data.kepProgress.forEach((progress, kepId) => {
          console.log('Creating API call for:', { inisiatifId, kepId, progress: progress.yearlyProgress });
          savePromises.push(
            updateKepProgress(selectedRbsi.id, kepId, {
              inisiatif_id: inisiatifId,
              yearly_progress: progress.yearlyProgress,
            })
          );
        });
      });

      console.log('Total save promises:', savePromises.length);

      if (savePromises.length > 0) {
        await Promise.all(savePromises);
        console.log('All API calls completed successfully');
      } else {
        console.log('No progress changes to save');
      }

      setSnackbar({
        open: true,
        message: 'Perubahan berhasil disimpan',
        severity: 'success',
      });
      setHasChanges(false);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving progress:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal menyimpan perubahan',
        severity: 'error',
      });
    }
  };

  // Get versioned name for inisiatif/program (from kepVersionedNames or fallback to current)
  const getVersionedName = (kep: KepData, type: 'program' | 'inisiatif', nomor: string): string | null => {
    // Check if there's a versioned name for this KEP
    const key = `${kep.id}-${type}-${nomor}`;
    const versionedNamesList = kepVersionedNames.get(key);
    if (versionedNamesList && versionedNamesList.length > 0) {
      const versionedName = versionedNamesList.find(v => v.kepId === kep.id);
      if (versionedName) {
        return type === 'program' ? versionedName.namaProgram || null : versionedName.namaInisiatif || null;
      }
    }

    // Fallback to current program/inisiatif name
    if (type === 'program') {
      const program = programs.find(p => p.nomor_program === nomor);
      return program?.nama_program || null;
    } else {
      for (const program of programs) {
        const inisiatif = program.inisiatifs?.find(i => i.nomor_inisiatif === nomor);
        if (inisiatif) return inisiatif.nama_inisiatif;
      }
      return null;
    }
  };

  // Show version detail - called when clicking on inisiatif row to show name versions per KEP
  const showVersionDetail = (inisiatif: RbsiInisiatifResponse, program: RbsiProgramResponse) => {
    // Show detail for current/latest KEP
    const latestKep = kepList.length > 0 ? kepList[kepList.length - 1] : null;
    if (latestKep) {
      setSelectedKepForDetail(latestKep);
      setSelectedInisiatifForDetail({
        nomor: inisiatif.nomor_inisiatif,
        nama: getVersionedName(latestKep, 'inisiatif', inisiatif.nomor_inisiatif) || inisiatif.nama_inisiatif,
        programNama: getVersionedName(latestKep, 'program', program.nomor_program) || program.nama_program,
      });
      setVersionDetailOpen(true);
    }
  };

  // Open edit KEP modal for program
  const openEditKepModal = (kep: KepData, program: RbsiProgramResponse) => {
    setEditingKep(kep);
    setEditingProgram({
      nomorProgram: program.nomor_program,
      namaProgram: getVersionedName(kep, 'program', program.nomor_program) || program.nama_program,
      inisiatifs: (program.inisiatifs || []).map(ini => ({
        nomorInisiatif: ini.nomor_inisiatif,
        namaInisiatif: getVersionedName(kep, 'inisiatif', ini.nomor_inisiatif) || ini.nama_inisiatif,
        id: ini.id,
      })),
    });
    setTempProgramName(getVersionedName(kep, 'program', program.nomor_program) || program.nama_program);
    const iniNames = new Map<string, string>();
    program.inisiatifs?.forEach(ini => {
      iniNames.set(ini.nomor_inisiatif, getVersionedName(kep, 'inisiatif', ini.nomor_inisiatif) || ini.nama_inisiatif);
    });
    setTempInisiatifNames(iniNames);
    setEditKepModalOpen(true);
  };

  // Save KEP content changes
  const saveKepContentChanges = () => {
    if (!editingKep || !editingProgram) return;

    // Update versioned names in map
    setKepVersionedNames(prev => {
      const newMap = new Map(prev);

      // Save program name version
      const programKey = `${editingKep.id}-program-${editingProgram.nomorProgram}`;
      const programVersions = newMap.get(programKey) || [];
      const existingProgramVersion = programVersions.find(v => v.kepId === editingKep.id);
      if (existingProgramVersion) {
        existingProgramVersion.namaProgram = tempProgramName;
      } else {
        programVersions.push({
          kepId: editingKep.id,
          nomorKep: editingKep.nomorKep,
          tahunPelaporan: editingKep.tahunPelaporan,
          namaProgram: tempProgramName,
        });
      }
      newMap.set(programKey, programVersions);

      // Save inisiatif name versions
      tempInisiatifNames.forEach((namaInisiatif, nomorInisiatif) => {
        const iniKey = `${editingKep.id}-inisiatif-${nomorInisiatif}`;
        const iniVersions = newMap.get(iniKey) || [];
        const existingIniVersion = iniVersions.find(v => v.kepId === editingKep.id);
        if (existingIniVersion) {
          existingIniVersion.namaInisiatif = namaInisiatif;
        } else {
          iniVersions.push({
            kepId: editingKep.id,
            nomorKep: editingKep.nomorKep,
            tahunPelaporan: editingKep.tahunPelaporan,
            namaInisiatif: namaInisiatif,
          });
        }
        newMap.set(iniKey, iniVersions);
      });

      return newMap;
    });

    setHasChanges(true);
    setEditKepModalOpen(false);
    setSnackbar({
      open: true,
      message: `Nama program dan inisiatif untuk ${editingKep.nomorKep} berhasil diupdate`,
      severity: 'success',
    });
  };

  // Check if name changed from previous KEP
  const hasNameChanged = (kep: KepData, type: 'program' | 'inisiatif', nomor: string): boolean => {
    const sortedKeps = [...kepList].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan);
    const kepIndex = sortedKeps.findIndex(k => k.id === kep.id);
    if (kepIndex <= 0) return false;

    const prevKep = sortedKeps[kepIndex - 1];
    const currentName = getVersionedName(kep, type, nomor);
    const prevName = getVersionedName(prevKep, type, nomor);

    return currentName !== null && prevName !== null && currentName !== prevName;
  };

  // Get all name versions for a program/inisiatif
  const getNameHistory = (type: 'program' | 'inisiatif', nomor: string): { kepId: string; nomorKep: string; tahunPelaporan: number; name: string }[] => {
    const history: { kepId: string; nomorKep: string; tahunPelaporan: number; name: string }[] = [];
    const sortedKeps = [...kepList].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan);
    sortedKeps.forEach(kep => {
      const name = getVersionedName(kep, type, nomor);
      if (name) {
        history.push({
          kepId: kep.id,
          nomorKep: kep.nomorKep,
          tahunPelaporan: kep.tahunPelaporan,
          name,
        });
      }
    });
    return history;
  };

  // Show program history
  const showProgramHistory = (nomorProgram: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProgramForHistory(nomorProgram);
    setProgramHistoryOpen(true);
  };

  // Status symbol rendering using Checkbox
  // none = unchecked, planned = indeterminate (dash), realized = checked
  const renderStatus = (status: 'none' | 'planned' | 'realized', isEditable: boolean) => {
    const isChecked = status === 'realized';
    const isIndeterminate = status === 'planned';

    return (
      <Checkbox
        checked={isChecked}
        indeterminate={isIndeterminate}
        size="small"
        disabled={!isEditable}
        sx={{
          p: 0,
          '& .MuiSvgIcon-root': {
            fontSize: 20,
          },
          color: status === 'none' ? '#E0E0E0' : status === 'planned' ? '#FFC107' : '#4CAF50',
          '&.Mui-checked': {
            color: '#4CAF50',
          },
          '&.MuiCheckbox-indeterminate': {
            color: '#FFC107',
          },
          '&:hover': isEditable ? {
            bgcolor: 'rgba(0,0,0,0.04)',
          } : {},
          '&.Mui-disabled': {
            color: status === 'none' ? '#E0E0E0' : status === 'planned' ? '#FFC107' : '#4CAF50',
          },
          // Make checkbox not intercept clicks - let parent handle it
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      />
    );
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
            <MonitorIcon sx={{ fontSize: 32, color: '#DA251C' }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1d1d1f',
                letterSpacing: '-0.02em',
              }}
            >
              Monitoring RBSI
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#86868b' }}>
            Pantau progress dan perubahan KEP RBSI per tahun
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
              '&:hover': { bgcolor: '#fafafa', borderColor: '#DA251C' },
            }}
          >
            {selectedRbsi ? `Periode ${selectedRbsi.periode}` : 'Pilih Periode'}
          </Button>
          <Menu
            anchorEl={periodeAnchorEl}
            open={Boolean(periodeAnchorEl)}
            onClose={() => setPeriodeAnchorEl(null)}
            PaperProps={{ sx: { mt: 1, borderRadius: '12px', minWidth: '200px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
          >
            {rbsiList.length === 0 && !rbsiLoading && (
              <MenuItem disabled>
                <Typography variant="body2" sx={{ color: '#86868b' }}>Tidak ada data RBSI</Typography>
              </MenuItem>
            )}
            {rbsiList.map(rbsi => (
              <MenuItem
                key={rbsi.id}
                selected={selectedRbsi?.id === rbsi.id}
                onClick={() => { setSelectedRbsi(rbsi); setPeriodeAnchorEl(null); }}
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
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {renderStatus('none', false)}
            <Typography variant="caption">Tidak Ada</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {renderStatus('planned', false)}
            <Typography variant="caption">Direncanakan</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {renderStatus('realized', false)}
            <Typography variant="caption">Terealisasi</Typography>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: '#86868b', ml: 'auto' }}>
          Klik "Edit Progress" lalu klik checkbox untuk mengubah status (none → planned → realized)
        </Typography>
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
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                const maxYear = kepList.length > 0 ? Math.max(...kepList.map(k => k.tahunPelaporan)) : currentYear;
                setNewKepYear(maxYear + 1);
                setNewKepNomor(`KEP-${String(kepList.length + 1).padStart(3, '0')}/${maxYear + 1}`);
                setAddKepDialogOpen(true);
              }}
              sx={{
                borderColor: '#2196F3',
                color: '#1565C0',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#1976D2', bgcolor: '#E3F2FD' },
              }}
            >
              Tambah KEP
            </Button>
            {editMode ? (
              <>
                <Button onClick={() => { setEditMode(false); setHasChanges(false); }} sx={{ color: '#86868b' }}>
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
                Edit Progress
              </Button>
            )}
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#2C3E50',
                    py: 1.5,
                    minWidth: 280,
                    bgcolor: '#f8f9fa',
                    borderRight: '2px solid #e0e0e0',
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                  }}
                >
                  Inisiatif
                </TableCell>
                {/* KEP Columns */}
                {kepList.map(kep => (
                  <TableCell
                    key={`kep-header-${kep.id}`}
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: kep.tahunPelaporan === currentYear ? '#DA251C' : '#2C3E50',
                      py: 1,
                      minWidth: 80 + (periodYears.end - periodYears.start + 1) * 28,
                      bgcolor: kep.tahunPelaporan === currentYear ? 'rgba(218, 37, 28, 0.08)' : '#f8f9fa',
                      borderRight: '1px solid #e0e0e0',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                      {kep.nomorKep}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#86868b', display: 'block', fontSize: '0.65rem' }}>
                      Tahun {kep.tahunPelaporan}
                    </Typography>
                    {kep.tahunPelaporan === currentYear && (
                      <Chip label="Aktif" size="small" sx={{ height: 16, fontSize: '0.55rem', bgcolor: '#DA251C', color: 'white', mt: 0.25 }} />
                    )}
                    {/* Sub-header: period years */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                      {Array.from({ length: periodYears.end - periodYears.start + 1 }, (_, i) => periodYears.start + i).map(year => (
                        <Typography
                          key={year}
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem',
                            color: year === currentYear ? '#DA251C' : '#86868b',
                            fontWeight: year === currentYear ? 700 : 400,
                            minWidth: 24,
                            textAlign: 'center',
                          }}
                        >
                          {year.toString().slice(-2)}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(kepLoading || programsLoading) ? (
                <TableRow>
                  <TableCell colSpan={kepList.length + 1} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>Memuat data...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={kepList.length + 1} sx={{ textAlign: 'center', py: 4 }}>
                    <FolderOpenRounded sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {keyword ? 'Tidak ada program yang sesuai pencarian' : 'Belum ada data program'}
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
                      onClick={() => toggleExpand(program.nomor_program)}
                    >
                      {/* Program Name Cell */}
                      <TableCell
                        sx={{
                          py: 1.5,
                          borderLeft: '4px solid #DA251C',
                          borderRight: '2px solid #e0e0e0',
                          position: 'sticky',
                          left: 0,
                          bgcolor: '#f5f5f7',
                          zIndex: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small">
                            {expandedPrograms.has(program.nomor_program) ? <ExpandIcon /> : <CollapseIcon />}
                          </IconButton>
                          <FolderRounded sx={{ color: '#DA251C', fontSize: 20 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontWeight={600} sx={{ color: '#2C3E50', fontSize: '0.9rem' }}>
                                {program.nomor_program}
                              </Typography>
                              <Chip label={`${program.inisiatifs?.length || 0} Inisiatif`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                            </Box>
                            <Tooltip title={program.nama_program}>
                              <Typography
                                sx={{
                                  fontSize: '0.75rem',
                                  color: '#666',
                                  maxWidth: 220,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {program.nama_program}
                              </Typography>
                            </Tooltip>
                          </Box>
                          <Tooltip title="Lihat history nama program per KEP">
                            <IconButton
                              size="small"
                              onClick={(e) => showProgramHistory(program.nomor_program, e)}
                            >
                              <HistoryIcon sx={{ fontSize: 16, color: '#86868b' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>

                      {/* KEP Columns - Show Program Name per KEP */}
                      {kepList.map(kep => {
                        const versionedName = getVersionedName(kep, 'program', program.nomor_program);
                        const nameChanged = hasNameChanged(kep, 'program', program.nomor_program);

                        return (
                          <TableCell
                            key={`program-${program.id}-kep-${kep.id}`}
                            align="center"
                            sx={{
                              py: 1,
                              px: 1,
                              borderRight: '1px solid #e0e0e0',
                              bgcolor: kep.tahunPelaporan === currentYear ? 'rgba(218, 37, 28, 0.04)' : '#f5f5f7',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Tooltip title={versionedName || program.nama_program}>
                                <Typography
                                  sx={{
                                    fontSize: '0.7rem',
                                    color: nameChanged ? '#1565C0' : '#666',
                                    fontWeight: nameChanged ? 600 : 400,
                                    maxWidth: 150,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  {nameChanged && <CompareIcon sx={{ fontSize: 12, color: '#1565C0' }} />}
                                  {versionedName || program.nama_program}
                                </Typography>
                              </Tooltip>
                              {editMode && (
                                <IconButton
                                  size="small"
                                  onClick={() => openEditKepModal(kep, program)}
                                  sx={{
                                    p: 0.25,
                                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.16)' },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 12, color: '#1976D2' }} />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Inisiatif Rows */}
                    {expandedPrograms.has(program.nomor_program) && (program.inisiatifs ?? [])
                      .sort((a, b) => compareNomor(a.nomor_inisiatif, b.nomor_inisiatif))
                      .map((inisiatif) => (
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
                              cursor: 'pointer',
                            }}
                            onClick={() => showVersionDetail(inisiatif, program)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AssignmentRounded sx={{ color: '#666', fontSize: 16 }} />
                              <Box>
                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: '#333' }}>
                                  {inisiatif.nomor_inisiatif}
                                </Typography>
                                <Tooltip title={`${inisiatif.nama_inisiatif} - Klik untuk lihat versi per KEP`}>
                                  <Typography
                                    sx={{
                                      fontSize: '0.7rem',
                                      color: '#666',
                                      maxWidth: 180,
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

                          {/* KEP Columns */}
                          {kepList.map(kep => {
                            const periodYearsArray = Array.from(
                              { length: periodYears.end - periodYears.start + 1 },
                              (_, i) => periodYears.start + i
                            );
                            const versionedIniName = getVersionedName(kep, 'inisiatif', inisiatif.nomor_inisiatif);
                            const iniNameChanged = hasNameChanged(kep, 'inisiatif', inisiatif.nomor_inisiatif);

                            return (
                              <TableCell
                                key={`${inisiatif.id}-kep-${kep.id}`}
                                align="center"
                                sx={{
                                  py: 0.5,
                                  px: 1,
                                  borderRight: '1px solid #e0e0e0',
                                  bgcolor: kep.tahunPelaporan === currentYear ? 'rgba(218, 37, 28, 0.02)' : 'transparent',
                                }}
                              >
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  {/* Versioned Name with Change Indicator */}
                                  <Tooltip title={versionedIniName || inisiatif.nama_inisiatif}>
                                    <Typography
                                      sx={{
                                        fontSize: '0.6rem',
                                        color: iniNameChanged ? '#1565C0' : '#999',
                                        fontWeight: iniNameChanged ? 600 : 400,
                                        maxWidth: 120,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.25,
                                      }}
                                    >
                                      {iniNameChanged && <CompareIcon sx={{ fontSize: 10, color: '#1565C0' }} />}
                                      {versionedIniName || inisiatif.nama_inisiatif}
                                    </Typography>
                                  </Tooltip>

                                  {/* Progress Checkboxes */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 0.5,
                                      justifyContent: 'center',
                                      p: 0.5,
                                      borderRadius: 1,
                                      '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                                    }}
                                  >
                                    {periodYearsArray.map(year => {
                                      const status = getProgress(inisiatif.id, kep.id, year);
                                      return (
                                        <Tooltip
                                          key={year}
                                          title={
                                            editMode
                                              ? `Klik untuk ubah status tahun ${year}`
                                              : `${kep.nomorKep} - ${year}: ${status === 'none' ? 'Tidak ada' : status === 'planned' ? 'Direncanakan' : 'Terealisasi'}`
                                          }
                                        >
                                          <Box
                                            component="span"
                                            onClick={(e: React.MouseEvent) => {
                                              e.stopPropagation();
                                              console.log('Circle clicked:', { editMode, inisiatifId: inisiatif.id, kepId: kep.id, year, currentStatus: status });
                                              if (editMode) {
                                                console.log('Calling toggleProgress...');
                                                toggleProgress(inisiatif.id, kep.id, year);
                                              } else {
                                                setSnackbar({
                                                  open: true,
                                                  message: 'Klik tombol "Edit Progress" terlebih dahulu untuk mengubah status',
                                                  severity: 'warning',
                                                });
                                              }
                                            }}
                                            sx={{
                                              cursor: editMode ? 'pointer' : 'default',
                                              display: 'inline-flex',
                                              p: 0.25,
                                            }}
                                          >
                                            {renderStatus(status, editMode)}
                                          </Box>
                                        </Tooltip>
                                      );
                                    })}
                                  </Box>
                                </Box>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add KEP Dialog */}
      <Dialog open={addKepDialogOpen} onClose={() => setAddKepDialogOpen(false)}>
        <DialogTitle>Tambah KEP Baru</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nomor KEP"
              value={newKepNomor}
              onChange={(e) => setNewKepNomor(e.target.value)}
              placeholder="KEP-001/2025"
              helperText="Contoh: KEP-001/2025"
            />
            <TextField
              fullWidth
              label="Tahun Pelaporan"
              type="number"
              value={newKepYear}
              onChange={(e) => setNewKepYear(parseInt(e.target.value) || currentYear)}
              inputProps={{ min: periodYears.start, max: periodYears.end + 5 }}
            />
            <Alert severity="info">
              KEP baru akan menggunakan data program dan inisiatif yang sama.
              Anda dapat mengubah nama dan progress per KEP setelahnya.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddKepDialogOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleAddKep} sx={{ bgcolor: '#DA251C' }}>
            Tambah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version Detail Modal */}
      <Dialog open={versionDetailOpen} onClose={() => setVersionDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#DA251C', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            Detail {selectedKepForDetail?.nomorKep}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedInisiatifForDetail && selectedKepForDetail && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#86868b', mb: 0.5 }}>Nomor KEP:</Typography>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {selectedKepForDetail.nomorKep} (Tahun {selectedKepForDetail.tahunPelaporan})
              </Typography>

              <Typography variant="subtitle2" sx={{ color: '#86868b', mb: 0.5 }}>Program:</Typography>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {selectedInisiatifForDetail.programNama}
              </Typography>

              <Typography variant="subtitle2" sx={{ color: '#86868b', mb: 0.5 }}>Inisiatif:</Typography>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {selectedInisiatifForDetail.nomor} - {selectedInisiatifForDetail.nama}
              </Typography>

              <Alert severity="info" sx={{ mt: 2 }}>
                Nama yang ditampilkan adalah nama yang berlaku pada {selectedKepForDetail.nomorKep}.
                Nama dapat berbeda di KEP lainnya.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDetailOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Edit KEP Content Modal */}
      <Dialog
        open={editKepModalOpen}
        onClose={() => setEditKepModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976D2', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Edit Nama - {editingKep?.nomorKep}
          </Box>
          <IconButton onClick={() => setEditKepModalOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingProgram && editingKep && (
            <Box>
              {/* Program Name */}
              <Typography variant="subtitle2" sx={{ color: '#86868b', mb: 1 }}>
                Nama Program
              </Typography>
              <TextField
                fullWidth
                value={tempProgramName}
                onChange={(e) => setTempProgramName(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FolderRounded sx={{ color: '#DA251C' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Inisiatif Names */}
              <Typography variant="subtitle2" sx={{ color: '#86868b', mb: 1 }}>
                Nama Inisiatif ({editingProgram.inisiatifs.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {editingProgram.inisiatifs.map((ini) => (
                  <Box key={ini.nomorInisiatif} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 60, fontWeight: 600, color: '#666' }}>
                      {ini.nomorInisiatif}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={tempInisiatifNames.get(ini.nomorInisiatif) || ''}
                      onChange={(e) => {
                        const newNames = new Map(tempInisiatifNames);
                        newNames.set(ini.nomorInisiatif, e.target.value);
                        setTempInisiatifNames(newNames);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AssignmentRounded sx={{ color: '#666', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                Perubahan nama hanya berlaku untuk {editingKep.nomorKep}.
                KEP lain tidak akan terpengaruh.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditKepModalOpen(false)} sx={{ color: '#86868b' }}>
            Batal
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveKepContentChanges}
            sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
          >
            Simpan Perubahan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Program History Modal */}
      <Dialog
        open={programHistoryOpen}
        onClose={() => setProgramHistoryOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#673AB7', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            History Nama Program {selectedProgramForHistory}
          </Box>
          <IconButton onClick={() => setProgramHistoryOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedProgramForHistory && (
            <Box>
              {/* Program Name History */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                Nama Program per KEP
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
                {getNameHistory('program', selectedProgramForHistory).map((item, index, arr) => {
                  const prevItem = index > 0 ? arr[index - 1] : null;
                  const changed = prevItem && prevItem.name !== item.name;
                  return (
                    <Paper
                      key={item.kepId}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: changed ? '#1976D2' : '#e0e0e0',
                        borderWidth: changed ? 2 : 1,
                        bgcolor: changed ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={item.nomorKep}
                          size="small"
                          sx={{
                            bgcolor: changed ? '#1976D2' : '#e0e0e0',
                            color: changed ? 'white' : '#666',
                            fontWeight: 600,
                          }}
                        />
                        <Typography sx={{ flex: 1, fontWeight: changed ? 600 : 400 }}>
                          {item.name}
                        </Typography>
                        {changed && (
                          <Chip
                            icon={<CompareIcon sx={{ fontSize: 14 }} />}
                            label="Diubah"
                            size="small"
                            sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }}
                          />
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              {/* Inisiatif Name History */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                Nama Inisiatif per KEP
              </Typography>
              {(() => {
                const program = programs.find(p => p.nomor_program === selectedProgramForHistory);
                return (program?.inisiatifs || []).map(ini => {
                  const history = getNameHistory('inisiatif', ini.nomor_inisiatif);
                  const hasChanges = history.some((item, index, arr) => {
                    const prevItem = index > 0 ? arr[index - 1] : null;
                    return prevItem && prevItem.name !== item.name;
                  });

                  return (
                    <Box key={ini.nomor_inisiatif} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentRounded sx={{ fontSize: 16 }} />
                        {ini.nomor_inisiatif}
                        {hasChanges && (
                          <Chip label="Ada perubahan" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#E3F2FD', color: '#1565C0' }} />
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                        {history.map((item, index, arr) => {
                          const prevItem = index > 0 ? arr[index - 1] : null;
                          const changed = prevItem && prevItem.name !== item.name;
                          return (
                            <Paper
                              key={item.kepId}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                minWidth: 180,
                                borderColor: changed ? '#1976D2' : '#e0e0e0',
                                borderWidth: changed ? 2 : 1,
                              }}
                            >
                              <Typography variant="caption" sx={{ color: changed ? '#1976D2' : '#86868b', fontWeight: 600 }}>
                                {item.nomorKep}
                              </Typography>
                              <Tooltip title={item.name}>
                                <Typography
                                  sx={{
                                    fontSize: '0.8rem',
                                    fontWeight: changed ? 600 : 400,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.name}
                                </Typography>
                              </Tooltip>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                });
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgramHistoryOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

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

export default MonitoringRbsiPage;
