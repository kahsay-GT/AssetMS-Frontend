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
      <div class="login-card fade-in">

        <!-- Logo -->
        <div class="card-logo-wrap">
          <img src="logo.png" alt="Raras Technologies" class="card-logo" />
        </div>

        <!-- Heading -->
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
          Protected by enterprise-grade security.<br>
        </p>
      </div>
    </div>
  `,
  styles: [`
    /* ── Page root: full-screen centered ─────────────────────── */
    .login-root {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      font-family: 'Inter', sans-serif;
      margin-top: -40px;
    }

    /* ── Card ─────────────────────────────────────────────────── */
    .login-card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      padding: 44px 40px 36px;
      display: flex;
      flex-direction: column;
    }

    /* Logo */
    .card-logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .card-logo {
      height: 42px;
      width: auto;
      object-fit: contain;
    }

    /* Heading */
    .card-heading {
      text-align: center;
      margin-bottom: 32px;

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

    /* ── Form ─────────────────────────────────────────────────── */
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
      width: 16px !important;
      height: 16px !important;
      color: #94a3b8;
      margin-left: 14px;
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .is-focused .field-icon { color: #6366f1; }
    .is-error   .field-icon { color: #f87171; }

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
        font-size: 17px !important;
        width: 17px !important;
        height: 17px !important;
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

    /* Footer note */
    .card-footer {
      margin: 24px 0 0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.7;
    }

    /* ── Responsive ───────────────────────────────────────────── */
    @media (max-width: 480px) {
      .login-card { padding: 32px 24px 28px; border-radius: 16px; }
    }
  `]
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading      = false;
  showPwd      = false;
  errorMsg     = '';
  emailFocused = false;
  pwdFocused   = false;

  get f() { return this.form.controls; }

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
