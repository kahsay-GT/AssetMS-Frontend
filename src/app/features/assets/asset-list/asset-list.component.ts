import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AssetService } from '../../../core/services/asset.service';
import { CategoryService } from '../../../core/services/category.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AssetListItem, AssetCategory, ASSET_STATUS_LABELS, ASSET_STATUS_CSS } from '../../../core/models/asset.models';
import { OrganizationUnit } from '../../../core/models/organization.models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatSortModule, MatTooltipModule,
    MatDialogModule, MatProgressSpinnerModule
  ],
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Assets</h1>
        <p class="page-subtitle">{{ totalCount | number }} assets · manage and track all organizational assets</p>
      </div>
      @if (canManage) {
        <a mat-raised-button color="primary" routerLink="/assets/new">
          <mat-icon>add</mat-icon> New Asset
        </a>
      }
    </div>

    <!-- Filters bar -->
    <div class="filters-bar section-card mb-5">
      <form [formGroup]="filterForm" class="filters-form">
        <mat-form-field appearance="outline" class="filter-search">
          <mat-label>Search assets</mat-label>
          <mat-icon matPrefix style="color:#94a3b8;font-size:18px;width:18px;height:18px;margin-right:6px">search</mat-icon>
          <input matInput formControlName="search" placeholder="Name, asset #, serial…" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Category</mat-label>
          <mat-select formControlName="categoryId">
            <mat-option value="">All Categories</mat-option>
            @for (c of categories; track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="">All Statuses</mat-option>
            @for (s of statusOptions; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Org Unit</mat-label>
          <mat-select formControlName="organizationUnitId">
            <mat-option value="">All Units</mat-option>
            @for (u of orgUnits; track u.id) {
              <mat-option [value]="u.id">{{ u.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (hasActiveFilters) {
          <button mat-stroked-button (click)="resetFilters()" class="clear-btn">
            <mat-icon>filter_list_off</mat-icon> Clear
          </button>
        }
      </form>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      @if (loading) {
        <div class="table-loading">
          <mat-spinner diameter="36"></mat-spinner>
          <span>Loading assets…</span>
        </div>
      } @else if (assets.length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><mat-icon>devices</mat-icon></div>
          <h3>No assets found</h3>
          <p>{{ hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first asset to get started.' }}</p>
          @if (canManage && !hasActiveFilters) {
            <a mat-raised-button color="primary" routerLink="/assets/new" class="mt-4">
              <mat-icon>add</mat-icon> Create Asset
            </a>
          }
        </div>
      } @else {
        <table mat-table [dataSource]="assets" matSort (matSortChange)="onSort($event)">

          <ng-container matColumnDef="assetNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Asset #</th>
            <td mat-cell *matCellDef="let row">
              <a [routerLink]="['/assets', row.id]" class="asset-number-link">
                {{ row.assetNumber }}
              </a>
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let row">
              <div class="asset-name-cell">
                <div class="asset-icon-wrap">
                  <mat-icon>{{ categoryIcon(row.categoryName) }}</mat-icon>
                </div>
                <div>
                  <a [routerLink]="['/assets', row.id]" class="asset-name-link">{{ row.name }}</a>
                  @if (row.serialNumber) {
                    <p class="asset-serial">S/N: {{ row.serialNumber }}</p>
                  }
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="categoryName">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let row">
              <span class="category-tag">{{ row.categoryName }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let row">
              <span class="status-chip" [ngClass]="statusCss(row.status)">{{ row.statusName }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="organizationUnitName">
            <th mat-header-cell *matHeaderCellDef>Org Unit</th>
            <td mat-cell *matCellDef="let row">
              <div class="org-cell">
                <mat-icon>account_tree</mat-icon>
                <span>{{ row.organizationUnitName }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="updatedAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Updated</th>
            <td mat-cell *matCellDef="let row" class="date-cell">{{ row.updatedAt | date:'MMM d, y' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <div class="row-actions">
                <a mat-icon-button [routerLink]="['/assets', row.id]" matTooltip="View details">
                  <mat-icon>open_in_new</mat-icon>
                </a>
                @if (canManage) {
                  <a mat-icon-button [routerLink]="['/assets', row.id, 'edit']" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </a>
                }
                @if (canAdmin && !row.isArchived) {
                  <button mat-icon-button matTooltip="Archive" (click)="archiveAsset(row)" class="danger-btn">
                    <mat-icon>archive</mat-icon>
                  </button>
                }
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              [class.archived-row]="row.isArchived"
              [routerLink]="['/assets', row.id]" style="cursor:pointer"></tr>
        </table>

        <mat-paginator
          [length]="totalCount" [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]" [pageIndex]="page - 1"
          (page)="onPage($event)" showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .mb-5 { margin-bottom: 20px; }

    .filters-bar { padding: 16px 20px; }
    .filters-form {
      display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
      .mat-mdc-form-field { margin-bottom: -1.25em; }
    }
    .filter-search  { flex: 1; min-width: 220px; }
    .filter-select  { width: 160px; }
    .clear-btn      { height: 40px; flex-shrink: 0; }

    .table-loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; padding: 64px;
      color: #94a3b8; font-size: 13.5px;
    }

    .asset-number-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px; font-weight: 600; color: #4f46e5;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .asset-name-cell { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .asset-icon-wrap {
      width: 34px; height: 34px;
      background: #f1f5f9; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
    }
    .asset-name-link {
      font-size: 13.5px; font-weight: 500; color: #0f172a;
      text-decoration: none; display: block;
      &:hover { color: #4f46e5; }
    }
    .asset-serial { font-size: 11.5px; color: #94a3b8; margin: 1px 0 0; font-family: monospace; }

    .category-tag {
      display: inline-flex;
      background: #f1f5f9; color: #475569;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11.5px; font-weight: 500; white-space: nowrap;
    }

    .org-cell {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; color: #64748b;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #94a3b8; }
    }

    .date-cell { font-size: 12.5px; color: #94a3b8; white-space: nowrap; }

    .row-actions { display: flex; gap: 2px; justify-content: flex-end; opacity: 0; transition: opacity 0.15s; }
    tr:hover .row-actions { opacity: 1; }
    .danger-btn { color: #dc2626 !important; }

    .archived-row { opacity: 0.45; }

    ::ng-deep .mat-mdc-row { cursor: pointer; }
  `]
})
export class AssetListComponent implements OnInit {
  private assetSvc = inject(AssetService);
  private catSvc   = inject(CategoryService);
  private orgSvc   = inject(OrganizationService);
  private auth     = inject(AuthService);
  private notify   = inject(NotificationService);
  private dialog   = inject(MatDialog);
  private fb       = inject(FormBuilder);

  displayedColumns = ['assetNumber', 'name', 'categoryName', 'status', 'organizationUnitName', 'updatedAt', 'actions'];
  assets: AssetListItem[] = [];
  categories: AssetCategory[] = [];
  orgUnits: OrganizationUnit[] = [];
  loading      = true;
  totalCount   = 0;
  page         = 1;
  pageSize     = 20;
  sortBy       = 'name';
  sortDescending = false;

  statusOptions = Object.entries(ASSET_STATUS_LABELS).map(([v, l]) => ({ value: Number(v), label: l }));

  filterForm = this.fb.group({ search: [''], categoryId: [''], status: [''], organizationUnitId: [''] });

  get canManage()       { return this.auth.hasAnyRole('Manager', 'Administrator'); }
  get canAdmin()        { return this.auth.hasRole('Administrator'); }
  get hasActiveFilters(){ const v = this.filterForm.value; return !!(v.search || v.categoryId || v.status || v.organizationUnitId); }

  statusCss(status: number) { return ASSET_STATUS_CSS[status] ?? ''; }

  categoryIcon(cat: string): string {
    const m: Record<string, string> = {
      Laptop: 'laptop', Computer: 'computer', Server: 'dns', Vehicle: 'directions_car',
      Furniture: 'chair', Software: 'code', 'Network Equipment': 'router'
    };
    return m[cat] ?? 'devices';
  }

  ngOnInit(): void {
    this.catSvc.getAll().subscribe(c => this.categories = c);
    this.orgSvc.getTree().subscribe(t => this.orgUnits = this.flatTree(t));
    this.loadAssets();

    this.filterForm.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 1; this.loadAssets();
    });
  }

  loadAssets(): void {
    this.loading = true;
    const v = this.filterForm.value;
    this.assetSvc.getAssets({
      page: this.page, pageSize: this.pageSize,
      search: v.search || undefined,
      categoryId: v.categoryId || undefined,
      status: v.status ? Number(v.status) : undefined,
      organizationUnitId: v.organizationUnitId || undefined,
      sortBy: this.sortBy, sortDescending: this.sortDescending
    }).subscribe({
      next:  r => { this.assets = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: e => { this.notify.apiError(e); this.loading = false; }
    });
  }

  onPage(e: PageEvent)    { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.loadAssets(); }
  onSort(s: Sort)         { this.sortBy = s.active; this.sortDescending = s.direction === 'desc'; this.loadAssets(); }
  resetFilters()          { this.filterForm.reset(); }

  archiveAsset(a: AssetListItem): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Archive Asset', message: `Archive "${a.name}"?`, confirmText: 'Archive', confirmColor: 'warn' }
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.assetSvc.archiveAsset(a.id).subscribe({ next: () => { this.notify.success('Asset archived.'); this.loadAssets(); }, error: e => this.notify.apiError(e) });
    });
  }

  private flatTree(nodes: OrganizationUnit[]): OrganizationUnit[] {
    const r: OrganizationUnit[] = [];
    const t = (a: OrganizationUnit[]) => a.forEach(n => { r.push(n); t(n.children); });
    t(nodes); return r;
  }
}
