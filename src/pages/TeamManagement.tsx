import { useState, useEffect, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  AvatarGroup,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as CrownIcon,
  People as PeopleIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  GridView as GridViewIcon,
} from '@mui/icons-material';
import {
  getAllTeams,
  getAvailableUsers,
  createTeam,
  updateTeam,
  deleteTeam,
  type Team,
  type TeamMember,
  type CreateTeamRequest,
} from '../api/teamApi';

// ==================== HELPER FUNCTIONS ====================

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    '#DA251C', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// ==================== FORM MODAL COMPONENT ====================

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  isEdit?: boolean;
  formData: {
    name: string;
    description: string;
    pic: TeamMember | null;
    members: TeamMember[];
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    pic: TeamMember | null;
    members: TeamMember[];
  }>>;
  users: TeamMember[];
  submitting: boolean;
}

const FormModal = memo(({ 
  open, 
  onClose, 
  onSubmit, 
  title, 
  isEdit = false,
  formData,
  setFormData,
  users,
  submitting,
}: FormModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          overflow: 'hidden',
          maxHeight: '85vh',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2.5,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,250,252,1) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(218, 37, 28, 0.25)',
            }}
          >
            <GroupIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: '#1d1d1f',
              fontSize: '1.1rem',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            color: '#86868b',
            bgcolor: 'rgba(0, 0, 0, 0.04)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.08)',
              color: '#1d1d1f',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent 
        sx={{ 
          px: 3, 
          py: 3,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '3px',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Team Name */}
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#86868b', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1,
                display: 'block',
              }}
            >
              Nama Tim *
            </Typography>
            <TextField
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Tim Development"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.03)',
                    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                    boxShadow: '0 0 0 3px rgba(218, 37, 28, 0.1)',
                    '& fieldset': { borderColor: '#DA251C', borderWidth: '1.5px' },
                  },
                },
              }}
            />
          </Box>

          {/* Description */}
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#86868b', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1,
                display: 'block',
              }}
            >
              Deskripsi
            </Typography>
            <TextField
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              placeholder="Deskripsi singkat tentang tim ini..."
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                  },
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.03)',
                    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                    boxShadow: '0 0 0 3px rgba(218, 37, 28, 0.1)',
                    '& fieldset': { borderColor: '#DA251C', borderWidth: '1.5px' },
                  },
                },
              }}
            />
          </Box>

          {/* PIC Selection */}
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#86868b', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1,
                display: 'block',
              }}
            >
              PIC (Person In Charge)
            </Typography>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option?.fullName || ''}
              value={formData.pic}
              onChange={(_, newValue) => setFormData({ ...formData, pic: newValue })}
              isOptionEqualToValue={(option, value) => option?.uuid === value?.uuid}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Pilih PIC tim"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.2s ease',
                      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)' },
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.03)',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
                      },
                      '&.Mui-focused': {
                        bgcolor: 'white',
                        boxShadow: '0 0 0 3px rgba(218, 37, 28, 0.1)',
                        '& fieldset': { borderColor: '#DA251C', borderWidth: '1.5px' },
                      },
                    },
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box 
                    component="li" 
                    key={key}
                    {...otherProps} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      py: 1,
                      px: 1.5,
                      borderRadius: '8px',
                      mx: 0.5,
                      my: 0.25,
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      '&.Mui-focused': { bgcolor: 'rgba(218, 37, 28, 0.06)' },
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: getAvatarColor(option.fullName),
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(option.fullName)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                        {option.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b' }}>
                        {option.department} • {option.email}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    mt: 1,
                  },
                },
              }}
            />
            {formData.pic && (
              <Box 
                sx={{ 
                  mt: 1.5, 
                  p: 1.5, 
                  borderRadius: '12px',
                  bgcolor: 'rgba(218, 37, 28, 0.04)',
                  border: '1px solid rgba(218, 37, 28, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: getAvatarColor(formData.pic.fullName),
                    fontWeight: 600,
                  }}
                >
                  {getInitials(formData.pic.fullName)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#DA251C' }}>
                    {formData.pic.fullName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#86868b' }}>
                    {formData.pic.department}
                  </Typography>
                </Box>
                <CrownIcon sx={{ color: '#FFB74D', fontSize: 24 }} />
              </Box>
            )}
          </Box>

          {/* Members Selection */}
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#86868b', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1,
                display: 'block',
              }}
            >
              Anggota Tim ({formData.members.length} dipilih)
            </Typography>
            <Autocomplete
              multiple
              options={users.filter(u => u.uuid !== formData.pic?.uuid)}
              getOptionLabel={(option) => option?.fullName || ''}
              value={formData.members}
              onChange={(_, newValue) => setFormData({ ...formData, members: newValue })}
              isOptionEqualToValue={(option, value) => option?.uuid === value?.uuid}
              filterSelectedOptions
              disableCloseOnSelect
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={formData.members.length === 0 ? "Pilih anggota tim..." : ""}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.2s ease',
                      minHeight: '44px',
                      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.08)' },
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.03)',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.15)' },
                      },
                      '&.Mui-focused': {
                        bgcolor: 'white',
                        boxShadow: '0 0 0 3px rgba(218, 37, 28, 0.1)',
                        '& fieldset': { borderColor: '#DA251C', borderWidth: '1.5px' },
                      },
                    },
                  }}
                />
              )}
              renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props;
                return (
                  <Box 
                    component="li" 
                    key={key}
                    {...otherProps} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      py: 1,
                      px: 1.5,
                      borderRadius: '8px',
                      mx: 0.5,
                      my: 0.25,
                      bgcolor: selected ? 'rgba(218, 37, 28, 0.06)' : 'transparent',
                      '&:hover': { bgcolor: selected ? 'rgba(218, 37, 28, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: getAvatarColor(option.fullName),
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(option.fullName)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
                        {option.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b' }}>
                        {option.department}
                      </Typography>
                    </Box>
                    {selected && (
                      <CheckCircleIcon sx={{ color: '#DA251C', fontSize: 20 }} />
                    )}
                  </Box>
                );
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      {...tagProps}
                      avatar={
                        <Avatar 
                          sx={{ 
                            bgcolor: getAvatarColor(option.fullName) + ' !important', 
                            width: 24, 
                            height: 24,
                            fontSize: '0.65rem !important',
                            fontWeight: 600,
                          }}
                        >
                          {getInitials(option.fullName)}
                        </Avatar>
                      }
                      label={option.fullName}
                      size="small"
                      sx={{
                        borderRadius: '8px',
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        border: 'none',
                        '& .MuiChip-label': { fontWeight: 500, fontSize: '0.8rem' },
                        '& .MuiChip-deleteIcon': {
                          color: '#86868b',
                          '&:hover': { color: '#DA251C' },
                        },
                      }}
                    />
                  );
                })
              }
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    mt: 1,
                    maxHeight: '240px',
                  },
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          px: 3,
          py: 2.5,
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          bgcolor: 'rgba(250, 250, 252, 0.8)',
        }}
      >
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            color: '#86868b', 
            borderColor: 'rgba(0, 0, 0, 0.12)',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 3,
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.24)',
              bgcolor: 'rgba(0, 0, 0, 0.02)',
            },
          }}
        >
          Batal
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={submitting || !formData.name.trim()}
          sx={{
            background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 3,
            boxShadow: '0 4px 14px rgba(218, 37, 28, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #B91C14 0%, #D83A32 100%)',
              boxShadow: '0 6px 20px rgba(218, 37, 28, 0.4)',
            },
            '&.Mui-disabled': {
              background: '#e5e5e7',
              boxShadow: 'none',
            },
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : isEdit ? (
            'Simpan Perubahan'
          ) : (
            'Buat Tim'
          )}
        </Button>
      </Box>
    </Dialog>
  );
});

