import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { UserComponent } from './pages/user/user.component';
import { ReportComponent } from './pages/report/report.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminReportsComponent } from './pages/admin/admin-reports/admin-reports.component';
import { AdminReportDetailComponent } from './pages/admin/admin-report-detail/admin-report-detail.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { AdminUsersComponent } from './pages/admin/admin-users/admin-users.component';
import { RescuerReportDetailComponent } from './pages/rescuer/rescuer-report-detail/rescuer-report-detail.component';
import { RescuerReportsComponent } from './pages/rescuer/rescuer-reports/rescuer-reports.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // صفحه هوم (بدون گارد، عمومیه)
  { path: 'report', component: ReportComponent }, // فرم گزارش (بدون گارد، عمومیه)
  { path: 'login', component: LoginComponent }, // صفحه لاگین (بدون گارد)
  {
    path: 'admin/reports',
    component: AdminReportsComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/reports/:id',
    component: AdminReportDetailComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  { path: 'admin/login', component: LoginComponent }, // مسیر جداگانه برای ادمین (بدون گارد)
  {
    path: 'rescuer/reports',
    component: RescuerReportsComponent,
    canActivate: [AuthGuard],
    data: { role: 'rescuer' }
  },
  {
    path: 'rescuer/report/:id',
    component: RescuerReportDetailComponent,
    canActivate: [AuthGuard],
    data: { role: 'rescuer' }
  },
  {
    path: 'user',
    component: UserComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' }
  },
  { path: 'register', component: RegisterComponent }, // صفحه ثبت‌نام (بدون گارد)
  { path: 'forgot-password', component: ForgotPasswordComponent }, // صفحه فراموشی رمز (بدون گارد)
  {
    path: 'admin-users',
    component: AdminUsersComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  { path: '**', redirectTo: '' } // مسیرهای نامعتبر
];