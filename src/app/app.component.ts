import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="glass-panel" style="display: flex; justify-content: space-between; padding: 1rem 2rem; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div style="font-weight: 700; font-size: 1.25rem;">LMS Nexus</div>
      <div class="flex items-center" style="gap: 1rem;">
        <ng-container *ngIf="auth.currentUser() as user; else noAuth">
          <span style="font-weight: 500; font-size: 0.9rem; color: var(--text-secondary);">
            {{user.name}} • {{user.levelName}} ({{user.roleName}})
          </span>
          <button (click)="logout()" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">Logout</button>
        </ng-container>
        <ng-template #noAuth>
          <a routerLink="/login" style="font-size: 0.9rem; font-weight: 500;">Login</a>
        </ng-template>
      </div>
    </nav>
    <main style="max-width: 1200px; margin: 2rem auto; padding: 0 1rem;">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent implements OnInit {
  constructor(public auth: AuthService) {}

  ngOnInit() {
    this.auth.checkAuth().subscribe();
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
