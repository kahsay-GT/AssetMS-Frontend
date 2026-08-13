import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const ROLES = ['Administrator', 'Manager', 'Viewer'];
const ROLE_COLORS: Record<string, string> = { Administrator: '#dc2626', Manager: '#2563eb', Viewer: '#059669' };

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatTooltipModule, MatDialogModule, MatProgressSpinnerModule,
    LoadingSpinnerComponent, PageHeaderComponent
  ],
  template: `
<app-page-header title="Users" subtitle="Manage system users and role assignments" icon="people" iconBg="#dbeafe" iconColor="#1d4ed8">
  <button mat-raised-button color="primary" (click)="openCreate()">
    <mat-icon>person_add</mat-icon> Add User
  </button>
</app-page-header>

<div class="section-card mb-5" style="padding:14px 16px;">
  <mat-form-field appearance="outline" class="w-full" style="margin-bottom:-1.25em;">
    <mat-label>Search users</mat-label>
    <mat-icon matPrefix style="color:#94a3b8;font-size:18px;width:18px;height:18px;margin-right:6px">search</mat-icon>
    <input matInput [formControl]="searchCtrl" placeholder="Name or email…" />
  </mat-form-field>
</div>

<div class="table-wrapper">
  @if (loading) { <app-loading-spinner message="Loading users…" /> }
  @else if (users.length === 0) {
    <div class="empty-state">
      <div class="empty-icon"><mat-icon>people</mat-icon></div>
      <h3>No users found</h3>
    </div>
  } @else {
    <table mat-table [dataSource]="users" class="w-full">
      <ng-container matColumnDef="user">
        <th mat-header-cell *matHeaderCellDef>User</th>
        <td mat-cell *matCellDef="let u">
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
            <div class="user-avatar">{{ initials(u) }}</div>
            <div>
              <p style="font-size:13.5px;font-weight:600;color:#0f172a;margin:0 0 2px;">{{ u.fullName }}</p>
              <p style="font-size:12px;color:#94a3b8;margin:0;">{{ u.email }}</p>
            </div>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="roles">
        <th mat-header-cell *matHeaderCellDef>Roles</th>
        <td mat-cell *matCellDef="let u">
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            @for (r of u.roles; track r) {
              <span class="role-badge" [style.background]="roleBg(r)" [style.color]="roleColor(r)">{{ r }}</span>
            }
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let u">
          <span class="status-chip" [class]="u.isActive ? 'status-active' : 'status-retired'">{{ u.isActive ? 'Active' : 'Inactive' }}</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="joined">
        <th mat-header-cell *matHeaderCellDef>Joined</th>
        <td mat-cell *matCellDef="let u" style="font-size:12.5px;color:#94a3b8;">{{ u.createdAt | date:'MMM d, y' }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef class="ops-header">Operations</th>
        <td mat-cell *matCellDef="let u">
          <div class="row-actions">
            <button mat-icon-button matTooltip="Edit" (click)="openEdit(u)"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button matTooltip="Manage roles" (click)="openRoles(u)"><mat-icon>manage_accounts</mat-icon></button>
            @if (u.isActive) {
              <button mat-icon-button matTooltip="Deactivate" (click)="toggle(u)" style="color:#dc2626;"><mat-icon>block</mat-icon></button>
            } @else {
              <button mat-icon-button matTooltip="Reactivate" (click)="toggle(u)" style="color:#059669;"><mat-icon>check_circle</mat-icon></button>
            }
            <button mat-icon-button matTooltip="Delete permanently" (click)="deleteUser(u)" style="color:#ef4444;"><mat-icon>delete_outline</mat-icon></button>
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let r; columns: cols;" [class.archived-row]="!r.isActive"></tr>
    </table>
    <mat-paginator [length]="total" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]"
      [pageIndex]="page-1" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
  }
</div>

<!-- Create / Edit dialog -->
@if (showForm) {
  <div class="dialog-backdrop" (click)="showForm=false">
    <div class="dialog-card" (click)="$event.stopPropagation()">
      <div class="dialog-header">
        <h3>{{ editUser ? 'Edit User' : 'New User' }}</h3>
        <button mat-icon-button (click)="showForm=false"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dialog-body">
        <form [formGroup]="userForm" class="flex flex-col gap-3">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <mat-form-field appearance="outline"><mat-label>First Name</mat-label><input matInput formControlName="firstName" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Last Name</mat-label><input matInput formControlName="lastName" /></mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="w-full"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
          @if (!editUser) {
            <mat-form-field appearance="outline" class="w-full"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Roles</mat-label>
              <mat-select formControlName="roles" multiple>
                @for (r of availableRoles; track r) { <mat-option [value]="r">{{ r }}</mat-option> }
              </mat-select>
            </mat-form-field>
          }
        </form>
      </div>
      <div class="dialog-footer">
        <button mat-stroked-button (click)="showForm=false">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="saving||userForm.invalid" (click)="saveUser()">
          @if (saving) { <mat-spinner diameter="16" class="inline-block mr-2"></mat-spinner> }
          {{ editUser ? 'Save' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- Roles dialog -->
@if (showRoles && editUser) {
  <div class="dialog-backdrop" (click)="showRoles=false">
    <div class="dialog-card" (click)="$event.stopPropagation()">
      <div class="dialog-header">
        <h3>Roles — {{ editUser.fullName }}</h3>
        <button mat-icon-button (click)="showRoles=false"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dialog-body">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Assigned Roles</mat-label>
          <mat-select [formControl]="rolesCtrl" multiple>
            @for (r of availableRoles; track r) { <mat-option [value]="r">{{ r }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </div>
      <div class="dialog-footer">
        <button mat-stroked-button (click)="showRoles=false">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="saving" (click)="saveRoles()">
          @if (saving) { <mat-spinner diameter="16" class="inline-block mr-2"></mat-spinner> } Save Roles
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    .mb-5 { margin-bottom:20px; }
    .user-avatar { width:36px;height:36px;border-radius:50%;background:#e0e7ff;color:#4338ca;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .role-badge { font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em; }
    .row-actions { display:flex;gap:2px;justify-content:flex-end;opacity:0;transition:opacity .15s; }
    tr:hover .row-actions { opacity:1; }
    .ops-header { font-size:11px !important;font-weight:700 !important;text-transform:uppercase;letter-spacing:.08em;color:#64748b !important;text-align:right;padding-right:8px !important; }
  `]
})
export class UsersComponent implements OnInit {
  private svc    = inject(UserService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb     = inject(FormBuilder);

  cols = ['user','roles','status','joined','actions'];
  users: User[] = [];
  loading = true; saving = false;
  total = 0; page = 1; pageSize = 20;
  availableRoles = ROLES;
  showForm  = false;
  showRoles = false;
  editUser: User | null = null;

  searchCtrl = this.fb.control('');
  userForm   = this.fb.group({ firstName:['',Validators.required], lastName:['',Validators.required], email:['', [Validators.required,Validators.email]], password:[''], roles:[[]] });
  rolesCtrl  = this.fb.control<string[]>([]);

  ngOnInit() {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => { this.page=1; this.load(); });
  }

