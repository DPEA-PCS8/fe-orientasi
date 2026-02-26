import {
  Box,
  Typography,
  Tooltip,
  Chip,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Cancel as CancelIcon,
  TrendingDown as PostponedIcon,
  TrendingUp as AddedIcon,
  Remove as RemovedIcon,
} from '@mui/icons-material';

// Versi planning yang dibuat/diupdate pada tahun tertentu
export interface PlanVersion {
  tahunPelaporan: number;  // Tahun saat planning ini dibuat/diupdate
  plannedYears: number[];  // Tahun-tahun yang direncanakan ada PKSI
  notes?: string;          // Catatan perubahan
  updatedAt: string;
}

// Realisasi PKSI per tahun
export interface YearRealization {
  tahun: number;
  realized: boolean;
  pksiId?: string;  // Link ke PKSI jika ada
}

// Data lengkap progress inisiatif
export interface InisiatifProgress {
  planVersions: PlanVersion[];     // History semua versi planning
  realizations: YearRealization[]; // Realisasi aktual
}

// Legacy interface for backward compatibility
export interface YearlyChecklist {
  tahun: number;
  planned: boolean;
  realized: boolean;
}

type ViewMode = 'default' | 'compact' | 'comparison';

interface YearlyChecklistProgressProps {
  progress: InisiatifProgress;
  periodStart: number;
  periodEnd: number;
  onClick?: () => void;
  compact?: boolean;
  showChanges?: boolean;  // Show indicators for postponed/added years
  viewMode?: ViewMode;    // View mode: default, compact, or comparison table
}

