import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { environment } from '../../../../environment';
import detailConfig from './project-detail.config.json';

import { DetailsCompositeComponent } from '../../../atoms/details-composite-project/details-composite.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    DetailsCompositeComponent
  ],
  templateUrl: './project-details.component.html'
})
export class ProjectDetailsComponent implements OnInit {

  config = detailConfig;
  project: any;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

 ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const projectId = params.get('id');
    if (!projectId || projectId === ':id') {
      console.error('Invalid project id:', projectId);
      return;
    }

    const baseUrl = this.config.apiEndpoints.detail.replace(
      '{{API_BASE}}',
      environment.API_BASE
    );

    const url = `${baseUrl}/${projectId}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.project = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load project', err);
        this.loading = false;
      }
    });
  });
}

}
