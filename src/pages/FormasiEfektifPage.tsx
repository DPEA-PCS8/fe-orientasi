import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  OpenInNew as OpenInNewIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import {
  getDashboard,
  updateParameters,
  type FormasiEfektifDashboardResponse,
  type FormasiByLevel,
  type ParameterItem,
} from '../api/formasiEfektifApi';

// ==================== REUSABLE COMPONENTS ====================
// Helper function to format formasi value with rounding
interface SummaryCardProps {
  title: string;
  data: FormasiByLevel;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}

const SummaryCard = ({ title, data, color, icon, onClick, clickable }: SummaryCardProps) => (
  <Card
    sx={{
      height: '100%',
      cursor: clickable ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': clickable ? {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ color, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {icon}
          {clickable && <OpenInNewIcon fontSize="small" />}
        </Box>
      </Box>
      <Typography variant="h3" component="div" fontWeight="bold" sx={{ color, mb: 2 }}>
        {Math.round(data.total)} orang
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        (Nilai aktual: {data.total.toFixed(2)})
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Box display="flex" justifyContent="space-between" mt={1}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Manajer
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {Math.round(data.manajer)} orang
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            ({data.manajer.toFixed(2)})
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary">
            Asisten Manajer
          </Typography>
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

  // Filter out MAINT_BASE_COUNT as it's now calculated from active applications
  const editableParams = editedParams.filter(p => p.kode !== 'MAINT_BASE_COUNT');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pengaturan Parameter</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {editableParams.map(param => (
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

// ==================== MAIN COMPONENT ====================

export default function FormasiEfektifPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormasiEfektifDashboardResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [paramDialogOpen, setParamDialogOpen] = useState(false);
  const [savingParams, setSavingParams] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboard(selectedYear);
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

  const navigateToDetail = () => {
    navigate(`/admin/formasi-efektif/detail?tahun=${selectedYear}`);
  };

  const handleRowToggle = (developerId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(developerId)) {
        newSet.delete(developerId);
      } else {
        newSet.add(developerId);
      }
      return newSet;
    });
  };

  const handlePksiClick = (pksiId: string) => {
    navigate(`/pksi-disetujui?id=${pksiId}`);
  };

  const handleFs2Click = (fs2Id: string) => {
    navigate(`/fs2-disetujui?id=${fs2Id}`);
  };

  const getLevelChipColor = (level: string) => {
    switch (level) {
      case 'MANAJER':
        return 'primary';
      case 'ASISTEN_MANAJER':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'MANAJER':
        return 'Manajer';
      case 'ASISTEN_MANAJER':
        return 'Asisten Manajer';
      default:
        return level;
    }
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

  const { summary, developer_list, parameters, available_years } = data;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Perhitungan Formasi Efektif
        </Typography>
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

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Total Formasi Efektif"
            data={summary.formasi_efektif}
            color="#1976d2"
            icon={<AssessmentIcon />}
            onClick={navigateToDetail}
            clickable
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Formasi Saat Ini"
            data={summary.formasi_saat_ini}
            color="#2e7d32"
            icon={<PeopleIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Kebutuhan (Gap)"
            data={summary.kebutuhan}
            color={summary.kebutuhan.total > 0 ? '#d32f2f' : '#2e7d32'}
            icon={summary.kebutuhan.total > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
          />
        </Grid>
      </Grid>

      {/* Developer List */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Daftar Pengembang ({developer_list.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="50" />
                <TableCell>No</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Level Jabatan</TableCell>
                <TableCell align="center">Jumlah PKSI ({selectedYear})</TableCell>
                <TableCell align="center">Jumlah F.S.2 ({selectedYear})</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {developer_list.map((dev, index) => (
                <>
                  <TableRow key={dev.id} hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRowToggle(dev.id)}
                        disabled={dev.pksi_count === 0 && dev.fs2_count === 0}
                      >
                        <ExpandMoreIcon
                          sx={{
                            transform: expandedRows.has(dev.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                          }}
                        />
                      </IconButton>
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{dev.full_name}</TableCell>
                    <TableCell>{dev.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={getLevelLabel(dev.level)}
                        color={getLevelChipColor(dev.level) as 'primary' | 'secondary' | 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={dev.pksi_count}
                        color={dev.pksi_count > 0 ? 'primary' : 'default'}
                        variant={dev.pksi_count > 0 ? 'filled' : 'outlined'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={dev.fs2_count}
                        color={dev.fs2_count > 0 ? 'secondary' : 'default'}
                        variant={dev.fs2_count > 0 ? 'filled' : 'outlined'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedRows.has(dev.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                          <Grid container spacing={2}>
                            {/* PKSI List */}
                            {dev.pksi_list.length > 0 && (
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Daftar PKSI ({dev.pksi_list.length})
                                  </Typography>
                                  <List dense>
                                    {dev.pksi_list.map((pksi) => (
                                      <ListItem
                                        key={pksi.id}
                                        sx={{
                                          border: '1px solid #e0e0e0',
                                          borderRadius: 1,
                                          mb: 1,
                                          bgcolor: 'white',
                                          cursor: 'pointer',
                                          '&:hover': { bgcolor: '#f0f0f0' },
                                        }}
                                        onClick={() => handlePksiClick(pksi.id)}
                                      >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                          <DescriptionIcon color="primary" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                          primary={pksi.name}
                                          secondary={pksi.team_name ? `Tim: ${pksi.team_name}` : undefined}
                                          primaryTypographyProps={{ variant: 'body2' }}
                                          secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Paper>
                              </Grid>
                            )}
                            {/* FS2 List */}
                            {dev.fs2_list.length > 0 && (
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Daftar F.S.2 ({dev.fs2_list.length})
                                  </Typography>
                                  <List dense>
                                    {dev.fs2_list.map((fs2) => (
                                      <ListItem
                                        key={fs2.id}
                                        sx={{
                                          border: '1px solid #e0e0e0',
                                          borderRadius: 1,
                                          mb: 1,
                                          bgcolor: 'white',
                                          cursor: 'pointer',
                                          '&:hover': { bgcolor: '#f0f0f0' },
                                        }}
                                        onClick={() => handleFs2Click(fs2.id)}
                                      >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                          <BuildIcon color="secondary" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                          primary={fs2.name}
                                          secondary={fs2.team_name ? `Tim: ${fs2.team_name}` : undefined}
                                          primaryTypographyProps={{ variant: 'body2' }}
                                          secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Paper>
                              </Grid>
                            )}
                            {dev.pksi_list.length === 0 && dev.fs2_list.length === 0 && (
                              <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" color="text.secondary" align="center">
                                  Tidak ada PKSI atau F.S.2
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))}
              {developer_list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      Tidak ada data pengembang
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Parameter Dialog */}
      <ParameterDialog
        open={paramDialogOpen}
        onClose={() => setParamDialogOpen(false)}
        parameters={parameters}
        onSave={handleSaveParams}
        loading={savingParams}
      />
    </Box>
  );
}
