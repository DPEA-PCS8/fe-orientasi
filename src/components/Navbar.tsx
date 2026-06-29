import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OjkLogoPng from '../assets/OJK_Logo.png';
import { getUserInfo, clearAuthData } from '../api/authApi';
import { COLORS } from '../styles/theme';

const Navbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userInfo = getUserInfo();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    clearAuthData();
    // RP-initiated logout: end the SSO session too, else the SSO cookie logs us straight back in.
    // BE redirects to SSO /connect/logout, which returns to the FE login page.
    window.location.href = '/api/auth/sso/logout';
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'saturate(180%) blur(18px)',
        borderTop: `3px solid ${COLORS.PRIMARY}`,
        borderBottom: `1px solid ${COLORS.BORDER}`,
        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', height: 64, px: 3 }}>
        {/* Logo & Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img src={OjkLogoPng} alt="OJK Logo" style={{ height: 38, width: 'auto' }} />
          <Box sx={{ height: 32, width: '1px', bgcolor: COLORS.BORDER }} />
          <Typography
            component="div"
            sx={{
              fontWeight: 600,
              color: COLORS.INK,
              letterSpacing: '-0.01em',
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
            }}
          >
            Kertas Kerja Digital DPEA
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right Side Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            sx={{
              color: COLORS.TEXT_PRIMARY,
              borderRadius: '12px',
              '&:hover': { bgcolor: 'rgba(241, 245, 249, 0.9)' },
            }}
          >
            <SearchIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton
            size="small"
            sx={{
              color: COLORS.TEXT_PRIMARY,
              borderRadius: '12px',
              '&:hover': { bgcolor: 'rgba(241, 245, 249, 0.9)' },
            }}
          >
            <Badge 
              badgeContent={3} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  height: 16,
                  minWidth: 16,
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ml: 1,
              cursor: 'pointer',
              padding: '4px 10px 4px 4px',
              borderRadius: '20px',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            onClick={handleMenu}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                background: COLORS.PRIMARY_GRADIENT,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {getInitials(userInfo?.full_name)}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.INK, fontSize: '0.8125rem' }}>
                {userInfo?.full_name || 'User'}
              </Typography>
              <KeyboardArrowDown sx={{ fontSize: 16, color: COLORS.TEXT_SECONDARY }} />
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{ mt: 1 }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {userInfo?.full_name || 'User'}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#86868b' }}>
                  {userInfo?.email || ''}
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Sign Out</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
