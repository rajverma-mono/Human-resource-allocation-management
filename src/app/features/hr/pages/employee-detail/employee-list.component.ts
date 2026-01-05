import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { environment } from '../../../../../environment';
import listConfig from './employee-list.config.json';

import { EmployeeCardComponent } from '../../../../atoms/card/atom-employee-card.component';
import { PageHeaderComponent } from '../../../../atoms/page-header/page-header';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    PageHeaderComponent,
    EmployeeCardComponent
  ],
  templateUrl: './employee-list.component.html'
})
export class EmployeeListComponent implements OnInit {

  config: any = listConfig;
  employees: any[] = [];
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadEmployees();
  }
trackByEmployeeId(index: number, emp: any) {
  return emp.id;
}

  loadEmployees() {
  this.loading = true;

  const url = this.config.apiEndpoints.list
    .replace('{{API_BASE}}', environment.API_BASE);

  console.log('📥 GET →', url);

  this.http.get<any[]>(url).subscribe({
    next: (res) => {
      console.log('✅ API RESPONSE:', res);

      this.employees = [...res];   

      this.loading = false;
    },
    error: (err) => {
      console.error('❌ API ERROR', err);
      this.loading = false;
    }
  });
}

  }

