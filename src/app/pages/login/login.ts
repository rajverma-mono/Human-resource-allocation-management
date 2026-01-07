import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonAtomComponent } from '../../atoms/button/button';
import { InputAtomComponent } from '../../atoms/input/input';
import layoutConfig from '../../layout/layout.config.json';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [InputAtomComponent, ButtonAtomComponent],
  templateUrl: './login.html',
})
export class LoginPageComponent {

  email = '';
  password = '';
  error = '';
  headerConfig = layoutConfig.header;

  private mockUsers = [
    {
      email: 'hr@company.com',
      password: 'hr123',
      role: 'hr'
    },
    {
      email: 'manager@company.com',
      password: 'mgr123',
      role: 'MGR-1'
    }
  ];

  constructor(private router: Router) {}

 login() {
  const user = this.mockUsers.find(
    u => u.email === this.email && u.password === this.password
  );

  if (!user) {
    this.error = 'Invalid credentials';
    return;
  }

  localStorage.setItem('mockUser', JSON.stringify(user));
  localStorage.setItem('role', user.role);

  if (user.role === 'hr') {
    this.router.navigate(['/hr/employees']);
  } else if (user.role === 'mgr') {
    this.router.navigate(['/login']); 
  }
}

}
