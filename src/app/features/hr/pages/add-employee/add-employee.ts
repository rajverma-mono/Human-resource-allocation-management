import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import formJson from './add-employee.form.json';
import Swal from 'sweetalert2';
import { environment } from '../../../../../environment';

import { PageHeaderComponent } from '../../../../atoms/page-header/page-header';
import { SectionHeaderComponent } from '../../../../atoms/section-header/section-header';

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
export class AddEmployeeComponent implements OnInit {
  formConfig: any = formJson;
  photoBase64: string | undefined;

  form: any = {};
  experienceList: any[] = [];
  certificationList: any[] = [];

  activeStep = 0;
  stepperSteps: any[] = [];

  mode: 'add' | 'edit' = 'add';
  employeeId: string | number | null = null;
  isLoading = false;
  
  private isComponentAlive = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🟢 JSON Loaded:', this.formConfig);

    this.stepperSteps = this.formConfig.stepper?.length
      ? this.formConfig.stepper.map((step: any, index: number) => ({
          label: this.formConfig.sections[index]?.title,
          key: step.key
        }))
      : this.formConfig.sections.map((s: any) => ({ label: s.title }));

  }

ngOnInit(): void {
  console.log('🟢 ngOnInit started');
  this.isComponentAlive = true;

  this.checkEditMode();
}

private initializeFormForEdit(): void {
  this.form = {};

  this.formConfig.sections.forEach((section: any) => {
    section.fields?.forEach((field: any) => {
      this.form[field.id] = '';
    });
  });

  this.experienceList = [];
  this.certificationList = [];
}

  ngOnDestroy(): void {
    this.isComponentAlive = false;
  }

 private initializeForm(): void {
  console.log('🟢 initializeForm called - FOR ADD MODE ONLY');
  this.form = {};
  
  this.formConfig.sections.forEach((section: any) => {
    section.fields?.forEach((f: any) => {
      this.form[f.id] = f.default ?? '';
    });
  });
  
  this.form.experienceType = 'Fresher';
  this.form.hasCertification = 'none';
  
  this.experienceList = [this.createExperienceBlock()];
  this.certificationList = [];
  
  console.log('🟢 Form initialized for add mode:', this.form);
}
private checkEditMode(): void {
  console.log('🔍 checkEditMode called');

  const navigation = this.router.getCurrentNavigation();

  if (navigation?.extras?.state) {
    const employeeData = navigation.extras.state['employeeData'];
    this.mode = navigation.extras.state['mode'] || 'add';

    if (this.mode === 'edit' && employeeData) {
      this.employeeId = employeeData.id;
      
      this.isLoading = true; 
      
      this.initializeFormForEdit();
      
      setTimeout(() => {
        this.prefillFormFromData(employeeData);
        this.isLoading = false;  
        this.safeDetectChanges();
      }, 100);
      
      return;
    }
  }

  this.route.queryParams.subscribe(params => {
    if (params['mode'] === 'edit' && params['id']) {
      this.mode = 'edit';

      const id = params['id'] as string | number;

      this.employeeId = id;
      this.initializeFormForEdit();

      this.loadEmployeeData(id);
    } else {
      this.isLoading = false;
      this.initializeForm();
    }
  });
}


private loadEmployeeData(id: string | number): void {
  this.isLoading = true;

  const getByIdApi = this.formConfig.apiEndpoints?.getById;
  if (!getByIdApi) {
    console.error('❌ No getById endpoint configured');
    this.isLoading = false; 
    return;
  }

  const url = getByIdApi
    .replace('{{API_BASE}}', environment.API_BASE)
    .replace('{id}', id.toString());

  this.http.get(url).subscribe({
    next: (response: any) => {
      if (!this.isComponentAlive) return;

      this.prefillFormFromData(response);

      this.isLoading = false; 
      this.safeDetectChanges();
    },
    error: (err) => {
      console.error('❌ Error loading employee:', err);
      this.isLoading = false; 
      Swal.fire('Error', 'Failed to load employee data', 'error');
      this.router.navigate(['/hr/employees']);
    }
  });
}


  private safeDetectChanges(): void {
    if (this.isComponentAlive && this.cdr) {
      try {
        this.cdr.detectChanges();
      } catch (error) {
        console.warn('⚠️ Change detection error:', error);
      }
    }
  }

  private formatDateForInput(date: string | Date): string {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }
