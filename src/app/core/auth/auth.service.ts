import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { CurrentUser, LoginRequest, LoginResponse } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY    = 'assetms_token';
  private readonly USER_KEY     = 'assetms_user';
  private readonly EXPIRES_KEY  = 'assetms_expires';

  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  // ── Public getters ─────────────────────────────────────────────────────────

  get isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token || !this.currentUserSubject.value) return false;
    // Check token expiry from stored timestamp
    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    if (expiresAt && Date.now() > Number(expiresAt)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  // ── Auth actions ────────────────────────────────────────────────────────────

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        // Store expiry (8 hours from now, matching backend setting)
        const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
        localStorage.setItem(this.EXPIRES_KEY, String(expiresAt));
        // Store user info immediately from login response
        const user: CurrentUser = {
          id: '',
          email: response.email,
          fullName: response.fullName,
          firstName: response.fullName.split(' ')[0],
          lastName: response.fullName.split(' ').slice(1).join(' '),
          roles: response.roles,
          isActive: true
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        // Then fetch full profile in background
        this.fetchAndCacheCurrentUser().pipe(catchError(() => of(null))).subscribe();
      })
    );
  }

  fetchAndCacheCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    this.currentUserSubject.next(null);
  }

  private loadUser(): CurrentUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      if (!raw) return null;
      // Check expiry before restoring
      const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
      if (expiresAt && Date.now() > Number(expiresAt)) {
        this.clearSession();
        return null;
      }
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}
