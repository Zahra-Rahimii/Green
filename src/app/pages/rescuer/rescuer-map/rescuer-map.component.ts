import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { Observable, of } from 'rxjs';
import { Report } from '../../../models/models';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { HeaderComponent } from "../../../components/shared/header/header.component";

@Component({
  selector: 'app-rescuer-map',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './rescuer-map.component.html',
  styleUrl: './rescuer-map.component.css'
})
export class RescuerMapComponent implements OnInit, AfterViewInit {
  reports$: Observable<Report[]>;
  private map?: L.Map;
  private markers: L.Marker[] = [];
  @ViewChild('mapRef') mapRef?: ElementRef;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router
  ) {
    this.reports$ = this.reportService.getReports();
    console.log('Component constructed'); // دیباگ
  }

  ngOnInit() {
    const user = this.authService.userState();
    console.log('ngOnInit - User:', user); // دیباگ
    if (!user.isLoggedIn || !this.authService.hasRole('rescuer')) {
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit - Starting map load'); // دیباگ
    this.reports$.subscribe(reports => {
      const user = this.authService.userState();
      console.log('Reports loaded for user:', user.username, reports); // دیباگ
      if (this.mapRef && user.username) {
        const filteredReports = reports.filter(report => 
          report.assignedTo === user.username && report.status === 'in_review'
        );
        console.log('Filtered reports for user (in_review):', user.username, filteredReports); // دیباگ
        if (filteredReports.length === 0) {
          console.warn('No in_review reports assigned to this rescuer:', user.username);
        }
        this.initializeMap(filteredReports);
      } else {
        console.error('mapRef or username is undefined:', this.mapRef, user.username);
      }
    }, error => {
      console.error('Error loading reports:', error); // دیباگ برای خطاها
    });
  }

  private initializeMap(reports: Report[]) {
    if (this.mapRef && !this.map) {
      const mapElement = this.mapRef.nativeElement;
      this.map = L.map(mapElement).setView([35.6892, 51.3890], 6); // مختصات پیش‌فرض
      console.log('Map initialized:', this.map); // دیباگ

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      if (reports.length > 0 && reports[0].latitude && reports[0].longitude) {
        this.map.setView([reports[0].latitude, reports[0].longitude], 10); // زوم به اولین گزارش
      }

      reports.forEach(report => {
        if (report.latitude && report.longitude) {
          console.log('Adding marker for report:', report.title, [report.latitude, report.longitude]); // دیباگ
          const customIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          const marker = L.marker([report.latitude, report.longitude], { icon: customIcon })
            .addTo(this.map!)
            .bindPopup(`<b>${report.title}</b><br>${report.description}`);
          this.markers.push(marker);
          console.log('Marker added:', marker); // دیباگ برای چک مارکر
        } else {
          console.warn('Report skipped, no valid coordinates:', report.title);
        }
      });
    } else if (this.map) {
      console.log('Map already initialized, skipping:', this.map); // دیباگ
    } else {
      console.error('mapRef or map is undefined in initializeMap');
    }
  }
}