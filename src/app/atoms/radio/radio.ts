import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export type RadioShape = "default" | "box";
export type RadioRounded = "0" | "1" | "2" | "3" | "4" | "5" | "pill" | "circle";

@Component({
  selector: "atom-radio",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./radio.html",
})
export class RadioAtomComponent {
  @Input() label!: string;
  @Input() subLabel?: string;
  @Input() value!: string;
  @Input() name!: string;
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;

  @Input() radioColorClass: string = "text-blue-600 accent-blue-600";
  @Input() labelColorClass: string = "text-gray-800";

  @Input() shape: RadioShape = "default"; // default or box card style
  @Input() rounded: RadioRounded = "2";
  @Input() withShadow: boolean = false;

  @Output() onChange = new EventEmitter<string>();

  handleChange(e: any) {
    this.checked = e.target.checked;
    this.onChange.emit(this.value);
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
      "circle":"rounded-full"
    } as Record<RadioRounded,string>)[this.rounded];

    return `
      flex items-center justify-between border px-4 py-2 cursor-pointer transition
      ${r}
      ${this.checked ? "bg-blue-50 border-blue-600" : "border-gray-300"}
      ${this.withShadow ? "shadow-sm hover:shadow-lg" : ""}
      ${this.disabled ? "opacity-50 cursor-not-allowed" : ""}
    `;
  }
}
