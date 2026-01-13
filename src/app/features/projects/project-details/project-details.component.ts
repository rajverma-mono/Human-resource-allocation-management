import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

import { environment } from '../../../../environment';
import detailConfig from './project-detail.config.json';
import requirementsConfig from '../project-requirements/project-requirements.config.json';

import { DetailsCompositeComponent } from '../../../atoms/details-composite-project/details-composite.component';
import { RequirementsSidePanelComponent } from '../project-requirements/requirements-side-panel.component';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    DetailsCompositeComponent,
    RequirementsSidePanelComponent,
    MatIconModule
  ],
  templateUrl: './project-details.component.html'
})
export class ProjectDetailsComponent implements OnInit {

  config = detailConfig;
  project: any;
  loading = true;
  
  // Requirements panel properties
  showRequirementsPanel = false;
  requirementsConfig = requirementsConfig;
  existingRequirements: any;
  loadingRequirements = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

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

  // In your loadProjectDetails method
private loadProjectDetails(projectId: string) {
  const baseUrl = this.config.apiEndpoints?.detail?.replace(
    '{{API_BASE}}',
    environment.API_BASE
  ) || `${environment.API_BASE}/projects`;

  const url = `${baseUrl}/${projectId}`;
  
  console.log('Fetching from URL:', url); // Add this

  this.http.get<any>(url).subscribe({
    next: (res) => {
      console.log('API Response:', res); // Add this
      this.project = res;
      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load project', err);
      this.loading = false;
    }
  });
}
// Add this method to your ProjectDetailsComponent class
logProjectToConsole() {
  console.log('🔍 DEBUG - Project Data:', this.project);
  console.log('🔍 DEBUG - Config:', this.config);
  console.log('🔍 DEBUG - Loading state:', this.loading);
}
  private enhanceProjectData(projectData: any): any {
    // Add calculated fields if needed
    return {
      ...projectData,
      completionPercentage: projectData.completionPercentage || 0,
      resourceCount: projectData.resourceCount || 0,
      teamCount: projectData.teamCount || 0
    };
  }

  // Handle actions from details composite component
  onAction(action: string) {
    console.log('Action triggered:', action);
    
    switch(action) {
      case 'requirements':
        this.openRequirementsPanel();
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
      // Add more cases as needed from your config
      default:
        console.log('Unhandled action:', action);
    }
  }

  // Open requirements side panel
// Open requirements side panel
openRequirementsPanel() {
  if (!this.project) return;
  
  this.loadingRequirements = true;
  this.showRequirementsPanel = true;
  
  // Try to load existing requirements
  const getUrl = this.requirementsConfig.apiEndpoints?.get
    ?.replace('{{API_BASE}}', environment.API_BASE)
    ?.replace('{{projectId}}', this.project.id || this.project._id || this.project.projectId);
  
  if (getUrl) {
    this.http.get<any>(getUrl).subscribe({
      next: (requirements) => {
        this.existingRequirements = requirements;
        this.loadingRequirements = false;
      },
      error: (err) => {
        // No existing requirements - that's OK for first time!
        console.log('No existing requirements found, opening empty form');
        this.existingRequirements = null;
        this.loadingRequirements = false;
      }
    });
  } else {
    this.loadingRequirements = false;
  }
}

  // Close requirements panel
  closeRequirementsPanel() {
    this.showRequirementsPanel = false;
    this.existingRequirements = null;
  }

  // Save requirements data
  saveRequirements(data: any) {
    if (!this.project) return;
    
    const saveUrl = this.requirementsConfig.apiEndpoints.save
      .replace('{{API_BASE}}', environment.API_BASE)
      .replace('{{projectId}}', this.project.id || this.project.projectId);
    
    // Ensure projectName is included
    data.projectName = this.project.projectName || this.project.project_name;
    
    // Process skills array if present
    if (data.requiredSkills && Array.isArray(data.requiredSkills)) {
      data.requiredSkills = data.requiredSkills.join(',');
    }
    
    this.http.post(saveUrl, data).subscribe({
      next: (response) => {
        console.log('Requirements saved successfully:', response);
        this.closeRequirementsPanel();
        // Show success notification
        this.showNotification('Requirements saved successfully!', 'success');
        
        // Optionally reload project data to reflect changes
        this.loadProjectDetails(this.project.id || this.project.projectId);
      },
      error: (err) => {
        console.error('Failed to save requirements:', err);
        // Show error notification
        this.showNotification('Failed to save requirements. Please try again.', 'error');
      }
    });
  }

  // Handle edit project
  private handleEditProject() {
    // Implement edit project logic
    console.log('Edit project:', this.project);
    // Navigate to edit page or open edit modal
  }

  // Handle resource allocation
  private handleResourceAllocation() {
    // Implement resource allocation logic
    console.log('Resource allocation for:', this.project);
    // Navigate to allocation page or open allocation modal
  }

  // Generate report
  private generateReport() {
    // Implement report generation logic
    console.log('Generate report for:', this.project);
  }

// Quick action handlers from side panel
onQuickAction(event: any) {
  console.log('Quick action event:', event);
  
  // Extract action from the event
  let action: string;
  let data: any;
  
  if (typeof event === 'string') {
    action = event;
  } else if (event?.action) {
    // If event has action property
    action = event.action;
    data = event.data;
  } else if (event?.target?.value) {
    // If it's a DOM event
    action = event.target.value;
  } else {
    console.error('Unknown quick action format:', event);
    return;
  }
  
  console.log('Processing action:', action);
  
  switch(action) {
    case 'addEmployee':
      this.addEmployeeToProject();
      break;
    case 'viewTeam':
      this.viewProjectTeam();
      break;
    case 'updateProgress':
      this.updateProjectProgress();
      break;
    // Add more quick actions as needed
    default:
      console.log('Unhandled quick action:', action);
  }
}

  // Additional quick action methods
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

  // Helper method for notifications (you can use a toast service)
  private showNotification(message: string, type: 'success' | 'error' | 'info') {
    // Implement notification logic (e.g., using MatSnackBar)
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Example with MatSnackBar (uncomment if you have it configured)
    /*
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`]
    });
    */
  }

  // Get formatted project ID for display
  getProjectId(): string {
    return this.project?.id || this.project?.projectId || 'N/A';
  }
}