import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RadioAtomComponent } from "../radio/radio";

@Component({
  selector: "atom-radio-group",
  standalone: true,
  imports: [CommonModule, RadioAtomComponent],
  templateUrl: "./radio-group.html",
})
export class RadioGroupAtomComponent {
  @Input() options!: { label: string; subLabel?: string; value: string }[];
  @Input() name!: string;
  @Input() selectedValue!: string;
@Output() selectedValueChange = new EventEmitter<string>(); // <--- required for [(selectedValue)]

  @Input() layout: "vertical" | "horizontal" | "grid" | "grid-auto" = "vertical";
  @Input() columns: number = 3;
  @Input() minWidth: string = "150px";
  @Input() gap: string = "0.75rem";
  @Input() radioColorClass = "text-blue-600";
  @Input() labelColorClass = "text-gray-800";

 change(val: string) {
  this.selectedValue = val;
  this.selectedValueChange.emit(val); // required for two-way binding
}


  get containerClass() {
    return {
      vertical: `flex flex-col gap-${this.gap}`,
      horizontal: `flex flex-row gap-${this.gap}`,
      grid: `grid grid-cols-${this.columns} gap-${this.gap}`,
      "grid-auto": `grid auto-fit gap-${this.gap}`,
    }[this.layout];
  }
}
