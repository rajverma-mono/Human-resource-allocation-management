import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import formJson from './add-employee.form.json';
import Swal from 'sweetalert2';

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
// PIPE
import { SelectOptionsPipe } from '../../../../pipes/select-options.pipe';

// NEW
import { StepperUIComponent } from '../../../../atoms/stepper/stepper.component';
import { PhotoUploadAtomComponent } from '../../../../atoms/atom-photo-upload/photo-upload.component';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    // headers
    PageHeaderComponent,
    SectionHeaderComponent,

    // atoms
    InputAtomComponent,
    SelectAtomComponent,
    RadioGroupAtomComponent,
    DatePickerAtomComponent,
    TextAreaAtomComponent,
    ButtonAtomComponent,
    PhotoUploadAtomComponent,

    // pipe
    SelectOptionsPipe,

    // stepper
    StepperUIComponent
  ],
  templateUrl: './add-employee.html'
})
export class AddEmployeeComponent {

  formConfig: any = formJson;
  form: any = {};
  experienceList: any[] = [];
  certificationList: any[] = [];
  
  showPhotoModal: boolean = false;
  previewImageURL: string | null = null;

  activeStep = 0;
  stepperSteps: any[] = [];

  constructor() {
    console.log("🟢 JSON Loaded:", this.formConfig);

    
    this.stepperSteps = this.formConfig.stepper?.length
      ? this.formConfig.stepper.map((step: any, index: number) => ({
          label: this.formConfig.sections[index]?.title,  
          key: step.key
        }))
      : this.formConfig.sections.map((s: any) => ({ label: s.title }));

    this.formConfig.sections.forEach((section: any) => {
      if (section.fields) {
        section.fields.forEach((f: any) => this.form[f.id] = f.default ?? '');
      }
    });
    
    this.experienceList.push(this.createExperienceBlock());
    

  }

  onPhotoSelect(file: File | null) {
    this.form.photo = file;
    console.log("📷 Employee Photo Selected:", file);
  }

  viewPhoto() {
    if (!this.form.photo) return;
    
    const url = URL.createObjectURL(this.form.photo);

    Swal.fire({
      imageUrl: url,
      imageAlt: 'Employee Photo',
      width: 400,
      confirmButtonText: "Close",
      background: '#fff',
      showCloseButton: true,
      customClass: { popup: 'rounded-xl' }
    });
  }

  uploadPhoto() {
    console.log("Upload to API =>", this.form.photo);
    Swal.fire("Uploaded!", "Photo stored successfully", "success");
  }

 getAction(id: string, section?: string) {
  
  if (section === 'certification' && this.formConfig.certificationActions) {
    return this.formConfig.certificationActions.find((a: any) => a.id === id) || {};
  }

  if (section === 'experience' && this.formConfig.experienceActions) {
    return this.formConfig.experienceActions.find((a: any) => a.id === id) || {};
  }

  return this.formConfig.actions.find((a: any) => a.id === id) || {};
}

  createExperienceBlock() {
    const block: any = {};
    let exp = this.formConfig.sections.find((s: any) => s.title === "Work Experience");
    if (exp && exp.experienceForm) {
      exp.experienceForm.forEach((f: any) => block[f.id] = '');
    }
    return block;
  }


