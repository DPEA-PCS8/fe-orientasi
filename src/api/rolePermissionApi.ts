import { apiRequest } from './apiClient';
import type {
  Menu,
  MenuTree,
  RolePermissionMatrix,
  RolePermissionResponse,
  BulkRolePermissionRequest,
  CreateMenuRequest,
} from '../types/rbac.types';

// ========== MENU ENDPOINTS ==========

export async function getAllMenus(): Promise<Menu[]> {
  const response = await apiRequest<Menu[]>('/api/role-permissions/menus', 'GET');
  return response.data || [];
}

export async function getMenuTree(): Promise<MenuTree[]> {
  const response = await apiRequest<MenuTree[]>('/api/role-permissions/menus/tree', 'GET');
  return response.data;
}

export async function getMenuById(menuId: string): Promise<Menu> {
  const response = await apiRequest<Menu>(`/api/role-permissions/menus/${menuId}`, 'GET');
  return response.data;
}

export async function createMenu(request: CreateMenuRequest): Promise<Menu> {
  const response = await apiRequest<Menu>('/api/role-permissions/menus', 'POST', request);
  return response.data;
}

export async function updateMenu(menuId: string, request: CreateMenuRequest): Promise<Menu> {
  const response = await apiRequest<Menu>(`/api/role-permissions/menus/${menuId}`, 'PUT', request);
  return response.data;
}

export async function deleteMenu(menuId: string): Promise<void> {
  await apiRequest<null>(`/api/role-permissions/menus/${menuId}`, 'DELETE');
}

// ========== PERMISSION ENDPOINTS ==========

export async function getPermissionsByRole(roleId: string): Promise<RolePermissionResponse[]> {
  const response = await apiRequest<RolePermissionResponse[]>(`/api/role-permissions/permissions/role/${roleId}`, 'GET');
  return response.data;
}

export async function getPermissionMatrix(roleId: string): Promise<RolePermissionMatrix> {
  const response = await apiRequest<RolePermissionMatrix>(`/api/role-permissions/matrix/${roleId}`, 'GET');
  return response.data;
}

export async function getAllPermissionMatrices(): Promise<RolePermissionMatrix[]> {
  const response = await apiRequest<RolePermissionMatrix[]>('/api/role-permissions/matrix', 'GET');
  return response.data || [];
}

export async function bulkUpdatePermissions(request: BulkRolePermissionRequest): Promise<RolePermissionResponse[]> {
  console.log('[bulkUpdatePermissions] Request:', JSON.stringify(request, null, 2));
  const response = await apiRequest<RolePermissionResponse[]>('/api/role-permissions/permissions/bulk', 'POST', request);
  console.log('[bulkUpdatePermissions] Response:', response);
  return response.data;
}

export async function deletePermission(roleId: string, menuId: string): Promise<void> {
  await apiRequest<null>(`/api/role-permissions/permissions/role/${roleId}/menu/${menuId}`, 'DELETE');
}

export async function checkPermission(
  roleName: string,
  menuCode: string,
  permissionType: 'view' | 'create' | 'update' | 'delete'
): Promise<boolean> {
  const response = await apiRequest<boolean>(
    `/api/role-permissions/check?roleName=${encodeURIComponent(roleName)}&menuCode=${encodeURIComponent(menuCode)}&permissionType=${permissionType}`,
    'GET'
  );
  return response.data;
}

export async function getMyPermissions(roles: string[]): Promise<RolePermissionMatrix> {
  const rolesParam = roles.map(r => `roles=${encodeURIComponent(r)}`).join('&');
  console.log('[getMyPermissions] Requesting permissions for roles:', roles);
  console.log('[getMyPermissions] URL:', `/api/role-permissions/my-permissions?${rolesParam}`);
  const response = await apiRequest<RolePermissionMatrix>(`/api/role-permissions/my-permissions?${rolesParam}`, 'GET');
  console.log('[getMyPermissions] Response:', response);
  return response.data;
}
