import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router,RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environment';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  imports: [CommonModule, RouterModule]
})
export class EmployeeDetailsComponent implements OnInit {
  employee: any;
  loading = true;
  today: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.fetchEmployeeDetails(id);
  }

  fetchEmployeeDetails(id: string | null) {
    if (!id) {
      this.goBack();
      return;
    }

    this.http
      .get(`${environment.API_BASE}/employees/${id}`)
      .subscribe({
        next: (res) => {
          this.employee = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  // Update the goBack method to use the absolute path
  goBack() {
    this.router.navigate(['/hr/employees']);
  }

  // If you want to use the Edit button to go to the add-employee page (often used for editing too)
  editProfile() {
    this.router.navigate(['/hr/add-employee'], { queryParams: { id: this.employee.id } });
  }

  viewDocument() {
    // If the document is stored as a base64 string or a URL
    if (this.employee.certificateUrl) {
      window.open(this.employee.certificateUrl, '_blank');
    } else if (this.employee.certificateBase64) {
      const link = document.createElement('a');
      link.href = this.employee.certificateBase64;
      link.target = '_blank';
      link.click();
    } else {
      alert('No digital certificate found for this record.');
    }
  }

  printProfile() {
    window.print();
  }
}