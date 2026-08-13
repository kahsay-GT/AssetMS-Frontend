import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { AssetService } from '../../../core/services/asset.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Asset, AssetHistory, AssetDocument, ASSET_STATUS_LABELS } from '../../../core/models/asset.models';
import { OrganizationUnit } from '../../../core/models/organization.models';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatProgressSpinnerModule,
    MatTooltipModule, MatTabsModule,
    StatusChipComponent, LoadingSpinnerComponent
  ],
  templateUrl: './asset-detail.component.html',
  styles: [`
    /* ── Header ──────────────────────────────────────────── */
    .ad-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px; gap:16px; flex-wrap:wrap; }
    .ad-back-link { display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:500; color:#94a3b8; text-decoration:none; margin-bottom:8px; transition:color .15s; }
    .ad-back-link:hover { color:#4f46e5; }
    .ad-back-link mat-icon { font-size:16px !important; width:16px !important; height:16px !important; }
    .ad-title-row { display:flex; flex-direction:column; gap:6px; }
    .ad-asset-num { display:inline-flex; align-items:center; gap:4px; font-family:monospace; font-size:12.5px; font-weight:700; color:#4f46e5; background:#ede9fe; padding:3px 10px; border-radius:6px; width:fit-content; }
    .ad-asset-num mat-icon { font-size:13px !important; width:13px !important; height:13px !important; }
    .ad-title { font-size:26px; font-weight:800; color:#0f172a; letter-spacing:-.5px; margin:0; }
    .ad-badges { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .ad-category-badge { background:#f1f5f9; color:#475569; font-size:12px; font-weight:600; padding:3px 10px; border-radius:20px; }
    .ad-archived-badge { background:#fef3c7; color:#b45309; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:.05em; }
    .ad-header-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }

    /* ── Tabs ─────────────────────────────────────────────── */
    .ad-tabs { background:transparent !important; }
    ::ng-deep .ad-tabs .mat-mdc-tab-header { background:#fff; border:1px solid #e2e8f0; border-radius:10px 10px 0 0; }
    ::ng-deep .ad-tabs .mat-mdc-tab-body-wrapper { background:#fff; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 10px 10px; min-height:400px; }
    .tab-icon { font-size:15px !important; width:15px !important; height:15px !important; margin-right:6px; }
    .tab-badge { font-size:10.5px; font-weight:700; background:#e0e7ff; color:#4338ca; padding:1px 7px; border-radius:99px; margin-left:6px; }
    .tab-body { padding:24px; }

    /* ── Overview layout ─────────────────────────────────── */
    .overview-grid { display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start; }
    .overview-left, .overview-right { display:flex; flex-direction:column; gap:16px; }

    /* ── Info cards ──────────────────────────────────────── */
    .info-card { border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
    .info-card-header { display:flex; align-items:center; gap:9px; padding:11px 16px; background:#fafafa; border-bottom:1px solid #f1f5f9; }
    .info-card-icon { width:28px; height:28px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .info-card-icon mat-icon { font-size:14px !important; width:14px !important; height:14px !important; }
    .info-card-title { font-size:13px; font-weight:700; color:#0f172a; }
    .info-card-body { padding:16px; }

    /* ── Fields ──────────────────────────────────────────── */
    .field-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .field { display:flex; flex-direction:column; gap:3px; }
    .field.col-2 { grid-column:1/-1; }
    .field-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8; }
    .field-value { font-size:13.5px; color:#0f172a; }
    .org-path { display:flex; align-items:center; flex-wrap:wrap; gap:2px; margin-top:2px; }
    .path-seg { font-size:12.5px; color:#334155; font-weight:500; }
    .path-sep { font-size:14px !important; width:14px !important; height:14px !important; color:#94a3b8; }

    /* ── Upload zone ─────────────────────────────────────── */
    .upload-zone {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      border:2px dashed #c7d2fe; border-radius:12px;
      padding:32px 24px; margin-bottom:20px;
      cursor:pointer; transition:border-color .2s, background .2s;
      text-align:center; background:#fafafe;
    }
    .upload-zone:hover { border-color:#6366f1; background:#f5f3ff; }
    .upload-zone-icon { width:52px; height:52px; border-radius:50%; background:#e0e7ff; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
    .upload-zone-icon mat-icon { font-size:26px !important; width:26px !important; height:26px !important; color:#6366f1; }
    .upload-zone-title { font-size:14px; font-weight:600; color:#4338ca; margin:0 0 4px; }
    .upload-zone-sub { font-size:12px; color:#94a3b8; margin:0; }

    .upload-progress { display:flex; align-items:center; gap:10px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px 16px; margin-bottom:14px; font-size:13px; color:#1d4ed8; }

    /* ── Document grid ───────────────────────────────────── */
    .doc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }

    .doc-card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px; transition:box-shadow .15s,transform .15s; }
    .doc-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); transform:translateY(-2px); }

    .doc-card-top { display:flex; align-items:flex-start; gap:10px; }
    .doc-file-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .doc-file-icon mat-icon { font-size:22px !important; width:22px !important; height:22px !important; }
    .doc-name-wrap { flex:1; min-width:0; }
    .doc-name { font-size:13px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0 0 4px; }
    .doc-type-badge { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; background:#f1f5f9; color:#475569; padding:2px 7px; border-radius:4px; }

    .doc-meta-row { display:flex; flex-wrap:wrap; gap:8px; font-size:11.5px; color:#94a3b8; }
    .doc-meta-row span { display:flex; align-items:center; gap:3px; }
    .doc-meta-row mat-icon { font-size:12px !important; width:12px !important; height:12px !important; }

    .doc-description { font-size:12px; color:#64748b; margin:0; line-height:1.5; }

    .doc-actions { display:flex; align-items:center; gap:6px; padding-top:4px; border-top:1px solid #f1f5f9; }
    .doc-btn { height:34px !important; font-size:12.5px !important; flex:1; }

    /* ── Document preview modal ──────────────────────────── */
    .preview-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(15,23,42,.7); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn .15s ease; }
    .preview-modal { background:#fff; border-radius:16px; box-shadow:0 24px 80px rgba(0,0,0,.25); width:100%; max-width:900px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; }
    .preview-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid #e2e8f0; gap:12px; flex-shrink:0; background:#fafafa; }
    .preview-title-row { display:flex; align-items:center; gap:10px; min-width:0; }
    .preview-filename { font-size:14px; font-weight:700; color:#0f172a; margin:0 0 2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:400px; }
    .preview-meta { font-size:11.5px; color:#94a3b8; margin:0; }
    .preview-header-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .preview-body { flex:1; overflow:auto; background:#1e1b4b; display:flex; align-items:center; justify-content:center; min-height:400px; }
    .preview-img { max-width:100%; max-height:100%; object-fit:contain; padding:16px; }
    .preview-iframe { width:100%; height:70vh; border:none; }
    .preview-unsupported { display:flex; flex-direction:column; align-items:center; gap:12px; padding:48px; text-align:center; color:#94a3b8; }
    .preview-unsupported mat-icon { font-size:48px !important; width:48px !important; height:48px !important; }
    .preview-unsupported p { font-size:14px; margin:0; }

    /* ── Pending file row ────────────────────────────────── */
    .pending-file-row { display:flex; align-items:center; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-bottom:16px; }

    /* ── Timeline ────────────────────────────────────────── */
    .timeline { position:relative; padding-left:24px; }
    .timeline::before { content:''; position:absolute; left:7px; top:10px; bottom:10px; width:2px; background:#e2e8f0; }
    .tl-item { position:relative; margin-bottom:14px; }
    .tl-item:last-child { margin-bottom:0; }
    .tl-dot { position:absolute; left:-21px; top:8px; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 0 2px #e2e8f0; }
    .tl-card { background:#fafafa; border:1px solid #f1f5f9; border-radius:8px; padding:10px 14px; }
    .tl-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .tl-action { font-size:13px; font-weight:700; color:#0f172a; }
    .tl-time   { font-size:11px; color:#94a3b8; white-space:nowrap; }
    .tl-by     { font-size:11.5px; color:#64748b; margin:2px 0 0; }
    .tl-change { display:flex; align-items:center; gap:5px; margin-top:6px; }
    .tl-val    { font-size:11px; padding:2px 8px; border-radius:4px; }
    .tl-old    { background:#fef2f2; color:#b91c1c; }
    .tl-new    { background:#f0fdf4; color:#15803d; }
    .tl-notes  { font-size:11.5px; color:#94a3b8; margin:4px 0 0; font-style:italic; }

    @media (max-width:1024px) { .overview-grid { grid-template-columns:1fr; } }
    @media (max-width:640px)  { .ad-title { font-size:20px; } .tab-body { padding:16px; } .field-grid { grid-template-columns:1fr; } .doc-grid { grid-template-columns:1fr; } }
  `]
})
export class AssetDetailComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private assetSvc  = inject(AssetService);
  private orgSvc    = inject(OrganizationService);
  private auth      = inject(AuthService);
  private notify    = inject(NotificationService);
  private dialog    = inject(MatDialog);
  private fb        = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  asset: Asset | null = null;
  documents: AssetDocument[] = [];
  history: AssetHistory[] = [];
  orgUnits: OrganizationUnit[] = [];

  loading     = true;
  docLoading  = true;
  histLoading = true;
  saving      = false;
  uploadingDoc = false;

  showStatusDialog = false;
  showAssignDialog = false;
  showUploadDialog = false;
  pendingFile: File | null = null;

  // Preview
  previewDoc: AssetDocument | null = null;
  previewUrl: SafeResourceUrl | null = null;

  statusOptions = Object.entries(ASSET_STATUS_LABELS).map(([v, l]) => ({ value: Number(v), label: l }));
  docTypes = ['Invoice', 'Warranty', 'Manual', 'Certificate', 'Image', 'Other'];

  statusForm = this.fb.group({ newStatus: [1, Validators.required], notes: [''] });
  assignForm = this.fb.group({ organizationUnitId: ['', Validators.required], notes: [''] });
  uploadForm = this.fb.group({ documentType: ['', Validators.required], description: [''] });

  get canManage() { return this.auth.hasAnyRole('Manager', 'Administrator'); }

  get orgPathSegments(): string[] {
    if (!this.asset?.organizationUnitPath) return [this.asset?.organizationUnitName ?? ''];
    return this.asset.organizationUnitPath.split(' > ').map(s => s.trim()).filter(Boolean);
  }

  get pendingFileType(): string {
    return this.pendingFile?.type ?? '';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.assetSvc.getAsset(id).subscribe({
      next: a => { this.asset = a; this.loading = false; this.statusForm.patchValue({ newStatus: a.status }); },
      error: e => { this.notify.apiError(e); this.loading = false; }
    });

    this.assetSvc.getDocuments(id).subscribe({
      next: d => { this.documents = d; this.docLoading = false; },
      error: () => this.docLoading = false
    });

    this.assetSvc.getHistory(id).subscribe({
      next: h => { this.history = h; this.histLoading = false; },
      error: () => this.histLoading = false
    });

    this.orgSvc.getTree().subscribe(t => this.orgUnits = this.flatTree(t).filter(u => u.isActive));
  }

  openAssignDialog(): void {
    if (this.asset) this.assignForm.patchValue({ organizationUnitId: this.asset.organizationUnitId });
    this.showAssignDialog = true;
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

  triggerUpload(): void {
    (document.getElementById('fileUploadInput') as HTMLInputElement)?.click();
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
      data: { title: 'Delete Document', message: `Delete "${doc.originalFileName}"? This cannot be undone.`, confirmText: 'Delete', confirmColor: 'warn' }
    }).afterClosed().subscribe(ok => {
      if (!ok || !this.asset) return;
      this.assetSvc.deleteDocument(this.asset.id, doc.id).subscribe({
        next: () => { this.documents = this.documents.filter(d => d.id !== doc.id); this.notify.success('Document deleted.'); this.refresh(); },
        error: e => this.notify.apiError(e)
      });
    });
  }

  /** Returns a URL that includes the JWT token so the browser can load the file */
  getDownloadUrl(documentId: string): string {
    if (!this.asset) return '#';
    const token = this.auth.getToken();
    return `${environment.apiUrl}/assets/${this.asset.id}/documents/${documentId}/download?access_token=${token}`;
  }

  /** Download file by fetching with auth header then triggering browser download */
  downloadDocument(doc: AssetDocument, event: Event): void {
    event.preventDefault();
    if (!this.asset) return;
    const url = `${environment.apiUrl}/assets/${this.asset.id}/documents/${doc.id}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${this.auth.getToken()}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = doc.originalFileName;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => this.notify.error('Download failed.'));
  }

  /** Open inline preview modal */
  previewDocument(doc: AssetDocument): void {
    this.previewDoc = doc;
    const url = `${environment.apiUrl}/assets/${this.asset!.id}/documents/${doc.id}/download`;
    // For iframes (PDFs) we need a blob URL with auth
    if (doc.contentType.includes('pdf')) {
      fetch(url, { headers: { Authorization: `Bearer ${this.auth.getToken()}` } })
        .then(r => r.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        })
        .catch(() => this.notify.error('Preview failed.'));
    } else {
      // For images, use a direct blob URL
      fetch(url, { headers: { Authorization: `Bearer ${this.auth.getToken()}` } })
        .then(r => r.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        })
        .catch(() => this.notify.error('Preview failed.'));
    }
  }

  closePreview(): void {
    this.previewDoc = null;
    this.previewUrl = null;
  }

  isPreviewable(contentType: string): boolean {
    return contentType.includes('image') || contentType.includes('pdf');
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
    if (ct.includes('excel') || ct.includes('spreadsheet')) return '#fef9c3';
    return '#f1f5f9';
  }

  fileIconColor(ct: string): string {
    if (ct.includes('pdf'))   return '#dc2626';
    if (ct.includes('image')) return '#2563eb';
    if (ct.includes('word') || ct.includes('document')) return '#15803d';
    if (ct.includes('excel') || ct.includes('spreadsheet')) return '#a16207';
    return '#64748b';
  }

  historyColor(action: string): string {
    if (action.includes('Created'))  return '#15803d';
    if (action.includes('Status'))   return '#2563eb';
    if (action.includes('Org') || action.includes('Assign')) return '#7c3aed';
    if (action.includes('Document')) return '#d97706';
    if (action.includes('Archive'))  return '#dc2626';
    return '#94a3b8';
  }

  formatAction(a: string): string { return a.replace(/([A-Z])/g, ' $1').trim(); }

  private refresh(): void {
    if (!this.asset) return;
    const id = this.asset.id;
    this.assetSvc.getAsset(id).subscribe(a => this.asset = a);
    this.assetSvc.getHistory(id).subscribe(h => this.history = h);
  }

  private flatTree(nodes: OrganizationUnit[]): OrganizationUnit[] {
    const r: OrganizationUnit[] = [];
    const t = (a: OrganizationUnit[]) => a.forEach(n => { r.push(n); t(n.children); });
    t(nodes); return r;
  }
}
