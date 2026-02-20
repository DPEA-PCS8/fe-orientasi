import { Navigate, useLocation } from 'react-router-dom';
import { Alert, AlertTitle, Box, Paper } from '@mui/material';
import { isAuthenticated, hasRole, hasAnyRole } from '../api/authApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRoles?: string[];
  requireAll?: boolean; // If true, user must have ALL specified roles
}

const ProtectedRoute = ({
  children,
  requireRoles,
  requireAll = false
}: ProtectedRouteProps) => {
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has a role assigned
  if (!hasRole()) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#F5F5F7',
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 600,
            p: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Alert severity="warning">
            <AlertTitle>Tidak Memiliki Role</AlertTitle>
            Akun Anda belum diberikan role oleh administrator. Silakan hubungi administrator untuk mendapatkan akses ke aplikasi ini.
          </Alert>
        </Paper>
      </Box>
    );
  }

  // Check roles if specified
  if (requireRoles && requireRoles.length > 0) {
    const hasRequiredRoles = requireAll
      ? requireRoles.every(role => hasAnyRole([role]))
      : hasAnyRole(requireRoles);

    if (!hasRequiredRoles) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#F5F5F7',
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 600,
              p: 4,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Alert severity="error">
              <AlertTitle>Akses Ditolak</AlertTitle>
              Anda tidak memiliki izin yang diperlukan untuk mengakses halaman ini.
            </Alert>
          </Paper>
        </Box>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
