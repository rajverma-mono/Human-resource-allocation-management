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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeFormConfig();
    this.initializeForm();
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
  }

  onMultiSelectChange(fieldId: string, event: any): void {
    const value = event.value || event.target?.value || event;
    this.form[fieldId] = Array.isArray(value) ? value : [value];
    
    if (fieldId === 'requiredRoles') {
      this.updateRoleExperienceData();
    }
  }

  onDynamicTableCellChanged(event: any): void {
    const { fieldId, data } = event;
    if (fieldId && this.form[fieldId] !== undefined) {
      this.form[fieldId] = data;
    }
  }

  private initializeForm() {
    this.form = {};
    this.form['projectName'] = this.project?.projectName || this.project?.name || '';
    
    if (this.formConfig?.sections) {
      this.formConfig.sections.forEach((section: any) => {
        if (section.fields) {
          section.fields.forEach((field: any) => {
            if (field.id === 'projectName') {
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
        }
      });
    }
    
    this.loadExistingRequirements();
  }

  private loadExistingRequirements() {
    if (!this.project || !this.formConfig?.apiEndpoints?.getById) return;
    
    const loadUrl = this.formConfig.apiEndpoints.getById.replace('{id}', '');
    
    this.http.get(loadUrl).subscribe({
      next: (requirements: any) => {
        this.form = { ...this.form, ...requirements };
        
        if (typeof this.form.roleExperienceMap === 'string') {
          try {
            this.form.roleExperienceMap = JSON.parse(this.form.roleExperienceMap);
            this.form.roleExperienceMap = this.form.roleExperienceMap.map((item: any) => ({
              ...item,
              requiredSkills: typeof item.requiredSkills === 'string' 
                ? item.requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
                : item.requiredSkills || []
            }));
          } catch {
            this.form.roleExperienceMap = [];
          }
        }
        
        this.form.projectName = this.project?.projectName || this.project?.name || '';
      },
      error: (err) => {
        console.log('No existing requirements found:', err.status);
      }
    });
  }

  onRoleExperienceNumberChange(event: Event, index: number, field: string): void {
    const target = event.target as HTMLInputElement;
    if (target && this.form.roleExperienceMap && this.form.roleExperienceMap[index]) {
      const value = target.value ? parseFloat(target.value) : 0;
      this.form.roleExperienceMap[index][field] = value;
    }
  }

  getTableColumns(fieldId: string): any[] {
    const field = this.getFieldConfig(fieldId);
    return field?.tableConfig?.columns || [];
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
        minExperience: existing?.minExperience || 0,
        qualification: existing?.qualification || 'B.Tech',
        requiredSkills: existing?.requiredSkills || []
      };
    });
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

  async save() {
    try {
      if (!this.validateForm()) {
        return;
      }

      this.isLoading = true;
      
      Swal.fire({
        title: 'Saving...',
        text: 'Please wait while we save requirements',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const formData = { ...this.form };
      
      delete formData.requiredSkills;
      
      if (Array.isArray(formData.roleExperienceMap)) {
        formData.roleExperienceMap = formData.roleExperienceMap.map((item: any) => ({
          ...item,
          requiredSkills: Array.isArray(item.requiredSkills) 
            ? item.requiredSkills.join(',') 
            : item.requiredSkills || ''
        }));
        
        formData.roleExperienceMap = JSON.stringify(formData.roleExperienceMap);
      }

      const saveUrl = this.formConfig.apiEndpoints?.create;
      if (!saveUrl) {
        throw new Error('Save API endpoint not configured');
      }

      const response = await this.http.post(saveUrl, formData).toPromise();

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
      console.error('Error saving requirements:', error);
      
      let errorMessage = 'Error saving requirements. Please try again.';
      if (error.status === 400) errorMessage = 'Invalid data. Please check your inputs.';
      if (error.status === 404) errorMessage = 'API endpoint not found. Check your backend.';
      if (error.status === 500) errorMessage = 'Server error. Please try again later.';

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