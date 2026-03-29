import { Component, OnInit, signal } from '@angular/core';
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
      <div class="glass-panel p-4 mb-4" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));">
        <h2>Welcome to your LMS Journey</h2>
        <p class="text-secondary" *ngIf="auth.currentUser() as u">Rank: {{u.levelName}} | Role: {{u.roleName}}</p>
      </div>

      <!-- ARCHITECT EVALUATION QUEUE & TOOLS -->
      <div class="glass-card mb-4" *ngIf="auth.currentUser()?.roleName === 'Architect' || auth.currentUser()?.roleName === 'System Designer'" style="border-color: var(--accent-primary);">
         <div class="flex justify-between items-center mb-4" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">
            <h3 style="margin: 0;">Evaluation Queue</h3>
            <button class="btn btn-primary" (click)="router.navigate(['/architect/builder'])">Course Builder Engine</button>
         </div>
         <table style="width: 100%; border-collapse: collapse; text-align: left;" *ngIf="pendingReviews().length > 0; else noReviews">
            <thead>
               <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <th style="padding: 1rem;">Candidate</th>
                  <th style="padding: 1rem;">Assessment Title</th>
                  <th style="padding: 1rem;">Level</th>
                  <th style="padding: 1rem;">Submitted At</th>
                  <th style="padding: 1rem;">Status</th>
                  <th style="padding: 1rem;">Action</th>
               </tr>
            </thead>
            <tbody>
               <tr *ngFor="let p of pendingReviews()" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 1rem;">{{p.user_name}} <br><span class="text-secondary" style="font-size: 0.8rem;">{{p.user_email}}</span></td>
                  <td style="padding: 1rem;">{{p.assessment_title}}</td>
                  <td style="padding: 1rem;">{{p.level_name}}</td>
                  <td style="padding: 1rem;">{{p.start_time | date:'short'}}</td>
                  <td style="padding: 1rem;">
                     <!-- Status Badges -->
                     <span *ngIf="p.status === 'pending_review'" style="color: var(--accent-warning);">Awaiting Review</span>
                     <span *ngIf="p.status === 'evaluated'" style="color: var(--accent-success);">Evaluated ({{p.total_score}})</span>
                     <span *ngIf="p.status === 'in_progress'" style="color: var(--accent-secondary);">In Progress</span>
                     <span *ngIf="p.status === 'submitted'" style="color: var(--accent-primary);">Ready</span>
                  </td>
                  <td style="padding: 1rem;">
                     <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem;" (click)="router.navigate(['/architect/review', p.attempt_id])" *ngIf="p.status !== 'evaluated'">Evaluating Engine</button>
                     <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; opacity: 0.6" (click)="router.navigate(['/architect/review', p.attempt_id])" *ngIf="p.status === 'evaluated'">View Log</button>
                  </td>
               </tr>
            </tbody>
         </table>
         <ng-template #noReviews>
            <p class="text-secondary p-4 text-center">No assessments currently pending review.</p>
         </ng-template>
      </div>

      <!-- ARCHITECT GLOBAL USER MATRIX -->
      <div class="glass-card mb-4" *ngIf="auth.currentUser()?.roleName === 'Architect' || auth.currentUser()?.roleName === 'System Designer'" style="border-color: var(--accent-success);">
         <div class="flex justify-between items-center mb-4" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">
            <h3 style="margin: 0; color: var(--accent-success);">Global User Matrix (Badge Dispatch)</h3>
         </div>
         <table style="width: 100%; border-collapse: collapse; text-align: left;" *ngIf="globalUsers().length > 0; else noUsers">
            <thead>
               <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <th style="padding: 1rem;">Candidate Name</th>
                  <th style="padding: 1rem;">Candidate Level</th>
                  <th style="padding: 1rem;">Delegation Control</th>
               </tr>
            </thead>
            <tbody>
               <tr *ngFor="let u of globalUsers()" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 1rem;">{{u.name}} <br><span class="text-secondary" style="font-size: 0.8rem;">{{u.email}}</span></td>
                  <td style="padding: 1rem;">{{u.level_name}}</td>
                  <td style="padding: 1rem;">
                     <button class="btn" style="background: var(--accent-success); color: white; padding: 0.4rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" (click)="dispatchBadge(u.id, u.name)">Award Custom Badge</button>
                  </td>
               </tr>
            </tbody>
         </table>
         <ng-template #noUsers>
            <p class="text-secondary p-4 text-center">No active users found traversing hierarchy tree.</p>
         </ng-template>
      </div>

      <!-- TRAINEE BADGE REGISTRY -->
      <div class="glass-card mb-4" *ngIf="auth.currentUser()?.roleName === 'Trainee' && myBadges().length > 0" style="border-color: #fbbf24; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), transparent);">
         <h3 style="margin: 0 0 1rem 0; color: #fbbf24;">🏅 Architect Delegated Badges</h3>
         <div class="flex" style="gap: 1rem; flex-wrap: wrap;">
            <div *ngFor="let b of myBadges()" class="glass-panel text-center" style="border: 1px solid rgba(251, 191, 36, 0.5); padding: 1rem; border-radius: 50%; width: 120px; height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
               <div style="font-size: 2rem;">🏆</div>
               <div style="font-size: 0.75rem; font-weight: bold; margin-top: 0.5rem; color: #fbbf24; line-height: 1.2;">{{b.badge_name}}</div>
               <div style="font-size: 0.6rem; color: var(--text-secondary); margin-top: 0.2rem;">by Architect</div>
            </div>
         </div>
      </div>

      <div class="hierarchy-view flex" style="gap: 2rem; align-items: flex-start;">
        
        <!-- POWERS COLUMN -->
        <div class="glass-card" style="flex: 1; padding: 1rem;">
          <h3 class="mb-4" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Powers</h3>
          <div *ngIf="powers().length === 0" class="text-muted text-center p-4">Loading your skills...</div>
          <div *ngFor="let p of powers()" 
               class="btn mb-4 text-center" 
               [ngClass]="p.id === selectedPower()?.id ? 'btn-primary' : 'btn-secondary'"
               style="width: 100%; display: block;"
               (click)="selectPower(p)">
            {{p.name}} <span *ngIf="p.is_completed" style="color: var(--accent-success);">✓</span>
          </div>
        </div>

        <!-- CAPABILITIES COLUMN -->
        <div class="glass-card" style="flex: 1; padding: 1rem;" *ngIf="selectedPower()">
          <h3 class="mb-4" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Capabilities</h3>
           <div *ngIf="capabilities().length === 0" class="text-muted text-center p-4">Loading capabilities...</div>
          <div *ngFor="let c of capabilities()" 
               class="btn mb-4 text-center" 
               [ngClass]="c.id === selectedCapability()?.id ? 'btn-primary' : 'btn-secondary'"
               style="width: 100%; display: block;"
               (click)="selectCapability(c)">
            {{c.name}}
          </div>
        </div>

        <!-- TASKS COLUMN -->
        <div class="glass-card" style="flex: 1; padding: 1rem;" *ngIf="selectedCapability()">
          <h3 class="mb-4" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Tasks</h3>
          <div *ngIf="tasks().length === 0" class="text-muted text-center p-4">No tasks configured.</div>
          <div *ngFor="let t of tasks()" 
               class="btn mb-4 text-center" 
               [ngClass]="t.id === selectedTask()?.id ? 'btn-primary' : 'btn-secondary'"
               style="width: 100%; display: block;"
               (click)="selectTask(t)">
            {{t.name}}
          </div>
        </div>

        <!-- SUBTASKS / ASSESSMENTS COLUMN -->
        <div class="glass-card" style="flex: 1.5; padding: 1rem;" *ngIf="selectedTask()">
          <h3 class="mb-4" style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">Subtasks</h3>
          <div *ngIf="subtasks().length === 0" class="text-muted text-center p-4">No subtasks found for this task.</div>
          <div *ngFor="let s of subtasks()" class="glass-panel p-4 mb-4" style="border-color: rgba(59, 130, 246, 0.3);">
            <div class="flex justify-between items-center">
              <div>
                <strong>{{s.name}}</strong>
                <div *ngIf="s.is_completed" style="color: var(--accent-success); font-size: 0.8rem; margin-top: 4px;">Successfully Evaluated ✓</div>
                
                <!-- Attempt Status Badges -->
                <div *ngIf="!s.is_completed && s.latest_attempt_status === 'pending_review'" style="color: var(--accent-warning); margin-top: 0.5rem;">
                   <i>Your submission is currently under Architectural Review.</i>
                </div>
                <div *ngIf="s.latest_attempt_status === 'evaluated' && !s.is_completed" style="color: var(--accent-danger); margin-top: 0.5rem;">
                   <i>Evaluation completed, but requirements were not met. You may need to retake this.</i>
                </div>
                <!-- Current Score Vis -->
                <div *ngIf="s.latest_attempt_score !== null" style="font-size: 0.9rem; margin-top: 0.3rem;">
                   <strong>Latest Score:</strong> {{s.latest_attempt_score}}
                </div>
              </div>
              
              <!-- Conditional Render on Launch button -->
              <ng-container *ngIf="s.assessment_id">
                  <ng-container *ngIf="!s.is_completed">
                      <button class="btn btn-primary" 
                              style="font-size: 0.8rem; padding: 0.5rem 1rem;" 
                              *ngIf="s.latest_attempt_status !== 'pending_review' && s.latest_attempt_status !== 'evaluated'"
                              (click)="startAssessment(s.assessment_id)">
                         Launch Assessment
                      </button>
                      
                      <!-- Locked View -->
                      <button class="btn btn-secondary"
                              style="font-size: 0.8rem; padding: 0.5rem 1rem; opacity: 0.5; cursor: not-allowed;" 
                              *ngIf="s.latest_attempt_status === 'pending_review'"
                              disabled>
                         Locked (Review)
                      </button>
                  </ng-container>

                  <!-- Badge Progress Lookup Button -->
                  <button class="btn"
                          style="font-size: 0.8rem; padding: 0.5rem 1rem; background: rgba(59, 130, 246, 0.2); border: 1px solid var(--accent-secondary); color: white;" 
                          *ngIf="s.latest_attempt_status === 'evaluated'"
                          (click)="viewBadgeProgress(s.latest_attempt_id)">
                     View Badge Progress
                  </button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <!-- BADGE PROGRESS MODAL -->
      <div *ngIf="badgeFeedback()" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
         <div class="glass-panel p-4" style="width: 600px; max-height: 80vh; overflow-y: auto; border-color: var(--accent-success);">
            <div class="flex justify-between items-center mb-4">
               <h2>Badge Progress Feedback</h2>
               <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem;" (click)="closeBadgeModal()">X</button>
            </div>
            
            <div class="mb-4 p-4" style="background: rgba(255,255,255,0.05); border-left: 3px solid var(--accent-success);">
               <h4>Final Subjective Grade: <span style="font-size: 1.5rem; color: var(--accent-success)">{{badgeFeedback().attempt.total_score}}</span></h4>
               <p class="text-secondary mt-2"><strong>Architect's Final Summary:</strong></p>
               <p style="white-space: pre-wrap; margin-top: 0.5rem; font-style: italic;">"{{badgeFeedback().review?.overall_feedback || 'No overall comments provided.'}}"</p>
            </div>

            <h4 class="mb-2">Per-Question Feedback:</h4>
            <div *ngFor="let q of badgeFeedback().feedback; let i = index" class="mb-4 p-3" style="background: rgba(0,0,0,0.3); border-radius: 6px;">
               <p style="margin-bottom: 0.5rem;"><strong>Q{{i+1}}:</strong> {{q.question_text}}</p>
               
               <div *ngIf="q.type === 'MCQ'">
                  <span class="text-secondary" style="font-size: 0.85rem;">[MCQ Automated Logging]</span>
                  <p style="margin-top: 0.2rem;"><span [style.color]="q.grade > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'">{{q.grade}} Marks</span></p>
               </div>
               
               <div *ngIf="q.type !== 'MCQ'">
                  <div class="p-2 mb-2" style="background: rgba(255,255,255,0.05); font-family: monospace; font-size: 0.85rem;">
                     {{q.answer_text || 'No subjective answer provided.'}}
                  </div>
                  <div style="border-left: 2px solid var(--accent-secondary); padding-left: 10px; margin-top: 10px;">
                     <span style="color: var(--accent-success); font-weight: bold;">{{q.grade}} Marks</span>
                     <p style="font-style: italic; font-size: 0.9rem; margin-top: 0.3rem;" class="text-secondary">"{{q.reviewer_feedback || 'No specific feedback left.'}}"</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
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
  ) {}

  ngOnInit() {
    this.hierarchy.getPowers().subscribe({
      next: (res) => this.powers.set(res),
      error: () => console.error('Failed fetching hierarchy data')
    });
    
    // Inject Architect Fetch
    const currentUser = this.auth.currentUser();
    if (currentUser?.roleName === 'Architect' || currentUser?.roleName === 'System Designer') {
       this.archSvc.getPendingReviews().subscribe({
          next: (res) => this.pendingReviews.set(res),
          error: () => console.error('Failed fetching Architect Queue')
       });

       this.http.get<any[]>(`${environment.apiUrl}/architect/users`, { withCredentials: true }).subscribe({
          next: (res) => this.globalUsers.set(res),
          error: (err) => console.error('Failed fetching Global Users', err)
       });
    }

    if (currentUser?.roleName === 'Trainee') {
       this.http.get<any[]>(`${environment.apiUrl}/progress/badges`, { withCredentials: true }).subscribe({
          next: (res) => this.myBadges.set(res),
          error: (err) => console.error('Failed fetching badges', err)
       });
    }
  }

  selectPower(p: any) {
    this.selectedPower.set(p);
    this.selectedCapability.set(null);
    this.selectedTask.set(null);
    this.capabilities.set([]);
    this.tasks.set([]);
    this.subtasks.set([]);

    this.hierarchy.getCapabilities(p.id).subscribe(res => this.capabilities.set(res));
  }

  selectCapability(c: any) {
    this.selectedCapability.set(c);
    this.selectedTask.set(null);
    this.tasks.set([]);
    this.subtasks.set([]);

    this.hierarchy.getTasks(c.id).subscribe(res => this.tasks.set(res));
  }

  selectTask(t: any) {
    this.selectedTask.set(t);
    this.subtasks.set([]);

    this.hierarchy.getSubtasks(t.id).subscribe(res => this.subtasks.set(res));
  }

  startAssessment(assessmentId: string) {
    this.assessment.startAttempt(assessmentId).subscribe({
      next: (res) => {
        // Redir to the lockdown assessment interface
        this.router.navigate(['/assessment', res.attempt_id]);
      },
      error: (err) => alert('Failed to start assessment. You might have reached an attempt limit or are barred.')
    });
  }

  viewBadgeProgress(attemptId: string) {
     this.http.get<any>(`${environment.apiUrl}/progress/attempt/${attemptId}/feedback`, { withCredentials: true }).subscribe({
        next: (res) => {
            this.badgeFeedback.set(res);
        },
        error: () => alert('Failed to resolve badge feedback mapping.')
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
