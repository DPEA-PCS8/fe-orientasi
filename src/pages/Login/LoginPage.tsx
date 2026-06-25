import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import Alert from '@mui/material/Alert';
import OJKLogo from '../../assets/OJK_Logo.png';
import DPEALogo from '../../assets/DPEA_Logo.png';
import OfficeJobImage from '../../assets/office-job.jpg';

const LoginPage = () => {
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check for logout message from auto-logout (token expired) or SSO callback errors
  useEffect(() => {
    const logoutMessage = sessionStorage.getItem('logout_message');
    if (logoutMessage) {
      setLoginError(logoutMessage);
      sessionStorage.removeItem('logout_message');
    }
  }, []);

  const handleSsoLogin = () => {
    // Redirect the browser to the BE SSO entrypoint (via vite proxy /api -> :8080).
    window.location.href = '/api/auth/sso/login';
  };

  const clearError = () => {
    setLoginError(null);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        background: '#f5f5f7',
        overflow: 'hidden',
      }}
    >
      {/* Left Side - Form Container */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 2, sm: 3, md: 4 },
          overflowY: 'auto',
        }}
      >
        {/* Content */}
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 400 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 2.5 }}>
            <img
              src={OJKLogo}
              alt="OJK Logo"
              style={{
                width: 130,
                height: 130,
                objectFit: 'contain',
              }}
            />
            <img
              src={DPEALogo}
              alt="DPEA Logo"
              style={{
                width: 130,
                height: 130,
                objectFit: 'contain',
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1d1d1f',
              mb: 0.5,
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Masuk ke KKAD
          </Typography>

          <Typography
            sx={{
              color: '#86868b',
              mb: 3,
              textAlign: 'center',
              fontSize: '0.95rem',
            }}
          >
            Silakan masuk menggunakan akun SSO Anda
          </Typography>

          {/* Error Alert */}
          {loginError && (
            <Alert
              severity="error"
              onClose={clearError}
              sx={{
                width: '100%',
                mb: 3,
                borderRadius: 2,
                backgroundColor: '#fff2f2',
                border: '1px solid #ffcdd2',
              }}
            >
              {loginError}
            </Alert>
          )}

          {/* SSO Login Button */}
          <Box sx={{ width: '100%' }}>
            <Button
              type="button"
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleSsoLogin}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                backgroundColor: '#0071e3',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#0077ed',
                  boxShadow: 'none',
                },
              }}
            >
              Login dengan SSO
            </Button>
          </Box>

          {/* Footer */}
          <Typography
            sx={{
              mt: 1.5,
              color: '#86868b',
              fontSize: '0.7rem',
              textAlign: 'center',
            }}
          >
            © {new Date().getFullYear()} Otoritas Jasa Keuangan. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Illustrative Image (Hidden on Mobile) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '50%' },
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
          flexShrink: 0,
        }}
      >
        {/* Image */}
        <Box
          component="img"
          src={OfficeJobImage}
          alt="Office work illustration"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />

        {/* Dark Overlay with 60% Opacity */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1,
          }}
        />

        {/* Optional: Text Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 4,
            color: 'white',
            zIndex: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Kertas Kerja Digital (KKAD)
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', opacity: 0.9 }}>
            Kelola data dan informasi terkait RBSI dan PKSI
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
