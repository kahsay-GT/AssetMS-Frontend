export type AssetStatus = 'Active' | 'InStorage' | 'UnderMaintenance' | 'Assigned' | 'Lost' | 'Damaged' | 'Retired' | 'Disposed';

export interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  status: number;
  statusName: string;
  organizationUnitId: string;
  organizationUnitName: string;
  organizationUnitPath: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetListItem {
  id: string;
  assetNumber: string;
  name: string;
  categoryName: string;
  serialNumber?: string;
  status: number;
  statusName: string;
  organizationUnitName: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetHistory {
  id: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface AssetDocument {
  id: string;
  assetId: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  fileSizeFormatted: string;
  documentType: string;
  description?: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: number;
  organizationUnitId?: string;
  includeArchived?: boolean;
  assetNumber?: string;
  serialNumber?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const ASSET_STATUS_LABELS: Record<number, string> = {
  1: 'Active',
  2: 'In Storage',
  3: 'Under Maintenance',
  4: 'Assigned',
  5: 'Lost',
  6: 'Damaged',
  7: 'Retired',
  8: 'Disposed'
};

export const ASSET_STATUS_CSS: Record<number, string> = {
  1: 'status-active',
  2: 'status-instorage',
  3: 'status-undermaintenance',
  4: 'status-assigned',
  5: 'status-lost',
  6: 'status-damaged',
  7: 'status-retired',
  8: 'status-disposed'
};
