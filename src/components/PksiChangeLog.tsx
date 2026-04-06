import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Chip,
  Avatar,
  styled,
  IconButton,
  Tooltip,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { getPksiChangelogs } from '../api/pksiApi';

// Types for change log
export interface ChangeLogEntry {
  id: string;
  field_name: string;
  field_label: string;
  old_value: string | null;
  new_value: string | null;
  updated_by: string;
  updated_by_name: string;
  updated_at: string;
}

export interface DateGroup {
  date: string;
  displayDate: string;
  entries: ChangeLogEntry[];
}

interface PksiChangeLogProps {
  pksiId: string;
  changeLogs?: ChangeLogEntry[];
}

// Styled components
const GlassCard = styled(Box)({
  padding: '24px',
  borderRadius: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.9)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
});

const SectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
});

const DateHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
  border: '1px solid rgba(99, 102, 241, 0.15)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
  },
});

const TimelineContainer = styled(Box)({
  position: 'relative',
  paddingLeft: '28px',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '10px',
    top: '0',
    bottom: '0',
    width: '2px',
    background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.1) 100%)',
    borderRadius: '1px',
  },
});

const TimelineDot = styled(Box)({
  position: 'absolute',
  left: '-22px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  border: '3px solid white',
  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
});

const ChangeCard = styled(Box)({
  position: 'relative',
  padding: '16px',
  borderRadius: '14px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  marginBottom: '12px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'white',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    transform: 'translateX(4px)',
  },
  '&:last-child': {
    marginBottom: 0,
  },
});

const ValuePill = styled(Box)<{ variant: 'old' | 'new' }>(({ variant }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 14px',
  borderRadius: '10px',
  backgroundColor: variant === 'old' 
    ? alpha('#EF4444', 0.08)
    : alpha('#10B981', 0.08),
  border: `1px solid ${variant === 'old' ? alpha('#EF4444', 0.2) : alpha('#10B981', 0.2)}`,
  flex: '1 1 auto',
  minWidth: 0,
  maxWidth: 'calc(50% - 24px)', // Half width minus gap and arrow
  overflow: 'hidden',
}));

// Group change logs by date only
const groupChangeLogsByDate = (logs: ChangeLogEntry[]): DateGroup[] => {
  const groups: Map<string, DateGroup> = new Map();

  logs.forEach((log) => {
    // Skip if updated_at is invalid
    if (!log.updated_at) return;
    
    const date = new Date(log.updated_at);
    // Check if date is valid
    if (isNaN(date.getTime())) return;
    
    const dateKey = date.toISOString().split('T')[0];

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: dateKey,
        displayDate: formatDateDisplay(dateKey),
        entries: [],
      });
    }

    groups.get(dateKey)!.entries.push(log);
  });

  // Sort groups by date descending, and entries within each group by time descending
  const sortedGroups = Array.from(groups.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(group => ({
      ...group,
      entries: group.entries.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    }));

  return sortedGroups;
};

