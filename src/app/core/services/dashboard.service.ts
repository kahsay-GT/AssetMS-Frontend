import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardData {
  totalAssets: number;
  activeAssets: number;
  underMaintenanceAssets: number;
  retiredDisposedAssets: number;
  totalOrganizationUnits: number;
  activeOrganizationUnits: number;
  totalCategories: number;
  recentlyAddedAssets: RecentAsset[];
  recentlyChangedAssets: RecentAsset[];
  assetsByStatus: StatusSummary[];
  assetsByCategory: CategorySummary[];
}

export interface RecentAsset {
  id: string;
  assetNumber: string;
  name: string;
  status: string;
  organizationUnit: string;
  date: string;
}

export interface StatusSummary { status: string; count: number; }
export interface CategorySummary { category: string; count: number; }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${environment.apiUrl}/dashboard`);
  }
}
