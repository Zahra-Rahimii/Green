import { Component, signal, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import type { Report } from '../../models/models';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/shared/header/header.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent]
})
export class ReportComponent implements AfterViewInit, OnDestroy {
  reportForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  imagePreview = signal<string | null>(null);
  selectedCategory = signal<{ id: string; label: string; image: string } | null>(null);
  private map?: L.Map;
  private marker?: L.Marker;
  private locationSet = signal(false);
  @ViewChild('mapRef') mapRef?: ElementRef;
  @ViewChild('addressInput') addressInput!: ElementRef;

  categories = [
    { id: 'illegal_logging', label: 'قطع درختان', image: '/assets/images/category1.jpg' },
    { id: 'forest_fire', label: 'آتش‌سوزی', image: '/assets/images/category2.jpg' },
    { id: 'water_pollution', label: 'آلودگی آب', image: '/assets/images/category3.jpeg' },
    { id: 'illegal_hunting', label: 'شکار غیرمجاز', image:  '/assets/images/category4.jpeg'  },
    { id: 'habitat_destruction', label: 'تخریب زیستگاه', image:  '/assets/images/category5.jpeg'  },
    { id: 'other', label: 'سایر', image:  '/assets/images/category6.jpeg'  }
  ];

  reporterNameControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  phoneControl = new FormControl('', [Validators.required, Validators.pattern(/^09\d{9}$/)]);
  descriptionControl = new FormControl('', [Validators.required, Validators.minLength(10)]);
  addressControl = new FormControl('', [Validators.required, Validators.minLength(5)]);
  latitudeControl = new FormControl(null, [Validators.required, Validators.min(-90), Validators.max(90)]);
  longitudeControl = new FormControl(null, [Validators.required, Validators.min(-180), Validators.max(180)]);
  imageControl = new FormControl(null);
  categoryControl = new FormControl('', [Validators.required]); // فیلد جدید برای category

  constructor(private fb: FormBuilder, private reportService: ReportService) {
    this.reportForm = this.fb.group({
      reporterName: this.reporterNameControl,
      phone: this.phoneControl,
      description: this.descriptionControl,
      address: this.addressControl,
      latitude: this.latitudeControl,
      longitude: this.longitudeControl,
      category: this.categoryControl, // جایگزینی با categoryControl
      image: this.imageControl
    });
  }

  ngAfterViewInit(): void {
    // نیازی به اینجای کد نیست چون نقشه تو selectCategory لود می‌شه
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.marker = undefined;
    }
  }

  selectCategory(category: { id: string; label: string; image: string }): void {
    this.selectedCategory.set(category);
    this.reportForm.get('category')?.setValue(category.id); // مقدار category رو مستقیم ست می‌کنیم
    setTimeout(() => {
      if (this.mapRef) {
        this.initializeMap();
        this.getUserLocation();
      }
    }, 100);
  }

  private initializeMap(): void {
    if (this.mapRef && !this.map) {
      const mapElement = this.mapRef.nativeElement;
      console.log('Initializing map on element:', mapElement);

      this.map = L.map(mapElement, {
        zoomControl: true
      }).setView([35.7, 51.4], 10);

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

      this.marker = L.marker([35.7, 51.4], { icon: customIcon }).addTo(this.map);
      this.reportForm.patchValue({ latitude: 35.7, longitude: 51.4 });
      this.locationSet.set(true);

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 200);

      const handler: L.LeafletEventHandlerFn = (event: L.LeafletEvent) => {
        if ('latlng' in event && (event as L.LeafletMouseEvent).latlng) {
          const { lat, lng } = (event as L.LeafletMouseEvent).latlng;
          console.log('Map tapped/clicked at:', lat, lng);
          this.reportForm.patchValue({ latitude: lat, longitude: lng });
          this.locationSet.set(true);
          if (this.marker) {
            this.marker.setLatLng([lat, lng]);
          } else {
            this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map!);
          }
        }
      };
      this.map.on('tap click', handler);
    }
  }

  getUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log('User location detected:', lat, lng);
          this.reportForm.patchValue({ latitude: lat, longitude: lng });
          this.locationSet.set(true);
          if (this.map) {
            this.map.setView([lat, lng], 13);
            if (this.marker) {
              this.marker.setLatLng([lat, lng]);
            } else {
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
        },
        (error) => {
          this.errorMessage.set('موقعیت خودکار تشخیص داده نشد. لطفاً GPS رو فعال کن یا با کلیک روی نقشه موقعیت رو دستی تنظیم کن.');
          console.error('Geolocation error:', error);
          this.locationSet.set(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      this.errorMessage.set('مرورگر از Geolocation پشتیبانی نمی‌کند. لطفاً با کلیک روی نقشه موقعیت رو دستی تنظیم کن.');
      this.locationSet.set(false);
    }
  }

  setManualLocation(): void {
    this.errorMessage.set('لطفاً با کلیک یا لمس روی نقشه موقعیت رو تنظیم کن.');
    this.locationSet.set(false);
  }

  async searchAddress(): Promise<void> {
    const address = this.reportForm.get('address')?.value;
    if (!address) {
      this.errorMessage.set('لطفاً آدرس را وارد کنید.');
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        this.reportForm.patchValue({ latitude: lat, longitude: lng });
        this.locationSet.set(true);
        if (this.map) {
          this.map.setView([lat, lng], 13);
          if (this.marker) {
            this.marker.setLatLng([lat, lng]);
          } else {
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
      } else {
        this.errorMessage.set('آدرس یافت نشد. لطفاً آدرس دقیق‌تری وارد کنید.');
        this.locationSet.set(false);
      }
    } catch (err) {
      console.error('Error fetching geocoding data:', err);
      this.errorMessage.set('خطا در جستجوی آدرس. لطفاً دوباره تلاش کنید.');
      this.locationSet.set(false);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
        this.reportForm.patchValue({ image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.reportForm.valid && this.selectedCategory() && this.isLocationSet()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);
      const report: Report = {
        ...this.reportForm.value,
        id: '',
        title: this.selectedCategory()!.label,
        status: 'pending',
        isSentToRescuer: false,
        createdAt: new Date().toISOString(), // مقدار پیش‌فرض برای createdAt
        updatedAt: null
      };
      console.log('Submitting report:', report); // دیباگ برای چک کردن category
      this.reportService.addReport(report).subscribe({
        next: (response: Report) => {
          console.log('Report created:', response);
          this.isLoading.set(false);
          this.successMessage.set('گزارش با موفقیت ثبت شد!');
          setTimeout(() => {
            this.reportForm.reset();
            this.imagePreview.set(null);
            this.selectedCategory.set(null);
            this.locationSet.set(false);
            if (this.map) {
              this.map.remove();
              this.map = undefined;
              this.marker = undefined;
            }
          }, 2000);
        },
        error: (err: unknown) => {
          console.error('Error creating report:', err);
          this.isLoading.set(false);
          this.errorMessage.set((err as Error).message || 'خطا در ثبت گزارش.');
        }
      });
    } else {
      this.errorMessage.set('لطفاً فرم را تکمیل کنید و موقعیت را تنظیم کنید.');
    }
  }

  isLocationSet(): boolean {
    return this.locationSet();
  }

  get reporterName() { return this.reportForm.get('reporterName'); }
  get phone() { return this.reportForm.get('phone'); }
  get description() { return this.reportForm.get('description'); }
  get address() { return this.reportForm.get('address'); }
  get latitude() { return this.reportForm.get('latitude'); }
  get longitude() { return this.reportForm.get('longitude'); }
}