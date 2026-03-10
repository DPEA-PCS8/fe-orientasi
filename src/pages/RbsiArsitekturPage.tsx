import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Select,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Popover,
  Stack,
  type SelectChangeEvent,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  AccountTree as AccountTreeIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  FolderOpenRounded,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { getAllRbsi, getProgramsByRbsi } from '../api/rbsiApi';
import type { RbsiResponse, RbsiProgramResponse } from '../api/rbsiApi';
import {
  getAllAplikasi,
  createAplikasi,
  getArsitekturByRbsiId,
  createArsitektur,
  updateArsitektur,
  deleteArsitektur,
  getAllSubKategori,
  type AplikasiResponse,
  type ArsitekturRbsiResponse,
  type SubKategoriResponse,
} from '../api/arsitekturApi';
import { getAllSkpa, createSkpa, type SkpaData } from '../api/skpaApi';
import { SubKategoriModal } from '../components/modals';
import type { SubKategoriItem, SubKategoriCategory } from '../components/modals';

// ============ TYPES ============

interface ArsitekturRow {
  id: string;
  subKategoriCode: string;
  subKategoriName: string;
  subKategoriId?: string;
  portofolioBaseline: string;
  portofolioBaselineId?: string;
  portofolioTarget: string;
  portofolioTargetId?: string;
  action: string;
  yearStatuses: Record<number, string>;
  inisiatifId: string | null;
  inisiatifLabel: string;
  skpa: string;
  skpaId?: string;
}

type ActionType = 'Pembangunan Aplikasi Baru' | 'Pemeliharaan' | 'Pengakhiran' | 'Pengembangan' | '';
type YearStatus = 'Aktif' | 'Idle' | 'Diakhiri' | '';

const ACTION_OPTIONS: ActionType[] = ['Pembangunan Aplikasi Baru', 'Pemeliharaan', 'Pengakhiran', 'Pengembangan'];
const YEAR_STATUS_OPTIONS: YearStatus[] = ['Aktif', 'Idle', 'Diakhiri'];

// Aplikasi type for local state (using API response fields)
interface AplikasiItem {
  id: string;
  singkatan: string;
  namaLengkap: string;
  status?: string;
}

// SKPA type for local state (using API response fields)
interface SkpaItem {
  id: string;
  singkatan: string;
  namaLengkap: string;
}

// Helper to get color for sub kategori
const getSubKategoriColor = (code: string): string => {
  if (code.startsWith('CS')) return '#2196F3';
  if (code.startsWith('SP')) return '#4CAF50';
  if (code.startsWith('DA')) return '#FF9800';
  if (code.startsWith('DM')) return '#9C27B0';
  return '#666';
};

// Helper to get color for action
const getActionColor = (action: string): string => {
  switch (action) {
    case 'Pembangunan Aplikasi Baru':
      return '#4CAF50';
    case 'Pemeliharaan':
      return '#2196F3';
    case 'Pengakhiran':
      return '#f44336';
    case 'Pengembangan':
      return '#FF9800';
    default:
      return '#666';
  }
};

// Helper to get color for year status
const getYearStatusStyle = (status: string) => {
  switch (status) {
    case 'Aktif':
      return { bgcolor: '#E8F5E9', color: '#2E7D32', label: 'A' };
    case 'Idle':
      return { bgcolor: '#FFF3E0', color: '#E65100', label: 'I' };
    case 'Diakhiri':
      return { bgcolor: '#FFEBEE', color: '#C62828', label: 'D' };
    default:
      return { bgcolor: '#f5f5f5', color: '#999', label: '-' };
  }
};

// ============ COMPONENT ============

