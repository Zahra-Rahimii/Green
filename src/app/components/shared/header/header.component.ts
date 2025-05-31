import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    RouterLink
  ],
  standalone: true
})
export class HeaderComponent {
  isMenuOpen = signal(false);
  isLoggedIn = computed(() => this.authService.userState().isLoggedIn);
  userRole = computed(() => this.authService.userState().role);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isMenuOpen.update(prev => !prev);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}