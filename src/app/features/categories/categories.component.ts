import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { AssetCategory } from '../../core/models/asset.models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
    MatProgressSpinnerModule, LoadingSpinnerComponent, PageHeaderComponent],
  template: `
<app-page-header title="Asset Categories" subtitle="Manage asset classification categories" icon="category" iconBg="#d1fae5" iconColor="#059669">
  <button mat-raised-button color="primary" (click)="openCreate()">
    <mat-icon>add</mat-icon> New Category
  </button>
</app-page-header>

<div class="section-card mb-5" style="padding:14px 16px;">
  <mat-form-field appearance="outline" class="w-full" style="margin-bottom:-1.25em;">
    <mat-label>Search categories</mat-label>
    <mat-icon matPrefix style="color:#94a3b8;font-size:18px;width:18px;height:18px;margin-right:6px">search</mat-icon>
    <input matInput [formControl]="searchCtrl" placeholder="Category name…" />
  </mat-form-field>
</div>

<div class="table-wrapper">
  @if (loading) { <app-loading-spinner message="Loading categories…" /> }
  @else if (cats.length === 0) {
    <div class="empty-state">
      <div class="empty-icon"><mat-icon>category</mat-icon></div>
      <h3>No categories found</h3>
    </div>
  } @else {
    <table mat-table [dataSource]="cats" class="w-full">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Category</th>
        <td mat-cell *matCellDef="let c">
          <div style="display:flex;align-items:center;gap:10px;padding:4px 0;">
            <div style="width:34px;height:34px;border-radius:8px;background:#d1fae5;display:flex;align-items:center;justify-content:center;">
              <mat-icon style="font-size:16px;width:16px;height:16px;color:#059669;">label</mat-icon>
            </div>
            <div>
              <p style="font-size:13.5px;font-weight:600;color:#0f172a;margin:0 0 2px;">{{ c.name }}</p>
              <p style="font-size:12px;color:#94a3b8;margin:0;">{{ c.description || 'No description' }}</p>
            </div>
          </div>
        </td>
      </ng-container>

      <ng-container matColumnDef="assetCount">
        <th mat-header-cell *matHeaderCellDef>Assets</th>
        <td mat-cell *matCellDef="let c">
          <span style="font-size:20px;font-weight:800;color:#4f46e5;">{{ c.assetCount }}</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let c">
          <span class="status-chip" [class]="c.isActive ? 'status-active' : 'status-retired'">{{ c.isActive ? 'Active' : 'Archived' }}</span>
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let c">
          <div class="row-actions">
            <button mat-icon-button matTooltip="Edit" (click)="openEdit(c)"><mat-icon>edit</mat-icon></button>
            @if (c.isActive) {
              <button mat-icon-button matTooltip="Archive" (click)="archive(c)" style="color:#dc2626;"><mat-icon>archive</mat-icon></button>
            }
          </div>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let r; columns:cols;" [class.archived-row]="!r.isActive"></tr>
    </table>
    <mat-paginator [length]="total" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]"
      [pageIndex]="page-1" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
  }
</div>

@if (showForm) {
  <div class="dialog-backdrop" (click)="showForm=false">
    <div class="dialog-card" (click)="$event.stopPropagation()">
      <div class="dialog-header">
        <h3>{{ editCat ? 'Edit Category' : 'New Category' }}</h3>
        <button mat-icon-button (click)="showForm=false"><mat-icon>close</mat-icon></button>
      </div>
      <div class="dialog-body">
        <form [formGroup]="catForm" class="flex flex-col gap-3">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
            @if (catForm.get('name')?.hasError('required') && catForm.get('name')?.touched) { <mat-error>Required</mat-error> }
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description (optional)</mat-label>
            <textarea matInput formControlName="description" rows="2"></textarea>
          </mat-form-field>
        </form>
      </div>
      <div class="dialog-footer">
        <button mat-stroked-button (click)="showForm=false">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="saving||catForm.invalid" (click)="save()">
          @if (saving) { <mat-spinner diameter="16" class="inline-block mr-2"></mat-spinner> }
          {{ editCat ? 'Save' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`.mb-5{margin-bottom:20px;} .row-actions{display:flex;gap:2px;justify-content:flex-end;opacity:0;transition:opacity .15s;} tr:hover .row-actions{opacity:1;}`]
})
export class CategoriesComponent implements OnInit {
  private svc    = inject(CategoryService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private fb     = inject(FormBuilder);

  cols=['name','assetCount','status','actions'];
  cats: AssetCategory[] = [];
  loading=true; saving=false; total=0; page=1; pageSize=20;
  showForm=false; editCat: AssetCategory | null = null;

  searchCtrl = this.fb.control('');
  catForm    = this.fb.group({ name:['',Validators.required], description:[''] });

  ngOnInit() {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => { this.page=1; this.load(); });
  }

  load() {
    this.loading=true;
    this.svc.getPaged(this.page, this.pageSize, this.searchCtrl.value??'').subscribe({
      next: r => { this.cats=r.items; this.total=r.totalCount; this.loading=false; },
      error: e => { this.notify.apiError(e); this.loading=false; }
    });
  }

  onPage(e: PageEvent) { this.page=e.pageIndex+1; this.pageSize=e.pageSize; this.load(); }
  openCreate() { this.editCat=null; this.catForm.reset(); this.showForm=true; }
  openEdit(c: AssetCategory) { this.editCat=c; this.catForm.patchValue({ name:c.name, description:c.description??'' }); this.showForm=true; }

  save() {
    if (this.catForm.invalid) return;
    this.saving=true;
    const v = this.catForm.value;
    const obs = this.editCat
      ? this.svc.update(this.editCat.id, { name:v.name!, description:v.description??undefined })
      : this.svc.create({ name:v.name!, description:v.description??undefined });
    obs.subscribe({ next:()=>{ this.notify.success(this.editCat?'Category updated.':'Category created.'); this.showForm=false; this.load(); this.saving=false; }, error:e=>{ this.notify.apiError(e); this.saving=false; } });
  }

  archive(c: AssetCategory) {
    this.dialog.open(ConfirmDialogComponent, { data:{ title:'Archive Category', message:`Archive "${c.name}"?`, confirmText:'Archive', confirmColor:'warn' } })
      .afterClosed().subscribe(ok => {
        if (!ok) return;
        this.svc.archive(c.id).subscribe({ next:()=>{ this.notify.success('Category archived.'); this.load(); }, error:e=>this.notify.apiError(e) });
      });
  }
}
