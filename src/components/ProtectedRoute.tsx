import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, AlertTitle, Box, Paper, CircularProgress } from '@mui/material';
import { isAuthenticated, hasRole, hasAnyRole, getUserRoles, isAdmin } from '../api/authApi';
import { getMyPermissions } from '../api/rolePermissionApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRoles?: string[];
  requireAll?: boolean; // If true, user must have ALL specified roles
  requireMenuPermission?: string; // Menu code to check for view permission
}

const ProtectedRoute = ({
  children,
  requireRoles,
  requireAll = false,
  requireMenuPermission
}: ProtectedRouteProps) => {
  const location = useLocation();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [hasMenuPermission, setHasMenuPermission] = useState(false);

  // Check menu permissions on mount
  useEffect(() => {
    const checkPermission = async () => {
      // If no menu permission required, skip check
      if (!requireMenuPermission) {
        setPermissionChecked(true);
        setHasMenuPermission(true);
        return;
      }

      // Admin always has access
      if (isAdmin()) {
        setPermissionChecked(true);
        setHasMenuPermission(true);
        return;
      }

      try {
        const roles = getUserRoles();
        if (roles.length === 0) {
          setPermissionChecked(true);
          setHasMenuPermission(false);
          return;
        }

        const permissions = await getMyPermissions(roles);
        const menuPerms = permissions.menu_permissions || [];
        
        const permission = menuPerms.find(
          p => p.menu_code.toUpperCase() === requireMenuPermission.toUpperCase()
        );
        
        setHasMenuPermission(permission?.can_view ?? false);
      } catch (error) {
        console.error('Failed to check menu permission:', error);
        setHasMenuPermission(false);
      } finally {
        setPermissionChecked(true);
      }
    };

    if (isAuthenticated()) {
      checkPermission();
    }
  }, [requireMenuPermission]);

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

  // Check role-based access if specified (and no menu permission required)
  if (requireRoles && requireRoles.length > 0 && !requireMenuPermission) {
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

  // Check menu permission if specified
  if (requireMenuPermission) {
    // Show loading while checking permission
    if (!permissionChecked) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#F5F5F7',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (!hasMenuPermission) {
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
              Anda tidak memiliki izin yang diperlukan untuk mengakses menu ini.
            </Alert>
          </Paper>
        </Box>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
