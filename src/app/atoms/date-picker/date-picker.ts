import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'atom-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-picker.html'
})
export class DatePickerAtomComponent {

  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  @Input() placeholder: string = 'Select date';
  @Input() range: boolean = false;
  @Input() label: string = '';

  @Input() className: string = '';
  @Input() disabled: boolean = false;

  @Input() opens: 'left' | 'right' | 'center' = 'left';
  @Input() drop: 'down' | 'up' = 'down';

  @Input() dateFormat: string = 'yyyy-MM-dd'; // frontend format use
  @Input() minDate?: string;
  @Input() maxDate?: string;

  @Input() validate?: (val: string) => boolean;
  @Output() onValidate = new EventEmitter<boolean>();

  @Input() autoApply: boolean = true;

  @Input() icon?: string;
  @Input() iconColor: string = 'gray';
  @Input() iconWidth: number = 18;
  @Input() iconHeight: number = 18;

  error: string | null = null;

  onDateChange(val: string) {
    this.value = val;
    this.valueChange.emit(val);

    if (this.validate) {
      const valid = this.validate(val);
      this.onValidate.emit(valid);
      this.error = valid ? null : 'Invalid date';
    } else {
      this.error = null;
    }
  }
}
