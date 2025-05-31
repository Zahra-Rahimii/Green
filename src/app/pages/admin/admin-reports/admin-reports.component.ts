import { Component, OnInit, signal, computed } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../models/models';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';
import { HeaderComponent } from '../../../components/shared/header/header.component';
import { HomeComponent } from '../../home/home.component';

@Component({
  selector: 'app-admin-reports',
  imports: [CommonModule, RouterModule, LocalDatePipe,HeaderComponent],
  standalone: true,
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.css'
})
export class AdminReportsComponent implements OnInit {
  reports$: Observable<Report[]>;
  filteredReports$: Observable<Report[]>;
  isLoading = signal<boolean>(true);

  categories = [
    { id: 'illegal_logging', label: 'قطع درختان' },
    { id: 'forest_fire', label: 'آتش‌سوزی' },
    { id: 'water_pollution', label: 'آلودگی آب' },
    { id: 'illegal_hunting', label: 'شکار غیرمجاز' },
    { id: 'habitat_destruction', label: 'تخریب زیستگاه' },
    { id: 'other', label: 'سایر' }
  ];

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router
  ) {
    this.reports$ = this.reportService.getReports();
    this.filteredReports$ = this.reports$;
  }

  ngOnInit() {
    const user = this.authService.userState();
    if (!user.isLoggedIn || !this.authService.hasRole('admin')) {
      this.router.navigate(['/admin/login']);
    }
    this.reports$.subscribe(() => {
      this.isLoading.set(false);
    });
  }

  filterReports(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.value;
    const filterType = target.tagName === 'INPUT' ? 'search' : 'category';

    this.filteredReports$ = this.reports$.pipe(
      map(reports => reports.filter(report => {
        if (filterType === 'search') {
          const searchValue = value.trim();
          const reporterName = report.reporterName ?? '';
          const address = report.address ?? '';
          console.log('Search Value:', searchValue);
          console.log('Report:', { reporterName, address });
          return reporterName.includes(searchValue) || address.includes(searchValue);
        } else if (filterType === 'category') {
          console.log('Category Filter Value:', value);
          console.log('Report Category:', report.category);
          return value === '' || report.category === value;
        }
        return true;
      }))
    );
  }

  getCategoryLabel(categoryId: string): string {
    return categoryId ? this.categories.find(c => c.id.trim().toLowerCase() === categoryId.trim().toLowerCase())?.label ?? 'نامشخص' : 'نامشخص';
  }

  getStatusLabel(status?: 'reviewed' | 'rejected' | 'in_review' | null): string {
    if (!status) return 'بدون پاسخ';
    return {
      'reviewed': 'رسیدگی شده',
      'rejected': 'رد شده',
      'in_review': 'در حال بررسی',
    }[status] ?? 'بدون پاسخ';
  }

  viewDetail(reportId: string) {
    this.router.navigate(['/admin/reports', reportId]);
  }

  deleteReport(reportId: string) {
    if (confirm('آیا مطمئنید می‌خواهید این گزارش را حذف کنید؟')) {
      this.isLoading.set(true);
      this.reportService.deleteReport(reportId).subscribe({
        next: () => {
          this.reports$ = this.reportService.getReports();
          this.filteredReports$ = this.reports$;
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('خطا در حذف گزارش:', err);
          this.isLoading.set(false);
        }
      });
    }
  }
}