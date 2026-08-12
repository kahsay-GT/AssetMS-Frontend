import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OrganizationUnit,
  CreateOrganizationUnitRequest,
  UpdateOrganizationUnitRequest,
  MoveOrganizationUnitRequest
} from '../models/organization.models';
import { PagedResult } from '../models/asset.models';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organization-units`;

  getTree(includeInactive = false): Observable<OrganizationUnit[]> {
    return this.http.get<OrganizationUnit[]>(`${this.base}/tree`, {
      params: { includeInactive: String(includeInactive) }
    });
  }

  getUnits(page = 1, pageSize = 20, search = '', isActive = true): Observable<PagedResult<OrganizationUnit>> {
    let params = new HttpParams()
      .set('page', page).set('pageSize', pageSize).set('isActive', String(isActive));
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<OrganizationUnit>>(this.base, { params });
  }

  getUnit(id: string): Observable<OrganizationUnit> {
    return this.http.get<OrganizationUnit>(`${this.base}/${id}`);
  }

  create(data: CreateOrganizationUnitRequest): Observable<OrganizationUnit> {
    return this.http.post<OrganizationUnit>(this.base, data);
  }

  update(id: string, data: UpdateOrganizationUnitRequest): Observable<OrganizationUnit> {
    return this.http.put<OrganizationUnit>(`${this.base}/${id}`, data);
  }

  move(id: string, data: MoveOrganizationUnitRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/move`, data);
  }

  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
