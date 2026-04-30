import { useState, useEffect, useMemo, useCallback } from 'react';
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
  TextField,
  InputAdornment,
  Popover,
  Stack,
  Divider,
  Autocomplete,
  InputBase,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  AccountTree as AccountTreeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FolderOpenRounded,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sync as SyncIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  CompareArrows as CompareArrowsIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import {
  getAllRbsi,
  getInisiatifGroupsDropdown,
  type RbsiResponse,
} from '../api/rbsiApi';
import { getAllAplikasi, getAllSubKategori } from '../api/arsitekturApi';
import {
  createAplikasi,
  getArsitekturByRbsiId,
  createArsitektur,
  updateArsitektur,
  deleteArsitektur,
  updateArsitekturData,
  getArsitekturSnapshots,
  type AplikasiResponse,
  type ArsitekturRbsiResponse,
  type SnapshotGroup,
  type SnapshotArsitekturRbsiResponse,
  type SubKategoriResponse,
} from '../api/arsitekturApi';
import { getAllSkpa, createSkpa, type SkpaData } from '../api/skpaApi';

// ============ TYPES ============

interface ArsitekturRow {
  id: string;
  subKategoriId?: string;
  subKategoriCode: string;
  subKategoriName: string;
  aplikasiId?: string;
  aplikasiKode: string;
  aplikasiNama: string;
  portofolioBaselineId?: string;
  portofolioBaseline: string;
  portofolioTargetId?: string;
  portofolioTarget: string;
  action: string;
  yearStatuses: Record<number, string>;
  inisiatifGroupId: string | null;
  inisiatifGroupLabel: string;
  skpa: string;
  skpaId?: string;
  keterangan: string;
}

interface FlatInisiatif {
  id: string;
  nama_inisiatif: string;
  nama_program: string;
  nomor_program: string;
  nomor_inisiatif: string;
}

interface GroupedInisiatif {
  programNomor: string;
  programNama: string;
  items: FlatInisiatif[];
}

interface AplikasiItem {
  id: string;
  singkatan: string;
  namaLengkap: string;
  status?: string;
  subKategoriId?: string;
  subKategoriKode?: string;
  subKategoriNama?: string;
  skpaId?: string;
  skpaKode?: string;
}

interface SkpaItem {
  id: string;
  singkatan: string;
  namaLengkap: string;
}

type ActionType = 'Pembangunan Aplikasi Baru' | 'Pemeliharaan' | 'Pengakhiran' | 'Pengembangan' | '';
type YearStatus = 'Aktif' | 'Idle' | 'Diakhiri' | '';
type EditField = 'portofolioBaseline' | 'portofolioTarget' | 'action' | 'skpa' | 'inisiatifGroupId' | `year-${number}` | 'subKategori' | 'keterangan';

interface EditingCell {
  rowId: string;
  field: EditField;
  anchorEl: HTMLElement;
  search?: string;
}

interface RowFormState {
  aplikasiId?: string;
  aplikasiKode?: string;
  aplikasiNama?: string;
  subKategoriId?: string;
  subKategoriCode?: string;
  subKategoriName?: string;
  portofolioBaselineId?: string;
  portofolioBaseline?: string;
  portofolioTargetId?: string;
  portofolioTarget?: string;
  skpaId?: string;
  skpa?: string;
  action?: string;
  inisiatifGroupId?: string;
  yearStatuses?: Record<number, string>;
  keterangan?: string;
}

type SnackbarState = { open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' };

const ACTION_OPTIONS: ActionType[] = ['Pembangunan Aplikasi Baru', 'Pemeliharaan', 'Pengakhiran', 'Pengembangan'];
const YEAR_STATUS_OPTIONS: YearStatus[] = ['Aktif', 'Idle', 'Diakhiri'];

// ============ COLOR HELPERS ============

const getSubKategoriColor = (code: string) => {
  if (code.startsWith('CS')) return '#2196F3';
  if (code.startsWith('SP')) return '#4CAF50';
  if (code.startsWith('DA')) return '#FF9800';
  if (code.startsWith('DM')) return '#9C27B0';
  return '#666';
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'Pembangunan Aplikasi Baru': return '#4CAF50';
    case 'Pemeliharaan': return '#2196F3';
    case 'Pengakhiran': return '#f44336';
    case 'Pengembangan': return '#FF9800';
    default: return '#666';
  }
};

const getYearStatusStyle = (status: string) => {
  switch (status) {
    case 'Aktif':    return { bgcolor: '#E8F5E9', color: '#2E7D32', label: 'A' };
    case 'Idle':     return { bgcolor: '#FFF3E0', color: '#E65100', label: 'I' };
    case 'Diakhiri': return { bgcolor: '#FFEBEE', color: '#C62828', label: 'D' };
    default:         return { bgcolor: '#f5f5f5', color: '#bbb',    label: '·' };
  }
};

// ============ MAPPER ============

function mapApiToRow(a: ArsitekturRbsiResponse): ArsitekturRow {
  let yearStatuses: Record<number, string> = {};
  try { if (a.year_statuses) yearStatuses = JSON.parse(a.year_statuses); } catch { /* ignore */ }
  return {
    id: a.id,
    subKategoriId: a.sub_kategori?.id,
    subKategoriCode: a.sub_kategori?.kode || '',
    subKategoriName: a.sub_kategori?.nama || '',
    aplikasiId: a.aplikasi?.id,
    aplikasiKode: a.aplikasi?.kode_aplikasi || '',
    aplikasiNama: a.aplikasi?.nama_aplikasi || '',
    portofolioBaselineId: '',
    portofolioBaseline: a.aplikasi_baseline || '',
    portofolioTargetId: '',
    portofolioTarget: a.aplikasi_target || '',
    action: a.action || '',
    yearStatuses,
    inisiatifGroupId: a.inisiatif_group?.id || null,
    inisiatifGroupLabel: a.inisiatif_group?.nama_inisiatif || '',
    skpa: a.skpa?.kode_skpa || '',
    skpaId: a.skpa?.id,
    keterangan: a.keterangan || '',
  };
}

// ============ INISIATIF SEARCH POPOVER (inline table cell) ============

interface InisiatifPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  groups: GroupedInisiatif[];
  selectedId: string | null;
  onSelect: (item: FlatInisiatif) => void;
  onClear: () => void;
  onClose: () => void;
}

