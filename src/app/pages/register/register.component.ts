import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RegisterRequest, RegisterResponse } from '../../models/models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^(?=.*[a-zA-Z])[a-zA-Z0-9\-._]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user'],
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      const { username, email, password, role } = this.registerForm.value;
      this.authService.register({ username, email, password, role }).subscribe({
        next: (response: RegisterResponse) => {
          this.isLoading.set(false);
          if (response.status) {
            this.errorMessage.set(null); // پاک کردن خطا در صورت موفقیت
            // هدایت به صفحه اصلی بعد از ثبت‌نام موفق
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 1000); // تأخیر برای نمایش پیام موفقیت
          } else {
            this.errorMessage.set(response.message || 'ثبت‌نام ناموفق بود');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message || 'خطا در ثبت‌نام. لطفاً دوباره امتحان کنید.');
        }
      });
    } else {
      this.errorMessage.set('لطفاً همه فیلدها را به‌درستی پر کنید.');
    }
  }

  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
}