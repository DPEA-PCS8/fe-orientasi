import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { getAnalytics } from '../../api/rbsiApi';
import type { RbsiAnalyticsResponse, KepEvaluation } from '../../api/rbsiApi';

interface KepData {
  id: string;
  nomorKep: string;
  tahunPelaporan: number;
}

interface AnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  rbsiId: string;
  periode: string;
  kepList: KepData[];
}

const AnalyticsModal = ({
  open,
  onClose,
  rbsiId,
  periode,
  kepList,
}: AnalyticsModalProps) => {
  const [analyticsData, setAnalyticsData] = useState<RbsiAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTahun1, setSelectedTahun1] = useState<number>(0);
  const [selectedTahun2, setSelectedTahun2] = useState<number>(0);

  // Parse periode to get year range (e.g., "2023-2027")
  const yearRange = useMemo(() => {
    const match = periode.match(/(\d{4})-(\d{4})/);
    if (match) {
      const startYear = parseInt(match[1]);
      const endYear = parseInt(match[2]);
      const years: number[] = [];
      for (let y = startYear; y <= endYear; y++) {
        years.push(y);
      }
      return years;
    }
    return [];
  }, [periode]);

  // Initialize selection with first two KEPs
  useEffect(() => {
    if (open && kepList.length >= 2) {
      const sortedKeps = [...kepList].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan);
      setSelectedTahun1(sortedKeps[sortedKeps.length - 2].tahunPelaporan);
      setSelectedTahun2(sortedKeps[sortedKeps.length - 1].tahunPelaporan);
    }
  }, [open, kepList]);

  // Fetch analytics when selection changes
  useEffect(() => {
    if (open && selectedTahun1 && selectedTahun2 && selectedTahun1 !== selectedTahun2) {
      fetchAnalytics();
    }
  }, [open, selectedTahun1, selectedTahun2]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAnalytics(rbsiId, {
        tahun_1: selectedTahun1,
        tahun_2: selectedTahun2,
      });
      setAnalyticsData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleTahun1Change = (event: SelectChangeEvent<number>) => {
    setSelectedTahun1(Number(event.target.value));
  };

  const handleTahun2Change = (event: SelectChangeEvent<number>) => {
    setSelectedTahun2(Number(event.target.value));
  };

  const renderChangeIndicator = (evaluation: KepEvaluation, year: number) => {
    if (!evaluation.changes?.has_changes) return null;
    const yearChange = evaluation.changes.changes_by_year[year];
    if (!yearChange) return null;

    const { added, removed, summary } = yearChange;
    
    return (
      <Tooltip title={summary} arrow>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: 'center' }}>
          {added > 0 && (
            <Chip 
              size="small" 
              label={`+${added}`}
              icon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
              sx={{ 
                height: 18, 
                fontSize: 10, 
                bgcolor: 'rgba(76, 175, 80, 0.15)', 
                color: '#2E7D32',
                '& .MuiChip-icon': { fontSize: 12, color: '#2E7D32' },
                '& .MuiChip-label': { px: 0.5 },
              }} 
            />
          )}
          {removed > 0 && (
            <Chip 
              size="small" 
              label={`-${removed}`}
              icon={<TrendingDownIcon sx={{ fontSize: 12 }} />}
              sx={{ 
                height: 18, 
                fontSize: 10, 
                bgcolor: 'rgba(244, 67, 54, 0.15)', 
                color: '#C62828',
                '& .MuiChip-icon': { fontSize: 12, color: '#C62828' },
                '& .MuiChip-label': { px: 0.5 },
              }} 
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e5e7',
          pb: 2,
          bgcolor: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon sx={{ color: '#7B1FA2' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            Analytics Progress RBSI
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: '#fafafa' }}>
        {/* Year Selection */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
            Pilih Rentang Tahun Evaluasi
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Tahun Awal</InputLabel>
              <Select
                value={selectedTahun1}
                onChange={handleTahun1Change}
                label="Tahun Awal"
              >
                {kepList
                  .filter(k => k.tahunPelaporan !== selectedTahun2)
                  .sort((a, b) => a.tahunPelaporan - b.tahunPelaporan)
                  .map(kep => (
                    <MenuItem key={kep.id} value={kep.tahunPelaporan}>
                      {kep.tahunPelaporan} ({kep.nomorKep})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">sampai</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Tahun Akhir</InputLabel>
              <Select
                value={selectedTahun2}
                onChange={handleTahun2Change}
                label="Tahun Akhir"
              >
                {kepList
                  .filter(k => k.tahunPelaporan !== selectedTahun1)
                  .sort((a, b) => a.tahunPelaporan - b.tahunPelaporan)
                  .map(kep => (
                    <MenuItem key={kep.id} value={kep.tahunPelaporan}>
                      {kep.tahunPelaporan} ({kep.nomorKep})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: '#7B1FA2' }} />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {/* Analytics Table */}
        {!loading && analyticsData && analyticsData.evaluations.length > 0 && (
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                  <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                    Status RBSI
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Total
                  </TableCell>
                  {yearRange.map(year => (
                    <TableCell key={year} align="center" sx={{ fontWeight: 600 }}>
                      {year}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.evaluations.map((evaluation, index) => (
                  <TableRow 
                    key={evaluation.kep_id}
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(123, 31, 162, 0.04)' },
                      bgcolor: index === 1 ? 'rgba(123, 31, 162, 0.02)' : 'transparent',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Evaluasi RBSI {evaluation.tahun_pelaporan}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#666', 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 200,
                          }}
                        >
                          Sesuai {evaluation.nomor_kep}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#7B1FA2' }}>
                        {evaluation.total}
                      </Typography>
                    </TableCell>
                    {yearRange.map(year => {
                      const count = evaluation.count_by_year[year] ?? 0;
                      return (
                        <TableCell key={year} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? '#1d1d1f' : '#999' }}>
                              {count}
                            </Typography>
                            {index === 1 && renderChangeIndicator(evaluation, year)}
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Legend */}
        {!loading && analyticsData && analyticsData.evaluations.length > 0 && (
          <Paper sx={{ p: 2, mt: 2, borderRadius: '12px', bgcolor: '#fafafa' }}>
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
              <strong>Keterangan:</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  label="+N"
                  icon={<TrendingUpIcon sx={{ fontSize: 12 }} />}
                  sx={{ 
                    height: 18, 
                    fontSize: 10, 
                    bgcolor: 'rgba(76, 175, 80, 0.15)', 
                    color: '#2E7D32',
                    '& .MuiChip-icon': { fontSize: 12, color: '#2E7D32' },
                    '& .MuiChip-label': { px: 0.5 },
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  Penambahan inisiatif/timeline
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip 
                  size="small" 
                  label="-N"
                  icon={<TrendingDownIcon sx={{ fontSize: 12 }} />}
                  sx={{ 
                    height: 18, 
                    fontSize: 10, 
                    bgcolor: 'rgba(244, 67, 54, 0.15)', 
                    color: '#C62828',
                    '& .MuiChip-icon': { fontSize: 12, color: '#C62828' },
                    '& .MuiChip-label': { px: 0.5 },
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  Penghapusan inisiatif/timeline
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
              * Perbandingan dilakukan antara KEP tahun evaluasi pertama dan kedua
            </Typography>
          </Paper>
        )}

        {/* Empty State */}
        {!loading && !error && (!analyticsData || analyticsData.evaluations.length === 0) && selectedTahun1 && selectedTahun2 && (
          <Alert severity="info" sx={{ borderRadius: '12px' }}>
            Tidak ada data progress untuk periode yang dipilih.
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsModal;