function InisiatifPopover({ open, anchorEl, groups, selectedId, onSelect, onClear, onClose }: InisiatifPopoverProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo<GroupedInisiatif[]>(() => {
    if (!search.trim()) return groups;
    const kw = search.toLowerCase();
    return groups
      .map(g => ({
        ...g,
        items: g.items.filter(
          it =>
            it.nama_inisiatif.toLowerCase().includes(kw) ||
            it.nomor_inisiatif.toLowerCase().includes(kw) ||
            g.programNama.toLowerCase().includes(kw) ||
            g.programNomor.toLowerCase().includes(kw),
        ),
      }))
      .filter(g => g.items.length > 0);
  }, [groups, search]);

  const totalItems = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        transition: { onExited: () => setSearch('') },
        paper: { sx: { borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: 400, mt: 0.5, overflow: 'hidden' } },
      }}
    >
      {/* Search bar */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon sx={{ fontSize: 18, color: '#aaa' }} />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Cari nama atau nomor inisiatif..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ fontSize: '0.875rem' }}
        />
        {search && (
          <IconButton size="small" onClick={() => setSearch('')} sx={{ color: '#aaa' }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Results */}
      <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
        {totalItems === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 32, color: '#ddd', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
              {groups.length === 0 ? 'Tidak ada inisiatif untuk periode ini' : 'Tidak ditemukan'}
            </Typography>
          </Box>
        ) : (
          filtered.map(group => (
            <Box key={group.programNomor}>
              <Box sx={{ px: 2, py: 0.75, bgcolor: '#f8f8f8', borderBottom: '1px solid #ececec', position: 'sticky', top: 0, zIndex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#DA251C', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  {group.programNomor} — {group.programNama}
                </Typography>
              </Box>
              {group.items.map(item => {
                const isSelected = selectedId === item.id;
                return (
                  <Box
                    key={item.id}
                    onClick={() => { onSelect(item); onClose(); }}
                    sx={{
                      px: 2, py: 1.1, cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid #DA251C' : '3px solid transparent',
                      bgcolor: isSelected ? 'rgba(218,37,28,0.04)' : 'transparent',
                      '&:hover': { bgcolor: isSelected ? 'rgba(218,37,28,0.07)' : 'rgba(0,0,0,0.03)', borderLeftColor: '#DA251C' },
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#DA251C', flexShrink: 0, lineHeight: 1.5 }}>
                        {item.nomor_inisiatif}
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.4, color: '#1d1d1f' }}>
                        {item.nama_inisiatif}
                      </Typography>
                    </Box>
                    {isSelected && <CheckCircleIcon sx={{ fontSize: 18, color: '#DA251C', flexShrink: 0 }} />}
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2, py: 0.75, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.7rem', color: '#bbb' }}>{totalItems} inisiatif</Typography>
        {selectedId && (
          <Button size="small" color="error" onClick={() => { onClear(); onClose(); }} sx={{ fontSize: '0.7rem', minWidth: 0, py: 0.25 }}>
            Hapus pilihan
          </Button>
        )}
      </Box>
    </Popover>
  );
}


// ============ MAIN COMPONENT ============

function RbsiArsitekturPage() {
  const [rbsiList, setRbsiList]               = useState<RbsiResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi]       = useState<RbsiResponse | null>(null);
  const [rbsiLoading, setRbsiLoading]         = useState(false);
  const [periodeAnchorEl, setPeriodeAnchorEl] = useState<null | HTMLElement>(null);

  const [inisiatifGroups, setInisiatifGroups] = useState<FlatInisiatif[]>([]);

  const [arsitekturData, setArsitekturData] = useState<ArsitekturRow[]>([]);
  const [dataLoading, setDataLoading]       = useState(false);

  const [searchKeyword, setSearchKeyword]   = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters]   = useState<{ subKategori: string[]; action: string[]; skpa: string[] }>({
    subKategori: [], action: [], skpa: [],
  });

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [editingRowId, setEditingRowId]   = useState<string | null>(null);
  const [rowForm, setRowForm]             = useState<RowFormState>({});

  const [aplikasiList, setAplikasiList]         = useState<AplikasiItem[]>([]);
  const [skpaList, setSkpaList]                 = useState<SkpaItem[]>([]);
  const [subKategoriList, setSubKategoriList]   = useState<SubKategoriResponse[]>([]);

  const [addAplikasiDialogOpen, setAddAplikasiDialogOpen] = useState(false);
  const [newAplikasi, setNewAplikasi] = useState({ singkatan: '', namaLengkap: '' });

  const [addSkpaDialogOpen, setAddSkpaDialogOpen] = useState(false);
  const [newSkpa, setNewSkpa] = useState({ singkatan: '', namaLengkap: '' });

  const [updatingData, setUpdatingData]               = useState(false);
  const [snapshotsDialogOpen, setSnapshotsDialogOpen] = useState(false);
  const [snapshots, setSnapshots]                     = useState<SnapshotGroup[]>([]);
  const [snapshotsLoading, setSnapshotsLoading]       = useState(false);
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string | null>(null);
  const [compareSnapshotDate, setCompareSnapshotDate]   = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });

  const periodYears = useMemo<number[]>(() => {
    if (!selectedRbsi) return [];
    const [start, end] = selectedRbsi.periode.split('-').map(Number);
    const years: number[] = [];
    for (let y = start; y <= end; y++) years.push(y);
    return years;
  }, [selectedRbsi]);

  const groupedInisiatif = useMemo<GroupedInisiatif[]>(() => {
    const map = new Map<string, GroupedInisiatif>();
    for (const ig of inisiatifGroups) {
      const key = ig.nomor_program;
      if (!map.has(key)) {
        map.set(key, { programNomor: ig.nomor_program, programNama: ig.nama_program, items: [] });
      }
      map.get(key)!.items.push(ig);
    }
    return Array.from(map.values());
  }, [inisiatifGroups]);

  const filteredData = useMemo<ArsitekturRow[]>(() => {
    return arsitekturData.filter(row => {
      const kw = searchKeyword.trim().toLowerCase();
      const s = (v: unknown) => (v == null ? '' : String(v)).toLowerCase();
      const searchMatch = !kw ||
        s(row.subKategoriCode).includes(kw) ||
        s(row.subKategoriName).includes(kw) ||
        s(row.aplikasiKode).includes(kw) ||
        s(row.aplikasiNama).includes(kw) ||
        s(row.portofolioBaseline).includes(kw) ||
        s(row.portofolioTarget).includes(kw) ||
        s(row.action).includes(kw) ||
        s(row.skpa).includes(kw) ||
        s(row.inisiatifGroupLabel).includes(kw) ||
        s(row.keterangan).includes(kw);

      const subKategoriMatch = activeFilters.subKategori.length === 0 ||
        activeFilters.subKategori.some(f => s(row.subKategoriCode).startsWith(f.toLowerCase()));
      const actionMatch = activeFilters.action.length === 0 || activeFilters.action.includes(row.action);
      const skpaMatch   = activeFilters.skpa.length === 0   || activeFilters.skpa.includes(row.skpa);

      return searchMatch && subKategoriMatch && actionMatch && skpaMatch;
    });
  }, [arsitekturData, searchKeyword, activeFilters]);

  // ============ EFFECTS ============

  useEffect(() => {
    fetchRbsiList();
    fetchAplikasiList();
    fetchSkpaList();
    fetchSubKategoriList();
  }, []);

  useEffect(() => {
    if (selectedRbsi) {
      fetchArsitekturData(selectedRbsi.id);
      fetchInisiatifGroups(selectedRbsi.id);
    }
  }, [selectedRbsi]);

  // ============ FETCH ============

  const fetchRbsiList = async () => {
    setRbsiLoading(true);
    try {
      const res = await getAllRbsi();
      setRbsiList(res.data);
      if (res.data.length > 0 && !selectedRbsi) setSelectedRbsi(res.data[0]);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Gagal mengambil data RBSI', 'error');
    } finally {
      setRbsiLoading(false);
    }
  };

  const fetchArsitekturData = async (rbsiId: string) => {
    setDataLoading(true);
    try {
      const res = await getArsitekturByRbsiId(rbsiId);
      setArsitekturData((res.data || []).map(mapApiToRow));
    } catch {
      setArsitekturData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchInisiatifGroups = async (rbsiId: string) => {
    try {
      const res = await getInisiatifGroupsDropdown(rbsiId);
      const flat: FlatInisiatif[] = [];
      for (const pg of res.data || []) {
        const programNomor = pg.program_group_nomor ?? pg.programGroupNomor ?? '';
        const programNama  = pg.program_group_name  ?? pg.programGroupName  ?? '';
        const items = pg.inisiatif_groups ?? pg.inisiatifGroups ?? [];
        for (const ig of items) {
          flat.push({
            id:              ig.inisiatif_group_id    ?? ig.inisiatifGroupId    ?? '',
            nama_inisiatif:  ig.inisiatif_group_name  ?? ig.inisiatifGroupName  ?? '',
            nama_program:    programNama,
            nomor_program:   programNomor,
            nomor_inisiatif: ig.inisiatif_group_nomor ?? ig.inisiatifGroupNomor ?? '',
          });
        }
      }
      setInisiatifGroups(flat);
    } catch {
      setInisiatifGroups([]);
    }
  };

  const fetchAplikasiList = async () => {
    try {
      const res = await getAllAplikasi();
      setAplikasiList((res.data || []).map((a: AplikasiResponse) => ({
        id: a.id,
        singkatan: a.kode_aplikasi,
        namaLengkap: a.nama_aplikasi,
        status: a.status_aplikasi,
        subKategoriId: a.sub_kategori?.id,
        subKategoriKode: a.sub_kategori?.kode,
        subKategoriNama: a.sub_kategori?.nama,
        skpaId: a.skpa?.id,
        skpaKode: a.skpa?.kode_skpa,
      })));
    } catch { /* silent */ }
  };

  const fetchSkpaList = async () => {
    try {
      const res = await getAllSkpa();
      setSkpaList((res.data || []).map((s: SkpaData) => ({ id: s.id, singkatan: s.kode_skpa, namaLengkap: s.nama_skpa })));
    } catch { /* silent */ }
  };

  const fetchSubKategoriList = async () => {
    try {
      const res = await getAllSubKategori();
      setSubKategoriList(res.data || []);
    } catch { /* silent */ }
  };

  // ============ CELL CHANGE HELPERS ============

  const handleCellChange = useCallback((rowId: string, field: keyof ArsitekturRow, value: string) => {
    setArsitekturData(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const updated = { ...row, [field]: value };
      if (field === 'inisiatifGroupId') {
        updated.inisiatifGroupLabel = inisiatifGroups.find(g => g.id === value)?.nama_inisiatif || '';
      }
      return updated;
    }));
    setEditingCell(null);
  }, [inisiatifGroups]);

  const handleYearStatusChange = useCallback((rowId: string, year: number, value: string) => {
    setArsitekturData(prev => prev.map(row =>
      row.id === rowId ? { ...row, yearStatuses: { ...row.yearStatuses, [year]: value } } : row,
    ));
    setEditingCell(null);
  }, []);

  // ============ ROW DIALOG ============

  const openAddRow = () => {
    if (!selectedRbsi) { showSnackbar('Pilih periode RBSI terlebih dahulu', 'warning'); return; }
    setEditingRowId(null);
    setRowForm({});
    setRowDialogOpen(true);
  };

  const openEditRow = (row: ArsitekturRow) => {
    setEditingRowId(row.id);
    setRowForm({
      aplikasiId: row.aplikasiId, aplikasiKode: row.aplikasiKode, aplikasiNama: row.aplikasiNama,
      subKategoriId: row.subKategoriId, subKategoriCode: row.subKategoriCode, subKategoriName: row.subKategoriName,
      portofolioBaselineId: row.portofolioBaselineId, portofolioBaseline: row.portofolioBaseline,
      portofolioTargetId: row.portofolioTargetId, portofolioTarget: row.portofolioTarget,
      skpaId: row.skpaId, skpa: row.skpa,
      action: row.action,
      inisiatifGroupId: row.inisiatifGroupId || undefined,
      yearStatuses: { ...row.yearStatuses },
      keterangan: row.keterangan,
    });
    setRowDialogOpen(true);
  };

  const closeRowDialog = () => {
    setRowDialogOpen(false);
    setEditingRowId(null);
    setRowForm({});
  };

  const handleAplikasiSelect = (app: AplikasiItem) => {
    setRowForm(prev => ({
      ...prev,
      aplikasiId: app.id, aplikasiKode: app.singkatan, aplikasiNama: app.namaLengkap,
      subKategoriId: app.subKategoriId, subKategoriCode: app.subKategoriKode, subKategoriName: app.subKategoriNama,
      skpaId: app.skpaId, skpa: app.skpaKode,
      portofolioBaselineId: app.id, portofolioBaseline: app.singkatan,
      portofolioTargetId: app.id, portofolioTarget: app.singkatan,
    }));
  };

  const handleSaveRow = async () => {
    if (!selectedRbsi) return;
    const yearStatuses: Record<number, string> = {};
    periodYears.forEach(y => { yearStatuses[y] = rowForm.yearStatuses?.[y] || ''; });
    const req = {
      rbsi_id: selectedRbsi.id,
      aplikasi_id: rowForm.aplikasiId,
      sub_kategori_id: rowForm.subKategoriId,
      aplikasi_baseline: rowForm.portofolioBaseline,
      aplikasi_target: rowForm.portofolioTarget,
      action: rowForm.action || undefined,
      year_statuses: JSON.stringify(yearStatuses),
      inisiatif_group_id: rowForm.inisiatifGroupId || undefined,
      skpa_id: rowForm.skpaId || undefined,
      keterangan: rowForm.keterangan || undefined,
    };
    try {
      if (editingRowId && !editingRowId.startsWith('new-')) {
        await updateArsitektur(editingRowId, req);
        showSnackbar('Baris berhasil diperbarui', 'success');
      } else {
        await createArsitektur(req);
        showSnackbar('Baris baru berhasil ditambahkan', 'success');
      }
      await fetchArsitekturData(selectedRbsi.id);
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Gagal menyimpan baris', 'error');
    } finally {
      closeRowDialog();
    }
  };

  const handleSaveSingleRow = async (row: ArsitekturRow) => {
    if (!selectedRbsi) return;
    const req = {
      rbsi_id: selectedRbsi.id,
      aplikasi_id: row.aplikasiId,
      sub_kategori_id: row.subKategoriId,
      aplikasi_baseline: row.portofolioBaseline,
      aplikasi_target: row.portofolioTarget,
      action: row.action || undefined,
      year_statuses: JSON.stringify(row.yearStatuses),
      inisiatif_group_id: row.inisiatifGroupId || undefined,
      skpa_id: row.skpaId || skpaList.find(s => s.singkatan === row.skpa)?.id,
      keterangan: row.keterangan || undefined,
    };
    try {
      if (row.id.startsWith('new-')) await createArsitektur(req);
      else await updateArsitektur(row.id, req);
      await fetchArsitekturData(selectedRbsi.id);
      showSnackbar('Perubahan berhasil disimpan', 'success');
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Gagal menyimpan perubahan', 'error');
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    try {
      if (!rowId.startsWith('new-')) await deleteArsitektur(rowId);
      setArsitekturData(prev => prev.filter(r => r.id !== rowId));
      showSnackbar('Baris berhasil dihapus', 'success');
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Gagal menghapus baris', 'error');
    }
  };

  const handleUpdateData = async () => {
    if (!selectedRbsi) return;
    setUpdatingData(true);
    try {
      await updateArsitekturData(selectedRbsi.id);
      await fetchArsitekturData(selectedRbsi.id);
      showSnackbar('Data berhasil disinkronisasi dengan status aplikasi aktual', 'success');
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Gagal memperbarui data', 'error');
    } finally {
      setUpdatingData(false);
    }
  };

  const handleOpenSnapshots = async () => {
    if (!selectedRbsi) return;
    setSnapshotsDialogOpen(true);
    setSnapshotsLoading(true);
    // Default: snapshot terbaru (primary) vs saat ini (compare)
    setSelectedSnapshotDate(null);
    setCompareSnapshotDate('__current__');
    try {
      const res = await getArsitekturSnapshots(selectedRbsi.id);
      setSnapshots(res.data || []);
    } catch {
      setSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  const handleAddAplikasi = async () => {
    if (!newAplikasi.singkatan.trim() || !newAplikasi.namaLengkap.trim()) return;
    if (aplikasiList.some(a => a.singkatan.toUpperCase() === newAplikasi.singkatan.toUpperCase())) {
      showSnackbar('Singkatan aplikasi sudah ada', 'warning'); return;
    }
    try {
      const res = await createAplikasi({ kode_aplikasi: newAplikasi.singkatan.toUpperCase(), nama_aplikasi: newAplikasi.namaLengkap });
      setAplikasiList(prev => [...prev, { id: res.data.id, singkatan: res.data.kode_aplikasi, namaLengkap: res.data.nama_aplikasi }]);
      setNewAplikasi({ singkatan: '', namaLengkap: '' });
      setAddAplikasiDialogOpen(false);
      showSnackbar('Aplikasi baru berhasil ditambahkan', 'success');
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Gagal menambahkan aplikasi', 'error');
    }
  };

  const handleAddSkpa = async () => {
    if (!newSkpa.singkatan.trim() || !newSkpa.namaLengkap.trim()) return;
    if (skpaList.some(s => s.singkatan.toUpperCase() === newSkpa.singkatan.toUpperCase())) {
      showSnackbar('Singkatan SKPA sudah ada', 'warning'); return;
    }
    try {
      const data = await createSkpa({ kode_skpa: newSkpa.singkatan.toUpperCase(), nama_skpa: newSkpa.namaLengkap });
      setSkpaList(prev => [...prev, { id: data.id, singkatan: data.kode_skpa, namaLengkap: data.nama_skpa }]);
      setNewSkpa({ singkatan: '', namaLengkap: '' });
      setAddSkpaDialogOpen(false);
      showSnackbar('SKPA baru berhasil ditambahkan', 'success');
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Gagal menambahkan SKPA', 'error');
    }
  };

  const toggleFilter = (type: 'subKategori' | 'action' | 'skpa', value: string) => {
    setActiveFilters(prev => {
      const cur = prev[type];
      return { ...prev, [type]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] };
    });
  };

  const clearFilters = () => { setActiveFilters({ subKategori: [], action: [], skpa: [] }); setSearchKeyword(''); };
  const showSnackbar = (message: string, severity: SnackbarState['severity']) =>
    setSnackbar({ open: true, message, severity });

  const totalActiveFilters = activeFilters.subKategori.length + activeFilters.action.length + activeFilters.skpa.length;

  // ============ CELL RENDERERS ============

  const renderAplikasiCell = (row: ArsitekturRow, field: 'portofolioBaseline' | 'portofolioTarget') => {
    const value = row[field];
    const isEditing = editingCell?.rowId === row.id && editingCell.field === field;
    return (
      <>
        <Tooltip title={aplikasiList.find(a => a.singkatan === value)?.namaLengkap || (value || 'Klik untuk mengubah')}>
          <Box
            onClick={e => setEditingCell({ rowId: row.id, field, anchorEl: e.currentTarget })}
            sx={{ cursor: 'pointer', py: 0.5, px: 1, borderRadius: '6px', '&:hover': { bgcolor: '#f5f5f5' }, minHeight: 28, display: 'flex', alignItems: 'center' }}
          >
            {value
              ? <Chip label={value} size="small" sx={{ height: 22, fontSize: '0.73rem', fontWeight: 600 }} />
              : <Typography sx={{ fontSize: '0.8rem', color: '#ccc' }}>—</Typography>}
          </Box>
        </Tooltip>
        <Popover
          open={isEditing}
          anchorEl={editingCell?.anchorEl}
          onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } } }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <TextField
              fullWidth size="small"
              label={field === 'portofolioBaseline' ? 'Baseline' : 'Target'}
              defaultValue={value}
              autoFocus
              onBlur={e => {
                const newVal = e.target.value;
                const updated = { ...row, [field]: newVal };
                setArsitekturData(prev => prev.map(r => r.id === row.id ? { ...r, [field]: newVal } : r));
                setEditingCell(null);
                handleSaveSingleRow(updated);
              }}
              onKeyDown={e => { if (e.key === 'Escape') setEditingCell(null); }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" onClick={() => setEditingCell(null)} sx={{ color: '#86868b' }}>Batal</Button>
            </Box>
          </Box>
        </Popover>
      </>
    );
  };

  const renderActionCell = (row: ArsitekturRow) => {
    const isEditing = editingCell?.rowId === row.id && editingCell.field === 'action';
    return (
      <>
        <Box
          onClick={e => setEditingCell({ rowId: row.id, field: 'action', anchorEl: e.currentTarget })}
          sx={{ cursor: 'pointer', py: 0.5, px: 1, borderRadius: '6px', '&:hover': { bgcolor: '#f5f5f5' }, minHeight: 28, display: 'flex', alignItems: 'center' }}
        >
          {row.action
            ? <Chip label={row.action.split(' ')[0]} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: `${getActionColor(row.action)}18`, color: getActionColor(row.action), fontWeight: 700 }} />
            : <Typography sx={{ fontSize: '0.8rem', color: '#ccc' }}>—</Typography>}
        </Box>
        <Popover
          open={isEditing} anchorEl={editingCell?.anchorEl} onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } } }}
        >
          <Box sx={{ py: 0.5, minWidth: 230 }}>
            {ACTION_OPTIONS.map(opt => (
              <MenuItem key={opt} selected={row.action === opt}
                onClick={() => { const updated = { ...row, action: opt }; handleCellChange(row.id, 'action', opt); handleSaveSingleRow(updated); }}
                sx={{ fontSize: '0.85rem', py: 1, gap: 1 }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getActionColor(opt), flexShrink: 0 }} />
                {opt}
              </MenuItem>
            ))}
            {row.action && (
              <>
                <Divider />
                <MenuItem onClick={() => { const updated = { ...row, action: '' }; handleCellChange(row.id, 'action', ''); handleSaveSingleRow(updated); }} sx={{ fontSize: '0.85rem', py: 0.75, color: '#f44336' }}>
                  Hapus
                </MenuItem>
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  };

const renderSkpaCell = (row: ArsitekturRow) => {
  const isEditing = editingCell?.rowId === row.id && editingCell.field === 'skpa';
  const searchTerm = editingCell?.search || '';

  // 1. Filter SKPA berdasarkan singkatan atau nama lengkap
  const filteredSkpa = skpaList.filter(s => 
    s.singkatan.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Tooltip title={skpaList.find(s => s.singkatan === row.skpa)?.namaLengkap || 'Klik untuk memilih'}>
        <Box
          onClick={e => setEditingCell({ rowId: row.id, field: 'skpa', anchorEl: e.currentTarget, search: '' })}
          sx={{ cursor: 'pointer', py: 0.5, px: 1, borderRadius: '6px', '&:hover': { bgcolor: '#f5f5f5' }, minHeight: 28, display: 'flex', alignItems: 'center' }}
        >
          {row.skpa
            ? <Chip label={row.skpa} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }} />
            : <Typography sx={{ fontSize: '0.8rem', color: '#ccc' }}>—</Typography>}
        </Box>
      </Tooltip>

      <Popover
        open={isEditing} anchorEl={editingCell?.anchorEl} onClose={() => setEditingCell(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: 400 } }}
      >
        <Box sx={{ p: 0.5 }}>
          {/* SEARCH FIELD */}
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon sx={{ fontSize: 18, color: '#aaa' }} />
            <InputBase
              placeholder="Cari SKPA..."
              fullWidth
              autoFocus
              value={searchTerm}
              onChange={e => setEditingCell(prev => prev ? { ...prev, search: e.target.value } : prev)}
              sx={{ fontSize: '0.85rem' }}
            />
          </Box>

          <Box sx={{ maxHeight: 300, overflow: 'auto', py: 0.5 }}>
            {filteredSkpa.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>SKPA tidak ditemukan</Typography>
              </Box>
            ) : (
              filteredSkpa.map(s => (
                <MenuItem 
                  key={s.id} 
                  selected={row.skpa === s.singkatan}
                  onClick={() => {
                    const updated = { ...row, skpa: s.singkatan, skpaId: s.id };
                    handleCellChange(row.id, 'skpa', s.singkatan);
                    setArsitekturData(prev => prev.map(r => r.id === row.id ? { ...r, skpaId: s.id } : r));
                    handleSaveSingleRow(updated);
                    setEditingCell(null);
                  }}
                  sx={{ 
                    fontSize: '0.85rem', py: 1, px: 2,
                    '&.Mui-selected': { bgcolor: 'rgba(0, 122, 255, 0.08)' }
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#1d1d1f' }}>
                      {s.singkatan}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#86868b', lineHeight: 1.2 }}>
                      {s.namaLengkap}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Box>

          {row.skpa && (
            <>
              <Divider />
              <MenuItem 
                onClick={() => { 
                  const updated = { ...row, skpa: '', skpaId: undefined }; 
                  handleCellChange(row.id, 'skpa', ''); 
                  handleSaveSingleRow(updated); 
                  setEditingCell(null);
                }} 
                sx={{ fontSize: '0.82rem', py: 1, color: '#f44336', justifyContent: 'center', fontWeight: 600 }}
              >
                Hapus Pilihan
              </MenuItem>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

  const renderInisiatifGroupCell = (row: ArsitekturRow) => {
    const isEditing = editingCell?.rowId === row.id && editingCell.field === 'inisiatifGroupId';
    return (
      <>
        <Box
          onClick={e => setEditingCell({ rowId: row.id, field: 'inisiatifGroupId', anchorEl: e.currentTarget })}
          sx={{
            cursor: 'pointer', py: 0.5, px: 1, borderRadius: '6px',
            '&:hover': { bgcolor: '#f5f5f5' }, minHeight: 28, display: 'flex', alignItems: 'center', maxWidth: 220,
          }}
        >
          <Typography sx={{ fontSize: '0.78rem', color: row.inisiatifGroupLabel ? '#1d1d1f' : '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.inisiatifGroupLabel || '— Pilih inisiatif'}
          </Typography>
        </Box>
        <InisiatifPopover
          open={isEditing}
          anchorEl={editingCell?.anchorEl ?? null}
          groups={groupedInisiatif}
          selectedId={row.inisiatifGroupId}
          onSelect={item => {
            const updated = { ...row, inisiatifGroupId: item.id, inisiatifGroupLabel: item.nama_inisiatif };
            setArsitekturData(prev => prev.map(r => r.id === row.id ? updated : r));
            setEditingCell(null);
            handleSaveSingleRow(updated);
          }}
          onClear={() => {
            const updated = { ...row, inisiatifGroupId: null, inisiatifGroupLabel: '' };
            handleCellChange(row.id, 'inisiatifGroupId', '');
            handleSaveSingleRow(updated);
          }}
          onClose={() => setEditingCell(null)}
        />
      </>
    );
  };

  const renderYearStatusCell = (row: ArsitekturRow, year: number) => {
    const status = row.yearStatuses[year] || '';
    const style = getYearStatusStyle(status);
    const field = `year-${year}` as EditField;
    const isEditing = editingCell?.rowId === row.id && editingCell.field === field;
    return (
      <>
        <Tooltip title={status || 'Belum diatur'}>
          <Box
            onClick={e => setEditingCell({ rowId: row.id, field, anchorEl: e.currentTarget })}
            sx={{
              width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: style.bgcolor, color: style.color, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.12)' },
            }}
          >
            {style.label}
          </Box>
        </Tooltip>
        <Popover
          open={isEditing} anchorEl={editingCell?.anchorEl} onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } } }}
        >
          <Box sx={{ py: 0.5, minWidth: 140 }}>
            {YEAR_STATUS_OPTIONS.map(opt => {
              const s = getYearStatusStyle(opt);
              return (
                <MenuItem key={opt} selected={status === opt}
                  onClick={() => { const updated = { ...row, yearStatuses: { ...row.yearStatuses, [year]: opt } }; handleYearStatusChange(row.id, year, opt); handleSaveSingleRow(updated); }}
                  sx={{ fontSize: '0.85rem', py: 0.75, gap: 1.5 }}
                >
                  <Box sx={{ width: 22, height: 22, borderRadius: '5px', bgcolor: s.bgcolor, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                    {s.label}
                  </Box>
                  {opt}
                </MenuItem>
              );
            })}
            {status && (
              <>
                <Divider />
                <MenuItem onClick={() => { const updated = { ...row, yearStatuses: { ...row.yearStatuses, [year]: '' } }; handleYearStatusChange(row.id, year, ''); handleSaveSingleRow(updated); }} sx={{ fontSize: '0.85rem', py: 0.75, color: '#f44336' }}>
                  Hapus
                </MenuItem>
              </>
            )}
          </Box>
        </Popover>
      </>
    );
  };

  const renderKeteranganCell = (row: ArsitekturRow) => {
    const isEditing = editingCell?.rowId === row.id && editingCell.field === 'keterangan';
    return (
      <>
        <Tooltip title={row.keterangan || 'Klik untuk menambahkan keterangan'}>
          <Box
            onClick={e => setEditingCell({ rowId: row.id, field: 'keterangan', anchorEl: e.currentTarget })}
            sx={{ cursor: 'pointer', py: 0.5, px: 1, borderRadius: '6px', '&:hover': { bgcolor: '#f5f5f5' }, minHeight: 28, display: 'flex', alignItems: 'center' }}
          >
            {row.keterangan
              ? <Typography sx={{ fontSize: '0.78rem', color: '#1d1d1f' }}>{row.keterangan}</Typography>
              : <Typography sx={{ fontSize: '0.8rem', color: '#ccc' }}>—</Typography>}
          </Box>
        </Tooltip>
        <Popover
          open={isEditing} anchorEl={editingCell?.anchorEl} onClose={() => setEditingCell(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } } }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <TextField
              fullWidth multiline minRows={3} maxRows={6}
              label="Keterangan"
              defaultValue={row.keterangan}
              autoFocus
              onBlur={e => {
                const newVal = e.target.value;
                const updated = { ...row, keterangan: newVal };
                setArsitekturData(prev => prev.map(r => r.id === row.id ? { ...r, keterangan: newVal } : r));
                setEditingCell(null);
                handleSaveSingleRow(updated);
              }}
              onKeyDown={e => { if (e.key === 'Escape') setEditingCell(null); }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" onClick={() => setEditingCell(null)} sx={{ color: '#86868b' }}>Batal</Button>
            </Box>
          </Box>
        </Popover>
      </>
    );
  };

const renderSubKategoriCell = (row: ArsitekturRow) => {
  const isEditing = editingCell?.rowId === row.id && editingCell.field === 'subKategori';
  const searchTerm = editingCell?.search || '';

  // 1. Filter berdasarkan search term
  const filteredList = subKategoriList.filter(sk => 
    sk.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sk.kode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Grouping: Simpan objek yang berisi label (name) dan items (array)
  const groupedSubKategori = filteredList.reduce<{ 
    [key: string]: { label: string; items: SubKategoriResponse[] } 
  }>((acc, sk) => {
    const code = sk.category_code;
    
    if (!acc[code]) {
      // Kita asumsikan category_name ada di dalam data (seperti di JSON contohmu)
      // Jika tidak ada di interface SubKategoriResponse, pastikan datanya dikirim dari backend
      acc[code] = {
        label: (sk as any).category_name || code, 
        items: []
      };
    }
    
    acc[code].items.push(sk);
    return acc;
  }, {});

  return (
    <>
      <Box
        onClick={e => setEditingCell({ rowId: row.id, field: 'subKategori', anchorEl: e.currentTarget, search: '' })}
        sx={{ 
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.75, 
          py: 0.5, px: 1, borderRadius: '6px', '&:hover': { bgcolor: '#f5f5f5' }, minHeight: 28 
        }}
      >
        <Chip
          label={row.subKategoriCode || '?'}
          size="small"
          sx={{ 
            fontWeight: 700, fontSize: '0.68rem', 
            bgcolor: row.subKategoriCode ? getSubKategoriColor(row.subKategoriCode) : '#ccc', 
            color: 'white', height: 20 
          }}
        />
        <Typography sx={{ fontSize: '0.78rem', color: '#333' }}>
          {row.subKategoriName || row.aplikasiKode || '—'}
        </Typography>
      </Box>

      <Popover
        open={isEditing} anchorEl={editingCell?.anchorEl} onClose={() => setEditingCell(null)}
        PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: 400 } }}
      >
        <Box sx={{ p: 0.5 }}>
          {/* Search Header */}
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon sx={{ fontSize: 18, color: '#aaa' }} />
            <InputBase
              placeholder="Cari sub-kategori..."
              value={searchTerm}
              onChange={e => setEditingCell(prev => prev ? { ...prev, search: e.target.value } : prev)}
              fullWidth
              autoFocus
              sx={{ fontSize: '0.85rem' }}
            />
          </Box>

          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {Object.keys(groupedSubKategori).length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>Data tidak ditemukan</Typography>
              </Box>
            ) : (
              Object.entries(groupedSubKategori).map(([code, group]) => (
                <Box key={code}>
                  {/* HEADER DINAMIS: category_code + category_name */}
                  <Box sx={{ 
                    position: 'sticky', top: 0, bgcolor: '#f8f8f8', zIndex: 10, 
                    px: 1.5, py: 1, borderBottom: '1px solid #eee' 
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#DA251C', textTransform: 'uppercase' }}>
                      {code} - {group.label}
                    </Typography>
                  </Box>

                  {group.items.map(sk => (
                    <MenuItem 
                      key={sk.id} 
                      selected={row.subKategoriId === sk.id}
                      onClick={() => {
                        const updated = { 
                          ...row, 
                          subKategoriId: sk.id, 
                          subKategoriCode: sk.kode, 
                          subKategoriName: sk.nama 
                        };
                        setArsitekturData(prev => prev.map(r => r.id === row.id ? updated : r));
                        setEditingCell(null);
                        handleSaveSingleRow(updated);
                      }}
                      sx={{ 
                        fontSize: '0.85rem', py: 1.2, px: 2,
                        '&.Mui-selected': { bgcolor: 'rgba(218, 37, 28, 0.08)' } 
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip 
                          label={sk.kode} 
                          size="small" 
                          sx={{ 
                            fontWeight: 700, fontSize: '0.65rem', 
                            bgcolor: getSubKategoriColor(sk.kode), color: 'white', 
                            height: 18, minWidth: 45 
                          }} 
                        />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {sk.nama}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

  // ============ RENDER ============

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3.5 }, background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(240,245,250,0.3) 100%)', minHeight: '100vh', overflowX: 'hidden', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <AccountTreeIcon sx={{ fontSize: 30, color: '#DA251C' }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', fontSize: '1.6rem' }}>
              RBSI Arsitektur
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#86868b' }}>
            Kelola arsitektur portofolio aplikasi dalam roadmap RBSI
          </Typography>
        </Box>
        <Box>
          <Button
            endIcon={rbsiLoading ? <CircularProgress size={14} /> : periodeAnchorEl ? <ArrowUpIcon /> : <ArrowDownIcon />}
            onClick={e => setPeriodeAnchorEl(e.currentTarget)}
            disabled={rbsiLoading}
            sx={{ bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', py: 1, px: 2, color: '#1d1d1f', fontWeight: 600, fontSize: '0.9rem', minWidth: 180, justifyContent: 'space-between', '&:hover': { bgcolor: '#fafafa', borderColor: '#DA251C' } }}
          >
            {selectedRbsi ? `Periode ${selectedRbsi.periode}` : 'Pilih Periode'}
          </Button>
          <Menu anchorEl={periodeAnchorEl} open={Boolean(periodeAnchorEl)} onClose={() => setPeriodeAnchorEl(null)} slotProps={{ paper: { sx: { mt: 1, borderRadius: '12px', minWidth: 200 } } }}>
            {rbsiList.map(r => (
              <MenuItem key={r.id} selected={selectedRbsi?.id === r.id} onClick={() => { setSelectedRbsi(r); setPeriodeAnchorEl(null); }}>
                {r.periode}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {/* Main Card */}
      <Paper elevation={0} sx={{ width: '100%', minWidth: 0, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', overflow: 'clip' }}>
        {/* Toolbar */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <TextField
              placeholder="Cari arsitektur..."
              size="small"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              sx={{ minWidth: 200, maxWidth: 280, flex: 1, '& .MuiOutlinedInput-root': { bgcolor: '#f5f5f7', borderRadius: '10px', '& fieldset': { borderColor: 'transparent' }, '&.Mui-focused fieldset': { borderColor: '#DA251C', borderWidth: 2 } } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#86868b', fontSize: 19 }} /></InputAdornment> }}
            />
            <Button
              size="small" startIcon={<FilterIcon />}
              onClick={e => setFilterAnchorEl(e.currentTarget)}
              sx={{ color: totalActiveFilters > 0 ? '#DA251C' : '#666', borderRadius: '8px', textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Filter
              {totalActiveFilters > 0 && <Chip label={totalActiveFilters} size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.68rem', bgcolor: '#DA251C', color: 'white' }} />}
            </Button>
            {totalActiveFilters > 0 && (
              <Button size="small" onClick={clearFilters} sx={{ color: '#86868b', textTransform: 'none' }}>Reset</Button>
            )}
            <Typography variant="body2" sx={{ color: '#bbb', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
              {filteredData.length} / {arsitekturData.length}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            <Tooltip title="Lihat riwayat snapshot perubahan data">
              <Button size="small" variant="outlined" startIcon={<HistoryIcon />} onClick={handleOpenSnapshots} disabled={!selectedRbsi}
                sx={{ borderColor: '#d0d0d0', color: '#555', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                Riwayat
              </Button>
            </Tooltip>
            <Tooltip title="Snapshot dan sinkronisasi year_status dengan status aplikasi aktual">
              <span>
                <Button size="small" variant="outlined"
                  startIcon={updatingData ? <CircularProgress size={13} /> : <SyncIcon />}
                  onClick={handleUpdateData} disabled={!selectedRbsi || updatingData}
                  sx={{ borderColor: '#1976d2', color: '#1976d2', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                  Update Data
                </Button>
              </span>
            </Tooltip>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openAddRow} disabled={!selectedRbsi}
              sx={{ borderColor: '#DA251C', color: '#DA251C', borderRadius: '8px', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#B91C14', bgcolor: 'rgba(218,37,28,0.04)' } }}>
              Tambah
            </Button>
          </Box>
        </Box>

        {/* Filter Popover */}
        <Popover
          open={Boolean(filterAnchorEl)} anchorEl={filterAnchorEl} onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { borderRadius: '12px', p: 2.5, minWidth: 300 } } }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Filter</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.75, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sub Kategori</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {['CS', 'SP', 'DA', 'DM'].map(code => (
                <Chip key={code} label={code} size="small" onClick={() => toggleFilter('subKategori', code)}
                  sx={{ bgcolor: activeFilters.subKategori.includes(code) ? getSubKategoriColor(code) : '#f0f0f0', color: activeFilters.subKategori.includes(code) ? 'white' : '#555', fontWeight: 700, '&:hover': { opacity: 0.85 } }} />
              ))}
            </Stack>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.75, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {ACTION_OPTIONS.map(action => (
                <Chip key={action} label={action.split(' ')[0]} size="small" onClick={() => toggleFilter('action', action)}
                  sx={{ bgcolor: activeFilters.action.includes(action) ? getActionColor(action) : '#f0f0f0', color: activeFilters.action.includes(action) ? 'white' : '#555', fontWeight: 600, fontSize: '0.72rem', '&:hover': { opacity: 0.85 } }} />
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#86868b', mb: 0.75, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>SKPA</Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {skpaList.slice(0, 8).map(s => (
                <Chip key={s.singkatan} label={s.singkatan} size="small" onClick={() => toggleFilter('skpa', s.singkatan)}
                  sx={{ bgcolor: activeFilters.skpa.includes(s.singkatan) ? '#1d1d1f' : '#f0f0f0', color: activeFilters.skpa.includes(s.singkatan) ? 'white' : '#555', fontWeight: 600, fontSize: '0.72rem', '&:hover': { opacity: 0.85 } }} />
              ))}
            </Stack>
          </Box>
        </Popover>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)', minHeight: 400, overflowX: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 180, bgcolor: '#f8f9fa', position: 'sticky', left: 0, zIndex: 3, fontSize: '0.8rem' }}>Sub Kategori</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 110, bgcolor: '#f8f9fa', fontSize: '0.8rem' }}>Baseline</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 110, bgcolor: '#f8f9fa', fontSize: '0.8rem' }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 130, bgcolor: '#f8f9fa', fontSize: '0.8rem' }}>Action</TableCell>
                {periodYears.map(y => (
                  <TableCell key={y} align="center" sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 50, bgcolor: '#f8f9fa', fontSize: '0.78rem' }}>{y}</TableCell>
                ))}
                <TableCell sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 210, bgcolor: '#f8f9fa', fontSize: '0.8rem' }}>Inisiatif RBSI</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 80, bgcolor: '#f8f9fa', fontSize: '0.8rem' }}>SKPA</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#444', py: 1.5, minWidth: 180, bgcolor: '#f8f9fa', fontSize: '0.8rem' }}>Keterangan</TableCell>
                <TableCell sx={{ py: 1.5, minWidth: 72, bgcolor: '#f8f9fa' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!selectedRbsi ? (
                <TableRow>
                  <TableCell colSpan={8 + periodYears.length} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>Pilih periode RBSI untuk melihat data arsitektur</Typography>
                  </TableCell>
                </TableRow>
              ) : dataLoading ? (
                <TableRow>
                  <TableCell colSpan={8 + periodYears.length} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: '#DA251C' }} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8 + periodYears.length} sx={{ textAlign: 'center', py: 6 }}>
                    <FolderOpenRounded sx={{ fontSize: 44, color: '#ddd', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      {arsitekturData.length === 0 ? 'Belum ada data arsitektur' : 'Tidak ada data yang sesuai filter'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map(row => (
                  <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.015)' } }}>
                    {/* <TableCell sx={{ py: 1, position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Chip
                          label={row.subKategoriCode || '?'}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: row.subKategoriCode ? getSubKategoriColor(row.subKategoriCode) : '#ccc', color: 'white', height: 20 }}
                        />
                        <Typography sx={{ fontSize: '0.78rem', color: '#333' }}>{row.subKategoriName || row.aplikasiKode || '—'}</Typography>
                      </Box>
                    </TableCell> */}
                    <TableCell sx={{ py: 1, position: 'sticky', left: 0, bgcolor: 'white', zIndex: 2 }}>{renderSubKategoriCell(row)}</TableCell>
                    <TableCell sx={{ py: 1 }}>{renderAplikasiCell(row, 'portofolioBaseline')}</TableCell>
                    <TableCell sx={{ py: 1 }}>{renderAplikasiCell(row, 'portofolioTarget')}</TableCell>
                    <TableCell sx={{ py: 1 }}>{renderActionCell(row)}</TableCell>
                    {periodYears.map(y => (
                      <TableCell key={y} align="center" sx={{ py: 1 }}>{renderYearStatusCell(row, y)}</TableCell>
                    ))}
                    <TableCell sx={{ py: 1 }}>{renderInisiatifGroupCell(row)}</TableCell>
                    <TableCell sx={{ py: 1 }}>{renderSkpaCell(row)}</TableCell>
                    <TableCell sx={{ py: 1 }}>{renderKeteranganCell(row)}</TableCell>
                    {/* <TableCell sx={{ py: 1 }}>
                      {row.keterangan
                        ? <Tooltip title={row.keterangan}><Typography sx={{ fontSize: '0.78rem', color: '#555', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.keterangan}</Typography></Tooltip>
                        : <Typography sx={{ fontSize: '0.8rem', color: '#ccc' }}>—</Typography>}
                    </TableCell> */}
                    <TableCell sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex' }}>
                        <IconButton size="small" onClick={() => openEditRow(row)} sx={{ color: '#bbb', '&:hover': { color: '#1976d2' } }}>
                          <EditIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteRow(row.id)} sx={{ color: '#bbb', '&:hover': { color: '#f44336' } }}>
                          <DeleteIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ===== ADD / EDIT ROW DIALOG ===== */}
      <Dialog
        open={rowDialogOpen}
        onClose={closeRowDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', bgcolor: 'white' } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1d1d1f', pb: 1 }}>
          {editingRowId ? 'Edit Baris Arsitektur' : 'Tambah Baris Arsitektur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 0.5 }}>

            {/* 1 — Aplikasi */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 0.5 }}>1. Aplikasi *</Typography>
              <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1 }}>
                Sub Kategori dan SKPA otomatis terisi saat aplikasi dipilih, tapi bisa diubah manual di bawah.
              </Typography>
              <Autocomplete
                options={aplikasiList}
                getOptionLabel={(opt: AplikasiItem) => `${opt.singkatan} — ${opt.namaLengkap}`}
                value={aplikasiList.find(a => a.id === rowForm.aplikasiId) || null}
                onChange={(_e, val) => { if (val) handleAplikasiSelect(val); }}
                renderOption={(props, option: AplikasiItem) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{option.singkatan}</Typography>
                      <Typography sx={{ fontSize: '0.76rem', color: '#86868b' }}>{option.namaLengkap}</Typography>
                    </Box>
                  </li>
                )}
                renderInput={params => <TextField {...params} label="Pilih Aplikasi" size="small" />}
                fullWidth
                filterOptions={(options, state) =>
                  options.filter(o => `${o.singkatan} ${o.namaLengkap}`.toLowerCase().includes(state.inputValue.toLowerCase()))
                }
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                noOptionsText="Tidak ada aplikasi"
              />
            </Box>

            {/* 1b — Sub Kategori & SKPA (editable) */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 1 }}>Sub Kategori</Typography>
                <Autocomplete
                  options={subKategoriList}
                  getOptionLabel={(opt: SubKategoriResponse) => `${opt.kode} — ${opt.nama}`}
                  value={subKategoriList.find(s => s.id === rowForm.subKategoriId) || null}
                  onChange={(_e, val) => setRowForm(p => ({
                    ...p,
                    subKategoriId: val?.id,
                    subKategoriCode: val?.kode || '',
                    subKategoriName: val?.nama || '',
                  }))}
                  renderOption={(props, opt: SubKategoriResponse) => (
                    <li {...props} key={opt.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={opt.kode} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: getSubKategoriColor(opt.kode), color: 'white' }} />
                        <Typography sx={{ fontSize: '0.82rem' }}>{opt.nama}</Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={params => (
                    <TextField {...params} size="small" placeholder="Pilih sub kategori"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: rowForm.subKategoriCode ? (
                            <Chip label={rowForm.subKategoriCode} size="small"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: getSubKategoriColor(rowForm.subKategoriCode), color: 'white', mr: 0.5 }} />
                          ) : params.InputProps.startAdornment,
                        },
                      }}
                    />
                  )}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  noOptionsText="Tidak ada sub kategori"
                  filterOptions={(options, state) =>
                    options.filter(o => `${o.kode} ${o.nama}`.toLowerCase().includes(state.inputValue.toLowerCase()))
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 1 }}>SKPA</Typography>
                <Autocomplete
                  options={skpaList}
                  getOptionLabel={(opt: SkpaItem) => `${opt.singkatan} — ${opt.namaLengkap}`}
                  value={skpaList.find(s => s.id === rowForm.skpaId) || null}
                  onChange={(_e, val) => setRowForm(p => ({
                    ...p,
                    skpaId: val?.id,
                    skpa: val?.singkatan || '',
                  }))}
                  renderOption={(props, opt: SkpaItem) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{opt.singkatan}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#86868b' }}>{opt.namaLengkap}</Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={params => <TextField {...params} size="small" placeholder="Pilih SKPA" />}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  noOptionsText="Tidak ada SKPA"
                />
              </Box>
            </Box>

            {/* 2 — Baseline & Target */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 1 }}>2. Baseline & Target</Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField fullWidth size="small" label="Baseline"
                  value={rowForm.portofolioBaseline || ''}
                  onChange={e => setRowForm(p => ({ ...p, portofolioBaseline: e.target.value }))}
                  placeholder="Kode baseline"
                />
                <TextField fullWidth size="small" label="Target"
                  value={rowForm.portofolioTarget || ''}
                  onChange={e => setRowForm(p => ({ ...p, portofolioTarget: e.target.value }))}
                  placeholder="Kode target"
                />
              </Box>
            </Box>

            {/* 3 — Action */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 1 }}>3. Action</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {ACTION_OPTIONS.map(opt => {
                  const isSelected = rowForm.action === opt;
                  return (
                    <Chip key={opt} label={opt} size="small" clickable
                      onClick={() => setRowForm(p => ({ ...p, action: p.action === opt ? '' : opt }))}
                      sx={{
                        bgcolor: isSelected ? getActionColor(opt) : '#f0f0f0',
                        color: isSelected ? 'white' : '#555',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.78rem',
                        '&:hover': { opacity: 0.85 },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* 4 — Inisiatif RBSI */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 1 }}>4. Inisiatif RBSI</Typography>
              <Autocomplete
                options={inisiatifGroups}
                getOptionLabel={(opt: FlatInisiatif) => `${opt.nomor_inisiatif} — ${opt.nama_inisiatif}`}
                value={inisiatifGroups.find(g => g.id === rowForm.inisiatifGroupId) || null}
                onChange={(_e, val) => setRowForm(p => ({ ...p, inisiatifGroupId: val?.id ?? undefined }))}
                groupBy={(opt: FlatInisiatif) => `${opt.nomor_program}||${opt.nama_program}`}
                renderGroup={params => (
                  <Box key={params.key}>
                    <Box sx={{ px: 2, py: 0.75, bgcolor: '#f8f8f8', borderBottom: '1px solid #ececec', position: 'sticky', top: -8, zIndex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#DA251C', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {String(params.group).split('||')[0]} — {String(params.group).split('||')[1]}
                      </Typography>
                    </Box>
                    {params.children}
                  </Box>
                )}
                renderOption={(props, opt: FlatInisiatif) => (
                  <li {...props} key={opt.id}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#DA251C', flexShrink: 0 }}>
                        {opt.nomor_inisiatif}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#1d1d1f' }}>
                        {opt.nama_inisiatif}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={params => <TextField {...params} label="Pilih Inisiatif RBSI" size="small" />}
                fullWidth
                filterOptions={(options, state) =>
                  options.filter(o =>
                    `${o.nomor_inisiatif} ${o.nama_inisiatif} ${o.nama_program}`.toLowerCase().includes(state.inputValue.toLowerCase())
                  )
                }
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                noOptionsText="Tidak ada inisiatif"
              />
            </Box>

            {/* 5 — Year Statuses */}
            {periodYears.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 1 }}>5. Status per Tahun</Typography>
                <Stack direction="row" gap={2} flexWrap="wrap">
                  {periodYears.map(y => (
                    <Box key={y} sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ display: 'block', color: '#666', mb: 0.5, fontWeight: 600 }}>{y}</Typography>
                      <Stack direction="column" gap={0.4}>
                        {YEAR_STATUS_OPTIONS.map(opt => {
                          const st = getYearStatusStyle(opt);
                          const isSelected = rowForm.yearStatuses?.[y] === opt;
                          return (
                            <Tooltip key={opt} title={opt} placement="right">
                              <Box
                                onClick={() => setRowForm(p => ({
                                  ...p,
                                  yearStatuses: { ...p.yearStatuses, [y]: p.yearStatuses?.[y] === opt ? '' : opt },
                                }))}
                                sx={{
                                  width: 28, height: 28, borderRadius: '6px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  bgcolor: isSelected ? st.color : st.bgcolor,
                                  color: isSelected ? 'white' : st.color,
                                  fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                                  border: isSelected ? 'none' : `1px solid ${st.color}50`,
                                  transition: 'all 0.1s',
                                  '&:hover': { transform: 'scale(1.1)' },
                                }}
                              >
                                {st.label}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* 6 — Keterangan */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 1 }}>6. Keterangan</Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="Catatan atau keterangan tambahan..."
                value={rowForm.keterangan || ''}
                onChange={e => setRowForm(p => ({ ...p, keterangan: e.target.value }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeRowDialog} sx={{ color: '#86868b' }}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSaveRow}
            disabled={!rowForm.aplikasiId}
            sx={{ bgcolor: '#DA251C', '&:hover': { bgcolor: '#B91C14' }, borderRadius: '8px', fontWeight: 600 }}
          >
            {editingRowId ? 'Simpan Perubahan' : 'Tambah Baris'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ADD APLIKASI DIALOG ===== */}
      <Dialog open={addAplikasiDialogOpen} onClose={() => { setAddAplikasiDialogOpen(false); setNewAplikasi({ singkatan: '', namaLengkap: '' }); }} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Tambah Aplikasi Baru</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth size="small" label="Kode / Singkatan" placeholder="Contoh: SIPENA" value={newAplikasi.singkatan}
              onChange={e => setNewAplikasi(p => ({ ...p, singkatan: e.target.value.toUpperCase() }))} />
            <TextField fullWidth size="small" label="Nama Lengkap" placeholder="Sistem Informasi ..." value={newAplikasi.namaLengkap}
              onChange={e => setNewAplikasi(p => ({ ...p, namaLengkap: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddAplikasiDialogOpen(false); setNewAplikasi({ singkatan: '', namaLengkap: '' }); }} sx={{ color: '#86868b' }}>Batal</Button>
          <Button variant="contained" onClick={handleAddAplikasi} disabled={!newAplikasi.singkatan.trim() || !newAplikasi.namaLengkap.trim()} sx={{ bgcolor: '#DA251C', '&:hover': { bgcolor: '#B91C14' } }}>Tambah</Button>
        </DialogActions>
      </Dialog>

      {/* ===== ADD SKPA DIALOG ===== */}
      <Dialog open={addSkpaDialogOpen} onClose={() => { setAddSkpaDialogOpen(false); setNewSkpa({ singkatan: '', namaLengkap: '' }); }} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px' } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Tambah SKPA Baru</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth size="small" label="Singkatan SKPA" placeholder="Contoh: DPK" value={newSkpa.singkatan}
              onChange={e => setNewSkpa(p => ({ ...p, singkatan: e.target.value.toUpperCase() }))} />
            <TextField fullWidth size="small" label="Nama Departemen" placeholder="Departemen ..." value={newSkpa.namaLengkap}
              onChange={e => setNewSkpa(p => ({ ...p, namaLengkap: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddSkpaDialogOpen(false); setNewSkpa({ singkatan: '', namaLengkap: '' }); }} sx={{ color: '#86868b' }}>Batal</Button>
          <Button variant="contained" onClick={handleAddSkpa} disabled={!newSkpa.singkatan.trim() || !newSkpa.namaLengkap.trim()} sx={{ bgcolor: '#DA251C', '&:hover': { bgcolor: '#B91C14' } }}>Tambah</Button>
        </DialogActions>
      </Dialog>

      {/* ===== SNAPSHOTS DIALOG ===== */}
      {snapshotsDialogOpen && (
        <SnapshotDialog
          open={snapshotsDialogOpen}
          snapshots={snapshots}
          loading={snapshotsLoading}
          periodYears={periodYears}
          currentData={arsitekturData}
          selectedDate={selectedSnapshotDate}
          compareDate={compareSnapshotDate}
          onSelectDate={setSelectedSnapshotDate}
          onCompareDate={setCompareSnapshotDate}
          onClose={() => {
            setSnapshotsDialogOpen(false);
            setSelectedSnapshotDate(null);
            setCompareSnapshotDate(null);
          }}
        />
      )}

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ borderRadius: '10px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ============ SNAPSHOT DIALOG ============

interface SnapshotChange { field: string; oldValue: string; newValue: string }

const CURRENT_DATE_KEY = '__current__';

interface SnapshotDialogProps {
  open: boolean;
  snapshots: SnapshotGroup[];
  loading: boolean;
  periodYears: number[];
  currentData: ArsitekturRow[];
  selectedDate: string | null;
  compareDate: string | null;
  onSelectDate: (d: string) => void;
  onCompareDate: (d: string | null) => void;
  onClose: () => void;
}

function rowToSnapshotItem(row: ArsitekturRow): SnapshotArsitekturRbsiResponse {
  return {
    id: row.id,
    rbsi_id: '',
    snapshot_date: CURRENT_DATE_KEY,
    arsitektur_id: row.id,
    sub_kategori_kode: row.subKategoriCode || null,
    sub_kategori_nama: row.subKategoriName || null,
    aplikasi_kode: row.aplikasiKode || null,
    aplikasi_nama: row.aplikasiNama || null,
    aplikasi_baseline_kode: row.portofolioBaseline || null,
    aplikasi_baseline_nama: null,
    aplikasi_target_kode: row.portofolioTarget || null,
    aplikasi_target_nama: null,
    action: row.action || null,
    year_statuses: JSON.stringify(row.yearStatuses),
    inisiatif_group_id: row.inisiatifGroupId,
    inisiatif_group_nama: row.inisiatifGroupLabel || null,
    skpa_kode: row.skpa || null,
    skpa_nama: null,
    keterangan: row.keterangan || null,
    changes: null,
    created_at: new Date().toISOString(),
  };
}

function SnapshotDialog({
  open, snapshots, loading, periodYears, currentData,
  selectedDate, compareDate,
  onSelectDate, onCompareDate, onClose,
}: SnapshotDialogProps) {
  // Auto-select the latest snapshot on first load
  const effectiveSelected = selectedDate ?? snapshots[0]?.snapshot_date ?? null;

  // "Saat Ini" virtual group built from live arsitekturData
  const currentGroup: SnapshotGroup = useMemo(() => ({
    snapshot_date: CURRENT_DATE_KEY,
    total_items: currentData.length,
    changed_items: 0,
    items: currentData.map(rowToSnapshotItem),
  }), [currentData]);

  const resolveGroup = (key: string | null): SnapshotGroup | null => {
    if (!key) return null;
    if (key === CURRENT_DATE_KEY) return currentGroup;
    return snapshots.find(s => s.snapshot_date === key) ?? null;
  };

  const primaryGroup  = resolveGroup(effectiveSelected);
  const compareGroup  = resolveGroup(compareDate ?? null);

  // Build a map from arsitektur_id → compare item for O(1) lookup
  const compareMap = useMemo(() => {
    const m = new Map<string, SnapshotArsitekturRbsiResponse>();
    compareGroup?.items.forEach(it => m.set(it.arsitektur_id, it));
    return m;
  }, [compareGroup]);

  // Parse year_statuses JSON safely
  const parseYS = (raw: string | null): Record<number, string> => {
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  };

  // Diff two snapshots items — returns changed fields
  const diffItems = (a: SnapshotArsitekturRbsiResponse, b: SnapshotArsitekturRbsiResponse): SnapshotChange[] => {
    const fields: { key: keyof SnapshotArsitekturRbsiResponse; label: string }[] = [
      { key: 'sub_kategori_kode',      label: 'Sub Kategori' },
      { key: 'aplikasi_baseline_kode', label: 'Baseline' },
      { key: 'aplikasi_target_kode',   label: 'Target' },
      { key: 'action',                 label: 'Action' },
      { key: 'inisiatif_group_nama',   label: 'Inisiatif' },
      { key: 'skpa_kode',              label: 'SKPA' },
      { key: 'keterangan',             label: 'Keterangan' },
    ];
    const changes: SnapshotChange[] = [];
    for (const f of fields) {
      const av = (a[f.key] ?? '') as string;
      const bv = (b[f.key] ?? '') as string;
      if (av !== bv) changes.push({ field: f.label, oldValue: av || '—', newValue: bv || '—' });
    }
    // diff year_statuses per year
    const aYS = parseYS(a.year_statuses as string);
    const bYS = parseYS(b.year_statuses as string);
    const allYears = Array.from(new Set([...Object.keys(aYS), ...Object.keys(bYS)])).map(Number);
    for (const y of allYears) {
      if ((aYS[y] ?? '') !== (bYS[y] ?? ''))
        changes.push({ field: String(y), oldValue: aYS[y] || '—', newValue: bYS[y] || '—' });
    }
    return changes;
  };

  const isCompareMode = Boolean(compareDate);
  const labelOf = (key: string | null) => key === CURRENT_DATE_KEY ? 'Saat Ini' : (key ?? '');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '16px', height: '88vh', display: 'flex', flexDirection: 'column' } } }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ color: '#555', fontSize: 22 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Riwayat Snapshot</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden', flex: 1 }}>
        {loading ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: '#DA251C' }} />
          </Box>
        ) : snapshots.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <HistoryIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              Belum ada snapshot. Klik "Update Data" untuk membuat snapshot pertama.
            </Typography>
          </Box>
        ) : (
          <>
            {/* ── Sidebar kiri: daftar tanggal ── */}
            <Box sx={{
              width: 220, flexShrink: 0, borderRight: '1px solid #f0f0f0',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pilih Snapshot
                </Typography>
              </Box>

              {/* Compare mode hint */}
              {isCompareMode && (
                <Box sx={{ mx: 1.5, mb: 1, px: 1.5, py: 1, bgcolor: 'rgba(218,37,28,0.05)', borderRadius: '8px', border: '1px solid rgba(218,37,28,0.15)' }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#DA251C', fontWeight: 600, mb: 0.5 }}>Mode Compare</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#86868b' }}>
                    <strong>{labelOf(effectiveSelected)}</strong> → <strong style={{ color: '#DA251C' }}>{labelOf(compareDate)}</strong>
                  </Typography>
                  <Button size="small" onClick={() => onCompareDate(null)}
                    sx={{ mt: 0.75, fontSize: '0.65rem', color: '#DA251C', p: 0, minWidth: 0, textTransform: 'none' }}>
                    Keluar compare
                  </Button>
                </Box>
              )}

              <Box sx={{ flex: 1, overflowY: 'auto', pb: 1 }}>
                {/* Entry "Saat Ini" selalu di paling atas */}
                {(() => {
                  const key = CURRENT_DATE_KEY;
                  const isPrimary = key === effectiveSelected;
                  const isCompareEntry = key === compareDate;
                  return (
                    <Box
                      key={key}
                      onClick={() => {
                        if (isCompareMode && !isPrimary) onCompareDate(key);
                        else onSelectDate(key);
                      }}
                      sx={{
                        mx: 1, mb: 0.5, px: 1.5, py: 1, borderRadius: '8px', cursor: 'pointer',
                        bgcolor: isPrimary ? '#1976d2' : isCompareEntry ? 'rgba(25,118,210,0.08)' : 'rgba(25,118,210,0.04)',
                        border: isCompareEntry ? '1px solid rgba(25,118,210,0.35)' : '1px solid rgba(25,118,210,0.15)',
                        '&:hover': { bgcolor: isPrimary ? '#1976d2' : 'rgba(25,118,210,0.1)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isPrimary ? 'white' : '#1976d2', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isPrimary ? 'white' : '#1976d2' }}>
                          Saat Ini
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: isPrimary ? 'rgba(255,255,255,0.75)' : '#86868b', mt: 0.25 }}>
                        {currentData.length} item · live
                      </Typography>
                      {isCompareEntry && (
                        <Typography sx={{ fontSize: '0.62rem', color: '#1976d2', fontWeight: 700, mt: 0.25 }}>COMPARE</Typography>
                      )}
                    </Box>
                  );
                })()}

                <Divider sx={{ mx: 1.5, my: 0.75, borderColor: '#f0f0f0' }} />

                {snapshots.map((s) => {
                  const isPrimary = s.snapshot_date === effectiveSelected;
                  const isCompareEntry = s.snapshot_date === compareDate;
                  return (
                    <Box
                      key={s.snapshot_date}
                      onClick={() => {
                        if (isCompareMode && !isPrimary) onCompareDate(s.snapshot_date);
                        else onSelectDate(s.snapshot_date);
                      }}
                      sx={{
                        mx: 1, mb: 0.5, px: 1.5, py: 1, borderRadius: '8px', cursor: 'pointer',
                        bgcolor: isPrimary ? '#DA251C' : isCompareEntry ? 'rgba(218,37,28,0.08)' : 'transparent',
                        border: isCompareEntry ? '1px solid rgba(218,37,28,0.3)' : '1px solid transparent',
                        '&:hover': { bgcolor: isPrimary ? '#DA251C' : 'rgba(0,0,0,0.04)' },
                      }}
                    >
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: isPrimary ? 'white' : '#1d1d1f' }}>
                        {s.snapshot_date}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '0.65rem', color: isPrimary ? 'rgba(255,255,255,0.75)' : '#aaa' }}>
                          {s.total_items} item
                        </Typography>
                        {s.changed_items > 0 && (
                          <Typography sx={{ fontSize: '0.65rem', color: isPrimary ? 'rgba(255,255,255,0.75)' : '#FF9800', fontWeight: 600 }}>
                            · {s.changed_items} berubah
                          </Typography>
                        )}
                      </Box>
                      {isCompareEntry && (
                        <Typography sx={{ fontSize: '0.62rem', color: '#DA251C', fontWeight: 700, mt: 0.25 }}>COMPARE</Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {/* Tombol compare */}
              {!isCompareMode && (
                <Box sx={{ p: 1.5, borderTop: '1px solid #f0f0f0' }}>
                  <Typography sx={{ fontSize: '0.65rem', color: '#aaa', mb: 0.75, lineHeight: 1.4 }}>
                    Bandingkan snapshot dengan kondisi saat ini atau snapshot lain.
                  </Typography>
                  <Button
                    size="small" fullWidth variant="outlined"
                    startIcon={<CompareArrowsIcon sx={{ fontSize: 15 }} />}
                    onClick={() => {
                      // default: compare ke "Saat Ini" jika primary bukan current, atau ke snapshot terakhir jika primary adalah current
                      if (effectiveSelected !== CURRENT_DATE_KEY) {
                        onCompareDate(CURRENT_DATE_KEY);
                      } else {
                        const other = snapshots[0];
                        if (other) onCompareDate(other.snapshot_date);
                      }
                    }}
                    sx={{ fontSize: '0.72rem', borderColor: '#d0d0d0', color: '#555', borderRadius: '8px', textTransform: 'none' }}
                  >
                    Compare
                  </Button>
                </Box>
              )}
            </Box>

            {/* ── Main panel: tabel snapshot ── */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Sub-header info */}
              <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: effectiveSelected === CURRENT_DATE_KEY ? '#1976d2' : '#1d1d1f' }}>
                  {labelOf(effectiveSelected)}
                </Typography>
                {primaryGroup && (
                  <Chip label={`${primaryGroup.total_items} item`} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f0f0f0', color: '#555' }} />
                )}
                {isCompareMode && compareDate && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ArrowForwardIcon sx={{ fontSize: 16, color: '#aaa' }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: compareDate === CURRENT_DATE_KEY ? '#1976d2' : '#DA251C' }}>
                        {labelOf(compareDate)}
                      </Typography>
                    </Box>
                    {primaryGroup && compareGroup && (() => {
                      const allIds = Array.from(new Set([
                        ...primaryGroup.items.map(i => i.arsitektur_id),
                        ...compareGroup.items.map(i => i.arsitektur_id),
                      ]));
                      let changed = 0, added = 0, removed = 0;
                      for (const id of allIds) {
                        const base = primaryGroup.items.find(i => i.arsitektur_id === id);
                        const cmp  = compareGroup.items.find(i => i.arsitektur_id === id);
                        if (!base) added++;
                        else if (!cmp) removed++;
                        else if (diffItems(base, cmp).length > 0) changed++;
                      }
                      return (
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          {changed > 0 && <Chip label={`${changed} berubah`} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(255,152,0,0.12)', color: '#E65100', fontWeight: 600 }} />}
                          {added   > 0 && <Chip label={`${added} baru`}     size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(76,175,80,0.12)',  color: '#2E7D32', fontWeight: 600 }} />}
                          {removed > 0 && <Chip label={`${removed} hapus`}  size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(244,67,54,0.1)',   color: '#C62828', fontWeight: 600 }} />}
                          {changed + added + removed === 0 && <Chip label="Tidak ada perubahan" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f0f0f0', color: '#86868b' }} />}
                        </Box>
                      );
                    })()}
                  </>
                )}
              </Box>

              {/* Tabel unified — normal & compare mode */}
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 190, position: 'sticky', left: 0, zIndex: 3 }}>Sub Kategori</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 110 }}>Baseline</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 110 }}>Target</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 140 }}>Action</TableCell>
                      {periodYears.map(y => (
                        <TableCell key={y} align="center" sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 46 }}>{y}</TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 200 }}>Inisiatif RBSI</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 80 }}>SKPA</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#444', fontSize: '0.78rem', bgcolor: '#f8f9fa', minWidth: 160 }}>Keterangan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!primaryGroup ? null : (() => {
                      const baseItems = primaryGroup.items;
                      const allIds = isCompareMode
                        ? Array.from(new Set([
                            ...baseItems.map(i => i.arsitektur_id),
                            ...(compareGroup?.items ?? []).map(i => i.arsitektur_id),
                          ]))
                        : baseItems.map(i => i.arsitektur_id);

                      return allIds.map(arsId => {
                        const base    = baseItems.find(i => i.arsitektur_id === arsId) ?? null;
                        const cmp     = compareMap.get(arsId) ?? null;
                        const display = isCompareMode ? (cmp ?? base!) : base!;

                        const changes       = isCompareMode && base && cmp ? diffItems(base, cmp) : [];
                        const changedFields = new Set(changes.map(c => c.field));
                        const isAdded       = isCompareMode && !base && Boolean(cmp);
                        const isRemoved     = isCompareMode && Boolean(base) && !cmp;
                        const hasChanges    = changes.length > 0;

                        const ys     = parseYS(display.year_statuses);
                        const baseYS = isCompareMode ? parseYS(base?.year_statuses ?? null) : ys;

                        const rowBg = isAdded   ? 'rgba(76,175,80,0.05)'
                          : isRemoved ? 'rgba(244,67,54,0.05)'
                          : hasChanges ? 'rgba(255,152,0,0.03)'
                          : undefined;

                        const rowBorderLeft = isAdded   ? '3px solid #4CAF50'
                          : isRemoved ? '3px solid #f44336'
                          : hasChanges ? '3px solid #FF9800'
                          : '3px solid transparent';

                        // Render cell yang berubah: tampilkan nilai lama (coret) → nilai baru
                        const renderDiffChip = (field: string, curVal: string | null, renderFn: (v: string) => React.ReactNode) => {
                          if (!isCompareMode || !changedFields.has(field)) {
                            return curVal ? renderFn(curVal) : <Typography sx={{ fontSize: '0.8rem', color: '#ccc' }}>—</Typography>;
                          }
                          const change = changes.find(c => c.field === field)!;
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                              {change.oldValue !== '—' && (
                                <Box sx={{ opacity: 0.5, textDecoration: 'line-through', textDecorationColor: '#f44336' }}>
                                  {renderFn(change.oldValue)}
                                </Box>
                              )}
                              {curVal ? renderFn(curVal)
                                : <Typography sx={{ fontSize: '0.75rem', color: '#ccc' }}>—</Typography>}
                            </Box>
                          );
                        };

                        const renderDiffYS = (year: number) => {
                          const curStatus  = ys[year] || '';
                          const prevStatus = baseYS[year] || '';
                          const changed    = isCompareMode && changedFields.has(String(year));
                          const curStyle   = getYearStatusStyle(curStatus);
                          const prevStyle  = getYearStatusStyle(prevStatus);
                          if (!changed) {
                            return (
                              <Tooltip title={curStatus || 'Belum diatur'}>
                                <Box sx={{ width: 26, height: 26, borderRadius: '6px', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: curStyle.bgcolor, color: curStyle.color, fontSize: '0.72rem', fontWeight: 700 }}>{curStyle.label}</Box>
                              </Tooltip>
                            );
                          }
                          return (
                            <Tooltip title={`${prevStatus || '—'} → ${curStatus || '—'}`}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                                <Box sx={{ width: 24, height: 24, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: prevStyle.bgcolor, color: prevStyle.color, fontSize: '0.68rem', fontWeight: 700, opacity: 0.45, textDecoration: 'line-through' }}>{prevStyle.label}</Box>
                                <Box sx={{ width: 24, height: 24, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: curStyle.bgcolor, color: curStyle.color, fontSize: '0.68rem', fontWeight: 700, outline: '2px solid #FF9800' }}>{curStyle.label}</Box>
                              </Box>
                            </Tooltip>
                          );
                        };

                        return (
                          <TableRow key={arsId} sx={{ bgcolor: rowBg, '&:hover': { bgcolor: isAdded ? 'rgba(76,175,80,0.08)' : isRemoved ? 'rgba(244,67,54,0.08)' : 'rgba(0,0,0,0.015)' }, '& > td:first-of-type': { borderLeft: rowBorderLeft } }}>
                            {/* Sub Kategori */}
                            <TableCell sx={{ py: 0.75, position: 'sticky', left: 0, bgcolor: rowBg ?? 'white', zIndex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                {display.sub_kategori_kode && (
                                  <Chip label={display.sub_kategori_kode} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: getSubKategoriColor(display.sub_kategori_kode), color: 'white' }} />
                                )}
                                <Typography sx={{ fontSize: '0.78rem', color: '#333' }}>{display.sub_kategori_nama || display.aplikasi_kode || '—'}</Typography>
                                {isAdded   && <Chip label="BARU"    size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }} />}
                                {isRemoved && <Chip label="DIHAPUS" size="small" sx={{ height: 16, fontSize: '0.58rem', bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700 }} />}
                              </Box>
                            </TableCell>

                            {/* Baseline */}
                            <TableCell sx={{ py: 0.75 }}>
                              {renderDiffChip('aplikasi_baseline', display.aplikasi_baseline_kode,
                                v => <Chip label={v} size="small" sx={{ height: 22, fontSize: '0.73rem', fontWeight: 600 }} />)}
                            </TableCell>

                            {/* Target */}
                            <TableCell sx={{ py: 0.75 }}>
                              {renderDiffChip('aplikasi_target', display.aplikasi_target_kode,
                                v => <Chip label={v} size="small" sx={{ height: 22, fontSize: '0.73rem', fontWeight: 600 }} />)}
                            </TableCell>

                            {/* Action */}
                            <TableCell sx={{ py: 0.75 }}>
                              {renderDiffChip('action', display.action,
                                v => <Chip label={v.split(' ')[0]} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: `${getActionColor(v)}18`, color: getActionColor(v), fontWeight: 700 }} />)}
                            </TableCell>

                            {/* Year statuses */}
                            {periodYears.map(y => (
                              <TableCell key={y} align="center" sx={{ py: 0.75 }}>{renderDiffYS(y)}</TableCell>
                            ))}

                            {/* Inisiatif */}
                            <TableCell sx={{ py: 0.75 }}>
                              {renderDiffChip('inisiatif_group', display.inisiatif_group_nama,
                                v => <Typography sx={{ fontSize: '0.78rem', color: '#1d1d1f' }}>{v}</Typography>)}
                            </TableCell>

                            {/* SKPA */}
                            <TableCell sx={{ py: 0.75 }}>
                              {renderDiffChip('skpa', display.skpa_kode,
                                v => <Chip label={v} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }} />)}
                            </TableCell>

                            {/* Keterangan */}
                            <TableCell sx={{ py: 0.75 }}>
                              {renderDiffChip('keterangan', display.keterangan,
                                v => <Tooltip title={v}><Typography sx={{ fontSize: '0.78rem', color: '#555', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</Typography></Tooltip>)}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Legend compare */}
              {isCompareMode && (
                <Box sx={{ px: 2.5, py: 1, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 2.5, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 22, height: 14, borderRadius: '3px', bgcolor: '#f5f5f5', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '0.6rem', color: '#aaa', textDecoration: 'line-through' }}>lama</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>nilai sebelumnya (dicoret)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 3, height: 14, bgcolor: '#FF9800', borderRadius: '2px' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>cell berubah</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 3, height: 14, bgcolor: '#4CAF50', borderRadius: '2px' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>baris baru</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 3, height: 14, bgcolor: '#f44336', borderRadius: '2px' }} />
                    <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>baris dihapus</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default RbsiArsitekturPage;
