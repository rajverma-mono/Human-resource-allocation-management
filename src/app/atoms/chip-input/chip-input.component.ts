import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'atom-chip-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatChipsModule, MatFormFieldModule],
  templateUrl: './chip-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipInputAtomComponent),
      multi: true
    }
  ]
})
export class ChipInputAtomComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Type and press Enter...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() maxChips = 50;
  @Input() separatorKeys = [',', 'Enter', ';'];
  @Input() hint = '';
  @Input() errorMessage = '';
  
  @Output() chipAdded = new EventEmitter<string>();
  @Output() chipRemoved = new EventEmitter<string>();

  chips: string[] = [];
  inputValue = '';
  
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  addChip(event?: any): void {
    const value = (event?.value || this.inputValue).trim();
    
    if (!value || this.disabled) return;
    
    // Check if chip already exists
    if (!this.chips.includes(value)) {
      // Check max chips limit
      if (this.maxChips && this.chips.length >= this.maxChips) {
        return;
      }
      this.chips.push(value);
      this.onChange(this.chips);
      this.chipAdded.emit(value);
    }
    
    this.inputValue = '';
    
    if (event?.chipInput) {
      event.chipInput.clear();
    }
  }

  removeChip(chip: string): void {
    const index = this.chips.indexOf(chip);
    if (index >= 0) {
      this.chips.splice(index, 1);
      this.onChange(this.chips);
      this.chipRemoved.emit(chip);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.separatorKeys.includes(event.key)) {
      event.preventDefault();
      this.addChip();
    }
  }

  // ControlValueAccessor methods
  writeValue(value: string[] | string): void {
    if (value) {
      if (typeof value === 'string') {
        this.chips = value.split(',').map(chip => chip.trim()).filter(chip => chip);
      } else if (Array.isArray(value)) {
        this.chips = [...value];
      }
    } else {
      this.chips = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Public method for template to access onTouched
  onTouchedFn(): void {
    this.onTouched();
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get hasError(): boolean {
    return this.required && this.chips.length === 0;
  }
}