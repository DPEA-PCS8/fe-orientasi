import { getAuthToken } from './authApi';
import type {
  Menu,
  MenuTree,
  RolePermissionMatrix,
  RolePermissionResponse,
  BulkRolePermissionRequest,
  CreateMenuRequest,
  BaseApiResponse,
} from '../types/rbac.types';

const API_KEY = 'da39b92f-a1b8-46d5-a10c-d08b1cc92218';

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'APIKey': API_KEY,
    'Authorization': `Bearer ${token}`,
  };
}

// ========== MENU ENDPOINTS ==========

export async function getAllMenus(): Promise<Menu[]> {
  const response = await fetch('/api/role-permissions/menus', {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    try {
      const data = await response.json();
      throw new Error(data.message || `Failed to fetch menus: ${response.status}`);
    } catch {
      throw new Error(`Failed to fetch menus: ${response.status} ${response.statusText}`);
    }
  }
  
  const data: BaseApiResponse<Menu[]> = await response.json();
  return data.data || [];
}

export async function getMenuTree(): Promise<MenuTree[]> {
  const response = await fetch('/api/role-permissions/menus/tree', {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<MenuTree[]> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch menu tree');
  return data.data;
}

export async function getMenuById(menuId: string): Promise<Menu> {
  const response = await fetch(`/api/role-permissions/menus/${menuId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<Menu> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch menu');
  return data.data;
}

export async function createMenu(request: CreateMenuRequest): Promise<Menu> {
  const response = await fetch('/api/role-permissions/menus', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  const data: BaseApiResponse<Menu> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create menu');
  return data.data;
}

export async function updateMenu(menuId: string, request: CreateMenuRequest): Promise<Menu> {
  const response = await fetch(`/api/role-permissions/menus/${menuId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  const data: BaseApiResponse<Menu> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update menu');
  return data.data;
}

export async function deleteMenu(menuId: string): Promise<void> {
  const response = await fetch(`/api/role-permissions/menus/${menuId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<null> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete menu');
}

// ========== PERMISSION ENDPOINTS ==========

export async function getPermissionsByRole(roleId: string): Promise<RolePermissionResponse[]> {
  const response = await fetch(`/api/role-permissions/permissions/role/${roleId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<RolePermissionResponse[]> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch permissions');
  return data.data;
}

export async function getPermissionMatrix(roleId: string): Promise<RolePermissionMatrix> {
  const response = await fetch(`/api/role-permissions/matrix/${roleId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<RolePermissionMatrix> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch permission matrix');
  return data.data;
}

export async function getAllPermissionMatrices(): Promise<RolePermissionMatrix[]> {
  const response = await fetch('/api/role-permissions/matrix', {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    // Try to parse error message from response
    try {
      const data = await response.json();
      throw new Error(data.message || `Failed to fetch permission matrices: ${response.status}`);
    } catch {
      throw new Error(`Failed to fetch permission matrices: ${response.status} ${response.statusText}`);
    }
  }
  
  const data: BaseApiResponse<RolePermissionMatrix[]> = await response.json();
  return data.data || [];
}

export async function bulkUpdatePermissions(request: BulkRolePermissionRequest): Promise<RolePermissionResponse[]> {
  const response = await fetch('/api/role-permissions/permissions/bulk', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  const data: BaseApiResponse<RolePermissionResponse[]> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update permissions');
  return data.data;
}

export async function deletePermission(roleId: string, menuId: string): Promise<void> {
  const response = await fetch(`/api/role-permissions/permissions/role/${roleId}/menu/${menuId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<null> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete permission');
}

export async function checkPermission(
  roleName: string,
  menuCode: string,
  permissionType: 'view' | 'create' | 'update' | 'delete'
): Promise<boolean> {
  const response = await fetch(
    `/api/role-permissions/check?roleName=${encodeURIComponent(roleName)}&menuCode=${encodeURIComponent(menuCode)}&permissionType=${permissionType}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );
  const data: BaseApiResponse<boolean> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to check permission');
  return data.data;
}

export async function getMyPermissions(roles: string[]): Promise<RolePermissionMatrix> {
  const rolesParam = roles.map(r => `roles=${encodeURIComponent(r)}`).join('&');
  const response = await fetch(`/api/role-permissions/my-permissions?${rolesParam}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<RolePermissionMatrix> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to get user permissions');
  return data.data;
}
