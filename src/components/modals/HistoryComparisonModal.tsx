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
  Chip,
  Divider,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  FolderRounded,
  AssignmentRounded,
  AddCircleOutline as AddIcon,
  RemoveCircleOutline as RemoveIcon,
  EditOutlined as EditIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getRbsiHistory } from '../../api/rbsiApi';
import type { RbsiHistoryResponse, RbsiProgramResponse, RbsiInisiatifResponse } from '../../api/rbsiApi';

interface HistoryComparisonModalProps {
  open: boolean;
  onClose: () => void;
  rbsiId: string;
  periode: string;
}

interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  program?: RbsiProgramResponse;
  previousProgram?: RbsiProgramResponse;
  inisiatifDiffs?: InisiatifDiff[];
}

interface InisiatifDiff {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  inisiatif?: RbsiInisiatifResponse;
  previousInisiatif?: RbsiInisiatifResponse;
}

const HistoryComparisonModal = ({
  open,
  onClose,
  rbsiId,
  periode,
}: HistoryComparisonModalProps) => {
  const [history, setHistory] = useState<RbsiHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);

  useEffect(() => {
    if (open && rbsiId) {
      fetchHistory();
    }
  }, [open, rbsiId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getRbsiHistory(rbsiId);
      // Sort by year ascending
      const sorted = [...response.data].sort((a, b) => a.tahun - b.tahun);
      setHistory(sorted);
      setSelectedYearIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data history');
    } finally {
      setLoading(false);
    }
  };

  // Calculate differences between two years
  const calculateDiff = (
    currentPrograms: RbsiProgramResponse[],
    previousPrograms: RbsiProgramResponse[]
  ): DiffResult[] => {
    const results: DiffResult[] = [];
    const previousMap = new Map(previousPrograms.map(p => [p.nomor_program, p]));
    const currentMap = new Map(currentPrograms.map(p => [p.nomor_program, p]));

    // Check current programs
    for (const program of currentPrograms) {
      const prev = previousMap.get(program.nomor_program);
      
      if (!prev) {
        // New program
        results.push({
          type: 'added',
          program,
          inisiatifDiffs: (program.inisiatifs || []).map(ini => ({
            type: 'added' as const,
            inisiatif: ini,
          })),
        });
      } else {
        // Existing program - check for modifications
        const nameChanged = prev.nama_program !== program.nama_program;
        const inisiatifDiffs = calculateInisiatifDiff(
          program.inisiatifs || [],
          prev.inisiatifs || []
        );
        
        const hasChanges = nameChanged || inisiatifDiffs.some(d => d.type !== 'unchanged');
        
        results.push({
          type: hasChanges ? 'modified' : 'unchanged',
          program,
          previousProgram: prev,
          inisiatifDiffs,
        });
      }
    }

    // Check for removed programs
    for (const prev of previousPrograms) {
      if (!currentMap.has(prev.nomor_program)) {
        results.push({
          type: 'removed',
          previousProgram: prev,
          inisiatifDiffs: (prev.inisiatifs || []).map(ini => ({
            type: 'removed' as const,
            previousInisiatif: ini,
          })),
        });
      }
    }

    // Sort by nomor_program
    return results.sort((a, b) => {
      const numA = a.program?.nomor_program || a.previousProgram?.nomor_program || '';
      const numB = b.program?.nomor_program || b.previousProgram?.nomor_program || '';
      return numA.localeCompare(numB, undefined, { numeric: true });
    });
  };

  const calculateInisiatifDiff = (
    current: RbsiInisiatifResponse[],
    previous: RbsiInisiatifResponse[]
  ): InisiatifDiff[] => {
    const results: InisiatifDiff[] = [];
    const prevMap = new Map(previous.map(i => [i.nomor_inisiatif, i]));
    const currentMap = new Map(current.map(i => [i.nomor_inisiatif, i]));

    for (const ini of current) {
      const prev = prevMap.get(ini.nomor_inisiatif);
      if (!prev) {
        results.push({ type: 'added', inisiatif: ini });
      } else {
        const nameChanged = prev.nama_inisiatif !== ini.nama_inisiatif;
        results.push({
          type: nameChanged ? 'modified' : 'unchanged',
          inisiatif: ini,
          previousInisiatif: prev,
        });
      }
    }

    for (const prev of previous) {
      if (!currentMap.has(prev.nomor_inisiatif)) {
        results.push({ type: 'removed', previousInisiatif: prev });
      }
    }

    return results.sort((a, b) => {
      const numA = a.inisiatif?.nomor_inisiatif || a.previousInisiatif?.nomor_inisiatif || '';
      const numB = b.inisiatif?.nomor_inisiatif || b.previousInisiatif?.nomor_inisiatif || '';
      return numA.localeCompare(numB, undefined, { numeric: true });
    });
  };

  // Get comparison data
  const comparisonData = useMemo(() => {
    if (history.length < 2 || selectedYearIndex >= history.length - 1) {
      return null;
    }

    const currentYear = history[selectedYearIndex + 1];
    const previousYear = history[selectedYearIndex];

    return {
      currentYear,
      previousYear,
      diffs: calculateDiff(currentYear.programs, previousYear.programs),
    };
  }, [history, selectedYearIndex]);

  // Stats
  const stats = useMemo(() => {
    if (!comparisonData) return null;
    
    let programsAdded = 0;
    let programsRemoved = 0;
    let programsModified = 0;
    let inisiatifAdded = 0;
    let inisiatifRemoved = 0;
    let inisiatifModified = 0;

    for (const diff of comparisonData.diffs) {
      if (diff.type === 'added') programsAdded++;
      if (diff.type === 'removed') programsRemoved++;
      if (diff.type === 'modified') programsModified++;

      for (const iniDiff of diff.inisiatifDiffs || []) {
        if (iniDiff.type === 'added') inisiatifAdded++;
        if (iniDiff.type === 'removed') inisiatifRemoved++;
        if (iniDiff.type === 'modified') inisiatifModified++;
      }
    }

    return {
      programsAdded,
      programsRemoved,
      programsModified,
      inisiatifAdded,
      inisiatifRemoved,
      inisiatifModified,
    };
  }, [comparisonData]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'added': return '#4caf50';
      case 'removed': return '#f44336';
      case 'modified': return '#ff9800';
      default: return '#86868b';
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'added': return 'rgba(76, 175, 80, 0.08)';
      case 'removed': return 'rgba(244, 67, 54, 0.08)';
      case 'modified': return 'rgba(255, 152, 0, 0.08)';
      default: return 'transparent';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'added': return <AddIcon sx={{ fontSize: 16, color: '#4caf50' }} />;
      case 'removed': return <RemoveIcon sx={{ fontSize: 16, color: '#f44336' }} />;
      case 'modified': return <EditIcon sx={{ fontSize: 16, color: '#ff9800' }} />;
      default: return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e5e5e7',
        pb: 2,
        bgcolor: 'white',
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            Riwayat Perubahan Program
          </Typography>
          <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
            Periode {periode}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: '#f8f9fa', px: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={40} sx={{ color: '#DA251C' }} />
          </Box>
        ) : history.length < 2 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" sx={{ color: '#86868b' }}>
              {history.length === 0 
                ? 'Belum ada data program untuk periode ini'
                : 'Diperlukan minimal 2 tahun data untuk membandingkan perubahan'}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Year selector */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2, 
              mb: 3,
              p: 2,
              bgcolor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <IconButton 
                onClick={() => setSelectedYearIndex(Math.max(0, selectedYearIndex - 1))}
                disabled={selectedYearIndex === 0}
                sx={{ color: '#DA251C' }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Paper sx={{ 
                  px: 3, 
                  py: 1.5, 
                  bgcolor: '#f5f5f7',
                  borderRadius: '8px',
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                    {history[selectedYearIndex]?.tahun}
                  </Typography>
                </Paper>
                
                <ArrowForwardIcon sx={{ color: '#DA251C' }} />
                
                <Paper sx={{ 
                  px: 3, 
                  py: 1.5, 
                  bgcolor: '#DA251C',
                  borderRadius: '8px',
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                    {history[selectedYearIndex + 1]?.tahun}
                  </Typography>
                </Paper>
              </Box>

              <IconButton 
                onClick={() => setSelectedYearIndex(Math.min(history.length - 2, selectedYearIndex + 1))}
                disabled={selectedYearIndex >= history.length - 2}
                sx={{ color: '#DA251C' }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Box>

            {/* Stats */}
            {stats && (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                flexWrap: 'wrap',
              }}>
                <Chip 
                  icon={<AddIcon />} 
                  label={`${stats.programsAdded} program baru`}
                  sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}
                />
                <Chip 
                  icon={<RemoveIcon />} 
                  label={`${stats.programsRemoved} program dihapus`}
                  sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}
                />
                <Chip 
                  icon={<EditIcon />} 
                  label={`${stats.programsModified} program diubah`}
                  sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}
                />
                <Divider orientation="vertical" flexItem />
                <Chip 
                  icon={<AddIcon />} 
                  label={`${stats.inisiatifAdded} inisiatif baru`}
                  sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}
                />
                <Chip 
                  icon={<RemoveIcon />} 
                  label={`${stats.inisiatifRemoved} inisiatif dihapus`}
                  sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}
                />
                <Chip 
                  icon={<EditIcon />} 
                  label={`${stats.inisiatifModified} inisiatif diubah`}
                  sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}
                />
              </Box>
            )}

            {/* Diff list */}
            <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {comparisonData?.diffs.map((diff, idx) => (
                <Paper 
                  key={idx}
                  sx={{ 
                    mb: 2, 
                    p: 2,
                    bgcolor: getTypeBgColor(diff.type),
                    border: diff.type !== 'unchanged' ? `1px solid ${getTypeColor(diff.type)}` : '1px solid #e5e5e7',
                    borderRadius: '12px',
                  }}
                >
                  {/* Program header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                    <FolderRounded sx={{ 
                      color: diff.type === 'removed' ? '#f44336' : '#DA251C', 
                      fontSize: 24,
                      mt: 0.5,
                    }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 600, 
                          color: '#1d1d1f',
                          textDecoration: diff.type === 'removed' ? 'line-through' : 'none',
                        }}>
                          {diff.program?.nomor_program || diff.previousProgram?.nomor_program}
                        </Typography>
                        {getTypeIcon(diff.type)}
                        {diff.type === 'added' && (
                          <Chip label="Baru" size="small" sx={{ bgcolor: '#4caf50', color: 'white', height: 20 }} />
                        )}
                        {diff.type === 'removed' && (
                          <Chip label="Dihapus" size="small" sx={{ bgcolor: '#f44336', color: 'white', height: 20 }} />
                        )}
                      </Box>
                      
                      {/* Program name comparison */}
                      {diff.type === 'modified' && diff.previousProgram?.nama_program !== diff.program?.nama_program ? (
                        <Box>
                          <Typography variant="body2" sx={{ color: '#f44336', textDecoration: 'line-through' }}>
                            {diff.previousProgram?.nama_program}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#4caf50' }}>
                            {diff.program?.nama_program}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ 
                          color: '#666',
                          textDecoration: diff.type === 'removed' ? 'line-through' : 'none',
                        }}>
                          {diff.program?.nama_program || diff.previousProgram?.nama_program}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Inisiatif changes */}
                  {diff.inisiatifDiffs && diff.inisiatifDiffs.length > 0 && (
                    <Box sx={{ ml: 4, mt: 1.5, pt: 1.5, borderTop: '1px dashed #e5e5e7' }}>
                      {diff.inisiatifDiffs.map((iniDiff, iniIdx) => (
                        <Box 
                          key={iniIdx}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 1,
                            py: 0.75,
                            pl: 1,
                            borderLeft: `2px solid ${getTypeColor(iniDiff.type)}`,
                            ml: 1,
                            mb: 0.5,
                            bgcolor: iniDiff.type !== 'unchanged' ? getTypeBgColor(iniDiff.type) : 'transparent',
                            borderRadius: '0 4px 4px 0',
                          }}
                        >
                          <AssignmentRounded sx={{ 
                            color: iniDiff.type === 'removed' ? '#f44336' : '#86868b', 
                            fontSize: 18,
                            mt: 0.25,
                          }} />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 500,
                                color: '#1d1d1f',
                                textDecoration: iniDiff.type === 'removed' ? 'line-through' : 'none',
                              }}>
                                {iniDiff.inisiatif?.nomor_inisiatif || iniDiff.previousInisiatif?.nomor_inisiatif}
                              </Typography>
                              {getTypeIcon(iniDiff.type)}
                            </Box>
                            
                            {iniDiff.type === 'modified' && iniDiff.previousInisiatif?.nama_inisiatif !== iniDiff.inisiatif?.nama_inisiatif ? (
                              <Box>
                                <Tooltip title="Sebelum" placement="left">
                                  <Typography variant="caption" sx={{ 
                                    display: 'block',
                                    color: '#f44336', 
                                    textDecoration: 'line-through',
                                    fontSize: '0.75rem',
                                  }}>
                                    {iniDiff.previousInisiatif?.nama_inisiatif}
                                  </Typography>
                                </Tooltip>
                                <Tooltip title="Sesudah" placement="left">
                                  <Typography variant="caption" sx={{ 
                                    display: 'block',
                                    color: '#4caf50',
                                    fontSize: '0.75rem',
                                  }}>
                                    {iniDiff.inisiatif?.nama_inisiatif}
                                  </Typography>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Typography variant="caption" sx={{ 
                                color: '#666',
                                textDecoration: iniDiff.type === 'removed' ? 'line-through' : 'none',
                              }}>
                                {iniDiff.inisiatif?.nama_inisiatif || iniDiff.previousInisiatif?.nama_inisiatif}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              ))}

              {comparisonData?.diffs.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" sx={{ color: '#86868b' }}>
                    Tidak ada data program di kedua tahun
                  </Typography>
                </Box>
              )}

              {comparisonData?.diffs.every(d => d.type === 'unchanged') && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" sx={{ color: '#4caf50' }}>
                    Tidak ada perubahan antara tahun {comparisonData.previousYear.tahun} dan {comparisonData.currentYear.tahun}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistoryComparisonModal;
