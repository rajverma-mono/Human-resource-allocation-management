import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login/login';
import { LayoutComponent } from './layout/layout';
import { AddEmployeeComponent } from './features/hr/pages/add-employee/add-employee';
import { EmployeeListComponent } from './features/hr/pages/employee-list/employee-list.component';
import { EmployeeDetailsComponent } from './features/hr/pages/employee-details/employee-details.component';
import { RoleGuard } from './services/role.guard';

export const routes: Routes = [

  { path: 'login', component: LoginPageComponent },

  {
    path: '',
    component: LayoutComponent,
    children: [

      {
        path: 'hr/add-employee',
        component: AddEmployeeComponent,
        canActivate: [RoleGuard],
        data: { roles: ['hr'] }
      },
      {
        path: 'hr/employees',
        component: EmployeeListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['hr'] }
      },
      {
        path: 'hr/employees/:id',
        component: EmployeeDetailsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['hr'] }
      }

    ]
  }
];
