import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'atom-stepper',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule   // ✅ REQUIRED for <mat-icon>
  ],
  templateUrl: './stepper.component.html',
})
export class StepperUIComponent {

  @Input() steps: any[] = [];
  @Input() active: number = 0;

  /**
   * Returns Material icon name from JSON
   * Example JSON: { icon: 'person' }
   */
  getStepIcon(step: any): string | null {
    return step?.icon ?? null;
  }

  /**
   * Step number fallback (1,2,3...)
   */
  getStepNumber(index: number): number {
    return index + 1;
  }

  /**
   * Optional: completed step check
   * Can be used later for ✔ check_circle icons
   */
  isCompleted(index: number): boolean {
    return index < this.active;
  }

  /**
   * Optional: active step check
   */
  isActive(index: number): boolean {
    return index === this.active;
  }
}
