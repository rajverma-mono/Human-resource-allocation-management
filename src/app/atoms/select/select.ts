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
  templateUrl: "./select.html",
  styleUrls: ['./select.scss']
})
export class SelectAtomComponent {

  @Input() label?: string;
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = "Select option";
  @Input() liveSearch: boolean = false;
  @Input() customClass: string = "";
  @Input() showIcons: boolean = true;

  /* ----------------- 🔥 Added Inputs ----------------- */
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() error?: string;                 // If error is externally passed
  @Input() helperText?: string;

  @Input() value: string = "";
  @Output() valueChange = new EventEmitter<string>();
  @Output() onValueChange = new EventEmitter<{value:string, option?:SelectOption}>();

  /* Internal State */
  searchText = "";
  dropdownOpen = false;
  internalError: string | null = null;     // For required validation

  /* ----------------- Options Filter ----------------- */
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
    this.valueChange.emit(option.value);
    this.onValueChange.emit({value:option.value, option});
    
    this.dropdownOpen = false;
    this.validate(); // trigger validation
  }

  /* ----------------- Getters ----------------- */
  get selectedLabel() {
    return this.options.find(o=>o.value===this.value)?.label || this.placeholder;
  }

  get selectedIcon() {
    return this.options.find(o=>o.value===this.value)?.icon;
  }

  /* ----------------- 🔥 Validation Handler ----------------- */
  validate() {
    if (this.required && !this.value) {
      this.internalError = `${this.label || 'Field'} is required`;
    } else {
      this.internalError = null;
    }
  }

  /* Merged error priority: internal > external */
  get finalError() {
    return this.internalError || this.error || null;
  }

  get hasError() {
    return !!this.finalError;
  }
}
