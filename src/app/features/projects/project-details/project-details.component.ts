import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '../../../../environment';
import detailConfig from './project-detail.config.json';

import { DetailsCompositeComponent } from '../../../atoms/details-composite-project/details-composite.component';
import { ProjectRequirementsModalComponent } from '../project-requirements/project-requirements-modal.component';

@Component({
    selector: 'app-project-details',
    standalone: true,
    imports: [
        CommonModule,
        HttpClientModule,
        RouterModule,
        DetailsCompositeComponent,
        ProjectRequirementsModalComponent,
        MatIconModule,
    ],
    templateUrl: './project-details.component.html'
})
export class ProjectDetailsComponent implements OnInit {

    config = detailConfig;
    project: any;
    loading = true;

    // Requirements modal properties
    showRequirementsModal = false;

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private cdr: ChangeDetectorRef // ADD THIS

    ) { }

     ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const projectId = params.get('id');
      if (!projectId || projectId === ':id') {
        console.error('Invalid project id:', projectId);
        this.loading = false;
        return;
      }

      this.loadProjectDetails(projectId);
    });
  }

    private loadProjectDetails(projectId: string) {
  const baseUrl = this.config.apiEndpoints?.detail?.replace(
    '{{API_BASE}}',
    environment.API_BASE
  ) || `${environment.API_BASE}/projects`;

  const url = `${baseUrl}/${projectId}`;
  
  console.log('Fetching from URL:', url);

  this.http.get<any>(url).subscribe({
    next: (res) => {
      console.log('✅ API Response received:', res);
      console.log('✅ Response type:', typeof res);
      console.log('✅ Response keys:', Object.keys(res));
      
      // Check if response is nested
      if (res.data) {
        console.log('✅ Found nested data property:', res.data);
        this.project = res.data;
      } else if (res.project) {
        console.log('✅ Found nested project property:', res.project);
        this.project = res.project;
      } else {
        console.log('✅ Using response directly');
        this.project = res;
      }
      
      console.log('✅ Project object after assignment:', this.project);
      console.log('✅ Project ID:', this.project?.id || this.project?._id);
      
      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Failed to load project', err);
      this.loading = false;
    }
  });
}

    // Handle actions from details composite component
    onAction(action: string) {
        console.log('Action triggered:', action);

        switch (action) {
            case 'requirements':
                this.openRequirementsModal();
                break;
            case 'edit':
                this.handleEditProject();
                break;
            case 'allocate':
                this.handleResourceAllocation();
                break;
            case 'report':
                this.generateReport();
                break;
            default:
                console.log('Unhandled action:', action);
        }
    }

    // Open requirements modal
    openRequirementsModal() {
    this.showRequirementsModal = true;
    this.cdr.detectChanges(); // TRIGGER CHANGE DETECTION
  }


    // Close requirements modal
    closeRequirementsModal() {
        this.showRequirementsModal = false;
    }

    // Handle requirements saved
    onRequirementsSaved() {
        this.showRequirementsModal = false;
        // Show success message or refresh data
        console.log('Requirements saved successfully');
        // Optionally refresh project data
        if (this.project?.id) {
            this.loadProjectDetails(this.project.id);
        }
    }

    // Handle quick actions
    onQuickAction(event: any) {
        if (typeof event === 'string') {
            this.onAction(event);
        } else if (event?.action) {
            this.onAction(event.action);
        }
    }

    // Other action handlers
    private handleEditProject() {
        console.log('Edit project:', this.project);
        // Navigate to edit page
        // this.router.navigate(['/projects/edit', this.project.id]);
    }

    private handleResourceAllocation() {
        console.log('Resource allocation for:', this.project);
        // Navigate to allocation page
        // this.router.navigate(['/projects', this.project.id, 'allocation']);
    }

    private generateReport() {
        console.log('Generate report for:', this.project);
        // Implement report generation
    }

    private addEmployeeToProject() {
        console.log('Add employee to project');
        // Implement add employee logic
    }

    private viewProjectTeam() {
        console.log('View project team');
        // Implement view team logic
    }

    private updateProjectProgress() {
        console.log('Update project progress');
        // Implement update progress logic
    }

    // Helper method for notifications
    private showNotification(message: string, type: 'success' | 'error' | 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // You can implement toast/notification service here
    }

    // Debug method
    logProjectToConsole() {
        console.log('🔍 DEBUG - Project Data:', this.project);
        console.log('🔍 DEBUG - Config:', this.config);
        console.log('🔍 DEBUG - Loading state:', this.loading);
    }
}