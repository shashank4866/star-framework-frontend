import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HierarchyService {
  private apiUrl = `${environment.apiUrl}/hierarchy`;
  
  constructor(private http: HttpClient) {}

  getPowers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/powers`, { withCredentials: true });
  }

  getCapabilities(powerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/powers/${powerId}/capabilities`, { withCredentials: true });
  }

  getTasks(capabilityId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/capabilities/${capabilityId}/tasks`, { withCredentials: true });
  }

  getSubtasks(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tasks/${taskId}/subtasks`, { withCredentials: true });
  }
}
