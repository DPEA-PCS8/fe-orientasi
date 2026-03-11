import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  CircularProgress,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import OJKLogo from '../../assets/OJK_Logo.png';
import DPEALogo from '../../assets/DPEA_Logo.png';
import OfficeJobImage from '../../assets/office-job.jpg';
import { useLoginForm } from '../../hooks/useLoginForm';
import { login, storeAuthData } from '../../api/authApi';

const LoginPage = () => {
  const navigate = useNavigate();
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleRememberMeChange,
    validateForm,
  } = useLoginForm();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showNoRoleWarning, setShowNoRoleWarning] = useState(false);

  // Check for logout message from auto-logout (token expired)
  useEffect(() => {
    const logoutMessage = sessionStorage.getItem('logout_message');
    if (logoutMessage) {
      setLoginError(logoutMessage);
      sessionStorage.removeItem('logout_message');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await login(values.username, values.password);

      storeAuthData(
        response.data.token,
        response.data.user_info,
        values.rememberMe
      );

      // Check if user has a role assigned
      if (!response.data.user_info.has_role) {
        setShowNoRoleWarning(true);
      }

      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Login gagal. Periksa kembali username dan password Anda.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
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
          justifyContent: 'flex-start',
          padding: { xs: 2, sm: 3, md: 4 },
          paddingTop: { xs: 1.5, sm: 2, md: 3 },
          overflowY: 'auto',
        }}
      >
        {/* Form Content */}
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
            Silakan masuk dengan akun Anda
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

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            {/* Username Field */}
            <Box sx={{ mb: 2.5, minHeight: '88px', display: 'flex', flexDirection: 'column' }}>
              <TextField
                fullWidth
                id="username"
                name="username"
                placeholder="Username atau Email"
                value={values.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                error={touched.username && !!errors.username}
                helperText={touched.username && errors.username}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f5f5f7',
                    fontSize: '1rem',
                    '& fieldset': {
                      borderColor: '#d2d2d7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d2d2d7',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0071e3',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.75,
                    px: 2,
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#86868b',
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    minHeight: '1.25rem',
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 2, minHeight: '88px', display: 'flex', flexDirection: 'column' }}>
              <TextField
                fullWidth
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={values.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                error={touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                disabled={isLoading}
                autoComplete="current-password"
                variant="outlined"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          onClick={handleTogglePassword}
                          edge="end"
                          disabled={isLoading}
                          sx={{ color: '#86868b' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f5f5f7',
                    fontSize: '1rem',
                    '& fieldset': {
                      borderColor: '#d2d2d7',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d2d2d7',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0071e3',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.75,
                    px: 2,
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#86868b',
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    minHeight: '1.25rem',
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                  },
                }}
              />
            </Box>

            {/* Remember Me */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={values.rememberMe}
                    onChange={(e) => handleRememberMeChange(e.target.checked)}
                    disabled={isLoading}
                    size="small"
                    sx={{
                      color: '#86868b',
                      '&.Mui-checked': {
                        color: '#0071e3',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: '#1d1d1f', fontSize: '0.875rem' }}>
                    Ingat saya
                  </Typography>
                }
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
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
                '&:disabled': {
                  backgroundColor: '#d2d2d7',
                  color: '#86868b',
                },
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Memproses...</span>
                </Box>
              ) : (
                'Masuk'
              )}
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

      {/* No Role Warning Snackbar */}
      <Snackbar
        open={showNoRoleWarning}
        autoHideDuration={8000}
        onClose={() => setShowNoRoleWarning(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        message="Akun Anda belum diberikan role. Silakan hubungi administrator untuk mendapatkan akses ke fitur aplikasi."
      />
    </Box>
  );
};

export default LoginPage;
