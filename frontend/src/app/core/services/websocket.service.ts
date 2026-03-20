import { Injectable, PLATFORM_ID, Inject, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Message } from '../api';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const user = this.authService.currentUser();
        if (user) {
          this.connect(user.id!);
        } else {
          this.disconnect();
        }
      });
    }
  }

  private connect(userId: number): void {
    if (!this.socket) {
      const url = window.location.port === '4200' ? 'http://localhost:5000' : window.location.origin;
      
      this.socket = io(url, {
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Websocket connected');
        this.socket?.emit('join', { user_id: userId });
      });
    }
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public onNewMessage(): Observable<Message> {
    return new Observable<Message>(observer => {
      if (!this.socket) {
        return;
      }
      
      this.socket.on('new_message', (msg: Message) => {
        observer.next(msg);
      });

      return () => {
        this.socket?.off('new_message');
      };
    });
  }
}
