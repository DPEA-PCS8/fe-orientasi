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
  LinearProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Code as CodeIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CalendarMonth as CalendarMonthIcon,
  PlayArrow as PlayArrowIcon,
  BugReport as BugReportIcon,
  Rocket as RocketIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import {
  getPksiDashboardData,
  type PksiDashboardResponse,
  type DeadlineInsight,
} from '../api/pksiApi';
import { useSidebar } from '../context/SidebarContext';

// ==================== CHART COMPONENTS ====================

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
  onClick?: () => void;
}

const StatCard = ({ title, value, subtitle, icon, color, bgColor, onClick }: StatCardProps) => (
  <Card 
    sx={{ 
      height: '100%', 
      borderLeft: `4px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 3 } : {}
    }}
    onClick={onClick}
  >
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

// Phase Insight Card Component with Progress Breakdown
interface PhaseInsightCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  progressItems: Array<{ progress: string; count: number }>;
  totalPksi: number;
  onProgressClick?: (progress: string) => void;
  expandedProgress?: string | null;
}

const PhaseInsightCard = ({ title, icon, color, bgGradient, progressItems, totalPksi, onProgressClick, expandedProgress }: PhaseInsightCardProps) => {
  const totalCount = progressItems.reduce((sum, item) => sum + item.count, 0);
  const percentage = totalPksi > 0 ? (totalCount / totalPksi) * 100 : 0;
  
  return (
    <Card sx={{ 
      height: '100%',
      background: bgGradient,
      border: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={600} color="white">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h3" fontWeight={700} color="white" sx={{ mb: 1 }}>
          {totalCount}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white',
                borderRadius: 4,
              } 
            }}
          />
          <Typography variant="caption" color="rgba(255,255,255,0.8)" sx={{ mt: 0.5, display: 'block' }}>
            {percentage.toFixed(1)}% dari total PKSI
          </Typography>
        </Box>

        {progressItems.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="rgba(255,255,255,0.8)" sx={{ mb: 1.5, display: 'block', fontWeight: 600 }}>
              Detail Progress:
            </Typography>
            {progressItems.map((item, idx) => (
              <Box 
                key={idx} 
                onClick={() => onProgressClick?.(item.progress)}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: expandedProgress === item.progress ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                  },
                }}
              >
                <Typography variant="body2" color="rgba(255,255,255,0.95)" fontWeight={500}>
                  {item.progress}
                </Typography>
                <Typography variant="h6" color="white" fontWeight={700}>
                  {item.count}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Deadline Insight Component
interface DeadlineInsightCardProps {
  insight: DeadlineInsight;
  isPrimary?: boolean;
}

const DeadlineInsightCard = ({ insight, isPrimary = false }: DeadlineInsightCardProps) => (
  <Box sx={{
    p: 2,
    borderRadius: 2,
    bgcolor: isPrimary ? '#E8F5E9' : '#FFF3E0',
    border: `2px solid ${isPrimary ? '#4CAF50' : '#FF9800'}`,
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <ScheduleIcon sx={{ color: isPrimary ? '#4CAF50' : '#FF9800' }} />
      <Typography variant="subtitle2" fontWeight={600}>
        {insight.label}
      </Typography>
    </Box>
    <Typography variant="h4" fontWeight={700} sx={{ color: isPrimary ? '#2E7D32' : '#E65100' }}>
      {insight.total}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      PKSI dengan target selesai {insight.year}
    </Typography>
    
    {insight.progress_breakdown.length > 0 && (
      <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {insight.progress_breakdown.map((pb, idx) => (
          <Chip 
            key={idx}
            label={`${pb.progress}: ${pb.count}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        ))}
      </Box>
    )}
  </Box>
);

// ==================== MAIN COMPONENT ====================

