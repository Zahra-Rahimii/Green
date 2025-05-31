import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { UserProfile } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users = signal<UserProfile[]>([]);

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    const users: UserProfile[] = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_')) {
        const userData = JSON.parse(localStorage.getItem(key)!);
        users.push({
          id: key.replace('user_', ''),
          username: userData.username,
          email: userData.email,
          phone: userData.phone || '',
          role: userData.role,
          status: userData.status || 'active',
          createdAt: userData.createdAt || new Date().toISOString(),
          password: userData.password
        });
      }
    });
    this.users.set(users);
  }

  // متد برای همگام‌سازی فوری
  syncUsers() {
    this.loadUsers();
  }

  getUsers(): Observable<UserProfile[]> {
    return of(this.users());
  }

  getUserById(id: string): Observable<UserProfile> {
    const user = this.users().find(u => u.id === id);
    if (user) {
      return of(user);
    }
    return throwError(() => new Error('کاربر یافت نشد'));
  }

  addUser(user: UserProfile): Observable<UserProfile> {
    // چک کردن وجود کاربر در localStorage و users
    const existingUserInStorage = Object.keys(localStorage).some(key => {
      if (key.startsWith('user_')) {
        const storedUser = JSON.parse(localStorage.getItem(key)!);
        return storedUser.username.toLowerCase() === user.username.toLowerCase() || storedUser.email === user.email;
      }
      return false;
    });
    const existingUserInMemory = this.users().find(u => 
      u.username.toLowerCase() === user.username.toLowerCase() || 
      u.email === user.email
    );
    if (existingUserInStorage || existingUserInMemory) {
      return throwError(() => new Error('کاربر با این نام کاربری یا ایمیل قبلاً ثبت شده است.'));
    }

    const users = this.users();
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const newUser: UserProfile = { ...user, id: newId };
    users.push(newUser);
    this.users.set(users);
    localStorage.setItem(`user_${newId}`, JSON.stringify(newUser));
    return of(newUser);
  }

  updateUser(id: string, updatedUser: Partial<UserProfile>): Observable<UserProfile> {
    const userKey = `user_${id}`;
    const userData = localStorage.getItem(userKey);
    if (!userData) {
      return throwError(() => new Error('کاربر یافت نشد'));
    }
    const currentUser = JSON.parse(userData);
    const newUserData = { ...currentUser, ...updatedUser, id };
    localStorage.setItem(userKey, JSON.stringify(newUserData));
    this.syncUsers();
    return of(newUserData as UserProfile);
  }

  deleteUser(id: string): Observable<void> {
    const userKey = `user_${id}`;
    if (!localStorage.getItem(userKey)) {
      return throwError(() => new Error('کاربر یافت نشد'));
    }
    localStorage.removeItem(userKey);
    this.syncUsers();
    return of(undefined);
  }

  // متد برای ریست دیتا
  resetData() {
    localStorage.clear();
    this.syncUsers();
  }
}