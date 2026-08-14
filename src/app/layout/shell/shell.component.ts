import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

interface NavGroup { label: string; items: NavItem[]; }
interface NavItem  { label: string; icon: string; route: string; roles?: string[]; badge?: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterModule,
    MatSidenavModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatDividerModule, MatTooltipModule, MatRippleModule
  ],
  template: `
    <mat-sidenav-container class="shell-root">

      <!-- ═══════════════════════════════════════════════════════════
           SIDEBAR
      ═══════════════════════════════════════════════════════════ -->
      <mat-sidenav #sidenav mode="side" [opened]="sidebarOpen()"
                   class="app-sidebar" fixedInViewport>

        <!-- Brand header -->
        <div class="sb-brand">
          <div class="sb-brand-logo">
            <mat-icon>inventory_2</mat-icon>
          </div>
          <div class="sb-brand-text" *ngIf="sidebarOpen()">
            <span class="sb-brand-name">AssetMS</span>
            <span class="sb-brand-sub">RARAS Technologies</span>
          </div>
          <button class="sb-collapse-btn" (click)="toggleSidebar()"
                  [matTooltip]="sidebarOpen() ? 'Collapse sidebar' : 'Expand sidebar'"
                  matTooltipPosition="right">
            <mat-icon>{{ sidebarOpen() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
          </button>
        </div>

        <!-- Nav groups -->
        <nav class="sb-nav">
          @for (group of visibleGroups; track group.label) {
            @if (sidebarOpen()) {
              <div class="sb-group-label">{{ group.label }}</div>
            }
            @for (item of group.items; track item.route) {
              <a [routerLink]="item.route"
                 routerLinkActive="sb-item-active"
                 class="sb-item"
                 [class.sb-item-collapsed]="!sidebarOpen()"
                 [matTooltip]="!sidebarOpen() ? item.label : ''"
                 matTooltipPosition="right"
                 matRipple matRippleColor="rgba(255,255,255,0.06)">
                <span class="sb-item-icon-wrap">
                  <mat-icon class="sb-item-icon">{{ item.icon }}</mat-icon>
                </span>
                @if (sidebarOpen()) {
                  <span class="sb-item-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="sb-item-badge">{{ item.badge }}</span>
                  }
                }
                <span class="sb-item-indicator"></span>
              </a>
            }
          }
        </nav>

        <!-- User footer -->
        
      </mat-sidenav>

      <!-- ═══════════════════════════════════════════════════════════
           MAIN CONTENT
      ═══════════════════════════════════════════════════════════ -->
      <mat-sidenav-content class="app-content">

        <!-- Top bar -->
        <header class="app-topbar">
          <div class="topbar-left">
            <button mat-icon-button (click)="toggleSidebar()" class="topbar-menu-btn">
              <mat-icon>{{ sidebarOpen() ? 'menu_open' : 'menu' }}</mat-icon>
            </button>
            <div class="topbar-breadcrumb">
              <mat-icon class="breadcrumb-icon">{{ currentPageIcon }}</mat-icon>
              <span class="topbar-title">{{ currentPageTitle }}</span>
            </div>
          </div>

          <div class="topbar-right">
            @if (currentUser) {
              <div class="topbar-user" [matMenuTriggerFor]="topMenu">
                <div class="topbar-avatar">{{ initials }}</div>
                <div class="topbar-user-text">
                  <span class="topbar-name">{{ currentUser.fullName }}</span>
                  <span class="topbar-role" [style.color]="roleAccent(currentUser.roles[0])">
                    {{ currentUser.roles[0] }}
                  </span>
                </div>
                <mat-icon class="topbar-chevron">expand_more</mat-icon>
              </div>
            }

            <mat-menu #topMenu="matMenu">
              <div class="sb-menu-profile">
                <div class="sb-menu-avatar">{{ initials }}</div>
                <div>
                  <p class="sb-menu-name">{{ currentUser?.fullName }}</p>
                  <p class="sb-menu-email">{{ currentUser?.email }}</p>
                </div>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon style="color:#ef4444">logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Page body -->
        <main class="app-body">
          <router-outlet />
        </main>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    /* ── Root ─────────────────────────────────────────────────── */
    .shell-root { height: 100vh; }

    /* ══════════════════════════════════════════════════════════
       SIDEBAR
    ══════════════════════════════════════════════════════════ */
    .app-sidebar {
      width: 256px;
      background: linear-gradient(180deg, #0f0c29 0%, #1a1744 40%, #1e1b4b 100%) !important;
      border-right: none !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.25s cubic-bezier(.4,0,.2,1);
    }

    /* Brand */
    .sb-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 14px 16px;
      position: relative;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .sb-brand-logo {
      width: 40px; height: 40px; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);

      mat-icon {
        font-size: 22px; width: 22px; height: 22px;
        color: #fff;
      }
    }

    .sb-brand-text {
      flex: 1; min-width: 0;
      overflow: hidden;
    }

    .sb-brand-name {
      display: block;
      font-size: 16px; font-weight: 800;
      color: #fff;
      letter-spacing: -0.3px;
      line-height: 1.2;
      white-space: nowrap;
    }

    .sb-brand-sub {
      display: block;
      font-size: 10px; font-weight: 500;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-top: 1px;
      white-space: nowrap;
    }

    .sb-collapse-btn {
      width: 26px; height: 26px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      color: rgba(255,255,255,0.4);
      transition: background 0.15s, color 0.15s;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &:hover { background: rgba(255,255,255,0.12); color: #fff; }
    }

    /* Nav */
    .sb-nav {
      flex: 1;
      padding: 12px 10px 8px;
      display: flex; flex-direction: column;
      gap: 1px;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;

      &::-webkit-scrollbar { width: 3px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
    }

    .sb-group-label {
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: rgba(255,255,255,0.25);
      padding: 10px 10px 4px;
      margin-top: 4px;
    }

    .sb-item {
      display: flex; align-items: center; gap: 11px;
      padding: 9px 10px;
      border-radius: 9px;
      text-decoration: none;
      position: relative;
      overflow: hidden;
      transition: background 0.15s;
      cursor: pointer;

      &:hover { background: rgba(255,255,255,0.07); }
    }

    .sb-item-collapsed {
      justify-content: center;
      padding: 10px;

      .sb-item-icon-wrap { margin: 0; }
    }

    .sb-item-icon-wrap {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      background: rgba(255,255,255,0.05);
      transition: background 0.15s;
    }

    .sb-item-icon {
      font-size: 17px !important; width: 17px !important; height: 17px !important;
      color: rgba(255,255,255,0.5);
      transition: color 0.15s;
    }

    .sb-item-label {
      font-size: 13.5px; font-weight: 500;
      color: rgba(255,255,255,0.65);
      flex: 1;
      white-space: nowrap;
      transition: color 0.15s;
    }

    .sb-item-badge {
      font-size: 10px; font-weight: 700;
      background: #6366f1; color: #fff;
      padding: 1px 6px; border-radius: 99px;
      flex-shrink: 0;
    }

    .sb-item-indicator {
      position: absolute; right: 0; top: 50%;
      transform: translateY(-50%) scaleX(0);
      width: 3px; height: 20px;
      background: #818cf8;
      border-radius: 99px 0 0 99px;
      transition: transform 0.15s;
    }

    /* Active state */
    .sb-item-active {
      background: rgba(99,102,241,0.18) !important;

      .sb-item-icon-wrap {
        background: rgba(99,102,241,0.25);
      }
      .sb-item-icon { color: #a5b4fc !important; }
      .sb-item-label { color: #fff !important; font-weight: 600; }
      .sb-item-indicator { transform: translateY(-50%) scaleX(1); }
    }

    /* Hover icon tint */
    .sb-item:not(.sb-item-active):hover .sb-item-icon { color: rgba(255,255,255,0.75); }
    .sb-item:not(.sb-item-active):hover .sb-item-label { color: rgba(255,255,255,0.9); }

    /* Footer */
    .sb-footer {
      flex-shrink: 0;
      padding: 8px 10px 12px;
    }

    .sb-footer-divider {
      height: 1px;
      background: rgba(255,255,255,0.07);
      margin-bottom: 10px;
    }

    .sb-user {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.04);
      transition: background 0.15s, border-color 0.15s;

      &:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
    }

    .sb-user-collapsed {
      display: flex; justify-content: center;
      padding: 6px 0;
      cursor: pointer;
    }

    .sb-user-avatar {
      width: 32px; height: 32px; flex-shrink: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(99,102,241,0.35);
    }

    .sb-user-info { flex: 1; min-width: 0; overflow: hidden; }
    .sb-user-name {
      display: block; font-size: 12.5px; font-weight: 600;
      color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sb-user-role {
      display: block; font-size: 11px; font-weight: 500;
      margin-top: 1px; white-space: nowrap;
    }
    .sb-user-chevron {
      font-size: 16px !important; width: 16px !important; height: 16px !important;
      color: rgba(255,255,255,0.3) !important; flex-shrink: 0;
    }

    /* Sidebar user menu */
    ::ng-deep .mat-mdc-menu-content { padding: 0 !important; }

    .sb-menu-profile {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .sb-menu-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(99,102,241,0.3);
      flex-shrink: 0;
    }
    .sb-menu-name  { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
    .sb-menu-email { font-size: 12px; color: #64748b; margin: 0; }

    /* ══════════════════════════════════════════════════════════
       TOPBAR
    ══════════════════════════════════════════════════════════ */
    .app-content { background: #f8fafc; }

    .app-topbar {
      display: flex; align-items: center; justify-content: space-between;
      height: 58px; padding: 0 24px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 1px 0 #e2e8f0;
    }

    .topbar-left { display: flex; align-items: center; gap: 12px; }

    .topbar-menu-btn { color: #64748b !important; }

    .topbar-breadcrumb {
      display: flex; align-items: center; gap: 8px;
    }

    .breadcrumb-icon {
      font-size: 16px !important; width: 16px !important; height: 16px !important;
      color: #6366f1;
    }

    .topbar-title {
      font-size: 15px; font-weight: 700; color: #0f172a;
    }

    .topbar-right { display: flex; align-items: center; gap: 8px; }

    .topbar-user {
      display: flex; align-items: center; gap: 10px;
      padding: 5px 10px 5px 6px; border-radius: 40px;
      cursor: pointer; border: 1px solid #e2e8f0;
      transition: background 0.15s, border-color 0.15s;
      &:hover { background: #f1f5f9; border-color: #c7d2fe; }
    }

    .topbar-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    .topbar-user-text { line-height: 1.2; }
    .topbar-name { display: block; font-size: 13px; font-weight: 600; color: #0f172a; }
    .topbar-role { display: block; font-size: 11px; font-weight: 500; }
    .topbar-chevron {
      font-size: 16px !important; width: 16px !important; height: 16px !important;
      color: #94a3b8 !important;
    }

    .app-body { padding: 28px; min-height: calc(100vh - 58px); }

    @media (max-width: 768px) {
      .app-body { padding: 16px; }
    }
  `]
})
export class ShellComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(true);

  private readonly navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard',    icon: 'dashboard',    route: '/dashboard' },
      ]
    },
    {
      label: 'Management',
      items: [
        { label: 'Organization', icon: 'account_tree', route: '/organization' },
        { label: 'Assets',       icon: 'devices',      route: '/assets' },
      ]
    },
    {
      label: 'Administration',
      items: [
        { label: 'Users',        icon: 'people',               route: '/users',      roles: ['Administrator'] },
        { label: 'Roles',        icon: 'admin_panel_settings', route: '/roles',      roles: ['Administrator'] },
        { label: 'Categories',   icon: 'category',             route: '/categories', roles: ['Administrator'] },
        { label: 'Audit Logs',   icon: 'manage_search',        route: '/audit',      roles: ['Administrator'] },
      ]
    }
  ];

  get currentUser()   { return this.auth.currentUser; }

  get visibleGroups() {
    return this.navGroups
      .map(g => ({ ...g, items: g.items.filter(i => !i.roles || i.roles.some(r => this.auth.hasRole(r))) }))
      .filter(g => g.items.length > 0);
  }

  get initials() {
    const u = this.currentUser;
    if (!u) return '?';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase();
  }

  get currentPageTitle() {
    const all = this.navGroups.flatMap(g => g.items);
    return all.find(i => location.pathname.startsWith(i.route))?.label ?? 'AssetMS';
  }

  get currentPageIcon() {
    const all = this.navGroups.flatMap(g => g.items);
    return all.find(i => location.pathname.startsWith(i.route))?.icon ?? 'home';
  }

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  logout()        { this.auth.logout(); }

  roleAccent(role: string) {
    return { Administrator: '#f87171', Manager: '#60a5fa', Viewer: '#34d399' }[role] ?? '#94a3b8';
  }
}
