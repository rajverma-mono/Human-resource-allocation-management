import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login/login';
import { LayoutComponent } from './layout/layout';
import { AddEmployeeComponent } from './features/hr/pages/add-employee/add-employee';
import { EmployeeListComponent } from './features/hr/pages/employee-list/employee-list.component';
import { EmployeeDetailsComponent } from './features/hr/pages/employee-details/employee-details.component';
export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginPageComponent },

  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'hr', redirectTo: 'hr/add-employee', pathMatch: 'full' },
      { path: 'hr/add-employee', component: AddEmployeeComponent },
       { path: 'hr/employees', component: EmployeeListComponent } ,
       { path: 'hr/employees/:id', component: EmployeeDetailsComponent },
      { path: 'projects', redirectTo: 'projects/list', pathMatch: 'full' },
 

      { path: 'roster', redirectTo: 'roster/assign', pathMatch: 'full' },
     
    ]
  }
];
