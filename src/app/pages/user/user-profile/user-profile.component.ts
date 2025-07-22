import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HeaderComponent } from '../../../components/shared/header/header.component';
import { AuthService } from '../../../services/auth.service';
import { UserProfile } from '../../../models/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent]
})
export class UserProfileComponent implements OnInit {
  profileForm: FormGroup;
  userProfile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isEditing = signal<boolean>(false);
  emailError = signal<string | null>(null);
  phoneError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: [''],
      email: ['', [Validators.required, Validators.email, Validators.pattern('^[^\s@]+@[^\s@]+\.[^\s@]+$')]],
      phone: ['', [Validators.pattern('^09[0-9]{9}$')]],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  ngOnInit(): void {
    const userState = this.authService.userState();
    if (!userState.isLoggedIn) {
      this.router.navigate(['/login']);
    }
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        if (profile && !profile.createdAt) {
          profile.createdAt = new Date().toISOString();
        }
        this.userProfile.set(profile);
        if (profile) {
          this.profileForm.patchValue({
            fullName: profile.fullName || '',
            email: profile.email || '',
            phone: profile.phone || ''
          });
        }
        this.isLoading.set(false);
        this.resetMessages();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('خطا در لود پروفایل: ' + err.message);
      }
    });
  }

  toggleEdit(): void {
    this.isEditing.set(!this.isEditing());
    this.emailError.set(null);
    this.phoneError.set(null);
    this.passwordError.set(null);
    this.resetMessages();
    if (this.isEditing()) {
      const currentUser = this.userProfile();
      if (currentUser) {
        this.profileForm.patchValue({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || ''
        });
      }
    }
  }

  checkEmail(): void {
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

  checkPhone(): void {
    const phoneControl = this.profileForm.get('phone');
    if (phoneControl?.invalid && phoneControl.touched) {
      this.phoneError.set('شماره همراه نامعتبر است (مثال: 09123456789).');
    } else {
      this.phoneError.set(null);
    }
  }

  checkPassword(): void {
    const newPasswordControl = this.profileForm.get('newPassword');
    const confirmPasswordControl = this.profileForm.get('confirmPassword');
    if (newPasswordControl?.value && confirmPasswordControl?.value && newPasswordControl.value !== confirmPasswordControl.value) {
      this.passwordError.set('رمز عبور و تأیید رمز عبور باید یکسان باشند.');
    } else {
      this.passwordError.set(null);
    }
  }

  saveProfile(): void {
    this.checkEmail();
    this.checkPhone();
    this.checkPassword();

    if (this.profileForm.invalid || this.passwordError()) {
      this.errorMessage.set('لطفاً خطاهای فرم را برطرف کنید.');
      return;
    }

    const currentUser = this.userProfile();
    if (!currentUser) {
      this.errorMessage.set('کاربر یافت نشد.');
      return;
    }

    const updatedUser = {
      username: currentUser.username,
      fullName: this.profileForm.value.fullName,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone,
      ...(this.profileForm.value.newPassword && { password: this.profileForm.value.newPassword })
    };

    this.isLoading.set(true);
    this.authService.updateProfile(updatedUser).subscribe({
      next: () => {
        this.loadProfile();
        this.isEditing.set(false);
        this.successMessage.set('اطلاعات با موفقیت به‌روزرسانی شد!');
        setTimeout(() => this.resetMessages(), 3000); 
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('خطا در به‌روزرسانی پروفایل: ' + err.message);
        this.isLoading.set(false);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private resetMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}