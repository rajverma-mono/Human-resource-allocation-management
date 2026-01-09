import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import formConfigJson from './project-initiation.form.json';

import { PageHeaderComponent } from '../../../atoms/page-header/page-header';
import { InputAtomComponent } from '../../../atoms/input/input';
import { SelectAtomComponent } from '../../../atoms/select/select';
import { DatePickerAtomComponent } from '../../../atoms/date-picker/date-picker';
import { TextAreaAtomComponent } from '../../../atoms/textarea/textarea';
import { ButtonAtomComponent } from '../../../atoms/button/button';
import { SelectOptionsPipe } from '../../../pipes/select-options.pipe';

@Component({
  selector: 'app-add-project',
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
    SelectOptionsPipe
  ],
  templateUrl: './add-project.html'
})
export class AddProjectComponent implements OnInit {
  formConfig: any = formConfigJson;
  form: any = {};
  isEditMode = false;
  projectId: string = '';
  isLoading = false;
  selectOptionsMap: Record<string, any[]> = {};

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
    this.loadSelectOptionsFromApi();

  }

  checkEditMode() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.projectId = params['id'];
        this.loadProjectData(this.projectId);
      }
    });
  }

  initializeForm() {
    console.log('🟢 Project Form Config:', this.formConfig);

    this.form = {};

    if (this.formConfig?.sections) {
      this.formConfig.sections.forEach((section: any) => {
        if (section.fields) {
          section.fields.forEach((field: any) => {
            this.form[field.id] = field.default ?? '';
          });
        }
      });
    }

    console.log('🟢 Form initialized:', this.form);
  }

  loadProjectData(id: string) {
    this.isLoading = true;

    Swal.fire({
      title: 'Loading...',
      text: 'Please wait while we load project data',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const getEndpoint = this.formConfig.apiEndpoints?.getById;

    if (!getEndpoint) {
      console.error('❌ getById endpoint missing in form config');
      return;
    }

    const url = getEndpoint.replace('{id}', id);


    this.http.get(url).subscribe({
      next: (project: any) => {
        this.form = { ...this.form, ...project };
        this.isLoading = false;
        Swal.close();
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load',
          text: 'Could not load project data. Please try again.',
          confirmButtonColor: '#451111'
        });
      }
    });
  }
  loadSelectOptionsFromApi() {
    console.group('🔵 loadSelectOptionsFromApi START');

    if (!this.formConfig?.sections) {
      console.warn('⚠️ No sections found in formConfig');
      console.groupEnd();
      return;
    }

    this.formConfig.sections.forEach((section: any, sIndex: number) => {
      console.group(`🟣 Section[${sIndex}]: ${section.title}`);

      if (!section.fields) {
        console.warn('⚠️ No fields in this section');
        console.groupEnd();
        return;
      }

      section.fields.forEach((field: any, fIndex: number) => {
        console.group(`🟢 Field[${fIndex}]: ${field.id}`);

        console.log('Field type:', field.type);
        console.log('Field optionsSource:', field.optionsSource);

        if (field.type === 'select' && field.optionsSource?.type === 'api') {
          const { url, valueKey, labelKey } = field.optionsSource;

          console.log('➡️ API URL:', url);
          console.log('➡️ valueKey:', valueKey);
          console.log('➡️ labelKey:', labelKey);

          this.http.get<any>(url).subscribe({
            next: (data) => {
              console.log('✅ RAW API RESPONSE:', data);
              console.log('Is Array?', Array.isArray(data));

              const list = Array.isArray(data) ? data : [data];

              console.log('Normalized list:', list);

              this.selectOptionsMap[field.id] = list.map((item, index) => {
                const value = item[valueKey];
                const label = item[labelKey];

                console.log(`Option[${index}] raw:`, item);
                console.log(`Option[${index}] mapped → value:`, value, 'label:', label);

                return {
                  value,
                  label
                };
              });

              console.log(
                `✅ FINAL OPTIONS for "${field.id}":`,
                this.selectOptionsMap[field.id]
              );
            },
            error: (err) => {
              console.error(`❌ API ERROR for field "${field.id}"`, err);
              this.selectOptionsMap[field.id] = [];
            }
          });
        } else {
          console.log('ℹ️ Field is not API-based select');
        }

        console.groupEnd();
      });

      console.groupEnd();
    });

    console.groupEnd();
  }

  getAction(actionId: string) {
    return this.formConfig.actions?.find((a: any) => a.id === actionId) || {};
  }

  async save() {
    try {
      // Validate required fields
      if (!this.validateForm()) {
        return;
      }

      this.isLoading = true;

      // Show loading alert
      Swal.fire({
        title: 'Saving...',
        text: 'Please wait while we save the project',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Generate unique ID if not in edit mode
      if (!this.isEditMode) {
        this.form.id = this.generateUniqueId();
        this.form.createdAt = new Date().toISOString();
      }
      this.form.updatedAt = new Date().toISOString();

      console.log('✅ Project Payload:', this.form);

      // Read API endpoints from JSON config
      const apiEndpoints = this.formConfig.apiEndpoints || {};

      let apiUrl: string;
      let method: 'post' | 'put';

      if (this.isEditMode && this.projectId) {
        apiUrl = apiEndpoints.update?.replace('{id}', this.projectId) ||
          `http://localhost:3000/projects/${this.projectId}`;
        method = 'put';
      } else {
        apiUrl = apiEndpoints.create || 'http://localhost:3000/projects';
        method = 'post';
      }

      let response;
      if (method === 'post') {
        response = await this.http.post(apiUrl, this.form).toPromise();
      } else {
        response = await this.http.put(apiUrl, this.form).toPromise();
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Project ${this.isEditMode ? 'updated' : 'saved'} successfully!`,
        confirmButtonColor: '#451111',
        timer: 2000,
        timerProgressBar: true
      }).then(() => {
        this.router.navigate(['/projects']);
      });

    } catch (error: any) {
      console.error('❌ Error saving project:', error);

      let errorMessage = 'Error saving project. Please try again.';
      if (error.status === 400) {
        errorMessage = 'Invalid data. Please check your inputs.';
      } else if (error.status === 409) {
        errorMessage = 'A project with this code already exists.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: errorMessage,
        confirmButtonColor: '#451111'
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
      confirmButtonColor: '#451111',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No, keep editing'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/projects']);
      }
    });
  }

  private validateForm(): boolean {
    const requiredFields = this.getRequiredFields();
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!this.form[field.id] || this.form[field.id].toString().trim() === '') {
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
        confirmButtonColor: '#451111'
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

  private generateUniqueId(): string {
    return 'proj-' + Math.random().toString(36).substr(2, 9);
  }
}