private prefillFormFromData(employeeData: any): void {
  console.log('🔥 prefillFormFromData CALLED with data:', employeeData);
  
  const dataToUse = employeeData.data || employeeData.result || employeeData;
  console.log('🔥 Using data from:', dataToUse === employeeData ? 'root' : 'nested property');
  
  
  const newForm: any = {};
  
  this.formConfig.sections.forEach((section: any) => {
    section.fields?.forEach((field: any) => {
      newForm[field.id] = '';
    });
  });
  
  const fieldMapping: { [key: string]: string } = {
    'employeeName': 'employeeName',
    'employeeCode': 'employeeCode',
    'workEmail': 'workEmail',
    'mobileNumber': 'mobileNumber',
    'gender': 'gender',
    'passport': 'passport',
    'adhaar': 'adhaar',
    'pan': 'pan',
    'department': 'department',
    'dob': 'dob',
    'remarks': 'remarks',
    'jobTitle': 'jobTitle',
    'departmentName': 'departmentName',
    'joiningDate': 'joiningDate',
    'employeeStatus': 'employeeStatus',
    'graduation': 'graduation',
    'specialization': 'specialization',
    'university': 'university',
    'twelfthMarks': 'twelfthMarks',
    'tenthMarks': 'tenthMarks',
    'experienceType': 'experienceType',
    'hasCertification': 'hasCertification',
    'bankName': 'bankName',
    'accountHolderName': 'accountHolderName',
    'accountNumber': 'accountNumber',
    'ifscCode': 'ifscCode',
    'accountType': 'accountType',
    'bankRemarks': 'bankRemarks'
  };

  Object.keys(fieldMapping).forEach(fieldId => {
    const dataKey = fieldMapping[fieldId];
    if (dataToUse[dataKey] !== undefined && dataToUse[dataKey] !== '') {
      console.log(`✅ Setting ${fieldId} = ${dataToUse[dataKey]}`);
      
      const fieldConfig = this.getFieldConfig(fieldId);
      if (fieldConfig?.type === 'date') {
        newForm[fieldId] = this.formatDateForInput(dataToUse[dataKey]);
      } else {
        newForm[fieldId] = dataToUse[dataKey];
      }
    }
  });

  if (dataToUse.experience && Array.isArray(dataToUse.experience)) {
    const newExperienceList: any[] = dataToUse.experience.map((exp: any) => {
      const block: any = {};
      const section = this.formConfig.sections.find((s: any) => s.title === 'Work Experience');
      if (section?.experienceForm) {
        section.experienceForm.forEach((field: any) => {
          if (exp[field.id] !== undefined) {
            if (field.type === 'date') {
              block[field.id] = this.formatDateForInput(exp[field.id]);
            } else {
              block[field.id] = exp[field.id] || '';
            }
          }
        });
      }
      return block;
    });
    
    this.experienceList = newExperienceList;
    
    if (this.experienceList.length > 0 && !newForm.experienceType) {
      newForm.experienceType = 'Experienced';
    }
  } else {
    this.experienceList = [];
  }

  if (dataToUse.certifications && Array.isArray(dataToUse.certifications)) {
    const newCertificationList: any[] = dataToUse.certifications.map((cert: any) => {
      const block: any = {};
      const section = this.formConfig.sections.find((s: any) => s.title === 'Certifications');
      if (section?.certificationForm) {
        section.certificationForm.forEach((field: any) => {
          const fieldId = field.id;
          if (fieldId === 'uploadCertificate') {
            block[fieldId] = cert.uploadCertificate || cert.certificateFile || '';
          } else if (cert[fieldId] !== undefined) {
            block[fieldId] = cert[fieldId] || '';
          }
        });
      }
      return block;
    });
    
    // Assign NEW array
    this.certificationList = newCertificationList;
    
    if (this.certificationList.length > 0 && !newForm.hasCertification) {
      newForm.hasCertification = 'yes';
    }
  } else {
    this.certificationList = [];
  }

  console.log('📷 Processing photo...');
  if (dataToUse.photoBase64) {
    console.log('📷 Photo data found, length:', dataToUse.photoBase64.length);
    
    newForm.photoBase64 = dataToUse.photoBase64;
    newForm.photoUploaded = true;
    
    setTimeout(() => {
      if (this.isComponentAlive) {
        this.photoBase64 = dataToUse.photoBase64;
        console.log('✅ Photo base64 set to:', this.photoBase64?.substring(0, 100) + '...');
      }
    }, 100);
  } else {
    console.log('📷 No photo data');
    this.photoBase64 = undefined;
    newForm.photoBase64 = '';
    newForm.photoUploaded = false;
  }

  if (!newForm.experienceType) {
    newForm.experienceType = 'Fresher';
  }
  
  if (!newForm.hasCertification) {
    newForm.hasCertification = 'none';
  }

  setTimeout(() => {
    if (this.isComponentAlive) {
      this.form = {...newForm};
      
      console.log('✅ Form assigned to component:', this.form);
      console.log('✅ Experience list:', this.experienceList);
      console.log('✅ Certification list:', this.certificationList);
      console.log('✅ Photo base64:', this.photoBase64 ? 'Set' : 'Not set');
      
      setTimeout(() => {
        this.safeDetectChanges();
        setTimeout(() => {
          this.safeDetectChanges();
          setTimeout(() => {
            this.safeDetectChanges();
            console.log('🔄 Change detection completed');
          }, 50);
        }, 50);
      }, 50);
    }
  }, 100);
}

