// details-composite.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FieldConfig {
  key: string;
  label: string;
  format?: 'date' | 'currency' | 'percentage' | 'text';
  suffix?: string;
  prefix?: string;
  hideIfEmpty?: boolean;
  condition?: (value: any) => boolean;
}

export interface SectionConfig {
  title: string;
  type?: 'normal' | 'repeat';
  source?: string;
  layout?: 'one-column' | 'two-column';
  fields: FieldConfig[];
  hideIfAllEmpty?: boolean;
  hasAction?: boolean;
  actionLabel?: string;
  condition?: (data: any) => boolean;
  icon?: string;
  iconClass?: string;
}
export interface CompositeConfig {
  apiEndpoints?: {
    list?: string;
    getById?: string;
    edit?: {
      route: string;
      mode?: string;
      idParam?: string;
    };
  };

  actions: any[];
  sections: any[];
}

export interface ActionConfig {
  label: string;
  action: string;
  variant: 'primary' | 'secondary' | 'outline';
}



@Component({
  selector: 'composite-employee-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details-composite.component.html',
})
export class CompositeEmployeeProfileComponent implements OnInit {
  @Input() data: any;
  @Input() loading: boolean = false;
  @Input() config: CompositeConfig = {
    actions: [],
    sections: []
  };

  @Output() action = new EventEmitter<{action: string, data?: any}>();

  private sectionIcons: Map<string, {icon: string, iconClass: string}> = new Map([
    ['Professional Details', { icon: 'fa-briefcase', iconClass: 'bg-red-50 text-[#801519]' }],
    ['Education', { icon: 'fa-graduation-cap', iconClass: 'bg-blue-50 text-blue-600' }],
    ['Experience', { icon: 'fa-history', iconClass: 'bg-amber-50 text-amber-600' }],
    ['Certifications', { icon: 'fa-certificate', iconClass: 'bg-purple-50 text-purple-600' }],
    ['Contact Details', { icon: 'fa-address-card', iconClass: 'bg-green-50 text-green-600' }]
  ]);

  ngOnInit() {
    // Add icons based on section titles if not present in config
    this.config.sections.forEach(section => {
      const iconData = this.sectionIcons.get(section.title);
      if (iconData && !section.icon) {
        section.icon = iconData.icon;
        section.iconClass = iconData.iconClass;
      }
    });
  }

  getValue(obj: any, key: string): any {
    if (!obj || !key) return null;
    return key.split('.').reduce((o, k) => o?.[k], obj);
  }

  formatValue(value: any, field: FieldConfig): string {
    if (value === null || value === undefined || value === '') {
      return field.hideIfEmpty ? '' : 'N/A';
    }

    switch (field.format) {
      case 'date':
        return this.formatDate(value);
      case 'percentage':
        return `${value}${field.suffix || ''}`;
      default:
        const formatted = field.prefix ? `${field.prefix}${value}` : value;
        return field.suffix ? `${formatted}${field.suffix}` : formatted;
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date.toString();
      
      return d.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return date.toString();
    }
  }

  shouldShowSection(section: SectionConfig, data: any): boolean {
    // Check if section has condition
    if (section.condition && !section.condition(data)) {
      return false;
    }

    // Check hideIfAllEmpty for repeat sections
    if (section.type === 'repeat' && section.hideIfAllEmpty) {
      const items = this.getRepeatData(section, data);
      return items.length > 0;
    }

    // Check hideIfAllEmpty for normal sections
    if (section.hideIfAllEmpty) {
      const hasVisibleField = section.fields.some(field => 
        this.shouldShowField(field, data)
      );
      return hasVisibleField;
    }

    return true;
  }

  shouldShowField(field: FieldConfig, data: any): boolean {
    if (field.condition && !field.condition(data)) {
      return false;
    }

    if (field.hideIfEmpty) {
      const value = this.getValue(data, field.key);
      return !(value === null || value === undefined || value === '');
    }

    return true;
  }

  getSectionIconClass(section: SectionConfig): string {
    return section.iconClass || this.sectionIcons.get(section.title)?.iconClass || 'bg-gray-50 text-gray-600';
  }

  getSectionIcon(section: SectionConfig): string {
    return section.icon || this.sectionIcons.get(section.title)?.icon || 'fa-info-circle';
  }

  getRepeatData(section: SectionConfig, data: any): any[] {
    if (!section.source) return [];
    
    const items = this.getValue(data, section.source);
    
    if (Array.isArray(items)) {
      return items;
    } else if (items && typeof items === 'object') {
      return [items];
    }
    
    return [];
  }

  onAction(actionType: string): void {
    this.action.emit({ action: actionType });
  }

  onRepeatAction(section: SectionConfig, item: any): void {
    const actionType = `${section.title.toLowerCase().replace(/\s+/g, '_')}_detail`;
    this.action.emit({ 
      action: actionType, 
      data: item 
    });
  }
}