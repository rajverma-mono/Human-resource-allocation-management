import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { MatIconModule } from '@angular/material/icon';

import formConfigJson from './project-requirements.config.json';

import { PageHeaderComponent } from '../../../atoms/page-header/page-header';
import { InputAtomComponent } from '../../../atoms/input/input';
import { SelectAtomComponent } from '../../../atoms/select/select';
import { DatePickerAtomComponent } from '../../../atoms/date-picker/date-picker';
import { TextAreaAtomComponent } from '../../../atoms/textarea/textarea';
import { ButtonAtomComponent } from '../../../atoms/button/button';
import { SelectOptionsPipe } from '../../../pipes/select-options.pipe';
import { ChipInputAtomComponent } from '../../../atoms/chip-input/chip-input.component';
import { ToggleAtomComponent } from '../../../atoms/toggle/toggle.component';
import { MultiSelectAtomComponent } from '../../../atoms/multi-select/multi-select.component';
import { DynamicTableAtomComponent } from '../../../atoms/dynamic-table/dynamic-table.component';

@Component({
  selector: 'app-project-requirements-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    InputAtomComponent,
    SelectAtomComponent,
    DatePickerAtomComponent,
    TextAreaAtomComponent,
    ButtonAtomComponent,
    SelectOptionsPipe,
    ChipInputAtomComponent,
    ToggleAtomComponent,
    MultiSelectAtomComponent,
    DynamicTableAtomComponent,
    MatIconModule
  ],
  templateUrl: './project-requirements-modal.component.html'
})
export class ProjectRequirementsModalComponent implements OnInit {
  @Input() project: any;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  formConfig: any;
  form: any = {};
  isLoading = false;
  selectOptionsMap: Record<string, any[]> = {};
  availableRolesForTable: { value: string; label: string; description?: string }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeFormConfig();
    this.initializeForm();
  }
// Update the calculateTotalCount method:
calculateTotalCount(): void {
  if (!this.form.roleExperienceMap || !Array.isArray(this.form.roleExperienceMap)) {
    return;
  }
  
  let totalCount = 0;
  this.form.roleExperienceMap.forEach((row: any) => {
    // Check if requiredCount field exists
    if (row.requiredCount) {
      totalCount += parseInt(row.requiredCount) || 0;
    }
  });
  
  // Update the requiredHeadcount field
  if (totalCount > 0) {
    this.form['requiredHeadcount'] = totalCount;
  }
}

// Update the updateRoleExperienceData method:
private updateRoleExperienceData() {
  if (!this.form.requiredRoles || this.form.requiredRoles.length === 0) {
    this.form.roleExperienceMap = [];
    return;
  }

  let roleOptions = this.selectOptionsMap['requiredRoles'];
  
  if (!roleOptions || roleOptions.length === 0) {
    const fieldConfig = this.getFieldConfig('requiredRoles');
    roleOptions = fieldConfig?.options || [];
  }
  
  const selectedRoles = roleOptions.filter((role: any) => 
    this.form.requiredRoles.includes(role.value)
  ) || [];

  const existingMap = Array.isArray(this.form.roleExperienceMap) ? this.form.roleExperienceMap : [];
  
  this.form.roleExperienceMap = selectedRoles.map((role: any) => {
    const existing = existingMap.find((item: any) => item.role === role.value);
    return {
      role: role.value,
      roleName: role.label,
      requiredCount: existing?.requiredCount || 1, // Changed from requirements to requiredCount
      minExperience: existing?.minExperience || 0,
      qualification: existing?.qualification || 'B.Tech',
      requiredSkills: existing?.requiredSkills || []
    };
  });

  // Calculate total count after updating
  this.calculateTotalCount();
}

// Update the validateForm method to check requiredCount instead of requirements.count:
private validateForm(): boolean {
  const requiredFields = this.getRequiredFields();
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = this.form[field.id];
    if (!value || 
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)) {
      missingFields.push(field.label);
    }
  }

  // Additional validation for role counts totals
  const totalRequired = this.form['requiredHeadcount'];
  if (totalRequired > 0) {
    const tableData = this.form['roleExperienceMap'] || [];
    let tableTotal = 0;
    
    tableData.forEach((row: any) => {
      // Check for requiredCount instead of requirements.count
      if (row.requiredCount) {
        tableTotal += parseInt(row.requiredCount) || 0;
      }
    });
    
    if (tableTotal !== totalRequired) {
      Swal.fire({
        icon: 'warning',
        title: 'Count Mismatch',
        html: `Total role count (${tableTotal}) doesn't match required headcount (${totalRequired}).<br><br>
               Please adjust the role counts to match the required total.`,
        confirmButtonColor: '#5b0f14'
      });
      return false;
    }
  }

  if (missingFields.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Information',
      html: `The following fields are required:<br><br>
             <strong>${missingFields.join('<br>')}</strong><br><br>
             Please fill them before saving.`,
      confirmButtonColor: '#5b0f14'
    });
    return false;
  }

  return true;
}