private getFieldConfig(fieldId: string): any {
  for (const section of this.formConfig.sections) {
    if (section.fields) {
      const field = section.fields.find((f: any) => f.id === fieldId);
      if (field) return field;
    }
  }
  return null;
}


  getAction(id: string, section?: 'experience' | 'certification') {
    if (section === 'experience' && this.formConfig.experienceActions) {
      return this.formConfig.experienceActions.find((a: any) => a.id === id) || {};
    }

    if (section === 'certification' && this.formConfig.certificationActions) {
      return this.formConfig.certificationActions.find((a: any) => a.id === id) || {};
    }

    return this.formConfig.actions?.find((a: any) => a.id === id) || {};
  }

  onPhotoSelect(base64: string | null) {
    console.log('📷 onPhotoSelect called with base64:', base64 ? 'Has data' : 'No data');
    this.form.photoBase64 = base64;
    this.form.photoUploaded = false;
    this.photoBase64 = base64 || undefined;
  }

  viewPhoto() {
    if (!this.form.photoBase64) {
      Swal.fire('No photo to view');
      return;
    }

    Swal.fire({
      imageUrl: this.form.photoBase64,
      width: 400,
      showCloseButton: true
    });
  }

  uploadPhoto() {
    if (!this.form.photoBase64) {
      Swal.fire('No photo selected', 'Please select a photo first', 'warning');
      return;
    }

    this.form.photoUploaded = true;
    Swal.fire('Uploaded!', 'Photo stored successfully', 'success');
  }

  onPhotoAction(action: 'upload' | 'view' | 'remove') {
    if (action === 'upload') this.uploadPhoto();
    if (action === 'view') this.viewPhoto();
    if (action === 'remove') {
      this.form.photoBase64 = null;
      this.form.photoUploaded = false;
      this.photoBase64 = undefined;
    }
  }

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
      imageUrl: base64,
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

  nextStep() {
    if (this.activeStep < this.stepperSteps.length - 1) {
      if (this.validateCurrentStep()) this.activeStep++;
    }
  }

  prevStep() {
    if (this.activeStep > 0) this.activeStep--;
  }

  validateCurrentStep(): boolean {
    const section = this.formConfig.sections[this.activeStep];
    if (!section?.fields) return true;

    for (const field of section.fields.filter((f: any) => f.required)) {
      if (field.type === 'photo') {
        if (!this.form.photoUploaded) {
          Swal.fire('Please upload the photo');
          return false;
        }
        continue;
      }

      if (!this.form[field.id]) {
        Swal.fire(`${field.label} is required`);
        return false;
      }
    }

    return true;
  }

  save() {
    for (let i = 0; i < this.stepperSteps.length; i++) {
      this.activeStep = i;
      if (!this.validateCurrentStep()) {
        Swal.fire('Validation Error', 'Please complete all required fields', 'error');
        return;
      }
    }

    let apiEndpoint: string;
    let httpMethod: 'post' | 'put';
    let url: string;

    if (this.mode === 'edit' && this.employeeId) {
      apiEndpoint = this.formConfig.apiEndpoints?.update;
      httpMethod = 'put';
      
      if (!apiEndpoint) {
        console.error('❌ No update endpoint configured in JSON');
        Swal.fire('Configuration Error', 'Update endpoint is not defined in JSON', 'error');
        return;
      }
      
      url = apiEndpoint
        .replace('{{API_BASE}}', environment.API_BASE)
        .replace('{id}', this.employeeId.toString());
    } else {
      apiEndpoint = this.formConfig.apiEndpoints?.create;
      httpMethod = 'post';
      
      if (!apiEndpoint) {
        console.error('❌ No create endpoint configured in JSON');
        Swal.fire('Configuration Error', 'Create endpoint is not defined in JSON', 'error');
        return;
      }
      
      url = apiEndpoint.replace('{{API_BASE}}', environment.API_BASE);
    }

    const payload: any = {
      employeeName: this.form.employeeName,
      employeeCode: this.form.employeeCode,
      workEmail: this.form.workEmail,
      mobileNumber: this.form.mobileNumber,
      gender: this.form.gender,
      passport: this.form.passport,
      adhaar: this.form.adhaar,
      pan: this.form.pan,
      department: this.form.department || this.form.departmentName,
      dob: this.form.dob,
      remarks: this.form.remarks,
      jobTitle: this.form.jobTitle,
      joiningDate: this.form.joiningDate,
      employeeStatus: this.form.employeeStatus,
      graduation: this.form.graduation,
      specialization: this.form.specialization,
      university: this.form.university,
      twelfthMarks: this.form.twelfthMarks,
      tenthMarks: this.form.tenthMarks,
      photoBase64: this.form.photoBase64,
      bankName: this.form.bankName,
      accountHolderName: this.form.accountHolderName,
      accountNumber: this.form.accountNumber,
      ifscCode: this.form.ifscCode,
      accountType: this.form.accountType,
      bankRemarks: this.form.bankRemarks,
      experience: this.experienceList.map(exp => ({
        companyName: exp.companyName,
        role: exp.role,
        experienceCategory: exp.experienceCategory,
        fromDate: exp.fromDate,
        toDate: exp.toDate
      })),
      certifications: this.form.hasCertification === 'yes' 
        ? this.certificationList.map(cert => ({
            certificateMaster: cert.certificateMaster,
            certificateName: cert.certificateName,
            certificateId: cert.certificateId,
            certificateFile: cert.uploadCertificate
          }))
        : []
    };

    console.log(`📤 ${httpMethod.toUpperCase()} →`, url, payload);

    const apiCall = httpMethod === 'put' 
      ? this.http.put(url, payload)
      : this.http.post(url, payload);

    apiCall.subscribe({
      next: (res) => {
        console.log(`✅ Employee ${this.mode === 'edit' ? 'updated' : 'saved'}:`, res);
        Swal.fire(
          'Success', 
          `Employee ${this.mode === 'edit' ? 'updated' : 'saved'} successfully!`, 
          'success'
        ).then(() => {
          this.router.navigate(['/hr/employees']);
        });
      },
      error: (err) => {
        console.error(`❌ API error (${httpMethod}):`, err);
        Swal.fire('Error', `Failed to ${this.mode === 'edit' ? 'update' : 'save'} employee`, 'error');
      }
    });
  }

  resetForm() {
    this.initializeForm();
    this.activeStep = 0;
    this.mode = 'add';
    this.employeeId = null;
  }

  cancel() {
    Swal.fire({
      title: 'Cancel?',
      text: 'All unsaved changes will be lost',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No, keep editing'
    }).then(result => {
      if (result.isConfirmed) {
        this.router.navigate(['/hr/employees']);
      }
    });
  }

  getPageTitle(): string {
    return this.mode === 'edit' ? 'Edit Employee' : 'Add New Employee';
  }

  getSaveButtonLabel(): string {
    return this.mode === 'edit' ? 'Update Employee' : 'Save Employee';
  }
}