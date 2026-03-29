import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex items-center" style="justify-content: center; min-height: 80vh;">
      <div class="glass-card" style="width: 100%; max-width: 400px;">
        <h2 class="text-center mb-4">LMS Nexus Register</h2>
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" [(ngModel)]="userData.name" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" [(ngModel)]="userData.email" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" [(ngModel)]="userData.password" required>
          </div>
          <div class="form-group">
            <label>Desired Application Role</label>
            <select name="role_name" [(ngModel)]="userData.role_name">
              <option value="System Engineer">System Engineer</option>
              <option value="System Designer">System Designer</option>
            </select>
          </div>
          <div class="text-danger mb-4" *ngIf="errorMessage">{{errorMessage}}</div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Create Account</button>
        </form>
        <div class="text-center mt-4">
          <a routerLink="/login">Already have an account? Login here</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  userData = { name: '', email: '', password: '', role_name: 'System Engineer' };
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.auth.register(this.userData).subscribe({
      next: () => {
         // Auto redirect to login queue
         this.router.navigate(['/login']);
      },
      error: (err: any) => {
          this.errorMessage = err.error?.error || 'Registration processing failed';
      }
    });
  }
}
