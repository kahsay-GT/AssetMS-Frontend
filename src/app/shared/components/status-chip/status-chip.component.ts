import { Component, Input } from '@angular/core';
import { ASSET_STATUS_CSS, ASSET_STATUS_LABELS } from '../../../core/models/asset.models';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `<span class="status-chip" [class]="cssClass">{{ label }}</span>`
})
export class StatusChipComponent {
  @Input() status!: number;
  get label()    { return ASSET_STATUS_LABELS[this.status] ?? 'Unknown'; }
  get cssClass() { return ASSET_STATUS_CSS[this.status] ?? ''; }
}
