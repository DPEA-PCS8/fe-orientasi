import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  Collapse,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  FolderRounded,
  AssignmentRounded,
} from '@mui/icons-material';
import { getProgramsByRbsi, copyProgram, copyInisiatif } from '../../api/rbsiApi';
import type { RbsiProgramResponse } from '../../api/rbsiApi';

interface CopyFromYearModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rbsiId: string;
  fromTahun: number;
  toTahun: number;
  existingPrograms: RbsiProgramResponse[]; // Programs already in toTahun
}

const CopyFromYearModal = ({
  open,
  onClose,
  onSuccess,
  rbsiId,
  fromTahun,
  toTahun,
  existingPrograms,
}: CopyFromYearModalProps) => {
  const [sourcePrograms, setSourcePrograms] = useState<RbsiProgramResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Selected items
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [selectedInisiatifs, setSelectedInisiatifs] = useState<Map<string, string>>(new Map());
  
  // Expanded state for programs
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  // Progress tracking
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

  // Fetch programs from source year
  useEffect(() => {
    if (open && rbsiId && fromTahun) {
      fetchSourcePrograms();
    }
  }, [open, rbsiId, fromTahun]);

  const fetchSourcePrograms = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getProgramsByRbsi(rbsiId, fromTahun);
      setSourcePrograms(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data program');
    } finally {
      setLoading(false);
    }
  };

  // Check if a program with same nomor_program exists in target year
  const findMatchingProgram = (nomorProgram: string): RbsiProgramResponse | undefined => {
    return existingPrograms.find(p => p.nomor_program === nomorProgram);
  };

  // Check if an inisiatif with same nomor_inisiatif exists in target program
  const inisiatifExistsInTarget = (nomorInisiatif: string, targetProgram: RbsiProgramResponse): boolean => {
    return targetProgram.inisiatifs?.some(i => i.nomor_inisiatif === nomorInisiatif) || false;
  };

  // Toggle program selection
  const toggleProgram = (programId: string) => {
    const newSelected = new Set(selectedPrograms);
    if (newSelected.has(programId)) {
      newSelected.delete(programId);
      // Also remove all inisiatifs from this program
      const newInisiatifs = new Map(selectedInisiatifs);
      const program = sourcePrograms.find(p => p.id === programId);
      program?.inisiatifs?.forEach(ini => newInisiatifs.delete(ini.id));
      setSelectedInisiatifs(newInisiatifs);
    } else {
      newSelected.add(programId);
      // Remove individual inisiatif selections since we're copying entire program
      const newInisiatifs = new Map(selectedInisiatifs);
      const program = sourcePrograms.find(p => p.id === programId);
      program?.inisiatifs?.forEach(ini => newInisiatifs.delete(ini.id));
      setSelectedInisiatifs(newInisiatifs);
    }
    setSelectedPrograms(newSelected);
  };

  // Toggle inisiatif selection (only when target program exists)
  const toggleInisiatif = (inisiatifId: string, targetProgramId: string) => {
    const newSelected = new Map(selectedInisiatifs);
    if (newSelected.has(inisiatifId)) {
      newSelected.delete(inisiatifId);
    } else {
      newSelected.set(inisiatifId, targetProgramId);
    }
    setSelectedInisiatifs(newSelected);
  };

  // Toggle expand program
  const toggleExpand = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  // Select all programs that don't exist in target
  const selectAllNewPrograms = () => {
    const newSelected = new Set<string>();
    sourcePrograms.forEach(program => {
      if (!findMatchingProgram(program.nomor_program)) {
        newSelected.add(program.id);
      }
    });
    setSelectedPrograms(newSelected);
    setSelectedInisiatifs(new Map());
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedPrograms(new Set());
    setSelectedInisiatifs(new Map());
  };

  // Handle submit
  const handleSubmit = async () => {
    if (selectedPrograms.size === 0 && selectedInisiatifs.size === 0) {
      setError('Pilih setidaknya satu program atau inisiatif untuk disalin');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    const totalItems = selectedPrograms.size + selectedInisiatifs.size;
    let completedItems = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      // Sort selected programs by their original nomor_program order
      const sortedSelectedPrograms = [...selectedPrograms]
        .map(id => sourcePrograms.find(p => p.id === id))
        .filter((p): p is RbsiProgramResponse => !!p)
        .sort((a, b) => a.nomor_program.localeCompare(b.nomor_program, undefined, { numeric: true }));

      // Copy selected programs preserving their original nomor_program
      for (const program of sortedSelectedPrograms) {
        setProgress({
          current: completedItems + 1,
          total: totalItems,
          message: `Menyalin program ${program.nomor_program}...`,
        });

        try {
          // Use the original nomor_program from source program
          await copyProgram(program.id, toTahun, program.nomor_program);
        } catch (err) {
          errorCount++;
          errors.push(`Program ${program.nomor_program}: ${err instanceof Error ? err.message : 'Gagal'}`);
        }
        completedItems++;
      }

      // Group selected inisiatifs by target program
      const inisiatifsByTargetProgram = new Map<string, Array<{ inisiatifId: string; sourceInisiatif: { id: string; nomor_inisiatif: string; nama_inisiatif: string } }>>();
      
      for (const [inisiatifId, targetProgramId] of selectedInisiatifs) {
        const sourceInisiatif = sourcePrograms
          .flatMap(p => p.inisiatifs || [])
          .find(i => i.id === inisiatifId);
        
        if (sourceInisiatif) {
          if (!inisiatifsByTargetProgram.has(targetProgramId)) {
            inisiatifsByTargetProgram.set(targetProgramId, []);
          }
          inisiatifsByTargetProgram.get(targetProgramId)!.push({ inisiatifId, sourceInisiatif });
        }
      }

      // Copy selected inisiatifs preserving their original nomor_inisiatif
      for (const [targetProgramId, inisiatifs] of inisiatifsByTargetProgram) {
        const targetProgram = existingPrograms.find(p => p.id === targetProgramId);
        if (!targetProgram) continue;

        // Sort inisiatifs by their original number
        const sortedInisiatifs = [...inisiatifs].sort((a, b) =>
          a.sourceInisiatif.nomor_inisiatif.localeCompare(b.sourceInisiatif.nomor_inisiatif, undefined, { numeric: true })
        );

        for (const { inisiatifId, sourceInisiatif } of sortedInisiatifs) {
          setProgress({
            current: completedItems + 1,
            total: totalItems,
            message: `Menyalin inisiatif ${sourceInisiatif.nomor_inisiatif}...`,
          });

          try {
            // Use the original nomor_inisiatif from source
            await copyInisiatif(inisiatifId, targetProgramId, sourceInisiatif.nomor_inisiatif);
          } catch (err) {
            errorCount++;
            errors.push(`Inisiatif ${sourceInisiatif.nomor_inisiatif}: ${err instanceof Error ? err.message : 'Gagal'}`);
          }
          completedItems++;
        }
      }

      if (errorCount === 0) {
        setSuccessMessage(`Berhasil menyalin ${totalItems} item`);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      } else if (errorCount < totalItems) {
        setSuccessMessage(`Berhasil menyalin ${totalItems - errorCount} item`);
        setError(`${errorCount} item gagal: ${errors.join('; ')}`);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(`Semua item gagal disalin: ${errors.join('; ')}`);
      }
    } finally {
      setSubmitting(false);
      setProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSelectedPrograms(new Set());
      setSelectedInisiatifs(new Map());
      setExpandedPrograms(new Set());
      setError('');
      setSuccessMessage('');
      onClose();
    }
  };

  const getSelectionCount = () => {
    return selectedPrograms.size + selectedInisiatifs.size;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '80vh',
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
            Salin dari Tahun {fromTahun}
          </Typography>
          <Typography variant="body2" sx={{ color: '#86868b', mt: 0.5 }}>
            Pilih program dan inisiatif untuk disalin ke tahun {toTahun}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={submitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, bgcolor: 'white', px: 3 }}>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {submitting && progress.total > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">
                {progress.message} ({progress.current}/{progress.total})
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Quick actions */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={selectAllNewPrograms}
            disabled={submitting}
            sx={{ fontSize: '0.75rem' }}
          >
            Pilih Semua Program Baru
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={clearSelection}
            disabled={submitting}
            sx={{ fontSize: '0.75rem', color: '#86868b', borderColor: '#e5e5e7' }}
          >
            Reset Pilihan
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#DA251C' }} />
          </Box>
        ) : sourcePrograms.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#86868b', textAlign: 'center', py: 4 }}>
            Tidak ada program di tahun {fromTahun}
          </Typography>
        ) : (
          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {sourcePrograms.map((program) => {
              const matchingProgram = findMatchingProgram(program.nomor_program);
              const programExists = !!matchingProgram;
              const isProgramSelected = selectedPrograms.has(program.id);
              const isExpanded = expandedPrograms.has(program.id);
              const inisiatifs = program.inisiatifs || [];

              return (
                <Box key={program.id} sx={{ mb: 1 }}>
                  {/* Program row */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1.5,
                      bgcolor: isProgramSelected ? 'rgba(218, 37, 28, 0.08)' : '#f8f9fa',
                      borderRadius: '8px',
                      border: isProgramSelected ? '1px solid #DA251C' : '1px solid transparent',
                    }}
                  >
                    <IconButton 
                      size="small" 
                      onClick={() => toggleExpand(program.id)}
                      sx={{ mr: 1 }}
                    >
                      {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                    </IconButton>
                    
                    <FolderRounded sx={{ color: '#DA251C', mr: 1.5, fontSize: 20 }} />
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                        {program.nomor_program} - {program.nama_program}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b' }}>
                        {inisiatifs.length} inisiatif
                      </Typography>
                    </Box>

                    {programExists ? (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#86868b', 
                          bgcolor: '#f5f5f7', 
                          px: 1.5, 
                          py: 0.5, 
                          borderRadius: '4px',
                          mr: 1,
                        }}
                      >
                        Sudah ada di {toTahun}
                      </Typography>
                    ) : (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isProgramSelected}
                            onChange={() => toggleProgram(program.id)}
                            disabled={submitting}
                            sx={{
                              color: '#DA251C',
                              '&.Mui-checked': { color: '#DA251C' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ color: '#1d1d1f' }}>
                            Salin Program
                          </Typography>
                        }
                        sx={{ mr: 0 }}
                      />
                    )}
                  </Box>

                  {/* Inisiatifs */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ pl: 6, py: 1 }}>
                      {inisiatifs.length === 0 ? (
                        <Typography variant="caption" sx={{ color: '#86868b', pl: 2 }}>
                          Tidak ada inisiatif
                        </Typography>
                      ) : (
                        inisiatifs.map((inisiatif) => {
                          const targetProgram = matchingProgram;
                          const canCopyInisiatif = targetProgram && !inisiatifExistsInTarget(inisiatif.nomor_inisiatif, targetProgram);
                          const isInisiatifSelected = selectedInisiatifs.has(inisiatif.id);
                          const inisiatifExistsInTargetProgram = targetProgram && inisiatifExistsInTarget(inisiatif.nomor_inisiatif, targetProgram);

                          return (
                            <Box 
                              key={inisiatif.id}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                p: 1,
                                pl: 2,
                                borderLeft: '2px solid #e5e5e7',
                                ml: 1,
                                mb: 0.5,
                                bgcolor: isInisiatifSelected ? 'rgba(218, 37, 28, 0.04)' : 'transparent',
                                borderRadius: '0 4px 4px 0',
                              }}
                            >
                              <AssignmentRounded sx={{ color: '#86868b', mr: 1.5, fontSize: 18 }} />
                              
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ color: '#1d1d1f', fontSize: '0.85rem' }}>
                                  {inisiatif.nomor_inisiatif} - {inisiatif.nama_inisiatif}
                                </Typography>
                              </Box>

                              {isProgramSelected ? (
                                <Typography 
                                  variant="caption" 
                                  sx={{ color: '#4caf50', fontSize: '0.7rem' }}
                                >
                                  Ikut disalin
                                </Typography>
                              ) : inisiatifExistsInTargetProgram ? (
                                <Typography 
                                  variant="caption" 
                                  sx={{ color: '#86868b', fontSize: '0.7rem' }}
                                >
                                  Sudah ada
                                </Typography>
                              ) : canCopyInisiatif ? (
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isInisiatifSelected}
                                      onChange={() => toggleInisiatif(inisiatif.id, targetProgram!.id)}
                                      disabled={submitting}
                                      size="small"
                                      sx={{
                                        color: '#DA251C',
                                        '&.Mui-checked': { color: '#DA251C' },
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography variant="caption" sx={{ color: '#1d1d1f', fontSize: '0.7rem' }}>
                                      Salin
                                    </Typography>
                                  }
                                  sx={{ mr: 0 }}
                                />
                              ) : !programExists ? (
                                <Typography 
                                  variant="caption" 
                                  sx={{ color: '#ff9800', fontSize: '0.7rem' }}
                                >
                                  Salin program dulu
                                </Typography>
                              ) : null}
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e5e5e7', bgcolor: 'white' }}>
        <Typography variant="body2" sx={{ flex: 1, color: '#86868b' }}>
          {getSelectionCount()} item dipilih
        </Typography>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={submitting}
          sx={{
            borderColor: '#86868b',
            color: '#86868b',
            '&:hover': {
              borderColor: '#1d1d1f',
              bgcolor: 'transparent',
            },
          }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ContentCopyIcon />}
          onClick={handleSubmit}
          disabled={submitting || getSelectionCount() === 0}
          sx={{
            background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
            fontWeight: 500,
            '&:hover': {
              background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
            },
            '&.Mui-disabled': {
              background: '#e5e5e7',
            },
          }}
        >
          {submitting ? 'Menyalin...' : 'Salin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CopyFromYearModal;
