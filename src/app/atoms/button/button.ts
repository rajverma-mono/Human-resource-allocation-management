import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export const variantClassMap: Record<string, string> = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  primaryTonal: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white",
  secondaryTonal: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  success: "bg-green-600 hover:bg-green-700 text-white",
  successTonal: "bg-green-100 text-green-700 hover:bg-green-200",
  info: "bg-sky-600 hover:bg-sky-700 text-white",
  warning: "bg-yellow-500 hover:bg-yellow-600 text-black",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  dangerTonal: "bg-red-100 text-red-700 hover:bg-red-200",
  light: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  dark: "bg-black text-white hover:bg-gray-900",
  outlinePrimary: "border border-blue-600 text-blue-600 hover:bg-blue-50",
  outlineSecondary: "border border-gray-600 text-gray-600 hover:bg-gray-100",
  outlineSuccess: "border border-green-600 text-green-600 hover:bg-green-50",
  outlineInfo: "border border-sky-600 text-sky-600 hover:bg-sky-50",
  outlineWarning: "border border-yellow-500 text-yellow-600 hover:bg-yellow-50",
  outlineDanger: "border border-red-600 text-red-600 hover:bg-red-50",
  outlineLight: "border border-gray-200 text-gray-800 hover:bg-gray-50",
  outlineDark: "border border-black text-black hover:bg-gray-100",
  link: "text-blue-600 underline hover:text-blue-800"
};

export const sizeClassMap: Record<string, string> = {
  sm: "text-sm px-3 py-1",
  md: "text-md px-4 py-2",
  lg: "text-lg px-5 py-3"
};

export interface IconConfig {
  width?: number;
  height?: number;
  color?: string;
}

@Component({
  selector: 'atom-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
})
export class ButtonAtomComponent {

  @Input() label: string = '';
  @Input() variant: keyof typeof variantClassMap = 'primary';
  @Input() size: keyof typeof sizeClassMap = 'md';
  @Input() fullWidth: boolean = false;

  @Input() icon?: string;
  @Input() iconRight?: string;
  @Input() iconOnly: boolean = false;
  @Input() iconConfig: IconConfig = { width: 16, height: 16, color: 'currentColor' };

  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;

  @Input() bgColor?: string;
  @Input() textColor?: string;
  @Input() borderColor?: string;

  @Output() onClick = new EventEmitter<void>();


 get classes() {

  if (this.bgColor) {
    return `
      ${sizeClassMap[this.size]}
      ${this.fullWidth ? 'w-full block' : ''}
      rounded-md font-medium flex items-center gap-2 justify-center
      transition disabled:opacity-50 disabled:cursor-not-allowed
      border
    `;
  }

  // Default behavior (variant theme)
  const variantClass = variantClassMap[this.variant] ?? variantClassMap['primary'];
  return `
    ${variantClass}
    ${sizeClassMap[this.size]}
    ${this.fullWidth ? 'w-full block' : ''}
    rounded-md font-medium flex items-center gap-2 justify-center
    transition disabled:opacity-50 disabled:cursor-not-allowed
  `;
}


  get styleObject() {
    return {
      backgroundColor: this.bgColor ? this.bgColor : null,
      color: this.textColor ? this.textColor : null,
      borderColor: this.borderColor ? this.borderColor : null,
    };
  }

  handleClick() {
    if (!this.disabled && !this.loading) this.onClick.emit();
  }
}
