import { Component, OnInit, signal } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../models/models';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';

@Component({
  selector: 'app-rescuer-reports',
  imports: [CommonModule, RouterModule, LocalDatePipe],
  standalone: true,
  templateUrl: './rescuer-reports.component.html',
  styleUrl: './rescuer-reports.component.css'
})
export class RescuerReportsComponent implements OnInit {
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
    if (!user.isLoggedIn || !this.authService.hasRole('rescuer')) {
      this.router.navigate(['/login']);
    }
    this.filteredReports$ = this.reports$.pipe(
      map(reports => reports.filter(report => report.assignedTo === user.username))
    );
    this.reports$.subscribe(() => {
      this.isLoading.set(false);
    });
  }

  getCategoryLabel(categoryId: string): string {
    return categoryId ? this.categories.find(c => c.id.trim().toLowerCase() === categoryId.trim().toLowerCase())?.label ?? 'نامشخص' : 'نامشخص';
  }

  getStatusLabel(status?: 'reviewed' | 'rejected' | 'in_review' | null): string {
    return status ? {
      'reviewed': 'رسیدگی شده',
      'rejected': 'رد شده',
      'in_review': 'در حال بررسی'
    }[status] ?? 'بدون پاسخ' : 'بدون پاسخ';
  }

  viewDetail(reportId: string) {
    this.router.navigate(['/rescuer/report', reportId]);
  }
}