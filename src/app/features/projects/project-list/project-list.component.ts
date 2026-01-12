import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { environment } from '../../../../environment';
import projectConfig from './project-list.config.json';
import { ProjectCardComponent } from '../../../atoms/atom-project-card/atom-project-card.component';

import { PageHeaderComponent } from '../../../atoms/page-header/page-header';
import { SearchFilterAtomComponent } from '../../../atoms/atom-search/atom-search-filter.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    PageHeaderComponent,
    SearchFilterAtomComponent,
    ProjectCardComponent
  ],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit {

  config: any = projectConfig;

  projects: any[] = [];
  filteredProjects: any[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProjects();

    // 🔁 reload when coming back to list
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadProjects();
      });
  }

  trackByProjectId(index: number, proj: any) {
    return proj.id;
  }

  openProject(project: any) {
    this.router.navigate(['/projects', project.id]);
  }

  onFiltered(data: any[]) {
    this.filteredProjects = data;
  }

  private loadProjects() {
    this.loading = true;

    const url = this.config.apiEndpoints.list.replace(
      '{{API_BASE}}',
      environment.API_BASE
    );

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.projects = res;
        this.filteredProjects = [...this.projects];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
