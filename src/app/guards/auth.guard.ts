import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const token = this.authService.getToken();
    if (!token) {
      // توکن وجود نداره یا منقضی شده
      this.router.navigate(['/login']);
      return of(false);
    }

    // توکن وجود داره، حالا وضعیت کاربر و نقش رو چک کن
    return of(this.authService.userState()).pipe(
      map(user => {
        if (user.isLoggedIn && this.authService.hasRole('admin')) {
          return true; // کاربر لاگین کرده و ادمینه
        } else {
          this.router.navigate(['/login']); // هدایت به /login به جای /admin/login
          return false;
        }
      })
    );
  }
}