import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { environment } from '../../../../../environment';
import configData from './employee-details.config.json';

import {
  CompositeEmployeeProfileComponent,
  CompositeConfig,
  ActionConfig
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.loading = true;
      this.fetchEmployee(id);
      this.cdr.detectChanges();
    });
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url.includes('/hr/employees/')) {
          const id = this.route.snapshot.paramMap.get('id');
          if (id) {
            this.loading = true;
            this.cdr.detectChanges();
            this.fetchEmployee(id);
          }
        }
      });
  }

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
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.navigateToList();
      }
    });
  }

  navigateToList() {
    const listApi = this.config.apiEndpoints?.list;
    if (!listApi) return;
    
    if (listApi.includes('/employees')) {
      this.router.navigate(['/hr/employees']);
    }
  }

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

  handleAction(event: { action: string; actionConfig?: ActionConfig; data?: any }) {
    switch (event.action) {
      case 'goBack':
        this.navigateToList();
        break;

      case 'print':
        window.print();
        break;

      case 'editProfile': {
        this.handleEditAction(event.actionConfig);
        break;
      }
    }
  }

  private handleEditAction(actionConfig?: ActionConfig) {
    const editConfig = this.config.apiEndpoints?.edit;
    if (!editConfig) return;

    if (editConfig.mode === 'edit' && this.employee) {
      const routeData: any = {
        queryParams: {}
      };

      if (editConfig.idParam && this.employee[editConfig.idParam]) {
        routeData.queryParams[editConfig.idParam] = this.employee[editConfig.idParam];
      } else if (this.employee.id) {
        routeData.queryParams['id'] = this.employee.id;
      } else if (this.employee.employeeId) {
        routeData.queryParams['id'] = this.employee.employeeId;
      } else if (this.employee.employeeID) {
        routeData.queryParams['id'] = this.employee.employeeID;
      }

      routeData.queryParams['mode'] = editConfig.mode || 'edit';

      routeData.state = {
        employeeData: this.employee,
        mode: editConfig.mode || 'edit',
        config: this.config
      };

      this.router.navigate([editConfig.route], routeData);
    } else {
      this.router.navigate([editConfig.route], {
        queryParams: { mode: editConfig.mode || 'add' }
      });
    }
  }
}