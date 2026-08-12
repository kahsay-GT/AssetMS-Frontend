import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['snack-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  error(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['snack-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  apiError(err: any): void {
    const message = err?.error?.error ?? err?.error?.message ?? err?.message ?? 'An unexpected error occurred.';
    this.error(message);
  }
}