FormModal.displayName = 'FormModal';

// ==================== COMPONENT ====================

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<'teams' | 'users'>('teams');
  
  // Sort and filter states for users
  const [sortField, setSortField] = useState<'fullName' | 'department' | 'teamCount'>('fullName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterTeamAssignment, setFilterTeamAssignment] = useState<'all' | 'assigned' | 'unassigned' | 'pic'>('all');
  
  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pic: null as TeamMember | null,
    members: [] as TeamMember[],
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsData, usersData] = await Promise.all([
        getAllTeams(),
        getAvailableUsers(),
      ]);
      setTeams(teamsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered teams based on search
  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const term = searchTerm.toLowerCase();
    return teams.filter(
      team =>
        team.name.toLowerCase().includes(term) ||
        team.description.toLowerCase().includes(term) ||
        team.pic?.fullName.toLowerCase().includes(term) ||
        team.members.some(m => m.fullName.toLowerCase().includes(term))
    );
  }, [teams, searchTerm]);

  // Users with their team assignments
  const usersWithTeams = useMemo(() => {
    return users.map(user => {
      const assignedTeams = teams
        .filter(team => 
          team.pic?.uuid === user.uuid || 
          team.members.some(m => m.uuid === user.uuid)
        )
        .map(team => ({
          ...team,
          isPIC: team.pic?.uuid === user.uuid,
        }));
      const isPic = teams.some(team => team.pic?.uuid === user.uuid);
      return {
        ...user,
        assignedTeams,
        isPic,
        teamCount: assignedTeams.length,
      };
    });
  }, [users, teams]);

  // Filtered users based on search
  const filteredUsers = useMemo(() => {
    let result = usersWithTeams;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        user =>
          user.fullName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.department.toLowerCase().includes(term) ||
          user.assignedTeams.some(t => t.name.toLowerCase().includes(term))
      );
    }
    
    // Apply team assignment filter
    if (filterTeamAssignment === 'assigned') {
      result = result.filter(user => user.teamCount > 0);
    } else if (filterTeamAssignment === 'unassigned') {
      result = result.filter(user => user.teamCount === 0);
    } else if (filterTeamAssignment === 'pic') {
      result = result.filter(user => user.isPic);
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'fullName') {
        comparison = a.fullName.localeCompare(b.fullName);
      } else if (sortField === 'department') {
        comparison = a.department.localeCompare(b.department);
      } else if (sortField === 'teamCount') {
        comparison = a.teamCount - b.teamCount;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [usersWithTeams, searchTerm, filterTeamAssignment, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field: 'fullName' | 'department' | 'teamCount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handlers
  const handleOpenCreate = () => {
    setFormData({ name: '', description: '', pic: null, members: [] });
    setOpenCreateModal(true);
  };

  const handleOpenEdit = (team: Team) => {
    setSelectedTeam(team);
    
    // Match team members with users array to ensure proper object references
    const matchedPic = team.pic ? users.find(u => u.uuid === team.pic?.uuid) || team.pic : null;
    const matchedMembers = team.members
      .map(member => users.find(u => u.uuid === member.uuid) || member)
      .filter(Boolean) as TeamMember[];
    
    setFormData({
      name: team.name,
      description: team.description,
      pic: matchedPic,
      members: matchedMembers,
    });
    setOpenEditModal(true);
  };

  const handleOpenDelete = (team: Team) => {
    setSelectedTeam(team);
    setOpenDeleteModal(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    
    try {
      setSubmitting(true);
      const request: CreateTeamRequest = {
        name: formData.name,
        description: formData.description,
        picUuid: formData.pic?.uuid || null,
        memberUuids: formData.members.map(m => m.uuid),
      };
      await createTeam(request);
      await loadData();
      setOpenCreateModal(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTeam || !formData.name.trim()) return;
    
    try {
      setSubmitting(true);
      await updateTeam(
        selectedTeam.id,
        {
          name: formData.name,
          description: formData.description,
          picUuid: formData.pic?.uuid || null,
          memberUuids: formData.members.map(m => m.uuid),
        }
      );
      await loadData();
      setOpenEditModal(false);
    } catch (error) {
      console.error('Failed to update team:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeam) return;
    
    try {
      setSubmitting(true);
      await deleteTeam(selectedTeam.id);
      await loadData();
      setOpenDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete team:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 2,
      }}>
        <CircularProgress sx={{ color: '#DA251C' }} />
        <Typography sx={{ color: '#86868b' }}>Memuat data tim...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
              Team Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Kelola tim dan assignment anggota
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder={viewMode === 'teams' ? "Cari tim..." : "Cari user..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{
                width: 280,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white',
                  '& fieldset': { borderColor: '#E5E7EB' },
                  '&:hover fieldset': { borderColor: '#D1D5DB' },
                  '&.Mui-focused fieldset': { borderColor: '#DA251C', borderWidth: 1 },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            {viewMode === 'teams' && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                variant="contained"
                sx={{
                  bgcolor: '#DA251C',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#B91C14', boxShadow: 'none' },
                }}
              >
                Buat Tim
              </Button>
            )}
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          {[
            { label: 'Total Tim', value: teams.length, icon: <GroupIcon />, color: '#DA251C', bg: '#FEF2F2' },
            { label: 'Total User', value: users.length, icon: <PeopleIcon />, color: '#0891B2', bg: '#ECFEFF' },
            { label: 'PIC Assigned', value: teams.filter(t => t.pic).length, icon: <StarIcon />, color: '#F59E0B', bg: '#FFFBEB' },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'white',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* View Toggle */}
        <Box
          sx={{
            display: 'inline-flex',
            p: 0.5,
            borderRadius: 2,
            bgcolor: 'white',
            border: '1px solid #E5E7EB',
          }}
        >
          <Button
            onClick={() => { setViewMode('teams'); setSearchTerm(''); setFilterTeamAssignment('all'); }}
            startIcon={<GridViewIcon />}
            sx={{
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1.5,
              color: viewMode === 'teams' ? 'white' : '#6B7280',
              bgcolor: viewMode === 'teams' ? '#DA251C' : 'transparent',
              '&:hover': {
                bgcolor: viewMode === 'teams' ? '#B91C14' : '#F3F4F6',
              },
            }}
          >
            Tim
            <Chip
              label={teams.length}
              size="small"
              sx={{
                ml: 1,
                height: 20,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: viewMode === 'teams' ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                color: viewMode === 'teams' ? 'white' : '#6B7280',
              }}
            />
          </Button>
          <Button
            onClick={() => { setViewMode('users'); setSearchTerm(''); }}
            startIcon={<ViewListIcon />}
            sx={{
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1.5,
              color: viewMode === 'users' ? 'white' : '#6B7280',
              bgcolor: viewMode === 'users' ? '#DA251C' : 'transparent',
              '&:hover': {
                bgcolor: viewMode === 'users' ? '#B91C14' : '#F3F4F6',
              },
            }}
          >
            Users
            <Chip
              label={users.length}
              size="small"
              sx={{
                ml: 1,
                height: 20,
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: viewMode === 'users' ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                color: viewMode === 'users' ? 'white' : '#6B7280',
              }}
            />
          </Button>
        </Box>
      </Box>

      {/* Teams Grid */}
      {viewMode === 'teams' && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
        }}>
          {filteredTeams.map((team) => (
            <Box
              key={team.id}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'white',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#DA251C',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                },
              }}
            >
              {/* Team Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                    {team.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.5 }}>
                    {team.description || 'Tidak ada deskripsi'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit Tim">
                    <IconButton 
                      size="small" 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(team); }}
                      sx={{ 
                        color: '#9CA3AF',
                        '&:hover': { color: '#DA251C', bgcolor: '#FEF2F2' },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hapus Tim">
                    <IconButton 
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleOpenDelete(team); }}
                      sx={{ 
                        color: '#9CA3AF',
                        '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* PIC Section */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                  Person In Charge
                </Typography>
                {team.pic ? (
                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: '#DA251C',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      {getInitials(team.pic.fullName)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#DA251C' }}>
                        {team.pic.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                        {team.pic.department}
                      </Typography>
                    </Box>
                    <CrownIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                  </Box>
                ) : (
                  <Box sx={{ mt: 1.5, p: 2, borderRadius: 1.5, bgcolor: '#F9FAFB', border: '1px dashed #E5E7EB' }}>
                    <Typography variant="body2" sx={{ color: '#9CA3AF', textAlign: 'center', fontSize: '0.875rem' }}>
                      Belum ada PIC
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Members Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                    Anggota Tim
                  </Typography>
                  <Chip 
                    label={`${team.members.length} orang`}
                    size="small"
                    sx={{ 
                      bgcolor: '#ECFEFF',
                      color: '#0891B2',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Box>
                {team.members.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <AvatarGroup 
                      max={5}
                      sx={{
                        '& .MuiAvatar-root': {
                          width: 36,
                          height: 36,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: '2px solid white',
                        },
                      }}
                    >
                      {team.members.map((member) => (
                        <Tooltip key={member.uuid} title={member.fullName}>
                          <Avatar sx={{ bgcolor: getAvatarColor(member.fullName) }}>
                            {getInitials(member.fullName)}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  </Box>
                ) : (
                  <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#F9FAFB', border: '1px dashed #E5E7EB' }}>
                    <Typography variant="body2" sx={{ color: '#9CA3AF', textAlign: 'center', fontSize: '0.875rem' }}>
                      Belum ada anggota
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Footer */}
              <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                  Dibuat: {new Date(team.createdAt).toLocaleDateString('id-ID')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#10B981' }}>
                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Aktif
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty State - Teams */}
      {viewMode === 'teams' && filteredTeams.length === 0 && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 12,
            bgcolor: 'white',
            borderRadius: 2,
            border: '2px dashed #E5E7EB',
          }}
        >
          <GroupIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#6B7280', mb: 1, fontWeight: 600 }}>
            {searchTerm ? 'Tim tidak ditemukan' : 'Belum ada tim'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3 }}>
            {searchTerm ? 'Coba kata kunci lain' : 'Buat tim pertama Anda sekarang'}
          </Typography>
          {!searchTerm && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              variant="contained"
              sx={{
                bgcolor: '#DA251C',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#B91C14', boxShadow: 'none' },
              }}
            >
              Buat Tim Baru
            </Button>
          )}
        </Box>
      )}

      {/* Users View */}
      {viewMode === 'users' && (
        <>
          {/* Filter & Sort Controls */}
          <Box sx={{ mb: 3, p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #E5E7EB' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                  Daftar User & Team Assignment
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280' }}>
                  {filteredUsers.length} dari {users.length} users
                </Typography>
              </Box>
              
              {/* Filter Chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { value: 'all', label: 'Semua', icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
                  { value: 'assigned', label: 'Punya Tim', icon: <GroupIcon sx={{ fontSize: 16 }} /> },
                  { value: 'unassigned', label: 'Belum Ada Tim', icon: <FilterIcon sx={{ fontSize: 16 }} /> },
                  { value: 'pic', label: 'PIC', icon: <CrownIcon sx={{ fontSize: 16 }} /> },
                ].map((filter) => (
                  <Chip
                    key={filter.value}
                    label={filter.label}
                    icon={filter.icon}
                    onClick={() => setFilterTeamAssignment(filter.value as typeof filterTeamAssignment)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      ...(filterTeamAssignment === filter.value ? {
                        bgcolor: '#DA251C',
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' },
                      } : {
                        bgcolor: '#F3F4F6',
                        color: '#6B7280',
                        border: '1px solid #E5E7EB',
                        '&:hover': {
                          bgcolor: '#E5E7EB',
                        },
                      }),
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Users Table */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 2,
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid #E5E7EB' }}>
                    <TableSortLabel
                      active={sortField === 'fullName'}
                      direction={sortField === 'fullName' ? sortDirection : 'asc'}
                      onClick={() => handleSort('fullName')}
                      sx={{
                        '&.MuiTableSortLabel-root': { color: '#111827' },
                        '&.Mui-active': { color: '#DA251C' },
                        '& .MuiTableSortLabel-icon': { color: '#DA251C !important' },
                      }}
                    >
                      Nama User
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid #E5E7EB' }}>
                    <TableSortLabel
                      active={sortField === 'department'}
                      direction={sortField === 'department' ? sortDirection : 'asc'}
                      onClick={() => handleSort('department')}
                      sx={{
                        '&.MuiTableSortLabel-root': { color: '#111827' },
                        '&.Mui-active': { color: '#DA251C' },
                        '& .MuiTableSortLabel-icon': { color: '#DA251C !important' },
                      }}
                    >
                      Departemen
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid #E5E7EB' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid #E5E7EB' }}>Tim</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid #E5E7EB' }}>
                    <TableSortLabel
                      active={sortField === 'teamCount'}
                      direction={sortField === 'teamCount' ? sortDirection : 'asc'}
                      onClick={() => handleSort('teamCount')}
                      sx={{
                        '&.MuiTableSortLabel-root': { color: '#111827' },
                        '&.Mui-active': { color: '#DA251C' },
                        '& .MuiTableSortLabel-icon': { color: '#DA251C !important' },
                      }}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.uuid} 
                    sx={{ 
                      '&:hover': { bgcolor: '#F9FAFB' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: getAvatarColor(user.fullName), width: 36, height: 36, fontSize: '0.85rem', fontWeight: 600 }}>
                          {getInitials(user.fullName)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                          {user.fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                      <Chip 
                        label={user.department} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#F3F4F6',
                          color: '#6B7280',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#6B7280', fontSize: '0.875rem', borderBottom: '1px solid #F3F4F6' }}>
                      {user.email}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                      {user.assignedTeams.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.assignedTeams.map((team) => (
                            <Chip
                              key={team.id}
                              label={team.name}
                              size="small"
                              icon={team.isPIC ? <CrownIcon sx={{ fontSize: 14 }} /> : undefined}
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                ...(team.isPIC ? {
                                  bgcolor: '#FEF2F2',
                                  color: '#DA251C',
                                  border: '1px solid #FEE2E2',
                                  '& .MuiChip-icon': { color: '#DA251C' },
                                } : {
                                  bgcolor: '#F3F4F6',
                                  color: '#6B7280',
                                }),
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                      {user.isPic ? (
                        <Chip
                          label="PIC"
                          icon={<CrownIcon sx={{ fontSize: 14 }} />}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: '#FFFBEB',
                            color: '#F59E0B',
                            border: '1px solid #FEF3C7',
                            '& .MuiChip-icon': { color: '#F59E0B' },
                          }}
                        />
                      ) : user.assignedTeams.length > 0 ? (
                        <Chip
                          label={`${user.assignedTeams.length} Tim`}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: '#ECFEFF',
                            color: '#0891B2',
                            border: '1px solid #CFFAFE',
                          }}
                        />
                      ) : (
                        <Chip
                          label="Belum Ada Tim"
                          size="small"
                          sx={{
                            bgcolor: '#F3F4F6',
                            color: '#9CA3AF',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Empty State - Users */}
          {filteredUsers.length === 0 && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 12,
                bgcolor: 'white',
                borderRadius: 2,
                border: '2px dashed #E5E7EB',
                mt: 3,
              }}
            >
              <PeopleIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#6B7280', mb: 1, fontWeight: 600 }}>
                User tidak ditemukan
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                {searchTerm ? 'Coba kata kunci lain' : 'Ubah filter untuk melihat user'}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Create Modal */}
      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSubmit={handleCreate}
        title="Buat Tim Baru"
        formData={formData}
        setFormData={setFormData}
        users={users}
        submitting={submitting}
      />

      {/* Edit Modal */}
      <FormModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        onSubmit={handleUpdate}
        title="Edit Tim"
        isEdit
        formData={formData}
        setFormData={setFormData}
        users={users}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'white',
            border: '1px solid #E5E7EB',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            minWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <DeleteIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                Hapus Tim
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Konfirmasi penghapusan tim
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
            <Typography sx={{ color: '#374151', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Anda yakin ingin menghapus tim <Box component="span" sx={{ fontWeight: 700, color: '#EF4444' }}>"{selectedTeam?.name}"</Box>? 
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.875rem', mt: 1.5 }}>
              ⚠️ Aksi ini tidak dapat dibatalkan
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button 
            onClick={() => setOpenDeleteModal(false)}
            variant="outlined"
            sx={{ 
              color: '#6B7280',
              borderColor: '#E5E7EB',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#D1D5DB',
                bgcolor: '#F9FAFB',
              },
            }}
          >
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={submitting}
            sx={{
              bgcolor: '#EF4444',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { 
                bgcolor: '#DC2626',
                boxShadow: 'none',
              },
              '&:disabled': {
                bgcolor: '#FCA5A5',
              },
            }}
          >
            {submitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Menghapus...</span>
              </Box>
            ) : (
              'Hapus Tim'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
