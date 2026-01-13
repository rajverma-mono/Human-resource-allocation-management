import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'atom-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './multi-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectAtomComponent),
      multi: true
    }
  ]
})
export class MultiSelectAtomComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Select options...';
  @Input() required = false;
  @Input() disabled = false;
  @Input() options: { value: any; label: string; disabled?: boolean }[] = [];
  @Input() maxSelections = 0; // 0 = unlimited
  @Input() searchable = false;
  @Input() clearable = true;
  @Input() errorMessage = '';
  
  @Output() selectionChange = new EventEmitter<any[]>();

  selectedValues: any[] = [];
  isOpen = false;
  searchQuery = '';
  
  private onChange: (value: any[]) => void = () => {};
  private onTouched: () => void = () => {};

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    this.onTouched();
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  isSelected(value: any): boolean {
    return this.selectedValues.includes(value);
  }

  toggleSelection(option: any): void {
    if (this.disabled || option.disabled) return;

    const index = this.selectedValues.indexOf(option.value);
    
    if (index === -1) {
      // Add selection
      if (this.maxSelections > 0 && this.selectedValues.length >= this.maxSelections) {
        return;
      }
      this.selectedValues.push(option.value);
    } else {
      // Remove selection
      this.selectedValues.splice(index, 1);
    }

    this.onChange(this.selectedValues);
    this.selectionChange.emit(this.selectedValues);
  }
// Add these methods to the class
getSelectedLabel(value: any): string {
  const option = this.options.find(opt => opt.value === value);
  return option ? option.label : String(value);
}

trackByValue(index: number, option: any): any {
  return option.value;
}
  clearSelection(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.disabled) return;
    
    this.selectedValues = [];
    this.onChange(this.selectedValues);
    this.selectionChange.emit(this.selectedValues);
  }

  removeSelection(value: any, event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    
    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
      this.onChange(this.selectedValues);
      this.selectionChange.emit(this.selectedValues);
    }
  }

  get filteredOptions() {
    if (!this.searchQuery) return this.options;
    
    const query = this.searchQuery.toLowerCase();
    return this.options.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  }

  get selectedLabels(): string[] {
    return this.selectedValues.map(value => {
      const option = this.options.find(opt => opt.value === value);
      return option ? option.label : value;
    });
  }

  get displayText(): string {
    if (this.selectedValues.length === 0) {
      return this.placeholder;
    }
    
    if (this.selectedValues.length === 1) {
      const option = this.options.find(opt => opt.value === this.selectedValues[0]);
      return option ? option.label : '1 item selected';
    }
    
    return `${this.selectedValues.length} items selected`;
  }

  // ControlValueAccessor methods
  writeValue(value: any[]): void {
    this.selectedValues = value ? [...value] : [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get hasError(): boolean {
    return this.required && this.selectedValues.length === 0;
  }
}