import { Injectable, PLATFORM_ID, Inject, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { Message } from '../api';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private activeUserId: number | null = null;
  private readonly newMessageSubject = new Subject<Message>();

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const userId = this.authService.currentUser()?.id ?? null;
        if (userId != null) {
          this.connect(userId);
        } else {
          this.disconnect();
        }
      });
    }
  }

  private connect(userId: number): void {
    this.activeUserId = userId;

    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('join', { user_id: userId });
      }
      return;
    }

    this.socket = io(this.resolveSocketUrl(), {
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });

    this.socket.on('connect', () => {
      if (this.activeUserId != null) {
        this.socket?.emit('join', { user_id: this.activeUserId });
      }
    });

    this.socket.on('new_message', (message: Message) => {
      this.newMessageSubject.next(message);
    });
  }

  private disconnect(): void {
    this.activeUserId = null;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private resolveSocketUrl(): string {
    return window.location.port === '4200' ? 'http://localhost:5000' : window.location.origin;
  }

  public onNewMessage(): Observable<Message> {
    return this.newMessageSubject.asObservable();
  }
}
