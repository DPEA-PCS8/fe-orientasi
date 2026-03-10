import React, { useEffect, useState, useCallback } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Card,
  CardContent,
  Collapse,
  Tabs,
  Tab,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  History,
  Search,
  Visibility,
  Close,
  FilterList,
  Refresh,
  Lock,
  Add,
  Edit,
  Delete,
  ArrowForward,
  ExpandMore,
  ExpandLess,
  Person,
  AccessTime,
  Category,
  Code,
} from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';
import {
  searchAuditLogs,
  getDistinctEntityNames,
  mapEntityNamesToOptions,
  ACTION_LABELS,
  formatAuditDate,
  getEntityLabel,
} from '../api/auditLogApi';
import type {
  AuditLogData,
  AuditLogSearchParams,
  AuditAction,
  EntityOption,
} from '../api/auditLogApi';

const AuditLogPage: React.FC = () => {
  const { permissionsLoaded, hasPermission } = usePermissions();
  const canView = hasPermission('AUDIT_LOG', 'view');

  // State
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entity options
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('');
  const [searchUsername, setSearchUsername] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState(0);
  const [showRawData, setShowRawData] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: AuditLogSearchParams = {
        page,
        size: rowsPerPage,
      };

      if (filterEntity) params.entity_name = filterEntity;
      if (filterAction) params.action = filterAction;
      if (searchUsername) params.username = searchUsername;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await searchAuditLogs(params);
      setAuditLogs(response.data.content);
      setTotalElements(response.data.total_elements);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data audit log';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterEntity, filterAction, searchUsername, startDate, endDate]);

  useEffect(() => {
    if (permissionsLoaded && canView) {
      fetchData();
    }
  }, [permissionsLoaded, canView, fetchData]);

  // Fetch entity names on mount
  useEffect(() => {
    const fetchEntityNames = async () => {
      if (!canView) return;
      
      setLoadingEntities(true);
      try {
        const response = await getDistinctEntityNames();
        const options = mapEntityNamesToOptions(response.data);
        setEntityOptions(options);
      } catch (err: unknown) {
        console.error('Failed to load entity names:', err);
        // Set empty array on error, user can still use the page
        setEntityOptions([]);
      } finally {
        setLoadingEntities(false);
      }
    };

    if (permissionsLoaded && canView) {
      fetchEntityNames();
    }
  }, [permissionsLoaded, canView]);

  const handleFilterChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name === 'entity') setFilterEntity(value);
    else if (name === 'action') setFilterAction(value as AuditAction | '');
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchUsername(e.target.value);
    setPage(0);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') setStartDate(value);
    else if (name === 'endDate') setEndDate(value);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetail = (log: AuditLogData) => {
    setSelectedLog(log);
    setDetailOpen(true);
    setDetailTab(0);
    setShowRawData(false);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedLog(null);
    setDetailTab(0);
    setShowRawData(false);
  };

  const handleDetailTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setDetailTab(newValue);
  };

  const handleClearFilters = () => {
    setFilterEntity('');
    setFilterAction('');
    setSearchUsername('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const getActionChip = (action: AuditAction) => {
    const config = ACTION_LABELS[action];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return <Add sx={{ color: 'success.main' }} />;
      case 'UPDATE': return <Edit sx={{ color: 'warning.main' }} />;
      case 'DELETE': return <Delete sx={{ color: 'error.main' }} />;
      default: return <History />;
    }
  };

  const getActionDescription = (action: AuditAction, entityName: string) => {
    const entityLabel = getEntityLabel(entityName);
    switch (action) {
      case 'CREATE': return `Data ${entityLabel} baru telah dibuat`;
      case 'UPDATE': return `Data ${entityLabel} telah diperbarui`;
      case 'DELETE': return `Data ${entityLabel} telah dihapus`;
      default: return `Aksi pada ${entityLabel}`;
    }
  };

  const formatFieldLabel = (field: string): string => {
    // Convert snake_case or camelCase to readable format
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) return '-';
        return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const isComplexValue = (value: unknown): boolean => {
    if (typeof value !== 'object' || value === null) return false;
    if (Array.isArray(value)) return value.length > 0 && typeof value[0] === 'object';
    return true;
  };

  // Extract key identifying fields from data
  const extractKeyFields = (data: Record<string, unknown> | null): Record<string, unknown> => {
    if (!data) return {};
    
    const keyFieldNames = [
      'nama', 'name', 'nama_aplikasi', 'nama_arsitektur', 'nama_bidang', 
      'nama_skpa', 'nama_role', 'username', 'email',
      'kode', 'code', 'id', 'title', 'judul', 'deskripsi', 'description'
    ];
    
    const keyFields: Record<string, unknown> = {};
    
    for (const fieldName of keyFieldNames) {
      if (fieldName in data && data[fieldName] !== null && data[fieldName] !== undefined) {
        keyFields[fieldName] = data[fieldName];
      }
    }
    
    return keyFields;
  };

  // Render entity context card showing what entity is being modified
  const renderEntityContext = (oldValue: Record<string, unknown> | null, newValue: Record<string, unknown> | null) => {
    const data = newValue || oldValue;
    if (!data) return null;
    
    const keyFields = extractKeyFields(data);
    
    if (Object.keys(keyFields).length === 0) return null;
    
    return (
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 3,
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
          borderColor: 'info.main',
          borderWidth: 2,
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Category sx={{ color: 'info.main' }} />
            <Typography variant="subtitle1" fontWeight={700} color="info.main">
              Informasi {selectedLog && getEntityLabel(selectedLog.entity_name)}
            </Typography>
          </Box>
          
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
            {Object.entries(keyFields).map(([key, value]) => (
              <Box 
                key={key}
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  display="block"
                  fontWeight={600}
                  textTransform="uppercase"
                  letterSpacing={0.5}
                  mb={0.5}
                >
                  {formatFieldLabel(key)}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {formatValue(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render summary section for CREATE action
  const renderCreateSummary = (newValue: Record<string, unknown> | null) => {
    if (!newValue) return null;
    
    // Show entity context first
    const contextCard = renderEntityContext(null, newValue);
    
    // Filter out complex nested objects and key fields (already shown in context)
    const keyFieldNames = ['nama', 'name', 'nama_aplikasi', 'nama_arsitektur', 'nama_bidang', 'nama_skpa', 'nama_role', 'username', 'email', 'kode', 'code', 'id', 'title', 'judul'];
    const simpleFields = Object.entries(newValue).filter(([k, v]) => !isComplexValue(v) && !keyFieldNames.includes(k));
    const complexFields = Object.entries(newValue).filter(([_, v]) => isComplexValue(v));

    return (
      <Box>
        {contextCard}
        
        {simpleFields.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={700} mb={2} color="text.primary">
              Detail Data Lengkap
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
              {simpleFields.map(([key, value]) => (
                <Box 
                  key={key} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper',
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: (theme) => alpha(theme.palette.success.main, 0.2),
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'success.main',
                      boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.success.main, 0.15)}`,
                    }
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    display="block"
                    fontWeight={600}
                    textTransform="uppercase"
                    letterSpacing={0.5}
                    mb={0.5}
                  >
                    {formatFieldLabel(key)}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                    {formatValue(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
        
        {complexFields.length > 0 && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 1.5 }}>
            + {complexFields.length} field kompleks lainnya tersedia di tab Raw Data
          </Alert>
        )}
      </Box>
    );
  };

  // Render summary section for DELETE action
  const renderDeleteSummary = (oldValue: Record<string, unknown> | null) => {
    if (!oldValue) return null;
    
    // Show entity context first
    const contextCard = renderEntityContext(oldValue, null);
    
    const keyFieldNames = ['nama', 'name', 'nama_aplikasi', 'nama_arsitektur', 'nama_bidang', 'nama_skpa', 'nama_role', 'username', 'email', 'kode', 'code', 'id', 'title', 'judul'];
    const simpleFields = Object.entries(oldValue).filter(([k, v]) => !isComplexValue(v) && !keyFieldNames.includes(k));

    return (
      <Box>
        {contextCard}
        
        {simpleFields.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={700} mb={2} color="text.primary">
              Data yang Dihapus
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
              {simpleFields.map(([key, value]) => (
                <Box 
                  key={key} 
                  sx={{ 
                    p: 2, 
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: (theme) => alpha(theme.palette.error.main, 0.2),
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'error.main',
                      boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.error.main, 0.15)}`,
                    }
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    display="block"
                    fontWeight={600}
                    textTransform="uppercase"
                    letterSpacing={0.5}
                    mb={0.5}
                  >
                    {formatFieldLabel(key)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight={500} 
                    sx={{ 
                      textDecoration: 'line-through', 
                      wordBreak: 'break-word',
                      opacity: 0.7,
                    }}
                  >
                    {formatValue(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    );
  };

  // Render changes for UPDATE action - narrative style
  const renderUpdateChanges = (
    oldValue: Record<string, unknown> | null, 
    newValue: Record<string, unknown> | null, 
    changedFields: string[] | null
  ) => {
    if (!oldValue && !newValue) {
      return <Typography color="text.secondary">Tidak ada data perubahan</Typography>;
    }

    // Show entity context first - THIS IS KEY!
    const contextCard = renderEntityContext(oldValue, newValue);
    
    const fields = changedFields || [];
    
    if (fields.length === 0) {
      return (
        <>
          {contextCard}
          <Alert severity="info" sx={{ borderRadius: 1.5 }}>
            Tidak ada field yang berubah tercatat
          </Alert>
        </>
      );
    }

    return (
      <Box>
        {contextCard}
        
        <Typography variant="h6" fontWeight={700} mb={2.5} color="text.primary">
          Perubahan yang Dilakukan ({fields.length} field)
        </Typography>
        
        <Box display="flex" flexDirection="column" gap={2.5}>
          {fields.map((field) => {
            const oldVal = oldValue ? oldValue[field] : undefined;
            const newVal = newValue ? newValue[field] : undefined;
            const isComplex = isComplexValue(oldVal) || isComplexValue(newVal);

            return (
              <Card 
                key={field} 
                variant="outlined" 
                sx={{ 
                  borderColor: (theme) => alpha(theme.palette.warning.main, 0.3),
                  borderLeftWidth: 4,
                  borderLeftColor: 'warning.main',
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`,
                    borderColor: 'warning.main',
                  }
                }}
              >
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={700} 
                    color="text.primary" 
                    mb={1.5}
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    {formatFieldLabel(field)}
                  </Typography>
                  
                  {isComplex ? (
                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      Data kompleks - lihat tab Raw Data untuk detail lengkap
                    </Alert>
                  ) : (
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                      {/* Old Value */}
                      <Box 
                        sx={{ 
                          flex: '1 1 200px',
                          minWidth: 0, // Allow shrinking
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          fontWeight={600}
                          display="block"
                          mb={0.5}
                        >
                          Nilai Lama
                        </Typography>
                        <Box
                          sx={{ 
                            px: 2, 
                            py: 1.5, 
                            bgcolor: (theme) => alpha(theme.palette.error.main, 0.06), 
                            borderRadius: 1.5,
                            border: '2px solid',
                            borderColor: (theme) => alpha(theme.palette.error.main, 0.2),
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: 'line-through', 
                              color: 'error.main',
                              wordBreak: 'break-word',
                              fontWeight: 500,
                            }}
                          >
                            {formatValue(oldVal)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Arrow */}
                      <ArrowForward sx={{ color: 'warning.main', fontSize: 24, flexShrink: 0 }} />
                      
                      {/* New Value */}
                      <Box 
                        sx={{ 
                          flex: '1 1 200px',
                          minWidth: 0,
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          fontWeight={600}
                          display="block"
                          mb={0.5}
                        >
                          Nilai Baru
                        </Typography>
                        <Box
                          sx={{ 
                            px: 2, 
                            py: 1.5, 
                            bgcolor: (theme) => alpha(theme.palette.success.main, 0.08), 
                            borderRadius: 1.5,
                            border: '2px solid',
                            borderColor: (theme) => alpha(theme.palette.success.main, 0.3),
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'success.dark',
                              fontWeight: 700,
                              wordBreak: 'break-word',
                            }}
                          >
                            {formatValue(newVal)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Render raw JSON data
  const renderRawData = (oldValue: Record<string, unknown> | null, newValue: Record<string, unknown> | null) => {
    return (
      <Box display="flex" flexDirection="column" gap={3}>
        {oldValue && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Code sx={{ color: 'error.main', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700} color="error.main">
                Data Lama (Old Value)
              </Typography>
            </Box>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                bgcolor: (theme) => alpha(theme.palette.grey[900], 0.03),
                border: '2px solid',
                borderColor: (theme) => alpha(theme.palette.error.main, 0.2),
                borderRadius: 2,
                maxHeight: 400, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.3),
                  borderRadius: '4px',
                },
              }}
            >
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                color: '#d32f2f',
              }}>
                {JSON.stringify(oldValue, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}
        
        {newValue && (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Code sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700} color="success.main">
                Data Baru (New Value)
              </Typography>
            </Box>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                bgcolor: (theme) => alpha(theme.palette.grey[900], 0.03),
                border: '2px solid',
                borderColor: (theme) => alpha(theme.palette.success.main, 0.2),
                borderRadius: 2,
                maxHeight: 400, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.3),
                  borderRadius: '4px',
                },
              }}
            >
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                color: '#2e7d32',
              }}>
                {JSON.stringify(newValue, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

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
        <Alert
          severity="error"
          icon={<Lock />}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Akses Ditolak
          </Typography>
          <Typography variant="body2">
            Anda tidak memiliki izin untuk mengakses halaman Audit Log.
            Silakan hubungi administrator untuk mendapatkan akses.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <History color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Audit Log
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterList color="action" />
          <Typography variant="subtitle2" fontWeight={600}>
            Filter
          </Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Menu/Entitas</InputLabel>
            <Select
              name="entity"
              value={filterEntity}
              label="Menu/Entitas"
              onChange={handleFilterChange}
              disabled={loadingEntities}
            >
              <MenuItem value="">Semua</MenuItem>
              {entityOptions.map((entity) => (
                <MenuItem key={entity.value} value={entity.value}>
                  {entity.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Aksi</InputLabel>
            <Select
              name="action"
              value={filterAction}
              label="Aksi"
              onChange={handleFilterChange}
            >
              <MenuItem value="">Semua</MenuItem>
              {Object.entries(ACTION_LABELS).map(([key, config]) => (
                <MenuItem key={key} value={key}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Cari username..."
            value={searchUsername}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
            }}
            sx={{ minWidth: 180 }}
          />

          <TextField
            size="small"
            type="date"
            name="startDate"
            label="Dari Tanggal"
            value={startDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            size="small"
            type="date"
            name="endDate"
            label="Sampai Tanggal"
            value={endDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={handleClearFilters}
            sx={{ minHeight: 40 }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Waktu</strong></TableCell>
              <TableCell><strong>Menu/Entitas</strong></TableCell>
              <TableCell><strong>Aksi</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Perubahan</strong></TableCell>
              <TableCell align="center"><strong>Detail</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Tidak ada data audit log
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatAuditDate(log.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography fontWeight={500}>
                        {getEntityLabel(log.entity_name)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {log.entity_id?.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getActionChip(log.action)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.username || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {log.changed_fields && log.changed_fields.length > 0 ? (
                      <Box>
                        {log.changed_fields.slice(0, 3).map((field) => (
                          <Chip
                            key={field}
                            label={field}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                          />
                        ))}
                        {log.changed_fields.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{log.changed_fields.length - 3} lainnya
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {log.action === 'CREATE' ? 'Data baru' : log.action === 'DELETE' ? 'Data dihapus' : '-'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Lihat Detail">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleViewDetail(log)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
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

      {/* Detail Modal */}
      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {selectedLog && getActionIcon(selectedLog.action)}
                <Typography variant="h6" fontWeight={600}>
                  {selectedLog && getActionDescription(selectedLog.action, selectedLog.entity_name)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {selectedLog && formatAuditDate(selectedLog.created_at)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {selectedLog?.username || 'System'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Category sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {selectedLog && getEntityLabel(selectedLog.entity_name)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDetail} size="small" sx={{ mt: -0.5 }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <Divider />
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs 
            value={detailTab} 
            onChange={handleDetailTabChange}
            sx={{ minHeight: 42 }}
          >
            <Tab 
              label="Ringkasan" 
              sx={{ minHeight: 42, textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              label="Raw Data" 
              icon={<Code sx={{ fontSize: 16 }} />}
              iconPosition="start"
              sx={{ minHeight: 42, textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>

        <DialogContent sx={{ minHeight: 400, pt: 3, pb: 4 }}>
          {selectedLog && (
            <>
              {/* Tab 0: Ringkasan */}
              {detailTab === 0 && (
                <Box>
                  {/* Action-specific content */}
                  {selectedLog.action === 'CREATE' && renderCreateSummary(selectedLog.new_value)}
                  {selectedLog.action === 'DELETE' && renderDeleteSummary(selectedLog.old_value)}
                  {selectedLog.action === 'UPDATE' && renderUpdateChanges(
                    selectedLog.old_value, 
                    selectedLog.new_value, 
                    selectedLog.changed_fields
                  )}

                  {/* Additional Info */}
                  <Box mt={4}>
                    <Button
                      size="small"
                      startIcon={showRawData ? <ExpandLess /> : <ExpandMore />}
                      onClick={() => setShowRawData(!showRawData)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {showRawData ? 'Sembunyikan' : 'Tampilkan'} Info Tambahan
                    </Button>
                    <Collapse in={showRawData}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          mt: 2,
                          borderColor: 'divider',
                          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.03),
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.primary">
                            Informasi Teknis
                          </Typography>
                          <Box 
                            display="grid"
                            gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
                            gap={2}
                          >
                            <Box>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                fontWeight={600}
                                textTransform="uppercase"
                                letterSpacing={0.5}
                                display="block"
                                mb={0.5}
                              >
                                Entity ID
                              </Typography>
                              <Typography 
                                variant="body2" 
                                fontWeight={500}
                                sx={{ 
                                  wordBreak: 'break-all',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {selectedLog.entity_id}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                fontWeight={600}
                                textTransform="uppercase"
                                letterSpacing={0.5}
                                display="block"
                                mb={0.5}
                              >
                                IP Address
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {selectedLog.ip_address || '-'}
                              </Typography>
                            </Box>
                            {selectedLog.user_agent && (
                              <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  fontWeight={600}
                                  textTransform="uppercase"
                                  letterSpacing={0.5}
                                  display="block"
                                  mb={0.5}
                                >
                                  User Agent
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    wordBreak: 'break-all', 
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    opacity: 0.8,
                                  }}
                                >
                                  {selectedLog.user_agent}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Collapse>
                  </Box>
                </Box>
              )}

              {/* Tab 1: Raw Data */}
              {detailTab === 1 && (
                <Box>
                  {renderRawData(selectedLog.old_value, selectedLog.new_value)}
                  
                  {!selectedLog.old_value && !selectedLog.new_value && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Tidak ada raw data tersedia untuk log ini.
                    </Alert>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDetail} variant="outlined">
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogPage;
