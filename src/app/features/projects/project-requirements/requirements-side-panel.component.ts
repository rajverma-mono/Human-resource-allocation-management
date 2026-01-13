import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// Use simpler interfaces
interface FieldConfig {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  options?: { value: any; label: string }[];
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  conditional?: boolean;
  showWhen?: string;
  defaultValue?: any;
  hint?: string; // Add this
  validation?: {
    pattern?: string;
    message?: string;
  };
}

interface Config {
  title: string;
  description: string;
  fields: FieldConfig[];
  actions: Array<{
    label: string;
    action: string;
    variant: string;
    icon?: string;
  }>;
  apiEndpoints?: {
    save?: string;
    get?: string;
  };
}

@Component({
  selector: 'requirements-side-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './requirements-side-panel.component.html'
})
export class RequirementsSidePanelComponent implements OnInit {
  
  @Input() config!: Config;
  @Input() projectData: any;
  @Input() existingRequirements: any;
  
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Output() action = new EventEmitter<string>();
  
  requirementsForm!: FormGroup;
  isOpen = true;
  skillInput = '';
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit() {
    this.initializeForm();
  }
  
  private initializeForm() {
    const formGroup: any = {};
    
    this.config.fields?.forEach(field => {
      let defaultValue = field.defaultValue || '';
      
      // Replace template variables
      if (typeof defaultValue === 'string') {
        defaultValue = defaultValue
          .replace('{{projectName}}', this.projectData?.projectName || '')
          .replace('{{projectId}}', this.projectData?.id || '');
      }
      
      // Use existing data if available
      if (this.existingRequirements?.[field.key] !== undefined) {
        defaultValue = this.existingRequirements[field.key];
      }
      
      // Set up validators
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'number') {
        if (field.min !== undefined) {
          validators.push(Validators.min(field.min));
        }
        if (field.max !== undefined) {
          validators.push(Validators.max(field.max));
        }
      }
      
      formGroup[field.key] = [defaultValue, validators];
      
      // Special handling for chip input
      if (field.type === 'chip-input' && defaultValue) {
        if (typeof defaultValue === 'string') {
          formGroup[field.key] = [defaultValue.split(',').map((s: string) => s.trim()), validators];
        } else if (Array.isArray(defaultValue)) {
          formGroup[field.key] = [defaultValue, validators];
        }
      }
    });
    
    this.requirementsForm = this.fb.group(formGroup);
  }
  
  // Chip input methods
  addSkill(event: any) {
    const value = (event.value || '').trim();
    if (value) {
      const skills = this.requirementsForm.get('requiredSkills')?.value || [];
      if (!skills.includes(value)) {
        skills.push(value);
        this.requirementsForm.get('requiredSkills')?.setValue(skills);
      }
      this.skillInput = '';
    }
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }
  
  removeSkill(skill: string) {
    const skills = this.requirementsForm.get('requiredSkills')?.value || [];
    const index = skills.indexOf(skill);
    if (index >= 0) {
      skills.splice(index, 1);
      this.requirementsForm.get('requiredSkills')?.setValue(skills);
    }
  }
  
  // Form actions
  onSave() {
    if (this.requirementsForm.valid) {
      const formValue = this.requirementsForm.value;
      
      // Convert skills array to comma-separated string for API
      if (formValue.requiredSkills && Array.isArray(formValue.requiredSkills)) {
        formValue.requiredSkills = formValue.requiredSkills.join(',');
      }
      
      this.save.emit(formValue);
    } else {
      this.markFormGroupTouched(this.requirementsForm);
    }
  }
  
  onCancel() {
    this.cancel.emit();
  }
  
  onAction(actionType: string) {
    if (actionType === 'save') {
      this.onSave();
    } else if (actionType === 'cancel') {
      this.onCancel();
    } else {
      this.action.emit(actionType);
    }
  }
  
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  // Close panel
  close() {
    this.isOpen = false;
    setTimeout(() => this.cancel.emit(), 300);
  }
}