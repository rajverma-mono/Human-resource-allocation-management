import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeCardComponent, EmployeeCardConfig } from '../../../../atoms/card/atom-employee-card.component';

import cardConfigJson from './employee-list.config.json';
import employeesJson from './employee-list.mock.json';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, EmployeeCardComponent],
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent {

  employees = employeesJson as Record<string, any>[];

  employeeCardConfig: EmployeeCardConfig =
    cardConfigJson as EmployeeCardConfig;
}
