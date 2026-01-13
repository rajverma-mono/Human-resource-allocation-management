import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
// Update the interfaces to be more flexible
interface FieldConfig {
  label: string;
  key: string;
  icon?: string;
  hint?: string;
  format?: string; // Make it string instead of specific union
}

interface SectionConfig {
  title?: string;
  type: string; // Make it string to accept any value
  columns?: number;
  fields?: FieldConfig[];
  slot?: string;
}

interface ActionConfig {
  label: string;
  action: string;
  variant: string; // Make it string to accept any value
  icon?: string;
}

interface StatusConfig {
  key: string;
  classMap: { [key: string]: string };
}

interface Config {
  titleKey: string;
  subtitleKeys?: string[];
  status: StatusConfig;
  sections: SectionConfig[];
  actions?: ActionConfig[];
  metadata?: {
    resourceCountKey?: string;
    completionKey?: string;
    teamCountKey?: string;
    createdByKey?: string;
    lastUpdatedKey?: string;
  };
  apiEndpoints?: {
    detail?: string;
  };
}


@Component({
  selector: 'details-composite',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './details-composite.component.html'
})
export class DetailsCompositeComponent implements OnInit {

  @Input() config!: Config;
  @Input() data!: any;

  @Output() action = new EventEmitter<string>();

  ngOnInit() {
    // Nothing needed here
  }

  emitAction(actionType: string) {
    this.action.emit(actionType);
  }

  getStatusClass(): string {
    if (!this.config?.status || !this.data) return 'status-neutral';
    
    const statusValue = this.data[this.config.status.key];
    return this.config.status.classMap?.[statusValue] || 'status-neutral';
  }

  // Helper method for template date formatting
  getFormattedDate(key: string): string {
    const value = this.data?.[key];
    if (!value) return '—';
    
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(value);
    }
  }

  // Format field values based on format type
  formatValue(field: FieldConfig): string {
    const value = this.data?.[field.key];
    
    if (value === undefined || value === null || value === '') return '—';
    
    if (field.format === 'date') {
      return this.getFormattedDate(field.key);
    }
    
    if (field.format === 'currency') {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) return '—';
      
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
      }).format(num);
    }
    
    if (field.format === 'percentage') {
      return `${value}%`;
    }
    
    return String(value);
  }

  // Get resource count from data using config key
  getResourceCount(): number {
    const key = this.config?.metadata?.resourceCountKey;
    return key ? (this.data?.[key] || 0) : 0;
  }

  // Get completion percentage
  getCompletion(): number {
    const key = this.config?.metadata?.completionKey;
    const value = key ? (this.data?.[key] || 0) : 0;
    return Math.min(100, Math.max(0, value));
  }

  // Get team count
  getTeamCount(): number {
    const key = this.config?.metadata?.teamCountKey;
    return key ? (this.data?.[key] || 0) : 0;
  }

  // Calculate days remaining
  getDaysRemaining(): number {
    const endDate = this.data?.projectEndDate;
    if (!endDate) return 0;
    
    try {
      const end = new Date(endDate);
      const today = new Date();
      const diff = end.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
    } catch {
      return 0;
    }
  }

  // Check if custom section exists
  hasCustomSection(): boolean {
    return this.config?.sections?.some(s => s.type === 'custom') || false;
  }

  // Get the overview section (first info-grid)
  getOverviewSection(): SectionConfig | undefined {
    return this.config?.sections?.find(s => s.type === 'info-grid');
  }
}