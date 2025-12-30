import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-header.html',
})
export class SectionHeaderComponent {

  @Input() icon: string = '';           // e.g. "fas fa-id-card"
  @Input() title!: string;              // REQUIRED
  @Input() borderColor: string = '#FEE2E2'; // Optional custom section highlight
  @Input() textColor: string = '#E31E24';   // Main heading color

}
