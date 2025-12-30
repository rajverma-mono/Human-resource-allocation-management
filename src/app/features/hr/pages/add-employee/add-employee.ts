import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import formJson from './add-employee.form.json';

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

  activeStep = 0;
  stepperSteps:any[] = [];

  constructor() {
    console.log("🟢 JSON Loaded:", this.formConfig);

    // create stepper labels dynamically from sections
// If JSON has stepper -> use it | else fallback to sections.title
this.stepperSteps = this.formConfig.stepper?.length
  ? this.formConfig.stepper.map((step:any, index:number) => ({
      label: this.formConfig.sections[index]?.title,  // show section title
      key: step.key
    }))
  : this.formConfig.sections.map((s:any)=>({ label:s.title }));

    // initialize form
    this.formConfig.sections.forEach((section:any)=>{
      if(section.fields){
        section.fields.forEach((f:any)=>this.form[f.id]=f.default ?? '');
      }
    });
    this.experienceList.push(this.createExperienceBlock());
  }

  createExperienceBlock(){
    const block:any = {};
    let exp = this.formConfig.sections.find((s:any)=>s.title==="Work Experience");
    exp.experienceForm.forEach((f:any)=>block[f.id]='');
    return block;
  }

  addExperience(){ this.experienceList.push(this.createExperienceBlock()) }
  removeExperience(i:number){ this.experienceList.splice(i,1) }

  // navigation
  nextStep(){ if(this.activeStep < this.stepperSteps.length-1) this.activeStep++; }
  prevStep(){ if(this.activeStep > 0) this.activeStep--; }
  goToStep(i:number){ this.activeStep=i }  // (if later you enable click stepper)

  save(){
    console.log("✨ Final Submitted:",{
      ...this.form,
      experience:this.experienceList
    });
    alert("Employee Saved Successfully!");
  }

  cancel(){
    Object.keys(this.form).forEach(k=>this.form[k]='');
    this.experienceList=[this.createExperienceBlock()];
  }

  handleButton(actionId:string){
    const map:any={
      save:()=>this.save(),
      cancel:()=>this.cancel(),
      addExperience:()=>this.addExperience()
    };
    map[actionId]?.();
  }
}