function RbsiArsitekturPage() {
  // RBSI State
  const [rbsiList, setRbsiList] = useState<RbsiResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [rbsiLoading, setRbsiLoading] = useState(false);
  const [periodeAnchorEl, setPeriodeAnchorEl] = useState<null | HTMLElement>(null);

  // Programs/Inisiatif for dropdown
  const [programs, setPrograms] = useState<RbsiProgramResponse[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  // Arsitektur data
  const [arsitekturData, setArsitekturData] = useState<ArsitekturRow[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Search & Filter
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState<{
    subKategori: string[];
    action: string[];
    skpa: string[];
  }>({ subKategori: [], action: [], skpa: [] });

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    field: string;
    anchorEl: HTMLElement | null;
  } | null>(null);

  // Sub Kategori state
  const [subKategoriCategories, setSubKategoriCategories] = useState<SubKategoriCategory[]>([]);
  const [subKategoriMap, setSubKategoriMap] = useState<Map<string, string>>(new Map()); // code -> id mapping
  const [subKategoriModalOpen, setSubKategoriModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Add row dialog
  const [addRowDialogOpen, setAddRowDialogOpen] = useState(false);
  const [newRow, setNewRow] = useState<Partial<ArsitekturRow>>({});

  // Aplikasi and SKPA lists (fetched from API)
  const [aplikasiList, setAplikasiList] = useState<AplikasiItem[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaItem[]>([]);

  // Add Aplikasi dialog
  const [addAplikasiDialogOpen, setAddAplikasiDialogOpen] = useState(false);
  const [newAplikasi, setNewAplikasi] = useState<{ singkatan: string; namaLengkap: string }>({ singkatan: '', namaLengkap: '' });

  // Add SKPA dialog
  const [addSkpaDialogOpen, setAddSkpaDialogOpen] = useState(false);
  const [newSkpa, setNewSkpa] = useState<{ singkatan: string; namaLengkap: string }>({ singkatan: '', namaLengkap: '' });

  // Inisiatif filter
  const [inisiatifFilterYear, setInisiatifFilterYear] = useState<number | null>(null);

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

  // Period years computed from selected RBSI
  const periodYears = useMemo(() => {
    if (!selectedRbsi) return [];
    const [startYear, endYear] = selectedRbsi.periode.split('-').map(Number);
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  }, [selectedRbsi]);

  // All inisiatifs flattened
  const allInisiatifs = useMemo(() => {
    const result: { id: string; label: string; program: string; tahun: number }[] = [];
    programs.forEach(program => {
      (program.inisiatifs || []).forEach(inisiatif => {
        result.push({
          id: inisiatif.id,
          label: `${inisiatif.nomor_inisiatif} - ${inisiatif.nama_inisiatif}`,
          program: program.nama_program,
          tahun: inisiatif.tahun,
        });
      });
    });
    return result;
  }, [programs]);

  // Filtered data
  const filteredData = useMemo(() => {
    return arsitekturData.filter(row => {
      // Search filter
      const searchMatch =
        !searchKeyword ||
        row.subKategoriCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        row.subKategoriName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        row.portofolioBaseline.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        row.portofolioTarget.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        row.action.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        row.skpa.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        row.inisiatifLabel.toLowerCase().includes(searchKeyword.toLowerCase());

      // Category filters
      const subKategoriMatch =
        activeFilters.subKategori.length === 0 ||
        activeFilters.subKategori.some(f => row.subKategoriCode.startsWith(f));

      const actionMatch =
        activeFilters.action.length === 0 || activeFilters.action.includes(row.action);

      const skpaMatch =
        activeFilters.skpa.length === 0 || activeFilters.skpa.includes(row.skpa);

      return searchMatch && subKategoriMatch && actionMatch && skpaMatch;
    });
  }, [arsitekturData, searchKeyword, activeFilters]);

  // Fetch RBSI list, Aplikasi, SKPA, SubKategori on mount
  useEffect(() => {
    fetchRbsiList();
    fetchAplikasiList();
    fetchSkpaList();
    fetchSubKategoriList();
  }, []);

  // Fetch programs and arsitektur data when RBSI changes
  useEffect(() => {
    if (selectedRbsi) {
      fetchPrograms(selectedRbsi.id);
      fetchArsitekturData(selectedRbsi.id);
      // Reset year filter when RBSI changes
      setInisiatifFilterYear(null);
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

  const fetchPrograms = async (rbsiId: string) => {
    setProgramsLoading(true);
    try {
      const response = await getProgramsByRbsi(rbsiId);
      setPrograms(response.data || []);
    } catch (error) {
      console.error('Failed to fetch programs:', error);
      setPrograms([]);
    } finally {
      setProgramsLoading(false);
    }
  };

  const fetchAplikasiList = async () => {
    try {
      const response = await getAllAplikasi();
      const items: AplikasiItem[] = (response.data || []).map((a: AplikasiResponse) => ({
        id: a.id,
        singkatan: a.kode_aplikasi,
        namaLengkap: a.nama_aplikasi,
        status: a.status_aplikasi,
      }));
      setAplikasiList(items);
    } catch (error) {
      console.error('Failed to fetch aplikasi list:', error);
    }
  };

  const fetchSkpaList = async () => {
    try {
      const response = await getAllSkpa();
      const items: SkpaItem[] = (response.data || []).map((s: SkpaData) => ({
        id: s.id,
        singkatan: s.kode_skpa,
        namaLengkap: s.nama_skpa,
      }));
      setSkpaList(items);
    } catch (error) {
      console.error('Failed to fetch skpa list:', error);
    }
  };

  const fetchSubKategoriList = async () => {
    try {
      const response = await getAllSubKategori();
      const items = response.data || [];

      // Build id map
      const idMap = new Map<string, string>();
      items.forEach((s: SubKategoriResponse) => {
        idMap.set(s.kode, s.id);
      });
      setSubKategoriMap(idMap);

      // Group by category_code - include id in SubKategoriItem
      const categoryGroups: Record<string, SubKategoriItem[]> = {};
      items.forEach((s: SubKategoriResponse) => {
        const catCode = s.category_code;
        if (!categoryGroups[catCode]) {
          categoryGroups[catCode] = [];
        }
        categoryGroups[catCode].push({ id: s.id, code: s.kode, name: s.nama });
      });

      // Always include all 4 hardcoded categories
      const hardcodedCategories: SubKategoriCategory[] = [
        { code: 'CS', name: 'Core System', color: '#2196F3', items: categoryGroups['CS'] || [] },
        { code: 'SP', name: 'Supporting System', color: '#4CAF50', items: categoryGroups['SP'] || [] },
        { code: 'DA', name: 'Data Analytics', color: '#FF9800', items: categoryGroups['DA'] || [] },
        { code: 'DM', name: 'Data Management', color: '#9C27B0', items: categoryGroups['DM'] || [] },
      ];

      setSubKategoriCategories(hardcodedCategories);
    } catch (error) {
      console.error('Failed to fetch sub kategori list:', error);
      // On error, still set the 4 empty categories
      setSubKategoriCategories([
        { code: 'CS', name: 'Core System', color: '#2196F3', items: [] },
        { code: 'SP', name: 'Supporting System', color: '#4CAF50', items: [] },
        { code: 'DA', name: 'Data Analytics', color: '#FF9800', items: [] },
        { code: 'DM', name: 'Data Management', color: '#9C27B0', items: [] },
      ]);
    }
  };

  const fetchArsitekturData = async (rbsiId: string) => {
    setProgramsLoading(true);
    try {
      const response = await getArsitekturByRbsiId(rbsiId);
      const rows: ArsitekturRow[] = (response.data || []).map((a: ArsitekturRbsiResponse) => {
        // Parse year_statuses JSON string
        let yearStatuses: Record<number, string> = {};
        try {
          if (a.year_statuses) {
            yearStatuses = JSON.parse(a.year_statuses);
          }
        } catch {
          yearStatuses = {};
        }

        return {
          id: a.id,
          subKategoriCode: a.sub_kategori?.kode || '',
          subKategoriName: a.sub_kategori?.nama || '',
          subKategoriId: a.sub_kategori?.id || '',
          portofolioBaseline: a.aplikasi_baseline?.kode_aplikasi || '',
          portofolioBaselineId: a.aplikasi_baseline?.id || '',
          portofolioTarget: a.aplikasi_target?.kode_aplikasi || '',
          portofolioTargetId: a.aplikasi_target?.id || '',
          action: a.action || '',
          yearStatuses,
          inisiatifId: a.inisiatif?.id || null,
          inisiatifLabel: a.inisiatif
            ? `${a.inisiatif.nomor_inisiatif} - ${a.inisiatif.nama_inisiatif}`
            : '',
          skpa: a.skpa?.kode_skpa || '',
          skpaId: a.skpa?.id || '',
        };
      });
      setArsitekturData(rows);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to fetch arsitektur data:', error);
      setArsitekturData([]);
    } finally {
      setProgramsLoading(false);
    }
  };

  const handleSubKategoriSelect = (item: SubKategoriItem, _category: SubKategoriCategory) => {
    console.log('SubKategori selected:', item);
    if (editingRowId) {
      setArsitekturData(prev =>
        prev.map(row =>
          row.id === editingRowId
            ? {
                ...row,
                subKategoriCode: item.code,
                subKategoriName: item.name,
                subKategoriId: item.id,
              }
            : row
        )
      );
      setHasChanges(true);
    } else if (addRowDialogOpen) {
      setNewRow(prev => ({
        ...prev,
        subKategoriCode: item.code,
        subKategoriName: item.name,
        subKategoriId: item.id,
      }));
    }
    setSubKategoriModalOpen(false);
    setEditingRowId(null);
  };

  // Handler for when SubKategori categories change (add/edit/delete from modal)
  const handleCategoriesChange = (updatedCategories: SubKategoriCategory[]) => {
    setSubKategoriCategories(updatedCategories);

    // Rebuild the subKategoriMap with updated IDs
    const newMap = new Map<string, string>();
    updatedCategories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.id) {
          newMap.set(item.code, item.id);
        }
      });
    });
    setSubKategoriMap(newMap);
  };

  const handleCellChange = (rowId: string, field: keyof ArsitekturRow, value: string) => {
    setArsitekturData(prev =>
      prev.map(row => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };
          // If changing inisiatifId, also update the label
          if (field === 'inisiatifId') {
            const ini = allInisiatifs.find(i => i.id === value);
            updated.inisiatifLabel = ini?.label || '';
          }
          return updated;
        }
        return row;
      })
    );
    setHasChanges(true);
    setEditingCell(null);
  };

  const handleYearStatusChange = (rowId: string, year: number, value: string) => {
    setArsitekturData(prev =>
      prev.map(row =>
        row.id === rowId
          ? { ...row, yearStatuses: { ...row.yearStatuses, [year]: value } }
          : row
      )
    );
    setHasChanges(true);
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const yearStatuses: Record<number, string> = {};
    periodYears.forEach(year => {
      yearStatuses[year] = '';
    });

    console.log('Adding new row, newRow state:', newRow);

    const newRowData: ArsitekturRow = {
      id: `new-${Date.now()}`,
      subKategoriCode: newRow.subKategoriCode || '',
      subKategoriName: newRow.subKategoriName || '',
      subKategoriId: newRow.subKategoriId || '',
      portofolioBaseline: newRow.portofolioBaseline || '',
      portofolioTarget: newRow.portofolioTarget || '',
      action: newRow.action || '',
      yearStatuses,
      inisiatifId: newRow.inisiatifId || null,
      inisiatifLabel: '',
      skpa: newRow.skpa || '',
    };

    console.log('New row data:', newRowData);

    setArsitekturData(prev => [...prev, newRowData]);
    setAddRowDialogOpen(false);
    setNewRow({});
    setHasChanges(true);
    setSnackbar({
      open: true,
      message: 'Baris baru berhasil ditambahkan',
      severity: 'success',
    });
  };

  const handleDeleteRow = async (rowId: string) => {
    try {
      // Only call API delete if it's a saved row (not a new row starting with 'new-')
      if (!rowId.startsWith('new-')) {
        await deleteArsitektur(rowId);
      }

      setArsitekturData(prev => prev.filter(row => row.id !== rowId));
      setSnackbar({
        open: true,
        message: 'Baris berhasil dihapus',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal menghapus baris',
        severity: 'error',
      });
    }
  };

  const handleSave = async () => {
    if (!selectedRbsi) return;

    try {
      // Save each row that needs to be created or updated
      for (const row of arsitekturData) {
        // Find the subKategori ID from categories
        const subKategoriId = row.subKategoriId || findSubKategoriId(row.subKategoriCode);
        if (!subKategoriId) {
          console.warn('SubKategori not found for code:', row.subKategoriCode);
          setSnackbar({
            open: true,
            message: `Sub Kategori tidak ditemukan untuk kode: ${row.subKategoriCode}`,
            severity: 'error',
          });
          return;
        }

        // Find aplikasi IDs
        const baselineApp = aplikasiList.find(a => a.singkatan === row.portofolioBaseline);
        const targetApp = aplikasiList.find(a => a.singkatan === row.portofolioTarget);
        const skpaItem = skpaList.find(s => s.singkatan === row.skpa);

        const request = {
          rbsi_id: selectedRbsi.id,
          sub_kategori_id: subKategoriId,
          aplikasi_baseline_id: baselineApp?.id || row.portofolioBaselineId || undefined,
          aplikasi_target_id: targetApp?.id || row.portofolioTargetId || undefined,
          action: row.action || undefined,
          year_statuses: JSON.stringify(row.yearStatuses),
          inisiatif_id: row.inisiatifId || undefined,
          skpa_id: skpaItem?.id || row.skpaId || undefined,
        };

        console.log('Saving arsitektur row:', row.id, request);

        // Check if this is an existing row (has real UUID) or new row
        if (row.id.startsWith('new-')) {
          // Create new
          const response = await createArsitektur(request);
          console.log('Created arsitektur:', response);
        } else {
          // Update existing
          const response = await updateArsitektur(row.id, request);
          console.log('Updated arsitektur:', response);
        }
      }

      // Refresh data
      await fetchArsitekturData(selectedRbsi.id);

      setSnackbar({
        open: true,
        message: 'Data berhasil disimpan',
        severity: 'success',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal menyimpan data',
        severity: 'error',
      });
    }
  };

  // Helper to find subKategori ID from local map
  const findSubKategoriId = (code: string): string | undefined => {
    return subKategoriMap.get(code);
  };

  // Add new Aplikasi
  const handleAddAplikasi = async () => {
    if (!newAplikasi.singkatan.trim() || !newAplikasi.namaLengkap.trim()) return;

    const exists = aplikasiList.some(a => a.singkatan.toUpperCase() === newAplikasi.singkatan.toUpperCase());
    if (exists) {
      setSnackbar({
        open: true,
        message: 'Singkatan aplikasi sudah ada',
        severity: 'warning',
      });
      return;
    }

    try {
      const response = await createAplikasi({
        kode_aplikasi: newAplikasi.singkatan.toUpperCase(),
        nama_aplikasi: newAplikasi.namaLengkap,
      });

      setAplikasiList(prev => [...prev, {
        id: response.data.id,
        singkatan: response.data.kode_aplikasi,
        namaLengkap: response.data.nama_aplikasi,
      }]);
      setNewAplikasi({ singkatan: '', namaLengkap: '' });
      setAddAplikasiDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Aplikasi baru berhasil ditambahkan',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal menambahkan aplikasi',
        severity: 'error',
      });
    }
  };

  // Add new SKPA
  const handleAddSkpa = async () => {
    if (!newSkpa.singkatan.trim() || !newSkpa.namaLengkap.trim()) return;

    const exists = skpaList.some(s => s.singkatan.toUpperCase() === newSkpa.singkatan.toUpperCase());
    if (exists) {
      setSnackbar({
        open: true,
        message: 'Singkatan SKPA sudah ada',
        severity: 'warning',
      });
      return;
    }

    try {
      const skpaData = await createSkpa({
        kode_skpa: newSkpa.singkatan.toUpperCase(),
        nama_skpa: newSkpa.namaLengkap,
      });

      setSkpaList(prev => [...prev, {
        id: skpaData.id,
        singkatan: skpaData.kode_skpa,
        namaLengkap: skpaData.nama_skpa,
      }]);
      setNewSkpa({ singkatan: '', namaLengkap: '' });
      setAddSkpaDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'SKPA baru berhasil ditambahkan',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Gagal menambahkan SKPA',
        severity: 'error',
      });
    }
  };

  const toggleFilter = (type: 'subKategori' | 'action' | 'skpa', value: string) => {
    setActiveFilters(prev => {
      const current = prev[type];
      if (current.includes(value)) {
        return { ...prev, [type]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [type]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setActiveFilters({ subKategori: [], action: [], skpa: [] });
    setSearchKeyword('');
  };

  const totalActiveFilters =
    activeFilters.subKategori.length + activeFilters.action.length + activeFilters.skpa.length;

  // Render inisiatif cell with year filter
  const renderInisiatifCell = (row: ArsitekturRow) => {
    const value = row.inisiatifId || '';
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === 'inisiatifId';

    // Filter inisiatifs locally based on selected year
    const filteredInisiatifs = inisiatifFilterYear
      ? allInisiatifs.filter(i => i.tahun === inisiatifFilterYear)
      : allInisiatifs;

    return (
      <>
        <Box
          onClick={(e) => setEditingCell({ rowId: row.id, field: 'inisiatifId', anchorEl: e.currentTarget })}
          sx={{
            cursor: 'pointer',
            py: 0.5,
            px: 1,
            borderRadius: '6px',
            '&:hover': { bgcolor: '#f5f5f5' },
            minHeight: 28,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {row.inisiatifLabel ? (
            <Typography sx={{ fontSize: '0.75rem', color: '#1d1d1f' }}>
              {row.inisiatifLabel.length > 30
                ? row.inisiatifLabel.substring(0, 30) + '...'
                : row.inisiatifLabel}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic' }}>
              Pilih inisiatif...
            </Typography>
          )}
        </Box>
        <Popover
          open={isEditing}
          anchorEl={editingCell?.anchorEl}
          onClose={() => {
            setEditingCell(null);
            setInisiatifFilterYear(null); // Reset filter when closing
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 350, maxHeight: 450 } }}
        >
          <Box sx={{ py: 1 }}>
            {/* Year Filter */}
            <Box sx={{ px: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block', fontWeight: 600 }}>
                Filter berdasarkan tahun
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label="Semua"
                  size="small"
                  onClick={() => setInisiatifFilterYear(null)}
                  sx={{
                    bgcolor: inisiatifFilterYear === null ? '#DA251C' : '#f5f5f5',
                    color: inisiatifFilterYear === null ? 'white' : '#666',
                    fontSize: '0.7rem',
                    height: 24,
                    '&:hover': { opacity: 0.8 },
                  }}
                />
                {periodYears.map(year => (
                  <Chip
                    key={year}
                    label={year}
                    size="small"
                    onClick={() => setInisiatifFilterYear(year)}
                    sx={{
                      bgcolor: inisiatifFilterYear === year ? '#DA251C' : '#f5f5f5',
                      color: inisiatifFilterYear === year ? 'white' : '#666',
                      fontSize: '0.7rem',
                      height: 24,
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Inisiatif List */}
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredInisiatifs.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#86868b' }}>
                    Tidak ada inisiatif untuk tahun {inisiatifFilterYear}
                  </Typography>
                </Box>
              ) : (
                filteredInisiatifs.map(inisiatif => (
                  <MenuItem
                    key={inisiatif.id}
                    selected={value === inisiatif.id}
                    onClick={() => handleCellChange(row.id, 'inisiatifId', inisiatif.id)}
                    sx={{ fontSize: '0.85rem', py: 1.5, px: 2 }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{inisiatif.label}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>
                        {inisiatif.program} • Tahun {inisiatif.tahun}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Box>

            {value && (
              <>
                <Box sx={{ borderTop: '1px solid #e0e0e0', my: 0.5 }} />
                <MenuItem
                  onClick={() => handleCellChange(row.id, 'inisiatifId', '')}
                  sx={{ fontSize: '0.85rem', py: 1, color: '#f44336', px: 2 }}
                >
                  Hapus
                </MenuItem>
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  };

  // Render editable cell with popover
  const renderEditableCell = (
    row: ArsitekturRow,
    field: string,
    value: string,
    options: string[],
    displayValue?: React.ReactNode
  ) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;

    return (
      <>
        <Box
          onClick={(e) => setEditingCell({ rowId: row.id, field, anchorEl: e.currentTarget })}
          sx={{
            cursor: 'pointer',
            py: 0.5,
            px: 1,
            borderRadius: '6px',
            '&:hover': { bgcolor: '#f5f5f5' },
            minHeight: 28,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {displayValue || (
            <Typography sx={{ fontSize: '0.8rem', color: value ? '#1d1d1f' : '#999' }}>
              {value || '-'}
            </Typography>
          )}
        </Box>
        <Popover
          open={isEditing}
          anchorEl={editingCell?.anchorEl}
          onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 180 } }}
        >
          <Box sx={{ py: 0.5 }}>
            {options.map(opt => (
              <MenuItem
                key={opt}
                selected={value === opt}
                onClick={() => handleCellChange(row.id, field as keyof ArsitekturRow, opt)}
                sx={{ fontSize: '0.85rem', py: 1 }}
              >
                {opt}
              </MenuItem>
            ))}
            {value && (
              <>
                <Box sx={{ borderTop: '1px solid #e0e0e0', my: 0.5 }} />
                <MenuItem
                  onClick={() => handleCellChange(row.id, field as keyof ArsitekturRow, '')}
                  sx={{ fontSize: '0.85rem', py: 1, color: '#f44336' }}
                >
                  Hapus
                </MenuItem>
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  };

  // Render Aplikasi cell with add option
  const renderAplikasiCell = (row: ArsitekturRow, field: 'portofolioBaseline' | 'portofolioTarget') => {
    const value = row[field];
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;
    const selectedApp = aplikasiList.find(a => a.singkatan === value);

    return (
      <>
        <Tooltip title={selectedApp ? `${selectedApp.singkatan}: ${selectedApp.namaLengkap}` : 'Klik untuk memilih'}>
          <Box
            onClick={(e) => setEditingCell({ rowId: row.id, field, anchorEl: e.currentTarget })}
            sx={{
              cursor: 'pointer',
              py: 0.5,
              px: 1,
              borderRadius: '6px',
              '&:hover': { bgcolor: '#f5f5f5' },
              minHeight: 28,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {value ? (
              <Chip label={value} size="small" sx={{ height: 24, fontSize: '0.75rem' }} />
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>-</Typography>
            )}
          </Box>
        </Tooltip>
        <Popover
          open={isEditing}
          anchorEl={editingCell?.anchorEl}
          onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 280, maxHeight: 350 } }}
        >
          <Box sx={{ py: 0.5 }}>
            <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
              {aplikasiList.map(app => (
                <MenuItem
                  key={app.singkatan}
                  selected={value === app.singkatan}
                  onClick={() => handleCellChange(row.id, field, app.singkatan)}
                  sx={{ fontSize: '0.85rem', py: 1 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{app.singkatan}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{app.namaLengkap}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Box>
            <Box sx={{ borderTop: '1px solid #e0e0e0', my: 0.5 }} />
            <MenuItem
              onClick={() => {
                setEditingCell(null);
                setAddAplikasiDialogOpen(true);
              }}
              sx={{ fontSize: '0.85rem', py: 1, color: '#DA251C', fontWeight: 600 }}
            >
              <AddIcon sx={{ fontSize: 18, mr: 1 }} />
              Tambah Aplikasi Baru
            </MenuItem>
            {value && (
              <>
                <Box sx={{ borderTop: '1px solid #e0e0e0', my: 0.5 }} />
                <MenuItem
                  onClick={() => handleCellChange(row.id, field, '')}
                  sx={{ fontSize: '0.85rem', py: 1, color: '#f44336' }}
                >
                  Hapus
                </MenuItem>
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  };

  // Render SKPA cell with add option
  const renderSkpaCell = (row: ArsitekturRow) => {
    const value = row.skpa;
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === 'skpa';
    const selectedSkpa = skpaList.find(s => s.singkatan === value);

    return (
      <>
        <Tooltip title={selectedSkpa ? `${selectedSkpa.singkatan}: ${selectedSkpa.namaLengkap}` : 'Klik untuk memilih'}>
          <Box
            onClick={(e) => setEditingCell({ rowId: row.id, field: 'skpa', anchorEl: e.currentTarget })}
            sx={{
              cursor: 'pointer',
              py: 0.5,
              px: 1,
              borderRadius: '6px',
              '&:hover': { bgcolor: '#f5f5f5' },
              minHeight: 28,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {value ? (
              <Chip label={value} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>-</Typography>
            )}
          </Box>
        </Tooltip>
        <Popover
          open={isEditing}
          anchorEl={editingCell?.anchorEl}
          onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 300, maxHeight: 350 } }}
        >
          <Box sx={{ py: 0.5 }}>
            <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
              {skpaList.map(skpa => (
                <MenuItem
                  key={skpa.singkatan}
                  selected={value === skpa.singkatan}
                  onClick={() => handleCellChange(row.id, 'skpa', skpa.singkatan)}
                  sx={{ fontSize: '0.85rem', py: 1 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{skpa.singkatan}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{skpa.namaLengkap}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Box>
            <Box sx={{ borderTop: '1px solid #e0e0e0', my: 0.5 }} />
            <MenuItem
              onClick={() => {
                setEditingCell(null);
                setAddSkpaDialogOpen(true);
              }}
              sx={{ fontSize: '0.85rem', py: 1, color: '#DA251C', fontWeight: 600 }}
            >
              <AddIcon sx={{ fontSize: 18, mr: 1 }} />
              Tambah SKPA Baru
            </MenuItem>
            {value && (
              <>
                <Box sx={{ borderTop: '1px solid #e0e0e0', my: 0.5 }} />
                <MenuItem
                  onClick={() => handleCellChange(row.id, 'skpa', '')}
                  sx={{ fontSize: '0.85rem', py: 1, color: '#f44336' }}
                >
                  Hapus
                </MenuItem>
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  };

  // Check if year status mismatches with actual aplikasi status
  const checkStatusMismatch = (row: ArsitekturRow, year: number): { isMismatch: boolean; actualStatus?: string } => {
    const yearStatus = row.yearStatuses[year];
    if (!yearStatus || !row.portofolioTargetId) return { isMismatch: false };

    // Only check current year - future/past years may intentionally differ
    const currentYear = new Date().getFullYear();
    if (year !== currentYear) return { isMismatch: false };

    const targetApp = aplikasiList.find(a => a.id === row.portofolioTargetId);
    if (!targetApp || !targetApp.status) return { isMismatch: false };

    // Compare yearStatus with actual aplikasi status
    const isMismatch = yearStatus !== targetApp.status;
    return { isMismatch, actualStatus: targetApp.status };
  };

  // Render year status cell
  const renderYearStatusCell = (row: ArsitekturRow, year: number) => {
    const status = row.yearStatuses[year] || '';
    const style = getYearStatusStyle(status);
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === `year-${year}`;
    const { isMismatch, actualStatus } = checkStatusMismatch(row, year);

    const tooltipContent = isMismatch
      ? `⚠️ Mismatch: RBSI = "${status}", Portofolio = "${actualStatus}"`
      : (status || 'Belum diatur');

    return (
      <>
        <Tooltip title={tooltipContent}>
          <Box
            onClick={(e) => setEditingCell({ rowId: row.id, field: `year-${year}`, anchorEl: e.currentTarget })}
            sx={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: style.bgcolor,
              color: style.color,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.1s ease',
              position: 'relative',
              border: isMismatch ? '2px solid #FF9800' : 'none',
              boxShadow: isMismatch ? '0 0 6px rgba(255, 152, 0, 0.5)' : 'none',
              '&:hover': { transform: 'scale(1.1)' },
              '&::after': isMismatch ? {
                content: '"⚠"',
                position: 'absolute',
                top: -6,
                right: -6,
                fontSize: '0.6rem',
                bgcolor: '#FF9800',
                color: '#fff',
                borderRadius: '50%',
                width: 12,
                height: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              } : {},
            }}
          >
            {style.label}
          </Box>
        </Tooltip>
        <Popover
          open={isEditing}
          anchorEl={editingCell?.anchorEl}
          onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }}
        >
          <Box sx={{ py: 0.5 }}>
            {YEAR_STATUS_OPTIONS.map(opt => {
              const optStyle = getYearStatusStyle(opt);
              return (
                <MenuItem
                  key={opt}
                  selected={status === opt}
                  onClick={() => handleYearStatusChange(row.id, year, opt)}
                  sx={{ fontSize: '0.85rem', py: 1, gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '4px',
                      bgcolor: optStyle.bgcolor,
                      color: optStyle.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  >
                    {optStyle.label}
                  </Box>
                  {opt}
                </MenuItem>
              );
            })}
            {status && (
              <>
                <Box sx={{ borderTop: '1px solid #e0e0e0', my: 0.5 }} />
                <MenuItem
                  onClick={() => handleYearStatusChange(row.id, year, '')}
                  sx={{ fontSize: '0.85rem', py: 1, color: '#f44336' }}
                >
                  Hapus
                </MenuItem>
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  };

  return (
    <Box
      sx={{
        p: 3.5,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(240, 245, 250, 0.3) 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <AccountTreeIcon sx={{ fontSize: 32, color: '#DA251C' }} />
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}
            >
              RBSI Arsitektur
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#86868b' }}>
            Kelola arsitektur portofolio aplikasi dalam roadmap RBSI
          </Typography>
        </Box>

        {/* RBSI (Periode) Dropdown */}
        <Box>
          <Button
            endIcon={rbsiLoading ? <CircularProgress size={16} /> : periodeAnchorEl ? <ArrowUpIcon /> : <ArrowDownIcon />}
            onClick={e => setPeriodeAnchorEl(e.currentTarget)}
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
            PaperProps={{ sx: { mt: 1, borderRadius: '12px', minWidth: '200px' } }}
          >
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
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Search and Filter */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 200 }}>
            <TextField
              placeholder="Cari arsitektur..."
              size="small"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              sx={{
                minWidth: 200,
                maxWidth: 280,
                flex: 1,
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

            <Button
              size="small"
              startIcon={<FilterIcon />}
              onClick={e => setFilterAnchorEl(e.currentTarget)}
              sx={{
                color: totalActiveFilters > 0 ? '#DA251C' : '#666',
                borderRadius: '8px',
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Filter
              {totalActiveFilters > 0 && (
                <Chip
                  label={totalActiveFilters}
                  size="small"
                  sx={{ ml: 0.5, height: 18, fontSize: '0.7rem', bgcolor: '#DA251C', color: 'white' }}
                />
              )}
            </Button>

            {totalActiveFilters > 0 && (
              <Button size="small" onClick={clearFilters} sx={{ color: '#666', textTransform: 'none', whiteSpace: 'nowrap' }}>
                Reset
              </Button>
            )}

            <Typography variant="body2" sx={{ color: '#86868b', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
              {filteredData.length} dari {arsitekturData.length} item
            </Typography>
          </Box>

          {/* Right: Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddRowDialogOpen(true)}
              disabled={!selectedRbsi}
              sx={{
                borderColor: '#DA251C',
                color: '#DA251C',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                '&:hover': { borderColor: '#B91C14', bgcolor: 'rgba(218, 37, 28, 0.04)' },
              }}
            >
              Tambah
            </Button>

            {hasChanges && (
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{
                  bgcolor: '#4CAF50',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#388E3C' },
                }}
              >
                Simpan
              </Button>
            )}
          </Box>
        </Box>

        {/* Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { borderRadius: '12px', p: 2, minWidth: 300 } }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Filter berdasarkan
          </Typography>

          {/* Sub Kategori Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block' }}>
              Sub Kategori
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {['CS', 'SP', 'DA', 'DM'].map(code => (
                <Chip
                  key={code}
                  label={code}
                  size="small"
                  onClick={() => toggleFilter('subKategori', code)}
                  sx={{
                    bgcolor: activeFilters.subKategori.includes(code) ? getSubKategoriColor(code) : '#f5f5f5',
                    color: activeFilters.subKategori.includes(code) ? 'white' : '#666',
                    fontWeight: 600,
                    '&:hover': { opacity: 0.8 },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Action Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block' }}>
              Action
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {ACTION_OPTIONS.map(action => (
                <Chip
                  key={action}
                  label={action.split(' ')[0]}
                  size="small"
                  onClick={() => toggleFilter('action', action)}
                  sx={{
                    bgcolor: activeFilters.action.includes(action) ? getActionColor(action) : '#f5f5f5',
                    color: activeFilters.action.includes(action) ? 'white' : '#666',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    '&:hover': { opacity: 0.8 },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* SKPA Filter */}
          <Box>
            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block' }}>
              SKPA
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {skpaList.slice(0, 6).map(skpa => (
                <Chip
                  key={skpa.singkatan}
                  label={skpa.singkatan}
                  size="small"
                  onClick={() => toggleFilter('skpa', skpa.singkatan)}
                  sx={{
                    bgcolor: activeFilters.skpa.includes(skpa.singkatan) ? '#1d1d1f' : '#f5f5f5',
                    color: activeFilters.skpa.includes(skpa.singkatan) ? 'white' : '#666',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    '&:hover': { opacity: 0.8 },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Popover>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', minHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 180, bgcolor: '#f8f9fa', position: 'sticky', left: 0, zIndex: 3 }}>
                  Sub Kategori
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 160, bgcolor: '#f8f9fa' }}>
                  Portofolio Aplikasi Baseline
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 160, bgcolor: '#f8f9fa' }}>
                  Portofolio Aplikasi Target
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 140, bgcolor: '#f8f9fa' }}>
                  Action
                </TableCell>
                {periodYears.map(year => (
                  <TableCell key={year} align="center" sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 60, bgcolor: '#f8f9fa' }}>
                    {year}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 220, bgcolor: '#f8f9fa' }}>
                  Inisiatif pada Roadmap RBSI OJK
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 80, bgcolor: '#f8f9fa' }}>
                  SKPA
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2C3E50', py: 1.5, minWidth: 50, bgcolor: '#f8f9fa' }}>

                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!selectedRbsi ? (
                <TableRow>
                  <TableCell colSpan={8 + periodYears.length} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#86868b' }}>
                      Pilih periode RBSI untuk melihat data arsitektur
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : programsLoading ? (
                <TableRow>
                  <TableCell colSpan={8 + periodYears.length} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={32} sx={{ color: '#DA251C' }} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8 + periodYears.length} sx={{ textAlign: 'center', py: 4 }}>
                    <FolderOpenRounded sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {arsitekturData.length === 0 ? 'Belum ada data arsitektur' : 'Tidak ada data yang sesuai filter'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map(row => (
                  <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                    {/* Sub Kategori */}
                    <TableCell sx={{ py: 1, position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 },
                        }}
                        onClick={() => {
                          setEditingRowId(row.id);
                          setSubKategoriModalOpen(true);
                        }}
                      >
                        <Chip
                          label={row.subKategoriCode}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            bgcolor: getSubKategoriColor(row.subKategoriCode),
                            color: 'white',
                            height: 22,
                          }}
                        />
                        <Typography sx={{ fontSize: '0.8rem', color: '#1d1d1f' }}>
                          {row.subKategoriName || '-'}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Baseline */}
                    <TableCell sx={{ py: 1 }}>
                      {renderAplikasiCell(row, 'portofolioBaseline')}
                    </TableCell>

                    {/* Target */}
                    <TableCell sx={{ py: 1 }}>
                      {renderAplikasiCell(row, 'portofolioTarget')}
                    </TableCell>

                    {/* Action */}
                    <TableCell sx={{ py: 1 }}>
                      {renderEditableCell(
                        row,
                        'action',
                        row.action,
                        ACTION_OPTIONS,
                        row.action && (
                          <Chip
                            label={row.action.split(' ')[0]}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              bgcolor: `${getActionColor(row.action)}15`,
                              color: getActionColor(row.action),
                              fontWeight: 600,
                            }}
                          />
                        )
                      )}
                    </TableCell>

                    {/* Year Status Columns */}
                    {periodYears.map(year => (
                      <TableCell key={year} align="center" sx={{ py: 1 }}>
                        {renderYearStatusCell(row, year)}
                      </TableCell>
                    ))}

                    {/* Inisiatif */}
                    <TableCell sx={{ py: 1 }}>
                      {renderInisiatifCell(row)}
                    </TableCell>

                    {/* SKPA */}
                    <TableCell sx={{ py: 1 }}>
                      {renderSkpaCell(row)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ py: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRow(row.id)}
                        sx={{ color: '#ccc', '&:hover': { color: '#f44336' } }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Sub Kategori Modal */}
      <SubKategoriModal
        open={subKategoriModalOpen}
        onClose={() => {
          setSubKategoriModalOpen(false);
          setEditingRowId(null);
        }}
        onSelect={handleSubKategoriSelect}
        selectedValue={
          editingRowId
            ? (() => {
                const row = arsitekturData.find(r => r.id === editingRowId);
                return row ? `${row.subKategoriCode}: ${row.subKategoriName}` : undefined;
              })()
            : newRow.subKategoriCode && newRow.subKategoriName
              ? `${newRow.subKategoriCode}: ${newRow.subKategoriName}`
              : undefined
        }
        categories={subKategoriCategories}
        onCategoriesChange={handleCategoriesChange}
      />

      {/* Add Row Dialog */}
      <Dialog
        open={addRowDialogOpen}
        onClose={() => {
          setAddRowDialogOpen(false);
          setNewRow({});
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1d1d1f' }}>Tambah Baris Arsitektur</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#86868b', mb: 0.5, display: 'block' }}>
                Sub Kategori *
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setSubKategoriModalOpen(true)}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  color: newRow.subKategoriCode ? '#1d1d1f' : '#86868b',
                  borderColor: '#e0e0e0',
                  py: 1.5,
                }}
              >
                {newRow.subKategoriCode
                  ? `${newRow.subKategoriCode}: ${newRow.subKategoriName}`
                  : 'Pilih Sub Kategori...'}
              </Button>
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel>Portofolio Baseline</InputLabel>
              <Select
                value={newRow.portofolioBaseline || ''}
                label="Portofolio Baseline"
                onChange={(e: SelectChangeEvent) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddAplikasiDialogOpen(true);
                  } else {
                    setNewRow(prev => ({ ...prev, portofolioBaseline: e.target.value }));
                  }
                }}
              >
                {aplikasiList.map(app => (
                  <MenuItem key={app.singkatan} value={app.singkatan}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{app.singkatan}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{app.namaLengkap}</Typography>
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem value="__ADD_NEW__" sx={{ color: '#DA251C', fontWeight: 600, borderTop: '1px solid #e0e0e0', mt: 0.5 }}>
                  <AddIcon sx={{ fontSize: 18, mr: 1 }} />
                  Tambah Aplikasi Baru
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Portofolio Target</InputLabel>
              <Select
                value={newRow.portofolioTarget || ''}
                label="Portofolio Target"
                onChange={(e: SelectChangeEvent) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddAplikasiDialogOpen(true);
                  } else {
                    setNewRow(prev => ({ ...prev, portofolioTarget: e.target.value }));
                  }
                }}
              >
                {aplikasiList.map(app => (
                  <MenuItem key={app.singkatan} value={app.singkatan}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{app.singkatan}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{app.namaLengkap}</Typography>
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem value="__ADD_NEW__" sx={{ color: '#DA251C', fontWeight: 600, borderTop: '1px solid #e0e0e0', mt: 0.5 }}>
                  <AddIcon sx={{ fontSize: 18, mr: 1 }} />
                  Tambah Aplikasi Baru
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={newRow.action || ''}
                label="Action"
                onChange={(e: SelectChangeEvent) => setNewRow(prev => ({ ...prev, action: e.target.value }))}
              >
                {ACTION_OPTIONS.map(action => (
                  <MenuItem key={action} value={action}>{action}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>SKPA</InputLabel>
              <Select
                value={newRow.skpa || ''}
                label="SKPA"
                onChange={(e: SelectChangeEvent) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setAddSkpaDialogOpen(true);
                  } else {
                    setNewRow(prev => ({ ...prev, skpa: e.target.value }));
                  }
                }}
              >
                {skpaList.map(skpa => (
                  <MenuItem key={skpa.singkatan} value={skpa.singkatan}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{skpa.singkatan}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{skpa.namaLengkap}</Typography>
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem value="__ADD_NEW__" sx={{ color: '#DA251C', fontWeight: 600, borderTop: '1px solid #e0e0e0', mt: 0.5 }}>
                  <AddIcon sx={{ fontSize: 18, mr: 1 }} />
                  Tambah SKPA Baru
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddRowDialogOpen(false)} sx={{ color: '#86868b' }}>
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleAddRow}
            disabled={!newRow.subKategoriCode}
            sx={{ bgcolor: '#DA251C', '&:hover': { bgcolor: '#B91C14' } }}
          >
            Tambah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Aplikasi Dialog */}
      <Dialog
        open={addAplikasiDialogOpen}
        onClose={() => {
          setAddAplikasiDialogOpen(false);
          setNewAplikasi({ singkatan: '', namaLengkap: '' });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1d1d1f', bgcolor: 'white' }}>
          Tambah Aplikasi Baru
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'white' }}>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Singkatan / Nama Aplikasi"
              placeholder="Contoh: SIPENA"
              value={newAplikasi.singkatan}
              onChange={e => setNewAplikasi(prev => ({ ...prev, singkatan: e.target.value.toUpperCase() }))}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Kepanjangan / Nama Lengkap"
              placeholder="Contoh: Sistem Informasi Pelaporan dan Analisis"
              value={newAplikasi.namaLengkap}
              onChange={e => setNewAplikasi(prev => ({ ...prev, namaLengkap: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'white' }}>
          <Button
            onClick={() => {
              setAddAplikasiDialogOpen(false);
              setNewAplikasi({ singkatan: '', namaLengkap: '' });
            }}
            sx={{ color: '#86868b' }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleAddAplikasi}
            disabled={!newAplikasi.singkatan.trim() || !newAplikasi.namaLengkap.trim()}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #B91C14 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #B91C14 0%, #8B1510 100%)' },
            }}
          >
            Tambah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add SKPA Dialog */}
      <Dialog
        open={addSkpaDialogOpen}
        onClose={() => {
          setAddSkpaDialogOpen(false);
          setNewSkpa({ singkatan: '', namaLengkap: '' });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1d1d1f', bgcolor: 'white' }}>
          Tambah SKPA Baru
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'white' }}>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Singkatan SKPA"
              placeholder="Contoh: DPK"
              value={newSkpa.singkatan}
              onChange={e => setNewSkpa(prev => ({ ...prev, singkatan: e.target.value.toUpperCase() }))}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Nama Panjang Departemen"
              placeholder="Contoh: Departemen Pengawasan Konglomerasi"
              value={newSkpa.namaLengkap}
              onChange={e => setNewSkpa(prev => ({ ...prev, namaLengkap: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'white' }}>
          <Button
            onClick={() => {
              setAddSkpaDialogOpen(false);
              setNewSkpa({ singkatan: '', namaLengkap: '' });
            }}
            sx={{ color: '#86868b' }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSkpa}
            disabled={!newSkpa.singkatan.trim() || !newSkpa.namaLengkap.trim()}
            sx={{
              background: 'linear-gradient(135deg, #DA251C 0%, #B91C14 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #B91C14 0%, #8B1510 100%)' },
            }}
          >
            Tambah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RbsiArsitekturPage;
