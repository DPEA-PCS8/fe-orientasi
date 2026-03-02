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

// ========== MENU & PERMISSIONS ==========

export interface Menu {
  id: string;
  menu_code: string;
  menu_name: string;
  description: string;
  parent_id: string | null;
  parent_name: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuTree extends Menu {
  children: MenuTree[];
}

export interface MenuPermissionItem {
  menu_id: string;
  menu_code: string;
  menu_name: string;
  parent_id: string | null;
  parent_name: string | null;
  display_order: number;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface RolePermissionMatrix {
  role_id: string;
  role_name: string;
  role_description: string;
  menu_permissions: MenuPermissionItem[];
}

export interface RolePermissionResponse {
  id: string;
  role_id: string;
  role_name: string;
  menu_id: string;
  menu_code: string;
  menu_name: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuRequest {
  menu_code: string;
  menu_name: string;
  description?: string;
  parent_id?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface MenuPermission {
  menu_id: string;
  can_view?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
}

export interface BulkRolePermissionRequest {
  role_id: string;
  permissions: MenuPermission[];
}
