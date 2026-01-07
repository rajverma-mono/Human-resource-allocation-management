import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: any): boolean {
    const allowedRoles = route.data?.roles as string[];
    const role = localStorage.getItem('role');

    if (!role || !allowedRoles?.includes(role)) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
