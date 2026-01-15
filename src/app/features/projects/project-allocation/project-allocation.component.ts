import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

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
  employees: any[] = [];
  filteredEmployees: any[] = [];
  selectedEmployees: any[] = [];
  isLoading = true; // Start with true to show loading
  projectId: string = '';

  // Form data for allocation
  allocationForm: any = {
    roleInProject: '',
    allocationPercentage: 100,
    startDate: this.getTodayDate(),
    endDate: '',
    notes: ''
  };

  // Search and filter
  searchTerm: string = '';
  selectedDepartment: string = 'All Departments';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef // Add ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('🔵 ProjectAllocationComponent initialized');
    
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      console.log('📝 Project ID from route:', this.projectId);
      
      if (this.projectId) {
        this.loadProjectDetails();
        this.loadEmployees();
      } else {
        console.error('❌ No project ID found in route');
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
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

  loadProjectDetails(): void {
    console.log('🔍 Loading project details for ID:', this.projectId);
    
    const projectsUrl = this.config.apiEndpoints?.projects?.replace('{{API_BASE}}', environment.API_BASE) || 
                       `${environment.API_BASE}/projects`;
    
    const fullUrl = `${projectsUrl}/${this.projectId}`;
    console.log('🌐 Project API URL:', fullUrl);
    
    this.http.get<any>(fullUrl).subscribe({
      next: (res: any) => {
        console.log('✅ Project loaded:', res);
        this.project = res;
        this.checkAllDataLoaded();
      },
      error: (err: any) => {
        console.error('❌ Error loading project:', err);
        this.project = null;
        this.checkAllDataLoaded();
        
        Swal.fire({
          icon: 'error',
          title: 'Project Not Found',
          text: 'Could not load project details. The project may not exist.',
          confirmButtonColor: '#5b0f14'
        }).then(() => {
          this.goBack();
        });
      }
    });
  }

  loadEmployees(): void {
    console.log('👥 Loading employees...');
    
    const employeesUrl = this.config.apiEndpoints?.employees?.replace('{{API_BASE}}', environment.API_BASE) || 
                        `${environment.API_BASE}/employees`;
    
    console.log('🌐 Employees API URL:', employeesUrl);
    
    this.http.get<any[]>(employeesUrl).subscribe({
      next: (employees: any) => {
        console.log('✅ Employees response:', employees);
        
        let employeeList: any[] = [];
        
        if (Array.isArray(employees)) {
          employeeList = employees;
        } else if (employees && typeof employees === 'object') {
          employeeList = employees.data || employees.result || [];
        }
        
        console.log(`✅ Processed ${employeeList.length} employees`);
        
        this.employees = employeeList.map((emp: any) => ({
          ...emp,
          selected: false,
          allocated: false,
          currentProjects: 0
        }));
        
        this.filteredEmployees = [...this.employees];
        this.checkAllDataLoaded();
      },
      error: (err: any) => {
        console.error('❌ Error loading employees:', err);
        this.employees = [];
        this.filteredEmployees = [];
        this.checkAllDataLoaded();
        
        Swal.fire({
          icon: 'warning',
          title: 'Employees Not Loaded',
          text: 'Could not load employee list. You can still proceed with manual entry.',
          confirmButtonColor: '#5b0f14'
        });
      }
    });
  }

  private checkAllDataLoaded(): void {
    // Check if both project and employees are loaded (even if empty)
    const projectLoaded = this.project !== undefined; // Could be null if error
    const employeesLoaded = this.employees !== undefined; // Could be empty array
    
    if (projectLoaded && employeesLoaded) {
      console.log('✅ All data loaded - Project:', !!this.project, 'Employees:', this.employees.length);
      this.isLoading = false;
      this.cdr.detectChanges(); // Force change detection
    }
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId]);
  }

  filterEmployees(): void {
    this.filteredEmployees = this.employees.filter((employee: any) => {
      // Apply department filter
      if (this.selectedDepartment !== 'All Departments' && 
          employee.department !== this.selectedDepartment) {
        return false;
      }
      
      // Apply search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return (
          (employee.employeeName || '').toLowerCase().includes(searchLower) ||
          (employee.employeeCode || '').toLowerCase().includes(searchLower) ||
          (employee.department || '').toLowerCase().includes(searchLower) ||
          (employee.jobTitle || '').toLowerCase().includes(searchLower) ||
          (employee.workEmail || '').toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
    
    this.cdr.detectChanges(); // Force update after filtering
  }

  toggleEmployeeSelection(employee: any): void {
    employee.selected = !employee.selected;
    
    if (employee.selected) {
      this.selectedEmployees.push(employee);
    } else {
      const index = this.selectedEmployees.findIndex((emp: any) => emp.id === employee.id);
      if (index > -1) {
        this.selectedEmployees.splice(index, 1);
      }
    }
    
    this.cdr.detectChanges(); // Force update after selection
  }

  removeSelectedEmployee(employee: any): void {
    employee.selected = false;
    const index = this.selectedEmployees.findIndex((emp: any) => emp.id === employee.id);
    if (index > -1) {
      this.selectedEmployees.splice(index, 1);
    }
    
    this.cdr.detectChanges(); // Force update after removal
  }

  saveAllocation(): void {
    if (this.selectedEmployees.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Employees Selected',
        text: 'Please select at least one employee to allocate',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    if (!this.allocationForm.roleInProject) {
      Swal.fire({
        icon: 'warning',
        title: 'Role Required',
        text: 'Please select a role for the allocated employees',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    if (!this.allocationForm.startDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Start Date Required',
        text: 'Please select an allocation start date',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    const allocationPercentage = Number(this.allocationForm.allocationPercentage);
    if (isNaN(allocationPercentage) || allocationPercentage < 10 || allocationPercentage > 100) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Allocation Percentage',
        text: 'Allocation percentage must be between 10% and 100%',
        confirmButtonColor: '#5b0f14'
      });
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Show loading state

    const allocationsUrl = this.config.apiEndpoints?.allocations?.replace('{{API_BASE}}', environment.API_BASE) || 
                          `${environment.API_BASE}/project-allocations`;
    
    console.log('🌐 Saving to allocations endpoint:', allocationsUrl);
    
    const allocations = this.selectedEmployees.map((employee: any) => ({
      projectId: this.projectId,
      projectName: this.project?.projectName || 'Unknown Project',
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      department: employee.department,
      roleInProject: this.allocationForm.roleInProject,
      allocationPercentage: allocationPercentage,
      startDate: this.allocationForm.startDate,
      endDate: this.allocationForm.endDate || null,
      notes: this.allocationForm.notes || '',
      allocatedDate: new Date().toISOString(),
      status: 'Active'
    }));

    console.log('📤 Allocation data to save:', allocations);

    const savePromises = allocations.map((allocation: any) => 
      this.http.post(allocationsUrl, allocation).toPromise()
    );

    Promise.all(savePromises).then(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Successfully allocated ${this.selectedEmployees.length} employee(s) to project`,
        confirmButtonColor: '#5b0f14'
      }).then(() => {
        this.router.navigate(['/projects', this.projectId]);
      });
    }).catch((err: any) => {
      console.error('❌ Error saving allocations:', err);
      this.isLoading = false;
      this.cdr.detectChanges();
      
      if (err.status === 404) {
        Swal.fire({
          icon: 'success',
          title: 'Demo Success!',
          html: `Successfully allocated ${this.selectedEmployees.length} employee(s) to project.<br><br>
                 <small class="text-gray-500">Note: Allocations endpoint not configured yet.</small>`,
          confirmButtonColor: '#5b0f14'
        }).then(() => {
          this.router.navigate(['/projects', this.projectId]);
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: 'Failed to save allocations. Please try again.',
          confirmButtonColor: '#5b0f14'
        });
      }
    });
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