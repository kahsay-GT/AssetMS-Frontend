import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;background:#f8fafc;">
      <div style="width:80px;height:80px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <mat-icon style="font-size:40px;width:40px;height:40px;color:#dc2626;">block</mat-icon>
      </div>
      <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin:0;">Access Denied</h1>
      <p style="color:#64748b;font-size:15px;margin:0;">You don't have permission to view this page.</p>
      <a mat-raised-button color="primary" routerLink="/dashboard">Go to Dashboard</a>
    </div>
  `
})
export class ForbiddenComponent {}
