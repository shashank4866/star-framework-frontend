import { Routes } from '@angular/router';
import { AssessmentComponent } from './features/assessment/assessment.component';
import { ArchitectReviewComponent } from './features/architect/architect.component';
import { CourseBuilderComponent } from './features/architect/builder.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'assessment/:attempt_id', component: AssessmentComponent, canActivate: [authGuard] },
  { 
    path: 'architect/review/:attempt_id', 
    component: ArchitectReviewComponent, 
    canActivate: [authGuard, roleGuard(['Architect', 'System Designer'])] 
  },
  { 
    path: 'architect/builder', 
    component: CourseBuilderComponent, 
    canActivate: [authGuard, roleGuard(['Architect', 'System Designer'])] 
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
