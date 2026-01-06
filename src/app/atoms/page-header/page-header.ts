import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule   // ✅ REQUIRED
  ],
  templateUrl: './page-header.html',
})
export class PageHeaderComponent {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() icon?: string; // material icon name (e.g. "person")
}
