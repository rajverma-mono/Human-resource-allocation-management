import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import formJson from './add-employee.form.json';
import Swal from 'sweetalert2';
import { environment } from '../../../../../environment';

// HEADER COMPONENTS
import { PageHeaderComponent } from '../../../../atoms/page-header/page-header';
import { SectionHeaderComponent } from '../../../../atoms/section-header/section-header';

// ATOMS
import { InputAtomComponent } from '../../../../atoms/input/input';
import { SelectAtomComponent } from '../../../../atoms/select/select';
import { RadioGroupAtomComponent } from '../../../../atoms/radio-group/radio-group';
import { DatePickerAtomComponent } from '../../../../atoms/date-picker/date-picker';
import { TextAreaAtomComponent } from '../../../../atoms/textarea/textarea';
import { ButtonAtomComponent } from '../../../../atoms/button/button';
import { PhotoUploadAtomComponent } from '../../../../atoms/atom-photo-upload/photo-upload.component';

// PIPE
import { SelectOptionsPipe } from '../../../../pipes/select-options.pipe';

// STEPPER
import { StepperUIComponent } from '../../../../atoms/stepper/stepper.component';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    PageHeaderComponent,
    SectionHeaderComponent,

    InputAtomComponent,
    SelectAtomComponent,
    RadioGroupAtomComponent,
    DatePickerAtomComponent,
    TextAreaAtomComponent,
    ButtonAtomComponent,
    PhotoUploadAtomComponent,

    SelectOptionsPipe,
    StepperUIComponent
  ],
  templateUrl: './add-employee.html'
})
export class AddEmployeeComponent {

  /* ================= CONFIG ================= */

  formConfig: any = formJson;

  /* ================= STATE ================= */

  form: any = {};
  experienceList: any[] = [];
  certificationList: any[] = [];

  activeStep = 0;
  stepperSteps: any[] = [];

  constructor(private http: HttpClient) {
    console.log('🟢 JSON Loaded:', this.formConfig);

    // Stepper
    this.stepperSteps = this.formConfig.stepper?.length
      ? this.formConfig.stepper.map((step: any, index: number) => ({
          label: this.formConfig.sections[index]?.title,
          key: step.key
        }))
      : this.formConfig.sections.map((s: any) => ({ label: s.title }));

    // Init form
    this.formConfig.sections.forEach((section: any) => {
      section.fields?.forEach((f: any) => {
        this.form[f.id] = f.default ?? '';
      });
    });

    this.experienceList.push(this.createExperienceBlock());
  }

  /* ================= API ================= */

 private resolveApiUrl(endpoint: string): string {
  return endpoint.replace('{{API_BASE}}', environment.API_BASE);
}

  /* ================= 🔥 RESTORED getAction ================= */

  getAction(id: string, section?: 'experience' | 'certification') {
    if (section === 'experience' && this.formConfig.experienceActions) {
      return this.formConfig.experienceActions.find((a: any) => a.id === id) || {};
    }

    if (section === 'certification' && this.formConfig.certificationActions) {
      return this.formConfig.certificationActions.find((a: any) => a.id === id) || {};
    }

    return this.formConfig.actions?.find((a: any) => a.id === id) || {};
  }

  /* ================= PHOTO ================= */

  onPhotoSelect(file: File | null) {
    this.form.photo = file;
  }

  viewPhoto() {
    if (!this.form.photo) return;

    Swal.fire({
      imageUrl: URL.createObjectURL(this.form.photo),
      width: 400,
      showCloseButton: true
    });
  }

  uploadPhoto() {
    Swal.fire('Uploaded!', 'Photo stored successfully', 'success');
  }

  onPhotoAction(field: any, action: 'upload' | 'view' | 'remove') {
    if (action === 'upload') this.uploadPhoto();
    if (action === 'view') this.viewPhoto();
    if (action === 'remove') this.form[field.id] = null;
  }

  /* ================= EXPERIENCE ================= */

  createExperienceBlock() {
    const block: any = {};
    const section = this.formConfig.sections.find(
      (s: any) => s.title === 'Work Experience'
    );
    section?.experienceForm?.forEach((f: any) => (block[f.id] = ''));
    return block;
  }

  addExperience() {
    this.experienceList.push(this.createExperienceBlock());
  }

  removeExperience(i: number) {
    if (this.experienceList.length > 1) {
      this.experienceList.splice(i, 1);
    } else {
      Swal.fire('At least one experience entry is required');
    }
  }

  onExperienceTypeChange(value: string) {
    if (value === 'Experienced' && this.experienceList.length === 0) {
      this.addExperience();
    }
  }

  /* ================= CERTIFICATIONS ================= */

  createCertificationBlock() {
    const block: any = {};
    const section = this.formConfig.sections.find(
      (s: any) => s.title === 'Certifications'
    );
    section?.certificationForm?.forEach((f: any) => (block[f.id] = ''));
    return block;
  }

  addCertification() {
    this.certificationList.push(this.createCertificationBlock());
  }

  removeCertification(i: number) {
    this.certificationList.splice(i, 1);
  }

  onCertificationChange(value: string) {
    if (value === 'yes' && this.certificationList.length === 0) {
      this.addCertification();
    }
  }

  /* ================= STEPPER ================= */

  nextStep() {
    if (this.activeStep < this.stepperSteps.length - 1) {
      if (this.validateCurrentStep()) this.activeStep++;
    }
  }

  prevStep() {
    if (this.activeStep > 0) this.activeStep--;
  }

  /* ================= VALIDATION ================= */

  validateCurrentStep(): boolean {
    const section = this.formConfig.sections[this.activeStep];
    if (!section?.fields) return true;

    for (const field of section.fields.filter((f: any) => f.required)) {
      if (!this.form[field.id]) {
        Swal.fire(`${field.label} is required`);
        return false;
      }
    }
    return true;
  }

  /* ================= SAVE (API) ================= */
save() {
  // 🔐 Safety checks - Updated to match JSON structure
  if (
    !this.formConfig?.apiEndpoints ||
    !this.formConfig.apiEndpoints.create
  ) {
    console.error('❌ API configuration missing in JSON', this.formConfig);
    Swal.fire(
      'Configuration Error',
      'API endpoint "create" is not defined in JSON',
      'error'
    );
    return;
  }

  // 🔗 Build URL from JSON + environment
  const url = this.formConfig.apiEndpoints.create
    .replace('{{API_BASE}}', environment.API_BASE);

  // 📦 Payload
  const payload = {
    ...this.form,
    experience: this.experienceList,
    certifications:
      this.form.hasCertification === 'yes'
        ? this.certificationList
        : []
  };

  console.log('📤 POST →', url, payload);

  // 🚀 API call
  this.http.post(url, payload).subscribe({
    next: (res) => {
      console.log('✅ Employee saved:', res);
      Swal.fire('Success', 'Employee saved successfully!', 'success');
    },
    error: (err) => {
      console.error('❌ API error:', err);
      Swal.fire('Error', 'Failed to save employee', 'error');
    }
  });
}

  /* ================= RESET ================= */

  resetForm() {
    this.form = {};
    this.experienceList = [this.createExperienceBlock()];
    this.certificationList = [];
    this.activeStep = 0;

    this.formConfig.sections.forEach((section: any) => {
      section.fields?.forEach((f: any) => {
        this.form[f.id] = f.default ?? '';
      });
    });
  }

  cancel() {
    Swal.fire({
      title: 'Cancel?',
      text: 'All unsaved changes will be lost',
      showCancelButton: true
    }).then(r => r.isConfirmed && this.resetForm());
  }
}
