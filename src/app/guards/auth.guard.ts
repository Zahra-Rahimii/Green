import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = this.authService.userState(); // مستقیم مقدار سیگنال رو می‌خونیم
    if (!user.isLoggedIn) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRole = route.data['role'] as 'admin' | 'rescuer' | 'user' | null;
    if (!requiredRole) {
      // اگه نیازی به نقش خاص نیست، دسترسی بده (مثلاً صفحه اصلی)
      return true;
    }

    if (this.authService.hasRole(requiredRole)) {
      // هدایت به صفحه پیش‌فرض نقش اگه مسیر فعلی با نقش تطابق نداره
      const currentUrl = state.url;
      const defaultPath = this.getDefaultPath(requiredRole);
      if (currentUrl === '/login' || !currentUrl.startsWith(`/${requiredRole}`)) {
        this.router.navigate([defaultPath]);
      }
      return true;
    } else {
      // هدایت به صفحه پیش‌فرض نقش فعلی یا لاگین
      const userRole = user.role;
      if (userRole) {
        this.router.navigate([this.getDefaultPath(userRole)]);
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }
  }

  private getDefaultPath(role: 'admin' | 'rescuer' | 'user'): string {
    switch (role) {
      case 'admin':
        return '/admin/reports';
      case 'rescuer':
        return '/rescuer/reports';
      case 'user':
        return '/user';
      default:
        return '/login';
    }
  }
}