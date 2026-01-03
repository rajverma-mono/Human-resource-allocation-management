import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CardField {
  key: string;
  label?: string;
  icon?: string;
  class?: string;       // Tailwind class
}

export interface CardHeader {
  showAvatar?: boolean;
  avatarIcon?: string;
  avatarClass?: string;

  showStatus?: boolean;
  statusKey?: string;
  statusClassMap?: Record<string, string>;
}

export interface EmployeeCardConfig {
  cardClass?: string;        // Tailwind
  header?: CardHeader;
  fields: CardField[];
  skillsKey?: string;
  skillsClass?: string;
  maxSkills?: number;
}

@Component({
  selector: 'atom-employee-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-card.component.html',
})
export class EmployeeCardComponent {

  @Input() data: Record<string, any> = {};
  @Input() config!: EmployeeCardConfig;

  getStatusClass() {
    const key = this.config.header?.statusKey || 'status';
    return this.config.header?.statusClassMap?.[this.data[key]] || '';
  }
}
