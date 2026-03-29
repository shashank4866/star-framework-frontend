import { Component, OnInit, OnDestroy, HostListener, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentService } from './assessment.service';

@Component({
  selector: 'app-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="assessment-container" *ngIf="!submitted">
      <div class="glass-panel header-bar flex justify-between items-center pb-4 mb-4">
        <div>
          <h2>Assessment Engine Secure View</h2>
          <p class="text-danger" *ngIf="strikes() > 0">Warning: {{strikes()}}/3 tab changes detected!</p>
        </div>
        <div class="timer" [class.text-danger]="timeLeft() < 60">
          <span style="font-size: 1.5rem; font-weight: 700; font-family: monospace;">{{formatTime(timeLeft())}}</span> remaining
        </div>
      </div>

      <div class="questions-list" *ngIf="questions().length > 0">
        <div class="glass-card mb-4" *ngFor="let q of questions(); let i = index">
          <h4 style="margin-bottom: 1rem;"><span style="color: var(--accent-primary);">Q{{i + 1}}:</span> {{q.text}}</h4>
          
          <div *ngIf="q.type === 'MCQ'">
            <div class="option-row" *ngFor="let o of q.options" style="margin-bottom: 0.5rem;">
              <label class="flex items-center" style="gap: 1rem; cursor: pointer;">
                <input type="radio" 
                       [name]="'q_' + q.question_id" 
                       [value]="o.option_id"
                       (change)="onAnswerChange(q.question_id, o.option_id, null)">
                <span>{{o.text}}</span>
              </label>
            </div>
          </div>

          <div *ngIf="q.type === 'LOG'">
            <textarea 
              rows="4" 
              class="form-control"
              style="width: 100%; border-radius: 6px; padding: 0.5rem; background: rgba(0,0,0,0.2); color: white;" 
              placeholder="Enter your detailed response..."
              (input)="onAnswerChange(q.question_id, null, $any($event.target).value)"></textarea>
          </div>
          
           <div *ngIf="q.type === 'F2F'">
            <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-left: 4px solid var(--accent-primary);">
              <i>This is a Face-To-Face evaluation task. Your architect will review you live.</i>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-panel p-4 flex justify-between items-center" style="margin-top: 2rem;">
        <span>Ensure all LOG items and MCQs are recorded. Order is locked to this session.</span>
        <button class="btn btn-primary" (click)="submitAssesment(false)">Submit Assessment</button>
      </div>
    </div>
    
    <div class="glass-card text-center" *ngIf="submitted" style="margin-top: 10vh;">
      <h2>{{ submitMessage() }}</h2>
      <p>Your responses have been successfully recorded with the server snapshot.</p>
      <button class="btn btn-secondary mt-4" (click)="router.navigate(['/'])">Return to Dashboard</button>
    </div>
  `
})
export class AssessmentComponent implements OnInit, OnDestroy {
  attemptId: string | null = null;
  questions = signal<any[]>([]);
  answers: any = {};
  
  timeLeft = signal<number>(0);
  timerInterval: any;
  endTime!: Date;
  
  strikes = signal<number>(0);
  MAX_STRIKES = 3;
  submitted = false;
  submitMessage = signal('Assessment Submitted');

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private assessmentSvc: AssessmentService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.attemptId = params.get('attempt_id');
      if (this.attemptId) {
         // Optionally load state directly, or init fresh if redirecting from start
         this.loadSnapshot();
      }
    });
  }

  loadSnapshot() {
    // Restore end_time from sessionStorage if the user refreshes mid-exam.
    // It is written by startAssessment() on the dashboard before navigating here.
    const storedEnd = sessionStorage.getItem(`attempt_end_${this.attemptId}`);
    if (storedEnd) {
      this.endTime = new Date(storedEnd);
    } else {
      // Fallback: 30-min window (handles direct URL navigation without starting via dashboard)
      this.endTime = new Date(new Date().getTime() + 30 * 60000);
    }

    this.assessmentSvc.getSnapshot(this.attemptId!).subscribe({
        next: (data: any) => {
            this.questions.set(data);
            this.startTimer();
        },
        error: () => alert('Failed to load assessment snapshot or timer expired!')
    });
  }

  startTimer() {
    this.updateTimeLeft();
    this.timerInterval = setInterval(() => {
      this.updateTimeLeft();
      if (this.timeLeft() <= 0) {
        this.submitAssesment(true);
      }
    }, 1000);
  }

  updateTimeLeft() {
    const remaining = Math.max(0, Math.floor((this.endTime.getTime() - new Date().getTime()) / 1000));
    this.timeLeft.set(remaining);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onAnswerChange(questionId: string, optionId: string | null, answerText: string | null) {
    this.answers[questionId] = {
      question_id: questionId,
      selected_option_id: optionId,
      answer_text: answerText
    };
  }

  @HostListener('window:blur', ['$event'])
  onBlur(event: any) {
    if (!this.submitted) this.registerCheatStrike();
  }

  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(event: any) {
    if (document.hidden && !this.submitted) {
      this.registerCheatStrike();
    }
  }

  registerCheatStrike() {
    // Debounce strikes closely
    this.strikes.update(v => v + 1);
    if (this.strikes() >= this.MAX_STRIKES) {
       this.submitMessage.set('Assessment Auto-Submitted due to Security Violation (Tab Switching).');
       this.submitAssesment(true);
    } else {
       alert(`WARNING: You have switched tabs. This is strike ${this.strikes()}/${this.MAX_STRIKES}. Your assessment will auto-submit!`);
    }
  }

  submitAssesment(isForced: boolean) {
    if (this.submitted) return;
    
    clearInterval(this.timerInterval);
    const payload = {
      answers: Object.values(this.answers),
      violations: this.strikes()
    };
    
    this.assessmentSvc.submitAnswers(this.attemptId!, payload).subscribe({
      next: (res) => {
         this.submitted = true;
      },
      error: (err) => {
         alert('Submission failed or timer expired entirely. Data locked.');
         this.submitted = true;
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
