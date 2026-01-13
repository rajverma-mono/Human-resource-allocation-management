import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'chip-input';
  required?: boolean;
  disabled?: boolean;
  options?: any[]; // Accepts both string[] and {value, label}[]
  min?: number;
  max?: number;
  placeholder?: string;
  width?: string;
  helpText?: string;
}

interface TableRow {
  [key: string]: any;
  _id?: string;
}

@Component({
  selector: 'atom-dynamic-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './dynamic-table.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamicTableAtomComponent),
      multi: true
    }
  ]
})
export class DynamicTableAtomComponent implements ControlValueAccessor {
  @Input() columns: TableColumn[] = [];
  @Input() data: TableRow[] = [];
  @Input() label = '';
  @Input() emptyMessage = 'No data available';
  @Input() addButtonText = 'Add Row';
  @Input() removeButtonText = 'Remove';
  @Input() allowAdd = true;
  @Input() allowRemove = true;
  @Input() allowSort = false;
  @Input() maxRows = 0; // 0 = unlimited
  @Input() required = false;
  @Input() disabled = false;
  @Input() errorMessage = '';
  
  @Output() dataChange = new EventEmitter<TableRow[]>();
  @Output() rowAdded = new EventEmitter<TableRow>();
  @Output() rowRemoved = new EventEmitter<TableRow>();
  @Output() cellChanged = new EventEmitter<{ row: TableRow; column: string; value: any; rowIndex: number }>();

  private onChange: (value: TableRow[]) => void = () => {};
  private onTouched: () => void = () => {};

  // Helper methods for select options
  getColumnOptions(column: TableColumn): any[] {
    return column.options || [];
  }

  getOptionValue(option: any): any {
    if (typeof option === 'object' && option !== null && 'value' in option) {
      return option.value;
    }
    return option; // For string options
  }

  getOptionLabel(option: any): string {
    if (typeof option === 'object' && option !== null && 'label' in option) {
      return option.label;
    }
    return String(option); // For string options
  }

  // CHIP INPUT METHODS
  getChips(row: any, columnKey: string): string[] {
    const value = row[columnKey];
    if (Array.isArray(value)) {
      return value;
    } else if (typeof value === 'string') {
      // Handle comma-separated string
      return value.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }

  // Updated to accept Event instead of KeyboardEvent
  addChip(event: Event, row: any, columnKey: string): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (!value) return;
    
    // Get current chips
    let chips = this.getChips(row, columnKey);
    
    // Add new chip if not already present
    if (!chips.includes(value)) {
      chips = [...chips, value];
      
      // Find the column config
      const column = this.columns.find(col => col.key === columnKey);
      if (column) {
        this.onCellChange(row, column, chips);
      }
    }
    
    // Clear input
    input.value = '';
  }

  removeChip(row: any, columnKey: string, chipToRemove: string): void {
    let chips = this.getChips(row, columnKey);
    chips = chips.filter(chip => chip !== chipToRemove);
    
    // Find the column config
    const column = this.columns.find(col => col.key === columnKey);
    if (column) {
      this.onCellChange(row, column, chips);
    }
  }

  // Unified handler for chip input keydown events
  onChipKeyDown(event: Event, row: any, columnKey: string): void {
    const keyboardEvent = event as KeyboardEvent;
    // Handle Enter, Comma, and Semicolon keys
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ',' || keyboardEvent.key === ';') {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const value = input.value.trim();
      
      if (!value) return;
      
      // Get current chips
      let chips = this.getChips(row, columnKey);
      
      // Add new chip if not already present
      if (!chips.includes(value)) {
        chips = [...chips, value];
        
        // Find the column config
        const column = this.columns.find(col => col.key === columnKey);
        if (column) {
          this.onCellChange(row, column, chips);
        }
      }
      
      // Clear input
      input.value = '';
    }
  }

  // TABLE METHODS
  addRow(): void {
    if (this.disabled) return;
    if (this.maxRows > 0 && this.data.length >= this.maxRows) return;
    
    const newRow: TableRow = {};
    this.columns.forEach(col => {
      newRow[col.key] = this.getDefaultValue(col);
    });
    
    this.data.push(newRow);
    this.onChange(this.data);
    this.dataChange.emit(this.data);
    this.rowAdded.emit(newRow);
  }

  removeRow(index: number): void {
    if (this.disabled || index < 0 || index >= this.data.length) return;
    
    const removedRow = this.data.splice(index, 1)[0];
    this.onChange(this.data);
    this.dataChange.emit(this.data);
    this.rowRemoved.emit(removedRow);
  }

  onCellChange(row: TableRow, column: TableColumn, value: any): void {
    if (this.disabled || column.disabled) return;
    
    row[column.key] = value;
    this.onChange(this.data);
    this.dataChange.emit(this.data);
    const rowIndex = this.data.indexOf(row);
    this.cellChanged.emit({ row, column: column.key, value, rowIndex });
    this.onTouched();
  }

  onSelectChange(event: Event, row: TableRow, column: TableColumn): void {
    const target = event.target as HTMLSelectElement;
    this.onCellChange(row, column, target.value);
  }

  getDefaultValue(column: TableColumn): any {
    switch (column.type) {
      case 'number': 
        return column.min || 0;
      case 'boolean': 
        return false;
      case 'select': 
        if (Array.isArray(column.options) && column.options.length > 0) {
          const firstOption = column.options[0];
          return this.getOptionValue(firstOption);
        }
        return '';
      case 'chip-input':
        return [];
      default: 
        return '';
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  getColumnWidth(column: TableColumn): string {
    return column.width || 'auto';
  }

  get isMaxRowsReached(): boolean {
    return this.maxRows > 0 && this.data.length >= this.maxRows;
  }

  // ControlValueAccessor methods
  writeValue(value: TableRow[]): void {
    this.data = value ? [...value] : [];
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

  get canAddRow(): boolean {
    if (this.disabled) return false;
    if (this.maxRows > 0 && this.data.length >= this.maxRows) return false;
    return this.allowAdd;
  }

  get hasError(): boolean {
    return this.required && this.data.length === 0;
  }
}