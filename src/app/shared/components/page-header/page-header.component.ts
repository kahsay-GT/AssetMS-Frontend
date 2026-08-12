import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="page-header">
      <div class="flex items-center gap-3">
        @if (icon) {
          <div class="page-icon-wrap" [style.background]="iconBg">
            <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
          </div>
        }
        <div>
          <h1 class="page-title">{{ title }}</h1>
          @if (subtitle) { <p class="page-subtitle">{{ subtitle }}</p> }
        </div>
      </div>
      <ng-content />
    </div>
  `,
  styles: [`
    .page-icon-wrap {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() iconBg = '#ede9fe';
  @Input() iconColor = '#7c3aed';
}
