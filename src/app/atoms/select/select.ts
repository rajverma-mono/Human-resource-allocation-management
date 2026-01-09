import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}

@Component({
  selector: 'atom-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.html',
  styleUrls: ['./select.scss']
})
export class SelectAtomComponent implements OnInit, OnChanges {

  @Input() label?: string;
  @Input() options: SelectOption[] = [];   // ✅ API-ready
  @Input() value: any;
  @Input() placeholder: string = 'Select';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() helperText?: string;
  @Input() customClass: string = '';
  @Input() hasError: boolean = false;
  @Input() liveSearch: boolean = false;
  @Input() showIcons: boolean = false;

  @Output() valueChange = new EventEmitter<any>();

  dropdownOpen = false;
  searchText = '';
  filteredOptions: SelectOption[] = [];

  selectedLabel: string = '';
  selectedIcon?: string;

  ngOnInit(): void {
    this.syncOptions();
    this.syncSelected();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.syncOptions();
    }

    if (changes['value']) {
      this.syncSelected();
    }
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectOption(opt: SelectOption): void {
    if (opt.disabled) return;

    this.value = opt.value;
    this.valueChange.emit(opt.value);

    this.selectedLabel = opt.label;
    this.selectedIcon = opt.icon;

    this.dropdownOpen = false;
  }

  private syncOptions(): void {
    this.filteredOptions = [...this.options];
    this.applySearch();
  }

  private syncSelected(): void {
    const selected = this.options?.find(o => o.value === this.value);

    if (selected) {
      this.selectedLabel = selected.label;
      this.selectedIcon = selected.icon;
    } else {
      this.selectedLabel = this.placeholder;
      this.selectedIcon = undefined;
    }
  }

  applySearch(): void {
    if (!this.searchText) {
      this.filteredOptions = [...this.options];
      return;
    }

    const search = this.searchText.toLowerCase();
    this.filteredOptions = this.options.filter(opt =>
      opt.label.toLowerCase().includes(search)
    );
  }
}
