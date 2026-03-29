import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArchitectService } from './architect.service';

@Component({
  selector: 'app-architect-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-container">
      <div class="glass-panel header-bar mb-4 p-4">
        <h2>Architect Replay Engine</h2>
        <p class="text-secondary">Viewing Attempt Snapshot: {{attemptId}}</p>
        <div class="flex" style="gap: 2rem; margin-top: 1rem; color: var(--text-primary)">
           <div class="glass-card" style="padding: 1rem;">
             <strong>Current Automated Score:</strong> <span style="font-size: 1.25rem;">{{attemptMeta()?.total_score || 0}}</span>
           </div>
           <div class="glass-card" style="padding: 1rem; border-color: var(--accent-danger);" *ngIf="(attemptMeta()?.violations || 0) > 0">
             <strong class="text-danger">Anti-Cheat Triggered:</strong> 
             <span>{{attemptMeta()?.violations}} Tab-Switch Violations recorded during session.</span>
           </div>
        </div>
      </div>

      <div class="glass-card mb-4" *ngFor="let q of replay(); let i = index">
        <h4 style="margin-bottom: 1rem;">
          <span style="color: var(--accent-secondary);">Q{{i + 1}} ({{q.type}})[{{q.marks}} Marks]:</span> {{q.text}}
        </h4>
        
        <!-- MCQ Vis -->
        <div *ngIf="q.type === 'MCQ'" style="padding-left: 20px;">
          <div *ngFor="let o of q.options" 
               [style.backgroundColor]="o.option_id === q.selected_option_id ? 'rgba(59, 130, 246, 0.2)' : 'transparent'"
               [style.border]="o.option_id === q.selected_option_id ? '1px solid var(--accent-primary)' : '1px solid transparent'"
               style="padding: 0.5rem; border-radius: 6px; margin-bottom: 0.5rem;"
               class="flex items-center">
            
            <span *ngIf="o.is_correct" style="color: var(--accent-success); margin-right: 10px;">(Correct)</span>
            <span *ngIf="!o.is_correct" style="color: var(--accent-danger); margin-right: 10px;">(Wrong)</span>
            
            <span>{{o.text}}</span>
            <span *ngIf="o.option_id === q.selected_option_id" style="margin-left: auto; font-style: italic; color: var(--accent-primary);">User Selected</span>
          </div>
          <div class="mt-4">
            <p><strong>System Graded: </strong> <span [style.color]="q.grade > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'">{{q.grade > 0 ? 'Pass ('+q.grade+')' : 'Fail'}}</span></p>
          </div>
        </div>

        <!-- LOG Vis -->
        <div *ngIf="q.type === 'LOG'">
          <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-left: 3px solid var(--accent-warning); margin-bottom: 1rem;">
            <p style="white-space: pre-wrap; font-family: monospace;">{{q.answer_text || 'No response provided.'}}</p>
          </div>
          <div class="form-group flex items-center" style="gap: 1rem;">
            <label>Architect Score:</label>
            <input type="number" 
                   [(ngModel)]="evaluations[q.question_id].score" 
                   max="100" min="0" 
                   style="width: 100px;">
          </div>
          <div class="form-group">
            <label>Specific Feedback:</label>
            <textarea [(ngModel)]="evaluations[q.question_id].reviewer_feedback" rows="3"></textarea>
          </div>
        </div>

        <!-- F2F Vis -->
        <div *ngIf="q.type === 'F2F'">
          <p class="text-secondary mb-4">You have conducted the Face-To-Face evaluation.</p>
          <div class="form-group flex items-center" style="gap: 1rem;">
             <label>Final F2F Score:</label>
             <input type="number" [(ngModel)]="evaluations[q.question_id].score" max="100" min="0" style="width: 100px;">
          </div>
          <div class="form-group">
             <label>Meeting Notes/Feedback:</label>
             <textarea [(ngModel)]="evaluations[q.question_id].reviewer_feedback" rows="3"></textarea>
          </div>
        </div>
      </div>

      <div class="glass-panel p-4" *ngIf="replay().length > 0">
        <h3 class="mb-4">Submit Final Architectural Decision</h3>
        <div class="form-group">
           <label>Overall Review Verdict:</label>
           <textarea [(ngModel)]="overallFeedback" rows="4" placeholder="Summarize user performance..."></textarea>
        </div>
        <button class="btn btn-primary mt-4" (click)="submitEvaluation()">Approve & Evaluate Assessment</button>
      </div>

       <div class="glass-card text-center" *ngIf="submitted" style="margin-top: 5vh;">
          <h2>Architect Review Locked</h2>
          <button class="btn btn-secondary mt-4" (click)="router.navigate(['/'])">Return to System UI</button>
      </div>
    </div>
  `
})
export class ArchitectReviewComponent implements OnInit {
  attemptId: string | null = null;
  attemptMeta = signal<any>(null);
  replay = signal<any[]>([]);
  evaluations: any = {};
  overallFeedback = '';
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private archSvc: ArchitectService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.attemptId = params.get('attempt_id');
      if (this.attemptId) {
         this.loadReplay();
      }
    });
  }

  loadReplay() {
    this.archSvc.getAttemptReplay(this.attemptId!).subscribe({
      next: (data: any) => {
        this.attemptMeta.set(data.attempt);
        this.replay.set(data.questions);
        
        data.questions.forEach((q: any) => {
           if (q.type !== 'MCQ') {
             this.evaluations[q.question_id] = { question_id: q.question_id, score: 0, reviewer_feedback: '' };
           }
        });
      },
      error: (err) => alert('Could not load Replay')
    });
  }

  submitEvaluation() {
    const payload = Object.values(this.evaluations);
    this.archSvc.submitEvaluation(this.attemptId!, payload, this.overallFeedback).subscribe({
      next: () => this.submitted = true,
      error: () => alert('Failed to submit Architectural review')
    });
  }
}
