import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    // Check for account creation success
    this.route.queryParams.subscribe((params) => {
      if (params['accountCreated'] === 'true') {
        this.successMessage = 'Account created successfully! Please log in.';
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });
      }
    });
  }

  goToSignup(): void {
    this.router.navigate(['register']);
  }

  validateUser(form: NgForm) {
    this.errorMessage = '';
    this.successMessage = '';

    this.http
      .post('http://localhost:3000/api/auth', {
        email: form.value.email,
        password: form.value.password,
      })
      .subscribe({
        next: (response: any) => {
          if (response.banned === true) {
            this.errorMessage = 'Your account is banned';
            return;
          }
          if (response.valid) {
            localStorage.setItem('user', JSON.stringify(response));

            this.router.navigate(['']);
          } else {
            this.errorMessage = 'Invalid username or password';
          }
        },
        error: (error) => {
          console.error('Login Error:', error);
          this.errorMessage = 'Login failed. Please try again.';
        },
      });
  }
}
