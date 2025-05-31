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
  { path: '', component: HomeComponent }, // صفحه هوم
  { path: 'report', component: ReportComponent }, // فرم گزارش
  { path: 'login', component: LoginComponent }, // صفحه لاگین
  { path: 'admin/reports', component: AdminReportsComponent, canActivate: [AuthGuard] }, // لیست گزارش‌ها (اختیاری، می‌تونی حذف کنی)
  { path: 'admin/reports/:id', component: AdminReportDetailComponent, canActivate: [AuthGuard] },
  { path: 'admin/login', component: LoginComponent },
  { path: 'rescuer/reports', component: RescuerReportsComponent, canActivate: [AuthGuard] },
  { path: 'rescuer/report/:id', component: RescuerReportDetailComponent, canActivate: [AuthGuard] },
  { path: 'user', component: UserComponent }, // پنل کاربر
  {path: 'register', component:RegisterComponent},
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {path: 'admin-users',component: AdminUsersComponent},
  { path: '**', redirectTo: '' }, // مسیرهای نامعتبر

];
