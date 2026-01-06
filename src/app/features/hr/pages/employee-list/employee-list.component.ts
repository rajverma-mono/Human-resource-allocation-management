import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
    EmployeeCardComponent,
  ],
  templateUrl: './employee-list.component.html'
})
export class EmployeeListComponent implements OnInit {
  config: any = listConfig;
  employees: any[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef  // <-- Add this
  ) {}

  ngOnInit() {
    this.loadEmployees();
    
    // Listen to router events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Trigger change detection when navigation ends
        this.cdr.detectChanges();
        this.loadEmployees(); // Also reload data
      });
  }

  trackByEmployeeId(index: number, emp: any) {
    return emp.id;
  }

  openEmployee(emp: any) {
    console.log('CARD CLICKED →', emp.id);
    this.router.navigate(['/hr/employees', emp.id]);
  }

  loadEmployees() {
    this.loading = true;

    const url = this.config.apiEndpoints.list
      .replace('{{API_BASE}}', environment.API_BASE);

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.employees = res.map(emp => {
          const photoBase64 =
            emp.photoBase64 && emp.photoBase64.startsWith('data:image')
              ? emp.photoBase64
              : typeof emp.photo === 'string' && emp.photo.startsWith('data:image')
                ? emp.photo
                : null;

          return {
            ...emp,
            photoBase64
          };
        });

        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }
}