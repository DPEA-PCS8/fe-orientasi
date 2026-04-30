import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Link,
  TextField,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  Search as SearchIcon,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { getAllRbsi, getDashboardData, getKepList } from '../api/rbsiApi';
import type {
  RbsiResponse,
  RbsiDashboardResponse,
  InisiatifPksiDetail,
  YearlyKepStatus,
  RbsiKepResponse,
} from '../api/rbsiApi';

// Custom Donut Chart Component
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  title?: string;
}

const DonutChart = ({ data, size = 180, strokeWidth = 24, title }: DonutChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        {title && <Typography variant="subtitle2" color="text.secondary">{title}</Typography>}
        <Box sx={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          bgcolor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography color="text.secondary">No Data</Typography>
        </Box>
      </Box>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {title && <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>}
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {data.map((item, index) => {
            const percentage = item.value / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += percentage * circumference;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'all 0.5s ease-in-out' }}
              />
            );
          })}
        </svg>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <Typography variant="h4" fontWeight={700}>{total}</Typography>
          <Typography variant="caption" color="text.secondary">Total</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
            <Typography variant="caption">
              {item.label}: {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const StatCard = ({ title, value, subtitle, icon, color, bgColor }: StatCardProps) => (
  <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          bgcolor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

function RbsiDashboardPage() {
  const [rbsiList, setRbsiList] = useState<RbsiResponse[]>([]);
  const [selectedRbsi, setSelectedRbsi] = useState<RbsiResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<RbsiDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [rbsiLoading, setRbsiLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  const [pksiStatusFilter, setPksiStatusFilter] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Table filters & sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'nomor' | 'nama' | 'program'>('nomor');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [hasPksiFilter, setHasPksiFilter] = useState<'all' | 'with_pksi' | 'without_pksi'>('all');
  
  // KEP Progress selection
  const [kepList, setKepList] = useState<RbsiKepResponse[]>([]);
  const [selectedKepId, setSelectedKepId] = useState<string>('');
  const [kepLoading, setKepLoading] = useState(false);

  // Parse periode to get year range
  const yearRange = useMemo(() => {
    if (!selectedRbsi) return [];
    const match = selectedRbsi.periode.match(/(\d{4})-(\d{4})/);
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
  }, [selectedRbsi]);

  // Fetch RBSI list
  useEffect(() => {
    const fetchRbsiList = async () => {
      setRbsiLoading(true);
      try {
        const response = await getAllRbsi();
        const list = response.data || [];
        setRbsiList(list);
        if (list.length > 0) {
          setSelectedRbsi(list[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal mengambil data RBSI');
      } finally {
        setRbsiLoading(false);
      }
    };
    fetchRbsiList();
  }, []);

  // Fetch dashboard data — accepts explicit params to avoid stale-closure races
  const fetchDashboard = useCallback(async (overrideKepId?: string) => {
    if (!selectedRbsi) return;

    const kepId = overrideKepId !== undefined ? overrideKepId : selectedKepId;
    setLoading(true);
    setError('');
    try {
      const response = await getDashboardData(
        selectedRbsi.id,
        selectedTahun,
        pksiStatusFilter || undefined,
        undefined, // comparisonYear
        kepId || undefined
      );
      setDashboardData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedRbsi, selectedTahun, pksiStatusFilter, selectedKepId]);

  // Fetch KEP list when RBSI changes, then immediately fetch dashboard with resolved KEP id
  useEffect(() => {
    if (!selectedRbsi) return;

    let cancelled = false;
    const fetchKepThenDashboard = async () => {
      setKepLoading(true);
      try {
        const response = await getKepList(selectedRbsi.id);
        if (cancelled) return;
        const list = response.data || [];
        setKepList(list);

        let resolvedKepId = '';
        if (list.length > 0) {
          const lastYear = new Date().getFullYear() - 1;
          const lastYearKep = list.find(k => k.tahun_pelaporan === lastYear);
          resolvedKepId = lastYearKep
            ? lastYearKep.id
            : [...list].sort((a, b) => b.tahun_pelaporan - a.tahun_pelaporan)[0].id;
          setSelectedKepId(resolvedKepId);
        } else {
          setSelectedKepId('');
        }

        if (!cancelled) {
          await fetchDashboard(resolvedKepId);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch KEP list:', err);
          setKepList([]);
          setSelectedKepId('');
        }
      } finally {
        if (!cancelled) setKepLoading(false);
      }
    };

    fetchKepThenDashboard();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRbsi]); // intentionally omit fetchDashboard — called inline with resolved kepId

  // Refetch dashboard when filters change (not RBSI — that's handled above)
  useEffect(() => {
    if (!selectedRbsi) return;
    fetchDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTahun, pksiStatusFilter]); // intentionally omit selectedRbsi/fetchDashboard

  const handleRbsiChange = (event: SelectChangeEvent<string>) => {
    const rbsi = rbsiList.find(r => r.id === event.target.value);
    if (rbsi) {
      setSelectedRbsi(rbsi);
      // Reset tahun to first available year
      const match = rbsi.periode.match(/(\d{4})-(\d{4})/);
      if (match) {
        const endYear = parseInt(match[2]);
        setSelectedTahun(Math.min(endYear, new Date().getFullYear()));
      }
    }
  };

  const handleTahunChange = (event: SelectChangeEvent<number>) => {
    setSelectedTahun(Number(event.target.value));
  };

  const handlePksiStatusChange = (event: SelectChangeEvent<string>) => {
    setPksiStatusFilter(event.target.value);
  };

  const handleKepChange = (event: SelectChangeEvent<string>) => {
    const newKepId = event.target.value;
    setSelectedKepId(newKepId);
    fetchDashboard(newKepId);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleHasPksiFilterChange = (event: SelectChangeEvent<string>) => {
    setHasPksiFilter(event.target.value as 'all' | 'with_pksi' | 'without_pksi');
  };

  const handleSort = (column: 'nomor' | 'nama' | 'program') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getPksiDetailUrl = (pksiId: string, status: string): string => {
    // Route based on PKSI status
    if (status === 'DISETUJUI') {
      return `/pksi-disetujui?id=${pksiId}`;
    }
    return `/pksi?highlight=${pksiId}`;
  };

  const toggleRowExpand = (groupId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Filtered and sorted initiatives
  const filteredAndSortedInitiatives = useMemo(() => {
    if (!dashboardData) return [];

    let filtered = dashboardData.initiatives;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(init => 
        init.nomor_inisiatif.toLowerCase().includes(query) ||
        init.nama_inisiatif.toLowerCase().includes(query) ||
        init.program_nama.toLowerCase().includes(query)
      );
    }

    // Apply has PKSI filter
    if (hasPksiFilter === 'with_pksi') {
      filtered = filtered.filter(init => init.has_pksi);
    } else if (hasPksiFilter === 'without_pksi') {
      filtered = filtered.filter(init => !init.has_pksi);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let compareA: string;
      let compareB: string;

      switch (sortBy) {
        case 'nomor':
          compareA = a.nomor_inisiatif;
          compareB = b.nomor_inisiatif;
          break;
        case 'nama':
          compareA = a.nama_inisiatif;
          compareB = b.nama_inisiatif;
          break;
        case 'program':
          compareA = a.program_nama;
          compareB = b.program_nama;
          break;
        default:
          return 0;
      }

      if (sortBy === 'nomor') {
        // Numeric-aware comparison for nomor
        const partsA = compareA.split('.').map(p => parseInt(p) || 0);
        const partsB = compareB.split('.').map(p => parseInt(p) || 0);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const numA = partsA[i] || 0;
          const numB = partsB[i] || 0;
          if (numA !== numB) {
            return sortOrder === 'asc' ? numA - numB : numB - numA;
          }
        }
        return 0;
      }

      // String comparison for nama and program
      const comparison = compareA.localeCompare(compareB);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [dashboardData, searchQuery, sortBy, sortOrder, hasPksiFilter]);

  const renderDiscrepancyBadge = (status: YearlyKepStatus | undefined) => {
    if (!status) return null;

    if (status.discrepancy_type === 'SHOULD_HAVE_PKSI') {
      return (
        <Tooltip title={status.discrepancy_message || ''} arrow>
          <Chip
            size="small"
            icon={<WarningIcon />}
            label="Seharusnya ada PKSI"
            sx={{
              backgroundColor: '#fff3e0',
              color: '#e65100',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#e65100' }
            }}
          />
        </Tooltip>
      );
    }

    if (status.discrepancy_type === 'UNEXPECTED_PKSI') {
      return (
        <Tooltip title={status.discrepancy_message || ''} arrow>
          <Chip
            size="small"
            icon={<InfoIcon />}
            label="PKSI tidak direncanakan"
            sx={{
              backgroundColor: '#e3f2fd',
              color: '#1565c0',
              fontWeight: 600,
              '& .MuiChip-icon': { color: '#1565c0' }
            }}
          />
        </Tooltip>
      );
    }

    return null;
  };

  const renderKepProgressCell = (kep: YearlyKepStatus | undefined, year: number, isHighlightYear: boolean) => {
    if (!kep) {
      return (
        <Box sx={{
          width: 28,
          height: 28,
          bgcolor: '#f5f5f5',
          borderRadius: 1
        }} />
      );
    }

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'realized':
          return '#4caf50';
        case 'planned':
          return '#2196f3';
        default:
          return '#e0e0e0';
      }
    };

    const bgColor = getStatusColor(kep.kep_status);
    const hasDiscrepancy = !!kep.discrepancy_type;

    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="body2">Tahun: {year}</Typography>
            <Typography variant="body2">KEP Status: {kep.kep_status}</Typography>
            <Typography variant="body2">
              Ada PKSI: {kep.has_pksi_in_year ? 'Ya' : 'Tidak'}
            </Typography>
            {kep.discrepancy_message && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {kep.discrepancy_message}
              </Typography>
            )}
          </Box>
        }
        arrow
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            bgcolor: bgColor,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: isHighlightYear ? '2px solid #f44336' : 'none',
            boxShadow: hasDiscrepancy ? '0 0 8px rgba(255,152,0,0.8)' : 'none',
          }}
        >
          {kep.kep_status === 'realized' && (
            <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
          )}
          {kep.kep_status === 'planned' && (
            <LightbulbIcon sx={{ fontSize: 14, color: 'white' }} />
          )}
          {hasDiscrepancy && (
            <WarningIcon
              sx={{
                fontSize: 10,
                color: '#ff9800',
                position: 'absolute',
                top: -4,
                right: -4,
                bgcolor: 'white',
                borderRadius: '50%'
              }}
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  const renderInitiativeRow = (initiative: InisiatifPksiDetail) => {
    const isExpanded = expandedRows.has(initiative.group_id);
    const kepProgress = initiative.kep_progress_comparison?.yearly_status || {};

    return (
      <>
        <TableRow
          key={initiative.group_id}
          sx={{
            '&:hover': { backgroundColor: '#f5f5f5' },
            cursor: 'pointer'
          }}
          onClick={() => toggleRowExpand(initiative.group_id)}
        >
          <TableCell sx={{ width: 40 }}>
            <IconButton size="small">
              {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight={600}>
              {initiative.nomor_inisiatif}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {initiative.nama_inisiatif}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2">{initiative.program_nama}</Typography>
          </TableCell>
          <TableCell align="center">
            {initiative.has_pksi ? (
              <Chip
                size="small"
                icon={<CheckCircleIcon />}
                label={`${initiative.pksi_list.length} PKSI`}
                color="success"
                variant="outlined"
              />
            ) : (
              <Chip
                size="small"
                icon={<CancelIcon />}
                label="Belum ada"
                color="warning"
                variant="outlined"
              />
            )}
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {yearRange.map(year => {
                const yearStatus = kepProgress[year];
                return (
                  <Box key={year}>
                    {renderKepProgressCell(yearStatus, year, year === selectedTahun)}
                  </Box>
                );
              })}
            </Box>
          </TableCell>
          <TableCell>
            {kepProgress[selectedTahun] && renderDiscrepancyBadge(kepProgress[selectedTahun])}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detail PKSI
                </Typography>
                {initiative.pksi_list.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nama PKSI</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Periode Pelaksanaan</TableCell>
                        <TableCell>Multiyear</TableCell>
                        <TableCell>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {initiative.pksi_list.map(pksi => {
                        const coversSelectedYear = pksi.tahun_pelaksanaan_awal && pksi.tahun_pelaksanaan_akhir &&
                          selectedTahun >= pksi.tahun_pelaksanaan_awal && 
                          selectedTahun <= pksi.tahun_pelaksanaan_akhir;
                        
                        return (
                          <TableRow key={pksi.id} sx={{ 
                            bgcolor: coversSelectedYear ? '#e8f5e9' : 'inherit' 
                          }}>
                            <TableCell>{pksi.nama_pksi}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={pksi.status}
                                color={pksi.status === 'DISETUJUI' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {pksi.tahun_pelaksanaan_awal || '-'} - {pksi.tahun_pelaksanaan_akhir || '-'}
                                </Typography>
                                {coversSelectedYear && (
                                  <Chip 
                                    size="small" 
                                    label={`Mencakup tahun ${selectedTahun}`}
                                    color="success"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {pksi.is_multiyear ? (
                                <Chip size="small" label="Ya" color="info" />
                              ) : (
                                <Chip size="small" label="Tidak" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={getPksiDetailUrl(pksi.id, pksi.status)}
                                sx={{ cursor: 'pointer' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Lihat Detail
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Tidak ada PKSI yang mencakup tahun {selectedTahun} untuk inisiatif ini.
                  </Typography>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  if (rbsiLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: '#DA251C' }} />
          <Typography variant="h4" fontWeight={700}>
            Dashboard RBSI
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Analisis hubungan antara Inisiatif RBSI, KEP Progress, dan PKSI
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Filter Data
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>RBSI</InputLabel>
            <Select
              value={selectedRbsi?.id || ''}
              label="RBSI"
              onChange={handleRbsiChange}
            >
              {rbsiList.map(rbsi => (
                <MenuItem key={rbsi.id} value={rbsi.id}>
                  {rbsi.periode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>KEP Progress</InputLabel>
            <Select
              value={selectedKepId}
              label="KEP Progress"
              onChange={handleKepChange}
              disabled={kepLoading || kepList.length === 0}
            >
              <MenuItem value="">Semua KEP</MenuItem>
              {kepList.map(kep => (
                <MenuItem key={kep.id} value={kep.id}>
                  {kep.nomor_kep} ({kep.tahun_pelaporan})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tahun PKSI</InputLabel>
            <Select
              value={selectedTahun}
              label="Tahun PKSI"
              onChange={handleTahunChange}
            >
              {yearRange.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status PKSI</InputLabel>
            <Select
              value={pksiStatusFilter}
              label="Status PKSI"
              onChange={handlePksiStatusChange}
            >
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="DISETUJUI">Disetujui</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="DITOLAK">Ditolak</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Loading & Error */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {!loading && !error && dashboardData && (
        <>
          {/* Summary Statistics */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 4
          }}>
            <StatCard
              title="Total Inisiatif"
              value={dashboardData.summary.total_inisiatif}
              subtitle={`Tahun ${selectedTahun}`}
              icon={<AssessmentIcon />}
              color="#1976d2"
              bgColor="#e3f2fd"
            />
            <StatCard
              title={`Memiliki PKSI (Tahun ${selectedTahun})`}
              value={dashboardData.summary.inisiatif_with_pksi}
              subtitle={`${dashboardData.summary.percentage_with_pksi.toFixed(1)}% dari total`}
              icon={<CheckCircleIcon />}
              color="#4caf50"
              bgColor="#e8f5e9"
            />
            <StatCard
              title={`Belum Memiliki PKSI (Tahun ${selectedTahun})`}
              value={dashboardData.summary.inisiatif_without_pksi}
              icon={<CancelIcon />}
              color="#ff9800"
              bgColor="#fff3e0"
            />
            <StatCard
              title="Tingkat Kepatuhan KEP"
              value={`${dashboardData.summary.kep_compliance_percentage.toFixed(1)}%`}
              subtitle={`${dashboardData.summary.kep_realized_with_pksi}/${dashboardData.summary.kep_expected_with_pksi} terealisasi`}
              icon={<TrendingUpIcon />}
              color="#9c27b0"
              bgColor="#f3e5f5"
            />
          </Box>

          {/* Charts Section */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4
          }}>
            {/* PKSI Status Chart */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <DonutChart
                title={`Status Inisiatif di Tahun ${selectedTahun}`}
                data={[
                  { label: 'Memiliki PKSI', value: dashboardData.summary.inisiatif_with_pksi, color: '#4caf50' },
                  { label: 'Belum Memiliki', value: dashboardData.summary.inisiatif_without_pksi, color: '#ff9800' },
                ]}
              />
            </Paper>

            {/* KEP Compliance Chart */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <DonutChart
                title={`Realisasi KEP Progress Tahun ${selectedTahun}${selectedKepId ? ' (KEP terpilih)' : ''}`}
                data={[
                  { label: 'Terealisasi', value: dashboardData.summary.kep_realized_with_pksi, color: '#4caf50' },
                  { label: 'Seharusnya Ada', value: dashboardData.summary.kep_missing_pksi, color: '#f44336' },
                  { label: 'Tidak Direncanakan', value: dashboardData.summary.kep_unexpected_pksi, color: '#2196f3' },
                ]}
              />
            </Paper>
          </Box>

          {/* Legend */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Legenda KEP Progress:</Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: 0.5 }} />
                <Typography variant="caption">Planned</Typography>
              </Box>
              {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#2196f3', borderRadius: 0.5 }} />
                <Typography variant="caption">Planned</Typography>
              </Box> */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#e0e0e0', borderRadius: 0.5 }} />
                <Typography variant="caption">None</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 20, height: 20, border: '2px solid #f44336', borderRadius: 0.5 }} />
                <Typography variant="caption">Tahun Terpilih</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                <Typography variant="caption">Ada Diskrepansi</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Initiatives Table */}
          <Paper sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Detail Inisiatif
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredAndSortedInitiatives.length} dari {dashboardData.initiatives.length} inisiatif
                </Typography>
              </Box>
              
              {/* Search and Filters */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Cari inisiatif..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                    },
                  }}
                  sx={{ minWidth: 300 }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Status PKSI di Tahun {selectedTahun}</InputLabel>
                  <Select
                    value={hasPksiFilter}
                    label={`Status PKSI di Tahun ${selectedTahun}`}
                    onChange={handleHasPksiFilterChange}
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="with_pksi">Ada PKSI</MenuItem>
                    <MenuItem value="without_pksi">Belum Ada PKSI</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <TableContainer sx={{ height: 600, minHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }} />
                    <TableCell
                      sx={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('nomor')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Inisiatif
                        {sortBy === 'nomor' && (
                          sortOrder === 'asc' ? <ArrowUpward sx={{ fontSize: 16 }} /> : <ArrowDownward sx={{ fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('program')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Program
                        {sortBy === 'program' && (
                          sortOrder === 'asc' ? <ArrowUpward sx={{ fontSize: 16 }} /> : <ArrowDownward sx={{ fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Status PKSI untuk tahun ${selectedTahun}`} arrow>
                        <Box>Status PKSI ({selectedTahun})</Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {yearRange.map(year => (
                          <Box
                            key={year}
                            sx={{
                              width: 28,
                              textAlign: 'center',
                              fontWeight: year === selectedTahun ? 700 : 400,
                              color: year === selectedTahun ? '#f44336' : 'inherit',
                              fontSize: '0.875rem'
                            }}
                          >
                            {year.toString().slice(-2)}
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>Catatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedInitiatives.map(initiative => renderInitiativeRow(initiative))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredAndSortedInitiatives.length === 0 && dashboardData.initiatives.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Tidak ada inisiatif yang sesuai dengan filter.
              </Typography>
            )}
            {dashboardData.initiatives.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Tidak ada inisiatif yang ditemukan untuk tahun {selectedTahun}.
              </Typography>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}

export default RbsiDashboardPage;
