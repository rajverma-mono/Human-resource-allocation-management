import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'atom-project-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atom-project-card.component.html'
})
export class ProjectCardComponent {
  @Input() data: any;
  @Output() cardClick = new EventEmitter<any>();

  getStatusClass() {
    return {
      'bg-green-100 text-green-700': this.data.projectStatus === 'Active',
      'bg-yellow-100 text-yellow-700': this.data.projectStatus === 'On-Hold',
      'bg-red-100 text-red-700': this.data.projectStatus === 'Closed'
    };
  }
}
