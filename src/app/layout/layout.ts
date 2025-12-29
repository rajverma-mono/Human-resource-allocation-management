import { Component } from '@angular/core';
import layoutConfig from './layout.config.json';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header';
import { NavbarComponent } from './navbar/navbar';
import { SidebarComponent } from './sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.html',
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavbarComponent, SidebarComponent]
})
export class LayoutComponent {

  layout: any = layoutConfig;
  userRole = "hr";

  activeModule = this.getFirstAccessibleModule();

  get visibleModules(){
    return this.layout.modules.filter((m: any)=>m.roles.includes(this.userRole));
  }

  selectModule(module:any){
    this.activeModule = module;
  }

  private getFirstAccessibleModule(){
    return this.layout.modules.find((m:any)=>m.roles.includes(this.userRole));
  }
}
