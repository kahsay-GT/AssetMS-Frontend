import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Asset, AssetListItem, AssetHistory, AssetDocument,
  AssetFilterParams, PagedResult,
  AssetCategory
} from '../models/asset.models';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/assets`;

  getAssets(filter: AssetFilterParams = {}): Observable<PagedResult<AssetListItem>> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PagedResult<AssetListItem>>(this.base, { params });
  }

  getAsset(id: string): Observable<Asset> {
    return this.http.get<Asset>(`${this.base}/${id}`);
  }

  createAsset(data: any): Observable<Asset> {
    return this.http.post<Asset>(this.base, data);
  }

  updateAsset(id: string, data: any): Observable<Asset> {
    return this.http.put<Asset>(`${this.base}/${id}`, data);
  }

  changeStatus(id: string, newStatus: number, notes?: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, { newStatus, notes });
  }

  assignAsset(id: string, organizationUnitId: string, notes?: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/assign`, { organizationUnitId, notes });
  }

  archiveAsset(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/archive`, {});
  }

  deleteAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getHistory(id: string): Observable<AssetHistory[]> {
    return this.http.get<AssetHistory[]>(`${this.base}/${id}/history`);
  }

  getDocuments(id: string): Observable<AssetDocument[]> {
    return this.http.get<AssetDocument[]>(`${this.base}/${id}/documents`);
  }

  uploadDocument(id: string, file: File, documentType: string, description?: string): Observable<AssetDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    if (description) form.append('description', description);
    return this.http.post<AssetDocument>(`${this.base}/${id}/documents`, form);
  }

  getDocumentDownloadUrl(assetId: string, documentId: string): string {
    return `${this.base}/${assetId}/documents/${documentId}/download`;
  }

  deleteDocument(assetId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${assetId}/documents/${documentId}`);
  }
}
