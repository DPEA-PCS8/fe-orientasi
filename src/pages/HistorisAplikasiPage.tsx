import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogContent, DialogActions, DialogTitle, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Chip, Skeleton,
  Divider, TextField, Badge, Popover, Autocomplete, Checkbox, FormControlLabel
} from '@mui/material';
import { 
  HistoryRounded, FilterAlt, BarChart,
  Add, Lock, Edit, Delete, CompareArrows, TrendingUp, 
  TrendingFlat, Close, Search
} from '@mui/icons-material';
import {
  getHistorisByPeriode,
  getStatistikByPeriode,
  generateSnapshots,
  updateSnapshot,
  deleteSnapshot,
  type AplikasiHistorisListData,
  type AplikasiStatistikData,
  type UpdateSnapshotRequest,
  addChangelog,
  type ChangelogRequest,
  getSnapshotByAplikasiAndTahun,
  type AplikasiSnapshotData
} from '../api/historisAplikasiApi';
import { APPLICATION_STATUS_LABELS } from '../api/aplikasiApi';
import { getAllBidang, type BidangData } from '../api/bidangApi';
import { getAllSkpa, type SkpaData } from '../api/skpaApi';
import { usePermissions } from '../hooks/usePermissions';

const MENU_CODE = 'HISTORIS_APLIKASI';

interface GroupedData {
  aplikasiId: string;
  kodeAplikasi: string;
  namaAplikasi: string;
  bidangId?: string;
  bidangKode?: string;
  bidangNama: string;
  skpaId?: string;
  skpaKode?: string;
  skpaNama: string;
  snapshotsByYear: Map<number, AplikasiHistorisListData>;
}

interface ComparisonField {
  label: string;
  key: keyof AplikasiSnapshotData;
  formatter?: (value: unknown) => string;
}

const COMPARISON_FIELDS: ComparisonField[] = [
  { label: 'Kode Aplikasi', key: 'kode_aplikasi' },
  { label: 'Nama Aplikasi', key: 'nama_aplikasi' },
  { label: 'Status', key: 'status_aplikasi', formatter: (v) => APPLICATION_STATUS_LABELS[v as string] || (v as string) },
  { label: 'Deskripsi', key: 'deskripsi' },
  { label: 'Bidang', key: 'bidang', formatter: (v) => (v as { nama_bidang?: string })?.nama_bidang || '-' },
  { label: 'SKPA', key: 'skpa', formatter: (v) => (v as { nama_skpa?: string })?.nama_skpa || '-' },
  { label: 'Tanggal Implementasi', key: 'tanggal_implementasi' },
  { label: 'Akses', key: 'akses' },
  { label: 'Proses Data Pribadi', key: 'proses_data_pribadi', formatter: (v) => v ? 'Ya' : 'Tidak' },
];

