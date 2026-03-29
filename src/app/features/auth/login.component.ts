import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex items-center" style="justify-content: center; min-height: 80vh;">
      <div class="glass-card" style="width: 100%; max-width: 400px;">
        <h2 class="text-center mb-4">LMS Nexus Login</h2>
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" [(ngModel)]="credentials.email" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" [(ngModel)]="credentials.password" required>
          </div>
          <div class="text-danger mb-4" *ngIf="errorMessage">{{errorMessage}}</div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Sign In</button>
        </form>
        <div class="text-center mt-4">
          <a routerLink="/register">Don't have an account? Register</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.auth.login(this.credentials).subscribe({
      next: (res: any) => {
        // Simple routing redirect on successful auth
        if (res.user.roleName === 'Architect') {
             // Let architect go to dashboard, or they can navigate directly to review URLs
             this.router.navigate(['/dashboard']);
        } else {
             this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.errorMessage = err.error?.error || 'Login failed - Check Credentials';
      }
    });
  }
}
