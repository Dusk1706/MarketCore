import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, computed, inject, signal, DestroyRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, finalize } from 'rxjs';

import { MessagesService } from '../../../../core/api/api/messages.service';
import { Conversation, Message } from '../../../../core/api/model/models';
import { AuthService } from '../../../../core/services/auth.service';
import { WebsocketService } from '../../../../core/services/websocket.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error-message.util';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './inbox-page.component.html',
  styleUrl: './inbox-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InboxPageComponent implements OnInit, OnDestroy {
  private static readonly REPLY_MAX_LENGTH = 5000;

  private readonly messagesApi = inject(MessagesService);
  private readonly authService = inject(AuthService);
  private readonly wsService = inject(WebsocketService);
  private readonly notificationService = inject(NotificationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private scrollFrameId: number | null = null;
  private messagesLoadSubscription?: Subscription;
  private loadingMessagesConversationId: number | null = null;

  @ViewChild('messageContainer') private messageContainer?: ElementRef<HTMLElement>;

  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);

  loadingConversations = signal(false);
  loadingMessages = signal(false);
  sending = signal(false);

  replyControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(InboxPageComponent.REPLY_MAX_LENGTH)]
  });

  currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  readonly replyMaxLength = InboxPageComponent.REPLY_MAX_LENGTH;

  ngOnInit(): void {
    this.notificationService.setActiveConversation(null);
    this.loadConversations();
    this.listenToWebsocket();
  }

  ngOnDestroy(): void {
    this.notificationService.setActiveConversation(null);
    this.messagesLoadSubscription?.unsubscribe();

    if (this.scrollFrameId !== null) {
      cancelAnimationFrame(this.scrollFrameId);
    }
  }

  private listenToWebsocket(): void {
    this.wsService.onNewMessage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg: Message) => {
        const selected = this.selectedConversation();
        if (selected && msg.conversation_id === selected.id) {
          if (msg.sender_id !== this.currentUserId()) {
            this.messages.update(items => [...items, msg]);
            this.scheduleScrollToBottom();
          }
        } else {
          this.snackBar.open('Nuevo mensaje recibido', 'Ver', { duration: 3000 });
          this.loadConversations();
        }
      });
  }

  loadConversations(): void {
    this.loadingConversations.set(true);
    this.messagesApi.conversationsGet()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingConversations.set(false))
      )
      .subscribe({
        next: (conversations: Conversation[]) => {
          this.conversations.set(conversations);
        },
        error: (error) => {
          this.snackBar.open(getApiErrorMessage(error, 'No se pudieron cargar las conversaciones'), 'Cerrar', { duration: 3500 });
        }
      });
  }

  selectConversation(conversation: Conversation): void {
    this.messagesLoadSubscription?.unsubscribe();
    this.selectedConversation.set(conversation);
    this.replyControl.setValue('');
    this.notificationService.setActiveConversation(conversation.id ?? null);
    this.notificationService.markConversationAsRead(conversation.id ?? null);

    if (conversation.id == null) {
      this.loadingMessagesConversationId = null;
      this.loadingMessages.set(false);
      this.messages.set([]);
      return;
    }

    this.loadingMessagesConversationId = conversation.id;
    this.loadingMessages.set(true);
    this.messagesLoadSubscription = this.messagesApi.conversationsIdMessagesGet(conversation.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.loadingMessagesConversationId === conversation.id) {
            this.loadingMessages.set(false);
          }
        })
      )
      .subscribe({
        next: (messages: Message[]) => {
          if (this.selectedConversation()?.id !== conversation.id) {
            return;
          }

          this.messages.set(messages);
          this.notificationService.markConversationAsRead(conversation.id ?? null);
          this.scheduleScrollToBottom();
        },
        error: (error) => {
          if (this.selectedConversation()?.id !== conversation.id) {
            return;
          }

          this.snackBar.open(getApiErrorMessage(error, 'No se pudieron cargar los mensajes'), 'Cerrar', { duration: 3500 });
        }
      });
  }

  handleEnter(event: KeyboardEvent): void {
    if (event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    this.sendReply(event);
  }

  sendReply(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const conversation = this.selectedConversation();
    const content = this.replyControl.value.trim();

    if (!content || this.sending()) {
      return;
    }

    if (conversation?.id == null) {
      return;
    }

    this.sending.set(true);
    this.messagesApi.conversationsIdMessagesPost(conversation.id, { content })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.sending.set(false))
      )
      .subscribe({
        next: (message: Message) => {
          this.messages.update((items: Message[]) => [...items, message]);
          this.replyControl.setValue('');
          this.replyControl.markAsPristine();
          this.replyControl.markAsUntouched();
          this.scheduleScrollToBottom();
        },
        error: (error) => {
          this.snackBar.open(getApiErrorMessage(error, 'No se pudo enviar el mensaje'), 'Cerrar', { duration: 3500 });
        }
      });
  }

  canSendReply(): boolean {
    const content = this.replyControl.value.trim();
    return !!content
      && !this.replyControl.hasError('maxlength')
      && !this.sending()
      && this.selectedConversation()?.id != null;
  }

  private scheduleScrollToBottom(): void {
    if (this.scrollFrameId !== null) {
      cancelAnimationFrame(this.scrollFrameId);
    }

    this.scrollFrameId = requestAnimationFrame(() => {
      this.scrollFrameId = null;
      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      const el = this.messageContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  isOwnMessage(message: Message): boolean {
    return message.sender_id != null && message.sender_id === this.currentUserId();
  }

  conversationTitle(conversation: Conversation): string {
    const productTitle = conversation.product?.title ?? `Producto #${conversation.product_id ?? 'N/A'}`;
    const myId = this.currentUserId();
    const isBuyer = conversation.buyer_id === myId;
    const otherUser = isBuyer ? conversation.seller : conversation.buyer;
    const contactName = otherUser?.name ? ` - ${otherUser.name}` : '';
    return `${productTitle}${contactName}`;
  }
}
