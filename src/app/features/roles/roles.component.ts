import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { RoleService } from '../../core/services/role.service';
import { NotificationService } from '../../core/services/notification.service';
import { RoleDto, PermissionGroupDto, PermissionDto } from '../../core/models/role.models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatTooltipModule, MatProgressSpinnerModule, MatDialogModule,
    MatCheckboxModule, MatChipsModule, MatExpansionModule,
    LoadingSpinnerComponent, PageHeaderComponent
  ],
  template: `
<app-page-header
  title="Roles & Permissions"
  subtitle="Define what each role can do across the system"
  icon="admin_panel_settings"
  iconBg="#ede9fe" iconColor="#7c3aed">
  <button mat-raised-button color="primary" (click)="openCreate()">
    <mat-icon>add</mat-icon> New Role
  </button>
</app-page-header>

@if (loading) {
  <app-loading-spinner message="Loading roles and permissions…" />
} @else {

  <!-- ── Roles grid ─────────────────────────────────────────────── -->
  <div class="roles-grid fade-in">
    @for (role of roles; track role.id) {
      <div class="role-card" [class.role-card-selected]="selectedRole?.id === role.id"
           (click)="selectRole(role)">

        <!-- Role header -->
        <div class="role-card-header">
          <div class="role-avatar" [style.background]="roleColor(role.name).bg">
            <mat-icon [style.color]="roleColor(role.name).text">{{ roleIcon(role.name) }}</mat-icon>
          </div>
          <div class="role-info">
            <h3 class="role-name">{{ role.name }}</h3>
            <p class="role-desc">{{ role.description || 'No description' }}</p>
          </div>
          @if (!isBuiltIn(role.name)) {
            <div class="role-actions">
              <button mat-icon-button matTooltip="Edit permissions" (click)="openEdit(role); $event.stopPropagation()">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Delete" color="warn"
                (click)="deleteRole(role); $event.stopPropagation()">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          } @else {
            <div class="role-actions">
              <button mat-icon-button matTooltip="Edit permissions" (click)="openEdit(role); $event.stopPropagation()">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
            <span class="built-in-badge">Built-in</span>
          }
        </div>

        <!-- Stats row -->
        <div class="role-stats">
          <div class="role-stat">
            <mat-icon>people</mat-icon>
            <span>{{ role.userCount }} user{{ role.userCount !== 1 ? 's' : '' }}</span>
          </div>
          <div class="role-stat">
            <mat-icon>lock_open</mat-icon>
            <span>{{ role.permissionIds.length }} permission{{ role.permissionIds.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <!-- Permission category pills -->
        <div class="role-perm-pills">
          @for (cat of getCategories(role); track cat) {
            <span class="perm-category-pill">{{ cat }}</span>
          }
        </div>
      </div>
    }
  </div>

  <!-- ── Permission matrix for selected role ───────────────────── -->
  @if (selectedRole) {
    <div class="perm-matrix fade-in">
      <div class="perm-matrix-header">
        <div class="flex items-center gap-3">
          <div class="role-avatar" [style.background]="roleColor(selectedRole.name).bg">
            <mat-icon [style.color]="roleColor(selectedRole.name).text">{{ roleIcon(selectedRole.name) }}</mat-icon>
          </div>
          <div>
            <h2 class="perm-matrix-title">{{ selectedRole.name }} — Permission Matrix</h2>
            <p class="perm-matrix-sub">{{ selectedRole.permissionIds.length }} of {{ totalPermissions }} permissions granted</p>
          </div>
        </div>
        @if (!isBuiltIn(selectedRole.name)) {
          <button mat-raised-button color="primary" (click)="openEdit(selectedRole)">
            <mat-icon>edit</mat-icon> Edit Permissions
          </button>
        } @else {
          <button mat-raised-button color="primary" (click)="openEdit(selectedRole)">
            <mat-icon>edit</mat-icon> Edit Permissions
          </button>
        }
      </div>

      <div class="perm-groups">
        @for (group of permissionGroups; track group.category) {
          <div class="perm-group">
            <div class="perm-group-header">
              <div class="perm-group-icon" [style.background]="categoryColor(group.category).bg">
                <mat-icon [style.color]="categoryColor(group.category).text">{{ categoryIcon(group.category) }}</mat-icon>
              </div>
              <span class="perm-group-name">{{ group.category }}</span>
              <span class="perm-group-count">
                {{ countGranted(group, selectedRole) }}/{{ group.permissions.length }}
              </span>
            </div>
            <div class="perm-list">
              @for (perm of group.permissions; track perm.id) {
                <div class="perm-item" [class.perm-granted]="hasPermission(selectedRole, perm)"
                     (click)="quickToggle(selectedRole, perm)"
                     [matTooltip]="hasPermission(selectedRole, perm) ? 'Click to revoke' : 'Click to grant'"
                     matTooltipPosition="left">
                  <div class="perm-check">
                    @if (hasPermission(selectedRole, perm)) {
                      <mat-icon class="perm-check-icon granted">check_circle</mat-icon>
                    } @else {
                      <mat-icon class="perm-check-icon denied">cancel</mat-icon>
                    }
                  </div>
                  <div class="perm-detail">
                    <span class="perm-display-name">{{ perm.displayName }}</span>
                    <span class="perm-key">{{ perm.name }}</span>
                  </div>
                  @if (perm.description) {
                    <span class="perm-desc-tooltip" [matTooltip]="perm.description"
                      (click)="$event.stopPropagation()">
                      <mat-icon>info_outline</mat-icon>
                    </span>
                  }
                  <mat-icon class="perm-toggle-hint">
                    {{ hasPermission(selectedRole, perm) ? 'remove_circle_outline' : 'add_circle_outline' }}
                  </mat-icon>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  }
}

<!-- ── Create / Edit Dialog ───────────────────────────────────── -->
@if (showForm) {
  <div class="dialog-backdrop" (click)="closeForm()">
    <div class="role-dialog" (click)="$event.stopPropagation()">

      <!-- Dialog header -->
      <div class="dialog-header">
        <div class="flex items-center gap-3">
          <div class="role-avatar" style="background:#ede9fe">
            <mat-icon style="color:#7c3aed">admin_panel_settings</mat-icon>
          </div>
          <h3>{{ editingRole ? 'Edit Role' : 'Create New Role' }}</h3>
        </div>
        <button mat-icon-button (click)="closeForm()"><mat-icon>close</mat-icon></button>
      </div>

      <!-- Role basics -->
      <div class="dialog-body">
        <form [formGroup]="roleForm" class="flex flex-col gap-3 mb-6">
          @if (!editingRole) {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Role Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Auditor" />
              @if (roleForm.get('name')?.hasError('required') && roleForm.get('name')?.touched) {
                <mat-error>Role name is required</mat-error>
              }
            </mat-form-field>
          }
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="2"
              placeholder="Describe what this role is for…"></textarea>
          </mat-form-field>
        </form>

        <!-- Permission selector -->
        <div class="perm-selector">
          <div class="perm-selector-header">
            <h4>Permissions</h4>
            <div class="perm-selector-actions">
              <button mat-stroked-button (click)="selectAll()">Select All</button>
              <button mat-stroked-button (click)="clearAll()">Clear All</button>
              <span class="perm-selected-count">{{ selectedPermIds.size }} selected</span>
            </div>
          </div>

          <div class="perm-selector-groups">
            @for (group of permissionGroups; track group.category) {
              <div class="perm-selector-group">
                <div class="perm-selector-group-header">
                  <div class="perm-group-icon" [style.background]="categoryColor(group.category).bg">
                    <mat-icon [style.color]="categoryColor(group.category).text">{{ categoryIcon(group.category) }}</mat-icon>
                  </div>
                  <span class="perm-group-name">{{ group.category }}</span>
                  <button mat-button class="select-cat-btn" (click)="toggleCategory(group)">
                    {{ allInCategorySelected(group) ? 'Deselect all' : 'Select all' }}
                  </button>
                </div>
                <div class="perm-checkbox-list">
                  @for (perm of group.permissions; track perm.id) {
                    <label class="perm-checkbox-item" [class.perm-checkbox-checked]="selectedPermIds.has(perm.id)">
                      <input type="checkbox" [checked]="selectedPermIds.has(perm.id)"
                        (change)="togglePerm(perm.id)" class="perm-checkbox-input" />
                      <div class="perm-checkbox-content">
                        <span class="perm-checkbox-label">{{ perm.displayName }}</span>
                        @if (perm.description) {
                          <span class="perm-checkbox-desc">{{ perm.description }}</span>
                        }
                      </div>
                    </label>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-stroked-button (click)="closeForm()">Cancel</button>
        <button mat-raised-button color="primary"
          [disabled]="saving || (!editingRole && roleForm.get('name')?.invalid)"
          (click)="saveRole()">
          @if (saving) { <mat-spinner diameter="18" class="inline-block mr-2"></mat-spinner> }
          {{ editingRole ? 'Save Changes' : 'Create Role' }}
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    /* ── Roles grid ──────────────────────────────────────────────── */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .role-card {
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      cursor: pointer;
      transition: border-color .15s, box-shadow .15s, transform .15s;
      display: flex; flex-direction: column; gap: 14px;
    }
    .role-card:hover {
      border-color: #a5b4fc;
      box-shadow: 0 4px 16px rgba(99,102,241,.1);
      transform: translateY(-2px);
    }
    .role-card-selected {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 3px rgba(99,102,241,.15) !important;
      background: #fafafe;
    }

    .role-card-header { display: flex; align-items: flex-start; gap: 12px; }
    .role-avatar {
      width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; }
    }
    .role-info { flex: 1; min-width: 0; }
    .role-name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
    .role-desc { font-size: 12px; color: #94a3b8; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .role-actions { display: flex; gap: 2px; opacity: 0; transition: opacity .15s; }
    .role-card:hover .role-actions { opacity: 1; }

    .built-in-badge {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
      background: #f1f5f9; color: #64748b;
      padding: 3px 8px; border-radius: 4px; flex-shrink: 0; align-self: flex-start;
    }

    .role-stats {
      display: flex; gap: 16px;
    }
    .role-stat {
      display: flex; align-items: center; gap: 5px;
      font-size: 12.5px; color: #64748b;
      mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; color: #94a3b8; }
    }

    .role-perm-pills { display: flex; flex-wrap: wrap; gap: 5px; }
    .perm-category-pill {
      font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
      background: #f1f5f9; color: #475569;
      padding: 2px 8px; border-radius: 4px;
    }

    /* ── Permission matrix ───────────────────────────────────────── */
    .perm-matrix {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,.05);
      margin-bottom: 28px;
    }

    .perm-matrix-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: #fafafa;
      gap: 12px; flex-wrap: wrap;
    }
    .perm-matrix-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
    .perm-matrix-sub   { font-size: 12.5px; color: #94a3b8; margin: 0; }

    .perm-groups {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 0;
    }

    .perm-group {
      border-right: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      &:last-child { border-right: none; }
    }

    .perm-group-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
    }
    .perm-group-icon {
      width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 13px !important; width: 13px !important; height: 13px !important; }
    }
    .perm-group-name  { font-size: 12.5px; font-weight: 700; color: #334155; flex: 1; }
    .perm-group-count {
      font-size: 11px; font-weight: 700;
      background: #e0e7ff; color: #4338ca;
      padding: 1px 7px; border-radius: 99px;
    }

    .perm-list { display: flex; flex-direction: column; }
    .perm-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 16px;
      border-bottom: 1px solid #f8fafc;
      transition: background .1s;
      cursor: pointer;
      &:last-child { border-bottom: none; }
      &:hover { background: #f1f5f9; }
    }
    .perm-granted { background: #f0fdf4 !important; &:hover { background: #dcfce7 !important; } }
    .perm-check { flex-shrink: 0; }
    .perm-check-icon {
      font-size: 17px !important; width: 17px !important; height: 17px !important;
      &.granted { color: #15803d; }
      &.denied  { color: #e2e8f0; }
    }
    .perm-detail { flex: 1; min-width: 0; }
    .perm-display-name { display: block; font-size: 12.5px; font-weight: 500; color: #334155; }
    .perm-key { display: block; font-size: 10.5px; color: #94a3b8; font-family: monospace; margin-top: 1px; }
    .perm-desc-tooltip { color: #94a3b8; cursor: help; mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; } }
    .perm-toggle-hint {
      font-size: 15px !important; width: 15px !important; height: 15px !important;
      color: #cbd5e1; opacity: 0; transition: opacity .15s;
    }
    .perm-item:hover .perm-toggle-hint { opacity: 1; }
    .perm-granted .perm-toggle-hint { color: #f87171; }
    .perm-item:not(.perm-granted):hover .perm-toggle-hint { color: #4ade80; }

    /* ── Dialog ──────────────────────────────────────────────────── */
    .role-dialog {
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 24px 80px rgba(0,0,0,.18);
      width: 100%; max-width: 720px;
      max-height: 90vh;
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* Permission selector */
    .perm-selector { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .perm-selector-header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      h4 { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0; }
    }
    .perm-selector-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .perm-selected-count {
      font-size: 12px; font-weight: 700; background: #e0e7ff; color: #4338ca;
      padding: 2px 10px; border-radius: 99px;
    }

    .perm-selector-groups { max-height: 420px; overflow-y: auto; }
    .perm-selector-group { border-bottom: 1px solid #f1f5f9; &:last-child { border-bottom: none; } }
    .perm-selector-group-header {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; background: #fafafa;
      border-bottom: 1px solid #f8fafc; position: sticky; top: 0; z-index: 1;
    }
    .select-cat-btn { font-size: 11.5px !important; height: 28px !important; line-height: 28px !important; }

    .perm-checkbox-list { display: flex; flex-direction: column; }
    .perm-checkbox-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 16px; cursor: pointer;
      transition: background .1s;
      &:hover { background: #f8fafc; }
    }
    .perm-checkbox-checked { background: #f0fdf4 !important; }
    .perm-checkbox-input { width: 15px; height: 15px; flex-shrink: 0; margin-top: 2px; accent-color: #6366f1; cursor: pointer; }
    .perm-checkbox-content { flex: 1; }
    .perm-checkbox-label { display: block; font-size: 13px; font-weight: 500; color: #334155; }
    .perm-checkbox-desc  { display: block; font-size: 11px; color: #94a3b8; margin-top: 1px; }

    @media (max-width: 768px) {
      .roles-grid { grid-template-columns: 1fr; }
      .perm-groups { grid-template-columns: 1fr; }
      .role-dialog { max-width: 100%; border-radius: 0; max-height: 100vh; }
    }
  `]
})
export class RolesComponent implements OnInit {
  private svc    = inject(RoleService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb     = inject(FormBuilder);

  roles:            RoleDto[] = [];
  permissionGroups: PermissionGroupDto[] = [];
  allPermissions:   PermissionDto[] = [];
  selectedRole:     RoleDto | null = null;
  loading = true;
  saving  = false;
  showForm = false;
  editingRole: RoleDto | null = null;
  selectedPermIds = new Set<string>();

  roleForm = this.fb.group({
    name:        ['', Validators.required],
    description: ['']
  });

  get totalPermissions() {
    return this.permissionGroups.reduce((s, g) => s + g.permissions.length, 0);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getRoles().subscribe({
      next: r => {
        this.roles = r;
        if (r.length) this.selectedRole = r[0];
        this.loading = false;
      },
      error: e => { this.notify.apiError(e); this.loading = false; }
    });
    this.svc.getPermissionsGrouped().subscribe(g => this.permissionGroups = g);
    this.svc.getPermissions().subscribe(p => this.allPermissions = p);
  }

  selectRole(role: RoleDto): void { this.selectedRole = role; }

  openCreate(): void {
    this.editingRole = null;
    this.roleForm.reset();
    this.selectedPermIds = new Set();
    this.showForm = true;
  }

  openEdit(role: RoleDto): void {
    this.editingRole = role;
    this.roleForm.patchValue({ name: role.name, description: role.description ?? '' });
    this.selectedPermIds = new Set(role.permissionIds);
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; this.editingRole = null; }

  saveRole(): void {
    if (!this.editingRole && this.roleForm.get('name')?.invalid) {
      this.roleForm.markAllAsTouched(); return;
    }
    this.saving = true;
    const v = this.roleForm.value;
    const permIds = Array.from(this.selectedPermIds);

    const obs = this.editingRole
      ? this.svc.updateRole(this.editingRole.id, { description: v.description ?? undefined, permissionIds: permIds })
      : this.svc.createRole({ name: v.name!, description: v.description ?? undefined, permissionIds: permIds });

    obs.subscribe({
      next: () => {
        this.notify.success(this.editingRole ? 'Role updated.' : 'Role created.');
        this.closeForm();
        this.load();
        this.saving = false;
      },
      error: e => { this.notify.apiError(e); this.saving = false; }
    });
  }

  deleteRole(role: RoleDto): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Role',
        message: `Delete "${role.name}"? This cannot be undone.`,
        confirmText: 'Delete', confirmColor: 'warn'
      }
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.deleteRole(role.id).subscribe({
        next: () => {
          this.notify.success('Role deleted.');
          if (this.selectedRole?.id === role.id) this.selectedRole = null;
          this.load();
        },
        error: e => this.notify.apiError(e)
      });
    });
  }

  // ── Permission helpers ────────────────────────────────────────────────────

  hasPermission(role: RoleDto, perm: PermissionDto): boolean {
    return role.permissionIds.includes(perm.id);
  }

  countGranted(group: PermissionGroupDto, role: RoleDto): number {
    return group.permissions.filter(p => this.hasPermission(role, p)).length;
  }

  getCategories(role: RoleDto): string[] {
    return [...new Set(
      this.allPermissions
        .filter(p => role.permissionIds.includes(p.id))
        .map(p => p.category)
    )].slice(0, 4);
  }

  togglePerm(id: string): void {
    if (this.selectedPermIds.has(id)) this.selectedPermIds.delete(id);
    else this.selectedPermIds.add(id);
    this.selectedPermIds = new Set(this.selectedPermIds);
  }

  toggleCategory(group: PermissionGroupDto): void {
    const all = group.permissions.every(p => this.selectedPermIds.has(p.id));
    group.permissions.forEach(p => all ? this.selectedPermIds.delete(p.id) : this.selectedPermIds.add(p.id));
    this.selectedPermIds = new Set(this.selectedPermIds);
  }

  allInCategorySelected(group: PermissionGroupDto): boolean {
    return group.permissions.every(p => this.selectedPermIds.has(p.id));
  }

  selectAll(): void {
    this.selectedPermIds = new Set(this.allPermissions.map(p => p.id));
  }

  clearAll(): void {
    this.selectedPermIds = new Set();
  }

  isBuiltIn(name: string): boolean {
    return ['Administrator', 'Manager', 'Viewer'].includes(name);
  }

  // Quick-toggle a single permission directly from the matrix view
  quickToggle(role: RoleDto, perm: PermissionDto): void {
    const has = role.permissionIds.includes(perm.id);
    const updated = has
      ? role.permissionIds.filter(id => id !== perm.id)
      : [...role.permissionIds, perm.id];

    this.svc.updateRole(role.id, {
      description: role.description,
      permissionIds: updated
    }).subscribe({
      next: updated => {
        const idx = this.roles.findIndex(r => r.id === role.id);
        if (idx >= 0) this.roles[idx] = updated;
        if (this.selectedRole?.id === role.id) this.selectedRole = updated;
        this.notify.success(has ? `"${perm.displayName}" revoked.` : `"${perm.displayName}" granted.`);
      },
      error: e => this.notify.apiError(e)
    });
  }

  // ── Styling helpers ────────────────────────────────────────────────────────

  roleColor(name: string): { bg: string; text: string } {
    const map: Record<string, { bg: string; text: string }> = {
      Administrator: { bg: '#fee2e2', text: '#dc2626' },
      Manager:       { bg: '#dbeafe', text: '#2563eb' },
      Viewer:        { bg: '#dcfce7', text: '#15803d' },
    };
    return map[name] ?? { bg: '#ede9fe', text: '#7c3aed' };
  }

  roleIcon(name: string): string {
    const map: Record<string, string> = {
      Administrator: 'shield', Manager: 'manage_accounts', Viewer: 'visibility'
    };
    return map[name] ?? 'person';
  }

  categoryColor(cat: string): { bg: string; text: string } {
    const map: Record<string, { bg: string; text: string }> = {
      Dashboard:    { bg: '#ede9fe', text: '#7c3aed' },
      Organization: { bg: '#dbeafe', text: '#2563eb' },
      Assets:       { bg: '#dcfce7', text: '#15803d' },
      Documents:    { bg: '#fef3c7', text: '#b45309' },
      Categories:   { bg: '#f0fdf4', text: '#15803d' },
      Users:        { bg: '#fee2e2', text: '#dc2626' },
      Roles:        { bg: '#fdf4ff', text: '#9333ea' },
      Audit:        { bg: '#f0f9ff', text: '#0284c7' },
    };
    return map[cat] ?? { bg: '#f1f5f9', text: '#475569' };
  }

  categoryIcon(cat: string): string {
    const map: Record<string, string> = {
      Dashboard: 'dashboard', Organization: 'account_tree',
      Assets: 'devices', Documents: 'attach_file',
      Categories: 'category', Users: 'people',
      Roles: 'admin_panel_settings', Audit: 'security'
    };
    return map[cat] ?? 'folder';
  }
}
