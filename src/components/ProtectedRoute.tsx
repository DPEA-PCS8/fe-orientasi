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
        console.log('[ProtectedRoute] User roles:', roles);
        console.log('[ProtectedRoute] Checking permission for menu:', requireMenuPermission);
        
        if (roles.length === 0) {
          console.log('[ProtectedRoute] No roles found, denying access');
          setPermissionChecked(true);
          setHasMenuPermission(false);
          return;
        }

        console.log('[ProtectedRoute] Calling getMyPermissions with roles:', roles);
        const permissions = await getMyPermissions(roles);
        console.log('[ProtectedRoute] Raw permissions response:', permissions);
        
        const menuPerms = permissions.menu_permissions || [];
        console.log('[ProtectedRoute] Menu permissions count:', menuPerms.length);
        console.log('[ProtectedRoute] All menu permissions:', menuPerms.map(p => ({ code: p.menu_code, can_view: p.can_view })));
        
        // Find permission for this specific menu code
        const permission = menuPerms.find(
          p => p.menu_code.toUpperCase() === requireMenuPermission.toUpperCase()
        );
        console.log('[ProtectedRoute] Direct permission for', requireMenuPermission, ':', permission);
        
        // If direct permission found and has view access, grant it
        if (permission?.can_view) {
          console.log('[ProtectedRoute] Direct permission granted for:', requireMenuPermission);
          setHasMenuPermission(true);
          return;
        }
        
        // Check if this is a child menu (has underscore) - check parent permission
        const menuCodeParts = requireMenuPermission.split('_');
        if (menuCodeParts.length > 1) {
          const parentCode = menuCodeParts[0];
          const parentPermission = menuPerms.find(
            p => p.menu_code.toUpperCase() === parentCode.toUpperCase()
          );
          console.log('[ProtectedRoute] Parent permission for', parentCode, ':', parentPermission);
          if (parentPermission?.can_view) {
            console.log('[ProtectedRoute] Parent permission granted for:', parentCode);
            setHasMenuPermission(true);
            return;
          }
        }
        
        // Check if this is a parent menu - check if any child has permission
        // Find any child menu that starts with this code
        const childPermission = menuPerms.find(
          p => p.menu_code.toUpperCase().startsWith(requireMenuPermission.toUpperCase() + '_') && p.can_view
        );
        if (childPermission) {
          console.log('[ProtectedRoute] Child permission found:', childPermission.menu_code);
          setHasMenuPermission(true);
          return;
        }
        
        console.log('[ProtectedRoute] No permission found, denying access');
        setHasMenuPermission(false);
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
