import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Build as BuildIcon,
  Engineering as EngineeringIcon,
} from '@mui/icons-material';
import {
  getDetail,
  updateParameters,
  type FormasiEfektifDetailResponse,
  type ManHourByLevel,
  type FormasiByLevel,
  type ParameterItem,
} from '../api/formasiEfektifApi';

// ==================== REUSABLE COMPONENTS ====================

interface ManHourCardProps {
  title: string;
  data: ManHourByLevel;
  icon: React.ReactNode;
  color: string;
}

const ManHourCard = ({ title, data, icon, color }: ManHourCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight="bold" sx={{ color, mb: 1 }}>
        {data.total.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
      </Typography>
      <Box display="flex" justifyContent="space-between" fontSize="0.875rem">
        <Box>
          <Typography variant="caption" color="text.secondary">Manajer</Typography>
          <Typography variant="body2">{data.manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary">Asisten Manajer</Typography>
          <Typography variant="body2">{data.asisten_manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

interface FormasiCardProps {
  title: string;
  data: FormasiByLevel;
  color: string;
  onClick?: () => void;
}

const FormasiCard = ({ title, data, color, onClick }: FormasiCardProps) => (
  <Card 
    sx={{ 
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 3 } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight="bold" sx={{ color, mb: 0.5 }}>
        {Math.round(data.total)} orang
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        (Nilai aktual: {data.total.toFixed(2)})
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Box display="flex" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary">Manajer</Typography>
          <Typography variant="body1" fontWeight="medium">
            {Math.round(data.manajer)} orang
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            ({data.manajer.toFixed(2)})
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary">Asisten Manajer</Typography>
          <Typography variant="body1" fontWeight="medium">
            {Math.round(data.asisten_manajer)} orang
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            ({data.asisten_manajer.toFixed(2)})
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ==================== PARAMETER DIALOG ====================

interface ParameterDialogProps {
  open: boolean;
  onClose: () => void;
  parameters: ParameterItem[];
  onSave: (params: ParameterItem[]) => Promise<void>;
  loading: boolean;
}

const ParameterDialog = ({ open, onClose, parameters, onSave, loading }: ParameterDialogProps) => {
  const [editedParams, setEditedParams] = useState<ParameterItem[]>([]);

  useEffect(() => {
    setEditedParams([...parameters]);
  }, [parameters]);

  const handleChange = (id: string, value: string) => {
    setEditedParams(prev =>
      prev.map(p => (p.id === id ? { ...p, nilai: value } : p))
    );
  };

  const handleSave = async () => {
    await onSave(editedParams);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pengaturan Parameter</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {editedParams.map(param => (
            <TextField
              key={param.id}
              fullWidth
              label={param.nama}
              helperText={param.deskripsi}
              value={param.nilai || ''}
              onChange={e => handleChange(param.id, e.target.value)}
              type="number"
              sx={{ mb: 2 }}
              size="small"
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==================== TAB PANEL ====================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

// ==================== MAIN COMPONENT ====================

export default function FormasiEfektifDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialYear = parseInt(searchParams.get('tahun') || '') || new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormasiEfektifDetailResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [paramDialogOpen, setParamDialogOpen] = useState(false);
  const [savingParams, setSavingParams] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [calculationDialogOpen, setCalculationDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDetail(selectedYear);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  const handleSaveParams = async (params: ParameterItem[]) => {
    try {
      setSavingParams(true);
      await updateParameters(params);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save parameters');
    } finally {
      setSavingParams(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/formasi-efektif');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadData}>
            Coba Lagi
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!data) return null;

  const { summary, pksi_details, fs2_details, parameters, available_years } = data;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Detail Perhitungan Formasi Efektif
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tahun</InputLabel>
            <Select
              value={selectedYear}
              label="Tahun"
              onChange={handleYearChange}
            >
              {available_years.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Pengaturan Parameter">
            <IconButton onClick={() => setParamDialogOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Man Hour Summary */}
      <Typography variant="h6" gutterBottom>
        Breakdown Man Hour
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ManHourCard
            title="PKSI"
            data={summary.pksi_man_hour}
            icon={<DescriptionIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ManHourCard
            title="F.S.2"
            data={summary.fs2_man_hour}
            icon={<BuildIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ManHourCard
            title="Pemeliharaan"
            data={summary.maintenance_man_hour}
            icon={<EngineeringIcon />}
            color="#ff9800"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {summary.maintenance_base_count} aplikasi aktif × 80 jam
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ManHourCard
            title="Total"
            data={summary.total_man_hour}
            icon={<DescriptionIcon />}
            color="#2e7d32"
          />
        </Grid>
      </Grid>

      {/* Formasi Summary */}
      <Typography variant="h6" gutterBottom>
        Ringkasan Formasi
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormasiCard
            title="Formasi Efektif"
            data={summary.formasi_efektif}
            color="#1976d2"
            onClick={() => setCalculationDialogOpen(true)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormasiCard
            title="Formasi Saat Ini"
            data={summary.formasi_saat_ini}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormasiCard
            title="Kebutuhan (Gap)"
            data={summary.kebutuhan}
            color={summary.kebutuhan.total > 0 ? '#d32f2f' : '#2e7d32'}
          />
        </Grid>
      </Grid>

      {/* Detail Tables */}
      <Paper sx={{ p: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label={`PKSI (${pksi_details.length})`} />
          <Tab label={`F.S.2 (${fs2_details.length})`} />
        </Tabs>

        {/* PKSI Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Nama PKSI</TableCell>
                  <TableCell>Aplikasi</TableCell>
                  <TableCell>Jenis</TableCell>
                  <TableCell>Mekanisme</TableCell>
                  <TableCell align="center">Workload %</TableCell>
                  <TableCell>USREQ</TableCell>
                  <TableCell>UAT</TableCell>
                  <TableCell align="center">Durasi (bln)</TableCell>
                  <TableCell align="right">Man Hour (jam)</TableCell>
                  <TableCell align="right">Manajer (jam)</TableCell>
                  <TableCell align="right">Asmen (jam)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pksi_details.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.nama_pksi}</TableCell>
                    <TableCell>{item.nama_aplikasi || '-'}</TableCell>
                    <TableCell>{item.jenis_pksi || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.inhouse_outsource || 'INHOUSE'}
                        color={item.inhouse_outsource?.toLowerCase() === 'outsource' ? 'warning' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">{item.workload_pct}%</TableCell>
                    <TableCell>{formatDate(item.usreq_date)}</TableCell>
                    <TableCell>{formatDate(item.uat_date)}</TableCell>
                    <TableCell align="center">{item.duration_months}</TableCell>
                    <TableCell align="right">{item.man_hour.toLocaleString('id-ID')} jam</TableCell>
                    <TableCell align="right">{item.man_hour_manajer.toLocaleString('id-ID')} jam</TableCell>
                    <TableCell align="right">{item.man_hour_asman.toLocaleString('id-ID')} jam</TableCell>
                  </TableRow>
                ))}
                {pksi_details.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      <Typography color="text.secondary" py={2}>
                        Tidak ada PKSI yang sedang dikerjakan di tahun {selectedYear}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* FS2 Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Aplikasi</TableCell>
                  <TableCell>Deskripsi Pengubahan</TableCell>
                  <TableCell>Mekanisme</TableCell>
                  <TableCell align="center">Workload %</TableCell>
                  <TableCell>Tgl Pengajuan</TableCell>
                  <TableCell>Target Go Live</TableCell>
                  <TableCell align="center">Durasi (bln)</TableCell>
                  <TableCell align="right">Man Hour (jam)</TableCell>
                  <TableCell align="right">Manajer (jam)</TableCell>
                  <TableCell align="right">Asmen (jam)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fs2_details.map((item, index) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.nama_aplikasi || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.deskripsi_pengubahan || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.mekanisme || 'INHOUSE'}
                        color={item.mekanisme?.toLowerCase() === 'outsource' ? 'warning' : 'primary'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">{item.workload_pct}%</TableCell>
                    <TableCell>{formatDate(item.tanggal_pengajuan)}</TableCell>
                    <TableCell>{formatDate(item.target_go_live)}</TableCell>
                    <TableCell align="center">{item.duration_months}</TableCell>
                    <TableCell align="right">{item.man_hour.toLocaleString('id-ID')} jam</TableCell>
                    <TableCell align="right">{item.man_hour_manajer.toLocaleString('id-ID')} jam</TableCell>
                    <TableCell align="right">{item.man_hour_asman.toLocaleString('id-ID')} jam</TableCell>
                  </TableRow>
                ))}
                {fs2_details.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography color="text.secondary" py={2}>
                        Tidak ada F.S.2 yang sedang dikerjakan di tahun {selectedYear}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Parameter Dialog */}
      <ParameterDialog
        open={paramDialogOpen}
        onClose={() => setParamDialogOpen(false)}
        parameters={parameters}
        onSave={handleSaveParams}
        loading={savingParams}
      />

      {/* Calculation Breakdown Dialog */}
      <Dialog 
        open={calculationDialogOpen} 
        onClose={() => setCalculationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">Detail Perhitungan Formasi Efektif</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Formasi Efektif dihitung dari total man hour dibagi dengan jam kerja tahunan (2112 jam).
          </Typography>
          <Divider sx={{ my: 2 }} />

          {/* Manajer Calculation */}
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              Perhitungan Manajer
            </Typography>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="tbody">
                <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary' }}>
                    Man Hour PKSI
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    {summary.pksi_man_hour.manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary' }}>
                    Man Hour FS2
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    {summary.fs2_man_hour.manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary' }}>
                    Man Hour Pemeliharaan
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    {summary.maintenance_man_hour.manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '2px solid #1976d2' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, fontWeight: 'bold' }}>
                    Total Man Hour Manajer
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {summary.total_man_hour.manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr">
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                    Dibagi 2112 jam (22 hari × 8 jam × 12 bulan)
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    ÷ 2112
                  </Box>
                </Box>
                <Box component="tr" sx={{ bgcolor: '#e3f2fd' }}>
                  <Box component="td" sx={{ py: 1.5, pr: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    Formasi Efektif Manajer
                  </Box>
                  <Box component="td" sx={{ py: 1.5, textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', fontFamily: 'monospace', color: 'primary.main' }}>
                    {Math.round(summary.formasi_efektif.manajer)} orang ({summary.formasi_efektif.manajer.toFixed(2)})
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Asisten Manajer Calculation */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
              Perhitungan Asisten Manajer
            </Typography>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="tbody">
                <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary' }}>
                    Man Hour PKSI
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    {summary.pksi_man_hour.asisten_manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary' }}>
                    Man Hour FS2
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    {summary.fs2_man_hour.asisten_manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary' }}>
                    Man Hour Pemeliharaan
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    {summary.maintenance_man_hour.asisten_manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '2px solid #9c27b0' }}>
                  <Box component="td" sx={{ py: 1, pr: 2, fontWeight: 'bold' }}>
                    Total Man Hour Asisten Manajer
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {summary.total_man_hour.asisten_manajer.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam
                  </Box>
                </Box>
                <Box component="tr">
                  <Box component="td" sx={{ py: 1, pr: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                    Dibagi 2112 jam (22 hari × 8 jam × 12 bulan)
                  </Box>
                  <Box component="td" sx={{ py: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                    ÷ 2112
                  </Box>
                </Box>
                <Box component="tr" sx={{ bgcolor: '#f3e5f5' }}>
                  <Box component="td" sx={{ py: 1.5, pr: 2, fontWeight: 'bold', color: 'secondary.main' }}>
                    Formasi Efektif Asisten Manajer
                  </Box>
                  <Box component="td" sx={{ py: 1.5, textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', fontFamily: 'monospace', color: 'secondary.main' }}>
                    {Math.round(summary.formasi_efektif.asisten_manajer)} orang ({summary.formasi_efektif.asisten_manajer.toFixed(2)})
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Total Summary */}
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Total Formasi Efektif
            </Typography>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Total Man Hour: {summary.total_man_hour.total.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jam ÷ 2112
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {Math.round(summary.formasi_efektif.total)} orang ({summary.formasi_efektif.total.toFixed(2)})
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalculationDialogOpen(false)}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
