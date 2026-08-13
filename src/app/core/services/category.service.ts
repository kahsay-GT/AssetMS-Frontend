import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssetCategory, PagedResult } from '../models/asset.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/asset-categories`;

  getAll(): Observable<AssetCategory[]> {
    return this.http.get<AssetCategory[]>(`${this.base}/all`);
  }

  getPaged(page = 1, pageSize = 20, search = '', isActive?: boolean): Observable<PagedResult<AssetCategory>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('isActive', String(isActive));
    return this.http.get<PagedResult<AssetCategory>>(this.base, { params });
  }

  create(data: { name: string; description?: string }): Observable<AssetCategory> {
    return this.http.post<AssetCategory>(this.base, data);
  }

  update(id: string, data: { name: string; description?: string }): Observable<AssetCategory> {
    return this.http.put<AssetCategory>(`${this.base}/${id}`, data);
  }

  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/permanent`);
  }
}