  addExperience() { 
    this.experienceList.push(this.createExperienceBlock());
  }
// Inside AddEmployeeComponent class

// 1. Update the 'form' to handle the toggle logic
onExperienceTypeChange(value: string) {
  if (value === 'Experienced' && this.experienceList.length === 0) {
    this.addExperience();
  }
}

onCertificationChange(value: string) {
  if (value === 'yes' && this.certificationList.length === 0) {
    this.addCertification();
  }
}

// 2. Adjust createCertificationBlock to be safer
createCertificationBlock() {
  const block: any = {};
  const certSection = this.formConfig.sections.find((s: any) => s.title === "Certifications");
  if (certSection && certSection.certificationForm) {
    certSection.certificationForm.forEach((f: any) => {
      block[f.id] = '';
    });
  }
  return block;
}
  removeExperience(i: number) { 
    if (this.experienceList.length > 1) {
      this.experienceList.splice(i, 1);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Remove',
        text: 'At least one experience entry is required.',
        confirmButtonColor: '#451111'
      });
    }
  }

  addCertification() { 
    this.certificationList.push(this.createCertificationBlock());
  }

  removeCertification(i: number) { 
    if (this.certificationList.length > 0) {
      this.certificationList.splice(i, 1);
    }
  }

  uploadCertificate(certIndex: number, fieldId: string) {
    console.log("Upload certificate", certIndex, fieldId, this.certificationList[certIndex][fieldId]);
    Swal.fire("Uploaded!", "Certificate uploaded successfully", "success");
  }

  viewCertificate(certIndex: number) {
    const certificateFile = this.certificationList[certIndex]?.uploadCertificate;
    if (!certificateFile) {
      Swal.fire("No Certificate", "No certificate file to preview", "info");
      return;
    }
    
    const fileType = certificateFile.type;
    const fileName = certificateFile.name || 'certificate';
    
    if (fileType.startsWith('image/')) {
      const url = URL.createObjectURL(certificateFile);
      Swal.fire({
        imageUrl: url,
        imageAlt: 'Certificate Image',
        width: 600,
        confirmButtonText: "Close",
        background: '#fff',
        showCloseButton: true,
        customClass: { popup: 'rounded-xl' }
      });
    } else if (fileType === 'application/pdf') {
      const url = URL.createObjectURL(certificateFile);
      window.open(url, '_blank');
    } else {
      Swal.fire({
        title: 'Certificate File',
        text: `File: ${fileName}\nType: ${fileType}`,
        icon: 'info',
        confirmButtonText: "OK"
      });
    }
  }

  nextStep() { 
    if (this.activeStep < this.stepperSteps.length - 1) {
      if (this.validateCurrentStep()) {
        this.activeStep++; 
      }
    }
  }

  prevStep() { 
    if (this.activeStep > 0) this.activeStep--; 
  }

  goToStep(i: number) { 
    this.activeStep = i;
  } 

  save() {
    console.log("✨ Final Submitted:", {
      ...this.form,
      experience: this.experienceList,
      certifications: this.certificationList
    });
    
    const finalData = {
      ...this.form,
      experience: this.experienceList.filter(exp => exp.companyName || exp.role), // Only include non-empty experiences
      certifications: this.form.hasCertification === 'yes' 
        ? this.certificationList.filter(cert => cert.certificateMaster || cert.certificateId) 
        : []
    };
    
    console.log("📤 Final data for API:", finalData);
    
    Swal.fire({
      title: "Success!",
      text: "Employee saved successfully!",
      icon: "success",
      confirmButtonColor: "#451111"
    });
  }

  cancel() {
    Swal.fire({
      title: "Are you sure?",
      text: "All unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#451111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "No, keep editing"
    }).then((result) => {
      if (result.isConfirmed) {
        Object.keys(this.form).forEach(k => this.form[k] = '');
        this.experienceList = [this.createExperienceBlock()];
        this.certificationList = [];
        this.activeStep = 0;
        
        this.formConfig.sections.forEach((section: any) => {
          if (section.fields) {
            section.fields.forEach((f: any) => {
              if (f.default !== undefined) {
                this.form[f.id] = f.default;
              }
            });
          }
        });
        
        Swal.fire("Cancelled!", "Form has been reset.", "info");
      }
    });
  }

  handleButton(actionId: string) {
    const map: any = {
      save: () => this.save(),
      cancel: () => this.cancel(),
      addExperience: () => this.addExperience(),
      addCertification: () => this.addCertification()
    };
    map[actionId]?.();
  }

  validateCurrentStep(): boolean {
    const currentSection = this.formConfig.sections[this.activeStep];
    
    if (!currentSection || !currentSection.fields) return true;
      const requiredFields = currentSection.fields.filter((f: any) => f.required);
    
    for (const field of requiredFields) {
      if (!this.form[field.id] || this.form[field.id].toString().trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Required Field',
          text: `${field.label} is required.`,
          confirmButtonColor: '#451111'
        });
        return false;
      }
    }
    
    return true;
  }
}