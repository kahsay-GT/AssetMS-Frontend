import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-root">

      <!-- ── Left panel ──────────────────────────────────────── -->
      <div class="login-left">
        <!-- Subtle grid overlay -->
        <div class="left-grid"></div>
        <!-- Glow orbs -->
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>

        <div class="left-content">
          <!-- Logo -->
          <div class="left-logo-wrap">
            <img src="logo.png" alt="Raras Technologies" class="left-logo" />
          </div>

          <!-- Divider line -->
          <div class="left-divider"></div>

          <!-- Product name -->
          <div class="left-product">
            <h1 class="left-product-name">Asset Management<br />System</h1>
            <p class="left-product-version">Version · v1.0</p>
          </div>

          <!-- Stats row -->
          
        </div>

        <!-- Bottom copy -->
        <p class="left-copy">© 2026 RARAS Technologies. All rights reserved.</p>
      </div>

      <!-- ── Right panel ─────────────────────────────────────── -->
      <div class="login-right">
        <div class="login-card fade-in">

          <!-- Logo for mobile / card header -->
          <div class="card-logo-wrap">
            <img src="logo.png" alt="Raras Technologies" class="card-logo" />
          </div>

          <div class="card-heading">
            <h2>Sign in</h2>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="login-form">

            <!-- Email -->
            <div class="field">
              <label class="field-label" for="email">Email address</label>
              <div class="field-wrap" [class.is-error]="f['email'].touched && f['email'].invalid"
                                      [class.is-focused]="emailFocused">
                <mat-icon class="field-icon">email</mat-icon>
                <input id="email" formControlName="email" type="email"
                       autocomplete="email" placeholder="name@company.com"
                       class="field-input"
                       (focus)="emailFocused=true" (blur)="emailFocused=false" />
              </div>
              @if (f['email'].touched && f['email'].hasError('required')) {
                <p class="field-error">Email is required.</p>
              } @else if (f['email'].touched && f['email'].hasError('email')) {
                <p class="field-error">Please enter a valid email address.</p>
              }
            </div>

            <!-- Password -->
            <div class="field">
              <label class="field-label" for="password">Password</label>
              <div class="field-wrap" [class.is-error]="f['password'].touched && f['password'].invalid"
                                      [class.is-focused]="pwdFocused">
                <mat-icon class="field-icon">lock</mat-icon>
                <input id="password" formControlName="password"
                       [type]="showPwd ? 'text' : 'password'"
                       autocomplete="current-password" placeholder="••••••••"
                       class="field-input"
                       (focus)="pwdFocused=true" (blur)="pwdFocused=false" />
                <button type="button" class="field-eye" (click)="showPwd=!showPwd"
                        [attr.aria-label]="showPwd ? 'Hide password' : 'Show password'">
                  <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              @if (f['password'].touched && f['password'].hasError('required')) {
                <p class="field-error">Password is required.</p>
              }
            </div>

            <!-- API error -->
            @if (errorMsg) {
              <div class="error-banner" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMsg }}</span>
              </div>
            }

            <!-- Submit -->
            <button type="submit" class="submit-btn" [disabled]="loading || form.invalid">
              @if (loading) {
                <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                <span>Signing in…</span>
              } @else {
                <span>Sign In</span>
                <mat-icon class="btn-arrow">arrow_forward</mat-icon>
              }
            </button>
          </form>

          <p class="card-footer">
            Protected by enterprise-grade security.
          </p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Root ────────────────────────────────────────────────── */
    .login-root {
      min-height: 100vh;
      display: flex;
      background: #fff;
      font-family: 'Inter', sans-serif;
    }

    /* ══════════════════════════════════════════════════════════
       LEFT PANEL
    ══════════════════════════════════════════════════════════ */
    .login-left {
      width: 48%;
      background: #0b0a1e;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 64px 56px;
      flex-shrink: 0;
    }

    /* Subtle dot-grid overlay */
    .left-grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 28px 28px;
      z-index: 0;
    }

    /* Glow orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 0;
      pointer-events: none;
    }
    .orb-1 {
      width: 420px; height: 420px;
      background: rgba(99,102,241,0.18);
      top: -100px; right: -120px;
    }
    .orb-2 {
      width: 280px; height: 280px;
      background: rgba(239,68,68,0.12);
      bottom: 60px; left: -80px;
    }
    .orb-3 {
      width: 180px; height: 180px;
      background: rgba(139,92,246,0.1);
      bottom: -40px; right: 80px;
    }

    /* Content */
    .left-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 36px;
      width: 100%;
      max-width: 400px;
    }

    /* Logo */
    .left-logo-wrap { display: flex; }
    .left-logo {
      height: 48px;
      width: auto;
      object-fit: contain;
      filter: brightness(0) invert(1);
      opacity: 0.92;
    }

    /* Divider */
    .left-divider {
      width: 48px;
      height: 3px;
      background: linear-gradient(90deg, #ef4444, #6366f1);
      border-radius: 99px;
    }

    /* Product name */
    .left-product-name {
      font-size: 38px;
      font-weight: 800;
      color: #fff;
      line-height: 1.18;
      letter-spacing: -1px;
      margin: 0 0 10px;
    }

    .left-product-version {
      font-size: 12.5px;
      font-weight: 600;
      color: rgba(255,255,255,0.3);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0;
    }

    /* Stats row */
    .left-stats {
      display: flex;
      gap: 40px;
      padding-top: 4px;
    }

    .left-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .left-stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      line-height: 1;
    }

    .left-stat-label {
      font-size: 11.5px;
      font-weight: 500;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    /* Bottom copy */
    .left-copy {
      position: absolute;
      bottom: 28px;
      left: 56px;
      right: 56px;
      font-size: 11.5px;
      color: rgba(255,255,255,0.2);
      margin: 0;
      z-index: 1;
    }

    /* ══════════════════════════════════════════════════════════
       RIGHT PANEL
    ══════════════════════════════════════════════════════════ */
    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 40px 32px;
      overflow-y: auto;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
      padding: 44px 40px 36px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Card logo — shown on mobile when left panel hides */
    .card-logo-wrap {
      display: none;
      justify-content: center;
      margin-bottom: 28px;
    }

    .card-logo {
      height: 40px;
      object-fit: contain;
    }

    /* Heading */
    .card-heading {
      margin-bottom: 32px;
      text-align: center;

      h2 {
        font-size: 24px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.4px;
        margin: 0 0 6px;
      }

      p {
        font-size: 13.5px;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
      }
    }

    /* ── Form ─────────────────────────────────────────────── */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .field-wrap {
      display: flex;
      align-items: center;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      overflow: hidden;

      &.is-focused {
        border-color: #6366f1;
        background: #fff;
        box-shadow: 0 0 0 3.5px rgba(99,102,241,0.11);
      }

      &.is-error {
        border-color: #f87171;
        background: #fff7f7;

        &.is-focused {
          box-shadow: 0 0 0 3.5px rgba(248,113,113,0.13);
        }
      }
    }

    .field-icon {
      font-size: 16px !important;
      width: 16px !important; height: 16px !important;
      color: #94a3b8;
      margin-left: 14px;
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .is-focused .field-icon { color: #6366f1; }
    .is-error  .field-icon  { color: #f87171; }

    .field-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 12px 12px;
      font-size: 14px;
      color: #0f172a;
      font-family: 'Inter', sans-serif;

      &::placeholder { color: #c1cdd9; font-size: 13.5px; }
    }

    .field-eye {
      background: none;
      border: none;
      padding: 0 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #94a3b8;
      transition: color 0.13s;
      flex-shrink: 0;

      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
      &:hover { color: #6366f1; }
    }

    .field-error {
      font-size: 12px;
      color: #ef4444;
      font-weight: 500;
      margin: 0;
    }

    /* Error banner */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 9px;
      background: #fff1f2;
      border: 1px solid #fecdd3;
      border-radius: 10px;
      padding: 11px 14px;
      color: #be123c;
      font-size: 13.5px;
      font-weight: 500;

      mat-icon {
        font-size: 17px !important; width: 17px !important; height: 17px !important;
        flex-shrink: 0;
      }
    }

    /* Submit button */
    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 48px;
      background: #0f172a;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14.5px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.01em;
      transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
      font-family: 'Inter', sans-serif;
      margin-top: 4px;

      .btn-spinner { --mdc-circular-progress-active-indicator-color: #fff; }
      .btn-arrow { font-size: 17px !important; width: 17px !important; height: 17px !important; }

      &:hover:not(:disabled) {
        background: #1e293b;
        box-shadow: 0 6px 20px rgba(15,23,42,0.25);
        transform: translateY(-1px);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: none;
      }

      &:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        transform: none;
      }
    }

    /* Card footer */
    .card-footer {
      margin: 24px 0 0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 860px) {
      .login-left { display: none; }
      .login-right { background: #fff; }
      .card-logo-wrap { display: flex; }
      .login-card { box-shadow: none; max-width: 100%; }
    }

    @media (max-width: 480px) {
      .login-right { padding: 24px 16px; }
      .login-card { padding: 32px 24px 28px; border-radius: 16px; }
    }
  `]
})
export class LoginComponent {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading    = false;
  showPwd    = false;
  errorMsg   = '';
  emailFocused = false;
  pwdFocused   = false;

  get f() { return this.form.controls; }

  stats = [
    { value: '10K+',  label: 'Assets Tracked' },
    { value: '99.9%', label: 'Uptime SLA'     },
    { value: '256-bit', label: 'Encryption'   },
  ];

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading  = true;
    this.errorMsg = '';

    this.auth.login({ email: this.f['email'].value!, password: this.f['password'].value! }).subscribe({
      next: () => {
        const url = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(url);
      },
      error: err => {
        this.loading  = false;
        this.errorMsg = err?.error?.error ?? 'Invalid credentials. Please try again.';
      },
      complete: () => { this.loading = false; }
    });
  }
}
