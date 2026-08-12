import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssetService } from '../../../core/services/asset.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Asset, AssetHistory, AssetDocument, ASSET_STATUS_LABELS } from '../../../core/models/asset.models';
import { OrganizationUnit } from '../../../core/models/organization.models';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatProgressSpinnerModule, MatDividerModule, MatTooltipModule,
    StatusChipComponent, LoadingSpinnerComponent
  ],
  templateUrl: './asset-detail.component.html',
  styles: [`
    .detail-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
    .detail-badge { display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; border-radius:6px; padding:4px 10px; font-size:12.5px; font-weight:600; color:#475569; font-family:monospace; margin-bottom:8px; }
    .detail-name { font-size:24px; font-weight:800; color:#0f172a; margin:0 0 4px; }
    .detail-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .info-item { display:flex; flex-direction:column; gap:3px; }
    .section-header { padding:16px 20px; border-bottom:1px solid #f1f5f9; }
    .section-title { font-size:13.5px; font-weight:700; color:#0f172a; margin:0; display:flex; align-items:center; gap:8px; }
    .section-body { padding:20px; }
    .doc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
    .doc-card { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; display:flex; flex-direction:column; gap:8px; transition:box-shadow 0.15s; }
    .doc-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }
    .doc-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; mat-icon { font-size:20px; width:20px; height:20px; } }
    .doc-name { font-size:13px; font-weight:600; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .doc-meta { font-size:11.5px; color:#94a3b8; }
    .doc-actions { display:flex; gap:6px; margin-top:4px; }
    .timeline { position:relative; padding-left:28px; }
    .timeline::before { content:''; position:absolute; left:7px; top:8px; bottom:8px; width:2px; background:#e2e8f0; }
    .tl-item { position:relative; margin-bottom:16px; }
    .tl-dot { position:absolute; left:-25px; top:6px; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 2px #e2e8f0; }
    .tl-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; }
    .tl-action { font-size:13px; font-weight:600; color:#0f172a; }
    .tl-meta { font-size:11.5px; color:#94a3b8; margin-top:2px; }
    .tl-change { display:flex; align-items:center; gap:6px; margin-top:6px; }
    .tl-val { font-size:11.5px; padding:2px 8px; border-radius:4px; }
    .tl-old { background:#fef2f2; color:#b91c1c; }
    .tl-new { background:#f0fdf4; color:#15803d; }
    .upload-zone { border:2px dashed #e2e8f0; border-radius:10px; padding:28px; text-align:center; cursor:pointer; transition:border-color 0.2s,background 0.2s; }
    .upload-zone:hover { border-color:#a5b4fc; background:#fafafe; }
    .org-path { font-size:12px; color:#94a3b8; margin-top:2px; }
    @media(max-width:768px) { .info-grid { grid-template-columns:1fr; } }
  `]
})
export class AssetDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private assetSvc = inject(AssetService);
  private orgSvc   = inject(OrganizationService);
  private auth     = inject(AuthService);
  private notify   = inject(NotificationService);
  private dialog   = inject(MatDialog);
  private fb       = inject(FormBuilder);

  asset: Asset | null = null;
  documents: AssetDocument[] = [];
  history: AssetHistory[] = [];
  orgUnits: OrganizationUnit[] = [];
  loading = true; docLoading = true; histLoading = true;
  saving = false; uploadingDoc = false;

  showStatusDialog = false;
  showAssignDialog = false;
  showUploadDialog = false;
  pendingFile: File | null = null;

  statusOptions = Object.entries(ASSET_STATUS_LABELS).map(([v, l]) => ({ value: Number(v), label: l }));
  docTypes = ['Invoice', 'Warranty', 'Manual', 'Certificate', 'Image', 'Other'];

  statusForm = this.fb.group({ newStatus: [1, Validators.required], notes: [''] });
  assignForm = this.fb.group({ organizationUnitId: ['', Validators.required], notes: [''] });
  uploadForm = this.fb.group({ documentType: ['', Validators.required], description: [''] });

  get canManage() { return this.auth.hasAnyRole('Manager', 'Administrator'); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.assetSvc.getAsset(id).subscribe({
      next: a => { this.asset = a; this.loading = false; this.statusForm.patchValue({ newStatus: a.status }); },
      error: e => { this.notify.apiError(e); this.loading = false; }
    });
    this.assetSvc.getDocuments(id).subscribe({ next: d => { this.documents = d; this.docLoading = false; }, error: () => this.docLoading = false });
    this.assetSvc.getHistory(id).subscribe({ next: h => { this.history = h; this.histLoading = false; }, error: () => this.histLoading = false });
    this.orgSvc.getTree().subscribe(t => this.orgUnits = this.flatTree(t).filter(u => u.isActive));
  }

  submitStatusChange(): void {
    if (!this.asset) return;
    this.saving = true;
    const v = this.statusForm.value;
    this.assetSvc.changeStatus(this.asset.id, v.newStatus!, v.notes ?? undefined).subscribe({
      next: () => { this.notify.success('Status updated.'); this.showStatusDialog = false; this.saving = false; this.refresh(); },
      error: e => { this.notify.apiError(e); this.saving = false; }
    });
  }

  submitAssign(): void {
    if (!this.asset) return;
    this.saving = true;
    const v = this.assignForm.value;
    this.assetSvc.assignAsset(this.asset.id, v.organizationUnitId!, v.notes ?? undefined).subscribe({
      next: () => { this.notify.success('Asset reassigned.'); this.showAssignDialog = false; this.saving = false; this.refresh(); },
      error: e => { this.notify.apiError(e); this.saving = false; }
    });
  }

  onFileSelected(event: Event): void {
    const f = (event.target as HTMLInputElement).files?.[0];
    if (f) { this.pendingFile = f; this.uploadForm.reset(); this.showUploadDialog = true; }
    (event.target as HTMLInputElement).value = '';
  }

  confirmUpload(): void {
    if (!this.asset || !this.pendingFile || this.uploadForm.invalid) return;
    this.uploadingDoc = true;
    this.showUploadDialog = false;
    const v = this.uploadForm.value;
    this.assetSvc.uploadDocument(this.asset.id, this.pendingFile, v.documentType!, v.description ?? undefined).subscribe({
      next: doc => { this.documents.unshift(doc); this.notify.success('Document uploaded.'); this.uploadingDoc = false; this.pendingFile = null; this.refresh(); },
      error: e => { this.notify.apiError(e); this.uploadingDoc = false; }
    });
  }

  deleteDocument(doc: AssetDocument): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Document', message: `Delete "${doc.originalFileName}"?`, confirmText: 'Delete', confirmColor: 'warn' }
    }).afterClosed().subscribe(ok => {
      if (!ok || !this.asset) return;
      this.assetSvc.deleteDocument(this.asset.id, doc.id).subscribe({
        next: () => { this.documents = this.documents.filter(d => d.id !== doc.id); this.notify.success('Document deleted.'); this.refresh(); },
        error: e => this.notify.apiError(e)
      });
    });
  }

  getDownloadUrl(documentId: string): string {
    return this.asset ? this.assetSvc.getDocumentDownloadUrl(this.asset.id, documentId) : '#';
  }

  fileIcon(ct: string): string {
    if (ct.includes('pdf'))   return 'picture_as_pdf';
    if (ct.includes('image')) return 'image';
    if (ct.includes('word') || ct.includes('document')) return 'description';
    if (ct.includes('excel') || ct.includes('spreadsheet')) return 'table_chart';
    return 'insert_drive_file';
  }

  fileIconBg(ct: string): string {
    if (ct.includes('pdf'))   return '#fee2e2';
    if (ct.includes('image')) return '#dbeafe';
    if (ct.includes('word') || ct.includes('document')) return '#dcfce7';
    return '#f1f5f9';
  }

  fileIconColor(ct: string): string {
    if (ct.includes('pdf'))   return '#dc2626';
    if (ct.includes('image')) return '#2563eb';
    if (ct.includes('word') || ct.includes('document')) return '#15803d';
    return '#64748b';
  }

  historyColor(action: string): string {
    if (action.includes('Created'))     return '#15803d';
    if (action.includes('Status'))      return '#2563eb';
    if (action.includes('Org') || action.includes('Assign')) return '#7c3aed';
    if (action.includes('Document'))    return '#d97706';
    if (action.includes('Archive'))     return '#dc2626';
    return '#94a3b8';
  }

  formatAction(a: string): string { return a.replace(/([A-Z])/g, ' $1').trim(); }

  refresh(): void {
    if (!this.asset) return;
    const id = this.asset.id;
    this.assetSvc.getAsset(id).subscribe(a => this.asset = a);
    this.assetSvc.getHistory(id).subscribe(h => this.history = h);
  }

  openAssignDialog(): void {
    if (this.asset) this.assignForm.patchValue({ organizationUnitId: this.asset.organizationUnitId });
    this.showAssignDialog = true;
  }

  private flatTree(nodes: OrganizationUnit[]): OrganizationUnit[] {
    const r: OrganizationUnit[] = [];
    const t = (a: OrganizationUnit[]) => a.forEach(n => { r.push(n); t(n.children); });
    t(nodes); return r;
  }
}
