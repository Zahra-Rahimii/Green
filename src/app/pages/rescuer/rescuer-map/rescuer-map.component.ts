import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../services/report.service';
import { Report } from '../../../models/models';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { Observable } from 'rxjs';
import { HeaderComponent } from "../../../components/shared/header/header.component";

@Component({
  selector: 'app-rescuer-map',
  standalone: true,
  imports: [FormsModule, HeaderComponent],
  templateUrl: './rescuer-map.component.html',
  styleUrl: './rescuer-map.component.css'
})
export class RescuerMapComponent implements OnInit, AfterViewInit {
  reports$: Observable<Report[]>;
  private map?: L.Map;
  private markers: L.Marker[] = [];
  private routes: L.Polyline[] = [];
  @ViewChild('mapRef') mapRef?: ElementRef;

  constructor(
    private reportService: ReportService,
    private authService: AuthService,
    private router: Router
  ) {
    this.reports$ = this.reportService.getReports();
  }

  ngOnInit() {
    const user = this.authService.userState();
    if (!user.isLoggedIn || !this.authService.hasRole('rescuer')) {
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewInit() {
    this.reports$.subscribe(reports => {
      const user = this.authService.userState();
      if (this.mapRef && user.username) {
        const filteredReports = reports.filter(report => 
          report.assignedTo === user.username && report.status === 'in_review'
        );
        if (filteredReports.length === 0) {
          console.warn('No in_review reports assigned to this rescuer:', user.username);
        }
        this.initializeMap(filteredReports);
      } else {
        console.error('mapRef or username is undefined:', this.mapRef, user.username);
      }
    }, error => {
    });
  }

  private initializeMap(reports: Report[]) {
    if (this.mapRef && !this.map) {
      const mapElement = this.mapRef.nativeElement;
      this.map = L.map(mapElement).setView([35.6892, 51.3890], 6); // مختصات پیش‌فرض
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      if (reports.length > 0) {
        const bounds = L.latLngBounds(
          reports.map(report => L.latLng(report.latitude!, report.longitude!))
        );
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }

      const categoryColors: { [key: string]: string } = {
        'forest_fire': '#FF5733',
        'water_pollution': '#3498DB',
        'illegal_logging': '#1ecc3b',
        'illegal_hunting': '#F1C40F',
        'habitat_destruction': '#9B59B6',
        'other': '#7F8C8D'
      };

      reports.forEach(report => {
        if (report.latitude && report.longitude) {
          const categoryColor = categoryColors[report.category || 'other'] || '#7F8C8D';
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${categoryColor}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff;"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          const marker = L.marker([report.latitude, report.longitude], { icon: customIcon })
            .addTo(this.map!)
            .bindPopup(`
              <b>${report.title}</b><br>
              ${report.description}<br>
              <small>تاریخ: ${new Date(report.createdAt!).toLocaleDateString('fa-IR')}</small><br>
              <small>دسته‌بندی: ${report.category || 'نامشخص'}</small>
            `);
          this.markers.push(marker);
          const rescuerLocation = L.latLng(35.6892, 51.3890); // مختصات فرضی امدادگر
          const route = L.polyline([rescuerLocation, L.latLng(report.latitude!, report.longitude)], {
            color: '#1b1715ff',
            weight: 2,
            opacity: 0.7
          }).addTo(this.map!);
          this.routes.push(route);
        } else {
          console.warn('Report skipped, no valid coordinates:', report.title);
        }
      });
    } else if (this.map) {
    } else {
      console.error('mapRef or map is undefined in initializeMap');
    }
  }
} 
