import { Injectable, inject, signal } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private wsService = inject(WebsocketService);
  private authService = inject(AuthService);

  readonly unreadMessagesCount = signal(0);

  constructor() {
    this.wsService.onNewMessage().subscribe((msg) => {
      const currentUser = this.authService.currentUser();
      if (currentUser && msg.sender_id !== currentUser.id) {
        this.unreadMessagesCount.update(count => count + 1);
      }
    });
  }

  clearUnreadMessages() {
    this.unreadMessagesCount.set(0);
  }
}
