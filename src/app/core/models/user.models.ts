export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
}

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface AssignRolesRequest {
  roles: string[];
}
