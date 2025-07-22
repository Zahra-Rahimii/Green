import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/shared/header/header.component';
import { AuthService } from '../../../services/auth.service';
import { ReportService } from '../../../services/report.service';
import { AdminStats } from '../../../models/models';
import { Report, UserProfile } from '../../../models/models';
import { Router } from '@angular/router';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';


@Component({
  selector: 'app-admin-stats',
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.css'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, LocalDatePipe]   
})
export class AdminStatsComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userState = this.checkAdminAccess();
    if (!userState) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStats();
  }

  private checkAdminAccess(): boolean {
    const userState = this.authService.userState();
    return userState.isLoggedIn && userState.role === 'admin';
  }

  private loadStats(): void {
    this.isLoading.set(true);
    this.authService.getUserList().subscribe({
      next: (users: UserProfile[]) => {
        this.reportService.getReports().subscribe({
          next: (reports: Report[]) => {
            const stats: AdminStats = this.calculateStats(users, reports);
            this.stats.set(stats);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.errorMessage.set('خطا در لود گزارش‌ها: ' + err.message);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        this.errorMessage.set('خطا در لود کاربران: ' + err.message);
        this.isLoading.set(false);
      }
    });
  }

  private calculateStats(users: UserProfile[], reports: Report[]): AdminStats {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      rescuers: users.filter(u => u.role === 'rescuer').length,
      regularUsers: users.filter(u => u.role === 'user').length,
      activeUsersToday: users.filter(u => new Date(u.createdAt) >= oneDayAgo).length,
      activeUsersThisWeek: users.filter(u => new Date(u.createdAt) >= oneWeekAgo).length,
      activeUsersThisMonth: users.filter(u => new Date(u.createdAt) >= oneMonthAgo).length,
      loginSuccessCount: 0, // نیاز به لاگ لاگین داریم
      loginFailCount: 0,   // نیاز به لاگ لاگین داریم
      totalReports: reports.length,
      reportsInReview: reports.filter(r => r.status === 'in_review').length,
      reportsReviewed: reports.filter(r => r.status === 'reviewed').length,
      reportsRejected: reports.filter(r => r.status === 'rejected').length,
      onlineUsers: 0, // نیاز به سیستم آنلاین بودن داریم
      lastUpdated: now.toISOString(), // فقط تاریخ ISO ذخیره می‌شه
      avgReviewTime: this.calculateAvgReviewTime(reports),
      assignedReports: reports.filter(r => r.assignedTo).length,
      reportsByCategory: this.countReportsByCategory(reports),
      userActivityTrend: this.generateUserActivityTrend(reports)
    };
  }

  private calculateAvgReviewTime(reports: Report[]): number | undefined {
    const reviewedReports = reports.filter(r => r.status === 'reviewed' && r.updatedAt);
    if (reviewedReports.length === 0) return undefined;
    const totalTime = reviewedReports.reduce((sum, r) => {
      const created = new Date(r.createdAt).getTime();
      const updated = new Date(r.updatedAt!).getTime();
      return sum + (updated - created) / (1000 * 60 * 60); // ساعت
    }, 0);
    return Number((totalTime / reviewedReports.length).toFixed(2));
  }

  private countReportsByCategory(reports: Report[]): { [key: string]: number } {
    return reports.reduce((acc: { [key: string]: number }, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});
  }

  private generateUserActivityTrend(reports: Report[]): { date: string; count: number }[] {
    const trend: { [key: string]: number } = {};
    reports.forEach(r => {
      const date = r.createdAt.split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });
    const result = Object.keys(trend).map(date => ({ date, count: trend[date] }));
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7); // 7 روز اخیر
  }
}