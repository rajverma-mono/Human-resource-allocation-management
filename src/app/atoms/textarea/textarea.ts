import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type CaseType = 'U' | 'L' | 'C' | '';

@Component({
  selector: 'atom-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './textarea.html'
})
export class TextAreaAtomComponent {

  @Input() label: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | '' = '';
  @Input() containerClass: string = '';
  @Input() rows: number = 3;
  @Input() maxLength: number = 500;

  @Input() sanitize: boolean = false;
  @Input() removeChars: string = '';
  @Input() removeEmojis: boolean = false;
  @Input() normalizeAccents: boolean = false;
  @Input() toCase: CaseType = '';

  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() ariaLabel: string = '';
  @Input() className: string = '';
  // ---------- NEW Styling Inputs ----------
  @Input() backgroundColor: string = '';       // Tailwind or HEX/RGB color
  @Input() borderColor: string = 'border-gray-300';
  @Input() rounded: string = 'rounded-lg';

  get sizeClasses() {
    return {
      sm: 'text-sm px-2 py-1',
      md: 'text-md px-3 py-2',
      lg: 'text-lg px-4 py-3',
      '': 'px-3 py-2'
    }[this.size];
  }

  processValue(val: string): string {
    let newVal = val;

    if (this.sanitize) {
      if (this.removeChars) {
        const regex = new RegExp(`[${this.removeChars}]`, 'g');
        newVal = newVal.replace(regex, '');
      }

      if (this.removeEmojis)
        newVal = newVal.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF][\uDC00-\uDFFF])/g, '');

      if (this.normalizeAccents) newVal = newVal.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (this.toCase === 'U') newVal = newVal.toUpperCase();
    if (this.toCase === 'L') newVal = newVal.toLowerCase();
    if (this.toCase === 'C') newVal = newVal.replace(/\b\w/g, c => c.toUpperCase());

    return newVal.slice(0, this.maxLength);
  }
isCss(color: string): boolean {
  return color?.startsWith('#') ||      // #fff or #121212
         color?.startsWith('rgb') ||    // rgb(), rgba()
         color?.startsWith('hsl') ||    // hsl(), hsla()
         /^[a-z]+$/i.test(color);       // css names like red/blue/black
}

  onInput(val: string) {
    const finalVal = this.processValue(val);
    this.value = finalVal;
    this.valueChange.emit(finalVal);
  }
}
