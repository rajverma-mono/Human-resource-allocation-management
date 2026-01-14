import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router'; // Added Router
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
    private router: Router, // Added Router for navigation
    private http: HttpClient,
    private cdr: ChangeDetectorRef
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

  // Helper method to get role display labels
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

  // Load project details from API
  private loadProjectDetails(projectId: string) {
    this.loading = true;

    const baseUrl = this.config.apiEndpoints?.detail?.replace(
      '{{API_BASE}}',
      environment.API_BASE
    ) || `${environment.API_BASE}/projects`;

    const url = `${baseUrl}/${projectId}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.project = res.data || res.project || res;
        this.loadRequirementsForProject(projectId);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // Load requirements for the project
  private loadRequirementsForProject(projectId: string) {
    const getById = requirementsConfig.apiEndpoints?.getById;

    if (!getById) {
      console.warn('⚠️ Requirements getById endpoint not configured');
      this.loading = false;
      return;
    }

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

        // Parse roleExperienceMap if it's a string
        if (typeof requirements.roleExperienceMap === 'string') {
          try {
            requirements.roleExperienceMap = JSON.parse(
              requirements.roleExperienceMap
            );
          } catch {
            requirements.roleExperienceMap = [];
          }
        }

        // Attach requirements to project
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

  // Handle when requirements are saved
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
      case 'print':
        this.handlePrint();
        break;
      case 'export':
        this.handleExport();
        break;
      case 'addEmployee':
        this.addEmployeeToProject();
        break;
      case 'viewTeam':
        this.viewProjectTeam();
        break;
      case 'matchResources':
        this.matchResources();
        break;
      case 'updateProgress':
        this.updateProjectProgress();
        break;
      case 'addRequirements':
        this.openRequirementsModal();
        break;
      case 'editRequirements':
        this.openRequirementsModal();
        break;
      case 'viewRequirementDetails':
        this.viewRequirementDetails();
        break;
      default:
        console.log('Unhandled action:', action);
    }
  }

  // Open requirements modal
  openRequirementsModal() {
    this.showRequirementsModal = true;
    this.cdr.detectChanges();
  }

  // Close requirements modal
  closeRequirementsModal() {
    this.showRequirementsModal = false;
  }

  // Handle quick actions
  onQuickAction(event: any) {
    if (typeof event === 'string') {
      this.onAction(event);
    } else if (event?.action) {
      this.onAction(event.action);
    }
  }

  // ================= ACTION HANDLERS =================

private handleEditProject() {
  if (!this.project?.id) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Cannot edit project: No project ID found.',
      confirmButtonColor: '#5b0f14'
    });
    return;
  }

  console.log('📤 Navigating to edit with project:', this.project);
  
  // ✅ Navigate with BOTH route params AND state
  this.router.navigate(['/projects', 'edit', this.project.id], {
    state: {
      projectData: this.project,
      mode: 'edit'
    }
  });
}

  private handleResourceAllocation() {
    console.log('Resource allocation for:', this.project);
    // Navigate to allocation page
    // this.router.navigate(['/projects', this.project.id, 'allocation']);
    Swal.fire({
      icon: 'info',
      title: 'Resource Allocation',
      text: 'Resource allocation feature coming soon!',
      confirmButtonColor: '#5b0f14'
    });
  }

  private generateReport() {
    console.log('Generate report for:', this.project);
    Swal.fire({
      icon: 'info',
      title: 'Generate Report',
      text: 'Report generation feature coming soon!',
      confirmButtonColor: '#5b0f14'
    });
  }

  private handlePrint() {
    console.log('Print project details');
    window.print();
  }

  private handleExport() {
    console.log('Export project data');
    Swal.fire({
      icon: 'info',
      title: 'Export Project',
      text: 'Export feature coming soon!',
      confirmButtonColor: '#5b0f14'
    });
  }

  private addEmployeeToProject() {
    console.log('Add employee to project');
    Swal.fire({
      icon: 'info',
      title: 'Add Employee',
      text: 'Add employee feature coming soon!',
      confirmButtonColor: '#5b0f14'
    });
  }

  private viewProjectTeam() {
    console.log('View project team');
    Swal.fire({
      icon: 'info',
      title: 'View Team',
      text: 'Team view feature coming soon!',
      confirmButtonColor: '#5b0f14'
    });
  }

  private matchResources() {
    console.log('Match resources with requirements');
    if (this.project?.requirements) {
      Swal.fire({
        icon: 'info',
        title: 'Match Resources',
        html: `Matching resources with project requirements:<br><br>
                       <strong>Required:</strong> ${this.project.requirements.requiredHeadcount || 0} positions<br>
                       <strong>Roles:</strong> ${this.project.requirements.requiredRoles?.length || 0} role types`,
        confirmButtonColor: '#5b0f14'
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No Requirements',
        text: 'Please define project requirements first to match resources.',
        confirmButtonColor: '#5b0f14'
      });
    }
  }

  private updateProjectProgress() {
    console.log('Update project progress');
    Swal.fire({
      icon: 'info',
      title: 'Update Progress',
      text: 'Progress update feature coming soon!',
      confirmButtonColor: '#5b0f14'
    });
  }

  private viewRequirementDetails() {
    console.log('View requirement details');
    if (this.project?.requirements) {
      this.openRequirementsModal();
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No Requirements',
        text: 'No requirements defined for this project.',
        confirmButtonColor: '#5b0f14'
      });
    }
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