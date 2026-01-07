import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonAtomComponent } from "../button/button";

@Component({
  selector: "atom-photo-upload",
  standalone: true,
  imports: [CommonModule, ButtonAtomComponent],
  templateUrl: "./photo-upload.html",
  styleUrls: ["./photo-upload.scss"]
})
export class PhotoUploadAtomComponent implements OnInit, OnChanges {
  @Input() label: string = "Photo";
  @Input() required: boolean = false;
  @Input() defaultImage?: string;
  @Input() maxSizeMB: number = 2;
  
  // New input for button configuration
  @Input() buttons: any[] = [];
  
  @Output() fileChange = new EventEmitter<string | null>(); 

  @Output() upload = new EventEmitter<void>();
  @Output() view = new EventEmitter<void>();
  @Input() helperText?: string;

  // Keep buttonText for backward compatibility
  @Input() buttonText = {
    choose: "Choose Photo",
    upload: "Upload",
    view: "View"
  };

  previewUrl: string | null = null;
  error: string | null = null;

  ngOnInit(): void {
    // Initialize previewUrl from defaultImage when component loads
    if (this.defaultImage) {
      console.log('📷 PhotoUploadComponent: Setting previewUrl from defaultImage');
      this.previewUrl = this.defaultImage;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Update previewUrl when defaultImage changes
    if (changes['defaultImage'] && changes['defaultImage'].currentValue) {
      console.log('📷 PhotoUploadComponent: defaultImage changed, updating previewUrl');
      this.previewUrl = changes['defaultImage'].currentValue;
    }
  }

  // Helper method to get button config by id
  getButtonConfig(id: string) {
    return this.buttons?.find(btn => btn.id === id) || {
      label: this.buttonText[id === 'photoSelect' ? 'choose' : 
                            id === 'photoUpload' ? 'upload' : 'view'],
      variant: id === 'photoSelect' ? 'outlineSecondary' : 
               id === 'photoUpload' ? 'primary' : 'secondary',
      size: 'sm'
    };
  }

  selectFile(i: HTMLInputElement) { i.click(); }

  onFileSelect(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > this.maxSizeMB * 1024 * 1024) {
      this.error = `Max ${this.maxSizeMB}MB allowed`;
      return;
    }

    this.error = null;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.previewUrl = base64;
      this.fileChange.emit(base64); // ✅ BASE64 ONLY
    };
    reader.readAsDataURL(file);
  }
}