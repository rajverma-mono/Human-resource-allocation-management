import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'details-composite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-composite.component.html'
})
export class DetailsCompositeComponent {

  @Input() config!: any;   // JSON config
  @Input() data!: any;     // entity data (project / employee)

  @Output() action = new EventEmitter<string>();

  emitAction(action: string) {
    this.action.emit(action);
  }

  getStatusClass() {
    if (!this.config?.status || !this.data) return '';
    return this.config.status.classMap?.[this.data[this.config.status.key]] || '';
  }
}
