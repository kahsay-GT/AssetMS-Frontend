import {
  Component, OnInit, OnDestroy, AfterViewInit,
  inject, ElementRef, ViewChild, ViewChildren, QueryList
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <!-- Page header -->
    <div class="db-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">{{ greeting }}, {{ currentUser?.firstName }}. Here's your asset overview.</p>
      </div>
      @if (canManage) {
        <a mat-raised-button color="primary" routerLink="/assets/new">
          <mat-icon>add</mat-icon> New Asset
        </a>
      }
    </div>

    @if (loading) {
      <!-- Skeleton loading -->
      <div class="skeleton-grid">
        @for (i of [1,2,3,4]; track i) {
          <div class="skeleton-card"></div>
        }
      </div>
      <div class="skeleton-charts">
        <div class="skeleton-card-lg"></div>
        <div class="skeleton-card-lg"></div>
      </div>
    } @else if (data) {

      <!-- ── Stat cards ─────────────────────────────────────────── -->
      <div class="stat-grid fade-in">
        @for (card of statCards; track card.label) {
          <a class="stat-card" [routerLink]="card.route">
            <div class="stat-icon-wrap" [style.background]="card.bg">
              <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
            </div>
            <div class="stat-body">
              <p class="stat-label">{{ card.label }}</p>
              <p class="stat-value">{{ card.value }}</p>
              @if (card.sub) {
                <p class="stat-sub">{{ card.sub }}</p>
              }
            </div>
            <div class="stat-trend" [style.color]="card.color">
              <mat-icon>trending_up</mat-icon>
            </div>
          </a>
        }
      </div>

      <!-- ── Charts row 1 ───────────────────────────────────────── -->
      <div class="charts-row fade-in">

        <!-- Donut: Assets by Status -->
        <div class="chart-card chart-donut-card">
          <div class="chart-card-header">
            <div class="chart-card-title-row">
              <div class="chart-title-icon" style="background:#ede9fe;">
                <mat-icon style="color:#7c3aed;">donut_large</mat-icon>
              </div>
              <div>
                <h3 class="chart-title">Assets by Status</h3>
                <p class="chart-subtitle">Current distribution</p>
              </div>
            </div>
          </div>
          <div class="chart-card-body donut-layout">
            <div class="donut-wrap">
              <canvas #statusDonut></canvas>
              <div class="donut-center">
                <span class="donut-total">{{ data.totalAssets }}</span>
                <span class="donut-label">Total</span>
              </div>
            </div>
            <div class="donut-legend">
              @for (item of statusLegend; track item.label) {
                <div class="legend-item">
                  <span class="legend-dot" [style.background]="item.color"></span>
                  <span class="legend-label">{{ item.label }}</span>
                  <span class="legend-val">{{ item.value }}</span>
                  <span class="legend-pct">{{ pct(item.value, data.totalAssets) }}%</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Bar: Assets by Category -->
        <div class="chart-card chart-bar-card">
          <div class="chart-card-header">
            <div class="chart-card-title-row">
              <div class="chart-title-icon" style="background:#dbeafe;">
                <mat-icon style="color:#1d4ed8;">bar_chart</mat-icon>
              </div>
              <div>
                <h3 class="chart-title">Assets by Category</h3>
                <p class="chart-subtitle">Quantity per category</p>
              </div>
            </div>
          </div>
          <div class="chart-card-body">
            <canvas #categoryBar style="max-height:220px;"></canvas>
          </div>
        </div>

      </div>

      <!-- ── Charts row 2 ───────────────────────────────────────── -->
      <div class="charts-row fade-in">

        <!-- Horizontal bar: Maintenance & status breakdown -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title-row">
              <div class="chart-title-icon" style="background:#fef3c7;">
                <mat-icon style="color:#b45309;">analytics</mat-icon>
              </div>
              <div>
                <h3 class="chart-title">Status Overview</h3>
                <p class="chart-subtitle">Count per status type</p>
              </div>
            </div>
          </div>
          <div class="chart-card-body">
            <canvas #statusBar style="max-height:220px;"></canvas>
          </div>
        </div>

        <!-- Recent activity feed -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div class="chart-card-title-row">
              <div class="chart-title-icon" style="background:#dcfce7;">
                <mat-icon style="color:#15803d;">timeline</mat-icon>
              </div>
              <div>
                <h3 class="chart-title">Recent Activity</h3>
                <p class="chart-subtitle">Latest asset changes</p>
              </div>
            </div>
            <a mat-button routerLink="/assets" style="font-size:12px;">View all</a>
          </div>
          <div class="activity-feed">
            @if (data.recentlyChangedAssets.length === 0) {
              <div class="activity-empty">No recent activity</div>
            }
            @for (a of data.recentlyChangedAssets; track a.id) {
              <a [routerLink]="['/assets', a.id]" class="activity-row">
                <div class="activity-icon">
                  <mat-icon>devices</mat-icon>
                </div>
                <div class="activity-info">
                  <p class="activity-name">{{ a.name }}</p>
                  <p class="activity-meta">{{ a.status }} · {{ a.organizationUnit }}</p>
                </div>
                <span class="activity-time">{{ a.date | date:'MMM d' }}</span>
              </a>
            }
          </div>
        </div>

      </div>

      <!-- ── Bottom row: Mini KPI cards ─────────────────────────── -->
      <div class="kpi-row fade-in">
        @for (kpi of kpiCards; track kpi.label) {
          <div class="kpi-card">
            <mat-icon [style.color]="kpi.color">{{ kpi.icon }}</mat-icon>
            <div class="kpi-body">
              <span class="kpi-value" [style.color]="kpi.color">{{ kpi.value }}</span>
              <span class="kpi-label">{{ kpi.label }}</span>
            </div>
          </div>
        }
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
    /* ── Header ──────────────────────────────────────────── */
    .db-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }

    /* ── Skeletons ───────────────────────────────────────── */
    .skeleton-grid {
      display: grid; grid-template-columns: repeat(4,1fr); gap:16px; margin-bottom:20px;
    }
    .skeleton-charts {
      display: grid; grid-template-columns: repeat(2,1fr); gap:20px; margin-bottom:20px;
    }
    .skeleton-card    { height:100px; border-radius:10px; }
    .skeleton-card-lg { height:300px; border-radius:10px; }
    .skeleton-card, .skeleton-card-lg {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Stat cards ──────────────────────────────────────── */
    .stat-grid {
      display: grid; grid-template-columns: repeat(4,1fr);
      gap: 16px; margin-bottom: 20px;
    }

    .stat-card {
      display: flex; align-items: center; gap: 14px;
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 12px; padding: 18px 20px;
      text-decoration: none;
      box-shadow: 0 1px 3px rgba(0,0,0,.05);
      transition: transform .18s, box-shadow .18s;
      position: relative; overflow: hidden;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,.09);
      }

      &::after {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(135deg, transparent 60%, rgba(255,255,255,.4));
        pointer-events: none;
      }
    }

    .stat-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size:22px; width:22px; height:22px; }
    }

    .stat-body   { flex: 1; }
    .stat-label  { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 0 0 4px; }
    .stat-value  { font-size: 30px; font-weight: 800; color: #0f172a; line-height: 1; margin: 0 0 3px; }
    .stat-sub    { font-size: 11.5px; color: #94a3b8; margin: 0; }

    .stat-trend {
      opacity: .25;
      mat-icon { font-size: 28px !important; width: 28px !important; height: 28px !important; }
    }

    /* ── Chart cards ──────────────────────────────────────── */
    .charts-row {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 20px; margin-bottom: 20px;
    }

    .chart-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,.05);
      overflow: hidden;
      display: flex; flex-direction: column;
    }

    .chart-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px 12px;
      border-bottom: 1px solid #f8fafc;
    }

    .chart-card-title-row {
      display: flex; align-items: center; gap: 12px;
    }

    .chart-title-icon {
      width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
    }

    .chart-title    { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
    .chart-subtitle { font-size: 12px; color: #94a3b8; margin: 0; }

    .chart-card-body {
      padding: 16px 20px 20px;
      flex: 1;
      position: relative;
    }

    /* Donut layout */
    .donut-layout {
      display: flex; align-items: center; gap: 24px;
    }

    .donut-wrap {
      position: relative;
      width: 160px; height: 160px; flex-shrink: 0;
    }

    .donut-center {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center; pointer-events: none;
    }

    .donut-total { display: block; font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1; }
    .donut-label { display: block; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }

    /* Legend */
    .donut-legend {
      flex: 1; display: flex; flex-direction: column; gap: 8px;
    }

    .legend-item {
      display: flex; align-items: center; gap: 8px;
      font-size: 12.5px;
    }

    .legend-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { flex: 1; color: #475569; }
    .legend-val   { font-weight: 700; color: #0f172a; width: 24px; text-align: right; }
    .legend-pct   { color: #94a3b8; width: 36px; text-align: right; font-size: 11.5px; }

    /* ── Activity feed ────────────────────────────────────── */
    .activity-feed   { display: flex; flex-direction: column; flex: 1; }
    .activity-empty  { padding: 28px; text-align: center; font-size: 13px; color: #94a3b8; }

    .activity-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 20px; text-decoration: none;
      border-bottom: 1px solid #f8fafc;
      transition: background .13s;
      &:last-child { border-bottom: none; }
      &:hover { background: #f8fafc; }
    }

    .activity-icon {
      width: 34px; height: 34px; border-radius: 9px;
      background: #ede9fe; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 17px !important; width: 17px !important; height: 17px !important; color: #7c3aed; }
    }

    .activity-info { flex: 1; min-width: 0; }
    .activity-name { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .activity-meta { font-size: 11.5px; color: #94a3b8; margin: 0; }
    .activity-time { font-size: 11.5px; color: #cbd5e1; flex-shrink: 0; }

    /* ── KPI row ──────────────────────────────────────────── */
    .kpi-row {
      display: grid; grid-template-columns: repeat(4,1fr);
      gap: 16px; margin-bottom: 8px;
    }

    .kpi-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,.04);

      mat-icon { font-size: 28px !important; width: 28px !important; height: 28px !important; opacity: .85; }
    }

    .kpi-body  { display: flex; flex-direction: column; gap: 2px; }
    .kpi-value { font-size: 22px; font-weight: 800; line-height: 1; }
    .kpi-label { font-size: 11.5px; color: #94a3b8; font-weight: 500; }

    /* ── Responsive ───────────────────────────────────────── */
    @media (max-width: 1280px) {
      .stat-grid  { grid-template-columns: repeat(2,1fr); }
      .kpi-row    { grid-template-columns: repeat(2,1fr); }
    }
    @media (max-width: 900px) {
      .charts-row { grid-template-columns: 1fr; }
      .donut-layout { flex-direction: column; }
      .donut-wrap   { margin: 0 auto; }
    }
    @media (max-width: 600px) {
      .stat-grid { grid-template-columns: 1fr; }
      .kpi-row   { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private svc    = inject(DashboardService);
  private notify = inject(NotificationService);
  private auth   = inject(AuthService);

  @ViewChild('statusDonut')  statusDonutRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryBar')  categoryBarRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusBar')    statusBarRef!:   ElementRef<HTMLCanvasElement>;

  data: DashboardData | null = null;
  loading = true;
  error   = '';

  private charts: Chart[] = [];
  private dataReady = false;
  private viewReady = false;

  get currentUser()  { return this.auth.currentUser; }
  get canManage()    { return this.auth.hasAnyRole('Manager', 'Administrator'); }
  get greeting()     {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  get statCards() {
    if (!this.data) return [];
    return [
      { label: 'Total Assets',      value: this.data.totalAssets,             icon: 'devices',       bg: '#ede9fe', color: '#7c3aed', route: '/assets',       sub: `${this.data.totalCategories} categories` },
      { label: 'Active & Assigned', value: this.data.activeAssets,            icon: 'check_circle',  bg: '#dcfce7', color: '#15803d', route: '/assets',       sub: 'In operation' },
      { label: 'Under Maintenance', value: this.data.underMaintenanceAssets,  icon: 'build',         bg: '#fef3c7', color: '#b45309', route: '/assets',       sub: 'Require attention' },
      { label: 'Org Units',         value: this.data.activeOrganizationUnits, icon: 'account_tree',  bg: '#dbeafe', color: '#1d4ed8', route: '/organization', sub: `${this.data.totalOrganizationUnits} total` },
    ];
  }

  get kpiCards() {
    if (!this.data) return [];
    const retired = this.data.retiredDisposedAssets;
    const stored  = (this.data.assetsByStatus.find(s => s.status === 'InStorage')?.count ?? 0);
    const lost    = (this.data.assetsByStatus.find(s => s.status === 'Lost')?.count ?? 0);
    const damaged = (this.data.assetsByStatus.find(s => s.status === 'Damaged')?.count ?? 0);
    return [
      { label: 'In Storage',        value: stored,  icon: 'inventory_2',     color: '#7c3aed' },
      { label: 'Retired/Disposed',  value: retired, icon: 'archive',         color: '#64748b' },
      { label: 'Lost',              value: lost,    icon: 'location_off',    color: '#be123c' },
      { label: 'Damaged',           value: damaged, icon: 'report_problem',  color: '#b91c1c' },
    ];
  }

  get statusLegend() {
    if (!this.data) return [];
    return this.data.assetsByStatus.map((s, i) => ({
      label: this.formatStatus(s.status),
      value: s.count,
      color: this.statusColors[i % this.statusColors.length]
    })).filter(s => s.value > 0);
  }

  private statusColors = [
    '#6366f1', '#10b981', '#f59e0b', '#3b82f6',
    '#ef4444', '#8b5cf6', '#64748b', '#94a3b8'
  ];

  ngOnInit() { this.load(); }

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.dataReady) this.buildCharts();
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  load() {
    this.loading = true;
    this.svc.getDashboard().subscribe({
      next: d => {
        this.data    = d;
        this.loading = false;
        this.dataReady = true;
        if (this.viewReady) setTimeout(() => this.buildCharts(), 50);
        else setTimeout(() => { this.viewReady = true; this.buildCharts(); }, 200);
      },
      error: e => {
        this.error   = 'Unable to load dashboard data.';
        this.loading = false;
        this.notify.apiError(e);
      }
    });
  }

  pct(n: number, total: number): number {
    return total ? Math.round((n / total) * 100) : 0;
  }

  private buildCharts() {
    if (!this.data) return;
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.buildDonut();
    this.buildCategoryBar();
    this.buildStatusBar();
  }

  private buildDonut() {
    if (!this.statusDonutRef?.nativeElement || !this.data) return;
    const statuses = this.data.assetsByStatus.filter(s => s.count > 0);
    const chart = new Chart(this.statusDonutRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: statuses.map(s => this.formatStatus(s.status)),
        datasets: [{
          data: statuses.map(s => s.count),
          backgroundColor: this.statusColors.slice(0, statuses.length),
          borderWidth: 2,
          borderColor: '#fff',
          hoverBorderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} assets`
            },
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            displayColors: true,
            boxPadding: 4
          }
        },
        animation: { animateRotate: true, duration: 800, easing: 'easeInOutQuart' }
      }
    });
    this.charts.push(chart);
  }

  private buildCategoryBar() {
    if (!this.categoryBarRef?.nativeElement || !this.data) return;
    const cats = this.data.assetsByCategory.slice(0, 8);
    const chart = new Chart(this.categoryBarRef.nativeElement, {
      type: 'bar',
      data: {
        labels: cats.map(c => c.category),
        datasets: [{
          label: 'Assets',
          data: cats.map(c => c.count),
          backgroundColor: cats.map((_, i) => this.hexToRgba(this.statusColors[i % this.statusColors.length], 0.85)),
          borderColor:     cats.map((_, i) => this.statusColors[i % this.statusColors.length]),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: ctx => ` ${ctx.parsed.y} assets` }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#64748b',
              maxRotation: 30, minRotation: 0 }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 11 }, color: '#94a3b8', stepSize: 1 },
            beginAtZero: true
          }
        },
        animation: { duration: 900, easing: 'easeInOutQuart' }
      }
    });
    this.charts.push(chart);
  }

  private buildStatusBar() {
    if (!this.statusBarRef?.nativeElement || !this.data) return;
    const statuses = this.data.assetsByStatus.filter(s => s.count > 0);
    const chart = new Chart(this.statusBarRef.nativeElement, {
      type: 'bar',
      data: {
        labels: statuses.map(s => this.formatStatus(s.status)),
        datasets: [{
          label: 'Count',
          data: statuses.map(s => s.count),
          backgroundColor: this.statusColors.slice(0, statuses.length).map(c => this.hexToRgba(c, 0.8)),
          borderColor:     this.statusColors.slice(0, statuses.length),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            padding: 10,
            cornerRadius: 8,
            callbacks: { label: ctx => ` ${ctx.parsed.x} assets` }
          }
        },
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 11 }, color: '#94a3b8', stepSize: 1 },
            beginAtZero: true
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#64748b' }
          }
        },
        animation: { duration: 900, easing: 'easeInOutQuart' }
      }
    });
    this.charts.push(chart);
  }

  private formatStatus(s: string): string {
    const map: Record<string, string> = {
      Active: 'Active', Assigned: 'Assigned', InStorage: 'In Storage',
      UnderMaintenance: 'Maintenance', Lost: 'Lost',
      Damaged: 'Damaged', Retired: 'Retired', Disposed: 'Disposed'
    };
    return map[s] ?? s;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
