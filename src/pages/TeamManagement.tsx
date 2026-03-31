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
  Fade,
  Zoom,
  styled,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Star as StarIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as CrownIcon,
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

// ==================== STYLED COMPONENTS ====================

const GlassContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  borderRadius: 28,
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: `
    0 24px 48px rgba(0, 0, 0, 0.08),
    0 12px 24px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(0, 0, 0, 0.02)
  `,
  padding: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
  },
}));

const TeamCard = styled(Box)<{ selected?: boolean }>(({ selected }) => ({
  background: selected
    ? 'linear-gradient(135deg, rgba(218, 37, 28, 0.08) 0%, rgba(255, 77, 69, 0.04) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: selected 
    ? '2px solid rgba(218, 37, 28, 0.3)' 
    : '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: selected
    ? '0 20px 40px rgba(218, 37, 28, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
    : '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  padding: 24,
  cursor: 'pointer',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.01)',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
}));

const PICBadge = styled(Box)(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 20px',
  background: 'linear-gradient(135deg, rgba(218, 37, 28, 0.1) 0%, rgba(255, 77, 69, 0.05) 100%)',
  borderRadius: 24,
  border: '1px solid rgba(218, 37, 28, 0.2)',
  boxShadow: '0 4px 16px rgba(218, 37, 28, 0.08)',
}));

const GlassButton = styled(Button)(() => ({
  background: 'linear-gradient(135deg, rgba(218, 37, 28, 1) 0%, rgba(255, 77, 69, 1) 100%)',
  color: 'white',
  borderRadius: 16,
  padding: '12px 28px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 8px 24px rgba(218, 37, 28, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(185, 28, 20, 1) 0%, rgba(216, 58, 50, 1) 100%)',
    boxShadow: '0 12px 32px rgba(218, 37, 28, 0.4)',
    transform: 'translateY(-2px)',
  },
}));

const GlassTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.15)',
    },
    '&.Mui-focused': {
      background: 'rgba(255, 255, 255, 0.95)',
      boxShadow: '0 8px 24px rgba(218, 37, 28, 0.1)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DA251C',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#86868b',
    '&.Mui-focused': {
      color: '#DA251C',
    },
  },
}));

