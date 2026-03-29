import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="builder-container" style="max-width: 800px; margin: 0 auto; padding-bottom: 4rem;">
      <div class="glass-panel p-4 mb-4 flex justify-between items-center">
         <div>
            <h2 style="color: var(--accent-primary)">CMS Course Builder Engine</h2>
            <p class="text-secondary">Dynamically trace capability vectors strictly mapping new payloads to the PostgreSQL Matrix tier.</p>
         </div>
         <button class="btn btn-secondary" (click)="router.navigate(['/'])">Back to Dashboard</button>
      </div>

      <!-- MASS UPLOAD ENGINE -->
      <div class="glass-card mb-4" style="border-color: var(--accent-success);">
         <h3>[FAST TRACK] Mass Upload Course Strategy (CSV)</h3>
         <p class="text-secondary mt-1">Upload a compiled Matrix CSV to natively bind an entire sub-architecture hierarchy instantly.</p>
         
         <div class="mt-3 flex items-center" style="gap: 1rem;">
             <input type="file" accept=".csv" (change)="onFileSelected($event)" style="flex: 1; padding: 0.5rem; background: rgba(0,0,0,0.5); border: 1px dashed var(--accent-success); border-radius: 6px; color: white;">
             <button class="btn btn-primary" style="background: var(--accent-success);" [disabled]="!csvFile || isUploading" (click)="processCSV()">
                 {{ isUploading ? 'Executing Transaction...' : 'Bulk Mount Engine' }}
             </button>
         </div>
         <p *ngIf="uploadResult" class="mt-2 text-success" style="color: var(--accent-success); font-weight: bold;">{{uploadResult}}</p>
      </div>

      <!-- LEVEL SELECTION -->
      <div class="glass-card mb-4">
         <h3>1. Target Capability Rank Level</h3>
         <select [(ngModel)]="selectedLevel" class="form-control mt-2" style="background: rgba(0,0,0,0.5); color: white; border: 1px solid var(--bg-tertiary); padding: 0.5rem; width: 100%;">
            <option [ngValue]="null">-- Select a Global Rank --</option>
            <option *ngFor="let l of levels()" [ngValue]="l">{{l.name}}</option>
         </select>
      </div>

      <!-- POWER CREATION -->
      <div class="glass-card mb-4" *ngIf="selectedLevel">
         <h3>2. Create Base Power for {{selectedLevel.name}}</h3>
         <div class="flex items-center mt-2" style="gap: 1rem;">
            <input type="text" [(ngModel)]="newPowerName" placeholder="e.g. 'Advanced Communication'" style="flex: 1; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
            <button class="btn btn-primary" (click)="createPower()">Bind Power</button>
         </div>
         <div *ngIf="activePower()" class="mt-2 text-success" style="color: var(--accent-success)">Extracted Bound Power: {{activePower().name}}</div>
      </div>

      <!-- CAPABILITY CREATION -->
      <div class="glass-card mb-4" *ngIf="activePower()">
         <h3>3. Correlate Capability to {{activePower().name}}</h3>
         <div class="flex items-center mt-2" style="gap: 1rem;">
            <input type="text" [(ngModel)]="newCapabilityName" placeholder="e.g. 'Public Speaking'" style="flex: 1; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
            <button class="btn btn-primary" (click)="createCapability()">Bind Capability</button>
         </div>
         <div *ngIf="activeCapability()" class="mt-2 text-success" style="color: var(--accent-success)">Extracted Bound Capability: {{activeCapability().name}}</div>
      </div>

      <!-- TASK CREATION -->
      <div class="glass-card mb-4" *ngIf="activeCapability()">
         <h3>4. Correlate Task to {{activeCapability().name}}</h3>
         <div class="flex items-center mt-2" style="gap: 1rem;">
            <input type="text" [(ngModel)]="newTaskName" placeholder="e.g. 'Audience Engagement'" style="flex: 1; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
            <button class="btn btn-primary" (click)="createTask()">Bind Task</button>
         </div>
         <div *ngIf="activeTask()" class="mt-2 text-success" style="color: var(--accent-success)">Extracted Bound Task: {{activeTask().name}}</div>
      </div>

      <!-- SUBTASK CREATION -->
      <div class="glass-card mb-4" *ngIf="activeTask()">
         <h3>5. Correlate Subtask to {{activeTask().name}}</h3>
         <div class="flex items-center mt-2" style="gap: 1rem;">
            <input type="text" [(ngModel)]="newSubtaskName" placeholder="e.g. 'Final Presentation'" style="flex: 1; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
            <button class="btn btn-primary" (click)="createSubtask()">Bind Subtask</button>
         </div>
         <div *ngIf="activeSubtask()" class="mt-2 text-success" style="color: var(--accent-success)">Extracted Bound Subtask: {{activeSubtask().name}}</div>
      </div>

      <!-- ASSESSMENT CREATION -->
      <div class="glass-card mb-4" *ngIf="activeSubtask()">
         <h3>6. Mount Lockdown Assessment for {{activeSubtask().name}}</h3>
         <div class="flex flex-col mt-2" style="gap: 1rem;">
            <input type="text" [(ngModel)]="newAssTitle" placeholder="Test Title" style="padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
            <div class="flex" style="gap: 1rem;">
               <input type="number" [(ngModel)]="newAssTime" placeholder="Time Limit (Mins)" style="flex: 1; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
               <input type="number" [(ngModel)]="newAssPassing" placeholder="Passing Score" style="flex: 1; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
            </div>
            <button class="btn btn-primary" (click)="createAssessment()">Mount Assessment Engine</button>
         </div>
         <div *ngIf="activeAssessment()" class="mt-2 text-success" style="color: var(--accent-success)">Mounted Engine: [UUID: {{activeAssessment().id}}]</div>
      </div>

      <!-- QUESTIONS ENGINE -->
      <div class="glass-panel mb-4 p-4" *ngIf="activeAssessment()">
         <h3 style="border-bottom: 1px solid var(--bg-tertiary); padding-bottom: 0.5rem;">7. Question Injection Payload</h3>
         
         <div *ngFor="let q of injectedQuestions(); let i = index" style="background: rgba(0,0,0,0.3); padding: 1rem; margin-top: 1rem; border-left: 3px solid var(--accent-primary);">
             <strong>Q{{i+1}} ({{q.type}}):</strong> {{q.text}} [{{q.marks}} Marks]
         </div>

         <div class="mt-4 p-4" style="background: rgba(255,255,255,0.05); border-radius: 8px;">
            <h4>Inject New Question</h4>
            <div class="flex mt-2" style="gap: 1rem;">
               <select [(ngModel)]="newQType" style="padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
                  <option value="MCQ">Multiple Choice</option>
                  <option value="LOG">Written Request (LOG)</option>
                  <option value="F2F">Face-2-Face Session</option>
               </select>
               <input type="number" [(ngModel)]="newQMarks" placeholder="Marks" style="width: 80px; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
            </div>
            <textarea [(ngModel)]="newQText" rows="2" class="mt-2" style="width: 100%; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);" placeholder="Question Context..."></textarea>
            
            <button class="btn btn-secondary mt-2" (click)="createQuestion()">Force Question Injection</button>
         </div>

         <!-- OPTIONS ENGINE FOR LAST MCQ -->
         <div class="mt-4 p-4" *ngIf="lastInjectedMCQ()" style="background: rgba(59, 130, 246, 0.1); border-left: 3px solid var(--accent-secondary);">
            <h4>Map Validated Options for the last injected MCQ</h4>
            <div class="flex items-center mt-2" style="gap: 1rem;">
               <input type="text" [(ngModel)]="newOptionText" placeholder="Option Descriptor" style="flex: 1; padding: 0.5rem; background: transparent; color: white; border: 1px solid var(--bg-tertiary);">
               <label class="flex items-center" style="gap: 0.5rem;">
                  <input type="checkbox" [(ngModel)]="newOptionCorrect"> Is Correct?
               </label>
               <button class="btn btn-primary" (click)="createOption()">Inject Option</button>
            </div>
         </div>

         <div class="mt-4 text-center">
            <button class="btn btn-secondary" style="width: 100%; padding: 1rem;" (click)="finishCMS()">FINAL COMMIT & CLOSE ENGINE</button>
         </div>
      </div>
    </div>
  `
})
export class CourseBuilderComponent implements OnInit {
  apiUrl = `${environment.apiUrl}/builder`;
  
  levels = signal<any[]>([]);
  selectedLevel: any = null;

  newPowerName = '';
  activePower = signal<any>(null);

  newCapabilityName = '';
  activeCapability = signal<any>(null);

  newTaskName = '';
  activeTask = signal<any>(null);

  newSubtaskName = '';
  activeSubtask = signal<any>(null);

  newAssTitle = '';
  newAssTime = 30;
  newAssPassing = 0;
  activeAssessment = signal<any>(null);

  newQText = '';
  newQType = 'MCQ';
  newQMarks = 10;
  injectedQuestions = signal<any[]>([]);

  lastInjectedMCQ = signal<any>(null);
  newOptionText = '';
  newOptionCorrect = false;

  csvFile: File | null = null;
  isUploading = false;
  uploadResult = '';

  constructor(private http: HttpClient, public router: Router) {}

  ngOnInit() {
    this.http.get<any[]>(`${this.apiUrl}/levels`, { withCredentials: true }).subscribe(res => {
       this.levels.set(res);
    });
  }

  createPower() {
    this.http.post<any>(`${this.apiUrl}/powers`, { name: this.newPowerName, level_id: this.selectedLevel.id }, { withCredentials: true })
        .subscribe(res => this.activePower.set(res));
  }

  createCapability() {
    this.http.post<any>(`${this.apiUrl}/capabilities`, { name: this.newCapabilityName, power_id: this.activePower().id }, { withCredentials: true })
        .subscribe(res => this.activeCapability.set(res));
  }

  createTask() {
    this.http.post<any>(`${this.apiUrl}/tasks`, { name: this.newTaskName, capability_id: this.activeCapability().id }, { withCredentials: true })
        .subscribe(res => this.activeTask.set(res));
  }

  createSubtask() {
    this.http.post<any>(`${this.apiUrl}/subtasks`, { name: this.newSubtaskName, task_id: this.activeTask().id }, { withCredentials: true })
        .subscribe(res => this.activeSubtask.set(res));
  }

  createAssessment() {
    this.http.post<any>(`${this.apiUrl}/assessments`, { 
        title: this.newAssTitle, 
        time_limit_minutes: this.newAssTime,
        passing_score: this.newAssPassing,
        subtask_id: this.activeSubtask().id 
    }, { withCredentials: true }).subscribe(res => this.activeAssessment.set(res));
  }

  createQuestion() {
    this.http.post<any>(`${this.apiUrl}/questions`, { 
        assessment_id: this.activeAssessment().id,
        text: this.newQText,
        type: this.newQType,
        marks: this.newQMarks
    }, { withCredentials: true }).subscribe(res => {
        this.injectedQuestions.update(qs => [...qs, res]);
        if (res.type === 'MCQ') {
            this.lastInjectedMCQ.set(res);
        } else {
            this.lastInjectedMCQ.set(null);
        }
        this.newQText = '';
    });
  }

  createOption() {
     this.http.post<any>(`${this.apiUrl}/options`, {
        question_id: this.lastInjectedMCQ().id,
        text: this.newOptionText,
        is_correct: this.newOptionCorrect
     }, { withCredentials: true }).subscribe(() => {
        alert('Option Mapped Successfully!');
        this.newOptionText = '';
        this.newOptionCorrect = false;
     });
  }

  finishCMS() {
     alert('Pathways fully committed to database mapping tree!');
     this.router.navigate(['/']);
  }

  onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
         this.csvFile = file;
      }
  }

  processCSV() {
      if (!this.csvFile) return;
      this.isUploading = true;
      this.uploadResult = 'Parsing locally mapped CSV buffers...';

      const reader = new FileReader();
      reader.onload = (e) => {
         const text = e.target?.result as string;
         // Crude CSV line parser mapping structural lines securely
         const lines = text.split('\n').map(l => l.trim()).filter(l => l);
         if (lines.length < 2) {
            this.uploadResult = 'Matrix Corrupted: No Data Rows found.';
            this.isUploading = false;
            return;
         }

         const headers = lines[0].split(',').map(h => h.trim());
         const payload = [];

         for (let i = 1; i < lines.length; i++) {
            // Basic CSV split ignoring commas in quotes (for robust production use PapaParse, this handles clean matrices)
            const cols = lines[i].split(',').map(c => c.trim());
            const rowObject: any = {};
            headers.forEach((h, idx) => {
               rowObject[h] = cols[idx] || '';
            });
            payload.push(rowObject);
         }

         this.uploadResult = `Executing Transaction mapping ${payload.length} rows...`;

         this.http.post<any>(`${this.apiUrl}/bulk-csv`, { payload }, { withCredentials: true })
            .subscribe({
                next: (res) => {
                    this.isUploading = false;
                    this.uploadResult = `Successfully built hierarchical architecture spanning ${res.records} nodes!`;
                    this.csvFile = null;
                },
                error: (err) => {
                    this.isUploading = false;
                    this.uploadResult = `Transaction reverted: ${err.error?.detail || err.error?.error || 'Unknown Postgres Error'}. Check constraints.`;
                }
            });
      };
      
      reader.onerror = () => {
         this.uploadResult = 'File Reader Exception. Check matrix layout.';
         this.isUploading = false;
      };

      reader.readAsText(this.csvFile);
  }
}
