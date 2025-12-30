import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonAtomComponent } from "../button/button";
@Component({
  selector: "atom-photo-upload",
  standalone: true,
  imports: [CommonModule, ButtonAtomComponent],
  templateUrl: "./photo-upload.html",
  styleUrls: ["./photo-upload.scss"]
})
export class PhotoUploadAtomComponent {

  @Input() label: string = "Photo";
  @Input() required: boolean = false;
  @Input() defaultImage?: string;
  @Input() maxSizeMB: number = 2;


 @Output() fileChange = new EventEmitter<File|null>();
@Output() upload = new EventEmitter<void>();
@Output() view = new EventEmitter<void>();
@Input() helperText?:string;

@Input() buttonText = {
  choose: "Choose Photo",
  upload: "Upload",
  view: "View"
};



previewUrl:string|null = null;
error:string|null = null;
@Input() formActions: any[] = []; // receive from parent JSON

getAction(id: string) {
  return this.formActions.find(a => a.id === id) || {};
}


selectFile(i:HTMLInputElement){ i.click(); }

onFileSelect(e:any){
  const file = e.target.files[0];
  if(!file) return;

  if(file.size > this.maxSizeMB*1024*1024){
    this.error=`Max ${this.maxSizeMB}MB allowed`; return;
  }

  this.error=null;
  this.fileChange.emit(file);

  const reader = new FileReader();
  reader.onload = ()=> this.previewUrl = reader.result as string;
  reader.readAsDataURL(file);
}
}