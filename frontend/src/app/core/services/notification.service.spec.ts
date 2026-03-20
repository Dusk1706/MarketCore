import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { Message } from '../api/model/message';
import { User } from '../api/model/user';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { WebsocketService } from './websocket.service';

class AuthServiceStub {
  private readonly currentUserSignal = signal<User | null>({ id: 1, name: 'Buyer User' });
  private readonly tokenSignal = signal<string | null>('token');

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal() && !!this.tokenSignal());

  clearSession(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }
}

class WebsocketServiceStub {
  readonly newMessages$ = new Subject<Message>();

  onNewMessage() {
    return this.newMessages$.asObservable();
  }
}

describe('NotificationService', () => {
  let service: NotificationService;
  let authService: AuthServiceStub;
  let websocketService: WebsocketServiceStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: WebsocketService, useClass: WebsocketServiceStub }
      ]
    });

    service = TestBed.inject(NotificationService);
    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    websocketService = TestBed.inject(WebsocketService) as unknown as WebsocketServiceStub;
  });

  it('tracks unread counts per conversation and ignores the active thread', () => {
    service.setActiveConversation(10);

    websocketService.newMessages$.next({ conversation_id: 10, sender_id: 2 });
    websocketService.newMessages$.next({ conversation_id: 20, sender_id: 2 });
    websocketService.newMessages$.next({ conversation_id: 20, sender_id: 2 });
    websocketService.newMessages$.next({ conversation_id: 30, sender_id: 2 });
    websocketService.newMessages$.next({ conversation_id: 30, sender_id: 1 });

    expect(service.unreadMessagesCount()).toBe(3);

    service.markConversationAsRead(20);

    expect(service.unreadMessagesCount()).toBe(1);
  });

  it('clears unread state after logout', () => {
    websocketService.newMessages$.next({ conversation_id: 40, sender_id: 2 });
    expect(service.unreadMessagesCount()).toBe(1);

    authService.clearSession();
    TestBed.flushEffects();

    expect(service.unreadMessagesCount()).toBe(0);
  });
});
