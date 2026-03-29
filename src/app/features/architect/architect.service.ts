import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArchitectService {
  private apiUrl = `${environment.apiUrl}/architect`;
  
  constructor(private http: HttpClient) {}

  getAttemptReplay(attemptId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/attempt/${attemptId}`, { withCredentials: true });
  }

  getPendingReviews() {
    return this.http.get<any[]>(`${this.apiUrl}/pending`, { withCredentials: true });
  }

  submitEvaluation(attemptId: string, evaluations: any[], overallFeedback: string) {
    return this.http.post(`${this.apiUrl}/attempt/${attemptId}/evaluate`, { 
        evaluations, 
        overall_feedback: overallFeedback 
    }, { withCredentials: true });
  }
}
