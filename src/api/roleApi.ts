import { getAuthToken } from './authApi';
import type {
  Role,
  UserWithRoles,
  CreateRoleRequest,
  AssignRoleRequest,
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

// ========== ROLE MANAGEMENT ==========

export async function getAllRoles(): Promise<Role[]> {
  const response = await fetch('/api/roles', {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<Role[]> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch roles');
  return data.data;
}

export async function getRoleById(roleId: string): Promise<Role> {
  const response = await fetch(`/api/roles/${roleId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<Role> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch role');
  return data.data;
}

export async function createRole(request: CreateRoleRequest): Promise<Role> {
  const response = await fetch('/api/roles', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  const data: BaseApiResponse<Role> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create role');
  return data.data;
}

export async function updateRole(roleId: string, request: CreateRoleRequest): Promise<Role> {
  const response = await fetch(`/api/roles/${roleId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  const data: BaseApiResponse<Role> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update role');
  return data.data;
}

export async function deleteRole(roleId: string): Promise<void> {
  const response = await fetch(`/api/roles/${roleId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<null> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete role');
}

// ========== USER-ROLE ASSIGNMENT ==========

export async function getAllUsersWithRoles(): Promise<UserWithRoles[]> {
  const response = await fetch('/api/roles/users', {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<UserWithRoles[]> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
  return data.data;
}

export async function getUserWithRoles(userUuid: string): Promise<UserWithRoles> {
  const response = await fetch(`/api/roles/users/${userUuid}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<UserWithRoles> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch user');
  return data.data;
}

export async function assignRolesToUser(request: AssignRoleRequest): Promise<UserWithRoles> {
  const response = await fetch('/api/roles/assign', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  const data: BaseApiResponse<UserWithRoles> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to assign roles');
  return data.data;
}

export async function removeRoleFromUser(userUuid: string, roleId: string): Promise<void> {
  const response = await fetch(`/api/roles/users/${userUuid}/roles/${roleId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data: BaseApiResponse<null> = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to remove role');
}
