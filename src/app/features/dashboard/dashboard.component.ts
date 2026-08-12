import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule,
    MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule
  ],
  template: `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">{{ greeting }}, {{ currentUser?.firstName }}. Here's what's happening today.</p>
      </div>
      <a mat-raised-button color="primary" routerLink="/assets/new" *ngIf="canManage">
        <mat-icon>add</mat-icon> New Asset
      </a>
    </div>

    @if (loading) {
      <div class="loading-grid">
        @for (i of [1,2,3,4]; track i) {
          <div class="skeleton-card"></div>
        }
      </div>
    } @else if (data) {
      <!-- Stat Cards -->
      <div class="stats-grid fade-in">
        @for (card of statCards; track card.label) {
          <a class="stat-card" [routerLink]="card.route">
            <div class="stat-icon" [style.background]="card.iconBg">
              <mat-icon [style.color]="card.iconColor">{{ card.icon }}</mat-icon>
            </div>
            <div class="stat-body">
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-value">{{ card.value }}</div>
              @if (card.sub) { <div class="stat-delta">{{ card.sub }}</div> }
            </div>
          </a>
        }
      </div>

      <!-- Charts + Recent -->
      <div class="dashboard-grid fade-in">

        <!-- Assets by Status -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title-row">
              <mat-icon class="card-icon" style="color:#4f46e5">donut_large</mat-icon>
              <h3 class="card-title">Assets by Status</h3>
            </div>
          </div>
          <div class="card-body">
            @if (data.assetsByStatus.length === 0) {
              <p class="text-slate-400 text-sm text-center py-4">No data</p>
            }
            @for (s of data.assetsByStatus; track s.status) {
              <div class="chart-row">
                <div class="chart-row-label">
                  <span class="chart-dot" [style.background]="statusColor(s.status)"></span>
                  <span>{{ s.status }}</span>
                </div>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" [style.width.%]="pct(s.count, data!.totalAssets)"
                      [style.background]="statusColor(s.status)"></div>
                  </div>
                </div>
                <span class="chart-count">{{ s.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Assets by Category -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title-row">
              <mat-icon class="card-icon" style="color:#0891b2">category</mat-icon>
              <h3 class="card-title">Assets by Category</h3>
            </div>
          </div>
          <div class="card-body">
            @for (c of data.assetsByCategory.slice(0,7); track c.category) {
              <div class="chart-row">
                <div class="chart-row-label">
                  <span class="chart-dot" style="background:#6366f1"></span>
                  <span>{{ c.category }}</span>
                </div>
                <div class="chart-bar-wrap">
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" [style.width.%]="pct(c.count, data!.totalAssets)"
                      style="background:#6366f1"></div>
                  </div>
                </div>
                <span class="chart-count">{{ c.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Recently Added -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title-row">
              <mat-icon class="card-icon" style="color:#059669">schedule</mat-icon>
              <h3 class="card-title">Recently Added</h3>
            </div>
            <a mat-button color="primary" routerLink="/assets" class="view-all-btn">View all</a>
          </div>
          <div class="activity-list">
            @if (data.recentlyAddedAssets.length === 0) {
              <div class="empty-row">No recent assets</div>
            }
            @for (a of data.recentlyAddedAssets; track a.id) {
              <a [routerLink]="['/assets', a.id]" class="activity-item">
                <div class="activity-avatar" style="background:#dbeafe;color:#1d4ed8">
                  <mat-icon>devices</mat-icon>
                </div>
                <div class="activity-body">
                  <p class="activity-title">{{ a.name }}</p>
                  <p class="activity-sub">{{ a.assetNumber }} · {{ a.organizationUnit }}</p>
                </div>
                <span class="activity-date">{{ a.date | date:'MMM d' }}</span>
              </a>
            }
          </div>
        </div>

        <!-- Recently Changed -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title-row">
              <mat-icon class="card-icon" style="color:#d97706">update</mat-icon>
              <h3 class="card-title">Recently Changed</h3>
            </div>
            <a mat-button color="primary" routerLink="/assets" class="view-all-btn">View all</a>
          </div>
          <div class="activity-list">
            @if (data.recentlyChangedAssets.length === 0) {
              <div class="empty-row">No recent changes</div>
            }
            @for (a of data.recentlyChangedAssets; track a.id) {
              <a [routerLink]="['/assets', a.id]" class="activity-item">
                <div class="activity-avatar" style="background:#fef3c7;color:#b45309">
                  <mat-icon>edit</mat-icon>
                </div>
                <div class="activity-body">
                  <p class="activity-title">{{ a.name }}</p>
                  <p class="activity-sub">{{ a.status }} · {{ a.organizationUnit }}</p>
                </div>
                <span class="activity-date">{{ a.date | date:'MMM d' }}</span>
              </a>
            }
          </div>
        </div>

      </div>
    } @else if (error) {
      <div class="empty-state">
        <div class="empty-icon"><mat-icon>error_outline</mat-icon></div>
        <h3>Failed to load dashboard</h3>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="load()" class="mt-4">Retry</button>
      </div>
    }
  `,
  styles: [`
    .loading-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
    }
    .skeleton-card {
      height: 100px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%; border-radius: 10px;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
    }

    .stat-card {
      text-decoration: none;
      display: flex; align-items: center; gap: 16px;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: box-shadow 0.2s, transform 0.2s;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); }
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .stat-label { font-size: 11.5px; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
    .stat-value { font-size: 30px; font-weight: 800; color: #0f172a; line-height: 1; }
    .stat-delta { font-size: 12px; color: #94a3b8; margin-top: 4px; }

    .dashboard-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
    }

    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
    }
    .card-title-row { display: flex; align-items: center; gap: 8px; }
    .card-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
    .card-title { font-size: 14px; font-weight: 600; color: #0f172a; margin: 0; }
    .view-all-btn { font-size: 12.5px !important; height: 32px !important; line-height: 32px !important; }
    .card-body { padding: 12px 20px 16px; display: flex; flex-direction: column; gap: 10px; }

    .chart-row { display: flex; align-items: center; gap: 10px; }
    .chart-row-label {
      display: flex; align-items: center; gap: 7px;
      font-size: 12.5px; color: #475569; width: 130px; flex-shrink: 0;
    }
    .chart-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .chart-bar-wrap { flex: 1; }
    .chart-bar-track { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
    .chart-bar-fill  { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
    .chart-count     { font-size: 12.5px; font-weight: 600; color: #334155; width: 28px; text-align: right; }

    .activity-list { display: flex; flex-direction: column; }
    .activity-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; border-bottom: 1px solid #f8fafc;
      text-decoration: none; transition: background 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: #f8fafc; }
    }
    .activity-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .activity-body  { flex: 1; min-width: 0; }
    .activity-title { font-size: 13.5px; font-weight: 500; color: #0f172a; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .activity-sub   { font-size: 12px; color: #94a3b8; margin: 0; }
    .activity-date  { font-size: 12px; color: #cbd5e1; flex-shrink: 0; }
    .empty-row      { padding: 24px 20px; text-align: center; font-size: 13px; color: #94a3b8; }

    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px)  { .stats-grid, .dashboard-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  private svc    = inject(DashboardService);
  private notify = inject(NotificationService);
  private auth   = inject(AuthService);

  data: DashboardData | null = null;
  loading = true;
  error   = '';

  get currentUser()  { return this.auth.currentUser; }
  get canManage()    { return this.auth.hasAnyRole('Manager', 'Administrator'); }
  get greeting()     {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  get statCards() {
    if (!this.data) return [];
    return [
      { label:'Total Assets',       value: this.data.totalAssets,             icon:'devices',       iconBg:'#ede9fe', iconColor:'#7c3aed', route:'/assets', sub:`${this.data.totalCategories} categories` },
      { label:'Active & Assigned',  value: this.data.activeAssets,            icon:'check_circle',  iconBg:'#dcfce7', iconColor:'#15803d', route:'/assets', sub:'Currently in use' },
      { label:'Under Maintenance',  value: this.data.underMaintenanceAssets,  icon:'build',         iconBg:'#fef3c7', iconColor:'#b45309', route:'/assets', sub:'Require attention' },
      { label:'Org Units',          value: this.data.activeOrganizationUnits, icon:'account_tree',  iconBg:'#dbeafe', iconColor:'#1d4ed8', route:'/organization', sub:`${this.data.totalOrganizationUnits} total` },
    ];
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getDashboard().subscribe({
      next:  d => { this.data = d; this.loading = false; },
      error: e => { this.error = 'Unable to load dashboard data.'; this.loading = false; this.notify.apiError(e); }
    });
  }

  pct(n: number, total: number): number { return total ? Math.round((n / total) * 100) : 0; }

  statusColor(status: string): string {
    const m: Record<string, string> = {
      Active: '#15803d', Assigned: '#1d4ed8', InStorage: '#7c3aed',
      UnderMaintenance: '#b45309', Lost: '#be123c', Damaged: '#b91c1c',
      Retired: '#475569', Disposed: '#94a3b8'
    };
    return m[status] ?? '#94a3b8';
  }
}
