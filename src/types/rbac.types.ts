// RBAC Type Definitions
export interface Role {
  id: string;
  roleName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRoles {
  uuid: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  title: string;
  lastLoginAt: string;
  roles: Role[];
  hasRole: boolean;
}

export interface CreateRoleRequest {
  roleName: string;
  description: string;
}

export interface AssignRoleRequest {
  userUuid: string;
  roleIds: string[];
}

export interface BaseApiResponse<T> {
  status: number;
  message: string;
  data: T;
}
