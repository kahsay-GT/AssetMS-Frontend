import { Routes } from '@angular/router';
import { authGuard, loggedInGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public — redirect to dashboard if already logged in
  {
    path: 'login',
    canActivate: [loggedInGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '403',
    loadComponent: () => import('./features/error/forbidden.component').then(m => m.ForbiddenComponent)
  },

  // Protected — inside shell layout
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'organization',
        loadComponent: () => import('./features/organization/organization.component').then(m => m.OrganizationComponent)
      },
      {
        path: 'assets',
        loadComponent: () => import('./features/assets/asset-list/asset-list.component').then(m => m.AssetListComponent)
      },
      {
        path: 'assets/new',
        loadComponent: () => import('./features/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent),
        canActivate: [roleGuard(['Manager', 'Administrator'])]
      },
      {
        path: 'assets/:id/edit',
        loadComponent: () => import('./features/assets/asset-form/asset-form.component').then(m => m.AssetFormComponent),
        canActivate: [roleGuard(['Manager', 'Administrator'])]
      },
      {
        path: 'assets/:id',
        loadComponent: () => import('./features/assets/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
        canActivate: [roleGuard(['Administrator'])]
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent),
        canActivate: [roleGuard(['Administrator'])]
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
        canActivate: [roleGuard(['Administrator'])]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
