import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';


export interface CardField {
  key: string;
  label?: string;
  icon?: string;
  class?: string;
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
  cardClass?: string;
  header?: CardHeader;
  fields: CardField[];
  skillsKey?: string;
  skillsClass?: string;
  maxSkills?: number;
}
export interface EmployeeCardData {
  employeeName?: string;
  employeeCode?: string;
  photoBase64?: string;
  status?: string;
  [key: string]: any;
}


@Component({
  selector: 'atom-employee-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './employee-card.component.html',
})
export class EmployeeCardComponent {

  @Input() data: Record<string, any> = {};
  @Input() config!: EmployeeCardConfig;
  @Output() cardClick = new EventEmitter<any>();


  getStatusClass(): string {
    const key = this.config.header?.statusKey || 'status';
    return this.config.header?.statusClassMap?.[this.data[key]] || '';
  }
}
