import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'atom-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-picker.html',
  styleUrls: ['./date-picker.scss']
})
export class DatePickerAtomComponent {

  @Input() value: string = "";
  @Output() valueChange = new EventEmitter<string>();

  @Input() label: string = "";
  @Input() placeholder: string = "Select date";
  @Input() required: boolean = false;
  @Input() helperText?: string;
  @Input() className: string = "";

  @Input() disabled: boolean = false;
  @Input() minDate?: string;
  @Input() maxDate?: string;

  @Input() validate?: (date: string) => boolean;     // optional custom validator
  @Output() onValidate = new EventEmitter<boolean>();

  @Input() icon?: string;
  @Input() iconWidth: number = 20;
  @Input() iconHeight: number = 20;
  @Input() iconColor: string = "gray";

  internalError: string | null = null;


  onDateChange(val: string) {
    this.value = val;
    this.valueChange.emit(val);

    if (this.validate) {
      const ok = this.validate(val);
      this.onValidate.emit(ok);
      this.internalError = ok ? null : "Invalid date";
    } else this.validateRequired();
  }

  validateRequired() {
    if (this.required && !this.value) this.internalError = `${this.label || "Date"} is required`;
    else this.internalError = null;
  }

  get finalError() { return this.internalError; }
  get hasError() { return !!this.finalError; }

  // FIX for showPicker error
  openCalendar(input: HTMLInputElement) {
    if ((input as any).showPicker) (input as any).showPicker();
    else input.click();
  }
}
