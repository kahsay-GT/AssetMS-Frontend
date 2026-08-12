import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { OrganizationService } from '../../core/services/organization.service';
import { OrganizationUnit } from '../../core/models/organization.models';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, MatDividerModule,
    MatTreeModule, LoadingSpinnerComponent, PageHeaderComponent
  ],
  template: `
<app-page-header title="Organization" subtitle="Manage your organizational hierarchy" icon="account_tree" iconBg="#ede9fe" iconColor="#7c3aed">
  @if (canManage) {
    <button mat-raised-button color="primary" (click)="openCreate()"><mat-icon>add</mat-icon> Add Unit</button>
  }
</app-page-header>

<div class="org-layout fade-in">
  <!-- Tree -->
  <div class="org-tree-panel section-card">
    <div class="tree-panel-header">
      <mat-icon style="color:#7c3aed;font-size:16px;width:16px;height:16px">account_tree</mat-icon>
      <span>Hierarchy</span>
      <button mat-icon-button (click)="loadTree()" matTooltip="Refresh" style="margin-left:auto;width:28px;height:28px;">
        <mat-icon style="font-size:16px;width:16px;height:16px">refresh</mat-icon>
      </button>
    </div>
    @if (loading) { <app-loading-spinner [diameter]="32" /> }
    @else if (dataSource.data.length === 0) {
      <div class="empty-state" style="padding:32px 16px;">
        <div class="empty-icon"><mat-icon>account_tree</mat-icon></div>
        <h3>No units yet</h3>
      </div>
    } @else {
      <mat-tree [dataSource]="dataSource" [treeControl]="treeControl" class="org-tree">
        <mat-tree-node *matTreeNodeDef="let node" matTreeNodeToggle
          class="tree-node" [class.tree-node-active]="selectedUnit?.id === node.id" (click)="selectUnit(node)">
          <div class="tree-node-indent"></div>
          <mat-icon class="tree-leaf-icon">insert_drive_file</mat-icon>
          <span class="tree-label">{{ node.name }}</span>
          <span class="tree-code">{{ node.code }}</span>
          @if (!node.isActive) { <span class="tree-inactive">inactive</span> }
        </mat-tree-node>
        <mat-nested-tree-node *matTreeNodeDef="let node; when: hasChildren">
          <div class="tree-node" [class.tree-node-active]="selectedUnit?.id === node.id" (click)="selectUnit(node)">
            <button mat-icon-button matTreeNodeToggle (click)="$event.stopPropagation()" class="tree-toggle">
              <mat-icon>{{ treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}</mat-icon>
            </button>
            <mat-icon class="tree-folder-icon">{{ treeControl.isExpanded(node) ? 'folder_open' : 'folder' }}</mat-icon>
            <span class="tree-label font-medium">{{ node.name }}</span>
            <span class="tree-code">{{ node.code }}</span>
            @if (!node.isActive) { <span class="tree-inactive">inactive</span> }
          </div>
          <div [class.hidden]="!treeControl.isExpanded(node)" role="group" class="pl-4">
            <ng-container matTreeNodeOutlet></ng-container>
          </div>
        </mat-nested-tree-node>
      </mat-tree>
    }
  </div>

  <!-- Detail -->
  <div class="org-detail-panel">
    @if (!selectedUnit) {
      <div class="empty-state section-card" style="padding:64px 24px;">
        <div class="empty-icon"><mat-icon>account_tree</mat-icon></div>
        <h3>Select a unit</h3><p>Click any unit to view details.</p>
      </div>
    } @else {
      <div class="section-card fade-in">
        <div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <mat-icon style="color:#7c3aed;font-size:18px;width:18px;height:18px">account_tree</mat-icon>
              <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:0">{{ selectedUnit.name }}</h2>
              <span [style.background]="selectedUnit.isActive ? '#dcfce7' : '#fee2e2'"
                    [style.color]="selectedUnit.isActive ? '#15803d' : '#b91c1c'"
                    style="font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:4px;">
                {{ selectedUnit.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <span style="font-family:monospace;font-size:12.5px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px;">{{ selectedUnit.code }}</span>
          </div>
          @if (canManage) {
            <div style="display:flex;gap:6px;flex-shrink:0;">
              <button mat-stroked-button (click)="openEdit(selectedUnit)"><mat-icon>edit</mat-icon> Edit</button>
              <button mat-stroked-button (click)="openMove(selectedUnit)"><mat-icon>open_with</mat-icon> Move</button>
              @if (canAdmin && selectedUnit.isActive) {
                <button mat-stroked-button color="warn" (click)="archiveUnit(selectedUnit)"><mat-icon>archive</mat-icon></button>
              }
            </div>
          }
        </div>
        <div style="padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div><span class="field-label">Parent Unit</span><span class="field-value">{{ selectedUnit.parentName || '— Root' }}</span></div>
          <div><span class="field-label">Active Assets</span><span style="font-size:22px;font-weight:800;color:#4f46e5;">{{ selectedUnit.assetCount }}</span></div>
          <div><span class="field-label">Created</span><span class="field-value">{{ selectedUnit.createdAt | date:'MMM d, y' }}</span></div>
          <div><span class="field-label">Updated</span><span class="field-value">{{ selectedUnit.updatedAt | date:'MMM d, y' }}</span></div>
          @if (selectedUnit.description) {
            <div style="grid-column:1/-1"><span class="field-label">Description</span><span class="field-value">{{ selectedUnit.description }}</span></div>
          }
        </div>
        @if (selectedUnit.children.length > 0) {
          <div style="padding:0 24px 20px;">
            <span class="field-label" style="display:block;margin-bottom:8px;">Child Units ({{ selectedUnit.children.length }})</span>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              @for (c of selectedUnit.children; track c.id) {
                <button class="child-badge" (click)="selectUnit(c)">{{ c.name }}</button>
              }
            </div>
          </div>
        }
      </div>
    }
  </div>
</div>

<!-- Create/Edit Dialog -->
@if (showFormDialog) {
  <div class="dialog-backdrop" (click)="closeFormDialog()">
    <div class="dialog-card" (click)="$event.stopPropagation()">
      <div class="dialog-header">
        <h3>{{ editingUnit ? 'Edit Unit' : 'New Organization Unit' }}</h3>
        <button mat-icon-button (click)="closeFormDialog()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dialog-body">
        <form [formGroup]="unitForm" class="flex flex-col gap-3">
          <mat-form-field appearance="outline" class="w-full"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline" class="w-full"><mat-label>Code</mat-label><input matInput formControlName="code" /><mat-hint>E.g. HO-IT-DEV</mat-hint></mat-form-field>
          <mat-form-field appearance="outline" class="w-full"><mat-label>Description (optional)</mat-label><textarea matInput formControlName="description" rows="2"></textarea></mat-form-field>
          @if (!editingUnit) {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Parent Unit (optional)</mat-label>
              <mat-select formControlName="parentId">
                <mat-option [value]="null">— None (root) —</mat-option>
                @for (u of flatUnits; track u.id) { <mat-option [value]="u.id">{{ u.name }} ({{ u.code }})</mat-option> }
              </mat-select>
            </mat-form-field>
          }
        </form>
      </div>
      <div class="dialog-footer">
        <button mat-stroked-button (click)="closeFormDialog()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="saving || unitForm.invalid" (click)="saveUnit()">
          @if (saving) { <mat-spinner diameter="16" class="inline-block mr-2"></mat-spinner> }
          {{ editingUnit ? 'Save Changes' : 'Create Unit' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- Move Dialog -->
@if (showMoveDialog && movingUnit) {
  <div class="dialog-backdrop" (click)="closeMoveDialog()">
    <div class="dialog-card" (click)="$event.stopPropagation()">
      <div class="dialog-header">
        <h3>Move "{{ movingUnit.name }}"</h3>
        <button mat-icon-button (click)="closeMoveDialog()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dialog-body">
        <p style="font-size:13px;color:#64748b;margin:0 0 12px">Current parent: <strong>{{ movingUnit.parentName || 'Root' }}</strong></p>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>New Parent Unit</mat-label>
          <mat-select [formControl]="moveParentCtrl">
            <mat-option [value]="null">— None (make root) —</mat-option>
            @for (u of getMoveTargets(movingUnit); track u.id) { <mat-option [value]="u.id">{{ u.name }} ({{ u.code }})</mat-option> }
          </mat-select>
        </mat-form-field>
      </div>
      <div class="dialog-footer">
        <button mat-stroked-button (click)="closeMoveDialog()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="saving" (click)="executeMove()">
          @if (saving) { <mat-spinner diameter="16" class="inline-block mr-2"></mat-spinner> } Move Unit
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    .org-layout { display:grid; grid-template-columns:300px 1fr; gap:20px; }
    .tree-panel-header { display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13.5px;font-weight:600;color:#475569; }
    .org-tree { background:transparent; padding:8px 4px; }
    .tree-node { display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:6px;cursor:pointer;transition:background 0.13s;min-height:36px; }
    .tree-node:hover { background:#f8fafc; }
    .tree-node-active { background:#ede9fe !important; }
    .tree-toggle { width:24px!important;height:24px!important;line-height:24px!important; }
    .tree-node-indent { width:24px;flex-shrink:0; }
    .tree-leaf-icon { font-size:14px!important;width:14px!important;height:14px!important;color:#94a3b8;flex-shrink:0; }
    .tree-folder-icon { font-size:16px!important;width:16px!important;height:16px!important;color:#7c3aed;flex-shrink:0; }
    .tree-label { font-size:13px;color:#334155;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .tree-code { font-size:10.5px;color:#94a3b8;font-family:monospace;background:#f1f5f9;padding:1px 5px;border-radius:3px;flex-shrink:0; }
    .tree-inactive { font-size:10px;color:#ef4444;background:#fee2e2;padding:1px 6px;border-radius:3px;font-weight:600;flex-shrink:0; }
    .tree-node-active .tree-label { color:#4f46e5;font-weight:600; }
    .child-badge { background:#ede9fe;color:#5b21b6;border:none;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:500;cursor:pointer;transition:background 0.13s; }
    .child-badge:hover { background:#ddd6fe; }
    @media(max-width:768px) { .org-layout { grid-template-columns:1fr; } }
  `]
})
export class OrganizationComponent implements OnInit {
  private svc    = inject(OrganizationService);
  private auth   = inject(AuthService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb     = inject(FormBuilder);

  treeControl  = new NestedTreeControl<OrganizationUnit>(n => n.children);
  dataSource   = new MatTreeNestedDataSource<OrganizationUnit>();
  loading = true; saving = false;
  selectedUnit: OrganizationUnit | null = null;
  flatUnits:    OrganizationUnit[] = [];
  showFormDialog = false; showMoveDialog = false;
  editingUnit:  OrganizationUnit | null = null;
  movingUnit:   OrganizationUnit | null = null;
  moveParentCtrl = this.fb.control<string | null>(null);
  unitForm = this.fb.group({ name:['',Validators.required], code:['',Validators.required], description:[''], parentId:[null as string|null] });

  get canManage() { return this.auth.hasAnyRole('Manager','Administrator'); }
  get canAdmin()  { return this.auth.hasRole('Administrator'); }
  hasChildren = (_: number, n: OrganizationUnit) => !!n.children?.length;

  ngOnInit() { this.loadTree(); }

  loadTree(): void {
    this.loading = true;
    this.svc.getTree(this.canAdmin).subscribe({
      next: tree => { this.dataSource.data=tree; this.treeControl.dataNodes=tree; this.treeControl.expandAll(); this.flatUnits=this.flatTree(tree); this.loading=false; },
      error: e => { this.notify.apiError(e); this.loading=false; }
    });
  }

  selectUnit(u: OrganizationUnit) { this.selectedUnit = u; }
  openCreate() { this.editingUnit=null; this.unitForm.reset({parentId:null}); this.showFormDialog=true; }
  openEdit(u: OrganizationUnit) { this.editingUnit=u; this.unitForm.patchValue({name:u.name,code:u.code,description:u.description??''}); this.showFormDialog=true; }
  closeFormDialog() { this.showFormDialog=false; }

  saveUnit(): void {
    if (this.unitForm.invalid) return;
    this.saving=true;
    const v=this.unitForm.value;
    const obs=this.editingUnit
      ? this.svc.update(this.editingUnit.id,{name:v.name!,code:v.code!.toUpperCase(),description:v.description??undefined})
      : this.svc.create({name:v.name!,code:v.code!.toUpperCase(),description:v.description??undefined,parentId:v.parentId??undefined});
    obs.subscribe({ next:()=>{this.notify.success(this.editingUnit?'Unit updated.':'Unit created.');this.closeFormDialog();this.loadTree();this.saving=false;}, error:e=>{this.notify.apiError(e);this.saving=false;} });
  }

  openMove(u: OrganizationUnit) { this.movingUnit=u; this.moveParentCtrl.setValue(u.parentId??null); this.showMoveDialog=true; }
  closeMoveDialog() { this.showMoveDialog=false; this.movingUnit=null; }
  getMoveTargets(u: OrganizationUnit) { const d=this.getDescendants(u); return this.flatUnits.filter(x=>x.id!==u.id&&!d.has(x.id)&&x.isActive); }

  executeMove(): void {
    if (!this.movingUnit) return;
    this.saving=true;
    this.svc.move(this.movingUnit.id,{newParentId:this.moveParentCtrl.value??undefined}).subscribe({
      next:()=>{this.notify.success('Unit moved.');this.closeMoveDialog();this.loadTree();this.saving=false;},
      error:e=>{this.notify.apiError(e);this.saving=false;}
    });
  }

  archiveUnit(u: OrganizationUnit): void {
    this.dialog.open(ConfirmDialogComponent,{data:{title:'Archive Unit',message:`Archive "${u.name}"?`,confirmText:'Archive',confirmColor:'warn'}})
      .afterClosed().subscribe(ok=>{
        if(!ok)return;
        this.svc.archive(u.id).subscribe({next:()=>{this.notify.success('Unit archived.');this.selectedUnit=null;this.loadTree();},error:e=>this.notify.apiError(e)});
      });
  }

  private flatTree(nodes: OrganizationUnit[]): OrganizationUnit[] {
    const r: OrganizationUnit[]=[]; const t=(a:OrganizationUnit[])=>a.forEach(n=>{r.push(n);t(n.children);}); t(nodes); return r;
  }
  private getDescendants(u: OrganizationUnit): Set<string> {
    const ids=new Set<string>(); const t=(n:OrganizationUnit)=>n.children.forEach(c=>{ids.add(c.id);t(c);}); t(u); return ids;
  }
}
