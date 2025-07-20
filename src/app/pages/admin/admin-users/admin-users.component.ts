import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../models/models';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../components/shared/header/header.component';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, LocalDatePipe],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users = signal<UserProfile[]>([]);
  filteredUsers = signal<UserProfile[]>([]);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  editingUser = signal<UserProfile | null>(null);
  isLoading = signal(false);
  searchQuery = '';
  filterRole = '';
  sortColumn = 'username';
  sortDirection = 'asc';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        const updatedUsers = users.map(user => {
          if (!user.createdAt) {
            user.createdAt = new Date().toISOString(); // پیش‌فرض اگه createdAt نباشه
          }
          return user;
        });
        this.users.set(updatedUsers);
        this.filterUsers();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'خطا در بارگذاری کاربران');
        this.isLoading.set(false);
      }
    });
  }

  filterUsers() {
    let filtered = this.users();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    if (this.filterRole) {
      filtered = filtered.filter(user => user.role === this.filterRole);
    }

    filtered = [...filtered].sort((a, b) => {
      const key = this.sortColumn as keyof UserProfile;
      const valueA = a[key] || '';
      const valueB = b[key] || '';
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      return (valueA > valueB ? 1 : -1) * direction;
    });

    this.filteredUsers.set(filtered);
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterUsers();
  }

  startEditing(user: UserProfile) {
    this.editingUser.set({ ...user });
  }

  saveUser() {
    const user = this.editingUser();
    if (user) {
      if (!user.createdAt) {
        user.createdAt = new Date().toISOString(); // پیش‌فرض اگه createdAt نباشه
      }
      this.userService.updateUser(user.id, user).subscribe({
        next: (updatedUser) => {
          this.loadUsers();
          this.editingUser.set(null);
          this.successMessage.set('کاربر با موفقیت به‌روزرسانی شد');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => this.errorMessage.set(err.message || 'خطا در به‌روزرسانی کاربر')
      });
    }
  }

  cancelEditing() {
    this.editingUser.set(null);
  }

  deleteUser(id: string) {
    if (confirm('آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
          this.successMessage.set('کاربر با موفقیت حذف شد');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => this.errorMessage.set(err.message || 'خطا در حذف کاربر')
      });
    }
  }
}