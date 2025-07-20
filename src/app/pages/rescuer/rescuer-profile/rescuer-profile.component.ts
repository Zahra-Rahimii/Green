import { Component, OnInit, signal, computed } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { Report, UserProfile } from '../../../models/models';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';
import { HeaderComponent } from '../../../components/shared/header/header.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-rescuer-profile',
  standalone: true,
  imports: [CommonModule, LocalDatePipe, HeaderComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './rescuer-profile.component.html',
  styleUrl: './rescuer-profile.component.css'
})
export class RescuerProfileComponent implements OnInit {
  reports$: Observable<Report[]>;
  isLoading = signal<boolean>(true);
  user = signal<UserProfile | null>(null);
  reportStats = signal<{ all: number; in_review: number; reviewed: number; rejected: number }>({ all: 0, in_review: 0, reviewed: 0, rejected: 0 });
  isEditing = signal<boolean>(false);
  message = signal<{ text: string; isError: boolean } | null>(null);
  emailError = signal<string | null>(null); // سیگنال جداگانه برای خطای ایمیل
  phoneError = signal<string | null>(null); // سیگنال جداگانه برای خطای شماره
  passwordError = signal<string | null>(null); // سیگنال جداگانه برای خطای رمز
  profileForm: FormGroup;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.reports$ = this.reportService.getReports();
    this.profileForm = this.fb.group({
      fullName: [''],
      email: ['', [Validators.required, Validators.email, Validators.pattern('^[^\s@]+@[^\s@]+\.[^\s@]+$')]],
      phone: ['', [Validators.pattern('^09[0-9]{9}$')]],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  ngOnInit() {
    const userState = this.authService.userState();
    if (!userState.isLoggedIn || !this.authService.hasRole('rescuer')) {
      this.router.navigate(['/login']);
    }
    this.authService.getUserProfile().subscribe(profile => {
      if (profile && !profile.createdAt) {
        profile.createdAt = new Date().toISOString(); // پیش‌فرض اگه createdAt نباشه
      }
      this.user.set(profile);
      if (profile) {
        this.profileForm.patchValue({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phone || ''
        });
      }
      this.reports$.subscribe(reports => {
        const userReports = reports.filter(r => r.assignedTo === userState.username);
        this.updateStats(userReports);
        this.isLoading.set(false);
      });
    });

    // پاک کردن خطاها با تغییر فرم
    this.profileForm.valueChanges.subscribe(() => {
      this.emailError.set(null);
      this.phoneError.set(null);
      this.passwordError.set(null);
      if (this.profileForm.get('email')?.touched) this.checkEmail();
      if (this.profileForm.get('phone')?.touched) this.checkPhone();
      if (this.profileForm.get('newPassword')?.touched || this.profileForm.get('confirmPassword')?.touched) this.checkPassword();
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
    this.emailError.set(null);
    this.phoneError.set(null);
    this.passwordError.set(null);
    if (this.isEditing()) {
      const currentUser = this.user();
      if (currentUser) {
        this.profileForm.patchValue({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || ''
        });
      }
    }
  }

  checkEmail() {
    const emailControl = this.profileForm.get('email');
    if (emailControl?.invalid && emailControl.touched) {
      if (emailControl.errors?.['required']) {
        this.emailError.set('ایمیل اجباری است.');
      } else if (emailControl.errors?.['email'] || emailControl.errors?.['pattern']) {
        this.emailError.set('ایمیل نامعتبر است (مثال: user@example.com).');
      }
    } else {
      this.emailError.set(null);
    }
  }

  checkPhone() {
    const phoneControl = this.profileForm.get('phone');
    if (phoneControl?.invalid && phoneControl.touched) {
      this.phoneError.set('شماره همراه نامعتبر است (مثال: 09123456789).');
    } else {
      this.phoneError.set(null);
    }
  }

  checkPassword() {
    const newPasswordControl = this.profileForm.get('newPassword');
    const confirmPasswordControl = this.profileForm.get('confirmPassword');
    if (newPasswordControl?.value && confirmPasswordControl?.value && newPasswordControl.value !== confirmPasswordControl.value) {
      this.passwordError.set('رمز عبور و تأیید رمز عبور باید یکسان باشند.');
    } else {
      this.passwordError.set(null);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.message.set({ text: 'لطفاً خطاهای فرم را برطرف کنید.', isError: true });
      return;
    }

    const currentUser = this.user();
    if (!currentUser) {
      this.message.set({ text: 'کاربر یافت نشد.', isError: true });
      return;
    }

    const updatedUser = {
      username: currentUser.username,
      fullName: this.profileForm.value.fullName,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone,
      ...(this.profileForm.value.newPassword && { password: this.profileForm.value.newPassword })
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: () => {
        this.authService.getUserProfile().subscribe(profile => {
          if (profile && !profile.createdAt) {
            profile.createdAt = new Date().toISOString(); // پیش‌فرض اگه createdAt نباشه
          }
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