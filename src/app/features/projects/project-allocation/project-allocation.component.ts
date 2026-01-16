import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { environment } from '../../../../environment';
import allocationConfig from './project-allocation.config.json';
import { SearchFilterAtomComponent } from '../../../atoms/atom-search/atom-search-filter.component';
import { PageHeaderComponent } from '../../../atoms/page-header/page-header';
import { InputAtomComponent } from '../../../atoms/input/input';
import { SelectAtomComponent } from '../../../atoms/select/select';
import { DatePickerAtomComponent } from '../../../atoms/date-picker/date-picker';
import { TextAreaAtomComponent } from '../../../atoms/textarea/textarea';
import { ButtonAtomComponent } from '../../../atoms/button/button';
import { SelectOptionsPipe } from '../../../pipes/select-options.pipe';
import { MultiSelectAtomComponent } from '../../../atoms/multi-select/multi-select.component';

@Component({
  selector: 'app-project-allocation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    PageHeaderComponent,
    InputAtomComponent,
    SelectAtomComponent,
    DatePickerAtomComponent,
    TextAreaAtomComponent,
    ButtonAtomComponent,
    SelectOptionsPipe,
    SearchFilterAtomComponent,
    MultiSelectAtomComponent
  ],
  templateUrl: './project-allocation.component.html'
})
export class ProjectAllocationComponent implements OnInit {
  config: any = allocationConfig;
  project: any = null;
  requirements: any = null;
  employees: any[] = [];
  roleAllocations: any[] = [];
  isLoading = true;
  projectId: string = '';
  
  existingAllocations: any[] = [];
  editMode = false;
  isEditing = false;
  employeeRoleSelections: Record<string, string[]> = {};
  filteredEmployees: any[] = [];

  allocationForm: any = {
    startDate: this.getTodayDate()
  };

  selectedRole: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      
      const navigation = this.router.getCurrentNavigation();
      const navigationState = navigation?.extras?.state;
      
      if (navigationState) {
        this.existingAllocations = navigationState['existingAllocations'] || [];
        this.editMode = navigationState['mode'] === 'edit';
        this.isEditing = this.editMode;
        
        if (this.editMode && this.existingAllocations.length > 0) {
          if (this.existingAllocations[0]?.startDate) {
            this.allocationForm.startDate = this.existingAllocations[0].startDate;
          }
        }
      }
      
