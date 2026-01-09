import { Component, OnInit } from '@angular/core';
import layoutConfig from './layout.config.json';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header';
import { NavbarComponent } from './navbar/navbar';
import { SidebarComponent } from './sidebar/sidebar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.html',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    NavbarComponent,
    SidebarComponent
  ]
})


export class LayoutComponent implements OnInit {

  layout: any = layoutConfig;
  userRole!: string;

  activeModule: any = null;
  navbarMenu: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.syncRole();

    this.router.events.subscribe(() => {
      this.syncRole();
    });
  }

  private syncRole(): void {
    const role = localStorage.getItem('role');
    if (!role) return;

    this.userRole = role;
    this.resolveActiveModule();
  }

  private resolveActiveModule(): void {
    this.activeModule = this.layout.modules.find(
      (m: any) => m.roles?.includes(this.userRole)
    );

    this.navbarMenu = this.activeModule?.nav || [];
  }
}

