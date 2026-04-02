import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { isAuthenticated, hasRole, getUserRoles, isAdmin } from '../api/authApi';
import { getMyPermissions } from '../api/rolePermissionApi';

/**
 * Smart landing page that redirects users to their first accessible menu
 * based on their role permissions
 */
const SmartLanding = () => {
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineRedirect = async () => {
      // Not authenticated - go to login
      if (!isAuthenticated()) {
        setRedirectPath('/login');
        setLoading(false);
        return;
      }

      // No role assigned
      if (!hasRole()) {
        // This will be handled by ProtectedRoute
        setRedirectPath(null);
        setLoading(false);
        return;
      }

      // Admin has access to everything - default to PKSI list
      if (isAdmin()) {
        setRedirectPath('/pksi-list');
        setLoading(false);
        return;
      }

      try {
        const roles = getUserRoles();
        if (roles.length === 0) {
          setRedirectPath('/pksi-list');
          setLoading(false);
          return;
        }

        const permissions = await getMyPermissions(roles);
        const menuPerms = permissions.menu_permissions || [];
        console.log('[SmartLanding] Menu permissions:', menuPerms.map(p => ({ code: p.menu_code, can_view: p.can_view })));

        // Helper to check if user has permission for a menu code
        // Also checks parent/child relationships
        const hasViewPermission = (code: string): boolean => {
          // Direct match
          const direct = menuPerms.find(
            p => p.menu_code.toUpperCase() === code.toUpperCase() && p.can_view
          );
          if (direct) return true;
          
          // Check if any child of this menu has permission
          const childHasPermission = menuPerms.some(
            p => p.menu_code.toUpperCase().startsWith(code.toUpperCase() + '_') && p.can_view
          );
          if (childHasPermission) return true;
          
          // Check if parent has permission
          const parts = code.split('_');
          if (parts.length > 1) {
            const parentCode = parts[0];
            const parentHasPermission = menuPerms.some(
              p => p.menu_code.toUpperCase() === parentCode.toUpperCase() && p.can_view
            );
            if (parentHasPermission) return true;
          }
          
          return false;
        };

        // Priority order for landing page
        const priorityMenus = [
          { code: 'PKSI_ALL', path: '/pksi-list' },
          { code: 'PKSI', path: '/pksi-list' },
          { code: 'PKSI_APPROVED', path: '/pksi-disetujui' },
          { code: 'RBSI_MONITORING', path: '/rbsi' },
          { code: 'RBSI', path: '/rbsi' },
          { code: 'RBSI_ARCHITECTURE', path: '/rbsi-arsitektur' },
          { code: 'RBSI_DASHBOARD', path: '/rbsi-dashboard' },
          { code: 'USER_MANAGEMENT', path: '/admin/user-roles' },
          { code: 'USER_ROLES', path: '/admin/user-roles' },
          { code: 'ROLE_PERMISSIONS', path: '/admin/role-permissions' },
        ];

        // Find first menu the user has permission to view
        for (const menu of priorityMenus) {
          if (hasViewPermission(menu.code)) {
            console.log('[SmartLanding] Redirecting to:', menu.path, 'based on menu code:', menu.code);
            setRedirectPath(menu.path);
            setLoading(false);
            return;
          }
        }

        // Fallback - go to PKSI list and let route handle permission
        setRedirectPath('/pksi-list');
      } catch (error) {
        console.error('Failed to determine landing page:', error);
        setRedirectPath('/pksi-list');
      } finally {
        setLoading(false);
      }
    };

    determineRedirect();
  }, []);

  if (loading) {
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

  if (redirectPath) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // No redirect path means no role - this shouldn't happen but fallback
  return <Navigate to="/login" replace />;
};

export default SmartLanding;
