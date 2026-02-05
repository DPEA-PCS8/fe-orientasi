import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useLoginForm } from '../../hooks/useLoginForm';
import { COLORS } from '../../styles/theme';

const LoginPage = () => {
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
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    // Tunggu untuk simulasi request ke backend
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Integrasikan dengan backend API
    console.log('Login form submitted:', {
      username: values.username,
      rememberMe: values.rememberMe,
    });

    setIsLoading(false);
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, #FF4D45 50%, ${COLORS.BACKGROUND} 100%)`,
        padding: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          padding: { xs: 3, sm: 5 },
          borderRadius: 3,
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo & Title */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              background: COLORS.PRIMARY_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <LockIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 600,
              color: COLORS.TEXT_PRIMARY,
              mb: 0.5,
            }}
          >
            Selamat Datang
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: COLORS.TEXT_SECONDARY,
            }}
          >
            Masuk ke akun Anda untuk melanjutkan
          </Typography>
        </Box>

        {/* Error Alert */}
        {loginError && (
          <Alert
            severity="error"
            onClose={clearError}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {loginError}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            id="username"
            name="username"
            label="Username"
            placeholder="Masukkan username"
            value={values.username}
            onChange={handleChange}
            onBlur={() => handleBlur('username')}
            error={touched.username && !!errors.username}
            helperText={touched.username && errors.username}
            disabled={isLoading}
            autoComplete="username"
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: COLORS.TEXT_SECONDARY }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2.5 }}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan password"
            value={values.password}
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
            error={touched.password && !!errors.password}
            helperText={touched.password && errors.password}
            disabled={isLoading}
            autoComplete="current-password"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: COLORS.TEXT_SECONDARY }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2 }}
          />

          {/* Remember Me */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.rememberMe}
                  onChange={(e) => handleRememberMeChange(e.target.checked)}
                  disabled={isLoading}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
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
              background: COLORS.PRIMARY_GRADIENT,
              '&:hover': {
                background: COLORS.PRIMARY_GRADIENT,
                opacity: 0.9,
              },
              '&:disabled': {
                background: COLORS.BORDER,
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
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            color: COLORS.TEXT_SECONDARY,
          }}
        >
          © {new Date().getFullYear()} OJK. All rights reserved.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
