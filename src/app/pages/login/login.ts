import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonAtomComponent } from '../../atoms/button/button';
import { InputAtomComponent } from '../../atoms/input/input';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [InputAtomComponent, ButtonAtomComponent],
  templateUrl: './login.html',
})
export class LoginPageComponent {

  email = '';
  password = '';

  constructor(private router: Router) {}

  login() {
    // mock login (no backend yet)
    console.log("Logged in with:", this.email, this.password);

    // navigate to Add Employee after login
    this.router.navigate(['/hr/add-employee']);
  }
}
