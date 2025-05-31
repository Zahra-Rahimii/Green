import { Component, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
  import { ReportService } from '../../../services/report.service';
  import { ActivatedRoute, Router } from '@angular/router';
  import { Report, UserProfile } from '../../../models/models';
  import { Observable, of } from 'rxjs';
  import { AuthService } from '../../../services/auth.service';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { LocalDatePipe } from '../../../pipes/local-date.pipe';
  import * as L from 'leaflet';

  interface Category {
    id: string;
    label: string;
  }

  @Component({
    selector: 'app-admin-report-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, LocalDatePipe],
    templateUrl: './admin-report-detail.component.html',
    styleUrl: './admin-report-detail.component.css'
  })
  export class AdminReportDetailComponent implements OnInit, AfterViewInit {
    report$: Observable<Report>;
    reportId: string;
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);
    adminComments = signal<string>('');
    assignedRescuer = signal<string>('');
    status = signal<'reviewed' | 'rejected' | 'in_review' | null>(null);
    rescuers: UserProfile[] = [];
    private map?: L.Map;
    private marker?: L.Marker;
    @ViewChild('mapRef') mapRef?: ElementRef;
    categories: Category[] = [
      { id: 'illegal_logging', label: 'قطع درختان' },
      { id: 'forest_fire', label: 'آتش‌سوزی' },
      { id: 'water_pollution', label: 'آلودگی آب' },
      { id: 'illegal_hunting', label: 'شکار غیرمجاز' },
      { id: 'habitat_destruction', label: 'تخریب زیستگاه' },
      { id: 'other', label: 'سایر' }
    ];

    constructor(
      private reportService: ReportService,
      private route: ActivatedRoute,
      private authService: AuthService,
      private router: Router
    ) {
      this.reportId = this.route.snapshot.paramMap.get('id')!;
      this.report$ = this.reportService.getReportById(this.reportId);
    }

    ngOnInit() {
      const user = this.authService.userState();
      if (!user.isLoggedIn || !this.authService.hasRole('admin')) {
        this.router.navigate(['/admin/login']);
      }
      this.loadRescuers();
      this.report$.subscribe(report => {
        this.adminComments.set(report.adminComments || '');
        this.assignedRescuer.set(report.assignedTo || '');
        this.status.set(report.status || null);
      });
    }

    ngAfterViewInit() {
      this.report$.subscribe(report => {
        if (this.mapRef && report.latitude && report.longitude) {
          this.initializeMap(report.latitude, report.longitude);
        }
      });
    }

    private initializeMap(lat: number, lng: number) {
      if (this.mapRef && !this.map) {
        const mapElement = this.mapRef.nativeElement;
        this.map = L.map(mapElement).setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
      }
    }

    ngOnDestroy() {
      if (this.map) {
        this.map.remove();
      }
    }

    saveAdminComments() {
      this.errorMessage.set(null);
      this.successMessage.set(null);
      this.reportService.updateReport(this.reportId, { adminComments: this.adminComments() }).subscribe({
        next: () => this.successMessage.set('نظرات ادمین با موفقیت ذخیره شد!'),
        error: (err) => this.errorMessage.set(err.message || 'خطا در ذخیره نظرات ادمین')
      });
    }

    assignToRescuer() {
      this.errorMessage.set(null);
      this.successMessage.set(null);
      this.reportService.updateReport(this.reportId, { assignedTo: this.assignedRescuer(), isSentToRescuer: true }).subscribe({
        next: () => {
          this.successMessage.set('گزارش با موفقیت به امدادگر تخصیص داده شد!');
          setTimeout(() => this.router.navigate(['/admin']), 2000);
        },
        error: (err) => this.errorMessage.set(err.message || 'خطا در تخصیص به امدادگر')
      });
    }

    goBack() {
      this.router.navigate(['/admin']);
    }

    private loadRescuers() {
      this.rescuers = [
        { id: 'rescuer1', username: 'امدادگر ۱', email: 'rescuer1@example.com', role: 'rescuer', createdAt: '2025-01-01' },
        { id: 'rescuer2', username: 'امدادگر ۲', email: 'rescuer2@example.com', role: 'rescuer', createdAt: '2025-01-02' }
      ];
    }

    getCategoryLabel(categoryId: string): string {
      return this.categories.find((c: Category) => c.id === categoryId)?.label ?? 'نامشخص';
    }

    getStatusLabel(status: 'reviewed' | 'rejected' | 'in_review' | null): string {
      return status ? {
        'reviewed': 'رسیدگی شده',
        'rejected': 'رد شده',
        'in_review': 'در حال بررسی'
      }[status] ?? 'بدون پاسخ' : 'بدون پاسخ';
    }
  }