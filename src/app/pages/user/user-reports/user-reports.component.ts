import { Component, OnInit, signal } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../models/models';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';
import { HeaderComponent } from '../../../components/shared/header/header.component';

@Component({
  selector: 'app-user-reports',
  standalone: true,
  imports: [CommonModule, LocalDatePipe, HeaderComponent],
  templateUrl: './user-reports.component.html',
  styleUrl: './user-reports.component.css'
})
export class UserReportsComponent implements OnInit {
  reports$: Observable<Report[]> | undefined; // تعریف اولیه بدون مقداردهی
  isLoading = signal<boolean>(true);
  filterStatus = signal<string>('');

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.userState();
    if (!user.isLoggedIn) {
      this.router.navigate(['/login']);
    } else {
      this.reports$ = this.reportService.getReports().pipe(
        map(reports => reports.filter(report => report.id === user.username))
      );
      if (this.reports$) {
        this.reports$.subscribe(() => {
          this.isLoading.set(false);
        });
      } else {
        this.isLoading.set(false); // اگه گزارش‌ها لود نشد، لودینگ رو خاموش کن
      }
    }
  }

  filterReports(event: Event) {
    const target = event.target as HTMLSelectElement; // فقط select رو هدف قرار می‌دیم
    const status = target.value || '';
    this.filterStatus.set(status);
  }

  viewDetail(reportId: string) {
    this.router.navigate(['/user/report', reportId]);
  }

  deleteReport(reportId: string) {
    if (confirm('آیا مطمئنید می‌خواهید این گزارش را حذف کنید؟')) {
      this.isLoading.set(true);
      this.reportService.deleteReport(reportId).subscribe({
        next: () => {
          const user = this.authService.userState();
          this.reports$ = this.reportService.getReports().pipe(
            map(reports => reports.filter(report => report.id === user.username))
          );
          if (this.reports$) {
            this.reports$.subscribe(() => {
              this.isLoading.set(false);
            });
          } else {
            this.isLoading.set(false);
          }
        },
        error: (err) => {
          console.error('خطا در حذف گزارش:', err);
          this.isLoading.set(false);
        }
      });
    }
  }
}