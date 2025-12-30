import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'atom-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
})
export class StepperUIComponent {
  @Input() steps: any[] = [];   // dynamic labels source (json or passed array)
  @Input() active: number = 0;  // parent controls position
}
