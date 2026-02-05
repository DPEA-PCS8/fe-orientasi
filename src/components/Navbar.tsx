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
import OjkLogoPng from '../assets/OJK_Logo.png';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(251, 251, 253, 0.95)',
        backdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', height: 64, px: 3 }}>
        {/* Logo & Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img 
            src={OjkLogoPng} 
            alt="OJK Logo" 
            style={{ height: 40, width: 'auto' }} 
          />
          <Box
            sx={{
              height: 36,
              width: '1px',
              bgcolor: 'rgba(0,0,0,0.12)',
            }}
          />
          <Typography
            variant="body1"
            component="div"
            sx={{ 
              fontWeight: 600, 
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
            }}
          >
            Kertas Kerja PKSI
          </Typography>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right Side Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton 
            size="small" 
            sx={{ 
              color: '#1d1d1f',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
            }}
          >
            <SearchIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton 
            size="small" 
            sx={{ 
              color: '#1d1d1f',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
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
                width: 28,
                height: 28,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              AD
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: '0.8125rem' }}>
                Admin
              </Typography>
              <KeyboardArrowDown sx={{ fontSize: 16, color: '#86868b' }} />
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
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>Settings</MenuItem>
            <MenuItem onClick={handleClose} sx={{ color: 'error.main' }}>Sign Out</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
