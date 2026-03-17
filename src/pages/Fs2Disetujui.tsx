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
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  TuneRounded,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { searchApprovedFs2Documents, updateFs2Document, type Fs2DocumentData, type Fs2DocumentRequest } from '../api/fs2Api';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { getUsersByRole, type UserSimple } from '../api/userApi';
import { usePermissions } from '../hooks/usePermissions';

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
  const [selectedFs2ForView, setSelectedFs2ForView] = useState<Fs2DocumentData | null>(null);

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
    const fs2 = rawData.find(item => item.id === fs2Id);
    if (fs2) {
      setSelectedFs2ForView(fs2);
      setOpenViewModal(true);
    }
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setSelectedFs2ForView(null);
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          F.S.2 Disetujui
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Cari F.S.2..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<TuneRounded />}
          onClick={handleFilterClick}
          sx={{ borderRadius: 2 }}
        >
          Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
      </Box>

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 320, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Filter</Typography>
            <IconButton size="small" onClick={handleFilterClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Progres Filter */}
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Progres</Typography>
          <FormGroup>
            {PROGRES_OPTIONS.map((progres) => (
              <FormControlLabel
                key={progres}
                control={
                  <Checkbox
                    checked={selectedProgres.has(progres)}
                    onChange={(e) => {
                      const newSet = new Set(selectedProgres);
                      if (e.target.checked) newSet.add(progres);
                      else newSet.delete(progres);
                      setSelectedProgres(newSet);
                    }}
                    size="small"
                  />
                }
                label={PROGRES_LABELS[progres]}
              />
            ))}
          </FormGroup>

          {/* Fase Pengajuan Filter */}
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1, mt: 2 }}>Fase Pengajuan</Typography>
          <FormGroup>
            {FASE_PENGAJUAN_OPTIONS.map((fase) => (
              <FormControlLabel
                key={fase}
                control={
                  <Checkbox
                    checked={selectedFase.has(fase)}
                    onChange={(e) => {
                      const newSet = new Set(selectedFase);
                      if (e.target.checked) newSet.add(fase);
                      else newSet.delete(fase);
                      setSelectedFase(newSet);
                    }}
                    size="small"
                  />
                }
                label={FASE_LABELS[fase]}
              />
            ))}
          </FormGroup>

          {/* Mekanisme Filter */}
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1, mt: 2 }}>Mekanisme</Typography>
          <FormGroup>
            {MEKANISME_OPTIONS.map((mekanisme) => (
              <FormControlLabel
                key={mekanisme}
                control={
                  <Checkbox
                    checked={selectedMekanisme.has(mekanisme)}
                    onChange={(e) => {
                      const newSet = new Set(selectedMekanisme);
                      if (e.target.checked) newSet.add(mekanisme);
                      else newSet.delete(mekanisme);
                      setSelectedMekanisme(newSet);
                    }}
                    size="small"
                  />
                }
                label={MEKANISME_LABELS[mekanisme]}
              />
            ))}
          </FormGroup>

          {/* Pelaksanaan Filter */}
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1, mt: 2 }}>Pelaksanaan</Typography>
          <FormGroup>
            {PELAKSANAAN_OPTIONS.map((pelaksanaan) => (
              <FormControlLabel
                key={pelaksanaan}
                control={
                  <Checkbox
                    checked={selectedPelaksanaan.has(pelaksanaan)}
                    onChange={(e) => {
                      const newSet = new Set(selectedPelaksanaan);
                      if (e.target.checked) newSet.add(pelaksanaan);
                      else newSet.delete(pelaksanaan);
                      setSelectedPelaksanaan(newSet);
                    }}
                    size="small"
                  />
                }
                label={PELAKSANAAN_LABELS[pelaksanaan]}
              />
            ))}
          </FormGroup>

          {/* Bidang Filter */}
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Bidang</InputLabel>
            <Select
              value={selectedBidangFilter}
              label="Bidang"
              onChange={(e) => setSelectedBidangFilter(e.target.value)}
            >
              <MenuItem value="">Semua</MenuItem>
              {bidangList.map((bidang) => (
                <MenuItem key={bidang.id} value={bidang.id}>{bidang.nama_bidang}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* SKPA Filter */}
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>SKPA</InputLabel>
            <Select
              value={selectedSkpaFilter}
              label="SKPA"
              onChange={(e) => setSelectedSkpaFilter(e.target.value)}
            >
              <MenuItem value="">Semua</MenuItem>
              {skpaList.map((skpa) => (
                <MenuItem key={skpa.id} value={skpa.id}>{skpa.kode_skpa} - {skpa.nama_skpa}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button fullWidth variant="text" onClick={clearFilters} sx={{ mt: 2 }}>
            Clear Filters
          </Button>
        </Box>
      </Popover>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>No</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'namaAplikasi'}
                  direction={orderBy === 'namaAplikasi' ? order : 'asc'}
                  onClick={() => handleRequestSort('namaAplikasi')}
                >
                  Nama Aplikasi
                </TableSortLabel>
              </TableCell>
              <TableCell>Progres</TableCell>
              <TableCell>Fase Pengajuan</TableCell>
              <TableCell>IKU</TableCell>
              <TableCell>Bidang</TableCell>
              <TableCell>SKPA</TableCell>
              <TableCell>Mekanisme</TableCell>
              <TableCell>Pelaksanaan</TableCell>
              <TableCell>PIC</TableCell>
              <TableCell>Dokumen</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : fs2Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Tidak ada data F.S.2 Disetujui</Typography>
                </TableCell>
              </TableRow>
            ) : (
              fs2Data.map((row, index) => {
                const skpaColor = getChipColor(row.skpa);
                const progresColor = PROGRES_COLORS[row.progres] || { bg: '#f5f5f5', text: '#666' };
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{row.namaAplikasi}</TableCell>
                    <TableCell>
                      <Chip
                        label={PROGRES_LABELS[row.progres] || row.progres}
                        size="small"
                        sx={{
                          bgcolor: progresColor.bg,
                          color: progresColor.text,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>{FASE_LABELS[row.fasePengajuan] || row.fasePengajuan}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.iku === 'Y' ? 'Ya' : row.iku === 'T' ? 'Tidak' : row.iku}
                        size="small"
                        sx={{
                          bgcolor: row.iku === 'Y' ? '#D1FAE5' : '#FEE2E2',
                          color: row.iku === 'Y' ? '#059669' : '#DC2626',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>{row.bidang}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.skpa}
                        size="small"
                        sx={{
                          bgcolor: skpaColor.bg,
                          color: skpaColor.text,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>{MEKANISME_LABELS[row.mekanisme] || row.mekanisme}</TableCell>
                    <TableCell>{getPelaksanaanDisplay(row)}</TableCell>
                    <TableCell>{row.pic}</TableCell>
                    <TableCell>
                      {row.dokumenPath ? (
                        <Link href={row.dokumenPath} target="_blank" rel="noopener">
                          <IconButton size="small">
                            <FileIcon fontSize="small" />
                          </IconButton>
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Lihat Detail">
                          <IconButton size="small" onClick={() => handleOpenViewModal(row.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {fs2Permissions.canUpdate && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEditModal(row.id)}>
                              <EditIcon fontSize="small" />
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
        />
      </TableContainer>

      {/* View Modal */}
      <Dialog open={openViewModal} onClose={handleCloseViewModal} maxWidth="md" fullWidth>
        <DialogTitle>Detail F.S.2 Disetujui</DialogTitle>
        <DialogContent>
          {selectedFs2ForView && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Aplikasi</Typography>
                <Typography>{selectedFs2ForView.nama_aplikasi || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Progres</Typography>
                <Typography>{PROGRES_LABELS[selectedFs2ForView.progres || ''] || selectedFs2ForView.progres || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Fase Pengajuan</Typography>
                <Typography>{FASE_LABELS[selectedFs2ForView.fase_pengajuan || ''] || selectedFs2ForView.fase_pengajuan || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">IKU</Typography>
                <Typography>{selectedFs2ForView.iku === 'Y' ? 'Ya' : selectedFs2ForView.iku === 'T' ? 'Tidak' : '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Bidang</Typography>
                <Typography>{selectedFs2ForView.nama_bidang || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">SKPA</Typography>
                <Typography>{selectedFs2ForView.kode_skpa || selectedFs2ForView.nama_skpa || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Mekanisme</Typography>
                <Typography>{MEKANISME_LABELS[selectedFs2ForView.mekanisme || ''] || selectedFs2ForView.mekanisme || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pelaksanaan</Typography>
                <Typography>
                  {selectedFs2ForView.pelaksanaan === 'SINGLE_YEAR' 
                    ? `Single Year${selectedFs2ForView.tahun ? ` (${selectedFs2ForView.tahun})` : ''}`
                    : selectedFs2ForView.pelaksanaan === 'MULTIYEARS'
                      ? `Multiyears${selectedFs2ForView.tahun_mulai && selectedFs2ForView.tahun_selesai ? ` (${selectedFs2ForView.tahun_mulai} - ${selectedFs2ForView.tahun_selesai})` : ''}`
                      : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">PIC</Typography>
                <Typography>{selectedFs2ForView.pic_name || '-'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewModal}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle>Edit F.S.2 Disetujui</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Progres</InputLabel>
              <Select
                value={editFormData.progres || ''}
                label="Progres"
                onChange={(e) => setEditFormData({ ...editFormData, progres: e.target.value })}
              >
                {PROGRES_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{PROGRES_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Fase Pengajuan</InputLabel>
              <Select
                value={editFormData.fase_pengajuan || ''}
                label="Fase Pengajuan"
                onChange={(e) => setEditFormData({ ...editFormData, fase_pengajuan: e.target.value })}
              >
                {FASE_PENGAJUAN_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{FASE_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>IKU</InputLabel>
              <Select
                value={editFormData.iku || ''}
                label="IKU"
                onChange={(e) => setEditFormData({ ...editFormData, iku: e.target.value })}
              >
                <MenuItem value="Y">Ya</MenuItem>
                <MenuItem value="T">Tidak</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Mekanisme</InputLabel>
              <Select
                value={editFormData.mekanisme || ''}
                label="Mekanisme"
                onChange={(e) => setEditFormData({ ...editFormData, mekanisme: e.target.value })}
              >
                {MEKANISME_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{MEKANISME_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Pelaksanaan</InputLabel>
              <Select
                value={editFormData.pelaksanaan || ''}
                label="Pelaksanaan"
                onChange={(e) => setEditFormData({ ...editFormData, pelaksanaan: e.target.value })}
              >
                {PELAKSANAAN_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{PELAKSANAAN_LABELS[option]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {editFormData.pelaksanaan === 'SINGLE_YEAR' && (
              <TextField
                label="Tahun"
                type="number"
                size="small"
                value={editFormData.tahun || ''}
                onChange={(e) => setEditFormData({ ...editFormData, tahun: parseInt(e.target.value) || undefined })}
                fullWidth
              />
            )}

            {editFormData.pelaksanaan === 'MULTIYEARS' && (
              <>
                <TextField
                  label="Tahun Mulai"
                  type="number"
                  size="small"
                  value={editFormData.tahun_mulai || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, tahun_mulai: parseInt(e.target.value) || undefined })}
                  fullWidth
                />
                <TextField
                  label="Tahun Selesai"
                  type="number"
                  size="small"
                  value={editFormData.tahun_selesai || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, tahun_selesai: parseInt(e.target.value) || undefined })}
                  fullWidth
                />
              </>
            )}

            <Autocomplete
              options={userList}
              getOptionLabel={(option) => option.full_name}
              value={userList.find(u => u.uuid === editFormData.pic_id) || null}
              onChange={(_, newValue) => setEditFormData({ ...editFormData, pic_id: newValue?.uuid || '' })}
              renderInput={(params) => <TextField {...params} label="PIC" size="small" />}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Batal</Button>
          <Button variant="contained" onClick={handleEditSubmit}>Simpan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fs2Disetujui;
