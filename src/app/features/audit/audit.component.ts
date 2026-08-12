import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { environment } from '../../../environments/environment';

interface AuditLogItem { id:string; userName:string; action:number; entityType:string; entityId:string; previousValues:string; newValues:string; timestamp:string; notes:string; }

const ACTION_LABELS: Record<number,string> = {
  1:'Login Success',2:'Login Failure',3:'Logout',4:'User Created',5:'User Updated',6:'User Deactivated',7:'User Reactivated',
  8:'Role Assigned',9:'Role Removed',10:'Org Unit Created',11:'Org Unit Updated',12:'Org Unit Archived',13:'Org Unit Moved',
  14:'Asset Created',15:'Asset Updated',16:'Asset Archived',17:'Asset Assigned',18:'Status Changed',
  19:'Document Uploaded',20:'Document Deleted',21:'Category Created',22:'Category Updated',23:'Category Archived'
};

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule, MatTooltipModule,
    LoadingSpinnerComponent, PageHeaderComponent],
  template: `
<app-page-header title="Audit Logs" subtitle="Immutable record of all system actions" icon="security" iconBg="#fce7f3" iconColor="#be185d" />

<div class="section-card mb-5" style="padding:14px 16px;">
  <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
    <mat-form-field appearance="outline" style="flex:1;min-width:200px;margin-bottom:-1.25em;">
      <mat-label>Search</mat-label>
      <mat-icon matPrefix style="color:#94a3b8;font-size:18px;width:18px;height:18px;margin-right:6px">search</mat-icon>
      <input matInput [formControl]="searchCtrl" placeholder="User or entity ID…" />
    </mat-form-field>
    <mat-form-field appearance="outline" style="width:180px;margin-bottom:-1.25em;">
      <mat-label>Entity Type</mat-label>
      <mat-select [formControl]="typeCtrl">
        <mat-option value="">All</mat-option>
        @for (t of entityTypes; track t) { <mat-option [value]="t">{{ t }}</mat-option> }
      </mat-select>
    </mat-form-field>
    @if (searchCtrl.value || typeCtrl.value) {
      <button mat-stroked-button (click)="searchCtrl.reset(); typeCtrl.reset()">
        <mat-icon>filter_list_off</mat-icon> Clear
      </button>
    }
  </div>
</div>

<div class="table-wrapper">
  @if (loading) { <app-loading-spinner message="Loading audit logs…" /> }
  @else if (logs.length === 0) {
    <div class="empty-state">
      <div class="empty-icon"><mat-icon>security</mat-icon></div>
      <h3>No audit logs found</h3>
    </div>
  } @else {
    <table mat-table [dataSource]="logs" class="w-full">
      <ng-container matColumnDef="timestamp">
        <th mat-header-cell *matHeaderCellDef>Time</th>
        <td mat-cell *matCellDef="let r" style="font-size:12px;color:#64748b;white-space:nowrap;">{{ r.timestamp | date:'MMM d, y · HH:mm:ss' }}</td>
      </ng-container>

      <ng-container matColumnDef="user">
        <th mat-header-cell *matHeaderCellDef>User</th>
        <td mat-cell *matCellDef="let r">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:26px;height:26px;border-radius:50%;background:#e0e7ff;color:#4338ca;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              {{ (r.userName || '?')[0].toUpperCase() }}
            </div>
            <span style="font-size:13px;font-weight:500;color:#334155;">{{ r.userName || '—' }}</span>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="action">
        <th mat-header-cell *matHeaderCellDef>Action</th>
        <td mat-cell *matCellDef="let r">
          <span class="audit-badge" [style.background]="actionBg(r.action)" [style.color]="actionColor(r.action)">
            {{ getLabel(r.action) }}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="entity">
        <th mat-header-cell *matHeaderCellDef>Entity</th>
        <td mat-cell *matCellDef="let r" style="font-size:12.5px;color:#64748b;">
          @if (r.entityType) {
            <span style="font-weight:500;">{{ r.entityType }}</span>
            @if (r.entityId) { <span style="color:#94a3b8;font-family:monospace;font-size:11px;"> {{ r.entityId.slice(0,8) }}…</span> }
          } @else { — }
        </td>
      </ng-container>

      <ng-container matColumnDef="changes">
        <th mat-header-cell *matHeaderCellDef>Detail</th>
        <td mat-cell *matCellDef="let r" style="font-size:12px;color:#64748b;max-width:200px;">
          @if (r.newValues) {
            <span [matTooltip]="r.newValues" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ r.newValues }}</span>
          } @else { — }
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let r; columns: cols;" class="hover:bg-slate-50"></tr>
    </table>
    <mat-paginator [length]="total" [pageSize]="pageSize" [pageSizeOptions]="[20,50,100]"
      [pageIndex]="page-1" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
  }
</div>
  `,
  styles: [`
    .mb-5 { margin-bottom:20px; }
    .audit-badge { font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;white-space:nowrap;letter-spacing:.02em; }
    .row-actions { display:flex;gap:2px;justify-content:flex-end; }
  `]
})
export class AuditComponent implements OnInit {
  private http   = inject(HttpClient);
  private notify = inject(NotificationService);
  private fb     = inject(FormBuilder);

  cols = ['timestamp','user','action','entity','changes'];
  logs: AuditLogItem[] = [];
  loading = true; total = 0; page = 1; pageSize = 20;
  entityTypes = ['User','Asset','AssetCategory','OrganizationUnit','AssetDocument'];

  searchCtrl = this.fb.control('');
  typeCtrl   = this.fb.control('');

  ngOnInit() {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => { this.page=1; this.load(); });
    this.typeCtrl.valueChanges.subscribe(() => { this.page=1; this.load(); });
  }

  load() {
    this.loading = true;
    let params = new HttpParams().set('page', this.page).set('pageSize', this.pageSize);
    if (this.searchCtrl.value) params = params.set('search', this.searchCtrl.value);
    if (this.typeCtrl.value)   params = params.set('entityType', this.typeCtrl.value);

    this.http.get<{items:AuditLogItem[],totalCount:number}>(`${environment.apiUrl}/audit-logs`, { params }).subscribe({
      next: r => { this.logs=r.items; this.total=r.totalCount; this.loading=false; },
      error: e => { this.notify.apiError(e); this.loading=false; }
    });
  }

  onPage(e: PageEvent) { this.page=e.pageIndex+1; this.pageSize=e.pageSize; this.load(); }
  getLabel(a: number)  { return ACTION_LABELS[a] ?? `Action ${a}`; }

  actionBg(a: number): string {
    if ([1].includes(a))          return '#dcfce7';
    if ([2].includes(a))          return '#fee2e2';
    if ([4,5,6,7,8,9].includes(a))return '#dbeafe';
    if ([14,15,16,17,18].includes(a)) return '#ede9fe';
    if ([19,20].includes(a))      return '#fef3c7';
    return '#f1f5f9';
  }

  actionColor(a: number): string {
    if ([1].includes(a))          return '#15803d';
    if ([2].includes(a))          return '#b91c1c';
    if ([4,5,6,7,8,9].includes(a))return '#1d4ed8';
    if ([14,15,16,17,18].includes(a)) return '#6d28d9';
    if ([19,20].includes(a))      return '#b45309';
    return '#475569';
  }
}
