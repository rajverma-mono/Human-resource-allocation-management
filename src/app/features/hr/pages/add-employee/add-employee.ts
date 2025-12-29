import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';   // <-- REQUIRED for *ngIf *ngFor ngClass

import formJson from './add-employee.form.json';

// ATOMS
import { InputAtomComponent } from '../../../../atoms/input/input';
import { SelectAtomComponent } from '../../../../atoms/select/select';
import { RadioGroupAtomComponent } from '../../../../atoms/radio-group/radio-group';
import { DatePickerAtomComponent } from '../../../../atoms/date-picker/date-picker';
import { TextAreaAtomComponent } from '../../../../atoms/textarea/textarea';
import { ButtonAtomComponent } from '../../../../atoms/button/button';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [
    CommonModule,                     // <-- FIX #1
    InputAtomComponent,
    SelectAtomComponent,
    RadioGroupAtomComponent,
    DatePickerAtomComponent,
    TextAreaAtomComponent,
    ButtonAtomComponent,
  ],
  templateUrl: './add-employee.html'
})
export class AddEmployeeComponent {

  formConfig = formJson;
  form: any = {};

 constructor() {
  console.log('🔍 RAW JSON FIELDS:');
  this.formConfig.fields.forEach((field, index) => {
    console.log(`Field ${index} - ${field.id}:`, {
      type: field.type,
      label: field.label,
      backgroundColor: field.backgroundColor,
      hasBgColor: 'backgroundColor' in field
    });
  });
  
  this.formConfig.fields.forEach(f => this.form[f.id] = f.default ?? '');
}

  save(){ console.log("Submitted => ", this.form); }
  cancel(){ Object.keys(this.form).forEach(key => this.form[key] = ''); }
}
