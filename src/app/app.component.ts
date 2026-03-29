import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { FcmService } from './core/services/fcm.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- FCM ALERTS TOAST -->
    <div *ngIf="fcm.toastMessage() as msg" class="toast-notification">
       <div class="toast-title">🔔 {{msg.title}}</div>
       <div class="toast-body">{{msg.body}}</div>
    </div>

    <nav class="app-nav">
      <div class="nav-brand">
        <span style="font-size: 1.4rem;">⬡</span> LMS Nexus
      </div>

      <div class="nav-right">
        <ng-container *ngIf="auth.currentUser() as user; else noAuth">
          
          <div class="nav-links mr-4" style="margin-right: 1.5rem;">
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Dashboard</a>
            <a *ngIf="user.roleName === 'Architect' || user.roleName === 'System Designer'" routerLink="/architect/builder" routerLinkActive="active" class="nav-link">Builder Engine</a>
          </div>

          <!-- NOTIFICATION INBOX BELL -->
          <div style="position: relative;">
             <button class="notif-bell-btn" (click)="showInbox = !showInbox">
               <span style="font-size: 1.1rem;">🔔</span>
               <span *ngIf="fcm.notificationsHistory().length > 0" class="notif-badge">
                 {{fcm.notificationsHistory().length > 99 ? '99+' : fcm.notificationsHistory().length}}
               </span>
             </button>
             
             <!-- DROPDOWN PANE MAP -->
             <div *ngIf="showInbox" class="notif-dropdown">
                <div class="notif-header">
                   <h4>Notification Inbox</h4>
                   <button class="btn btn-secondary btn-sm" (click)="fcm.syncHistory()">Sync ↻</button>
                </div>
                <div *ngIf="fcm.notificationsHistory().length === 0" class="notif-empty">
                   No notifications.<br>You're all caught up!
                </div>
                <div *ngFor="let n of fcm.notificationsHistory()" class="notif-item">
                   <div class="notif-title">{{n.title}}</div>
                   <div class="notif-body">{{n.body}}</div>
                   <div class="notif-time">{{n.created_at | date:'mediumTime'}}</div>
                </div>
             </div>
          </div>

          <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.1); margin: 0 0.5rem;"></div>

          <div class="nav-user-info">
            <span class="user-name">{{user.name}}</span>
            <span class="user-meta">
               <span class="role-badge"
                  [ngClass]="{
                     'badge-architect': user.roleName === 'Architect',
                     'badge-designer': user.roleName === 'System Designer',
                     'badge-engineer': user.roleName === 'System Engineer',
                     'badge-trainee': user.roleName === 'Trainee',
                     'badge-default': !['Architect', 'System Designer', 'System Engineer', 'Trainee'].includes(user.roleName)
                  }">
                  {{user.roleName}}
               </span>
            </span>
          </div>
          <button (click)="logout()" class="btn btn-secondary btn-sm" style="margin-left: 0.5rem;" title="Logout">
             <span style="font-size: 1rem;">⇥</span>
          </button>
        </ng-container>

        <ng-template #noAuth>
          <a routerLink="/login" class="btn btn-secondary btn-sm">Login</a>
          <a routerLink="/register" class="btn btn-primary btn-sm mx-2">Register</a>
        </ng-template>
      </div>
    </nav>
    <main class="page-content">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent implements OnInit {
  showInbox = false;

  constructor(public auth: AuthService, public fcm: FcmService) {
      effect(() => {
         if (this.auth.currentUser()) {
            this.fcm.requestPermission();
         }
      });
  }

  ngOnInit() {
    this.auth.checkAuth().subscribe();
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
