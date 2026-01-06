import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'atom-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './atom-search-filter.component.html'
})
export class SearchFilterAtomComponent {

  @Input() config: any;
  @Input() data: any[] = [];

  @Output() filtered = new EventEmitter<any[]>();

  searchText = '';
  selectedFilters: Record<string, string> = {};

  applyFilters() {
    let result = [...this.data];

    if (this.searchText) {
      const text = this.searchText.toLowerCase();

      result = result.filter(item =>
        this.config.keys.some((key: string) =>
          String(item[key] || '').toLowerCase().includes(text)
        )
      );
    }

    for (const key of Object.keys(this.selectedFilters)) {
      const value = this.selectedFilters[key];
      if (value) {
        result = result.filter(item => item[key] === value);
      }
    }

    this.filtered.emit(result);
  }

  reset() {
    this.searchText = '';
    this.selectedFilters = {};
    this.filtered.emit(this.data);
  }
}
