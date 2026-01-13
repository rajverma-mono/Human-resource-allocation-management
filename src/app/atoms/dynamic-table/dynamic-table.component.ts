import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'chip-input' | 'role-with-count';
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
  _tempId?: string; // Add _tempId explicitly to the interface
}

interface RoleCount {
  role: string;
  count: number;
  _tempId?: string;
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
  
  // For role-with-count type
  @Input() availableRoles: { value: string; label: string; description?: string }[] = [];
  @Input() totalRequiredCount = 0;
  @Input() showCountValidation = true;
  
  @Output() dataChange = new EventEmitter<TableRow[]>();
  @Output() rowAdded = new EventEmitter<TableRow>();
  @Output() rowRemoved = new EventEmitter<TableRow>();
  @Output() cellChanged = new EventEmitter<{ row: TableRow; column: string; value: any; rowIndex: number }>();
  @Output() totalCountChanged = new EventEmitter<number>();

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
    return option;
  }

  getOptionLabel(option: any): string {
    if (typeof option === 'object' && option !== null && 'label' in option) {
      return option.label;
    }
    return String(option);
  }

  // CHIP INPUT METHODS
  getChips(row: any, columnKey: string): string[] {
    const value = row[columnKey];
    if (Array.isArray(value)) {
      return value;
    } else if (typeof value === 'string') {
      return value.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }

  addChip(event: Event, row: any, columnKey: string): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (!value) return;
    
    let chips = this.getChips(row, columnKey);
    
    if (!chips.includes(value)) {
      chips = [...chips, value];
      const column = this.columns.find(col => col.key === columnKey);
      if (column) {
        this.onCellChange(row, column, chips);
      }
    }
    
    input.value = '';
  }

  removeChip(row: any, columnKey: string, chipToRemove: string): void {
    let chips = this.getChips(row, columnKey);
    chips = chips.filter(chip => chip !== chipToRemove);
    
    const column = this.columns.find(col => col.key === columnKey);
    if (column) {
      this.onCellChange(row, column, chips);
    }
  }

  onChipKeyDown(event: Event, row: any, columnKey: string): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ',' || keyboardEvent.key === ';') {
      event.preventDefault();
      this.addChip(event, row, columnKey);
    }
  }

  // ROLE-WITH-COUNT METHODS
  getRoleCount(row: any, columnKey: string): RoleCount {
    const value = row[columnKey];
    if (typeof value === 'object' && value !== null && 'role' in value && 'count' in value) {
      return value;
    }
    return { role: '', count: 1 };
  }

  onRoleChange(event: Event, row: TableRow, column: TableColumn): void {
    const target = event.target as HTMLSelectElement;
    const roleCount = this.getRoleCount(row, column.key);
    roleCount.role = target.value;
    this.onCellChange(row, column, roleCount);
  }

  onCountChange(event: Event, row: TableRow, column: TableColumn): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    const roleCount = this.getRoleCount(row, column.key);
    roleCount.count = isNaN(value) ? 1 : Math.max(1, value);
    this.onCellChange(row, column, roleCount);
  }

  incrementCount(row: TableRow, column: TableColumn): void {
    const roleCount = this.getRoleCount(row, column.key);
    const max = column.max || 100;
    if (roleCount.count < max) {
      roleCount.count++;
      this.onCellChange(row, column, roleCount);
    }
  }

  decrementCount(row: TableRow, column: TableColumn): void {
    const roleCount = this.getRoleCount(row, column.key);
    const min = column.min || 1;
    if (roleCount.count > min) {
      roleCount.count--;
      this.onCellChange(row, column, roleCount);
    }
  }

  getAvailableRoles(currentRowIndex: number, columnKey: string): { value: string; label: string; description?: string }[] {
    const selectedRoles = this.data
      .filter((row, index) => index !== currentRowIndex)
      .map(row => {
        const roleCount = this.getRoleCount(row, columnKey);
        return roleCount.role;
      })
      .filter(role => role && role.trim() !== '');
    
    return this.availableRoles.filter(role => 
      !selectedRoles.includes(role.value)
    );
  }

  getSelectedRoleDescription(rowIndex: number, columnKey: string): string {
    const roleCount = this.getRoleCount(this.data[rowIndex], columnKey);
    if (roleCount.role) {
      const role = this.availableRoles.find(r => r.value === roleCount.role);
      return role?.description || '';
    }
    return '';
  }

  isRoleTaken(role: string, currentRowIndex: number, columnKey: string): boolean {
    for (let i = 0; i < this.data.length; i++) {
      if (i === currentRowIndex) continue;
      const roleCount = this.getRoleCount(this.data[i], columnKey);
      if (roleCount.role === role) {
        return true;
      }
    }
    return false;
  }

  getTotalRoleCount(): number {
    let total = 0;
    this.columns.forEach(column => {
      if (column.type === 'role-with-count') {
        this.data.forEach(row => {
          const roleCount = this.getRoleCount(row, column.key);
          total += roleCount.count || 0;
        });
      }
    });
    return total;
  }

  getCountValidationStatus(): { valid: boolean; message: string } {
    if (!this.showCountValidation || this.totalRequiredCount <= 0) {
      return { valid: true, message: '' };
    }
    
    const total = this.getTotalRoleCount();
    
    if (total === 0 && this.totalRequiredCount > 0) {
      return { 
        valid: false, 
        message: `Please add role requirements. Total needed: ${this.totalRequiredCount}` 
      };
    }
    
    if (total < this.totalRequiredCount) {
      const remaining = this.totalRequiredCount - total;
      return { 
        valid: false, 
        message: `${remaining} more resource(s) needed to meet requirement of ${this.totalRequiredCount}` 
      };
    }
    
    if (total > this.totalRequiredCount) {
      const excess = total - this.totalRequiredCount;
      return { 
        valid: false, 
        message: `${excess} excess resource(s) added. Requirement is ${this.totalRequiredCount}` 
      };
    }
    
    return { 
      valid: true, 
      message: `Perfect! ${total}/${this.totalRequiredCount} resources allocated` 
    };
  }

  // TABLE METHODS
  addRow(): void {
    if (this.disabled) return;
    if (this.maxRows > 0 && this.data.length >= this.maxRows) return;
    
    const newRow: TableRow = {};
    this.columns.forEach(col => {
      newRow[col.key] = this.getDefaultValue(col);
    });
    
    newRow._tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.data.push(newRow);
    this.onChange(this.data);
    this.dataChange.emit(this.data);
    this.rowAdded.emit(newRow);
    this.totalCountChanged.emit(this.getTotalRoleCount());
  }

  removeRow(index: number): void {
    if (this.disabled || index < 0 || index >= this.data.length) return;
    
    const removedRow = this.data.splice(index, 1)[0];
    this.onChange(this.data);
    this.dataChange.emit(this.data);
    this.rowRemoved.emit(removedRow);
    this.totalCountChanged.emit(this.getTotalRoleCount());
  }

  onCellChange(row: TableRow, column: TableColumn, value: any): void {
    if (this.disabled || column.disabled) return;
    
    row[column.key] = value;
    this.onChange(this.data);
    this.dataChange.emit(this.data);
    const rowIndex = this.data.indexOf(row);
    this.cellChanged.emit({ row, column: column.key, value, rowIndex });
    this.onTouched();
    
    if (column.type === 'role-with-count') {
      this.totalCountChanged.emit(this.getTotalRoleCount());
    }
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
      case 'role-with-count':
        return { role: '', count: 1 };
      default: 
        return '';
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByTempId(index: number, row: TableRow): string {
    return row._tempId || row._id || index.toString();
  }

  getColumnWidth(column: TableColumn): string {
    return column.width || 'auto';
  }

  get isMaxRowsReached(): boolean {
    return this.maxRows > 0 && this.data.length >= this.maxRows;
  }

  get canAddRow(): boolean {
    if (this.disabled) return false;
    if (this.maxRows > 0 && this.data.length >= this.maxRows) return false;
    return this.allowAdd;
  }

  get hasError(): boolean {
    return this.required && this.data.length === 0;
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
}