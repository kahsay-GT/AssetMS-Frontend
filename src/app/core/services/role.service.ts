import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RoleDto, PermissionGroupDto, PermissionDto,
  CreateRoleRequest, UpdateRoleRequest
} from '../models/role.models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/roles`;

  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(this.base);
  }

  getRole(id: string): Observable<RoleDto> {
    return this.http.get<RoleDto>(`${this.base}/${id}`);
  }

  getPermissionsGrouped(): Observable<PermissionGroupDto[]> {
    return this.http.get<PermissionGroupDto[]>(`${this.base}/permissions`);
  }

  getPermissions(): Observable<PermissionDto[]> {
    return this.http.get<PermissionDto[]>(`${this.base}/permissions/all`);
  }

  createRole(data: CreateRoleRequest): Observable<RoleDto> {
    return this.http.post<RoleDto>(this.base, data);
  }

  updateRole(id: string, data: UpdateRoleRequest): Observable<RoleDto> {
    return this.http.put<RoleDto>(`${this.base}/${id}`, data);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
