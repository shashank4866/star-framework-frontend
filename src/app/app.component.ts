import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { FcmService } from './core/services/fcm.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <!-- FCM ALERTS TOAST -->
    <div *ngIf="fcm.toastMessage() as msg" style="position: fixed; top: 20px; right: 20px; z-index: 9999; background: var(--glass-bg); backdrop-filter: blur(10px); border: 1px solid var(--accent-success); border-radius: 8px; padding: 1rem 1.5rem; color: white; box-shadow: 0 8px 16px rgba(0,0,0,0.5);">
       <h4 style="margin: 0; color: var(--accent-success); font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">🔔 {{msg.title}}</h4>
       <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #ddd;">{{msg.body}}</p>
    </div>

    <nav class="glass-panel" style="display: flex; justify-content: space-between; padding: 1rem 2rem; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; z-index: 1000;">
      <div style="font-weight: 700; font-size: 1.25rem;">LMS Nexus</div>
      <div class="flex items-center" style="gap: 1rem;">
        <ng-container *ngIf="auth.currentUser() as user; else noAuth">
          
          <!-- NOTIFICATION INBOX BELL -->
          <div style="position: relative; margin-right: 10px;">
             <button class="btn" style="background: transparent; border: 1px solid rgba(59, 130, 246, 0.5); border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; cursor: pointer; position: relative;" (click)="showInbox = !showInbox">
               🔔
               <span *ngIf="fcm.notificationsHistory().length > 0" style="position: absolute; top: -5px; right: -5px; background: var(--accent-danger); color: white; font-size: 0.7rem; border-radius: 50%; padding: 2px 6px;">{{fcm.notificationsHistory().length}}</span>
             </button>
             
             <!-- DROPDOWN PANE MAP -->
             <div *ngIf="showInbox" class="glass-panel p-3" style="position: absolute; top: 50px; right: 0; width: 350px; max-height: 400px; overflow-y: auto; background: rgba(10, 15, 30, 0.95); border-color: rgba(59, 130, 246, 0.5); box-shadow: 0 10px 25px rgba(0,0,0,0.8);">
                <div class="flex justify-between items-center mb-2" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                   <h4 style="margin: 0; color: white;">Notification Inbox</h4>
                   <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" (click)="fcm.syncHistory()">Sync ↻</button>
                </div>
                <div *ngIf="fcm.notificationsHistory().length === 0" class="text-secondary text-center p-2" style="font-size: 0.85rem;">No offline pushes cached natively.</div>
                <div *ngFor="let n of fcm.notificationsHistory()" class="mb-2 p-2" style="background: rgba(0,0,0,0.6); border-radius: 6px; border-left: 3px solid var(--accent-primary);">
                   <div style="font-size: 0.9rem; font-weight: bold; color: var(--accent-primary);">{{n.title}}</div>
                   <div style="font-size: 0.8rem; color: #ddd; margin-top: 4px;">{{n.body}}</div>
                   <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px; text-align: right;">{{n.created_at | date:'short'}}</div>
                </div>
             </div>
          </div>

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
