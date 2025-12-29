import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
}

@Component({
  selector: "atom-select",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./select.html"
})
export class SelectAtomComponent {
  @Input() label?: string;
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = "Select option";
  @Input() liveSearch: boolean = false;
  @Input() customClass: string = "";
  @Input() error?: string;
  @Input() helperText?: string;
  @Input() showIcons: boolean = true;

  @Input() disabled: boolean = false;

  @Input() value: string = "";
  @Output() valueChange = new EventEmitter<string>();
  @Output() onValueChange = new EventEmitter<{value:string, option?:SelectOption}>();

  searchText = "";
  dropdownOpen = false;

  get filteredOptions() {
    if (!this.liveSearch || !this.searchText.trim()) return this.options;
    return this.options.filter(opt =>
      opt.label.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  toggleDropdown() {
    if (!this.disabled) this.dropdownOpen = !this.dropdownOpen;
  }

  selectOption(option: SelectOption) {
    if (option.disabled) return;
    this.value = option.value;
    this.onValueChange.emit({value:option.value, option});
    this.valueChange.emit(option.value);
    this.dropdownOpen = false;
  }

  get selectedLabel() {
    return this.options.find(o=>o.value===this.value)?.label || this.placeholder;
  }

  get selectedIcon() {
    return this.options.find(o=>o.value===this.value)?.icon;
  }
}
