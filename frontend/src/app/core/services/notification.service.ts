import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WebsocketService } from './websocket.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly wsService = inject(WebsocketService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly activeConversationId = signal<number | null>(null);
  private readonly unreadCountsByConversation = signal<Record<number, number>>({});

  readonly unreadMessagesCount = computed(() =>
    Object.values(this.unreadCountsByConversation()).reduce((total, count) => total + count, 0)
  );

  constructor() {
    effect(() => {
      if (!this.authService.isAuthenticated()) {
        this.activeConversationId.set(null);
        this.unreadCountsByConversation.set({});
      }
    }, { allowSignalWrites: true });

    this.wsService.onNewMessage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg) => {
        const currentUserId = this.authService.currentUser()?.id;
        const conversationId = msg.conversation_id ?? null;

        if (currentUserId == null || msg.sender_id === currentUserId || conversationId == null) {
          return;
        }

        if (conversationId === this.activeConversationId()) {
          return;
        }

        this.unreadCountsByConversation.update((counts) => ({
          ...counts,
          [conversationId]: (counts[conversationId] ?? 0) + 1
        }));
      });
  }

  clearUnreadMessages(): void {
    this.unreadCountsByConversation.set({});
  }

  setActiveConversation(conversationId: number | null): void {
    this.activeConversationId.set(conversationId);
  }

  markConversationAsRead(conversationId: number | null): void {
    if (conversationId == null) {
      return;
    }

    this.unreadCountsByConversation.update((counts) => {
      if (!(conversationId in counts)) {
        return counts;
      }

      const { [conversationId]: _removed, ...remaining } = counts;
      return remaining;
    });
  }
}