const HistorisAplikasiPage = () => {
  const [historisList, setHistorisList] = useState<AplikasiHistorisListData[]>([]);
  const [statistikList, setStatistikList] = useState<AplikasiStatistikData[]>([]);
  const [bidangList, setBidangList] = useState<BidangData[]>([]);
  const [skpaList, setSkpaList] = useState<SkpaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear() - 2);
  const [endYear, setEndYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBidang, setFilterBidang] = useState<string>('');
  const [filterSkpa, setFilterSkpa] = useState<string>('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateYear, setGenerateYear] = useState<number>(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<AplikasiSnapshotData | null>(null);
  const [editForm, setEditForm] = useState<UpdateSnapshotRequest>({});
  const [updating, setUpdating] = useState(false);
  const [editYear, setEditYear] = useState<number | null>(null);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareSnapshots, setCompareSnapshots] = useState<AplikasiSnapshotData[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [selectedAplikasiName, setSelectedAplikasiName] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ aplikasiId: string; tahun: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditYearDialog, setShowEditYearDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<{ aplikasiId: string; tahun: number; availableYears: number[] } | null>(null);
  const [showChangelogDialog, setShowChangelogDialog] = useState(false);
  const [changelogForm, setChangelogForm] = useState<ChangelogRequest>({
    tanggal_perubahan: new Date().toISOString().split('T')[0],
    keterangan: ''
  });
  const [addingChangelog, setAddingChangelog] = useState(false);
  const [statsAnchorEl, setStatsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const statsOpen = Boolean(statsAnchorEl);

  const { getMenuPermissions, permissionsLoaded } = usePermissions();
  const permissions = getMenuPermissions(MENU_CODE);
  const aplikasiPermissions = getMenuPermissions('APLIKASI');
  const canView = permissions.canView || aplikasiPermissions.canView;
  const canCreate = permissions.canCreate || aplikasiPermissions.canCreate;
  const canEdit = permissions.canUpdate || aplikasiPermissions.canUpdate;
  const canDelete = permissions.canDelete || aplikasiPermissions.canDelete;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historisRes, statistikRes, bidangRes, skpaRes] = await Promise.all([
        getHistorisByPeriode(startYear, endYear),
        getStatistikByPeriode(startYear, endYear),
        getAllBidang(),
        getAllSkpa()
      ]);
      setHistorisList(historisRes.data || []);
      setStatistikList(statistikRes.data || []);
      setBidangList(bidangRes || []);
      setSkpaList(skpaRes.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data historis';
      setError(errorMessage);
      setHistorisList([]);
      setStatistikList([]);
    } finally {
      setLoading(false);
    }
  }, [startYear, endYear]);

  useEffect(() => {
    if (permissionsLoaded && canView) {
      fetchData();
    }
  }, [permissionsLoaded, canView, fetchData]);

  // Group data by aplikasi
  const groupedData = useMemo(() => {
    const grouped = new Map<string, GroupedData>();
    
    historisList.forEach(item => {
      if (!grouped.has(item.aplikasi_id)) {
        // Find bidang ID from bidangList
        const bidang = bidangList.find(b => b.kode_bidang === item.bidang_kode);
        // Find skpa ID from skpaList
        const skpa = skpaList.find(s => s.kode_skpa === item.skpa_kode);
        
        grouped.set(item.aplikasi_id, {
          aplikasiId: item.aplikasi_id,
          kodeAplikasi: item.kode_aplikasi,
          namaAplikasi: item.nama_aplikasi,
          bidangId: bidang?.id,
          bidangKode: item.bidang_kode,
          bidangNama: item.bidang_nama || '-',
          skpaId: skpa?.id,
          skpaKode: item.skpa_kode,
          skpaNama: item.skpa_nama || '-',
          snapshotsByYear: new Map()
        });
      }
      
      const group = grouped.get(item.aplikasi_id)!;
      group.snapshotsByYear.set(item.tahun, item);
      if (item.bidang_kode) group.bidangKode = item.bidang_kode;
      if (item.bidang_nama) group.bidangNama = item.bidang_nama;
      if (item.skpa_kode) group.skpaKode = item.skpa_kode;
      if (item.skpa_nama) group.skpaNama = item.skpa_nama;
    });
    
    let result = Array.from(grouped.values());
    
    // Apply search filter (nama or kode aplikasi)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(g => 
        g.namaAplikasi.toLowerCase().includes(query) ||
        g.kodeAplikasi.toLowerCase().includes(query)
      );
    }
    
    // Apply bidang filter
    if (filterBidang) {
      result = result.filter(g => g.bidangId === filterBidang);
    }
    
    // Apply skpa filter
    if (filterSkpa) {
      result = result.filter(g => g.skpaId === filterSkpa);
    }
    
    return result.sort((a, b) => a.kodeAplikasi.localeCompare(b.kodeAplikasi));
  }, [historisList, searchQuery, filterBidang, filterSkpa, bidangList, skpaList]);

  // Get years array
  const years = useMemo(() => {
    const yearsArr: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
      yearsArr.push(year);
    }
    return yearsArr.sort();
  }, [startYear, endYear]);

  const handleGenerateSnapshots = async () => {
    if (!canCreate) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await generateSnapshots(generateYear);
      setSuccess(`Berhasil generate ${response.data?.total_generated || 0} snapshot untuk tahun ${generateYear}`);
      setShowGenerateDialog(false);
      await fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal generate snapshots';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenEdit = async (aplikasiId: string, tahun: number) => {
    if (!canEdit) return;
    setError(null);
    try {
      const response = await getSnapshotByAplikasiAndTahun(aplikasiId, tahun);
      setSelectedSnapshot(response.data || null);
      setEditYear(tahun);
      setEditForm({
        kode_aplikasi: response.data?.kode_aplikasi,
        nama_aplikasi: response.data?.nama_aplikasi,
        deskripsi: response.data?.deskripsi,
        status_aplikasi: response.data?.status_aplikasi,
        bidang_id: response.data?.bidang?.id,
        skpa_id: response.data?.skpa?.id,
        tanggal_implementasi: response.data?.tanggal_implementasi,
        akses: response.data?.akses,
        proses_data_pribadi: response.data?.proses_data_pribadi,
        keterangan_historis: ''
      });
      setShowEditDialog(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil detail snapshot';
      setError(errorMessage);
    }
  };

  const handleUpdateSnapshot = async () => {
    if (!selectedSnapshot) return;
    setUpdating(true);
    setError(null);
    try {
      await updateSnapshot(selectedSnapshot.id, editForm);
      setSuccess('Snapshot berhasil diupdate');
      setShowEditDialog(false);
      await fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal update snapshot';
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenCompare = async (group: GroupedData) => {
    setLoadingCompare(true);
    setSelectedAplikasiName(group.namaAplikasi);
    setCompareSnapshots([]);
    setShowCompareDialog(true);
    
    try {
      const snapshots: AplikasiSnapshotData[] = [];
      for (const year of years) {
        if (group.snapshotsByYear.has(year)) {
          const response = await getSnapshotByAplikasiAndTahun(group.aplikasiId, year);
          if (response.data) {
            snapshots.push(response.data);
          }
        }
      }
      setCompareSnapshots(snapshots.sort((a, b) => a.tahun - b.tahun));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengambil data perbandingan';
      setError(errorMessage);
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await getSnapshotByAplikasiAndTahun(deleteTarget.aplikasiId, deleteTarget.tahun);
      if (response.data?.id) {
        await deleteSnapshot(response.data.id);
        setSuccess('Snapshot berhasil dihapus');
        setShowDeleteDialog(false);
        setDeleteTarget(null);
        await fetchData();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus snapshot';
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddChangelog = async () => {
    if (!selectedSnapshot || !changelogForm.keterangan) return;
    setAddingChangelog(true);
    try {
      await addChangelog(selectedSnapshot.id, changelogForm);
      setSuccess('Changelog berhasil ditambahkan');
      setShowChangelogDialog(false);
      setChangelogForm({
        tanggal_perubahan: new Date().toISOString().split('T')[0],
        keterangan: ''
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menambahkan changelog';
      setError(errorMessage);
    } finally {
      setAddingChangelog(false);
    }
  };

  const getStatusChip = (status: string, size: 'small' | 'medium' = 'small') => {
    const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      AKTIF: 'success',
      IDLE: 'warning',
      DIAKHIRI: 'error',
    };
    return (
      <Chip
        label={APPLICATION_STATUS_LABELS[status] || status}
        color={colorMap[status] || 'default'}
        size={size}
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getFieldValue = (snapshot: AplikasiSnapshotData, field: ComparisonField): string => {
    const value = snapshot[field.key];
    if (value === null || value === undefined) return '-';
    if (field.formatter) return field.formatter(value);
    return String(value);
  };

  const hasChanged = (prev: AplikasiSnapshotData | undefined, current: AplikasiSnapshotData, field: ComparisonField): boolean => {
    if (!prev) return false;
    return getFieldValue(prev, field) !== getFieldValue(current, field);
  };

  const totalStats = useMemo(() => {
    return statistikList.reduce((acc, stat) => acc + stat.total_aplikasi, 0);
  }, [statistikList]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Loading state for permissions
  if (!permissionsLoaded) {
    return (
      <Box p={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  // No view permission
  if (!canView) {
    return (
      <Box p={3}>
        <Alert severity="error" icon={<Lock />} sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Akses Ditolak</Typography>
          <Typography variant="body2">
            Anda tidak memiliki izin untuk mengakses halaman Historis Aplikasi.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <HistoryRounded color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Historis Aplikasi
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Badge badgeContent={totalStats} color="primary" max={999}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BarChart />}
              onClick={(e) => setStatsAnchorEl(e.currentTarget)}
            >
              Statistik
            </Button>
          </Badge>
          {canCreate && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => setShowGenerateDialog(true)}
            >
              Generate Snapshot
            </Button>
          )}
        </Box>
      </Box>

      {/* Statistics Popover */}
      <Popover
        open={statsOpen}
        anchorEl={statsAnchorEl}
        onClose={() => setStatsAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight={600}>Statistik per Tahun</Typography>
            <IconButton size="small" onClick={() => setStatsAnchorEl(null)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {statistikList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Tidak ada data</Typography>
          ) : (
            statistikList.map((stat) => (
              <Box key={stat.tahun} sx={{ mb: 1.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={600}>{stat.tahun}</Typography>
                  <Chip label={`${stat.total_aplikasi} Apps`} size="small" color="primary" variant="outlined" />
                </Box>
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  {Object.entries(stat.by_status || {}).map(([status, count]) => (
                    <Chip
                      key={status}
                      label={`${APPLICATION_STATUS_LABELS[status] || status}: ${count}`}
                      size="small"
                      color={status === 'AKTIF' ? 'success' : status === 'IDLE' ? 'warning' : 'error'}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Popover>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <FilterAlt color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Periode:</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Dari</InputLabel>
            <Select
              value={startYear.toString()}
              label="Dari"
              onChange={(e) => setStartYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Sampai</InputLabel>
            <Select
              value={endYear.toString()}
              label="Sampai"
              onChange={(e) => setEndYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', height: 30, mx: 1 }} />

          <TextField
            size="small"
            placeholder="Cari nama/kode aplikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <Search color="action" sx={{ mr: 0.5 }} fontSize="small" />
            }}
          />

          <Autocomplete
            size="small"
            options={bidangList}
            getOptionLabel={(option) => `${option.kode_bidang} - ${option.nama_bidang}`}
            value={bidangList.find(b => b.id === filterBidang) || null}
            onChange={(_, newValue) => setFilterBidang(newValue?.id || '')}
            renderInput={(params) => (
              <TextField {...params} label="Bidang" placeholder="Cari bidang..." />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{option.kode_bidang}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{option.nama_bidang}</Typography>
                </Box>
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(opt => 
                opt.kode_bidang.toLowerCase().includes(search) ||
                opt.nama_bidang.toLowerCase().includes(search)
              );
            }}
            sx={{ minWidth: 200 }}
          />

          <Autocomplete
            size="small"
            options={skpaList}
            getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
            value={skpaList.find(s => s.id === filterSkpa) || null}
            onChange={(_, newValue) => setFilterSkpa(newValue?.id || '')}
            renderInput={(params) => (
              <TextField {...params} label="SKPA" placeholder="Cari SKPA..." />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{option.kode_skpa}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#86868b' }}>{option.nama_skpa}</Typography>
                </Box>
              </Box>
            )}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(opt => 
                opt.kode_skpa.toLowerCase().includes(search) ||
                opt.nama_skpa.toLowerCase().includes(search)
              );
            }}
            sx={{ minWidth: 200 }}
          />

          {(searchQuery || filterBidang || filterSkpa) && (
            <Button 
              variant="text" 
              size="small" 
              onClick={() => { setSearchQuery(''); setFilterBidang(''); setFilterSkpa(''); }}
              color="inherit"
            >
              Reset Filter
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Comparison Table */}
      <Paper sx={{ overflowX: 'auto' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600, minWidth: 40 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 220, position: 'sticky', left: 0, bgcolor: 'grey.100', zIndex: 1 }}>
                  Nama Aplikasi
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Bidang</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>SKPA</TableCell>
                {years.map(year => (
                  <TableCell key={year} align="center" sx={{ fontWeight: 600, minWidth: 100 }}>
                    {year}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 600, minWidth: 130 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton variant="text" width={20} /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    {years.map(year => (
                      <TableCell key={year}><Skeleton variant="text" /></TableCell>
                    ))}
                    <TableCell><Skeleton variant="text" /></TableCell>
                  </TableRow>
                ))
              ) : groupedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4 + years.length + 1} align="center">
                    <Typography color="text.secondary" py={4}>
                      Tidak ada data historis. Klik "Generate Snapshot" untuk membuat snapshot.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groupedData.map((group, index) => (
                  <TableRow key={group.aplikasiId} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>{index + 1}</TableCell>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper' }}>
                      <Box>
                        <Typography fontWeight={500}>
                          {group.namaAplikasi}
                        </Typography>
                        {group.kodeAplikasi && group.kodeAplikasi !== group.namaAplikasi && (
                          <Typography variant="caption" color="text.secondary">
                            {group.kodeAplikasi}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {group.bidangKode || group.bidangNama !== '-' ? (
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{group.bidangKode || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{group.bidangNama}</Typography>
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {group.skpaKode || group.skpaNama !== '-' ? (
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{group.skpaKode || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{group.skpaNama}</Typography>
                        </Box>
                      ) : '-'}
                    </TableCell>
                    {years.map((year, yearIdx) => {
                      const snapshot = group.snapshotsByYear.get(year);
                      const prevYearSnapshot = yearIdx > 0 ? group.snapshotsByYear.get(years[yearIdx - 1]) : undefined;
                      const statusChanged = prevYearSnapshot && snapshot && 
                        prevYearSnapshot.status_aplikasi !== snapshot.status_aplikasi;
                      
                      return (
                        <TableCell key={year} align="center">
                          {snapshot ? (
                            <Box position="relative">
                              {getStatusChip(snapshot.status_aplikasi)}
                              {statusChanged && (
                                <Tooltip title="Status berubah dari tahun sebelumnya">
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: -4,
                                      right: -4,
                                      bgcolor: 'warning.main',
                                      borderRadius: '50%',
                                      width: 12,
                                      height: 12,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Typography sx={{ fontSize: '8px', color: 'white', fontWeight: 700 }}>!</Typography>
                                  </Box>
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Lihat Perbandingan Detail">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenCompare(group)}
                          >
                            <CompareArrows fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip title="Edit Snapshot">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => {
                                const availableYears = Array.from(group.snapshotsByYear.keys()).sort((a, b) => b - a);
                                setEditTarget({ 
                                  aplikasiId: group.aplikasiId, 
                                  tahun: availableYears[0],
                                  availableYears 
                                });
                                setShowEditYearDialog(true);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Hapus Snapshot">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteTarget({ 
                                  aplikasiId: group.aplikasiId, 
                                  tahun: Math.max(...Array.from(group.snapshotsByYear.keys())) 
                                });
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Generate Snapshot Dialog */}
      <Dialog open={showGenerateDialog} onClose={() => setShowGenerateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Generate Snapshot</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Generate snapshot untuk semua aplikasi ke tahun yang dipilih.
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Tahun</InputLabel>
            <Select
              value={generateYear.toString()}
              label="Tahun"
              onChange={(e) => setGenerateYear(Number(e.target.value))}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGenerateDialog(false)} disabled={generating}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleGenerateSnapshots}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} /> : undefined}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Snapshot Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Snapshot - {selectedSnapshot?.nama_aplikasi} ({editYear})
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Basic Info */}
            <Typography variant="subtitle2" color="text.secondary">Informasi Dasar</Typography>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Kode Aplikasi"
                value={editForm.kode_aplikasi || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, kode_aplikasi: e.target.value }))}
                size="small"
              />
              <TextField
                fullWidth
                label="Nama Aplikasi"
                value={editForm.nama_aplikasi || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, nama_aplikasi: e.target.value }))}
                size="small"
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Deskripsi"
              value={editForm.deskripsi || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              size="small"
            />

            <Divider sx={{ my: 1 }} />

            {/* Organization */}
            <Typography variant="subtitle2" color="text.secondary">Bidang & SKPA</Typography>
            <Box display="flex" gap={2}>
              <Autocomplete
                fullWidth
                size="small"
                options={bidangList}
                getOptionLabel={(option) => `${option.kode_bidang} - ${option.nama_bidang}`}
                value={bidangList.find(b => b.id === editForm.bidang_id) || null}
                onChange={(_, newValue) => setEditForm(prev => ({ ...prev, bidang_id: newValue?.id || undefined }))}
                renderInput={(params) => <TextField {...params} label="Bidang" />}
              />
              <Autocomplete
                fullWidth
                size="small"
                options={skpaList}
                getOptionLabel={(option) => `${option.kode_skpa} - ${option.nama_skpa}`}
                value={skpaList.find(s => s.id === editForm.skpa_id) || null}
                onChange={(_, newValue) => setEditForm(prev => ({ ...prev, skpa_id: newValue?.id || undefined }))}
                renderInput={(params) => <TextField {...params} label="SKPA" />}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Status & Access */}
            <Typography variant="subtitle2" color="text.secondary">Status & Akses</Typography>
            <Box display="flex" gap={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status_aplikasi || ''}
                  label="Status"
                  onChange={(e) => setEditForm(prev => ({ ...prev, status_aplikasi: e.target.value }))}
                >
                  <MenuItem value="AKTIF">Aktif</MenuItem>
                  <MenuItem value="IDLE">Idle</MenuItem>
                  <MenuItem value="DIAKHIRI">Diakhiri</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Akses</InputLabel>
                <Select
                  value={editForm.akses || ''}
                  label="Akses"
                  onChange={(e) => setEditForm(prev => ({ ...prev, akses: e.target.value }))}
                >
                  <MenuItem value="INTERNET">Internet</MenuItem>
                  <MenuItem value="INTRANET">Intranet</MenuItem>
                  <MenuItem value="BOTH">Keduanya</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box display="flex" gap={2} alignItems="center">
              <TextField
                fullWidth
                type="date"
                label="Tanggal Implementasi"
                value={editForm.tanggal_implementasi || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, tanggal_implementasi: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editForm.proses_data_pribadi || false}
                    onChange={(e) => setEditForm(prev => ({ ...prev, proses_data_pribadi: e.target.checked }))}
                  />
                }
                label="Proses Data Pribadi"
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Changelog */}
            <Typography variant="subtitle2" color="text.secondary">Catatan Perubahan</Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Keterangan Historis"
              value={editForm.keterangan_historis || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, keterangan_historis: e.target.value }))}
              placeholder="Jelaskan perubahan pada snapshot ini..."
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)} disabled={updating}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleUpdateSnapshot}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={16} /> : undefined}
          >
            {updating ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison Detail Dialog */}
      <Dialog 
        open={showCompareDialog} 
        onClose={() => setShowCompareDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <CompareArrows color="primary" />
              <Typography variant="h6">
                Perbandingan Detail - {selectedAplikasiName}
              </Typography>
            </Box>
            <IconButton onClick={() => setShowCompareDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingCompare ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress />
            </Box>
          ) : compareSnapshots.length === 0 ? (
            <Typography color="text.secondary" align="center" py={4}>
              Tidak ada data snapshot untuk dibandingkan.
            </Typography>
          ) : (
            <Box>
              {/* Application Info */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
                <Box display="flex" gap={3} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Tahun Pertama Terdaftar
                    </Typography>
                    <Typography variant="h6" color="info.dark" fontWeight={600}>
                      {Math.min(...compareSnapshots.map(s => s.tahun))}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Jumlah Tahun Tercatat
                    </Typography>
                    <Typography variant="h6" color="info.dark" fontWeight={600}>
                      {compareSnapshots.length} Tahun
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Range Data
                    </Typography>
                    <Typography variant="h6" color="info.dark" fontWeight={600}>
                      {Math.min(...compareSnapshots.map(s => s.tahun))} - {Math.max(...compareSnapshots.map(s => s.tahun))}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Comparison Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Field</TableCell>
                      {compareSnapshots.map(snapshot => (
                        <TableCell 
                          key={snapshot.tahun} 
                          align="center" 
                          sx={{ fontWeight: 600, minWidth: 180 }}
                        >
                          Tahun {snapshot.tahun}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {COMPARISON_FIELDS.map(field => (
                      <TableRow key={field.key} hover>
                        <TableCell sx={{ fontWeight: 500, bgcolor: 'grey.50' }}>
                          {field.label}
                        </TableCell>
                        {compareSnapshots.map((snapshot, idx) => {
                          const displayValue = getFieldValue(snapshot, field);
                          const changed = idx > 0 && hasChanged(compareSnapshots[idx - 1], snapshot, field);
                          const rawValue = snapshot[field.key as keyof AplikasiSnapshotData];
                          
                          return (
                            <TableCell 
                              key={snapshot.tahun} 
                              align="center"
                              sx={{
                                bgcolor: changed ? 'warning.lighter' : 'inherit',
                                borderLeft: changed ? '3px solid' : 'none',
                                borderLeftColor: 'warning.main',
                              }}
                            >
                              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                {field.key === 'status_aplikasi' && rawValue ? (
                                  getStatusChip(String(rawValue))
                                ) : (
                                  <Typography variant="body2">{displayValue}</Typography>
                                )}
                                {changed && (
                                  <Tooltip title="Berubah dari tahun sebelumnya">
                                    <TrendingFlat color="warning" fontSize="small" />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Changes Summary */}
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Ringkasan Perubahan
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {compareSnapshots.length === 1 && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip label="BARU" size="small" color="success" />
                      <Typography variant="subtitle2" fontWeight={600} color="success.dark">
                        Aplikasi Baru (Tahun {compareSnapshots[0].tahun})
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Aplikasi ini pertama kali terdaftar di tahun {compareSnapshots[0].tahun}. 
                      Belum ada data historis sebelumnya dalam periode yang dipilih.
                    </Typography>
                  </Paper>
                )}
                {compareSnapshots.map((snapshot, idx) => {
                  if (idx === 0) {
                    // For first snapshot, check if it's the absolute first or just first in this period
                    if (compareSnapshots.length > 1) {
                      return (
                        <Paper key={snapshot.tahun} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              Tahun {snapshot.tahun} (Data Awal)
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Ini adalah snapshot pertama dalam periode yang dipilih. 
                            Data sebelum tahun ini belum tersedia.
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }
                  const prevSnapshot = compareSnapshots[idx - 1];
                  const changes: string[] = [];
                  
                  COMPARISON_FIELDS.forEach(field => {
                    if (hasChanged(prevSnapshot, snapshot, field)) {
                      const prevVal = getFieldValue(prevSnapshot, field);
                      const newVal = getFieldValue(snapshot, field);
                      changes.push(`${field.label}: "${prevVal}" → "${newVal}"`);
                    }
                  });

                  if (changes.length === 0) return null;

                  return (
                    <Paper key={snapshot.tahun} variant="outlined" sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <TrendingUp color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {prevSnapshot.tahun} → {snapshot.tahun}
                        </Typography>
                        <Chip 
                          label={`${changes.length} perubahan`} 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      </Box>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {changes.map((change, i) => (
                          <Typography component="li" variant="body2" key={i} color="text.secondary">
                            {change}
                          </Typography>
                        ))}
                      </Box>
                      {(snapshot as any).keterangan_historis && (
                        <Box mt={1.5} p={1.5} bgcolor="info.lighter" borderRadius={1}>
                          <Typography variant="caption" color="info.dark" fontWeight={500}>
                            Keterangan: {(snapshot as any).keterangan_historis}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
                {compareSnapshots.length > 1 && 
                  !compareSnapshots.slice(1).some((snapshot, idx) => 
                    COMPARISON_FIELDS.some(field => hasChanged(compareSnapshots[idx], snapshot, field))
                  ) && (
                  <Typography color="text.secondary" align="center">
                    Tidak ada perubahan signifikan antar tahun.
                  </Typography>
                )}
              </Box>

              {/* Changelog per Year */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Riwayat Changelog
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {compareSnapshots.map(snapshot => (
                  <Box key={snapshot.tahun}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Tahun {snapshot.tahun}
                    </Typography>
                    {snapshot.changelogs && snapshot.changelogs.length > 0 ? (
                      snapshot.changelogs.map(log => (
                        <Paper key={log.id} variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="body2" fontWeight={500}>
                            {new Date(log.tanggal_perubahan).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {log.keterangan}
                          </Typography>
                        </Paper>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        Tidak ada changelog
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompareDialog(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Year Selection Dialog */}
      <Dialog open={showEditYearDialog} onClose={() => setShowEditYearDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Snapshot</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pilih tahun snapshot yang ingin diedit.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Tahun</InputLabel>
            <Select
              value={editTarget?.tahun?.toString() || ''}
              label="Tahun"
              onChange={(e) => setEditTarget(prev => prev ? ({ ...prev, tahun: Number(e.target.value) }) : null)}
            >
              {editTarget?.availableYears?.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditYearDialog(false)}>Batal</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (editTarget) {
                handleOpenEdit(editTarget.aplikasiId, editTarget.tahun);
                setShowEditYearDialog(false);
              }
            }}
            disabled={!editTarget?.tahun}
            startIcon={<Edit />}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Snapshot</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pilih tahun snapshot yang ingin dihapus. Semua data terkait termasuk changelog akan ikut terhapus.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Tahun</InputLabel>
            <Select
              value={deleteTarget?.tahun?.toString() || ''}
              label="Tahun"
              onChange={(e) => setDeleteTarget(prev => prev ? ({ ...prev, tahun: Number(e.target.value) }) : null)}
            >
              {deleteTarget && groupedData
                .find(g => g.aplikasiId === deleteTarget.aplikasiId)
                ?.snapshotsByYear.keys() ? (
                  Array.from(
                    groupedData.find(g => g.aplikasiId === deleteTarget.aplikasiId)?.snapshotsByYear.keys() || []
                  ).map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))
                ) : null}
            </Select>
          </FormControl>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} disabled={deleting}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting || !deleteTarget?.tahun}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Changelog Dialog */}
      <Dialog open={showChangelogDialog} onClose={() => setShowChangelogDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Changelog</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tambahkan keterangan perubahan untuk snapshot ini.
          </Typography>
          <TextField
            fullWidth
            type="date"
            label="Tanggal Perubahan"
            value={changelogForm.tanggal_perubahan}
            onChange={(e) => setChangelogForm(prev => ({ ...prev, tanggal_perubahan: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Keterangan"
            value={changelogForm.keterangan}
            onChange={(e) => setChangelogForm(prev => ({ ...prev, keterangan: e.target.value }))}
            placeholder="Jelaskan perubahan yang terjadi..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangelogDialog(false)} disabled={addingChangelog}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleAddChangelog}
            disabled={addingChangelog || !changelogForm.keterangan}
            startIcon={addingChangelog ? <CircularProgress size={16} /> : undefined}
          >
            {addingChangelog ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistorisAplikasiPage;
