import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const svgPadding = 20; // Breathing room for hover stroke expansion
  const svgSize = size + svgPadding;
  const svgCenter = svgSize / 2;

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
  const segments = data.reduce(
    (acc, item) => {
      const percentage = item.value / total;
      const strokeDasharray = `${percentage * circumference} ${circumference}`;
      const strokeDashoffset = -acc.currentOffset;
      acc.currentOffset += percentage * circumference;
      acc.items.push({ ...item, strokeDasharray, strokeDashoffset });
      return acc;
    },
    { currentOffset: 0, items: [] as Array<{ label: string; value: number; color: string; strokeDasharray: string; strokeDashoffset: number }> }
  ).items;

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, overflow: 'visible' }}>
      {title && <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>}
      <Box sx={{ position: 'relative', width: size, height: size, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          width={svgSize}
          height={svgSize}
          style={{ transform: 'rotate(-90deg)', cursor: 'pointer', display: 'block', position: 'absolute' }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {segments.map((item, index) => (
            <circle
              key={index}
              cx={svgCenter}
              cy={svgCenter}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={activeIndex === index ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={item.strokeDasharray}
              strokeDashoffset={item.strokeDashoffset}
              opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
              style={{ transition: 'all 0.2s ease-in-out' }}
              onMouseEnter={() => setActiveIndex(index)}
            />
          ))}
        </svg>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: size - strokeWidth * 2 - 8,
          whiteSpace: 'normal',
          zIndex: 2,
        }}>
          {activeItem ? (
            <>
              <Typography variant="h4" fontWeight={700} sx={{ color: activeItem.color, lineHeight: 1.1 }}>
                {activeItem.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1.2, overflow: 'visible' }}>
                {activeItem.label}
              </Typography>
              <Typography variant="caption" sx={{ color: activeItem.color, fontWeight: 600, fontSize: '0.65rem' }}>
                {((activeItem.value / total) * 100).toFixed(1)}%
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h4" fontWeight={700}>{total}</Typography>
              <Typography variant="caption" color="text.secondary">Total</Typography>
            </>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', overflow: 'visible', width: '100%' }}>
        {data.map((item, index) => (
          <Box
            key={index}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.5,
              cursor: 'default',
              opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
              transition: 'opacity 0.2s',
              overflow: 'visible',
              minWidth: 'auto',
              flex: '0 0 auto',
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: item.color, flexShrink: 0, marginTop: '2px' }} />
            <Box sx={{ overflow: 'visible' }}>
              <Typography variant="caption" sx={{ fontWeight: activeIndex === index ? 700 : 400, display: 'block', lineHeight: 1.1, overflow: 'visible', fontSize: '0.75rem' }}>
                {item.label}
              </Typography>
              <Typography variant="caption" sx={{ color: item.color, fontWeight: 700, fontSize: '0.7rem', overflow: 'visible' }}>
                {item.value} <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</Typography>
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Stat Card Component with Apple Liquid Glass Style
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
  <Box 
    sx={{ 
      height: '100%', 
      p: 3,
      borderRadius: '24px',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.95)',
      boxShadow: '0 4px 24px rgba(129, 140, 248, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': onClick ? { 
        transform: 'translateY(-6px)',
        boxShadow: '0 12px 40px rgba(129, 140, 248, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)',
        borderColor: 'rgba(165, 180, 252, 0.6)',
      } : {}
    }}
    onClick={onClick}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#6B7280', 
            fontWeight: 500,
            fontSize: '0.85rem',
            letterSpacing: '-0.01em',
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            color: '#374151',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#6B7280',
              fontSize: '0.75rem',
              mt: 0.5,
              display: 'block',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{
        width: 52,
        height: 52,
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${bgColor}60 0%, ${bgColor}30 100%)`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        boxShadow: `0 4px 16px ${bgColor}40`,
      }}>
        {icon}
      </Box>
    </Box>
  </Box>
);

// Phase Insight Card Component with Progress Breakdown
interface PhaseInsightCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  progressItems: Array<{ progress: string; count: number }>;
  totalPksi: number;
  onProgressClick?: (progress: string) => void;
  expandedProgress?: string | null;
}

const PhaseInsightCard = ({ title, icon, color, progressItems, totalPksi, onProgressClick, expandedProgress }: PhaseInsightCardProps) => {
  const totalCount = progressItems.reduce((sum, item) => sum + item.count, 0);
  const percentage = totalPksi > 0 ? (totalCount / totalPksi) * 100 : 0;
  
  return (
    <Card sx={{ 
      height: '100%',
      background: '#FFFFFF',
      border: '1px solid rgba(239, 68, 68, 0.22)',
      boxShadow: '0 10px 26px rgba(239, 68, 68, 0.12)',
      borderRadius: '20px',
      overflow: 'hidden',
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: '#DC2626',
      },
    }}>
      <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            bgcolor: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            {icon}
          </Box>
          <Typography variant="h6" color="#111827" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h3" color="#0F172A" fontWeight={800} sx={{ mb: 0.5 }}>
          {totalCount}
        </Typography>
        <Typography variant="body2" sx={{ color: '#4B5563', mb: 2 }}>
          {percentage.toFixed(1)}% dari total PKSI
        </Typography>
        
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            bgcolor: 'rgba(239, 68, 68, 0.16)',
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 3,
            },
          }} 
        />
        
        {progressItems.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600, mb: 1, display: 'block' }}>
              Breakdown Progress
            </Typography>
            {progressItems.map((item, index) => (
              <Box 
                key={index}
                onClick={() => onProgressClick?.(item.progress)}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 1,
                  p: 1.25,
                  borderRadius: '10px',
                  bgcolor: expandedProgress === item.progress ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.18)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Typography variant="body2" color="#1F2937" fontWeight={600}>
                  {item.progress}
                </Typography>
                <Typography variant="h6" color="#0F172A" fontWeight={800}>
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
    p: 2.5,
    borderRadius: '20px',
    background: isPrimary 
      ? 'linear-gradient(135deg, rgba(165, 180, 252, 0.25) 0%, rgba(199, 210, 254, 0.25) 100%)' 
      : 'linear-gradient(135deg, rgba(196, 181, 253, 0.25) 0%, rgba(221, 214, 254, 0.25) 100%)',
    backdropFilter: 'blur(10px)',
    border: `1.5px solid ${isPrimary ? 'rgba(129, 140, 248, 0.3)' : 'rgba(167, 139, 250, 0.3)'}`,
    boxShadow: isPrimary 
      ? '0 4px 20px rgba(129, 140, 248, 0.1)' 
      : '0 4px 20px rgba(167, 139, 250, 0.1)',
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <ScheduleIcon sx={{ color: isPrimary ? '#818CF8' : '#A78BFA', fontSize: 22 }} />
      <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#4B5563' }}>
        {insight.label}
      </Typography>
    </Box>
    <Typography variant="h4" fontWeight={700} sx={{ color: isPrimary ? '#6366F1' : '#8B5CF6', mb: 0.5 }}>
      {insight.total}
    </Typography>
    <Typography variant="caption" sx={{ color: '#6B7280' }}>
      PKSI dengan target selesai {insight.year}
    </Typography>
    
    {insight.progress_breakdown.length > 0 && (
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {insight.progress_breakdown.map((pb, idx) => (
          <Chip 
            key={idx}
            label={`${pb.progress}: ${pb.count}`}
            size="small"
            variant="outlined"
            sx={{ 
              fontSize: '0.7rem',
              borderColor: isPrimary ? 'rgba(129, 140, 248, 0.4)' : 'rgba(167, 139, 250, 0.4)',
              color: '#4B5563',
            }}
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
    const { single_year, multiyears_y_minus1, multiyears_y_plus1 } = dashboardData.jenis_pksi_stats;
    return [
      { label: `Multiyears Y-1 (${selectedTahun - 1}→${selectedTahun})`, value: multiyears_y_minus1, color: '#3B82F6' },
      { label: `Single Year (${selectedTahun})`, value: single_year, color: '#EF4444' },
      { label: `Multiyears Y+1 (${selectedTahun}→${selectedTahun + 1})`, value: multiyears_y_plus1, color: '#10B981' },
    ].filter(item => item.value > 0);
  }, [dashboardData?.jenis_pksi_stats, selectedTahun]);

  const pelaksanaChartData = useMemo(() => {
    if (!dashboardData?.pelaksana_stats) return [];
    const data = [
      { label: 'Inhouse', value: dashboardData.pelaksana_stats.inhouse, color: '#EF4444' },
      { label: 'Outsource', value: dashboardData.pelaksana_stats.outsource, color: '#1D4ED8' },
    ];
    if (dashboardData.pelaksana_stats.unknown > 0) {
      data.push({ label: 'Belum Ditentukan', value: dashboardData.pelaksana_stats.unknown, color: '#94A3B8' });
    }
    return data;
  }, [dashboardData?.pelaksana_stats]);

  const approvalBreakdownChartData = useMemo(() => {
    if (!dashboardData?.approval_breakdown) return [];
    return [
      { label: 'Tahun Ini', value: dashboardData.approval_breakdown.disetujui_tahun_ini, color: '#EF4444' },
      { label: 'Multiyears Sebelumnya', value: dashboardData.approval_breakdown.disetujui_multiyears_sebelumnya, color: '#1D4ED8' },
    ];
  }, [dashboardData?.approval_breakdown]);

  const bidangChartData = useMemo(() => {
    if (!dashboardData?.bidang_stats || dashboardData.bidang_stats.length === 0) return [];
    
    const colors = [
      '#EF4444', // Red
      '#1D4ED8', // Blue
      '#10B981', // Green
      '#F97316', // Orange
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F59E0B', // Amber
      '#6366F1'  // Indigo
    ];
    
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
      'Penyusunan Usreq': 'rgba(239, 68, 68, 0.15)',
      'Pengadaan': 'rgba(248, 113, 113, 0.18)',
      'Desain': 'rgba(252, 165, 165, 0.18)',
      'Coding': 'rgba(254, 202, 202, 0.2)',
      'Unit Test': 'rgba(254, 226, 226, 0.22)',
      'SIT': 'rgba(252, 213, 213, 0.2)',
      'UAT': 'rgba(251, 191, 36, 0.12)',
      'Deployment': 'rgba(225, 29, 72, 0.12)',
      'Selesai': 'rgba(244, 114, 182, 0.12)',
    };
    return colorMap[progress] || 'rgba(229, 231, 235, 0.2)';
  };

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: '100%',
        transition: 'margin-left 0.3s, width 0.3s',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f0f4f8 50%, #e8f0f8 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#111827',
            letterSpacing: '-0.03em',
            mb: 1,
          }}
        >
          Dashboard PKSI
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#6B7280',
            fontSize: '0.95rem',
          }}
        >
          Monitoring dan analisis data Permintaan Kebutuhan Sistem Informasi
        </Typography>
      </Box>

      {/* Filters */}
      <Box 
        sx={{ 
          p: 2.5, 
          mb: 3, 
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 20px rgba(129, 140, 248, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          >
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

          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
              }
            }}
          >
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
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.12)' }}>
              <InfoIcon fontSize="small" sx={{ color: '#EF4444' }} />
              <Typography variant="body2" sx={{ color: '#4B5563', fontSize: '0.85rem' }}>
                Snapshot: <strong style={{ color: '#374151' }}>{dashboardData.snapshot_date}</strong>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

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
              color="#EF4444"
              bgColor="#FEE2E2"
              onClick={() => handleStatCardClick('all')}
            />
            <StatCard
              title="Disetujui"
              value={dashboardData.summary.total_disetujui}
              subtitle={`${dashboardData.summary.percentage_disetujui.toFixed(1)}% dari total`}
              icon={<CheckCircleIcon />}
              color="#F87171"
              bgColor="#FEE2E2"
              onClick={() => handleStatCardClick('disetujui')}
            />
            <StatCard
              title="Pending"
              value={dashboardData.summary.total_pending}
              subtitle="Menunggu persetujuan"
              icon={<HourglassEmptyIcon />}
              color="#FCA5A5"
              bgColor="#FEF2F2"
              onClick={() => handleStatCardClick('pending')}
            />
            <StatCard
              title="Ditolak"
              value={dashboardData.summary.total_ditolak}
              icon={<CancelIcon />}
              color="#FECACA"
              bgColor="#FEF2F2"
              onClick={() => handleStatCardClick('ditolak')}
            />
          </Box>

          {/* PKSI List Table (shown when stat card is clicked) */}
          {showPksiTable && (
            <Box 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
                  Daftar PKSI {showPksiTable === 'all' ? '' : `- ${showPksiTable.charAt(0).toUpperCase() + showPksiTable.slice(1)}`}
                </Typography>
                <Chip 
                  label="Tutup" 
                  size="small" 
                  onClick={() => setShowPksiTable(null)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' },
                    fontWeight: 500,
                  }}
                />
              </Box>
              <TableContainer sx={{ maxHeight: 400, borderRadius: '16px', overflow: 'hidden' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(248, 250, 252, 0.95)', color: '#374151' }}>Nama PKSI</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(248, 250, 252, 0.95)', color: '#374151' }}>Inisiatif</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(248, 250, 252, 0.95)', color: '#374151' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(248, 250, 252, 0.95)', color: '#374151' }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(248, 250, 252, 0.95)', color: '#374151' }}>Jenis</TableCell>
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
                            variant="outlined"
                            sx={{
                              borderColor: 'rgba(239, 68, 68, 0.45)',
                              color: '#4B5563',
                              bgcolor: 'rgba(239, 68, 68, 0.08)',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>{pksi.progress || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small"
                            label={pksi.is_multiyear ? 'Multiyears' : 'Single Year'}
                            variant="outlined"
                            sx={{
                              borderColor: 'rgba(239, 68, 68, 0.45)',
                              color: '#4B5563',
                              bgcolor: 'rgba(239, 68, 68, 0.08)',
                              fontWeight: 500,
                            }}
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
            </Box>
          )}

          {/* Progress Insights - Grouped Progress Cards */}
          {dashboardData.progress_by_bidang && dashboardData.progress_by_bidang.length > 0 && (
            <Box 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                boxShadow: '0 10px 30px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(248, 113, 113, 0.0) 45%)',
                  pointerEvents: 'none',
                },
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#111827',
                  letterSpacing: '-0.02em',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  mb: 3,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Box sx={{ 
                  p: 1, 
                  borderRadius: '10px', 
                  background: 'rgba(239, 68, 68, 0.16)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                }}>
                  <AssessmentIcon sx={{ color: '#B91C1C', fontSize: 22 }} />
                </Box>
                Progress Overview
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
                gap: 3,
                position: 'relative',
                zIndex: 1,
              }}>
                {/* Early Stage */}
                <PhaseInsightCard 
                  title="Early Stage"
                  icon={<PlayArrowIcon />}
                  color="#F87171"
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
                  color="#EF4444"
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
                  color="#FCA5A5"
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
                  color="#FECACA"
                  progressItems={dashboardData.progress_by_bidang
                    .filter(row => ['Deployment', 'Selesai'].includes(row.progress))
                    .map(row => ({ progress: row.progress_label, count: row.total }))}
                  totalPksi={dashboardData.summary.total_disetujui}
                  onProgressClick={setExpandedProgress}
                  expandedProgress={expandedProgress}
                />
              </Box>
            </Box>
          )}

          {/* Progress Detail - PKSI List */}
          {expandedProgress && dashboardData?.pksi_list && (
            <Box 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              }}
            >
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
                        <TableRow sx={{ bgcolor: 'rgba(129, 140, 248, 0.08)' }}>
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
            </Box>
          )}

          {/* Deadline Insights */}
          {dashboardData.progress_insights && (
            <Box 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: '#4B5563' }}>
                <ScheduleIcon sx={{ color: '#EF4444' }} />
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
            </Box>
          )}

          {/* Approval Breakdown & Charts */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3, 
            mb: 3 
          }}>
            {/* Approval Breakdown */}
            <Box 
              sx={{ 
                p: 3, 
                borderRadius: '24px', 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                overflow: 'visible',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#4B5563' }}>
                <CalendarMonthIcon sx={{ color: '#EF4444' }} />
                Breakdown PKSI Disetujui
              </Typography>
              <DonutChart 
                data={approvalBreakdownChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Box>

            {/* Jenis PKSI Chart */}
            <Box 
              sx={{ 
                p: 3, 
                borderRadius: '24px', 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                overflow: 'visible',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#4B5563' }}>
                <TrendingUpIcon sx={{ color: '#F87171' }} />
                Breakdown Jenis PKSI
              </Typography>
              <DonutChart 
                data={jenisPksiChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Box>

            {/* Pelaksana Chart */}
            <Box 
              sx={{ 
                p: 3, 
                borderRadius: '24px', 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                overflow: 'visible',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#4B5563' }}>
                <CodeIcon sx={{ color: '#FCA5A5' }} />
                Pelaksana
              </Typography>
              <DonutChart 
                data={pelaksanaChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Box>

            {/* Bidang Chart */}
            <Box 
              sx={{ 
                p: 3, 
                borderRadius: '24px', 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                overflow: 'visible',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#4B5563' }}>
                <BusinessIcon sx={{ color: '#FECACA' }} />
                PKSI per Bidang
              </Typography>
              <DonutChart 
                data={bidangChartData}
                title=""
                size={160}
                strokeWidth={20}
              />
            </Box>
          </Box>

          {/* Progress by Bidang Matrix */}
          <Box 
            sx={{ 
              p: 3, 
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#4B5563' }}>
              <BusinessIcon sx={{ color: '#EF4444' }} />
              Progress PKSI per Bidang
            </Typography>
            <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, minWidth: 150, position: 'sticky', left: 0, bgcolor: 'rgba(255, 255, 255, 0.9)', zIndex: 1 }}>
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
                                variant="outlined"
                                sx={{
                                  borderColor: 'rgba(239, 68, 68, 0.45)',
                                  color: '#4B5563',
                                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                                }}
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
                            variant="outlined"
                            sx={{
                              borderColor: 'rgba(239, 68, 68, 0.45)',
                              color: '#4B5563',
                              bgcolor: row.total > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(148, 163, 184, 0.08)',
                            }}
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
                            <Box sx={{ p: 2, bgcolor: 'rgba(249, 250, 251, 0.8)' }}>
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
                  <TableRow sx={{ bgcolor: 'rgba(165, 180, 252, 0.15)' }}>
                    <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'rgba(165, 180, 252, 0.25)', zIndex: 1 }}>
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
          </Box>
        </>
      )}
    </Box>
  );
}

export default PksiDashboardPage;
