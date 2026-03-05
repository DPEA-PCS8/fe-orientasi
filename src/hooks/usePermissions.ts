import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserRoles, isAdmin } from '../api/authApi';
import { getMyPermissions } from '../api/rolePermissionApi';
import type { MenuPermissionItem } from '../types/rbac.types';

export interface PermissionCheck {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface UsePermissionsReturn {
  permissions: MenuPermissionItem[];
  permissionsLoaded: boolean;
  isUserAdmin: boolean;
  hasPermission: (menuCode: string, type: 'view' | 'create' | 'update' | 'delete') => boolean;
  getMenuPermissions: (menuCode: string) => PermissionCheck;
  refreshPermissions: () => Promise<void>;
}

/**
 * Custom hook for checking user permissions
 * Provides functions to check View, Create, Update, Delete permissions for any menu
 */
export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<MenuPermissionItem[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const isUserAdmin = useMemo(() => isAdmin(), []);

  const loadPermissions = useCallback(async () => {
    try {
      const roles = getUserRoles();
      if (roles.length > 0) {
        const permissionsData = await getMyPermissions(roles);
        setPermissions(permissionsData.menu_permissions || []);
      }
    } catch (error) {
      console.warn('Failed to load user permissions:', error);
      setPermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Find permission for menu code, with fallback to parent menu
   */
  const findPermission = useCallback(
    (menuCode: string): MenuPermissionItem | undefined => {
      // First try to find direct permission
      const directPermission = permissions.find(
        p => p.menu_code.toUpperCase() === menuCode.toUpperCase()
      );
      
      if (directPermission) return directPermission;
      
      // If not found and this is a child menu, try parent menu
      const menuCodeParts = menuCode.split('_');
      if (menuCodeParts.length > 1) {
        const parentCode = menuCodeParts[0];
        return permissions.find(
          p => p.menu_code.toUpperCase() === parentCode.toUpperCase()
        );
      }
      
      return undefined;
    },
    [permissions]
  );

  /**
   * Check if user has specific permission for a menu
   */
  const hasPermission = useCallback(
    (menuCode: string, type: 'view' | 'create' | 'update' | 'delete'): boolean => {
      // Admin always has all permissions
      if (isUserAdmin) return true;

      // If permissions not loaded, return false (safer default)
      if (!permissionsLoaded) return false;

      const permission = findPermission(menuCode);

      if (!permission) return false;

      switch (type) {
        case 'view':
          return permission.can_view;
        case 'create':
          return permission.can_create;
        case 'update':
          return permission.can_update;
        case 'delete':
          return permission.can_delete;
        default:
          return false;
      }
    },
    [findPermission, permissionsLoaded, isUserAdmin]
  );

  /**
   * Get all permission flags for a specific menu
   */
  const getMenuPermissions = useCallback(
    (menuCode: string): PermissionCheck => {
      // Admin has all permissions
      if (isUserAdmin) {
        return {
          canView: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        };
      }

      const permission = findPermission(menuCode);

      return {
        canView: permission?.can_view ?? false,
        canCreate: permission?.can_create ?? false,
        canUpdate: permission?.can_update ?? false,
        canDelete: permission?.can_delete ?? false,
      };
    },
    [findPermission, isUserAdmin]
  );

  return {
    permissions,
    permissionsLoaded,
    isUserAdmin,
    hasPermission,
    getMenuPermissions,
    refreshPermissions: loadPermissions,
  };
}

export default usePermissions;
