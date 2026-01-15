import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environment';
import allocationConfig from './project-allocation.config.json';

import { PageHeaderComponent } from '../../../atoms/page-header/page-header';
import { InputAtomComponent } from '../../../atoms/input/input';
import { SelectAtomComponent } from '../../../atoms/select/select';
import { DatePickerAtomComponent } from '../../../atoms/date-picker/date-picker';
import { TextAreaAtomComponent } from '../../../atoms/textarea/textarea';
import { ButtonAtomComponent } from '../../../atoms/button/button';
import { SelectOptionsPipe } from '../../../pipes/select-options.pipe';

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
    SelectOptionsPipe
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

  allocationForm: any = {
    startDate: this.getTodayDate()
  };

  searchTerm: string = '';
  selectedDepartment: string = 'All Departments';
  selectedRole: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('🔵 ProjectAllocationComponent initialized');
    
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      console.log('📝 Project ID from route:', this.projectId);
      
      if (this.projectId) {
        this.loadProjectAndRequirements();
        this.loadEmployees();
      } else {
        console.error('❌ No project ID found in route');
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
    console.log('🔍 Loading project and requirements for ID:', this.projectId);
    
    const projectsUrl = this.config.apiEndpoints?.projects?.replace('{{API_BASE}}', environment.API_BASE) || 
                       `${environment.API_BASE}/projects`;
    
    const projectUrl = `${projectsUrl}/${this.projectId}`;
    
    this.http.get<any>(projectUrl).subscribe({
      next: (projectRes: any) => {
        console.log('✅ Project loaded:', projectRes);
        this.project = projectRes;
        this.loadRequirements();
      },
      error: (err: any) => {
        console.error('❌ Error loading project:', err);
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
    
    console.log('🌐 Requirements API URL:', requirementsUrl);
    
    this.http.get<any[]>(requirementsUrl).subscribe({
      next: (requirementsRes: any) => {
        console.log('✅ RAW Requirements response:', requirementsRes);
        
        let requirementsList: any[] = [];
        
        if (Array.isArray(requirementsRes)) {
          requirementsList = requirementsRes;
        } else if (requirementsRes && typeof requirementsRes === 'object') {
          requirementsList = requirementsRes.data || requirementsRes.result || [];
        }
        
        console.log('📋 Requirements list:', requirementsList);
        
        if (requirementsList.length > 0) {
          this.requirements = requirementsList[0];
          console.log('✅ Requirements loaded:', this.requirements);
          
          if (this.requirements.roleExperienceMap && typeof this.requirements.roleExperienceMap === 'string') {
            try {
              this.requirements.roleExperienceMap = JSON.parse(this.requirements.roleExperienceMap);
              console.log('✅ Parsed roleExperienceMap:', this.requirements.roleExperienceMap);
            } catch (e) {
              console.error('❌ Failed to parse roleExperienceMap:', e);
              this.requirements.roleExperienceMap = [];
            }
          } else if (!this.requirements.roleExperienceMap) {
            console.warn('⚠️ No roleExperienceMap found');
            this.requirements.roleExperienceMap = [];
          }
          
          this.initializeRoleAllocations();
        } else {
          console.warn('⚠️ No requirements found for project');
          this.requirements = null;
        }
        
        this.checkAllDataLoaded();
      },
      error: (err: any) => {
        console.error('❌ Error loading requirements:', err);
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
      console.warn('⚠️ No valid roleExperienceMap in requirements:', this.requirements?.roleExperienceMap);
      this.roleAllocations = [];
      return;
    }

    console.log('🎯 Initializing role allocations from:', this.requirements.roleExperienceMap);

    this.roleAllocations = this.requirements.roleExperienceMap.map((roleReq: any) => ({
      role: roleReq.role,
      roleName: roleReq.roleName,
      requiredCount: roleReq.requiredCount || roleReq.count || 1,
      minExperience: roleReq.minExperience || 0,
      qualification: roleReq.qualification || 'Any',
      requiredSkills: roleReq.requiredSkills || '',
      allocatedEmployees: [],
      availablePositions: roleReq.requiredCount || roleReq.count || 1
    }));

    console.log('✅ Role allocations initialized:', this.roleAllocations);
  }

  loadEmployees(): void {
    console.log('👥 Loading employees...');
    
    const employeesUrl = this.config.apiEndpoints?.employees?.replace('{{API_BASE}}', environment.API_BASE) || 
                        `${environment.API_BASE}/employees`;
    
    this.http.get<any[]>(employeesUrl).subscribe({
      next: (employeesRes: any) => {
        console.log('✅ Employees response received');
        
        let employeeList: any[] = [];
        
        if (Array.isArray(employeesRes)) {
          employeeList = employeesRes;
        } else if (employeesRes && typeof employeesRes === 'object') {
          employeeList = employeesRes.data || employeesRes.result || [];
        }
        
        console.log(`✅ Processed ${employeeList.length} employees`);
        
        this.employees = employeeList.map((emp: any) => ({
          ...emp,
          selected: false,
          allocatedRole: '',
          currentProjects: this.getEmployeeProjectCount(emp.id)
        }));
        
        this.checkAllDataLoaded();
      },
      error: (err: any) => {
        console.error('❌ Error loading employees:', err);
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

  getEmployeeProjectCount(employeeId: string): number {
    return 0;
  }

  private checkAllDataLoaded(): void {
    const projectLoaded = this.project !== undefined;
    const requirementsLoaded = this.requirements !== undefined;
    const employeesLoaded = this.employees !== undefined;
    
    if (projectLoaded && requirementsLoaded && employeesLoaded) {
      console.log('✅ All data loaded');
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  filterEmployees(): void {}

  getFilteredEmployees(): any[] {
    return this.employees.filter((employee: any) => {
      if (this.selectedDepartment !== 'All Departments' && 
          employee.department !== this.selectedDepartment) {
        return false;
      }
      
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return (
          (employee.employeeName || '').toLowerCase().includes(searchLower) ||
          (employee.employeeCode || '').toLowerCase().includes(searchLower) ||
          (employee.department || '').toLowerCase().includes(searchLower) ||
          (employee.jobTitle || '').toLowerCase().includes(searchLower)
        );
      }
      
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

  allocateEmployeeToRole(employee: any, roleName: string): void {
    const roleAllocation = this.roleAllocations.find(r => r.roleName === roleName);
    
    if (!roleAllocation) {
      Swal.fire('Error', 'Role not found', 'error');
      return;
    }
    
    if (roleAllocation.availablePositions <= 0) {
      Swal.fire('Warning', 'No available positions for this role', 'warning');
      return;
    }
    
    if (roleAllocation.allocatedEmployees.some((emp: any) => emp.id === employee.id)) {
      Swal.fire('Info', 'Employee already allocated to this role', 'info');
      return;
    }
    
    const employeeExperience = parseInt(employee.experienceYears || '0');
    if (employeeExperience < roleAllocation.minExperience) {
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Experience',
        text: `This role requires minimum ${roleAllocation.minExperience} years experience`,
        confirmButtonColor: '#5b0f14'
      });
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
    employee.allocatedRole = roleName;
    
    console.log(`✅ Allocated ${employee.employeeName} to ${roleName}`);
    this.cdr.detectChanges();
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
        employee.selected = false;
        employee.allocatedRole = '';
      }
      
      this.cdr.detectChanges();
    }
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
    
    console.log('📤 Saving allocations:', allAllocations);
    
    this.checkExistingAllocations(allAllocations).then(filteredAllocations => {
      if (filteredAllocations.length === 0) {
        Swal.fire('Info', 'All allocations already exist in the system', 'info');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/projects', this.projectId]);
        return;
      }
      
      this.saveBatchAllocations(filteredAllocations, allocationsUrl);
    }).catch(error => {
      console.error('❌ Error checking existing allocations:', error);
      this.saveBatchAllocations(allAllocations, allocationsUrl);
    });
  }

  private checkExistingAllocations(allocations: any[]): Promise<any[]> {
    const checkUrl = `${environment.API_BASE}/project-allocations?projectId=${this.projectId}`;
    
    return this.http.get<any[]>(checkUrl).toPromise()
      .then(existing => {
        console.log('🔍 Existing allocations:', existing);
        
        if (!existing || existing.length === 0) {
          return allocations;
        }
        
        const newAllocations = allocations.filter(newAlloc => {
          const alreadyExists = existing.some(existingAlloc => 
            existingAlloc.employeeId === newAlloc.employeeId && 
            existingAlloc.roleInProject === newAlloc.roleInProject
          );
          
          if (alreadyExists) {
            console.warn(`⚠️ Skipping duplicate: ${newAlloc.employeeName} as ${newAlloc.roleInProject}`);
          }
          
          return !alreadyExists;
        });
        
        console.log(`📝 After deduplication: ${newAllocations.length}/${allocations.length} allocations`);
        return newAllocations;
      })
      .catch(error => {
        console.warn('⚠️ Could not check existing allocations:', error);
        return allocations;
      });
  }

  private saveBatchAllocations(allocations: any[], url: string): void {
  if (allocations.length > 5) {
    console.log('🔄 Large batch detected, using sequential saves to avoid json-server issues');
    this.saveSequentialAllocations(allocations, url);
    return;
  }
  
  this.http.post(url, allocations).subscribe({
    next: (response: any) => {
      console.log('✅ Batch save response:', response);
      
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        const savedCount = Object.keys(response).filter(key => !isNaN(Number(key))).length;
        
        if (savedCount > 0) {
          console.log(`✅ Saved ${savedCount}/${allocations.length} allocations`);
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
    error: (err: any) => {
      console.error('❌ Batch save error:', err);
      this.saveSequentialAllocations(allocations, url);
    }
  });
}

private saveSequentialAllocations(allocations: any[], url: string): void {
  console.log('🔄 Starting sequential saves for', allocations.length, 'allocations');
  
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
      const response = await this.http.post(url, allocation).toPromise();
      savedCount++;
      console.log(`✅ [${index + 1}/${allocations.length}] Saved ${allocation.employeeName} as ${allocation.roleInProject}`);
    } catch (error: any) {
      failedCount++;
      failedAllocations.push(allocation);
      console.warn(`❌ [${index + 1}/${allocations.length}] Failed to save ${allocation.employeeName}:`, error?.message || error);
    }
    
    setTimeout(() => saveNext(index + 1), 300);
  };
  
  saveNext(0);
}

  private saveIndividualAllocationsWithDelay(allocations: any[], url: string): void {
    let savedCount = 0;
    let failedCount = 0;
    const failedAllocations: any[] = [];
    
    const processAllocations = async () => {
      for (let i = 0; i < allocations.length; i++) {
        const allocation = allocations[i];
        
        try {
          await this.http.post(url, allocation).toPromise();
          savedCount++;
          console.log(`✅ Saved ${allocation.employeeName} as ${allocation.roleInProject}`);
        } catch (error: any) {
          failedCount++;
          failedAllocations.push(allocation);
          console.warn(`❌ Failed to save ${allocation.employeeName}:`, error);
        }
        
        if (i < allocations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      this.isLoading = false;
      this.cdr.detectChanges();
      
      this.showSaveResults(savedCount, failedCount, allocations.length, failedAllocations);
    };
    
    processAllocations();
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
}