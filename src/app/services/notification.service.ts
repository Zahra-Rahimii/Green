import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Notification } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    const notifications: Notification[] = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('notification_')) {
        const notificationData = JSON.parse(localStorage.getItem(key)!);
        notifications.push({
          id: key.replace('notification_', ''),
          userId: notificationData.userId,
          message: notificationData.message,
          isRead: notificationData.isRead || false,
          createdAt: notificationData.createdAt || new Date().toISOString()
        });
      }
    });
    this.notifications.set(notifications);
  }

  getNotificationsForUser(userId: string): Observable<Notification[]> {
    return of(this.notifications().filter(n => n.userId === userId));
  }

  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Observable<Notification> {
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const newNotification: Notification = {
      ...notification,
      id: newId,
      createdAt: new Date().toISOString()
    };
    const currentNotifications = this.notifications();
    currentNotifications.push(newNotification);
    this.notifications.set(currentNotifications);
    localStorage.setItem(`notification_${newId}`, JSON.stringify(newNotification));
    return of(newNotification);
  }

  markAsRead(notificationId: string): Observable<void> {
    const notifications = this.notifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications[index].isRead = true;
      this.notifications.set(notifications);
      localStorage.setItem(`notification_${notificationId}`, JSON.stringify(notifications[index]));
    }
    return of(undefined);
  }
}