import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, CreateUserRequest, UpdateUserRequest, AssignRolesRequest } from '../models/user.models';
import { PagedResult } from '../models/asset.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  getUsers(page = 1, pageSize = 20, search = ''): Observable<PagedResult<User>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<User>>(this.base, { params });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(data: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.base, data);
  }

  update(id: string, data: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}`, data);
  }

  deactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/reactivate`, {});
  }

  assignRoles(id: string, data: AssignRolesRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/roles`, data);
  }
}