const FloatingOrb = styled(Box)<{ size: number; top: string; left: string; delay: number }>(
  ({ size, top, left, delay }) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(218, 37, 28, 0.1) 0%, rgba(255, 77, 69, 0.05) 100%)',
    top,
    left,
    filter: 'blur(40px)',
    animation: `float 8s ease-in-out ${delay}s infinite`,
    '@keyframes float': {
      '0%, 100%': { transform: 'translateY(0) scale(1)' },
      '50%': { transform: 'translateY(-20px) scale(1.1)' },
    },
  })
);

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
              getOptionLabel={(option) => option.fullName}
              value={formData.pic}
              onChange={(_, newValue) => setFormData({ ...formData, pic: newValue })}
              isOptionEqualToValue={(option, value) => option.uuid === value?.uuid}
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
              getOptionLabel={(option) => option.fullName}
              value={formData.members}
              onChange={(_, newValue) => setFormData({ ...formData, members: newValue })}
              isOptionEqualToValue={(option, value) => option.uuid === value?.uuid}
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

  // Handlers
  const handleOpenCreate = () => {
    setFormData({ name: '', description: '', pic: null, members: [] });
    setOpenCreateModal(true);
  };

  const handleOpenEdit = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description,
      pic: team.pic,
      members: team.members,
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
      await createTeam(request, users);
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
        },
        users
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
    <Box sx={{ p: 3, position: 'relative', minHeight: '100vh' }}>
      {/* Background Orbs */}
      <FloatingOrb size={300} top="-5%" left="80%" delay={0} />
      <FloatingOrb size={200} top="60%" left="-5%" delay={2} />
      <FloatingOrb size={150} top="30%" left="50%" delay={4} />

      {/* Header */}
      <Fade in timeout={600}>
        <GlassContainer sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #DA251C 0%, #FF4D45 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(218, 37, 28, 0.3)',
                  }}
                >
                  <GroupIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #1d1d1f 0%, #424245 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Team Management
                  </Typography>
                  <Typography sx={{ color: '#86868b', mt: 0.5 }}>
                    Kelola tim dan assignment anggota
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <GlassTextField
                placeholder="Cari tim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ width: 280 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#86868b' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <GlassButton startIcon={<AddIcon />} onClick={handleOpenCreate}>
                Buat Tim Baru
              </GlassButton>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 4, mt: 4, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Tim', value: teams.length, icon: <GroupIcon />, color: '#DA251C' },
              { label: 'Total Anggota', value: teams.reduce((acc, t) => acc + t.members.length, 0), icon: <PersonAddIcon />, color: '#4ECDC4' },
              { label: 'PIC Assigned', value: teams.filter(t => t.pic).length, icon: <StarIcon />, color: '#FFB74D' },
            ].map((stat, index) => (
              <Zoom in timeout={400 + index * 100} key={stat.label}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    px: 3,
                    borderRadius: 3,
                    background: alpha(stat.color, 0.08),
                    border: `1px solid ${alpha(stat.color, 0.15)}`,
                  }}
                >
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1d1d1f' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#86868b' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
              </Zoom>
            ))}
          </Box>
        </GlassContainer>
      </Fade>

      {/* Teams Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        gap: 3,
      }}>
        {filteredTeams.map((team, index) => (
          <Zoom in timeout={500 + index * 100} key={team.id}>
            <TeamCard>
              {/* Team Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1d1d1f', mb: 0.5 }}>
                    {team.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#86868b', lineHeight: 1.6 }}>
                    {team.description || 'Tidak ada deskripsi'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit Tim">
                    <IconButton 
                      size="small" 
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(team); }}
                      sx={{ 
                        color: '#86868b',
                        '&:hover': { color: '#DA251C', bgcolor: alpha('#DA251C', 0.08) },
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
                        color: '#86868b',
                        '&:hover': { color: '#DA251C', bgcolor: alpha('#DA251C', 0.08) },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* PIC Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Person In Charge
                </Typography>
                {team.pic ? (
                  <PICBadge sx={{ mt: 1, display: 'flex' }}>
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: getAvatarColor(team.pic.fullName),
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      {getInitials(team.pic.fullName)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#DA251C' }}>
                        {team.pic.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#86868b' }}>
                        {team.pic.department}
                      </Typography>
                    </Box>
                    <CrownIcon sx={{ color: '#FFB74D', fontSize: 20, ml: 'auto' }} />
                  </PICBadge>
                ) : (
                  <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <Typography variant="body2" sx={{ color: '#86868b', textAlign: 'center' }}>
                      Belum ada PIC
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Members Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#86868b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Anggota Tim
                  </Typography>
                  <Chip 
                    label={`${team.members.length} orang`}
                    size="small"
                    sx={{ 
                      bgcolor: alpha('#4ECDC4', 0.1),
                      color: '#4ECDC4',
                      fontWeight: 600,
                      fontSize: '0.7rem',
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
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <Typography variant="body2" sx={{ color: '#86868b', textAlign: 'center' }}>
                      Belum ada anggota
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Footer */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#86868b' }}>
                  Dibuat: {new Date(team.createdAt).toLocaleDateString('id-ID')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#4ECDC4' }}>
                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Aktif
                  </Typography>
                </Box>
              </Box>
            </TeamCard>
          </Zoom>
        ))}
      </Box>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <Fade in timeout={500}>
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 10,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
              borderRadius: 4,
              border: '2px dashed rgba(0,0,0,0.08)',
            }}
          >
            <GroupIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#86868b', mb: 1 }}>
              {searchTerm ? 'Tim tidak ditemukan' : 'Belum ada tim'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 3 }}>
              {searchTerm ? 'Coba kata kunci lain' : 'Buat tim pertama Anda sekarang'}
            </Typography>
            {!searchTerm && (
              <GlassButton startIcon={<AddIcon />} onClick={handleOpenCreate}>
                Buat Tim Baru
              </GlassButton>
            )}
          </Box>
        </Fade>
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
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
            backdropFilter: 'blur(40px)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#DA251C' }}>
            Hapus Tim?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#424245' }}>
            Anda yakin ingin menghapus tim <strong>{selectedTeam?.name}</strong>? 
            Aksi ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenDeleteModal(false)}
            sx={{ color: '#86868b', textTransform: 'none', fontWeight: 500 }}
          >
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={submitting}
            sx={{
              bgcolor: '#DA251C',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { bgcolor: '#B91C14' },
            }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Hapus Tim'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
