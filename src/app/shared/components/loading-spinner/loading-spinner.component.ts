import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      @if (message) { <p class="loading-msg">{{ message }}</p> }
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 64px 24px; gap: 16px;
    }
    .loading-msg { font-size: 13.5px; color: #94a3b8; margin: 0; }
  `]
})
export class LoadingSpinnerComponent {
  @Input() diameter = 40;
  @Input() message  = '';
}