// Update the loadExistingRequirements method to handle requiredCount:
private loadExistingRequirements() {
  if (!this.project || !this.formConfig?.apiEndpoints?.getById) return;

  const loadUrl = this.formConfig.apiEndpoints.getById;

  this.http.get<any[]>(loadUrl).subscribe({
    next: (list) => {
      if (!list || list.length === 0) {
        console.log('ℹ️ No existing requirements found');
        return;
      }

      const requirements = list[0];

      this.form = {
        ...this.form,
        ...requirements
      };

      // Parse roleExperienceMap
      if (typeof this.form.roleExperienceMap === 'string') {
        try {
          const parsedMap = JSON.parse(this.form.roleExperienceMap);
          this.form.roleExperienceMap = parsedMap.map((item: any) => {
            // Handle old requirements field if it exists
            if (item.requirements && typeof item.requirements === 'object' && item.requirements.count) {
              // Convert old format to new format
              item.requiredCount = item.requirements.count;
              delete item.requirements;
            } else if (item.requirements && typeof item.requirements === 'string') {
              try {
                const req = JSON.parse(item.requirements);
                if (req.count) {
                  item.requiredCount = req.count;
                }
                delete item.requirements;
              } catch {
                // If parsing fails, keep as is
              }
            }
            
            return {
              ...item,
              roleName: item.roleName || item.role,
              requiredCount: item.requiredCount || 1, // Ensure requiredCount exists
              requiredSkills: item.requiredSkills
                ? (Array.isArray(item.requiredSkills) 
                    ? item.requiredSkills 
                    : item.requiredSkills.split(',').map((s: string) => s.trim()))
                : []
            };
          });
        } catch {
          this.form.roleExperienceMap = [];
        }
      }

      // Calculate total count from existing data
      this.calculateTotalCount();

      // Ensure project identifiers stay intact
      this.form.projectId = this.project?.id || this.project?._id || this.project?.projectId;
      this.form.projectName = this.project?.projectName || this.project?.name || '';
    },
    error: (err) => {
      console.warn('⚠️ Failed to load requirements', err);
    }
  });
}

