import { Component, OnInit, signal } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../models/models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';
import { HeaderComponent } from '../../../components/shared/header/header.component';

@Component({
  selector: 'app-rescuer-profile',
  standalone: true,
  imports: [CommonModule, LocalDatePipe, HeaderComponent],
  templateUrl: './rescuer-profile.component.html',
  styleUrl: './rescuer-profile.component.css'
})
export class RescuerProfileComponent implements OnInit {
  reports$: Observable<Report[]>;
  isLoading = signal<boolean>(true);
  user = signal<any>(null);
  reportStats = signal<{ all:number; in_review: number; reviewed: number; rejected: number }>({all:0, in_review: 0, reviewed: 0, rejected: 0 });
  isEditing = signal<boolean>(false);
  message = signal<{ text: string; isError: boolean } | null>(null);

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router
  ) {
    this.reports$ = this.reportService.getReports();
  }

  ngOnInit() {
    const userState = this.authService.userState();
    if (!userState.isLoggedIn || !this.authService.hasRole('rescuer')) {
      this.router.navigate(['/login']);
    }
    this.authService.getUserProfile().subscribe(profile => {
      this.user.set(profile || { username: userState.username });
      this.reports$.subscribe(reports => {
        const userReports = reports.filter(r => r.assignedTo === userState.username);
        this.updateStats(userReports);
        this.isLoading.set(false);
      });
    });
  }

  updateStats(reports: Report[]) {
    this.reportStats.set({
      all: reports.length,
      in_review: reports.filter(r => r.status === 'in_review').length,
      reviewed: reports.filter(r => r.status === 'reviewed').length,
      rejected: reports.filter(r => r.status === 'rejected').length
    });
  }

  updateStatus(reportId: string, newStatus: 'reviewed' | 'rejected') {
    this.isLoading.set(true);
    this.reportService.updateReport(reportId, { status: newStatus }).subscribe({
      next: (updatedReport) => {
        this.reports$ = this.reportService.getReports();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('خطا در به‌روزرسانی وضعیت:', err);
        this.isLoading.set(false);
      }
    });
  }

  viewDetail(reportId: string) {
    this.router.navigate(['/rescuer/report', reportId]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
    this.message.set(null);
  }

  saveProfile() {
    const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const phoneInput = document.getElementById('phone') as HTMLInputElement;
    const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;

    const newPassword = newPasswordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';
    const email = emailInput?.value || '';
    const phone = phoneInput?.value || '';

    // اعتبارسنجی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      this.message.set({ text: 'فرمت ایمیل نامعتبر است (مثال: user@example.com).', isError: true });
      return;
    }

    // اعتبارسنجی شماره همراه (فرض: 11 رقم شروع با 09)
    const phoneRegex = /^09[0-9]{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      this.message.set({ text: 'فرمت شماره همراه نامعتبر است (مثال: 09123456789).', isError: true });
      return;
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      this.message.set({ text: 'رمز عبور و تأیید رمز عبور باید یکسان باشند.', isError: true });
      return;
    }

    const updatedUser = {
      username: this.user().username,
      fullName: fullNameInput?.value || this.user().fullName,
      email: emailInput?.value || this.user().email,
      phone: phoneInput?.value || this.user().phone,
      ...(newPassword && { password: newPassword })
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: () => {
        this.authService.getUserProfile().subscribe(profile => {
          this.user.set(profile);
          this.isEditing.set(false);
          this.message.set({ text: 'اطلاعات با موفقیت به‌روزرسانی شد!', isError: false });
        });
      },
      error: (err) => {
        this.message.set({ text: err.message || 'خطا در به‌روزرسانی پروفایل', isError: true });
        this.isEditing.set(false);
      }
    });
  }
}