  load() {
    this.loading = true;
    this.svc.getUsers(this.page, this.pageSize, this.searchCtrl.value ?? '').subscribe({
      next: r => { this.users=r.items; this.total=r.totalCount; this.loading=false; },
      error: e => { this.notify.apiError(e); this.loading=false; }
    });
  }

  onPage(e: PageEvent) { this.page=e.pageIndex+1; this.pageSize=e.pageSize; this.load(); }

  openCreate() {
    this.editUser=null; this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm=true;
  }

  openEdit(u: User) {
    this.editUser=u; this.userForm.patchValue({ firstName:u.firstName, lastName:u.lastName, email:u.email });
    this.userForm.get('password')?.clearValidators(); this.userForm.get('password')?.updateValueAndValidity();
    this.showForm=true;
  }

  saveUser() {
    if (this.userForm.invalid) return;
    this.saving=true;
    const v = this.userForm.value;
    const obs = this.editUser
      ? this.svc.update(this.editUser.id, { firstName:v.firstName!, lastName:v.lastName!, email:v.email! })
      : this.svc.create({ firstName:v.firstName!, lastName:v.lastName!, email:v.email!, password:v.password!, roles:(v.roles as any)??[] });
    obs.subscribe({ next:()=>{ this.notify.success(this.editUser?'User updated.':'User created.'); this.showForm=false; this.load(); this.saving=false; }, error:e=>{ this.notify.apiError(e); this.saving=false; } });
  }

  openRoles(u: User) { this.editUser=u; this.rolesCtrl.setValue(u.roles); this.showRoles=true; }

  saveRoles() {
    if (!this.editUser) return;
    this.saving=true;
    this.svc.assignRoles(this.editUser.id, { roles:this.rolesCtrl.value??[] }).subscribe({
      next:()=>{ this.notify.success('Roles updated.'); this.showRoles=false; this.load(); this.saving=false; },
      error:e=>{ this.notify.apiError(e); this.saving=false; }
    });
  }

  toggle(u: User) {
    this.dialog.open(ConfirmDialogComponent, { data:{ title:u.isActive?'Deactivate User':'Reactivate User', message:`${u.isActive?'Deactivate':'Reactivate'} ${u.fullName}?`, confirmText:u.isActive?'Deactivate':'Reactivate', confirmColor:u.isActive?'warn':'primary' } })
      .afterClosed().subscribe(ok => {
        if (!ok) return;
        (u.isActive ? this.svc.deactivate(u.id) : this.svc.reactivate(u.id))
          .subscribe({ next:()=>{ this.notify.success(`User ${u.isActive?'deactivated':'reactivated'}.`); this.load(); }, error:e=>this.notify.apiError(e) });
      });
  }

  deleteUser(u: User) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Permanently delete ${u.fullName}? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.delete(u.id).subscribe({
        next: () => { this.notify.success(`${u.fullName} deleted.`); this.load(); },
        error: e => this.notify.apiError(e)
      });
    });
  }

  initials(u: User) { return (u.firstName?.[0]??'') + (u.lastName?.[0]??''); }
  roleBg(r: string)    { return { Administrator:'#fee2e2', Manager:'#dbeafe', Viewer:'#dcfce7' }[r]??'#f1f5f9'; }
  roleColor(r: string) { return ROLE_COLORS[r]??'#475569'; }
}
