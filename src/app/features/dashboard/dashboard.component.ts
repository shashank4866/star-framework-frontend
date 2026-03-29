import { Component, OnInit, effect, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HierarchyService } from '../../core/services/hierarchy.service';
import { AssessmentService } from '../assessment/assessment.service';
import { ArchitectService } from '../architect/architect.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard-container">
      
      <div class="glass-panel p-4 mb-4" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border-left: 4px solid var(--accent-primary);">
        <h2>Welcome to your LMS Journey</h2>
        <p class="text-secondary" *ngIf="auth.currentUser() as u">
          Your current progress level: <strong class="text-primary-color">{{u.levelName}}</strong>
        </p>
      </div>

      <!-- INITIAL LOADING STATE -->
      <div *ngIf="isLoading()" class="loading-center glass-card mt-4">
         <div class="spinner spinner-lg"></div>
         <p>Synchronizing your dashboard...</p>
      </div>

      <ng-container *ngIf="!isLoading()">
          <!-- ARCHITECT EVALUATION QUEUE & TOOLS -->
          <!-- We restrict this purely to Architect to prevent users from reviewing/evaluating -->
          <div class="glass-card mb-4" *ngIf="auth.currentUser()?.roleName === 'Architect'" style="border-top: 3px solid var(--accent-primary);">
             <div class="section-header">
                <h3>Architect Evaluation Queue</h3>
             </div>
             
             <div *ngIf="isLoadingArch()" class="text-center p-3"><div class="spinner"></div></div>

             <div class="overflow-hidden" style="border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05);" *ngIf="!isLoadingArch() && pendingReviews().length > 0">
                 <table class="data-table">
                    <thead>
                       <tr>
                          <th>Candidate</th>
                          <th>Assessment</th>
                          <th>Level</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th>Action</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr *ngFor="let p of pendingReviews()">
                          <td>
                             <div style="font-weight: 500;">{{p.user_name}}</div>
                             <div class="text-muted" style="font-size: 0.75rem;">{{p.user_email}}</div>
                          </td>
                          <td>{{p.assessment_title}}</td>
                          <td><span class="badge-default role-badge" style="font-size: 0.65rem;">{{p.level_name}}</span></td>
                          <td>{{p.start_time | date:'MMM d, shortTime'}}</td>
                          <td>
                             <!-- Status Badges -->
                             <span *ngIf="p.status === 'pending_review'" class="status-badge status-pending">Awaiting Review</span>
                             <span *ngIf="p.status === 'evaluated'" class="status-badge status-evaluated">Evaluated ({{p.total_score}})</span>
                             <span *ngIf="p.status === 'in_progress'" class="status-badge status-progress">In Progress</span>
                             <span *ngIf="p.status === 'submitted'" class="status-badge status-submitted">Ready</span>
                          </td>
                          <td>
                             <button class="btn btn-primary btn-sm" (click)="router.navigate(['/architect/review', p.attempt_id])" *ngIf="p.status !== 'evaluated'">Evaluating Engine</button>
                             <button class="btn btn-secondary btn-sm" (click)="router.navigate(['/architect/review', p.attempt_id])" *ngIf="p.status === 'evaluated'">View Log</button>
                          </td>
                       </tr>
                    </tbody>
                 </table>
             </div>
             <div *ngIf="!isLoadingArch() && pendingReviews().length === 0" class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-title">Inbox Zero!</div>
                <div class="empty-sub">No assessments currently pending review.</div>
             </div>
          </div>

          <!-- ARCHITECT GLOBAL USER MATRIX (Dispatching Badges) -->
          <div class="glass-card mb-4" *ngIf="auth.currentUser()?.roleName === 'Architect'" style="border-top: 3px solid var(--accent-success);">
             <div class="section-header">
                <h3 class="text-success">Global User Matrix (Badge Dispatch)</h3>
             </div>
             
             <div *ngIf="isLoadingArch()" class="text-center p-3"><div class="spinner"></div></div>

             <div class="overflow-hidden" style="border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05);" *ngIf="!isLoadingArch() && globalUsers().length > 0">
                 <table class="data-table">
                    <thead>
                       <tr>
                          <th>Candidate</th>
                          <th>Level</th>
                          <th>Delegation Control</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr *ngFor="let u of globalUsers()">
                          <td>
                             <div style="font-weight: 500;">{{u.name}}</div>
                             <div class="text-muted" style="font-size: 0.75rem;">{{u.email}}</div>
                          </td>
                          <td><span class="role-badge badge-default">{{u.level_name}}</span></td>
                          <td>
                             <button class="btn btn-success btn-sm" (click)="dispatchBadge(u.id, u.name)">Award Custom Badge</button>
                          </td>
                       </tr>
                    </tbody>
                 </table>
             </div>
             <div *ngIf="!isLoadingArch() && globalUsers().length === 0" class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-title">No Active Users</div>
                <div class="empty-sub">No active users found traversing hierarchy tree.</div>
             </div>
          </div>

          <!-- TRAINEE BADGE REGISTRY -->
          <div class="glass-card mb-4" *ngIf="myBadges().length > 0" style="border-top: 3px solid #fbbf24; background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), transparent);">
             <div class="section-header" style="border-bottom-color: rgba(251, 191, 36, 0.2);">
                <h3 style="color: #fbbf24;">🏅 Your Earned Badges</h3>
             </div>
             <div class="flex flex-wrap" style="gap: 1.5rem;">
                <div *ngFor="let b of myBadges()" class="glass-panel text-center" style="border: 1px solid rgba(251, 191, 36, 0.4); padding: 1.5rem 1rem; border-radius: 12px; width: 140px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(0,0,0,0.2); box-shadow: 0 4px 15px rgba(251, 191, 36, 0.15);">
                   <div style="font-size: 2.5rem; text-shadow: 0 0 10px rgba(251,191,36,0.5); margin-bottom: 0.5rem;">🏆</div>
                   <div style="font-size: 0.8rem; font-weight: 700; color: #fbbf24; line-height: 1.2;">{{b.badge_name}}</div>
                   <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem;">By {{b.architect_name || 'Architect'}}</div>
                </div>
             </div>
          </div>

          <!-- HIERARCHY LEARNING ENGINE -->
          <div class="hierarchy-view flex flex-wrap" style="gap: 1.5rem; align-items: flex-start;">
            
            <!-- POWERS COLUMN -->
            <div class="glass-card" style="flex: 1; min-width: 250px; padding: 1.25rem;">
              <h3 class="mb-3" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Powers</h3>
              <div *ngIf="powers().length === 0" class="empty-state p-2">
                 <div class="empty-sub">No powers configured for your level.</div>
              </div>
              <div *ngFor="let p of powers()" 
                   class="btn mb-3 text-center w-full" 
                   [ngClass]="p.id === selectedPower()?.id ? 'btn-primary' : 'btn-secondary'"
                   (click)="selectPower(p)">
                {{p.name}} <span *ngIf="p.is_completed" style="color: var(--accent-success); margin-left: 5px;">✓</span>
              </div>
            </div>

            <!-- CAPABILITIES COLUMN -->
            <div class="glass-card" style="flex: 1; min-width: 250px; padding: 1.25rem;" *ngIf="selectedPower()">
              <h3 class="mb-3" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Capabilities</h3>
              <div *ngIf="isLoadingCapabilities()" class="text-center p-3"><div class="spinner"></div></div>
              <div *ngIf="!isLoadingCapabilities() && capabilities().length === 0" class="empty-state p-2">
                 <div class="empty-sub">No capabilities mapped yet.</div>
              </div>
              <div *ngFor="let c of capabilities()" 
                   class="btn mb-3 text-center w-full" 
                   [ngClass]="c.id === selectedCapability()?.id ? 'btn-primary' : 'btn-secondary'"
                   (click)="selectCapability(c)">
                {{c.name}}
              </div>
            </div>

            <!-- TASKS COLUMN -->
            <div class="glass-card" style="flex: 1; min-width: 250px; padding: 1.25rem;" *ngIf="selectedCapability()">
              <h3 class="mb-3" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Tasks</h3>
              <div *ngIf="isLoadingTasks()" class="text-center p-3"><div class="spinner"></div></div>
              <div *ngIf="!isLoadingTasks() && tasks().length === 0" class="empty-state p-2">
                 <div class="empty-sub">No tasks configured.</div>
              </div>
              <div *ngFor="let t of tasks()" 
                   class="btn mb-3 text-center w-full" 
                   [ngClass]="t.id === selectedTask()?.id ? 'btn-primary' : 'btn-secondary'"
                   (click)="selectTask(t)">
                {{t.name}}
              </div>
            </div>

            <!-- SUBTASKS / ASSESSMENTS COLUMN -->
            <div class="glass-card" style="flex: 1.5; min-width: 300px; padding: 1.25rem;" *ngIf="selectedTask()">
              <h3 class="mb-3" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Subtasks</h3>
              <div *ngIf="isLoadingSubtasks()" class="text-center p-3"><div class="spinner"></div></div>
              <div *ngIf="!isLoadingSubtasks() && subtasks().length === 0" class="empty-state p-2">
                 <div class="empty-sub">No subtasks found for this task.</div>
              </div>
              
              <div *ngFor="let s of subtasks()" class="glass-panel p-4 mb-3" style="border-color: rgba(59, 130, 246, 0.25);">
                <div class="flex justify-between items-center gap-2">
                  <div style="flex: 1; min-width: 150px;">
                    <strong style="font-size: 1.05rem;">{{s.name}}</strong>
                    
                    <div *ngIf="s.is_completed" class="mt-2 text-success flex items-center gap-1" style="font-size: 0.85rem; font-weight: 500;">
                       <span>✓ Successfully Evaluated</span>
                    </div>
                    
                    <!-- Attempt Status Badges -->
                    <div *ngIf="!s.is_completed && s.latest_attempt_status === 'pending_review'" class="mt-2" style="font-size: 0.85rem;">
                       <span class="status-badge status-pending">Under Architectural Review...</span>
                    </div>
                    
                    <div *ngIf="s.latest_attempt_status === 'evaluated' && !s.is_completed" class="mt-2 alert-error">
                       <i>Evaluation completed, but requirements were not met. You may need to retake this.</i>
                    </div>
                    
                    <!-- Current Score Vis -->
                    <div *ngIf="s.latest_attempt_score !== null" class="mt-2 p-2" style="font-size: 0.8rem; background: rgba(0,0,0,0.2); border-radius: 4px; display: inline-block;">
                       <strong>Latest Score:</strong> <span class="text-primary-color">{{s.latest_attempt_score}}</span>
                    </div>
                  </div>
                  
                  <!-- Conditional Render on Launch button -->
                  <div class="flex flex-col gap-2" style="min-width: 140px;">
                    <ng-container *ngIf="s.assessment_id">
                        <ng-container *ngIf="!s.is_completed">
                            <button class="btn btn-primary btn-sm w-full" 
                                    *ngIf="s.latest_attempt_status !== 'pending_review' && s.latest_attempt_status !== 'evaluated'"
                                    (click)="startAssessment(s.assessment_id)">
                               ▶ Launch Engine
                            </button>
                            
                            <!-- Locked View -->
                            <button class="btn btn-secondary btn-sm w-full"
                                    *ngIf="s.latest_attempt_status === 'pending_review'"
                                    disabled>
                               🔒 Locked (Review)
                            </button>
                        </ng-container>

                        <!-- Badge Progress Lookup Button -->
                        <button class="btn btn-secondary btn-sm w-full"
                                *ngIf="s.latest_attempt_status === 'evaluated'"
                                (click)="viewBadgeProgress(s.latest_attempt_id)">
                           View Feedback
                        </button>
                    </ng-container>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </ng-container>

      <!-- BADGE PROGRESS MODAL -->
      <div *ngIf="badgeFeedback()" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 1rem;">
         <div class="glass-panel" style="width: 100%; max-width: 650px; max-height: 85vh; display: flex; flex-direction: column; border-top: 4px solid var(--accent-success); box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
            <div class="flex justify-between items-center p-4" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
               <h2 style="margin: 0;">Evaluation Feedback</h2>
               <button class="btn btn-secondary btn-sm" style="padding: 0.4rem 0.6rem;" (click)="closeBadgeModal()">✕</button>
            </div>
            
            <div style="overflow-y: auto; padding: 1.5rem;">
               <div class="mb-4 p-4" style="background: rgba(16, 185, 129, 0.05); border-left: 3px solid var(--accent-success); border-radius: 0 8px 8px 0;">
                  <h4 class="flex items-center gap-2">Final Subjective Grade: <span style="font-size: 1.8rem; color: var(--accent-success)">{{badgeFeedback().attempt.total_score}}</span></h4>
                  
                  <div *ngIf="badgeFeedback().review" class="mt-3 pt-3" style="border-top: 1px solid rgba(16,185,129,0.2);">
                    <p class="text-secondary mb-1" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Architect's Synthesis:</p>
                    <p style="white-space: pre-wrap; margin: 0; font-style: italic; color: #e2e8f0; line-height: 1.6;">"{{badgeFeedback().review.overall_feedback || 'No overall comments provided by Architect.'}}"</p>
                  </div>
               </div>

               <h4 class="mb-3 text-secondary" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">Per-Question Breakdown</h4>
               <div *ngIf="badgeFeedback().feedback?.length === 0" class="empty-state p-4">No specific question feedback recorded.</div>
               
               <div *ngFor="let q of badgeFeedback().feedback; let i = index" class="mb-4 p-4 glass-card" style="background: rgba(0,0,0,0.3) !important;">
                  <p style="margin-bottom: 0.75rem; font-weight: 500;"><span class="text-primary-color" style="margin-right: 0.25rem;">Q{{i+1}}.</span> {{q.question_text}}</p>
                  
                  <div *ngIf="q.type === 'MCQ'">
                     <div class="flex items-center gap-2 mb-2">
                        <span class="role-badge badge-default" style="font-size: 0.6rem;">MCQ Auto-Graded</span>
                     </div>
                     <p style="margin: 0; font-size: 0.9rem;"><span [style.color]="q.grade > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'" style="font-weight: 600;">{{q.grade}} Marks Awarded</span></p>
                  </div>
                  
                  <div *ngIf="q.type !== 'MCQ'">
                     <div class="p-3 mb-3" style="background: rgba(15,23,42,0.6); border-radius: var(--radius-sm); font-family: monospace; font-size: 0.85rem; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.05);">
                        {{q.answer_text || 'No subjective answer provided by you.'}}
                     </div>
                     <div style="border-left: 2px solid var(--accent-secondary); padding-left: 1rem; margin-top: 0.5rem;">
                        <span style="color: var(--accent-success); font-weight: 700; font-size: 1.1rem;">{{q.grade}} Marks</span>
                        <div style="background: rgba(139, 92, 246, 0.05); padding: 0.75rem; border-radius: 6px; margin-top: 0.5rem;">
                           <span class="text-secondary" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 0.25rem;">Reviewer Feedback:</span>
                           <p style="margin: 0; font-style: italic; font-size: 0.9rem; color: #e2e8f0; line-height: 1.5;">"{{q.reviewer_feedback || 'No specific feedback left by Architect.'}}"</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  isLoading = signal(true);
  isLoadingArch = signal(false);
  
  isLoadingCapabilities = signal(false);
  isLoadingTasks = signal(false);
  isLoadingSubtasks = signal(false);

  powers = signal<any[]>([]);
  capabilities = signal<any[]>([]);
  tasks = signal<any[]>([]);
  subtasks = signal<any[]>([]);
  pendingReviews = signal<any[]>([]);
  globalUsers = signal<any[]>([]);
  myBadges = signal<any[]>([]);
  
  selectedPower = signal<any>(null);
  selectedCapability = signal<any>(null);
  selectedTask = signal<any>(null);

  badgeFeedback = signal<any>(null);

  constructor(
    private hierarchy: HierarchyService, 
    private assessment: AssessmentService,
    private archSvc: ArchitectService,
    public auth: AuthService,
    public router: Router,
    private http: HttpClient
  ) {
      // Use effect to precisely handle async data fetch linked to user roles!
      effect(() => {
          const user = this.auth.currentUser();
          if (user !== undefined && user !== null) {
              this.loadUserData(user);
          } else if (user === null) {
              this.isLoading.set(false);
          }
      }, { allowSignalWrites: true });
  }

  ngOnInit() {
      // Async requests handled proactively by effect
  }

  loadUserData(user: any) {
    this.hierarchy.getPowers().subscribe({
      next: (res) => {
          this.powers.set(res);
          this.isLoading.set(false);
      },
      error: () => {
          this.isLoading.set(false);
          console.error('Failed fetching hierarchy data');
      }
    });
    
    // Architect specific views exclusively for that role
    if (user.roleName === 'Architect') {
       this.isLoadingArch.set(true);
       
       this.archSvc.getPendingReviews().subscribe({
          next: (res) => this.pendingReviews.set(res),
          error: () => console.error('Failed fetching Architect Queue')
       });

       this.http.get<any[]>(`${environment.apiUrl}/architect/users`, { withCredentials: true }).subscribe({
          next: (res) => {
             this.globalUsers.set(res);
             this.isLoadingArch.set(false);
          },
          error: (err) => {
             console.error('Failed fetching Global Users', err);
             this.isLoadingArch.set(false);
          }
       });
    }

    // Load available badges for this user natively mapped within system
    this.http.get<any[]>(`${environment.apiUrl}/progress/badges`, { withCredentials: true }).subscribe({
      next: (res) => this.myBadges.set(res),
      error: (err) => console.log('Badges not available or error internally', err)
    });
  }

  selectPower(p: any) {
    this.selectedPower.set(p);
    this.selectedCapability.set(null);
    this.selectedTask.set(null);
    this.capabilities.set([]);
    this.tasks.set([]);
    this.subtasks.set([]);

    this.isLoadingCapabilities.set(true);
    this.hierarchy.getCapabilities(p.id).subscribe({
      next: res => { this.capabilities.set(res); this.isLoadingCapabilities.set(false); },
      error: () => this.isLoadingCapabilities.set(false)
    });
  }

  selectCapability(c: any) {
    this.selectedCapability.set(c);
    this.selectedTask.set(null);
    this.tasks.set([]);
    this.subtasks.set([]);

    this.isLoadingTasks.set(true);
    this.hierarchy.getTasks(c.id).subscribe({
       next: res => { this.tasks.set(res); this.isLoadingTasks.set(false); },
       error: () => this.isLoadingTasks.set(false)
    });
  }

  selectTask(t: any) {
    this.selectedTask.set(t);
    this.subtasks.set([]);

    this.isLoadingSubtasks.set(true);
    this.hierarchy.getSubtasks(t.id).subscribe({
       next: res => { this.subtasks.set(res); this.isLoadingSubtasks.set(false); },
       error: () => this.isLoadingSubtasks.set(false)
    });
  }

  startAssessment(assessmentId: string) {
    this.assessment.startAttempt(assessmentId).subscribe({
      next: (res) => {
        // Persist end_time so the assessment component can restore it on refresh
        sessionStorage.setItem(`attempt_end_${res.attempt_id}`, res.end_time);
        this.router.navigate(['/assessment', res.attempt_id]);
      },
      error: () => alert('Failed to start assessment. You might have reached an attempt limit or are barred.')
    });
  }

  viewBadgeProgress(attemptId: string) {
     this.http.get<any>(`${environment.apiUrl}/progress/attempt/${attemptId}/feedback`, { withCredentials: true }).subscribe({
        next: (res) => {
            if(!res.feedback) res.feedback = [];
            this.badgeFeedback.set(res);
        },
        error: () => alert('Failed to resolve feedback mapping. It may be pending.')
     });
  }

  closeBadgeModal() {
     this.badgeFeedback.set(null);
  }

  dispatchBadge(userId: string, userName: string) {
     const badgeName = prompt(`You are directly dispensing a Badge to ${userName}!\n\nEnter Badge Name (e.g. "React Master"):`);
     if (badgeName && badgeName.trim().length > 0) {
        this.http.post<any>(`${environment.apiUrl}/architect/assign-badge`, { user_id: userId, badge_name: badgeName }, { withCredentials: true })
        .subscribe({
           next: () => alert(`FCM Notification Fired! Badge '${badgeName}' securely mounted to ${userName}!`),
           error: (err) => alert('Failed to dispense structural badge: ' + err.message)
        });
     }
  }
}
