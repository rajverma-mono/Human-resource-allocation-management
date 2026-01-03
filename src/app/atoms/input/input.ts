import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type ValidationType =
  | 'name'
  | 'email'
  | 'mobile'
  | 'alphanumeric'
  | 'numeric'
  | 'pincode'
  | 'custom'
  | 'none';

@Component({
  selector: 'atom-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.html',
  styleUrls: ['./input.scss']
})
export class InputAtomComponent implements OnInit {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  
  @Input() set validation(value: string | ValidationType) {
    const validTypes: ValidationType[] = ['name', 'email', 'mobile', 'alphanumeric', 'numeric', 'pincode', 'custom', 'none'];
    this._validation = validTypes.includes(value as ValidationType) ? value as ValidationType : 'none';
  }
  get validation(): ValidationType {
    return this._validation;
  }
  private _validation: ValidationType = 'none';
  
  @Input() required: boolean = false;
  @Input() value: string = '';
  @Input() errorMessage: string = '';
  @Input() maxLength: number | null = null;
  @Input() fullWidth: boolean = true;
  @Input() disabled: boolean = false;
  @Input() borderColorClass: string = 'border-gray-300';
  @Input() className: string = '';
  @Input() rounded: string = 'rounded-lg';
  @Input() pattern?: RegExp;
  @Input() showVerifiedStatus: boolean = false;
  @Input() isVerified: boolean = false;
  @Input() showToggleIcon: boolean = false;
  @Input() backgroundColor: string = 'bg-white'; 
  @Input() borderColor: string = 'border-gray-300';
  @Output() valueChange = new EventEmitter<string>();
  @Output() onErrorChange = new EventEmitter<string | null>();
  @Output() onVerifiedChange = new EventEmitter<boolean>();

  isMasked = true;
  currentError: string | null = null;

  ngOnInit() {
    console.log('🔍 InputAtomComponent Debug:', {
      label: this.label,
      backgroundColor: this.backgroundColor,
      hasBackgroundColor: !!this.backgroundColor,
      backgroundColorValue: this.backgroundColor
    });
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['backgroundColor']) {
      console.log('🔍 backgroundColor changed:', {
        previous: changes['backgroundColor'].previousValue,
        current: changes['backgroundColor'].currentValue
      });
    }
    
    if (changes['value'] && this.value) {
      this.validate(this.value);
    }
  }

  onInput(val: string) {
    this.value = val;
    this.valueChange.emit(val);
    this.validate(val);
  }
getInputClasses(): { [key: string]: boolean } {
  const classes: { [key: string]: boolean } = {};
  
  if (this.currentError) {
    classes['border-red-500'] = true;
  }
  
  const bgClass = this.backgroundColor && this.backgroundColor.trim() !== '' 
    ? this.backgroundColor 
    : 'bg-white';
  
  classes[bgClass] = true;
  classes['test-highlight'] = true; 
  
  console.log('🎨 getInputClasses() - bgClass:', bgClass);
  return classes;
}
  toggleVisibility() {
    if (this.showToggleIcon) this.isMasked = !this.isMasked;
  }
  

  validate(val: string) {
    let error: string | null = null;

    if (this.required && !val.trim()) {
      error = `${this.label} is required`;
    }
    else if (this.validation === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (val && !emailRegex.test(val)) {
        error = this.errorMessage || 'Invalid email address';
      }
    }
    else if (this.validation === 'mobile') {
      const mobileRegex = /^[0-9]{10}$/;
      if (val && !mobileRegex.test(val)) {
        error = this.errorMessage || 'Mobile number must be 10 digits';
      }
    }
    else if (this.validation === 'numeric') {
      const numericRegex = /^[0-9]+$/;
      if (val && !numericRegex.test(val)) {
        error = this.errorMessage || 'Only numbers allowed';
      }
    }
    else if (this.validation === 'alphanumeric') {
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (val && !alphanumericRegex.test(val)) {
        error = this.errorMessage || 'Only alphanumeric characters allowed';
      }
    }
    else if (this.validation === 'name') {
      const nameRegex = /^[a-zA-Z\s]+$/;
      if (val && !nameRegex.test(val)) {
        error = this.errorMessage || 'Only letters and spaces allowed';
      }
    }
    else if (this.pattern && val) {
      if (!this.pattern.test(val)) {
        error = this.errorMessage || 'Invalid format';
      }
    }

    this.currentError = error;
    this.onErrorChange.emit(error);
    this.onVerifiedChange.emit(!error);
  }
   getBackgroundStyle() {
    if (!this.backgroundColor) return {};
    
    if (this.isCssColor(this.backgroundColor)) {
      return { 'background-color': this.backgroundColor };
    }
    
    return {};
  }
  
  getBackgroundClass() {
    if (!this.backgroundColor) return 'bg-white';
    
    if (this.isCssColor(this.backgroundColor)) {
      return '';
    }
    
    return this.backgroundColor;
  }
  
  private isCssColor(color: string): boolean {
    return (
      color.startsWith('#') || 
      color.startsWith('rgb') || 
      color.startsWith('hsl') || 
      /^(red|green|blue|yellow|purple|orange|pink|black|white|gray)$/i.test(color) 
    );
  }
}
