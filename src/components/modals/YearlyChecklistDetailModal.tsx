import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Tabs,
  Tab,
  Divider,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  TrendingDown as PostponedIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Timeline as TimelineIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import type { InisiatifProgress, PlanVersion } from '../YearlyChecklistProgress';
import YearlyChecklistProgress from '../YearlyChecklistProgress';

interface InisiatifWithProgress {
  id: string;
  nomorInisiatif: string;
  namaInisiatif: string;
  programNama: string;
  progress: InisiatifProgress;
}

interface YearlyChecklistDetailModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (updatedProgress: InisiatifProgress) => void;
  inisiatif: InisiatifWithProgress | null;
  periodStart: number;
  periodEnd: number;
}

function YearlyChecklistDetailModal({
  open,
  onClose,
  onSave,
  inisiatif,
  periodStart,
  periodEnd,
}: YearlyChecklistDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [localProgress, setLocalProgress] = useState<InisiatifProgress>({ planVersions: [], realizations: [] });
  const [hasChanges, setHasChanges] = useState(false);
  const [newPlanNote, setNewPlanNote] = useState('');

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = periodStart; year <= periodEnd; year++) {
    years.push(year);
  }

  useEffect(() => {
    if (inisiatif) {
      setLocalProgress(JSON.parse(JSON.stringify(inisiatif.progress)));
      setHasChanges(false);
      setEditMode(false);
      setActiveTab(0);
    }
  }, [inisiatif]);

  // Get current plan (latest version)
  const getCurrentPlan = (): number[] => {
    if (localProgress.planVersions.length === 0) return [];
    const sorted = [...localProgress.planVersions].sort((a, b) => b.tahunPelaporan - a.tahunPelaporan);
    return sorted[0].plannedYears;
  };

  // Toggle year in current plan (for editing)
  const toggleYearInPlan = (year: number) => {
    const currentPlan = getCurrentPlan();
    let newPlannedYears: number[];

    if (currentPlan.includes(year)) {
      newPlannedYears = currentPlan.filter(y => y !== year);
    } else {
      newPlannedYears = [...currentPlan, year].sort((a, b) => a - b);
    }

    // Create or update current year's plan version
    const existingVersionIndex = localProgress.planVersions.findIndex(v => v.tahunPelaporan === currentYear);
    const newVersions = [...localProgress.planVersions];

    if (existingVersionIndex >= 0) {
      newVersions[existingVersionIndex] = {
        ...newVersions[existingVersionIndex],
        plannedYears: newPlannedYears,
        updatedAt: new Date().toISOString(),
      };
    } else {
      newVersions.push({
        tahunPelaporan: currentYear,
        plannedYears: newPlannedYears,
        updatedAt: new Date().toISOString(),
      });
    }

    setLocalProgress(prev => ({
      ...prev,
      planVersions: newVersions,
    }));
    setHasChanges(true);
  };

  // Toggle realization for a year
  const toggleRealization = (year: number) => {
    const existingIndex = localProgress.realizations.findIndex(r => r.tahun === year);
    const newRealizations = [...localProgress.realizations];

    if (existingIndex >= 0) {
      newRealizations[existingIndex] = {
        ...newRealizations[existingIndex],
        realized: !newRealizations[existingIndex].realized,
      };
    } else {
      newRealizations.push({
        tahun: year,
        realized: true,
      });
    }

    setLocalProgress(prev => ({
      ...prev,
      realizations: newRealizations,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Add note to the current year's version if provided
    if (newPlanNote.trim()) {
      const currentVersionIndex = localProgress.planVersions.findIndex(v => v.tahunPelaporan === currentYear);
      if (currentVersionIndex >= 0) {
        localProgress.planVersions[currentVersionIndex].notes = newPlanNote.trim();
      }
    }
    onSave(localProgress);
    setEditMode(false);
    setHasChanges(false);
    setNewPlanNote('');
  };

  const handleClose = () => {
    setEditMode(false);
    setHasChanges(false);
    setNewPlanNote('');
    onClose();
  };

  const isYearPlanned = (year: number) => getCurrentPlan().includes(year);
  const isYearRealized = (year: number) => localProgress.realizations.some(r => r.tahun === year && r.realized);

  // Detect changes between plan versions
  const getChangesFromVersion = (version: PlanVersion, previousVersion: PlanVersion | null): { added: number[], removed: number[] } => {
    if (!previousVersion) {
      return { added: version.plannedYears, removed: [] };
    }
    const added = version.plannedYears.filter(y => !previousVersion.plannedYears.includes(y));
    const removed = previousVersion.plannedYears.filter(y => !version.plannedYears.includes(y));
    return { added, removed };
  };

  if (!inisiatif) return null;

  const currentPlan = getCurrentPlan();
  const sortedVersions = [...localProgress.planVersions].sort((a, b) => b.tahunPelaporan - a.tahunPelaporan);

  // Stats
  const stats = {
    planned: currentPlan.length,
    realized: localProgress.realizations.filter(r => r.realized).length,
    versions: localProgress.planVersions.length,
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        bgcolor: '#DA251C',
        color: 'white',
        pb: 2,
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Progress Tahunan Inisiatif
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {inisiatif.nomorInisiatif} - {inisiatif.namaInisiatif}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Program: {inisiatif.programNama}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          borderBottom: '1px solid #e5e5e7',
          '& .MuiTab-root': { fontWeight: 600 },
        }}
      >
        <Tab icon={<TimelineIcon />} iconPosition="start" label="Status Saat Ini" />
        <Tab icon={<CompareIcon />} iconPosition="start" label="Perbandingan" />
        <Tab icon={<HistoryIcon />} iconPosition="start" label={`Riwayat (${stats.versions})`} />
      </Tabs>

      <DialogContent sx={{ p: 0 }}>
        {/* Tab 0: Current Status */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Rencana:</strong> Tahun yang direncanakan ada PKSI.
                <strong style={{ marginLeft: 16 }}>Realisasi:</strong> PKSI sudah terealisasi pada tahun tersebut.
              </Typography>
            </Alert>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Paper sx={{
                flex: 1, p: 2, textAlign: 'center',
                bgcolor: '#E8F5E9', border: '1px solid #A5D6A7'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                  {stats.realized}
                </Typography>
                <Typography variant="body2" sx={{ color: '#388E3C' }}>Terealisasi</Typography>
              </Paper>
              <Paper sx={{
                flex: 1, p: 2, textAlign: 'center',
                bgcolor: '#FFF8E1', border: '1px solid #FFE082'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F57C00' }}>
                  {stats.planned}
                </Typography>
                <Typography variant="body2" sx={{ color: '#EF6C00' }}>Direncanakan</Typography>
              </Paper>
              <Paper sx={{
                flex: 1, p: 2, textAlign: 'center',
                bgcolor: '#E3F2FD', border: '1px solid #90CAF9'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565C0' }}>
                  {stats.versions}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1976D2' }}>Versi Rencana</Typography>
              </Paper>
            </Box>

            {/* Checklist Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f7' }}>
                    <TableCell sx={{ fontWeight: 600, width: '20%' }}>Tahun</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '25%', textAlign: 'center' }}>Rencana PKSI</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '25%', textAlign: 'center' }}>Realisasi</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '30%' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {years.map(year => {
                    const planned = isYearPlanned(year);
                    const realized = isYearRealized(year);
                    const isPast = year < currentYear;
                    const isCurrent = year === currentYear;

                    let status: 'realized' | 'missed' | 'planned' | 'none' = 'none';
                    if (realized) status = 'realized';
                    else if (planned && isPast) status = 'missed';
                    else if (planned) status = 'planned';

                    return (
                      <TableRow
                        key={year}
                        sx={{
                          bgcolor: isCurrent ? 'rgba(218, 37, 28, 0.04)' : 'transparent',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {year}
                            </Typography>
                            {isCurrent && (
                              <Chip
                                label="Sekarang"
                                size="small"
                                sx={{
                                  bgcolor: '#DA251C',
                                  color: 'white',
                                  fontSize: '0.65rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {editMode ? (
                            <Checkbox
                              checked={planned}
                              onChange={() => toggleYearInPlan(year)}
                              sx={{
                                color: '#FFC107',
                                '&.Mui-checked': { color: '#FFC107' },
                              }}
                            />
                          ) : (
                            planned ? (
                              <CheckCircleIcon sx={{ color: '#FFC107' }} />
                            ) : (
                              <Typography variant="body2" sx={{ color: '#ccc' }}>-</Typography>
                            )
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {editMode ? (
                            <Checkbox
                              checked={realized}
                              onChange={() => toggleRealization(year)}
                              sx={{
                                color: '#4CAF50',
                                '&.Mui-checked': { color: '#4CAF50' },
                              }}
                            />
                          ) : (
                            realized ? (
                              <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                            ) : (
                              <Typography variant="body2" sx={{ color: '#ccc' }}>-</Typography>
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          {status === 'realized' && (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                              label="Terealisasi"
                              size="small"
                              sx={{
                                bgcolor: '#E8F5E9',
                                color: '#2E7D32',
                                '& .MuiChip-icon': { color: '#4CAF50' },
                              }}
                            />
                          )}
                          {status === 'missed' && (
                            <Chip
                              icon={<CancelIcon sx={{ fontSize: 16 }} />}
                              label="Tidak Terealisasi"
                              size="small"
                              sx={{
                                bgcolor: '#FFEBEE',
                                color: '#C62828',
                                '& .MuiChip-icon': { color: '#EF5350' },
                              }}
                            />
                          )}
                          {status === 'planned' && (
                            <Chip
                              label="Direncanakan"
                              size="small"
                              sx={{
                                bgcolor: '#FFF8E1',
                                color: '#F57C00',
                              }}
                            />
                          )}
                          {status === 'none' && (
                            <Typography variant="body2" sx={{ color: '#9E9E9E' }}>
                              Tidak ada rencana
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Note field when editing */}
            {editMode && (
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Catatan perubahan (opsional)..."
                value={newPlanNote}
                onChange={(e) => setNewPlanNote(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        )}

        {/* Tab 1: Comparison - Side by Side */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Lihat perbandingan planning dari waktu ke waktu secara side-by-side.
                Setiap kolom menampilkan rencana yang dibuat pada tahun pelaporan tersebut.
              </Typography>
            </Alert>

            {localProgress.planVersions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CompareIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#999' }}>
                  Belum ada data planning untuk dibandingkan
                </Typography>
              </Box>
            ) : (
              <YearlyChecklistProgress
                progress={localProgress}
                periodStart={periodStart}
                periodEnd={periodEnd}
                viewMode="comparison"
              />
            )}
          </Box>
        )}

        {/* Tab 2: History */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Riwayat perubahan rencana PKSI dari waktu ke waktu. Setiap perubahan tercatat sebagai versi baru.
              </Typography>
            </Alert>

            {sortedVersions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#999' }}>
                  Belum ada riwayat perubahan
                </Typography>
              </Box>
            ) : (
              <Box>
                {sortedVersions.map((version, index) => {
                  const previousVersion = index < sortedVersions.length - 1 ? sortedVersions[index + 1] : null;
                  const changes = getChangesFromVersion(version, previousVersion);
                  const isLatest = index === 0;

                  return (
                    <Box key={version.tahunPelaporan} sx={{ mb: 3 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderColor: isLatest ? '#DA251C' : '#e5e5e7',
                          borderWidth: isLatest ? 2 : 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              Rencana Tahun {version.tahunPelaporan}
                            </Typography>
                            {isLatest && (
                              <Chip label="Terkini" size="small" sx={{ bgcolor: '#DA251C', color: 'white' }} />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: '#86868b' }}>
                            {new Date(version.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </Typography>
                        </Box>

                        {/* Planned years */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                            Rencana PKSI:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {version.plannedYears.length === 0 ? (
                              <Typography variant="body2" sx={{ color: '#999' }}>Tidak ada</Typography>
                            ) : (
                              version.plannedYears.map(year => (
                                <Chip key={year} label={year} size="small" sx={{ fontWeight: 600 }} />
                              ))
                            )}
                          </Box>
                        </Box>

                        {/* Changes from previous version */}
                        {previousVersion && (changes.added.length > 0 || changes.removed.length > 0) && (
                          <Box sx={{ bgcolor: '#f5f5f7', p: 1.5, borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', display: 'block', mb: 1 }}>
                              Perubahan dari {previousVersion.tahunPelaporan}:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              {changes.added.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AddIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                                  <Typography variant="caption" sx={{ color: '#2E7D32' }}>
                                    Ditambahkan: {changes.added.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                              {changes.removed.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <RemoveIcon sx={{ fontSize: 16, color: '#EF5350' }} />
                                  <Typography variant="caption" sx={{ color: '#C62828' }}>
                                    Dihapus/Ditunda: {changes.removed.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Notes */}
                        {version.notes && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#FFF8E1', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ color: '#F57C00' }}>
                              Catatan: {version.notes}
                            </Typography>
                          </Box>
                        )}
                      </Paper>

                      {index < sortedVersions.length - 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                          <PostponedIcon sx={{ color: '#ccc', transform: 'rotate(180deg)' }} />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        {activeTab === 0 && (
          <>
            {editMode ? (
              <>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setLocalProgress(JSON.parse(JSON.stringify(inisiatif.progress)));
                    setHasChanges(false);
                    setNewPlanNote('');
                  }}
                  sx={{ color: '#86868b' }}
                >
                  Batal
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={!hasChanges}
                  sx={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)',
                    },
                  }}
                >
                  Simpan Perubahan
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleClose} sx={{ color: '#86868b' }}>
                  Tutup
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
                    },
                  }}
                >
                  Update Rencana {currentYear}
                </Button>
              </>
            )}
          </>
        )}
        {activeTab === 1 && (
          <Button onClick={handleClose} sx={{ color: '#86868b' }}>
            Tutup
          </Button>
        )}
        {activeTab === 2 && (
          <Button onClick={handleClose} sx={{ color: '#86868b' }}>
            Tutup
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default YearlyChecklistDetailModal;