// Update the save method to handle requiredCount:
async save() {
  try {
    if (!this.validateForm()) return;

    this.isLoading = true;

    Swal.fire({
      title: 'Saving...',
      text: 'Please wait while we save requirements',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // Build payload
    const formData: any = {
      ...this.form,
      projectId: this.project?.id || this.project?._id || this.project?.projectId,
      projectName: this.project?.projectName || this.project?.name || ''
    };

    // Normalize roleExperienceMap for API
    if (Array.isArray(formData.roleExperienceMap)) {
      formData.roleExperienceMap = JSON.stringify(
        formData.roleExperienceMap.map((item: any) => ({
          role: item.role,
          roleName: item.roleName,
          requiredCount: item.requiredCount || 1, // Use requiredCount
          minExperience: item.minExperience,
          qualification: item.qualification,
          requiredSkills: Array.isArray(item.requiredSkills) 
            ? item.requiredSkills.join(',')
            : item.requiredSkills || ''
        }))
      );
    }

    const existingRequirement = this.project?.requirements;

    let request$;

    if (existingRequirement?.id) {
      // ================= UPDATE =================
      const updateUrl = this.formConfig.apiEndpoints.update
        .replace('{{API_BASE}}', 'http://localhost:3000')
        .replace('{id}', existingRequirement.id);

      request$ = this.http.put(updateUrl, {
        ...formData,
        id: existingRequirement.id
      });

    } else {
      // ================= CREATE =================
      const createUrl = this.formConfig.apiEndpoints.create
        .replace('{{API_BASE}}', 'http://localhost:3000');

      request$ = this.http.post(createUrl, formData);
    }

    const response = await request$.toPromise();

    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Requirements saved successfully!',
      confirmButtonColor: '#5b0f14',
      timer: 2000,
      timerProgressBar: true
    }).then(() => {
      this.saved.emit(response);
      this.close();
    });

  } catch (error: any) {
    console.error('❌ Error saving requirements:', error);

    let errorMessage = 'Error saving requirements. Please try again.';
    if (error.status === 400) errorMessage = 'Invalid data.';
    if (error.status === 404) errorMessage = 'API endpoint not found.';
    if (error.status === 500) errorMessage = 'Server error.';

    Swal.fire({
      icon: 'error',
      title: 'Save Failed',
      text: errorMessage,
      confirmButtonColor: '#5b0f14'
    });
  } finally {
    this.isLoading = false;
  }
}
  private initializeFormConfig() {
    this.formConfig = JSON.parse(JSON.stringify(formConfigJson));
    
    if (this.project) {
      const projectId = this.project.id || this.project._id || this.project.projectId;
      const projectName = this.project.projectName || this.project.name;
      
      if (this.formConfig.apiEndpoints) {
        Object.keys(this.formConfig.apiEndpoints).forEach((key: string) => {
          if (typeof this.formConfig.apiEndpoints[key] === 'string') {
            this.formConfig.apiEndpoints[key] = this.formConfig.apiEndpoints[key]
              .replace('{{projectId}}', projectId)
              .replace('{{projectName}}', projectName)
              .replace('{{API_BASE}}', 'http://localhost:3000');
          }
        });
      }
      
      this.formConfig.sections?.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          if (field.default && typeof field.default === 'string') {
            field.default = field.default
              .replace('{{projectName}}', projectName)
              .replace('{{projectId}}', projectId);
          }
        });
      });
    }
    
    this.loadSelectOptions();
    this.initializeAvailableRoles();
  }

  // Initialize available roles for the role-with-count field
  private initializeAvailableRoles() {
    const rolesField = this.formConfig.sections
      ?.find((s: any) => s.title === 'Role Requirements')
      ?.fields?.find((f: any) => f.id === 'requiredRoles');
    
    if (rolesField?.options) {
      this.availableRolesForTable = rolesField.options.map((option: any) => ({
        value: option.value,
        label: option.label,
        description: this.getRoleDescription(option.value)
      }));
    }
  }

  getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      'project_manager': 'Oversees project execution and team coordination',
      'developer': 'Implements features and fixes bugs',
      'designer': 'Creates user interfaces and experiences',
      'qa': 'Tests software quality and ensures requirements',
      'ba': 'Analyzes requirements and creates documentation',
      'devops': 'Manages deployment and infrastructure'
    };
    return descriptions[role] || '';
  }

  onMultiSelectChange(fieldId: string, event: any): void {
    const value = event.value || event.target?.value || event;
    this.form[fieldId] = Array.isArray(value) ? value : [value];
    
    if (fieldId === 'requiredRoles') {
      this.updateRoleExperienceData();
    }
  }

  // Handle dynamic table cell changes
  onDynamicTableCellChanged(event: any): void {
    const { row, column, value, rowIndex } = event;
    
    // Update the form data
    if (this.form.roleExperienceMap && this.form.roleExperienceMap[rowIndex]) {
      this.form.roleExperienceMap[rowIndex][column] = value;
    }
    
    // Calculate total count for validation
    this.calculateTotalCount();
  }

  // Handle dynamic table data changes
  onDynamicTableDataChange(data: any[]): void {
    this.form['roleExperienceMap'] = data;
    this.calculateTotalCount();
  }

  private initializeForm() {
    this.form = {};

    // Bind project identifiers
    this.form['projectId'] = this.project?.id || this.project?._id || this.project?.projectId;
    this.form['projectName'] = this.project?.projectName || this.project?.name || '';

    if (this.formConfig?.sections) {
      this.formConfig.sections.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          if (field.id === 'projectName' || field.id === 'projectId') {
            return;
          }

          switch (field.type) {
            case 'multi-select':
            case 'chip-input':
            case 'dynamic-table':
              this.form[field.id] = field.default || [];
              break;

            case 'toggle':
              this.form[field.id] = field.default || false;
              break;

            case 'number':
              this.form[field.id] = field.default || 0;
              break;

            default:
              this.form[field.id] = field.default || '';
          }
        });
      });
    }

    // Load existing requirements for this project
    this.loadExistingRequirements();
  }

 

  getTableColumns(fieldId: string): any[] {
    const field = this.getFieldConfig(fieldId);
    return field?.tableConfig?.columns || [];
  }

  // Get total required count for the dynamic table validation
  getTotalRequiredCount(): number {
    return this.form['requiredHeadcount'] || 0;
  }

  getFieldConfig(fieldId: string): any {
    if (!this.formConfig?.sections) return null;
    
    for (const section of this.formConfig.sections) {
      if (section.fields) {
        const field = section.fields.find((f: any) => f.id === fieldId);
        if (field) return field;
      }
    }
    return null;
  }

  onRoleExperienceNumberChange(event: Event, index: number, field: string): void {
    const target = event.target as HTMLInputElement;
    if (target && this.form.roleExperienceMap && this.form.roleExperienceMap[index]) {
      const value = target.value ? parseFloat(target.value) : 0;
      this.form.roleExperienceMap[index][field] = value;
    }
  }

  onRoleExperienceSelectChange(event: Event, index: number, field: string): void {
    const target = event.target as HTMLSelectElement;
    if (target && this.form.roleExperienceMap && this.form.roleExperienceMap[index]) {
      this.form.roleExperienceMap[index][field] = target.value;
    }
  }

  private loadSelectOptions() {
    if (!this.formConfig?.sections) return;

    this.formConfig.sections.forEach((section: any) => {
      if (section.fields) {
        section.fields.forEach((field: any) => {
          if (field.options && Array.isArray(field.options)) {
            this.selectOptionsMap[field.id] = field.options;
          } else if (field.type === 'multi-select' || field.type === 'select') {
            this.selectOptionsMap[field.id] = [];
          }
        });
      }
    });
  }

  onRoleSelectionChange() {
    this.updateRoleExperienceData();
  }

  
  toggleMultiSelect(fieldId: string, value: any): void {
    if (!this.form[fieldId]) {
      this.form[fieldId] = [];
    }
    
    const index = this.form[fieldId].indexOf(value);
    if (index === -1) {
      this.form[fieldId].push(value);
    } else {
      this.form[fieldId].splice(index, 1);
    }
    
    if (fieldId === 'requiredRoles') {
      this.updateRoleExperienceData();
    }
  }

  removeSkill(fieldId: string, skill: string): void {
    if (this.form[fieldId] && Array.isArray(this.form[fieldId])) {
      const index = this.form[fieldId].indexOf(skill);
      if (index > -1) {
        this.form[fieldId].splice(index, 1);
      }
    }
  }

  addSkill(fieldId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (!value) return;
    
    if (!this.form[fieldId]) {
      this.form[fieldId] = [];
    }
    
    if (!this.form[fieldId].includes(value)) {
      this.form[fieldId].push(value);
    }
    
    input.value = '';
  }

  onRoleExperienceChange(i: number, field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    this.onRoleExperienceChangeDirect(i, field, target.value);
  }

  onRoleExperienceChangeDirect(index: number, field: string, value: any): void {
    if (this.form.roleExperienceMap && this.form.roleExperienceMap[index]) {
      this.form.roleExperienceMap[index][field] = value;
    }
  }

  getAction(actionId: string) {
    return this.formConfig.actions?.find((a: any) => a.id === actionId) || {};
  }

  

  cancel() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5b0f14',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No, keep editing'
    }).then((result) => {
      if (result.isConfirmed) {
        this.close();
      }
    });
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }

 
  private getRequiredFields(): any[] {
    const requiredFields: any[] = [];

    if (this.formConfig?.sections) {
      this.formConfig.sections.forEach((section: any) => {
        if (section.fields) {
          section.fields.forEach((field: any) => {
            if (field.required) {
              requiredFields.push({
                id: field.id,
                label: field.label
              });
            }
          });
        }
      });
    }

    return requiredFields;
  }

  shouldShowField(field: any): boolean {
    if (!field?.conditional) return true;
    
    try {
      const condition = field.conditional;
      
      if (condition.includes('requiredRoles')) {
        const hasRoles = this.form.requiredRoles && this.form.requiredRoles.length > 0;
        return hasRoles;
      }
      
      if (condition.includes('workType')) {
        const operator = condition.includes('!==') ? '!==' : '===';
        const parts = condition.split(operator);
        const fieldName = parts[0]?.trim();
        const expectedValue = parts[1]?.trim().replace(/['"]/g, '');
        
        const actualValue = this.form[fieldName];
        const matches = operator === '===' 
          ? actualValue === expectedValue 
          : actualValue !== expectedValue;
        
        return matches;
      }
      
      return true;
    } catch (error) {
      return true;
    }
  }
}