import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login/login';
import { LayoutComponent } from './layout/layout';
import { AddEmployeeComponent } from './features/hr/pages/add-employee/add-employee';
import { EmployeeListComponent } from './features/hr/pages/employee-detail/employee-detail.component';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginPageComponent },

  {
    path: '',
    component: LayoutComponent,
    children: [
      // 🔥 HR Module Pages
      { path: 'hr', redirectTo: 'hr/add-employee', pathMatch: 'full' },
      { path: 'hr/add-employee', component: AddEmployeeComponent },
       { path: 'hr/employees', component: EmployeeListComponent } ,

      // 🔥 Project Module (placeholders now)
      { path: 'projects', redirectTo: 'projects/list', pathMatch: 'full' },
      // { path: 'projects/list', component: ProjectsListComponent },
      // { path: 'projects/new', component: CreateProjectComponent },

      { path: 'roster', redirectTo: 'roster/assign', pathMatch: 'full' },
      // { path: 'roster/assign', component: AssignComponent },
      // { path: 'roster/calendar', component: CalendarComponent },
    ]
  }
];