      if (this.projectId) {
        this.loadProjectAndRequirements();
        this.loadEmployees();
      } else {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire('Error', 'No project ID provided', 'error').then(() => {
          this.goBack();
        });
      }
    });
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadProjectAndRequirements(): void {
    const projectsUrl = this.config.apiEndpoints?.projects?.replace('{{API_BASE}}', environment.API_BASE) || 
                       `${environment.API_BASE}/projects`;
    
    const projectUrl = `${projectsUrl}/${this.projectId}`;
    
    this.http.get<any>(projectUrl).subscribe({
      next: (projectRes: any) => {
        this.project = projectRes;
        this.loadRequirements();
      },
      error: () => {
        this.project = null;
        this.checkAllDataLoaded();
        Swal.fire({
          icon: 'error',
          title: 'Project Not Found',
          text: 'Could not load project details.',
          confirmButtonColor: '#5b0f14'
        });
      }
    });
  }

  loadRequirements(): void {
    const requirementsUrl = this.config.apiEndpoints?.requirements?.replace('{{API_BASE}}', environment.API_BASE)
      .replace('{projectId}', this.projectId);
    
    this.http.get<any[]>(requirementsUrl).subscribe({
      next: (requirementsRes: any) => {
        let requirementsList: any[] = [];
        
        if (Array.isArray(requirementsRes)) {
          requirementsList = requirementsRes;
        } else if (requirementsRes && typeof requirementsRes === 'object') {
          requirementsList = requirementsRes.data || requirementsRes.result || [];
        }
        
        if (requirementsList.length > 0) {
          this.requirements = requirementsList[0];
          
          if (this.requirements.roleExperienceMap && typeof this.requirements.roleExperienceMap === 'string') {
            try {
              this.requirements.roleExperienceMap = JSON.parse(this.requirements.roleExperienceMap);
            } catch {
              this.requirements.roleExperienceMap = [];
            }
          } else if (!this.requirements.roleExperienceMap) {
            this.requirements.roleExperienceMap = [];
          }
          
          this.initializeRoleAllocations();
        } else {
          this.requirements = null;
        }
        
        this.checkAllDataLoaded();
      },
      error: () => {
        this.requirements = null;
        this.checkAllDataLoaded();
        Swal.fire({
          icon: 'warning',
          title: 'Requirements Not Found',
          text: 'Could not load project requirements. Please define requirements first.',
          confirmButtonColor: '#5b0f14'
        }).then(() => {
          this.goBack();
        });
      }
    });
  }

  initializeRoleAllocations(): void {
    if (!this.requirements?.roleExperienceMap || !Array.isArray(this.requirements.roleExperienceMap)) {
      this.roleAllocations = [];
      return;
    }

    this.roleAllocations = this.requirements.roleExperienceMap.map((roleReq: any) => {
      const roleName = roleReq.roleName;
      const requiredCount = roleReq.requiredCount || roleReq.count || 1;
      
      let allocatedEmployees: any[] = [];
      let availablePositions = requiredCount;
      
      if (this.editMode && this.existingAllocations.length > 0) {
        allocatedEmployees = this.existingAllocations
          .filter((alloc: any) => alloc.roleInProject === roleName)
          .map((alloc: any) => {
            return {
              id: alloc.id,
              employeeId: alloc.employeeId,
              employeeCode: alloc.employeeCode,
              employeeName: alloc.employeeName,
              department: alloc.department,
              allocationStartDate: alloc.startDate,
              roleInProject: alloc.roleInProject,
              allocationPercentage: alloc.allocationPercentage || 100,
              startDate: alloc.startDate,
              notes: alloc.notes,
              allocatedDate: alloc.allocatedDate,
              status: alloc.status || 'Active'
            };
          });
        
        availablePositions = Math.max(0, requiredCount - allocatedEmployees.length);
      }

      return {
        role: roleReq.role,
        roleName: roleName,
        requiredCount: requiredCount,
        minExperience: roleReq.minExperience || 0,
        qualification: roleReq.qualification || 'Any',
        requiredSkills: roleReq.requiredSkills || '',
        allocatedEmployees: allocatedEmployees,
        availablePositions: availablePositions,
        originalRequiredCount: requiredCount
      };
    });
  }

  loadEmployees(): void {
    const employeesUrl = this.config.apiEndpoints?.employees?.replace('{{API_BASE}}', environment.API_BASE) || 
                        `${environment.API_BASE}/employees`;
    
    this.http.get<any[]>(employeesUrl).subscribe({
      next: (employeesRes: any) => {
        let employeeList: any[] = [];
        
        if (Array.isArray(employeesRes)) {
          employeeList = employeesRes;
        } else if (employeesRes && typeof employeesRes === 'object') {
          employeeList = employeesRes.data || employeesRes.result || [];
        }
        
        this.employees = employeeList.map((emp: any) => ({
          ...emp,
          selected: false,
          allocatedRole: '',
          currentProjects: this.getEmployeeProjectCount(emp.id)
        }));
        
        this.initializeEmployeeSelections();
        
        if (this.editMode && this.existingAllocations.length > 0) {
          this.markExistingEmployeesAsAllocated();
          this.initializeExistingSelections();
        }
        
        this.checkAllDataLoaded();
      },
      error: () => {
        this.employees = [];
        this.checkAllDataLoaded();
        
        Swal.fire({
          icon: 'warning',
          title: 'Employees Not Loaded',
          text: 'Could not load employee list.',
          confirmButtonColor: '#5b0f14'
        });
      }
    });
  }

  private initializeEmployeeSelections(): void {
    this.employees.forEach(employee => {
      if (!this.employeeRoleSelections[employee.id]) {
        this.employeeRoleSelections[employee.id] = [];
      }
    });
  }

  private initializeExistingSelections(): void {
    this.existingAllocations.forEach(alloc => {
      if (this.employeeRoleSelections[alloc.employeeId]) {
        if (!this.employeeRoleSelections[alloc.employeeId].includes(alloc.roleInProject)) {
          this.employeeRoleSelections[alloc.employeeId].push(alloc.roleInProject);
        }
      }
    });
  }

  private markExistingEmployeesAsAllocated(): void {
    this.existingAllocations.forEach(alloc => {
      const employee = this.employees.find(emp => emp.id === alloc.employeeId);
      if (employee) {
        employee.selected = true;
      }
    });
  }

  getEmployeeProjectCount(employeeId: string): number {
    return 0;
  }

  private checkAllDataLoaded(): void {
    const projectLoaded = this.project !== undefined;
    const requirementsLoaded = this.requirements !== undefined;
    const employeesLoaded = this.employees !== undefined;
    
    if (projectLoaded && requirementsLoaded && employeesLoaded) {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  getAvailableRolesForEmployee(employee: any): any[] {
    if (!this.roleAllocations || this.roleAllocations.length === 0) {
      return [];
    }
    
    return this.roleAllocations
      .filter(role => role.availablePositions > 0)
      .map(role => {
        const employeeExperience = parseInt(employee.experienceYears || '0');
        const meetsExperience = employeeExperience >= role.minExperience;
        
        const meetsQualification = !role.qualification || 
          role.qualification === 'Any' || 
          employee.education === role.qualification;
        
        const isAlreadyAllocated = role.allocatedEmployees.some((emp: any) => emp.id === employee.id);
        const isSelected = this.employeeRoleSelections[employee.id]?.includes(role.roleName) || false;
        
        const shouldBeDisabled = (!meetsExperience || !meetsQualification) && !isSelected;
        
        return {
          value: role.roleName,
          label: `${role.roleName} (${role.availablePositions} left)`,
          disabled: shouldBeDisabled
        };
      });
  }

  onEmployeeRoleSelection(employeeId: string, selectedRoles: string[]): void {
    const previousSelections = this.employeeRoleSelections[employeeId] || [];
    this.employeeRoleSelections[employeeId] = selectedRoles || [];
    
    const addedRoles = selectedRoles.filter(role => !previousSelections.includes(role));
    const removedRoles = previousSelections.filter(role => !selectedRoles.includes(role));
    
    addedRoles.forEach(roleName => {
      this.addEmployeeToRole(employeeId, roleName);
    });
    
    removedRoles.forEach(roleName => {
      this.removeEmployeeFromRole(employeeId, roleName);
    });
    
    this.cdr.detectChanges();
  }

  private addEmployeeToRole(employeeId: string, roleName: string): void {
    const employee = this.employees.find(emp => emp.id === employeeId);
    const roleAllocation = this.roleAllocations.find(r => r.roleName === roleName);
    
    if (!employee || !roleAllocation) return;
    
    if (roleAllocation.availablePositions <= 0) {
      Swal.fire('Warning', `No available positions for ${roleName}`, 'warning');
      return;
    }
    
    if (roleAllocation.allocatedEmployees.some((emp: any) => emp.id === employeeId)) {
      return;
    }
    
    const employeeExperience = parseInt(employee.experienceYears || '0');
    if (employeeExperience < roleAllocation.minExperience) {
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Experience',
        text: `${roleName} requires minimum ${roleAllocation.minExperience} years experience`,
        confirmButtonColor: '#5b0f14'
      });
      
      const index = this.employeeRoleSelections[employeeId]?.indexOf(roleName);
      if (index > -1) {
        this.employeeRoleSelections[employeeId].splice(index, 1);
      }
      return;
    }
    
    roleAllocation.allocatedEmployees.push({
      ...employee,
      allocationStartDate: this.allocationForm.startDate,
      roleInProject: roleName,
      allocationPercentage: 100
    });
    
    roleAllocation.availablePositions--;
    employee.selected = true;
  }

  private removeEmployeeFromRole(employeeId: string, roleName: string): void {
    const roleAllocation = this.roleAllocations.find(r => r.roleName === roleName);
    
    if (!roleAllocation) return;
    
    const index = roleAllocation.allocatedEmployees.findIndex((emp: any) => emp.id === employeeId);
    if (index > -1) {
      roleAllocation.allocatedEmployees.splice(index, 1);
      roleAllocation.availablePositions++;
      
      const employee = this.employees.find(emp => emp.id === employeeId);
      if (employee) {
        const hasOtherAllocations = this.roleAllocations.some(role => 
          role.allocatedEmployees.some((emp: any) => emp.id === employeeId)
        );
        
        if (!hasOtherAllocations) {
          employee.selected = false;
        }
      }
    }
  }

  removeAllocation(roleName: string, employeeId: string): void {
    const roleAllocation = this.roleAllocations.find(r => r.roleName === roleName);
    
    if (!roleAllocation) return;
    
    const index = roleAllocation.allocatedEmployees.findIndex((emp: any) => emp.id === employeeId);
    if (index > -1) {
      roleAllocation.allocatedEmployees.splice(index, 1);
      roleAllocation.availablePositions++;
      
      const employee = this.employees.find(emp => emp.id === employeeId);
      if (employee) {
        const hasOtherAllocations = this.roleAllocations.some(role => 
          role.allocatedEmployees.some((emp: any) => emp.id === employeeId)
        );
        
        if (!hasOtherAllocations) {
          employee.selected = false;
        }
      }
      
      if (this.employeeRoleSelections[employeeId]) {
        const roleIndex = this.employeeRoleSelections[employeeId].indexOf(roleName);
        if (roleIndex > -1) {
          this.employeeRoleSelections[employeeId].splice(roleIndex, 1);
        }
      }
      
      this.cdr.detectChanges();
    }
  }

  getRoles(): any[] {
    if (!this.roleAllocations || this.roleAllocations.length === 0) {
      return [];
    }
    
    const roles = this.roleAllocations.map(role => ({
      value: role.roleName,
      label: `${role.roleName} (${role.availablePositions} available)`
    }));
    
    return [{ value: 'All Roles', label: 'All Roles' }, ...roles];
  }

  getSearchFilterConfig(): any {
    if (this.config?.searchFilter) {
      const jobTitles = [...new Set(this.employees
        .filter(emp => emp.jobTitle)
        .map(emp => emp.jobTitle))];
      
      const config = { ...this.config.searchFilter };
      
      const jobTitleFilter = config.filters.find((f: any) => f.key === 'jobTitle');
      if (jobTitleFilter) {
        jobTitleFilter.options = ['All Job Titles', ...jobTitles];
      }
      
      return config;
    }
    
    return {
      placeholder: "Search employees...",
      keys: ["employeeName", "employeeCode", "department", "jobTitle"],
      filters: [
        {
          key: "department",
          label: "All Departments",
          options: ["All Departments", "IT", "HR", "Finance", "Sales", "Marketing", "Development"]
        },
        {
          key: "jobTitle",
          label: "All Job Titles",
          options: ["All Job Titles"]
        }
      ]
    };
  }

  onEmployeeFiltered(filteredEmployees: any[]): void {
    this.filteredEmployees = filteredEmployees;
  }

  getDisplayedEmployees(): any[] {
    const employeesToShow = this.filteredEmployees.length > 0 
      ? this.filteredEmployees 
      : this.employees;
    
    return employeesToShow.filter((employee: any) => {
      if (this.selectedRole && this.selectedRole !== 'All Roles') {
        const roleAllocation = this.roleAllocations.find(r => r.roleName === this.selectedRole);
        if (roleAllocation) {
          const employeeExperience = parseInt(employee.experienceYears || '0');
          if (employeeExperience < roleAllocation.minExperience) {
            return false;
          }
          
          if (roleAllocation.qualification && 
              employee.education !== roleAllocation.qualification) {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  saveAllocations(): void {
    const unfilledRoles = this.roleAllocations.filter(role => role.availablePositions > 0);
    
    if (unfilledRoles.length > 0) {
      const unfilledNames = unfilledRoles.map(role => 
        `${role.roleName} (${role.availablePositions} remaining)`
      ).join(', ');
      
      Swal.fire({
        title: 'Unfilled Positions',
        html: `The following roles still have unfilled positions:<br><br>
               <strong>${unfilledNames}</strong><br><br>
               Do you want to save anyway?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#5b0f14',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Save',
        cancelButtonText: 'No, Continue'
      }).then((result) => {
        if (result.isConfirmed) {
          this.saveToApi();
        }
      });
    } else {
      this.saveToApi();
    }
  }

  private saveToApi(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    const allocationsUrl = this.config.apiEndpoints?.allocations?.replace('{{API_BASE}}', environment.API_BASE) || 
                          `${environment.API_BASE}/project-allocations`;
    
    const allAllocations: any[] = [];
    
    this.roleAllocations.forEach(role => {
      role.allocatedEmployees.forEach((employee: any) => {
        allAllocations.push({
          projectId: this.projectId,
          projectName: this.project?.projectName,
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          department: employee.department,
          roleInProject: role.roleName,
          allocationPercentage: 100,
          startDate: this.allocationForm.startDate,
          notes: `Required: ${role.minExperience}+ years, ${role.qualification}`,
          allocatedDate: new Date().toISOString(),
          status: 'Active'
        });
      });
    });
    
    if (allAllocations.length === 0) {
      Swal.fire('Warning', 'No allocations to save', 'warning');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    if (this.editMode && this.existingAllocations.length > 0) {
      this.handleEditAllocationsSave(allAllocations, allocationsUrl);
    } else {
      this.saveBatchAllocations(allAllocations, allocationsUrl);
    }
  }

  private handleEditAllocationsSave(newAllocations: any[], url: string): void {
    const allocationsToDelete = this.existingAllocations.filter(existing => {
      return !newAllocations.some(newAlloc => 
        newAlloc.employeeId === existing.employeeId && 
        newAlloc.roleInProject === existing.roleInProject
      );
    });
    
    const allocationsToAdd = newAllocations.filter(newAlloc => {
      return !this.existingAllocations.some(existing => 
        existing.employeeId === newAlloc.employeeId && 
        existing.roleInProject === newAlloc.roleInProject
      );
    });
    
    if (allocationsToDelete.length > 0) {
      Swal.fire({
        title: 'Remove Allocations?',
        html: `
          <div class="text-left">
            <p>The following allocations will be removed:</p>
            <div class="mt-2 p-2 bg-red-50 border border-red-100 rounded max-h-32 overflow-y-auto">
              ${allocationsToDelete.map(alloc => 
                `<div class="text-sm text-red-700">${alloc.employeeName} - ${alloc.roleInProject}</div>`
              ).join('')}
            </div>
            <p class="text-sm text-gray-500 mt-2">Total: ${allocationsToDelete.length} allocation(s)</p>
            <p class="text-sm text-gray-500">New allocations: ${allocationsToAdd.length} allocation(s)</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Save Changes',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#5b0f14',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.processEditAllocations(allocationsToAdd, allocationsToDelete, url);
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.processEditAllocations(allocationsToAdd, allocationsToDelete, url);
    }
  }

  private async processEditAllocations(
    allocationsToAdd: any[], 
    allocationsToDelete: any[], 
    url: string
  ): Promise<void> {
    try {
      for (const alloc of allocationsToDelete) {
        if (alloc.id) {
          await this.http.delete(`${url}/${alloc.id}`).toPromise();
        }
      }
      
      for (const alloc of allocationsToAdd) {
        await this.http.post(url, alloc).toPromise();
      }
      
      this.isLoading = false;
      this.cdr.detectChanges();
      
      const totalChanges = allocationsToAdd.length + allocationsToDelete.length;
      Swal.fire({
        icon: 'success',
        title: 'Changes Saved!',
        html: `
          <div class="text-left">
            <p><strong>Allocations updated successfully!</strong></p>
            <p class="mt-2">✅ Added: ${allocationsToAdd.length} allocation(s)</p>
            <p>🗑️ Removed: ${allocationsToDelete.length} allocation(s)</p>
            <p class="text-sm text-gray-500 mt-3">Total changes: ${totalChanges}</p>
          </div>
        `,
        confirmButtonColor: '#5b0f14'
      }).then(() => {
        this.router.navigate(['/projects', this.projectId]);
      });
      
    } catch {
      this.isLoading = false;
      this.cdr.detectChanges();
      
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save allocation changes. Please try again.',
        confirmButtonColor: '#5b0f14'
      });
    }
  }

  private saveBatchAllocations(allocations: any[], url: string): void {
    if (allocations.length > 5) {
      this.saveSequentialAllocations(allocations, url);
      return;
    }
    
    this.http.post(url, allocations).subscribe({
      next: (response: any) => {
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          const savedCount = Object.keys(response).filter(key => !isNaN(Number(key))).length;
          
          if (savedCount > 0) {
            this.isLoading = false;
            this.cdr.detectChanges();
            
            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: `Allocated ${savedCount} employee(s) successfully`,
              confirmButtonColor: '#5b0f14'
            }).then(() => {
              this.router.navigate(['/projects', this.projectId]);
            });
          } else {
            this.saveSequentialAllocations(allocations, url);
          }
        } else if (Array.isArray(response)) {
          this.isLoading = false;
          this.cdr.detectChanges();
          
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: `Allocated ${response.length} employee(s) successfully`,
            confirmButtonColor: '#5b0f14'
          }).then(() => {
            this.router.navigate(['/projects', this.projectId]);
          });
        } else {
          this.saveSequentialAllocations(allocations, url);
        }
      },
      error: () => {
        this.saveSequentialAllocations(allocations, url);
      }
    });
  }

  private saveSequentialAllocations(allocations: any[], url: string): void {
    let savedCount = 0;
    let failedCount = 0;
    const failedAllocations: any[] = [];
    
    const saveNext = async (index: number) => {
      if (index >= allocations.length) {
        this.isLoading = false;
        this.cdr.detectChanges();
        
        this.showSaveResults(savedCount, failedCount, allocations.length, failedAllocations);
        return;
      }
      
      const allocation = allocations[index];
      
      try {
        await this.http.post(url, allocation).toPromise();
        savedCount++;
      } catch {
        failedCount++;
        failedAllocations.push(allocation);
      }
      
      setTimeout(() => saveNext(index + 1), 300);
    };
    
    saveNext(0);
  }

  private showSaveResults(saved: number, failed: number, total: number, failedAllocations: any[]): void {
    if (failed === 0) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Allocated ${saved} employee(s) successfully`,
        confirmButtonColor: '#5b0f14'
      }).then(() => {
        this.router.navigate(['/projects', this.projectId]);
      });
    } else {
      const failedNames = [...new Set(failedAllocations.map(f => f.employeeName))].join(', ');
      
      Swal.fire({
        icon: saved > 0 ? 'warning' : 'error',
        title: saved > 0 ? 'Partial Success' : 'Save Failed',
        html: `
          <div class="text-left">
            <p>✅ <strong>${saved}/${total}</strong> allocations saved successfully</p>
            <p class="mt-2">❌ <strong>${failed}/${total}</strong> allocations failed</p>
            ${failed > 0 ? `
              <div class="mt-3 p-2 bg-red-50 rounded border border-red-100">
                <p class="text-sm font-medium text-red-800">Failed allocations:</p>
                <p class="text-xs text-red-600 mt-1">${failedNames}</p>
                <p class="text-xs text-gray-500 mt-2">
                  Common reasons:<br>
                  • Employee already allocated to same role<br>
                  • Network timeout<br>
                  • Server rate limiting
                </p>
              </div>
            ` : ''}
            ${saved > 0 ? `
              <p class="text-sm text-green-600 mt-3">
                Note: Successfully saved allocations are already in the database.
              </p>
            ` : ''}
          </div>
        `,
        confirmButtonColor: '#5b0f14',
        confirmButtonText: 'Continue'
      }).then(() => {
        this.router.navigate(['/projects', this.projectId]);
      });
    }
  }

  cancel(): void {
    Swal.fire({
      title: 'Cancel Allocation?',
      text: 'All unsaved allocation data will be lost',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5b0f14',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No, Keep Editing'
    }).then((result) => {
      if (result.isConfirmed) {
        this.goBack();
      }
    });
  }

  getAction(actionId: string): any {
    return this.config.actions?.find((a: any) => a.id === actionId) || {};
  }

  getPageTitle(): string {
    return this.editMode ? 'Edit Resource Allocations' : 'Allocate Resources';
  }

  getSaveButtonText(): string {
    return this.editMode ? 'Update Allocations' : 'Save Allocations';
  }
}