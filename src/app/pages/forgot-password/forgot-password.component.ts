import { Component,signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ForgotPasswordResponse } from '../../models/models';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
forgotForm: FormGroup;
message = signal<string | null>(null);
isLoading = signal(false);

constructor(
  private fb: FormBuilder,
  private authService: AuthService
){
this.forgotForm = this.fb.group({
  email: ['',[Validators.required,Validators.email]]
});
}

onSubmit(){
  if(this.forgotForm.valid){
    this.isLoading.set(true);
    this.message.set(null);
    const { email } = this.forgotForm.value;
    this.authService.forgotPassword(email).subscribe({
          next: (response: ForgotPasswordResponse) => {
          this.isLoading.set(false);
          this.message.set(response.message || 'درخواست با موفقیت ارسال شد.');
        },     
           error: (err) => {
          this.isLoading.set(false);
          this.message.set(err.message || 'خطا در ارسال درخواست.');
        }

    })
  }else{
    this.message.set('لطفاً ایمیل معتبر وارد کنید.');
  }
}
  get email() { return this.forgotForm.get('email'); }

}
