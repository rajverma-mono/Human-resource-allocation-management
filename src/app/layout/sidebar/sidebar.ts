import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent implements OnInit, OnChanges {

  @Input() modules: any[] = [];

  visibleModules: any[] = [];
  isCollapsed = false;
  userRole: string = '';

  ngOnInit(): void {
    this.userRole = (localStorage.getItem('role') || '').toLowerCase();
    console.log('Sidebar role:', this.userRole);

    // 🔥 re-run filter once role is ready
    this.filterModules();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🧨 ngOnChanges fired');
    console.log('🧨 modules input value:', this.modules);

    if (changes['modules']) {
      this.filterModules();
    }
  }

  private filterModules(): void {
    // ⛔ Guard: don’t filter until both are ready
    if (!this.modules?.length || !this.userRole) {
      console.log('⏸️ Skipping filter (modules or role missing)');
      return;
    }

    console.log('🧨 Filtering modules with role:', this.userRole);

    this.visibleModules = this.modules.filter(
      m =>
        !m.roles ||
        m.roles.map((r: string) => r.toLowerCase()).includes(this.userRole)
    );

    console.log('🧨 visibleModules result:', this.visibleModules);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
