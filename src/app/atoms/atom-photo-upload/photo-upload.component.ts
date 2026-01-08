import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ButtonAtomComponent } from "../button/button";

@Component({
  selector: "atom-photo-upload",
  standalone: true,
  imports: [CommonModule, ButtonAtomComponent],
  templateUrl: "./photo-upload.html",
  styleUrls: ["./photo-upload.scss"]
})
export class PhotoUploadAtomComponent {
@Input() defaultImage?: string;

  /* ------------ INPUTS ------------ */
  @Input() label = "Upload File";
  @Input() required = false;
  @Input() helperText?: string;
  @Input() maxSizeMB = 2;
@Input() accept = "image/*,application/pdf,.doc,.docx";
  @Input() buttons: any[] = [];

  /* ------------ OUTPUTS ------------ */
  @Output() fileChange = new EventEmitter<string>();
  @Output() upload = new EventEmitter<void>();
  @Output() view = new EventEmitter<void>();

  /* ------------ STATE ------------ */
  previewUrl: string | null = null;          // image + doc
  safePdfUrl: SafeResourceUrl | null = null; // pdf only
  previewType: "image" | "pdf" | "doc" | null = null;
  fileName = "";
  error: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
  if (!this.defaultImage) return;

  if (this.defaultImage.startsWith('data:application/pdf')) {
    this.previewType = 'pdf';
    this.safePdfUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(this.defaultImage);
  } else {
    this.previewType = 'image';
    this.previewUrl = this.defaultImage;
  }
}

  /* ------------ FILE SELECT ------------ */
  selectFile(input: HTMLInputElement) {
    input.click();
  }

  onFileSelect(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;

    /* size check */
    if (file.size > this.maxSizeMB * 1024 * 1024) {
      this.error = `Max ${this.maxSizeMB}MB allowed`;
      return;
    }

    this.error = null;
    this.fileName = file.name;

    /* reset first (VERY IMPORTANT) */
    this.previewUrl = null;
    this.safePdfUrl = null;
    this.previewType = null;

    /* detect type */
    if (file.type.startsWith("image/")) {
      this.previewType = "image";
    } else if (file.type === "application/pdf") {
      this.previewType = "pdf";
    } else {
      this.previewType = "doc";
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;

      if (this.previewType === "pdf") {
        this.safePdfUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(base64);
      } else {
        this.previewUrl = base64;
      }

      this.fileChange.emit(base64);
    };

    reader.readAsDataURL(file);
  }

  /* ------------ VIEW HANDLER ------------ */
  onView() {
    if (this.previewType === "doc" && this.previewUrl) {
      const a = document.createElement("a");
      a.href = this.previewUrl;
      a.download = this.fileName;
      a.click();
      return;
    }

    this.view.emit();
  }

  /* ------------ BUTTON CONFIG ------------ */
  getButtonConfig(id: string) {
    return this.buttons?.find(b => b.id === id) || {};
  }
}
