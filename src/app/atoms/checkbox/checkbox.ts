import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type CheckboxShape = "default" | "box";
export type CheckboxRounded = "0" | "1" | "2" | "3" | "4" | "5" | "pill" | "circle";

@Component({
  selector: 'atom-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkbox.html'
})
export class CheckboxAtomComponent {
  @Input() label!: string;
  @Input() name!: string;
  @Input() value!: string;
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Input() checkboxColorClass: string = "text-blue-600 accent-blue-600";
  @Input() labelColorClass: string = "text-gray-800";
  @Input() inputLabelSpacingClass: string = "ml-2";
  @Input() className: string = "";
  @Input() ariaLabelledBy?: string;

  @Input() shape: CheckboxShape = "default"; // default / box
  @Input() rounded: CheckboxRounded = "2";   // used only in box mode
  @Input() withShadow: boolean = false;

  @Output() onChange = new EventEmitter<boolean>();

  toggle(e: any) {
    this.checked = e.target.checked;
    this.onChange.emit(this.checked);
  }

  get boxClasses() {
    let r = ({
      "0":"rounded-none",
      "1":"rounded-sm",
      "2":"rounded",
      "3":"rounded-md",
      "4":"rounded-lg",
      "5":"rounded-xl",
      "pill":"rounded-full",
      "circle":"rounded-full w-10 h-10"
    } as Record<CheckboxRounded,string>)[this.rounded];

    return `
      border border-gray-300 px-4 py-2 flex items-center gap-2 cursor-pointer
      ${r}
      ${this.withShadow ? "shadow-md hover:shadow-lg transition" : ""}
      ${this.checked ? "bg-blue-50 border-blue-500" : ""}
      ${this.disabled ? "opacity-50 cursor-not-allowed" : ""}
    `;
  }
}