function YearlyChecklistProgress({
  progress,
  periodStart,
  periodEnd,
  onClick,
  compact = false,
  showChanges = true,
  viewMode,
}: YearlyChecklistProgressProps) {
  // Determine effective view mode
  const effectiveViewMode: ViewMode = viewMode ?? (compact ? 'compact' : 'default');
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = periodStart; year <= periodEnd; year++) {
    years.push(year);
  }

  // Get current/latest plan
  const getCurrentPlan = (): number[] => {
    if (progress.planVersions.length === 0) return [];
    const sorted = [...progress.planVersions].sort((a, b) => b.tahunPelaporan - a.tahunPelaporan);
    return sorted[0].plannedYears;
  };

  // Get plan for a specific reporting year
  const getPlanForYear = (tahunPelaporan: number): number[] | undefined => {
    const version = progress.planVersions.find(v => v.tahunPelaporan === tahunPelaporan);
    return version?.plannedYears;
  };

  // Get previous year's plan to detect changes
  const getPreviousPlan = (tahunPelaporan: number): number[] => {
    const previousVersions = progress.planVersions
      .filter(v => v.tahunPelaporan < tahunPelaporan)
      .sort((a, b) => b.tahunPelaporan - a.tahunPelaporan);
    return previousVersions.length > 0 ? previousVersions[0].plannedYears : [];
  };

  // Check if year was postponed (was in previous plan but moved to later year)
  const wasPostponed = (year: number): boolean => {
    const versions = [...progress.planVersions].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan);
    for (let i = 1; i < versions.length; i++) {
      const prevPlan = versions[i - 1].plannedYears;
      const currPlan = versions[i].plannedYears;
      // Year was removed from plan (postponed to later)
      if (prevPlan.includes(year) && !currPlan.includes(year)) {
        return true;
      }
    }
    return false;
  };

  // Check if year was added later (not in original plan)
  const wasAddedLater = (year: number): boolean => {
    if (progress.planVersions.length <= 1) return false;
    const sorted = [...progress.planVersions].sort((a, b) => a.tahunPelaporan - b.tahunPelaporan);
    const originalPlan = sorted[0].plannedYears;
    const currentPlan = getCurrentPlan();
    return !originalPlan.includes(year) && currentPlan.includes(year);
  };

  const currentPlan = getCurrentPlan();
  const isPlanned = (year: number) => currentPlan.includes(year);
  const isRealized = (year: number) => progress.realizations.some(r => r.tahun === year && r.realized);

  type YearStatus = 'realized' | 'planned' | 'missed' | 'postponed' | 'none';

  const getYearStatus = (year: number): YearStatus => {
    const realized = isRealized(year);
    const planned = isPlanned(year);
    const postponed = wasPostponed(year);

    if (realized) return 'realized';
    if (postponed && !planned) return 'postponed';  // Was planned but removed/postponed
    if (planned && year < currentYear) return 'missed';  // Planned but not realized in past
    if (planned) return 'planned';  // Planned for future
    return 'none';
  };

  const getStatusColor = (status: YearStatus) => {
    switch (status) {
      case 'realized': return { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' };
      case 'planned': return { bg: '#FFF8E1', border: '#FFC107', text: '#F57C00' };
      case 'missed': return { bg: '#FFEBEE', border: '#EF5350', text: '#C62828' };
      case 'postponed': return { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' };
      default: return { bg: '#F5F5F5', border: '#E0E0E0', text: '#9E9E9E' };
    }
  };

  const getProgressStats = () => {
    const plannedCount = currentPlan.length;
    const realizedCount = progress.realizations.filter(r => r.realized).length;
    const postponedCount = years.filter(y => wasPostponed(y) && !isPlanned(y)).length;
    return { planned: plannedCount, realized: realizedCount, postponed: postponedCount };
  };

  const stats = getProgressStats();

  // Get sorted plan versions for comparison view
  const sortedPlanVersions = [...progress.planVersions].sort(
    (a, b) => a.tahunPelaporan - b.tahunPelaporan
  );

  // Render comparison table view - Side by side columns per tahun pelaporan
  if (effectiveViewMode === 'comparison') {
    // Check if year changed from previous version
    const getYearChangeStatus = (
      tahunPelaporan: number,
      targetYear: number
    ): 'same' | 'added' | 'removed' => {
      const currentVersionPlan = getPlanForYear(tahunPelaporan);
      const previousPlan = getPreviousPlan(tahunPelaporan);

      if (!currentVersionPlan) return 'same';

      const isInCurrentPlan = currentVersionPlan.includes(targetYear);
      const wasInPreviousPlan = previousPlan.includes(targetYear);

      if (previousPlan.length === 0) return 'same'; // First version, no comparison
      if (isInCurrentPlan && !wasInPreviousPlan) return 'added';
      if (!isInCurrentPlan && wasInPreviousPlan) return 'removed';
      return 'same';
    };

    return (
      <Box
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? { bgcolor: 'rgba(0,0,0,0.02)' } : {},
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
            Perbandingan Planning per Tahun Pelaporan
          </Typography>
          <Chip
            label={`${sortedPlanVersions.length} Versi`}
            size="small"
            sx={{
              bgcolor: '#E3F2FD',
              color: '#1565C0',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        </Box>

        {/* Side by side columns */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
          }}
        >
          {sortedPlanVersions.map((version, idx) => {
            const isLatest = idx === sortedPlanVersions.length - 1;
            const versionPlan = version.plannedYears || [];

            return (
              <Paper
                key={version.tahunPelaporan}
                variant="outlined"
                sx={{
                  minWidth: 140,
                  flex: '0 0 auto',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: isLatest ? '2px solid #2196F3' : '1px solid #E0E0E0',
                }}
              >
                {/* Column Header - Tahun Pelaporan */}
                <Box
                  sx={{
                    bgcolor: isLatest ? '#2196F3' : '#F5F5F5',
                    p: 1.5,
                    textAlign: 'center',
                    borderBottom: '1px solid #E0E0E0',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: isLatest ? '#fff' : '#333',
                      fontSize: '0.9rem',
                    }}
                  >
                    {version.tahunPelaporan}
                  </Typography>
                  {isLatest && (
                    <Chip
                      label="Terbaru"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        mt: 0.5,
                      }}
                    />
                  )}
                  {version.notes && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: isLatest ? 'rgba(255,255,255,0.8)' : '#666',
                        fontSize: '0.65rem',
                        mt: 0.5,
                      }}
                    >
                      {version.notes}
                    </Typography>
                  )}
                </Box>

                {/* Checklist - Tahun Periode */}
                <Box sx={{ p: 1 }}>
                  {years.map(year => {
                    const isPlannedInVersion = versionPlan.includes(year);
                    const realized = isRealized(year);
                    const changeStatus = getYearChangeStatus(version.tahunPelaporan, year);

                    // Determine background and icon
                    let bgColor = '#F5F5F5';
                    let borderColor = '#E0E0E0';
                    let textColor = '#9E9E9E';

                    if (realized && isPlannedInVersion) {
                      bgColor = '#E8F5E9';
                      borderColor = '#4CAF50';
                      textColor = '#2E7D32';
                    } else if (isPlannedInVersion) {
                      if (changeStatus === 'added') {
                        bgColor = '#E3F2FD';
                        borderColor = '#2196F3';
                        textColor = '#1565C0';
                      } else {
                        bgColor = '#FFF8E1';
                        borderColor = '#FFC107';
                        textColor = '#F57C00';
                      }
                    } else if (changeStatus === 'removed') {
                      bgColor = '#FFEBEE';
                      borderColor = '#EF5350';
                      textColor = '#C62828';
                    }

                    return (
                      <Box
                        key={year}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 0.75,
                          mb: 0.5,
                          borderRadius: 1,
                          bgcolor: bgColor,
                          border: `1px solid ${borderColor}`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Icon */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {realized && isPlannedInVersion ? (
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                          ) : isPlannedInVersion ? (
                            changeStatus === 'added' ? (
                              <AddedIcon sx={{ fontSize: 18, color: '#2196F3' }} />
                            ) : (
                              <UncheckedIcon sx={{ fontSize: 18, color: '#FFC107' }} />
                            )
                          ) : changeStatus === 'removed' ? (
                            <CancelIcon sx={{ fontSize: 18, color: '#EF5350' }} />
                          ) : (
                            <RemovedIcon sx={{ fontSize: 18, color: '#E0E0E0' }} />
                          )}
                        </Box>

                        {/* Year Label */}
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: isPlannedInVersion ? 600 : 400,
                            color: textColor,
                            textDecoration: changeStatus === 'removed' ? 'line-through' : 'none',
                            flex: 1,
                          }}
                        >
                          {year}
                        </Typography>

                        {/* Change indicator */}
                        {changeStatus === 'added' && (
                          <Chip
                            label="Baru"
                            size="small"
                            sx={{
                              height: 14,
                              fontSize: '0.55rem',
                              bgcolor: '#2196F3',
                              color: '#fff',
                            }}
                          />
                        )}
                        {changeStatus === 'removed' && (
                          <Chip
                            label="Hapus"
                            size="small"
                            sx={{
                              height: 14,
                              fontSize: '0.55rem',
                              bgcolor: '#EF5350',
                              color: '#fff',
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>

                {/* Summary footer */}
                <Box
                  sx={{
                    bgcolor: '#F9F9F9',
                    p: 1,
                    borderTop: '1px solid #E0E0E0',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: '#666', fontWeight: 500, fontSize: '0.7rem' }}
                  >
                    {versionPlan.length} tahun direncanakan
                  </Typography>
                </Box>
              </Paper>
            );
          })}

          {/* Realization Column */}
          <Paper
            variant="outlined"
            sx={{
              minWidth: 140,
              flex: '0 0 auto',
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid #4CAF50',
            }}
          >
            <Box
              sx={{
                bgcolor: '#4CAF50',
                p: 1.5,
                textAlign: 'center',
                borderBottom: '1px solid #E0E0E0',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              >
                Realisasi
              </Typography>
              <Chip
                label="Aktual"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  mt: 0.5,
                }}
              />
            </Box>

            <Box sx={{ p: 1 }}>
              {years.map(year => {
                const realized = isRealized(year);
                const plannedInLatest = currentPlan.includes(year);

                let bgColor = '#F5F5F5';
                let borderColor = '#E0E0E0';
                let textColor = '#9E9E9E';

                if (realized) {
                  bgColor = '#E8F5E9';
                  borderColor = '#4CAF50';
                  textColor = '#2E7D32';
                } else if (plannedInLatest && year < currentYear) {
                  // Missed
                  bgColor = '#FFEBEE';
                  borderColor = '#EF5350';
                  textColor = '#C62828';
                }

                return (
                  <Box
                    key={year}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 0.75,
                      mb: 0.5,
                      borderRadius: 1,
                      bgcolor: bgColor,
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    {realized ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                    ) : plannedInLatest && year < currentYear ? (
                      <CancelIcon sx={{ fontSize: 18, color: '#EF5350' }} />
                    ) : (
                      <RemovedIcon sx={{ fontSize: 18, color: '#E0E0E0' }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: realized ? 600 : 400,
                        color: textColor,
                        flex: 1,
                      }}
                    >
                      {year}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                bgcolor: '#E8F5E9',
                p: 1,
                borderTop: '1px solid #C8E6C9',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: '#2E7D32', fontWeight: 600, fontSize: '0.7rem' }}
              >
                {progress.realizations.filter(r => r.realized).length} terealisasi
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <UncheckedIcon sx={{ fontSize: 14, color: '#FFC107' }} />
            <Typography variant="caption" sx={{ color: '#666' }}>
              Direncanakan
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AddedIcon sx={{ fontSize: 14, color: '#2196F3' }} />
            <Typography variant="caption" sx={{ color: '#666' }}>
              Ditambahkan
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CancelIcon sx={{ fontSize: 14, color: '#EF5350' }} />
            <Typography variant="caption" sx={{ color: '#666' }}>
              Dihapus
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
            <Typography variant="caption" sx={{ color: '#666' }}>
              Terealisasi
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Render compact view
  if (effectiveViewMode === 'compact') {
    return (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? { opacity: 0.8 } : {},
        }}
      >
        {years.map(year => {
          const status = getYearStatus(year);
          const colors = getStatusColor(status);
          const addedLater = showChanges && wasAddedLater(year);

          return (
            <Tooltip
              key={year}
              title={
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{year}</Typography>
                  <Typography variant="caption" display="block">
                    {status === 'realized' ? 'Terealisasi' :
                     status === 'planned' ? 'Direncanakan' :
                     status === 'missed' ? 'Tidak Terealisasi' :
                     status === 'postponed' ? 'Ditunda/Diubah' :
                     'Tidak Ada'}
                  </Typography>
                  {addedLater && (
                    <Typography variant="caption" display="block" sx={{ color: '#4CAF50' }}>
                      (Ditambahkan kemudian)
                    </Typography>
                  )}
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  position: 'relative',
                }}
              >
                {status === 'realized' ? (
                  <CheckCircleIcon sx={{ fontSize: 12, color: colors.border }} />
                ) : status === 'planned' ? (
                  <UncheckedIcon sx={{ fontSize: 12, color: colors.border }} />
                ) : status === 'missed' ? (
                  <CancelIcon sx={{ fontSize: 12, color: colors.border }} />
                ) : status === 'postponed' ? (
                  <PostponedIcon sx={{ fontSize: 12, color: colors.border }} />
                ) : (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#E0E0E0' }} />
                )}
                {addedLater && (
                  <Box sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#4CAF50',
                  }} />
                )}
              </Box>
            </Tooltip>
          );
        })}
        <Box sx={{ ml: 1, display: 'flex', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#4CAF50', fontSize: '0.7rem', fontWeight: 600 }}>
            {stats.realized}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>/</Typography>
          <Typography variant="caption" sx={{ color: '#F57C00', fontSize: '0.7rem', fontWeight: 600 }}>
            {stats.planned}
          </Typography>
        </Box>
        {stats.postponed > 0 && (
          <Chip
            label={`${stats.postponed} diubah`}
            size="small"
            sx={{
              height: 16,
              fontSize: '0.6rem',
              bgcolor: '#FFF3E0',
              color: '#E65100',
              ml: 0.5,
            }}
          />
        )}
      </Box>
    );
  }

  // Render default view
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: 'rgba(0,0,0,0.02)' } : {},
        borderRadius: 2,
      }}
    >
      {/* Progress Summary */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
              Progress Tahunan
            </Typography>
            <Chip
              label={`${stats.realized}/${stats.planned} Terealisasi`}
              size="small"
              sx={{
                bgcolor: stats.realized === stats.planned && stats.planned > 0 ? '#E8F5E9' : '#FFF8E1',
                color: stats.realized === stats.planned && stats.planned > 0 ? '#2E7D32' : '#F57C00',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
            {stats.postponed > 0 && (
              <Chip
                icon={<PostponedIcon sx={{ fontSize: 14 }} />}
                label={`${stats.postponed} Perubahan`}
                size="small"
                sx={{
                  bgcolor: '#FFF3E0',
                  color: '#E65100',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  '& .MuiChip-icon': { color: '#FF9800' },
                }}
              />
            )}
          </Box>
          <Box sx={{
            height: 6,
            bgcolor: '#E0E0E0',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <Box sx={{
              height: '100%',
              width: `${stats.planned > 0 ? (stats.realized / stats.planned) * 100 : 0}%`,
              bgcolor: '#4CAF50',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }} />
          </Box>
        </Box>
      </Box>

      {/* Year Grid */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {years.map(year => {
          const status = getYearStatus(year);
          const colors = getStatusColor(status);
          const addedLater = showChanges && wasAddedLater(year);

          return (
            <Box key={year} sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="caption" sx={{
                fontWeight: 600,
                color: year === currentYear ? '#DA251C' : '#86868b',
                display: 'block',
                mb: 0.5,
              }}>
                {year}
                {year === currentYear && ' •'}
              </Typography>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: colors.bg,
                  border: `2px solid ${colors.border}`,
                  minHeight: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  position: 'relative',
                }}
              >
                {addedLater && (
                  <AddedIcon sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    fontSize: 14,
                    color: '#4CAF50',
                  }} />
                )}
                {status === 'realized' ? (
                  <>
                    <CheckCircleIcon sx={{ fontSize: 24, color: colors.border }} />
                    <Typography variant="caption" sx={{ color: colors.text, fontWeight: 500, fontSize: '0.65rem' }}>
                      Terealisasi
                    </Typography>
                  </>
                ) : status === 'planned' ? (
                  <>
                    <UncheckedIcon sx={{ fontSize: 24, color: colors.border }} />
                    <Typography variant="caption" sx={{ color: colors.text, fontWeight: 500, fontSize: '0.65rem' }}>
                      Rencana
                    </Typography>
                  </>
                ) : status === 'missed' ? (
                  <>
                    <CancelIcon sx={{ fontSize: 24, color: colors.border }} />
                    <Typography variant="caption" sx={{ color: colors.text, fontWeight: 500, fontSize: '0.65rem' }}>
                      Tidak Tercapai
                    </Typography>
                  </>
                ) : status === 'postponed' ? (
                  <>
                    <PostponedIcon sx={{ fontSize: 24, color: colors.border }} />
                    <Typography variant="caption" sx={{ color: colors.text, fontWeight: 500, fontSize: '0.65rem' }}>
                      Ditunda
                    </Typography>
                  </>
                ) : (
                  <>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#E0E0E0' }} />
                    <Typography variant="caption" sx={{ color: colors.text, fontWeight: 500, fontSize: '0.65rem' }}>
                      Tidak Ada
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
          <Typography variant="caption" sx={{ color: '#666' }}>Terealisasi</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <UncheckedIcon sx={{ fontSize: 14, color: '#FFC107' }} />
          <Typography variant="caption" sx={{ color: '#666' }}>Direncanakan</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CancelIcon sx={{ fontSize: 14, color: '#EF5350' }} />
          <Typography variant="caption" sx={{ color: '#666' }}>Tidak Tercapai</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PostponedIcon sx={{ fontSize: 14, color: '#FF9800' }} />
          <Typography variant="caption" sx={{ color: '#666' }}>Ditunda/Diubah</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default YearlyChecklistProgress;
