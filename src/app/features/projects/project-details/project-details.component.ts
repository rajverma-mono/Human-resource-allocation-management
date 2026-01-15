import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { environment } from '../../../../environment';
import detailConfig from './project-detail.config.json';
import requirementsConfig from '../project-requirements/project-requirements.config.json';

import { DetailsCompositeComponent } from '../../../atoms/details-composite-project/details-composite.component';
import { ProjectRequirementsModalComponent } from '../project-requirements/project-requirements-modal.component';
import { ButtonAtomComponent } from '../../../atoms/button/button'; // Add this import

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
    ButtonAtomComponent // Add this
  ],
  templateUrl: './project-details.component.html'
})
export class ProjectDetailsComponent implements OnInit {

  config = detailConfig;
  project: any;
  allocations: any[] = [];
  loading = true;
  allocationsLoading = true;

  showRequirementsModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const projectId = params.get('id');
      if (!projectId || projectId === ':id') {
        console.error('Invalid project id:', projectId);
        this.loading = false;
        this.allocationsLoading = false;
        return;
      }

      this.loadProjectDetails(projectId);
      this.loadProjectAllocations(projectId);
    });
  }

  // Helper method to get allocation action config
getAllocationAction(actionId: string): any {
  // Type assertion to handle the JSON config
  const actions = this.config.allocationActions as Record<string, any>;
  return actions?.[actionId] || {};
}

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
        this.cdr.detectChanges();
      }
    });
  }

  private loadRequirementsForProject(projectId: string) {
    const getById = requirementsConfig.apiEndpoints?.getById;

    if (!getById) {
      console.warn('⚠️ Requirements getById endpoint not configured');
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const requirementsUrl = getById
      .replace('{{API_BASE}}', environment.API_BASE)
      .replace('{{projectId}}', projectId);

    this.http.get<any[]>(requirementsUrl).subscribe({
      next: (list) => {
        if (!list || list.length === 0) {
          this.project = {
            ...this.project,
            requirements: null
          };
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        const requirements = list[0];

        if (typeof requirements.roleExperienceMap === 'string') {
          try {
            requirements.roleExperienceMap = JSON.parse(
              requirements.roleExperienceMap
            );
          } catch {
            requirements.roleExperienceMap = [];
          }
        }

        this.project = {
          ...this.project,
          requirements
        };

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

  private loadProjectAllocations(projectId: string) {
    this.allocationsLoading = true;
    
    const allocationsUrl = `${environment.API_BASE}/project-allocations?projectId=${projectId}`;
    
    this.http.get<any>(allocationsUrl).subscribe({
      next: (response) => {
        console.log('📊 Allocations loaded:', response);
        
        let allocationsList: any[] = [];
        
        if (Array.isArray(response)) {
          allocationsList = response;
        } else if (response && typeof response === 'object') {
          const keys = Object.keys(response);
          if (keys.some(key => !isNaN(Number(key)))) {
            allocationsList = Object.values(response).filter((item: any) => 
              item && typeof item === 'object' && !(item as any).id
            );
          } else if ((response as any).data) {
            allocationsList = (response as any).data;
          } else {
            allocationsList = Object.values(response);
          }
        }
        
        this.allocations = allocationsList.filter((item: any) => 
          item && item.projectId === projectId
        );
        
        console.log(`✅ Processed ${this.allocations.length} allocations`);
        this.allocationsLoading = false;
        this.cdr.detectChanges();
        
        if (this.project) {
          this.project = {
            ...this.project,
            allocationCount: this.allocations.length,
            allocatedResources: this.allocations.length
          };
        }
      },
      error: (err) => {
        console.error('❌ Error loading allocations:', err);
        this.allocations = [];
        this.allocationsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getAllocationsByRole(): { [role: string]: any[] } {
    const grouped: { [role: string]: any[] } = {};
    
    this.allocations.forEach(allocation => {
      const role = allocation.roleInProject;
      if (!grouped[role]) {
        grouped[role] = [];
      }
      grouped[role].push(allocation);
    });
    
    return grouped;
  }

  getUniqueRoles(): string[] {
    return [...new Set(this.allocations.map(a => a.roleInProject))];
  }

  getRoleAllocationCount(role: string): number {
    return this.allocations.filter(a => a.roleInProject === role).length;
  }

  getTotalAllocated(): number {
    return this.allocations.length;
  }

  getTotalRequiredFromRoles(): number {
    if (!this.project?.requirements?.roleExperienceMap) {
      return this.project?.requirements?.requiredHeadcount || 0;
    }
    
    try {
      let roleExperienceMap = this.project.requirements.roleExperienceMap;
      
      if (typeof roleExperienceMap === 'string') {
        roleExperienceMap = JSON.parse(roleExperienceMap);
      }
      
      if (Array.isArray(roleExperienceMap)) {
        return roleExperienceMap.reduce((total: number, role: any) => {
          return total + (parseInt(role.requiredCount) || 1);
        }, 0);
      }
      
      return this.project?.requirements?.requiredHeadcount || 0;
    } catch {
      return this.project?.requirements?.requiredHeadcount || 0;
    }
  }

  onRequirementsSaved() {
    this.showRequirementsModal = false;

    Swal.fire({
      icon: 'success',
      title: 'Requirements Saved!',
      text: 'Project requirements have been updated successfully.',
      confirmButtonColor: '#5b0f14',
      timer: 2000,
      timerProgressBar: true
    }).then(() => {
      if (this.project?.id) {
        this.loadRequirementsForProject(this.project.id);
      }
    });
  }

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
      case 'editAllocations':
        this.handleEditAllocations();
        break;
      case 'viewAllocationDetails':
        this.viewAllocationDetails();
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

  openRequirementsModal() {
    this.showRequirementsModal = true;
    this.cdr.detectChanges();
  }

  closeRequirementsModal() {
    this.showRequirementsModal = false;
  }

  onQuickAction(event: any) {
    if (typeof event === 'string') {
      this.onAction(event);
    } else if (event?.action) {
      this.onAction(event.action);
    }
  }

  // Update this method to pass existing allocations
  handleEditAllocations() {
    if (!this.project?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot edit allocations: No project ID found.',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    if (this.allocations.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Allocations',
        text: 'No resources have been allocated to this project yet.',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    Swal.fire({
      title: 'Edit Allocations',
      html: `
        <div class="text-left">
          <p class="mb-4"><strong>Project:</strong> ${this.project.projectName}</p>
          <p class="mb-4"><strong>Current Allocations:</strong> ${this.allocations.length} resources</p>
          
          <div class="mb-4 p-3 bg-blue-50 border border-blue-100 rounded">
            <h5 class="font-medium text-blue-800 mb-2">Edit Options:</h5>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <mat-icon class="!text-sm text-green-600">add_circle</mat-icon>
                <span class="text-sm">Add more resources</span>
              </div>
              <div class="flex items-center gap-2">
                <mat-icon class="!text-sm text-amber-600">remove_circle</mat-icon>
                <span class="text-sm">Remove existing allocations</span>
              </div>
              <div class="flex items-center gap-2">
                <mat-icon class="!text-sm text-blue-600">swap_horiz</mat-icon>
                <span class="text-sm">Modify existing allocations</span>
              </div>
            </div>
          </div>
          
          <p class="text-sm text-gray-600">
            You'll be redirected to the allocation page with existing allocations pre-filled.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Edit Allocations',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#5b0f14',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('📤 Navigating to edit allocations for project:', this.project);
        
        // Navigate with existing allocations data
        this.router.navigate(['/projects', this.project.id, 'allocate'], {
          state: {
            existingAllocations: this.allocations,
            project: this.project,
            mode: 'edit'
          }
        });
      }
    });
  }

  handleEditProject() {
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
    
    this.router.navigate(['/projects', 'edit', this.project.id], {
      state: {
        projectData: this.project,
        mode: 'edit'
      }
    });
  }

  // Update this method to pass state
  handleResourceAllocation() {
    if (!this.project?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot allocate resources: No project ID found.',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    console.log('📤 Navigating to allocation for project:', this.project);
    
    // If allocations exist, pass them for editing, otherwise start fresh
    const navigationState = {
      project: this.project,
      mode: this.allocations.length > 0 ? 'edit' : 'create',
      existingAllocations: this.allocations.length > 0 ? this.allocations : null
    };
    
    this.router.navigate(['/projects', this.project.id, 'allocate'], {
      state: navigationState
    });
  }

  viewAllocationDetails() {
    console.log('View allocation details');
    
    if (this.allocations.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Allocations',
        text: 'No resources have been allocated to this project yet.',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }
    
    this.showFullAllocationsModal();
  }

  private showFullAllocationsModal() {
    // Group allocations by role for better organization
    const allocationsByRole = this.getAllocationsByRole();
    const roles = Object.keys(allocationsByRole);
    
    // Create HTML content for the modal
    let htmlContent = `
      <div class="text-left max-h-96 overflow-y-auto">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-lg font-bold text-gray-900">All Allocations</h3>
              <p class="text-sm text-gray-600">Project: ${this.project?.projectName || 'N/A'}</p>
            </div>
            <span class="px-3 py-1 bg-[#5b0f14]/10 text-[#5b0f14] text-sm font-semibold rounded-full">
              ${this.allocations.length} total
            </span>
          </div>
        </div>
    `;
    
    // Add role-by-role sections
    roles.forEach(role => {
      const roleAllocations = allocationsByRole[role];
      const uniqueEmployees = [...new Set(roleAllocations.map(a => a.employeeName))];
      
      htmlContent += `
        <div class="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-[#5b0f14]/10 flex items-center justify-center">
                  <span class="text-[#5b0f14] font-bold">${roleAllocations.length}</span>
                </div>
                <h4 class="font-semibold text-gray-800">${role}</h4>
              </div>
              <span class="text-xs font-medium text-gray-600">
                ${uniqueEmployees.length} unique employee(s)
              </span>
            </div>
          </div>
          
          <div class="divide-y divide-gray-100">
      `;
      
      roleAllocations.forEach((allocation, index) => {
        const allocationDate = allocation.allocatedDate ? 
          new Date(allocation.allocatedDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : 'N/A';
        
        const startDate = allocation.startDate ? 
          new Date(allocation.startDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }) : 'N/A';
        
        htmlContent += `
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 
                            flex items-center justify-center">
                    <span class="text-sm font-bold text-gray-700">
                      ${allocation.employeeName?.charAt(0) || 'E'}
                    </span>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">${allocation.employeeName || 'N/A'}</div>
                    <div class="text-xs text-gray-600 mt-0.5">
                      ${allocation.employeeCode || 'No Code'} • ${allocation.department || 'No Department'}
                    </div>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mt-3">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">Employee ID:</span>
                    <span class="font-medium text-gray-700">${allocation.employeeId || 'N/A'}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">Start Date:</span>
                    <span class="font-medium text-gray-700">${startDate}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-500">Allocated:</span>
                    <span class="font-medium text-gray-700">${allocationDate}</span>
                  </div>
                </div>
                
                ${allocation.notes ? `
                  <div class="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs">
                    <span class="text-blue-800 font-medium">Notes:</span>
                    <span class="text-blue-700 ml-2">${allocation.notes}</span>
                  </div>
                ` : ''}
              </div>
              
              <div class="ml-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                           ${allocation.status === 'Active' ? 
                             'bg-green-100 text-green-800' : 
                             'bg-gray-100 text-gray-800'}">
                  ${allocation.status || 'Active'}
                </span>
              </div>
            </div>
            
            <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div>
                <span class="font-medium">Allocation:</span>
                <span class="ml-2">${allocation.allocationPercentage || 100}%</span>
              </div>
              <div class="text-right">
                ID: ${allocation.id || 'N/A'}
              </div>
            </div>
          </div>
        `;
      });
      
      htmlContent += `
          </div>
        </div>
      `;
    });
    
    // Add summary section
    const roleSummary = roles.map(role => {
      const count = allocationsByRole[role].length;
      const uniqueEmployees = [...new Set(allocationsByRole[role].map(a => a.employeeName))].length;
      return `${count} ${role} (${uniqueEmployees} emp)`;
    }).join(', ');
    
    const uniqueEmployeeCount = [...new Set(this.allocations.map(a => a.employeeId))].length;
    const allocationDates = this.allocations
      .filter(a => a.allocatedDate)
      .map(a => new Date(a.allocatedDate));
    const earliestDate = allocationDates.length > 0 ? 
      new Date(Math.min(...allocationDates.map(d => d.getTime()))) : null;
    const latestDate = allocationDates.length > 0 ? 
      new Date(Math.max(...allocationDates.map(d => d.getTime()))) : null;
    
    htmlContent += `
        <div class="mt-6 pt-6 border-t border-gray-200">
          <h4 class="font-semibold text-gray-800 mb-3">Summary</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-gray-600 mb-1">Total Allocations</div>
              <div class="text-2xl font-bold text-gray-900">${this.allocations.length}</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-gray-600 mb-1">Unique Employees</div>
              <div class="text-2xl font-bold text-gray-900">${uniqueEmployeeCount}</div>
            </div>
          </div>
          
          <div class="mt-4 space-y-2 text-sm text-gray-600">
            <div class="flex items-center justify-between">
              <span>Roles Allocated:</span>
              <span class="font-medium text-gray-800">${roles.length}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Allocation Period:</span>
              <span class="font-medium text-gray-800">
                ${earliestDate ? earliestDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'} 
                ${latestDate && earliestDate && earliestDate.getTime() !== latestDate.getTime() ? 
                  `to ${latestDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 
                  ''}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>Average Allocation:</span>
              <span class="font-medium text-gray-800">
                ${this.allocations.length > 0 ? 
                  Math.round(this.allocations.reduce((sum, a) => sum + (a.allocationPercentage || 100), 0) / this.allocations.length) : 
                  100}%
              </span>
            </div>
          </div>
          
          <div class="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
            <div class="text-sm text-blue-800">
              <span class="font-medium">Role Breakdown:</span>
              <span class="ml-2">${roleSummary}</span>
            </div>
          </div>
          
          <div class="mt-6 flex justify-between items-center">
            <button id="exportAllocations" 
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 
                           transition-colors text-sm font-medium">
              Export to CSV
            </button>
            <button id="editAllocationsModal" 
                    class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 
                           transition-colors text-sm font-medium">
              Edit Allocations
            </button>
            <button id="printAllocations" 
                    class="px-4 py-2 bg-[#5b0f14] text-white rounded-lg hover:bg-[#7a1419] 
                           transition-colors text-sm font-medium">
              Print List
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Show the modal
    Swal.fire({
      title: 'Resource Allocations',
      html: htmlContent,
      width: '900px',
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-xl',
        closeButton: '!text-gray-500 hover:!text-gray-700'
      }
    }).then(() => {
      // Handle button clicks in the modal
      setTimeout(() => {
        const exportBtn = document.getElementById('exportAllocations');
        const editBtn = document.getElementById('editAllocationsModal');
        const printBtn = document.getElementById('printAllocations');
        
        if (exportBtn) {
          exportBtn.addEventListener('click', () => this.exportAllocationsToCSV());
        }
        
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            Swal.close();
            this.handleEditAllocations();
          });
        }
        
        if (printBtn) {
          printBtn.addEventListener('click', () => this.printAllocations());
        }
      }, 100);
    });
  }

  private exportAllocationsToCSV() {
    console.log('Export allocations to CSV');
    
    if (this.allocations.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No allocations to export.',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }
    
    // Create CSV content
    const headers = ['Employee Name', 'Employee Code', 'Employee ID', 'Department', 
                     'Role', 'Start Date', 'Allocation %', 'Status', 'Notes', 'Allocated Date'];
    
    const csvRows = [
      headers.join(','),
      ...this.allocations.map(allocation => [
        `"${allocation.employeeName || ''}"`,
        `"${allocation.employeeCode || ''}"`,
        `"${allocation.employeeId || ''}"`,
        `"${allocation.department || ''}"`,
        `"${allocation.roleInProject || ''}"`,
        `"${allocation.startDate || ''}"`,
        allocation.allocationPercentage || 100,
        `"${allocation.status || 'Active'}"`,
        `"${(allocation.notes || '').replace(/"/g, '""')}"`,
        `"${allocation.allocatedDate || ''}"`
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `allocations_${this.project?.projectName || 'project'}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Swal.fire({
      icon: 'success',
      title: 'Export Complete',
      text: `${this.allocations.length} allocations exported to CSV`,
      timer: 2000,
      timerProgressBar: true,
      confirmButtonColor: '#5b0f14'
    });
  }

  private printAllocations() {
    console.log('Print allocations');
    
    // Create printable content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({
        icon: 'error',
        title: 'Print Error',
        text: 'Could not open print window. Please check popup blocker.',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }
    
    const allocationsByRole = this.getAllocationsByRole();
    const roles = Object.keys(allocationsByRole);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Allocations - ${this.project?.projectName || 'Project'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #5b0f14; border-bottom: 2px solid #5b0f14; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background: #f5f5f5; padding: 8px; border: 1px solid #ddd; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .role-header { background: #5b0f14; color: white; padding: 10px; margin-top: 15px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Resource Allocations - ${this.project?.projectName || 'Project'}</h1>
        <p><strong>Client:</strong> ${this.project?.clientName || 'N/A'}</p>
        <p><strong>Project ID:</strong> ${this.project?.id || 'N/A'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        <div class="summary">
          <h3>Summary</h3>
          <p><strong>Total Allocations:</strong> ${this.allocations.length}</p>
          <p><strong>Unique Employees:</strong> ${[...new Set(this.allocations.map(a => a.employeeId))].length}</p>
          <p><strong>Roles:</strong> ${roles.length}</p>
        </div>
        
        ${roles.map(role => {
          const roleAllocations = allocationsByRole[role];
          return `
            <div class="role-header">
              <h2>${role} (${roleAllocations.length} allocation${roleAllocations.length > 1 ? 's' : ''})</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Start Date</th>
                  <th>Allocation %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${roleAllocations.map(allocation => `
                  <tr>
                    <td>${allocation.employeeName || 'N/A'}</td>
                    <td>${allocation.employeeCode || 'N/A'}</td>
                    <td>${allocation.department || 'N/A'}</td>
                    <td>${allocation.startDate || 'N/A'}</td>
                    <td>${allocation.allocationPercentage || 100}%</td>
                    <td>${allocation.status || 'Active'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }).join('')}
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #5b0f14; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Document
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close Window
          </button>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  }

  private showAllocationsSummary() {
    const roleSummary = this.getUniqueRoles()
      .map(role => `${this.getRoleAllocationCount(role)} ${role}`)
      .join(', ');
    
    Swal.fire({
      icon: 'success',
      title: 'Allocation Summary',
      html: `
        <div class="text-left">
          <p><strong>Total Allocated:</strong> ${this.getTotalAllocated()} resources</p>
          <p class="mt-2"><strong>By Role:</strong> ${roleSummary}</p>
          <p class="mt-2 text-sm text-gray-500">
            ${this.allocations.length} allocation(s) saved to database
          </p>
        </div>
      `,
      confirmButtonColor: '#5b0f14'
    });
  }

  addEmployeeToProject() {
    console.log('Add employee to project');
    this.handleResourceAllocation();
  }

  viewProjectTeam() {
    if (!this.project?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot view team: No project ID found.',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    if (this.allocations.length === 0) {
      Swal.fire({
        title: 'No Team Members',
        html: `
          <div class="text-center">
            <p class="mb-4">No team members have been allocated to this project yet.</p>
            <p class="text-sm text-gray-500 mb-4">Would you like to allocate resources now?</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Allocate Resources',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#5b0f14',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.handleResourceAllocation();
        }
      });
    } else {
      this.viewAllocationDetails();
    }
  }

  matchResources() {
    console.log('Match resources with requirements');
    
    if (!this.project?.requirements) {
      Swal.fire({
        title: 'Requirements Needed',
        html: `
          <div class="text-center">
            <p class="mb-4">Project requirements need to be defined before matching resources.</p>
            <p class="text-sm text-gray-500 mb-4">Would you like to define requirements first?</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Define Requirements',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#5b0f14',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.openRequirementsModal();
        }
      });
      return;
    }

    Swal.fire({
      title: 'Match Resources',
      html: `
        <div class="text-left">
          <p><strong>Project:</strong> ${this.project.projectName}</p>
          <p><strong>Required Positions:</strong> ${this.project.requirements.requiredHeadcount || 0}</p>
          <p><strong>Available Roles:</strong> ${this.project.requirements.roleExperienceMap?.length || 0}</p>
          <div class="mt-3 p-2 bg-blue-50 border border-blue-100 rounded">
            <p class="text-sm text-blue-800">
              You'll be redirected to the allocation page where you can match employees to these requirements.
            </p>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continue to Allocation',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#5b0f14',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.handleResourceAllocation();
      }
    });
  }

  // Rest of the methods remain the same...
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

  private showNotification(message: string, type: 'success' | 'error' | 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  logProjectToConsole() {
    console.log('🔍 DEBUG - Project Data:', this.project);
    console.log('🔍 DEBUG - Allocations:', this.allocations);
    console.log('🔍 DEBUG - Config:', this.config);
    console.log('🔍 DEBUG - Loading state:', this.loading);
  }
}