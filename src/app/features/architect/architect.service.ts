import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ArchitectService {
  private apiUrl = 'http://localhost:3000/api/architect';
  
  constructor(private http: HttpClient) {}

  getAttemptReplay(attemptId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/attempt/${attemptId}`);
  }

  getPendingReviews() {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  submitEvaluation(attemptId: string, evaluations: any[], overallFeedback: string) {
    return this.http.post(`${this.apiUrl}/attempt/${attemptId}/evaluate`, { 
        evaluations, 
        overall_feedback: overallFeedback 
    });
  }
}
