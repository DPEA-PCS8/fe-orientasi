import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { clearAuthData } from '../../api/authApi';

/**
 * Landing page after the SSO end_session (RP-initiated logout) redirects back here.
 * Clears any leftover local auth and returns the user to the login page.
 */
const SignoutCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    clearAuthData();
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        background: '#f5f5f7',
        px: 2,
      }}
    >
      <CircularProgress sx={{ color: '#0071e3' }} />
      <Typography sx={{ color: '#86868b' }}>Mengakhiri sesi...</Typography>
    </Box>
  );
};

export default SignoutCallback;
