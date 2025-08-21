import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private http = inject(HttpClient);

  email = '';
  password = '';

  errorMessage = '';

  validateUser(form: NgForm) {
    // Clear error message
    this.errorMessage = '';

    this.http
      .post('http://localhost:3000/api/auth', {
        email: form.value.email,
        password: form.value.password,
      })
      .subscribe({
        next: (response: any) => {
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
