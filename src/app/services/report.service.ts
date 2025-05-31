import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import type { Report } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private reports = signal<Report[]>([]);
  private readonly MAX_REPORTS = 20;

  constructor() {
    this.loadReports();
  }

  private loadReports(): void {
    const reports: Report[] = [];
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('report_')) {
          const reportData = JSON.parse(localStorage.getItem(key)!);
          console.log('Loaded Report Data:', reportData); // دیباگ
          reports.push({
            id: key.replace('report_', ''),
            title: reportData.title || 'بدون عنوان',
            reporterName: reportData.reporterName || 'ناشناس',
            phone: reportData.phone || '',
            description: reportData.description || '',
            address: reportData.address || '',
            latitude: reportData.latitude || 0,
            longitude: reportData.longitude || 0,
            category: reportData.category ?? 'other',
            image: reportData.image || '',
            status: reportData.status || null,
            isSentToRescuer: reportData.isSentToRescuer || false,
            adminComments: reportData.adminComments || '',
            assignedTo: reportData.assignedTo || '',
            createdAt: reportData.createdAt || new Date().toISOString(),
            updatedAt: reportData.updatedAt || null
          });
        }
      });
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (reports.length > this.MAX_REPORTS) {
        reports.slice(0, this.MAX_REPORTS).forEach((report, index) => {
          localStorage.removeItem(`report_${report.id}`);
          if (index >= this.MAX_REPORTS) return;
        });
        this.reports.set(reports.slice(0, this.MAX_REPORTS));
      } else {
        this.reports.set(reports);
      }
    } catch (error) {
      console.error('خطا در لود گزارش‌ها:', error);
      this.reports.set([]);
    }
  }

  syncReports(): void {
    this.loadReports();
  }

  getReports(): Observable<Report[]> {
    return of(this.reports());
  }

  getReportById(id: string): Observable<Report> {
    const report = this.reports().find(r => r.id === id);
    return report ? of(report) : throwError(() => new Error('گزارش یافت نشد'));
  }

  addReport(report: Report): Observable<Report> {
    const reports = this.reports();
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const newReport: Report = { 
      ...report, 
      id: newId, 
      createdAt: new Date().toISOString(),
      status: null,
      isSentToRescuer: false,
      adminComments: '',
      assignedTo: ''
    };
    reports.push(newReport);
    if (reports.length > this.MAX_REPORTS) {
      const oldestReport = reports.shift();
      if (oldestReport) localStorage.removeItem(`report_${oldestReport.id}`);
    }
    this.reports.set(reports);
    try {
      localStorage.setItem(`report_${newId}`, JSON.stringify(newReport));
      return of(newReport);
    } catch (error) {
      console.error('خطا در ذخیره گزارش:', error);
      throw new Error('خطا در ذخیره گزارش: حافظه پر است.');
    }
  }

  updateReport(id: string, update: Partial<Report>): Observable<Report> {
    const reportKey = `report_${id}`;
    const reports = this.reports();
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) {
      return throwError(() => new Error('گزارش یافت نشد'));
    }
    const currentReport = reports[index];
    const newReport: Report = { ...currentReport, ...update, updatedAt: new Date().toISOString() };
    reports[index] = newReport;
    this.reports.set(reports);
    try {
      localStorage.setItem(reportKey, JSON.stringify(newReport));
      return of(newReport);
    } catch (error) {
      console.error('خطا در به‌روزرسانی گزارش:', error);
      throw new Error('خطا در به‌روزرسانی گزارش');
    }
  }

  deleteReport(id: string): Observable<void> {
    const reportKey = `report_${id}`;
    const reports = this.reports();
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) {
      return throwError(() => new Error('گزارش یافت نشد'));
    }
    reports.splice(index, 1);
    this.reports.set(reports);
    try {
      localStorage.removeItem(reportKey);
      return of(undefined);
    } catch (error) {
      console.error('خطا در حذف گزارش:', error);
      throw new Error('خطا در حذف گزارش');
    }
  }
}