function PksiDashboardPage() {
  useSidebar();
  const [dashboardData, setDashboardData] = useState<PksiDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  const [selectedBulan, setSelectedBulan] = useState<number>(new Date().getMonth() + 1);
  const [expandedProgress, setExpandedProgress] = useState<string | null>(null);
  const [showPksiTable, setShowPksiTable] = useState<'all' | 'disetujui' | 'pending' | 'ditolak' | null>(null);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getPksiDashboardData({
        tahun: selectedTahun,
        bulan: selectedBulan,
      });
      setDashboardData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedTahun, selectedBulan]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleBulanChange = (event: SelectChangeEvent<number>) => {
    setSelectedBulan(Number(event.target.value));
  };

  const handleTahunChange = (event: SelectChangeEvent<number>) => {
    setSelectedTahun(Number(event.target.value));
  };

  const toggleProgressExpand = (progress: string) => {
    setExpandedProgress(prev => prev === progress ? null : progress);
  };

  const handleStatCardClick = (type: 'all' | 'disetujui' | 'pending' | 'ditolak') => {
    setShowPksiTable(prev => prev === type ? null : type);
  };

  // Filter PKSI list based on selected status
  const filteredPksiList = useMemo(() => {
    if (!dashboardData?.pksi_list || !showPksiTable) return [];
    
    if (showPksiTable === 'all') return dashboardData.pksi_list;
    
    const statusMap: Record<string, string> = {
      'disetujui': 'DISETUJUI',
      'pending': 'PENDING',
      'ditolak': 'DITOLAK',
    };
    
    return dashboardData.pksi_list.filter(p => p.status === statusMap[showPksiTable]);
  }, [dashboardData?.pksi_list, showPksiTable]);

  // Prepare chart data
  const jenisPksiChartData = useMemo(() => {
    if (!dashboardData?.jenis_pksi_stats) return [];
    return [
      { label: 'Single Year', value: dashboardData.jenis_pksi_stats.single_year, color: '#2196F3' },
      { label: 'Multiyears', value: dashboardData.jenis_pksi_stats.multiyears, color: '#FF9800' },
    ];
  }, [dashboardData?.jenis_pksi_stats]);

  const pelaksanaChartData = useMemo(() => {
    if (!dashboardData?.pelaksana_stats) return [];
    const data = [
      { label: 'Inhouse', value: dashboardData.pelaksana_stats.inhouse, color: '#4CAF50' },
      { label: 'Outsource', value: dashboardData.pelaksana_stats.outsource, color: '#9C27B0' },
    ];
    if (dashboardData.pelaksana_stats.unknown > 0) {
      data.push({ label: 'Belum Ditentukan', value: dashboardData.pelaksana_stats.unknown, color: '#9E9E9E' });
    }
    return data;
  }, [dashboardData?.pelaksana_stats]);

  const approvalBreakdownChartData = useMemo(() => {
    if (!dashboardData?.approval_breakdown) return [];
    return [
      { label: 'Tahun Ini', value: dashboardData.approval_breakdown.disetujui_tahun_ini, color: '#4CAF50' },
      { label: 'Multiyears Sebelumnya', value: dashboardData.approval_breakdown.disetujui_multiyears_sebelumnya, color: '#FF9800' },
    ];
  }, [dashboardData?.approval_breakdown]);

  const bidangChartData = useMemo(() => {
    if (!dashboardData?.bidang_stats || dashboardData.bidang_stats.length === 0) return [];
    
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#FFEB3B', '#795548', '#E91E63'];
    
    return dashboardData.bidang_stats.map((stat, index) => ({
      label: stat.bidang_kode,
      value: stat.count,
      color: colors[index % colors.length],
    }));
  }, [dashboardData?.bidang_stats]);

  // Get years for filter
  const availableYears = useMemo(() => {
    if (!dashboardData?.available_years || dashboardData.available_years.length === 0) {
      // Default to current year + 2 years back
      const currentYear = new Date().getFullYear();
      return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
    }
    return dashboardData.available_years;
  }, [dashboardData?.available_years]);

  const getProgressColor = (progress: string): string => {
    const colorMap: Record<string, string> = {
      'Penyusunan Usreq': '#E3F2FD',
      'Pengadaan': '#FFF3E0',
      'Desain': '#F3E5F5',
      'Coding': '#E8F5E9',
      'Unit Test': '#E0F7FA',
      'SIT': '#FFF8E1',
      'UAT': '#FCE4EC',
      'Deployment': '#E8EAF6',
      'Selesai': '#C8E6C9',
    };
    return colorMap[progress] || '#F5F5F5';
  };

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: '100%',
        transition: 'margin-left 0.3s, width 0.3s',
        bgcolor: '#f5f7fa',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard PKSI
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitoring dan analisis data Permintaan Kebutuhan Sistem Informasi
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tahun</InputLabel>
            <Select
              value={selectedTahun}
              label="Tahun"
              onChange={handleTahunChange}
            >
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Bulan</InputLabel>
            <Select
              value={selectedBulan}
              label="Bulan"
              onChange={handleBulanChange}
            >
              {(dashboardData?.available_months || [
                { value: 1, label: 'Januari' },
                { value: 2, label: 'Februari' },
                { value: 3, label: 'Maret' },
                { value: 4, label: 'April' },
                { value: 5, label: 'Mei' },
                { value: 6, label: 'Juni' },
                { value: 7, label: 'Juli' },
                { value: 8, label: 'Agustus' },
                { value: 9, label: 'September' },
                { value: 10, label: 'Oktober' },
                { value: 11, label: 'November' },
                { value: 12, label: 'Desember' },
              ]).map(month => (
                <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {dashboardData?.snapshot_date && (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" color="info" />
              <Typography variant="body2" color="text.secondary">
                Data snapshot per: <strong>{dashboardData.snapshot_date}</strong>
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Loading & Error States */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard Content */}
      {!loading && dashboardData && (
        <>
          {/* Summary Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
            gap: 3, 
            mb: 3 
          }}>
            <StatCard
              title="Total PKSI"
              value={dashboardData.summary.total_pksi}
              subtitle={`Tahun ${selectedTahun}`}
              icon={<DescriptionIcon />}
              color="#1976D2"
              bgColor="#E3F2FD"
              onClick={() => handleStatCardClick('all')}
            />
            <StatCard
              title="Disetujui"
              value={dashboardData.summary.total_disetujui}
              subtitle={`${dashboardData.summary.percentage_disetujui.toFixed(1)}% dari total`}
              icon={<CheckCircleIcon />}
              color="#4CAF50"
              bgColor="#E8F5E9"
              onClick={() => handleStatCardClick('disetujui')}
            />
            <StatCard
              title="Pending"
              value={dashboardData.summary.total_pending}
              subtitle="Menunggu persetujuan"
              icon={<HourglassEmptyIcon />}
              color="#FF9800"
              bgColor="#FFF3E0"
              onClick={() => handleStatCardClick('pending')}
            />
            <StatCard
              title="Ditolak"
              value={dashboardData.summary.total_ditolak}
              icon={<CancelIcon />}
              color="#F44336"
              bgColor="#FFEBEE"
              onClick={() => handleStatCardClick('ditolak')}
            />
          </Box>

          {/* PKSI List Table (shown when stat card is clicked) */}
          {showPksiTable && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Daftar PKSI {showPksiTable === 'all' ? '' : `- ${showPksiTable.charAt(0).toUpperCase() + showPksiTable.slice(1)}`}
                </Typography>
                <Chip 
                  label="Tutup" 
                  size="small" 
                  onClick={() => setShowPksiTable(null)}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Nama PKSI</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Inisiatif</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Jenis</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPksiList.map((pksi) => (
                      <TableRow key={pksi.id} hover>
                        <TableCell>{pksi.nama_pksi}</TableCell>
                        <TableCell>
                          {pksi.inisiatif_nomor && (
                            <Typography variant="caption" color="text.secondary">
                              {pksi.inisiatif_nomor} - {pksi.inisiatif_nama || '-'}
                            </Typography>
                          )}
                          {!pksi.inisiatif_nomor && '-'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small"
                            label={pksi.status}
                            color={
                              pksi.status === 'DISETUJUI' ? 'success' : 
                              pksi.status === 'PENDING' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{pksi.progress || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small"
                            label={pksi.is_multiyear ? 'Multiyears' : 'Single Year'}
                            variant="outlined"
                            color={pksi.is_multiyear ? 'warning' : 'info'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPksiList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">Tidak ada data</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Progress Insights - Grouped Progress Cards */}
          {dashboardData.progress_by_bidang && dashboardData.progress_by_bidang.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AssessmentIcon color="primary" />
                Progress Overview
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
                gap: 3 
              }}>
                {/* Early Stage */}
                <PhaseInsightCard 
                  title="Early Stage"
                  icon={<PlayArrowIcon />}
                  color="#667eea"
                  bgGradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  progressItems={dashboardData.progress_by_bidang
                    .filter(row => ['Penyusunan Usreq', 'Pengadaan'].includes(row.progress))
                    .map(row => ({ progress: row.progress_label, count: row.total }))}
                  totalPksi={dashboardData.summary.total_disetujui}
                  onProgressClick={setExpandedProgress}
                  expandedProgress={expandedProgress}
                />
                
                {/* Development Stage */}
                <PhaseInsightCard 
                  title="Development"
                  icon={<CodeIcon />}
                  color="#2196F3"
                  bgGradient="linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)"
                  progressItems={dashboardData.progress_by_bidang
                    .filter(row => ['Desain', 'Coding', 'Unit Test'].includes(row.progress))
                    .map(row => ({ progress: row.progress_label, count: row.total }))}
                  totalPksi={dashboardData.summary.total_disetujui}
                  onProgressClick={setExpandedProgress}
                  expandedProgress={expandedProgress}
                />
                
                {/* Testing Stage */}
                <PhaseInsightCard 
                  title="Testing"
                  icon={<BugReportIcon />}
                  color="#FF9800"
                  bgGradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  progressItems={dashboardData.progress_by_bidang
                    .filter(row => ['SIT', 'UAT'].includes(row.progress))
                    .map(row => ({ progress: row.progress_label, count: row.total }))}
                  totalPksi={dashboardData.summary.total_disetujui}
                  onProgressClick={setExpandedProgress}
                  expandedProgress={expandedProgress}
                />
                
                {/* Deployment Stage */}
                <PhaseInsightCard 
                  title="Deployment"
                  icon={<RocketIcon />}
                  color="#4CAF50"
                  bgGradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                  progressItems={dashboardData.progress_by_bidang
                    .filter(row => ['Deployment', 'Selesai'].includes(row.progress))
                    .map(row => ({ progress: row.progress_label, count: row.total }))}
                  totalPksi={dashboardData.summary.total_disetujui}
                  onProgressClick={setExpandedProgress}
                  expandedProgress={expandedProgress}
                />
              </Box>
            </Paper>
          )}

          {/* Progress Detail - PKSI List */}
          {expandedProgress && dashboardData?.pksi_list && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  PKSI dengan Progress: <strong>{expandedProgress}</strong>
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setExpandedProgress(null)}
                  sx={{ ml: 'auto' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {(() => {
                const filteredByProgress = dashboardData.pksi_list.filter(
                  pksi => pksi.progress === expandedProgress && pksi.status === 'DISETUJUI'
                );
                
                return filteredByProgress.length > 0 ? (
                  <TableContainer sx={{ maxWidth: '100%' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Nama PKSI</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Inisiatif</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Bidang</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Deadline</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Jenis</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Pelaksana</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredByProgress.map((pksi) => (
                          <TableRow key={pksi.id} hover>
                            <TableCell sx={{ maxWidth: 250 }}>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {pksi.nama_pksi}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {pksi.inisiatif_nomor ? `${pksi.inisiatif_nomor}` : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{pksi.bidang_nama || '-'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {pksi.tahap7_akhir || pksi.tahap7_awal || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small"
                                label={pksi.is_multiyear ? 'Multiyears' : 'Single Year'}
                                variant="outlined"
                                color={pksi.is_multiyear ? 'warning' : 'info'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {pksi.inhouse_outsource || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">
                      Tidak ada PKSI dengan progress {expandedProgress}
                    </Typography>
                  </Box>
                );
              })()}
            </Paper>
          )}

          {/* Deadline Insights */}
          {dashboardData.progress_insights && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ScheduleIcon color="primary" />
                Target Penyelesaian
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                gap: 3 
              }}>
                <DeadlineInsightCard 
                  insight={dashboardData.progress_insights.deadline_current_year}
                  isPrimary={true}
                />
                <DeadlineInsightCard 
                  insight={dashboardData.progress_insights.deadline_next_year}
                  isPrimary={false}
                />
              </Box>
            </Paper>
          )}

          {/* Approval Breakdown & Charts */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3, 
            mb: 3 
          }}>
            {/* Approval Breakdown */}
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon color="primary" />
                Breakdown PKSI Disetujui
              </Typography>
              <DonutChart 
                data={approvalBreakdownChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Paper>

            {/* Jenis PKSI Chart */}
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Jenis PKSI
              </Typography>
              <DonutChart 
                data={jenisPksiChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Paper>

            {/* Pelaksana Chart */}
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CodeIcon color="primary" />
                Pelaksana
              </Typography>
              <DonutChart 
                data={pelaksanaChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Paper>

            {/* Bidang Chart */}
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                PKSI per Bidang
              </Typography>
              <DonutChart 
                data={bidangChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Paper>
          </Box>

          {/* Progress by Bidang Matrix */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              Progress PKSI per Bidang
            </Typography>
            <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, minWidth: 150, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      Progress
                    </TableCell>
                    {dashboardData.bidang_list.map((bidang) => (
                      <TableCell key={bidang.id} align="center" sx={{ fontWeight: 600, minWidth: 80 }}>
                        <Tooltip title={bidang.nama_bidang} arrow>
                          <span>{bidang.kode_bidang}</span>
                        </Tooltip>
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 600, minWidth: 80 }}>Total</TableCell>
                    <TableCell sx={{ width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.progress_by_bidang.map((row) => (
                    <>
                      <TableRow 
                        key={row.progress}
                        sx={{ 
                          bgcolor: getProgressColor(row.progress),
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#E0E0E0' }
                        }}
                        onClick={() => toggleProgressExpand(row.progress)}
                      >
                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: getProgressColor(row.progress), zIndex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={500}>{row.progress_label}</Typography>
                          </Box>
                        </TableCell>
                        {dashboardData.bidang_list.map((bidang) => (
                          <TableCell key={bidang.id} align="center">
                            {row.counts_by_bidang[bidang.kode_bidang] > 0 ? (
                              <Chip 
                                label={row.counts_by_bidang[bidang.kode_bidang]} 
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              <Typography color="text.disabled">-</Typography>
                            )}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Chip 
                            label={row.total} 
                            size="small"
                            color={row.total > 0 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            {expandedProgress === row.progress ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={dashboardData.bidang_list.length + 3} sx={{ p: 0 }}>
                          <Collapse in={expandedProgress === row.progress} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: '#FAFAFA' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                PKSI dalam tahap {row.progress_label}:
                              </Typography>
                              {dashboardData.pksi_list
                                .filter(p => p.progress === row.progress)
                                .map(pksi => (
                                  <Chip
                                    key={pksi.id}
                                    label={pksi.nama_pksi}
                                    size="small"
                                    sx={{ m: 0.5 }}
                                    variant="outlined"
                                  />
                                ))}
                              {dashboardData.pksi_list.filter(p => p.progress === row.progress).length === 0 && (
                                <Typography variant="body2" color="text.secondary">Tidak ada PKSI</Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                  {/* Grand Total Row */}
                  <TableRow sx={{ bgcolor: '#E3F2FD' }}>
                    <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: '#E3F2FD', zIndex: 1 }}>
                      Grand Total
                    </TableCell>
                    {dashboardData.bidang_list.map((bidang) => {
                      const bidangTotal = dashboardData.progress_by_bidang.reduce(
                        (sum, row) => sum + (row.counts_by_bidang[bidang.kode_bidang] || 0), 0
                      );
                      return (
                        <TableCell key={bidang.id} align="center">
                          <Typography fontWeight={600}>{bidangTotal}</Typography>
                        </TableCell>
                      );
                    })}
                    <TableCell align="center">
                      <Typography fontWeight={700}>
                        {dashboardData.progress_by_bidang.reduce((sum, row) => sum + row.total, 0)}
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}

export default PksiDashboardPage;
