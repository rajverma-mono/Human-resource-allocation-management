import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonAtomComponent } from '../button/button';

// Update the interfaces to be more flexible
interface FieldConfig {
  label: string;
  key: string;
  icon?: string;
  hint?: string;
  format?: string; // Make it string instead of specific union
}
interface ActionConfig {
  label: string;
  action: string;
  variant: string;
  icon?: string;
  bgcolor?: string;
  textColor?: string;
  borderColor?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  iconRight?: string;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  iconConfig?: {
    width?: number;
    height?: number;
    color?: string;
  };
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
    requirementsButton?: {
      add?: ActionConfig;
      edit?: ActionConfig;
    };
    additionalActions?: ActionConfig[];
  };
  apiEndpoints?: {
    detail?: string;
  };
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
  bgcolor?: string;
  textColor?: string;
}

interface StatusConfig {
  key: string;
  classMap: { [key: string]: string };
}


@Component({
  selector: 'details-composite',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonAtomComponent],
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

  // Get role experience map data with proper parsing
  getRoleExperienceMap(): any[] {
    if (!this.data?.requirements?.roleExperienceMap) {
      return [];
    }
    
    try {
      let roleExperienceMap = this.data.requirements.roleExperienceMap;
      
      // If it's a string (JSON stringified), parse it
      if (typeof roleExperienceMap === 'string') {
        roleExperienceMap = JSON.parse(roleExperienceMap);
      }
      
      // Ensure it's an array
      if (Array.isArray(roleExperienceMap)) {
        return roleExperienceMap.map((role: any) => {
          // Handle old format where requiredSkills might be a comma-separated string
          if (role.requiredSkills && typeof role.requiredSkills === 'string') {
            return {
              ...role,
              requiredSkills: role.requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
            };
          }
          return role;
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing roleExperienceMap:', error);
      return [];
    }
  }

  // Get role display name
  getRoleDisplayName(role: any): string {
    if (role.roleName) return role.roleName;
    if (role.role) {
      // Format role key to readable name (e.g., "project_manager" -> "Project Manager")
      return role.role
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'Unknown Role';
  }

  // Get role skills as comma-separated string
  getRoleSkills(role: any): string {
    if (!role.requiredSkills) return 'Not specified';
    
    if (Array.isArray(role.requiredSkills)) {
      return role.requiredSkills.length > 0 ? role.requiredSkills.join(', ') : 'Not specified';
    }
    
    if (typeof role.requiredSkills === 'string') {
      return role.requiredSkills || 'Not specified';
    }
    
    return 'Not specified';
  }

  // Get total count from roleExperienceMap
  getTotalRequiredFromRoles(): number {
    const roles = this.getRoleExperienceMap();
    let total = 0;
    
    roles.forEach((role: any) => {
      if (role.requiredCount) {
        total += parseInt(role.requiredCount) || 0;
      }
    });
    
    return total;
  }

  // Get role qualification
  getRoleQualification(role: any): string {
    return role.qualification || 'Not specified';
  }

  // Get role experience
  getRoleExperience(role: any): string {
    return role.minExperience ? `${role.minExperience} years` : 'Not specified';
  }
}