export interface OrganizationUnit {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assetCount: number;
  children: OrganizationUnit[];
}

export interface CreateOrganizationUnitRequest {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
}

export interface UpdateOrganizationUnitRequest {
  name: string;
  code: string;
  description?: string;
}

export interface MoveOrganizationUnitRequest {
  newParentId?: string;
}
