import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoginRequest, LoginResponse, RegisterRequest, UserState, RegisterResponse, UserProfile } from '../models/models';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user = signal<UserState>({ isLoggedIn: false, role: null, username: undefined });
  userState = this.user.asReadonly();

  constructor(private userService: UserService) {
    const token = this.getToken();
    if (token) {
      const role = localStorage.getItem('role');
      const validRole = role && ['admin', 'rescuer', 'user'].includes(role) ? role as 'admin' | 'rescuer' | 'user' : null;
      this.user.set({
        isLoggedIn: true,
        role: validRole,
        username: localStorage.getItem('username') ?? undefined
      });
    }
  }

  private saveAuthData(token: string | undefined, role: string | undefined, username: string | undefined) {
    console.log('Saving auth data:', { token, role, username });
    localStorage.setItem('token', token || '');
    localStorage.setItem('role', role || '');
    localStorage.setItem('username', username || '');
    localStorage.setItem('token_expiry', (Date.now() + 60 * 60 * 1000).toString());
  }

  public getToken(): string | null {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('token_expiry');
    if (token && expiry) {
      if (Date.now() < parseInt(expiry)) {
        console.log('Getting token:', token);
        return token;
      } else {
        console.log('Token expired');
        this.user.set({ isLoggedIn: false, role: null, username: undefined });
        return null;
      }
    }
    return null;
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('token_expiry');
  }

  register(credentials: RegisterRequest): Observable<RegisterResponse> {
    console.log('Registering user:', credentials);
    this.userService.syncUsers();
    const normalizedUsername = credentials.username.toLowerCase();
    const existingUser = Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const user = JSON.parse(localStorage.getItem(key)!);
        return user.username.toLowerCase() === normalizedUsername;
      }
      return false;
    });

    if (existingUser) {
      return throwError(() => new Error('نام کاربری قبلاً ثبت شده است.'));
    }

    const existingEmail = Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const user = JSON.parse(localStorage.getItem(key)!);
        return user.email === credentials.email;
      }
      return false;
    });
    if (existingEmail) {
      return throwError(() => new Error('ایمیل قبلاً ثبت شده است.'));
    }

    const newUser: UserProfile = {
      id: '',
      username: credentials.username,
      email: credentials.email,
      phone: credentials.phone || '',
      role: credentials.role || 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      password: credentials.password
    };

    return this.userService.addUser(newUser).pipe(
      map((addedUser) => {
        const token = 'mock-token-' + Math.random().toString(36).substring(2);
        this.saveAuthData(token, credentials.role || 'user', credentials.username);
        this.user.set({
          isLoggedIn: true,
          role: credentials.role || null,
          username: credentials.username
        });
        return {
          token,
          role: credentials.role || 'user',
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          message: 'ثبت‌نام موفقیت‌آمیز بود',
          status: true
        } as RegisterResponse;
      }),
      catchError(err => throwError(() => err))
    );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.userService.syncUsers();
    const normalizedUsername = credentials.username.toLowerCase();
    let userData: string | null = null;
    let userKey: string | null = null;

    Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const storedUser = JSON.parse(localStorage.getItem(key)!);
        if (storedUser.username.toLowerCase() === normalizedUsername) {
          userData = localStorage.getItem(key);
          userKey = key;
          return true;
        }
      }
      return false;
    });

    if (!userData) {
      return throwError(() => new Error('کاربر یافت نشد'));
    }

    const user = JSON.parse(userData);
    if (user.password !== credentials.password) {
      return throwError(() => new Error('رمز عبور اشتباه است'));
    }

    const mockResponse: LoginResponse = {
      token: 'mock-token-' + Math.random().toString(36).substring(2),
      role: user.role,
      username: user.username
    };

    this.saveAuthData(mockResponse.token, mockResponse.role, mockResponse.username);
    this.user.set({
      isLoggedIn: true,
      role: mockResponse.role || null,
      username: mockResponse.username
    });

    return of(mockResponse);
  }

  forgotPassword(email: string): Observable<any> {
    const userExists = Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const user = JSON.parse(localStorage.getItem(key)!);
        return user.email === email;
      }
      return false;
    });

    if (!userExists) {
      return throwError(() => new Error('ایمیل یافت نشد'));
    }

    return of({ message: 'ایمیل بازیابی ارسال شد', status: true });
  }

  logout() {
    this.clearAuthData();
    this.user.set({
      isLoggedIn: false,
      role: null,
      username: undefined
    });
  }

  hasRole(role: 'admin' | 'rescuer' | 'user'): boolean {
    return this.user().role === role;
  }

  changePassword(newPassword: string): Observable<any> {
    const username = this.user().username;
    if (!username) {
      return throwError(() => new Error('کاربر وارد نشده است'));
    }

    let userData: string | null = null;
    let userKey: string | null = null;
    Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const storedUser = JSON.parse(localStorage.getItem(key)!);
        if (storedUser.username.toLowerCase() === username.toLowerCase()) {
          userData = localStorage.getItem(key);
          userKey = key;
          return true;
        }
      }
      return false;
    });

    if (!userData || !userKey) {
      return throwError(() => new Error('کاربر یافت نشد'));
    }

    const user = JSON.parse(userData);
    user.password = newPassword;
    try {
      localStorage.setItem(userKey, JSON.stringify(user));
      return of({ message: 'رمز عبور با موفقیت تغییر کرد', status: true });
    } catch (error) {
      return throwError(() => new Error('خطا در تغییر رمز'));
    }
  }

  updateProfile(updatedUser: Partial<UserProfile>): Observable<any> {
    const username = this.user().username;
    if (!username) {
      return throwError(() => new Error('کاربر وارد نشده است'));
    }

    let userData: string | null = null;
    let userKey: string | null = null;
    Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const storedUser = JSON.parse(localStorage.getItem(key)!);
        if (storedUser.username.toLowerCase() === username.toLowerCase()) {
          userData = localStorage.getItem(key);
          userKey = key;
          return true;
        }
      }
      return false;
    });

    if (!userData || !userKey) {
      return throwError(() => new Error('کاربر یافت نشد'));
    }

    const user = JSON.parse(userData);
    const newEmail = updatedUser.email;
    let shouldCheckEmail = false;

    if (newEmail && newEmail !== user.email) {
      shouldCheckEmail = true;
    }

    if (shouldCheckEmail) {
      const existingEmail = Object.keys(localStorage).some(key => {
        if (key.startsWith('user_') && key !== userKey) {
          const storedUser = JSON.parse(localStorage.getItem(key)!);
          return storedUser.email === newEmail;
        }
        return false;
      });

      if (existingEmail) {
        return throwError(() => new Error('ایمیل قبلاً ثبت شده است.'));
      }
    }

    const updatedProfile: UserProfile = { ...user, ...updatedUser, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(userKey, JSON.stringify(updatedProfile));
      this.userService.syncUsers();
      return of({ message: 'پروفایل با موفقیت به‌روزرسانی شد', status: true });
    } catch (error) {
      return throwError(() => new Error('خطا در به‌روزرسانی پروفایل'));
    }
  }

  getUserProfile(): Observable<UserProfile | null> {
    const username = this.user().username;
    if (!username) {
      return of(null);
    }

    let userData: string | null = null;
    Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const storedUser = JSON.parse(localStorage.getItem(key)!);
        if (storedUser.username.toLowerCase() === username.toLowerCase()) {
          userData = localStorage.getItem(key);
          return true;
        }
      }
      return false;
    });

    return of(userData ? JSON.parse(userData) : null);
  }

  getUserList(): Observable<UserProfile[]> {
    return this.userService.getUsers();
  }
}