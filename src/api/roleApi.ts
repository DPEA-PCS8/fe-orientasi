import { apiRequest, getAuthHeaders, type BaseApiResponse } from './apiClient';
import type {
  Role,
  UserWithRoles,
  CreateRoleRequest,
  AssignRoleRequest,
} from '../types/rbac.types';

// ========== ROLE MANAGEMENT ==========

export async function getAllRoles(): Promise<Role[]> {
  const response = await apiRequest<Role[]>('/api/roles', 'GET');
  return response.data;
}

export async function getRoleById(roleId: string): Promise<Role> {
  const response = await apiRequest<Role>(`/api/roles/${roleId}`, 'GET');
  return response.data;
}

export async function createRole(request: CreateRoleRequest): Promise<Role> {
  const response = await apiRequest<Role>('/api/roles', 'POST', request);
  return response.data;
}

export async function updateRole(roleId: string, request: CreateRoleRequest): Promise<Role> {
  const response = await apiRequest<Role>(`/api/roles/${roleId}`, 'PUT', request);
  return response.data;
}

export async function deleteRole(roleId: string): Promise<void> {
  await apiRequest<null>(`/api/roles/${roleId}`, 'DELETE');
}

// ========== USER-ROLE ASSIGNMENT ==========

export async function getAllUsersWithRoles(): Promise<UserWithRoles[]> {
  const response = await apiRequest<UserWithRoles[]>('/api/roles/users', 'GET');
  return response.data;
}

export async function getUserWithRoles(userUuid: string): Promise<UserWithRoles> {
  const response = await apiRequest<UserWithRoles>(`/api/roles/users/${userUuid}`, 'GET');
  return response.data;
}

export async function assignRolesToUser(request: AssignRoleRequest): Promise<UserWithRoles> {
  const response = await apiRequest<UserWithRoles>('/api/roles/assign', 'POST', request);
  return response.data;
}

export async function removeRoleFromUser(userUuid: string, roleId: string): Promise<void> {
  await apiRequest<null>(`/api/roles/users/${userUuid}/roles/${roleId}`, 'DELETE');
}
