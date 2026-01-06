import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

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

import { SelectOptionsPipe } from '../../../../pipes/select-options.pipe';

import { StepperUIComponent } from '../../../../atoms/stepper/stepper.component';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,

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


  formConfig: any = formJson;

photoBase64: string | null = null;

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

 onPhotoSelect(base64: string | null) {
  this.form.photoBase64 = base64;
  this.form.photoUploaded = false; // reset until upload is clicked
}



 viewPhoto() {
  console.log('VIEW CLICKED', this.form.photoBase64);

  if (!this.form.photoBase64) {
    console.warn('No photoBase64 to view');
    return;
  }

  Swal.fire({
    imageUrl: this.form.photoBase64, // ✅ Base64 DIRECT
    width: 400,
    showCloseButton: true
  });
}


 uploadPhoto() {
  if (!this.form.photoBase64) {
    Swal.fire('No photo selected', 'Please select a photo first', 'warning');
    return;
  }

  // ✅ MARK AS UPLOADED
  this.form.photoUploaded = true;

  Swal.fire('Uploaded!', 'Photo stored successfully', 'success');
}


 onPhotoAction(action: 'upload' | 'view' | 'remove') {
  if (action === 'upload') this.uploadPhoto();
  if (action === 'view') this.viewPhoto();
  if (action === 'remove') {
    this.form.photoBase64 = null;
    this.form.photoUploaded = false;
  }
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
/* ================= CERTIFICATE PHOTO ACTIONS ================= */

onCertificateUpload(index: number) {
  Swal.fire(
    'Uploaded!',
    `Certificate ${index + 1} stored successfully`,
    'success'
  );
}

onCertificateView(cert: any) {
  const base64 = cert?.uploadCertificate;

  if (!base64) {
    Swal.fire('No certificate to view');
    return;
  }

  Swal.fire({
    imageUrl: base64, // Base64 preview
    width: 400,
    showCloseButton: true
  });
}

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

    // 🔥 SPECIAL CASE: PHOTO
    if (field.type === 'photo') {
      if (!this.form.photoUploaded) {
        Swal.fire('Please upload the photo');
        return false;
      }
      continue;
    }

    // 🔹 NORMAL FIELDS
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
