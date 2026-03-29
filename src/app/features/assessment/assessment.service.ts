import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private apiUrl = 'http://localhost:3000/api/assessments';
  
  constructor(private http: HttpClient) {}

  startAttempt(assessmentId: string) {
    return this.http.post<{attempt_id: string, start_time: string, end_time: string}>(`${this.apiUrl}/start/${assessmentId}`, {});
  }

  getSnapshot(attemptId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/attempt/${attemptId}`);
  }

  submitAnswers(attemptId: string, payload: { answers: any[], violations: number }) {
    return this.http.post(`${this.apiUrl}/attempt/${attemptId}/submit`, payload);
  }
}
