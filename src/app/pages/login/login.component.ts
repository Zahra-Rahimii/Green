import { Component, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { LoginRequest, LoginResponse } from '../../models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);
  isLoggedIn = computed(() => this.authService.userState().isLoggedIn);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    effect(() => {
      if (this.isLoggedIn()) {
        if (this.authService.hasRole('admin')) {
          this.router.navigate(['/admin/users']);
        } else {
          this.router.navigate(['/']);
        }
      }
    });

    effect(() => {
      this.loginForm.valueChanges.subscribe(() => {
        this.errorMessage.set(null); // پاک کردن پیام خطا وقتی فرم تغییر می‌کنه
      });
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      const credentials: LoginRequest = this.loginForm.value;
      this.authService.login(credentials).subscribe({
        next: (response: LoginResponse) => {
          this.isLoading.set(false);
          // به‌روزرسانی وضعیت کاربر بعد از لاگین موفق
          if (this.authService.userState().isLoggedIn) {
            if (this.authService.hasRole('admin')) {
              this.router.navigate(['/admin/users']);
            } else {
              this.router.navigate(['/']);
            }
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'خطا در ورود. لطفاً دوباره امتحان کنید.');
        }
      });
    } else {
      this.errorMessage.set('لطفاً همه فیلدها را به‌درستی پر کنید.');
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}