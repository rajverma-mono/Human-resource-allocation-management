import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html'
})
export class NavbarComponent {

  @Input() menu: any[] = [];

  constructor(private router: Router) {}

  logout(): void {
    // clear auth/session data
    localStorage.removeItem('role');
    localStorage.removeItem('token'); // if you have one
    localStorage.clear(); // optional, if everything is stored there

    // redirect to login
    this.router.navigate(['/login']);
  }
}
