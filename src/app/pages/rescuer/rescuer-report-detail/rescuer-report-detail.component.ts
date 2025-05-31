import { Component, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Report } from '../../../models/models';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { LocalDatePipe } from '../../../pipes/local-date.pipe';
import * as L from 'leaflet';

interface Category {
  id: string;
  label: string;
}

@Component({
  selector: 'app-rescuer-report-detail',
  standalone: true,
  imports: [CommonModule, LocalDatePipe],
  templateUrl: './rescuer-report-detail.component.html',
  styleUrl: './rescuer-report-detail.component.css'
})
export class RescuerReportDetailComponent implements OnInit, AfterViewInit {
  report$: Observable<Report>;
  reportId: string;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  status = signal<'reviewed' | 'rejected' | 'in_review' | null>(null);
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
    if (!user.isLoggedIn || !this.authService.hasRole('rescuer')) {
      this.router.navigate(['/login']);
    }
    this.report$.subscribe(report => {
      if (report.assignedTo !== user.username) {
        this.router.navigate(['/rescuer']);
      }
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

  updateStatus(status: 'reviewed' | 'rejected' | 'in_review') {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.reportService.updateReport(this.reportId, { status }).subscribe({
      next: () => {
        this.status.set(status);
        this.successMessage.set('وضعیت با موفقیت به‌روزرسانی شد!');
      },
      error: (err) => this.errorMessage.set(err.message || 'خطا در به‌روزرسانی وضعیت')
    });
  }

  goBack() {
    this.router.navigate(['/rescuer']);
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