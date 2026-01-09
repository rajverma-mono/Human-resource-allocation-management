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
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    email: 'hr@company.com',
    password: 'hr123',
    role: 'hr'
  }
];


  constructor(private router: Router) {}
login() {
  const user = this.mockUsers.find(
    u =>
      u.email === this.email.trim() &&
      u.password === this.password.trim()
  );

  if (!user) {
    this.error = 'Invalid credentials';
    return;
  }

  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('role', user.role);

  // 🔥 Always redirect to app root
  this.router.navigate(['/']);
}


}
