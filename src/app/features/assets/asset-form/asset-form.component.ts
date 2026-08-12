import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AssetService } from '../../../core/services/asset.service';
import { CategoryService } from '../../../core/services/category.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AssetCategory, ASSET_STATUS_LABELS } from '../../../core/models/asset.models';
import { OrganizationUnit } from '../../../core/models/organization.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatDividerModule, PageHeaderComponent
  ],
  template: `
    <app-page-header [title]="isEdit ? 'Edit Asset' : 'New Asset'"
      [subtitle]="isEdit ? 'Update asset information' : 'Register a new asset'"
      icon="devices">
      <button mat-stroked-button routerLink="/assets">
        <mat-icon>arrow_back</mat-icon> Back
      </button>
    </app-page-header>

    @if (loadingData) {
      <div class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>
    } @else {
      <mat-card class="max-w-3xl">
        <mat-card-content class="pt-4">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

            <!-- Basic Info -->
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Basic Information</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="sm:col-span-2">
                <mat-label>Asset Name</mat-label>
                <input matInput formControlName="name" />
                @if (f['name'].hasError('required') && f['name'].touched) { <mat-error>Name is required</mat-error> }
                @if (f['name'].hasError('maxlength')) { <mat-error>Max 300 characters</mat-error> }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="categoryId">
                  @for (c of categories; track c.id) {
                    <mat-option [value]="c.id">{{ c.name }}</mat-option>
                  }
                </mat-select>
                @if (f['categoryId'].hasError('required') && f['categoryId'].touched) { <mat-error>Category is required</mat-error> }
              </mat-form-field>

              @if (!isEdit) {
                <mat-form-field appearance="outline">
                  <mat-label>Status</mat-label>
                  <mat-select formControlName="status">
                    @for (s of statusOptions; track s.value) {
                      <mat-option [value]="s.value">{{ s.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }

              <mat-form-field appearance="outline" class="sm:col-span-2">
                <mat-label>Description (optional)</mat-label>
                <textarea matInput formControlName="description" rows="2"></textarea>
              </mat-form-field>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <!-- Identification -->
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Identification</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Serial Number</mat-label>
                <input matInput formControlName="serialNumber" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Manufacturer</mat-label>
                <input matInput formControlName="manufacturer" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Model</mat-label>
                <input matInput formControlName="model" />
              </mat-form-field>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <!-- Financial -->
            <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Financial Information</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Purchase Date</mat-label>
                <input matInput [matDatepicker]="dp" formControlName="purchaseDate" />
                <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
                <mat-datepicker #dp></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Purchase Cost (USD)</mat-label>
                <input matInput type="number" formControlName="purchaseCost" min="0" step="0.01" />
                <span matTextPrefix>$&nbsp;</span>
              </mat-form-field>
            </div>

            @if (!isEdit) {
              <mat-divider class="my-4"></mat-divider>
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Organization Assignment</p>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Organizational Unit</mat-label>
                <mat-select formControlName="organizationUnitId">
                  @for (u of orgUnits; track u.id) {
                    <mat-option [value]="u.id">{{ u.name }}</mat-option>
                  }
                </mat-select>
                @if (f['organizationUnitId'].hasError('required') && f['organizationUnitId'].touched) {
                  <mat-error>Organizational unit is required</mat-error>
                }
              </mat-form-field>
            }

            <!-- Actions -->
            <div class="flex gap-3 justify-end mt-6">
              <button mat-stroked-button type="button" routerLink="/assets">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving || form.invalid">
                @if (saving) { <mat-spinner diameter="18" class="inline-block mr-2"></mat-spinner> }
                {{ isEdit ? 'Save Changes' : 'Create Asset' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `
})
export class AssetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private assetSvc = inject(AssetService);
  private catSvc = inject(CategoryService);
  private orgSvc = inject(OrganizationService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    name:               ['', [Validators.required, Validators.maxLength(300)]],
    description:        [''],
    categoryId:         ['', Validators.required],
    serialNumber:       [''],
    manufacturer:       [''],
    model:              [''],
    purchaseDate:       [null as Date | null],
    purchaseCost:       [null as number | null],
    status:             [1],
    organizationUnitId: ['', Validators.required]
  });

  categories: AssetCategory[] = [];
  orgUnits: OrganizationUnit[] = [];
  isEdit = false;
  assetId = '';
  loadingData = true;
  saving = false;

  statusOptions = Object.entries(ASSET_STATUS_LABELS).map(([v, l]) => ({ value: Number(v), label: l }));
  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.assetId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.assetId;

    if (this.isEdit) {
      // Cast to untyped form to allow dynamic removal
      const f = this.form as any;
      f.removeControl('status');
      f.removeControl('organizationUnitId');
    }

    Promise.all([
      this.catSvc.getAll().toPromise(),
      this.orgSvc.getTree().toPromise()
    ]).then(([cats, tree]) => {
      this.categories = cats ?? [];
      this.orgUnits = this.flattenTree(tree ?? []).filter(u => u.isActive);
      if (this.isEdit) this.loadAsset();
      else this.loadingData = false;
    });
  }

  loadAsset(): void {
    this.assetSvc.getAsset(this.assetId).subscribe({
      next: a => {
        this.form.patchValue({
          name: a.name,
          description: a.description ?? '',
          categoryId: a.categoryId,
          serialNumber: a.serialNumber ?? '',
          manufacturer: a.manufacturer ?? '',
          model: a.model ?? '',
          purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
          purchaseCost: a.purchaseCost ?? null
        });
        this.loadingData = false;
      },
      error: err => { this.notify.apiError(err); this.loadingData = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;

    const payload = {
      name: v.name,
      description: v.description || undefined,
      categoryId: v.categoryId,
      serialNumber: v.serialNumber || undefined,
      manufacturer: v.manufacturer || undefined,
      model: v.model || undefined,
      purchaseDate: v.purchaseDate ? (v.purchaseDate as Date).toISOString() : undefined,
      purchaseCost: v.purchaseCost ?? undefined,
      ...(this.isEdit ? {} : { status: (v as any).status, organizationUnitId: (v as any).organizationUnitId })
    };

    const obs = this.isEdit
      ? this.assetSvc.updateAsset(this.assetId, payload)
      : this.assetSvc.createAsset(payload);

    obs.subscribe({
      next: a => {
        this.notify.success(this.isEdit ? 'Asset updated.' : 'Asset created.');
        this.router.navigate(['/assets', a.id]);
      },
      error: err => { this.notify.apiError(err); this.saving = false; }
    });
  }

  private flattenTree(nodes: OrganizationUnit[]): OrganizationUnit[] {
    const result: OrganizationUnit[] = [];
    const traverse = (arr: OrganizationUnit[]) => arr.forEach(n => { result.push(n); traverse(n.children); });
    traverse(nodes);
    return result;
  }
}
