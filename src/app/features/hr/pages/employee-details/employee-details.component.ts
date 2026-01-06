import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { environment } from '../../../../../environment';
import configData from './employee-details.config.json';

import {
  CompositeEmployeeProfileComponent,
  CompositeConfig
} from '../../../../atoms/generic-details-renderer/details-composite.component';

const typedConfig = configData as CompositeConfig;

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    CommonModule,
    CompositeEmployeeProfileComponent
  ],
  templateUrl: './employee-details.component.html'
})
export class EmployeeDetailsComponent implements OnInit {

  employee: any;
  loading = true;

  config: CompositeConfig = typedConfig;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef  // <-- Add ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initial load
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.loading = true;
      this.fetchEmployee(id);
      this.cdr.detectChanges(); // Force UI update
    });
    
    // Listen to router navigation events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // When navigation completes, check if we're on this page
        if (this.router.url.includes('/hr/employees/')) {
          const id = this.route.snapshot.paramMap.get('id');
          if (id) {
            this.loading = true;
            this.cdr.detectChanges(); // Force UI update
            this.fetchEmployee(id);
          }
        }
      });
  }

  // -----------------------------
  // JSON DRIVEN GET BY ID
  // -----------------------------
  fetchEmployee(id: string | null) {
    const getByIdApi = this.config.apiEndpoints?.getById;

    if (!id || !getByIdApi) {
      this.navigateToList();
      return;
    }

    const url = getByIdApi
      .replace('{{API_BASE}}', environment.API_BASE)
      .replace('{id}', id);

    this.http.get(url).subscribe({
      next: (res: any) => {
        this.employee = this.transformEmployeeData(res);
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update after data loads
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
        this.navigateToList();
      }
    });
  }

  // -----------------------------
  // JSON DRIVEN LIST NAVIGATION
  // -----------------------------
  navigateToList() {
    const listApi = this.config.apiEndpoints?.list;

    if (!listApi) return;

    // derive route safely (can be replaced with explicit listRoute later)
    if (listApi.includes('/employees')) {
      this.router.navigate(['/hr/employees']);
    }
  }

  // -----------------------------
  // DATA NORMALIZATION (TS RESPONSIBILITY)
  // -----------------------------
  transformEmployeeData(apiData: any): any {
    const transformed = { ...apiData };

    if (!transformed.certifications && transformed.certificateMaster) {
      transformed.certifications = [
        {
          certificateMaster: transformed.certificateMaster,
          certificateId: transformed.certificateId
        }
      ];
    }

    if (transformed.experience && !Array.isArray(transformed.experience)) {
      transformed.experience = [transformed.experience];
    }

    return transformed;
  }

  // -----------------------------
  // JSON DRIVEN ACTION HANDLER
  // -----------------------------
  handleAction(event: { action: string; data?: any }) {
    switch (event.action) {

      case 'goBack':
        this.navigateToList();
        break;

      case 'print':
        window.print();
        break;

      case 'editProfile': {
        const editConfig = this.config.apiEndpoints?.edit;
        if (!editConfig) return;

        this.router.navigate(
          [editConfig.route],
          {
            queryParams: {
              [editConfig.idParam || 'id']: this.employee?.id,
              mode: editConfig.mode
            }
          }
        );
        break;
      }
    }
  }
}