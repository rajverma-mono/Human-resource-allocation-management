import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'atom-toggle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toggle.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleAtomComponent),
      multi: true
    }
  ]
})
export class ToggleAtomComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() description = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'primary';
  
  @Output() valueChange = new EventEmitter<boolean>();

  value = false;
  
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.disabled) return;
    
    this.value = !this.value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }

  // ControlValueAccessor methods
  writeValue(value: boolean): void {
    this.value = !!value;
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

  get sizeClasses(): string {
    const sizes = {
      sm: 'w-8 h-4 after:h-3 after:w-3',
      md: 'w-11 h-6 after:h-5 after:w-5',
      lg: 'w-14 h-7 after:h-6 after:w-6'
    };
    return sizes[this.size];
  }

  get variantClasses(): { on: string, off: string } {
    const variants = {
      default: { on: 'bg-gray-400', off: 'bg-gray-300' },
      primary: { on: 'bg-gradient-to-r from-[#5b0f14] to-[#7a1419]', off: 'bg-gray-300' },
      success: { on: 'bg-gradient-to-r from-emerald-500 to-emerald-700', off: 'bg-gray-300' },
      warning: { on: 'bg-gradient-to-r from-amber-500 to-amber-700', off: 'bg-gray-300' },
      danger: { on: 'bg-gradient-to-r from-rose-500 to-rose-700', off: 'bg-gray-300' }
    };
    return variants[this.variant];
  }
}