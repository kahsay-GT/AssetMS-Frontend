export interface PermissionDto {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description?: string;
}

export interface PermissionGroupDto {
  category: string;
  permissions: PermissionDto[];
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  userCount: number;
  permissions: string[];
  permissionIds: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  description?: string;
  permissionIds: string[];
}
