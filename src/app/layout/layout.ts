import { Component, OnInit } from '@angular/core';
import layoutConfig from './layout.config.json';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header';
import { NavbarComponent } from './navbar/navbar';

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.html',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    NavbarComponent
  ]
})
export class LayoutComponent implements OnInit {

  layout: any = layoutConfig;
  userRole = 'hr';

  activeModule: any = null;
  navbarMenu: any[] = [];

  ngOnInit(): void {
    console.log('Layout init');

    this.activeModule = this.layout.modules.find((m: any) =>
      m.roles.includes(this.userRole)
    );

    this.navbarMenu = this.activeModule?.nav || [];
  }
}
