import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { environment } from '../../../../environment';
import detailConfig from './project-detail.config.json';
import requirementsConfig from '../project-requirements/project-requirements.config.json';

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

  // Add this helper method
getRoleLabel(roleValue: string): string {
  const roleLabels: { [key: string]: string } = {
    'project_manager': 'Project Manager',
    'developer': 'Developer',
    'qa': 'QA Engineer',
    'ba': 'Business Analyst',
    'designer': 'Designer',
    'devops': 'DevOps'
  };
  
  return roleLabels[roleValue] || roleValue.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Update your loadProjectDetails method to include requirements
private loadProjectDetails(projectId: string) {
  this.loading = true; // ✅ start loading

  const baseUrl = this.config.apiEndpoints?.detail?.replace(
    '{{API_BASE}}',
    environment.API_BASE
  ) || `${environment.API_BASE}/projects`;

  const url = `${baseUrl}/${projectId}`;

  this.http.get<any>(url).subscribe({
    next: (res) => {
      this.project = res.data || res.project || res;

      // 🚫 DO NOT set loading=false here
      this.loadRequirementsForProject(projectId);
    },
    error: () => {
      this.loading = false;
    }
  });
}


private loadRequirementsForProject(projectId: string) {
  const getById = requirementsConfig.apiEndpoints?.getById;

  if (!getById) {
    console.warn('⚠️ Requirements getById endpoint not configured');
    this.loading = false;
    return;
  }

  // ✅ Build URL from REQUIREMENTS config
  const requirementsUrl = getById
    .replace('{{API_BASE}}', environment.API_BASE)
    .replace('{{projectId}}', projectId);

  console.log('🔍 Fetching requirements from:', requirementsUrl);

  this.http.get<any[]>(requirementsUrl).subscribe({
    next: (list) => {
      console.log('✅ Requirements API Response:', list);

      // json-server always returns ARRAY
      if (!list || list.length === 0) {
        console.log('ℹ️ No requirements found');
        this.project = {
          ...this.project,
          requirements: null
        };
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      const requirements = list[0];

      // ✅ Parse roleExperienceMap
      if (typeof requirements.roleExperienceMap === 'string') {
        try {
          requirements.roleExperienceMap = JSON.parse(
            requirements.roleExperienceMap
          );
        } catch {
          requirements.roleExperienceMap = [];
        }
      }

      // ✅ Attach requirements to project
      this.project = {
        ...this.project,
        requirements
      };

      console.log('✅ Final project with requirements:', this.project);

      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('❌ Requirements API Error:', err);

      this.project = {
        ...this.project,
        requirements: null
      };

      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

// Update onRequirementsSaved to reload requirements
onRequirementsSaved() {
  this.showRequirementsModal = false;
  
  // Show success message
  Swal.fire({
    icon: 'success',
    title: 'Requirements Saved!',
    text: 'Project requirements have been updated successfully.',
    confirmButtonColor: '#5b0f14',
    timer: 2000,
    timerProgressBar: true
  }).then(() => {
    // Reload requirements for this project
    if (this.project?.id) {
      this.loadRequirementsForProject(this.project.id);
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

    // // Handle requirements saved
    // onRequirementsSaved() {
    //     this.showRequirementsModal = false;
    //     // Show success message or refresh data
    //     console.log('Requirements saved successfully');
    //     // Optionally refresh project data
    //     if (this.project?.id) {
    //         this.loadProjectDetails(this.project.id);
    //     }
    // }

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