// Format date for display
const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hari Ini';
  if (isYesterday) return 'Kemarin';

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generate avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    'linear-gradient(135deg, #DA251C 0%, #FF6B6B 100%)',
    'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)',
    'linear-gradient(135deg, #059669 0%, #34D399 100%)',
    'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
    'linear-gradient(135deg, #DB2777 0%, #F472B6 100%)',
    'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)',
    'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
    'linear-gradient(135deg, #65A30D 0%, #A3E635 100%)',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const PksiChangeLog: React.FC<PksiChangeLogProps> = ({ pksiId, changeLogs }) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<ChangeLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch changelogs from API
  useEffect(() => {
    const fetchChangelogs = async () => {
      if (!pksiId) {
        setLogs(changeLogs || []);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getPksiChangelogs(pksiId);
        setLogs(response.changelogs || []);
      } catch (error) {
        console.error('Error fetching changelogs:', error);
        // Fallback to provided changeLogs or empty array
        setLogs(changeLogs || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChangelogs();
  }, [pksiId, changeLogs]);

  const groupedLogs = groupChangeLogsByDate(logs);

  // Expand first date by default
  React.useEffect(() => {
    if (groupedLogs.length > 0) {
      setExpandedDates(prev => {
        if (prev.size === 0) {
          return new Set([groupedLogs[0].date]);
        }
        return prev;
      });
    }
  }, [groupedLogs]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <GlassCard>
        <SectionHeader>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <HistoryIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Riwayat Perubahan
          </Typography>
        </SectionHeader>
        <Box
          sx={{
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress sx={{ color: '#6366F1' }} />
        </Box>
      </GlassCard>
    );
  }

  if (logs.length === 0) {
    return (
      <GlassCard>
        <SectionHeader>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <HistoryIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Riwayat Perubahan
          </Typography>
        </SectionHeader>
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: '16px',
            bgcolor: 'rgba(99, 102, 241, 0.04)',
            border: '1px dashed rgba(99, 102, 241, 0.2)',
          }}
        >
          <HistoryIcon sx={{ fontSize: 48, color: '#C7C7CC', mb: 2 }} />
          <Typography variant="body1" sx={{ color: '#86868b', fontWeight: 500 }}>
            Belum ada riwayat perubahan
          </Typography>
          <Typography variant="caption" sx={{ color: '#AEAEB2' }}>
            Perubahan pada dokumen akan ditampilkan di sini
          </Typography>
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeader>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
          }}
        >
          <HistoryIcon sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Riwayat Perubahan
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip
              size="small"
              icon={<EditIcon sx={{ fontSize: '14px !important' }} />}
              label={`${logs.length} perubahan`}
              sx={{
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366F1',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-icon': { color: '#6366F1' },
              }}
            />
            <Chip
              size="small"
              icon={<CalendarIcon sx={{ fontSize: '14px !important' }} />}
              label={`${groupedLogs.length} hari`}
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-icon': { color: '#059669' },
              }}
            />
          </Box>
        </Box>
      </SectionHeader>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {groupedLogs.map((group) => (
          <Box key={group.date}>
            {/* Date Header */}
            <DateHeader onClick={() => toggleDate(group.date)}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 20, color: '#6366F1' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1d1d1f', lineHeight: 1.2 }}>
                    {group.displayDate}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86868b' }}>
                    {group.entries.length} perubahan
                  </Typography>
                </Box>
              </Box>
              <IconButton
                size="small"
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' },
                }}
              >
                {expandedDates.has(group.date) ? (
                  <ArrowUpIcon sx={{ color: '#6366F1' }} />
                ) : (
                  <ArrowDownIcon sx={{ color: '#6366F1' }} />
                )}
              </IconButton>
            </DateHeader>

            {/* Entries */}
            <Collapse in={expandedDates.has(group.date)} timeout="auto">
              <TimelineContainer sx={{ mt: 2, mb: 1 }}>
                {group.entries.map((entry) => (
                  <ChangeCard key={entry.id}>
                    <TimelineDot />
                    
                    {/* Header with user and time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Tooltip title={entry.updated_by_name} arrow>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              background: getAvatarColor(entry.updated_by_name),
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(entry.updated_by_name)}
                          </Avatar>
                        </Tooltip>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f', lineHeight: 1.2 }}>
                            {entry.updated_by_name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon sx={{ fontSize: 12, color: '#86868b' }} />
                            <Typography variant="caption" sx={{ color: '#86868b' }}>
                              {formatTime(entry.updated_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip
                        size="small"
                        label={entry.field_label}
                        sx={{
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                          color: '#1d1d1f',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 22,
                        }}
                      />
                    </Box>

                    {/* Values */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'stretch', 
                      gap: 1.5, 
                      flexWrap: 'nowrap',
                      minWidth: 0,
                    }}>
                      <ValuePill variant="old">
                        <Box sx={{ minWidth: 0, width: '100%' }}>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: '#EF4444', 
                              fontWeight: 600, 
                              display: 'block',
                              fontSize: '0.65rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              mb: 0.25,
                            }}
                          >
                            Sebelum
                          </Typography>
                          <Typography
                            variant="body2"
                            title={entry.old_value || '(kosong)'}
                            sx={{
                              color: entry.old_value ? '#B91C1C' : '#9CA3AF',
                              fontWeight: 500,
                              wordBreak: 'break-word',
                              fontStyle: entry.old_value ? 'normal' : 'italic',
                              fontSize: '0.85rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {entry.old_value || '(kosong)'}
                          </Typography>
                        </Box>
                      </ValuePill>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          flexShrink: 0,
                        }}
                      >
                        <TrendingFlatIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                      </Box>

                      <ValuePill variant="new">
                        <Box sx={{ minWidth: 0, width: '100%' }}>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: '#10B981', 
                              fontWeight: 600, 
                              display: 'block',
                              fontSize: '0.65rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              mb: 0.25,
                            }}
                          >
                            Sesudah
                          </Typography>
                          <Typography
                            variant="body2"
                            title={entry.new_value || '(kosong)'}
                            sx={{
                              color: entry.new_value ? '#047857' : '#9CA3AF',
                              fontWeight: 500,
                              wordBreak: 'break-word',
                              fontStyle: entry.new_value ? 'normal' : 'italic',
                              fontSize: '0.85rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {entry.new_value || '(kosong)'}
                          </Typography>
                        </Box>
                      </ValuePill>
                    </Box>
                  </ChangeCard>
                ))}
              </TimelineContainer>
            </Collapse>
          </Box>
        ))}
      </Box>
    </GlassCard>
  );
};

export default PksiChangeLog;
