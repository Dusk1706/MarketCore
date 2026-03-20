import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal, DestroyRef, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MessagesService } from '../../../../core/api/api/messages.service';
import { Conversation, Message } from '../../../../core/api/model/models';
import { AuthService } from '../../../../core/services/auth.service';
import { WebsocketService } from '../../../../core/services/websocket.service';
import { getApiErrorMessage } from '../../../../core/utils/http-error-message.util';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './inbox-page.component.html',
  styleUrl: './inbox-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InboxPageComponent implements OnInit {
  private readonly messagesApi = inject(MessagesService);
  private readonly authService = inject(AuthService);
  private readonly wsService = inject(WebsocketService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('messageContainer') private messageContainer?: ElementRef;

  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);

  loadingConversations = signal(false);
  loadingMessages = signal(false);
  sending = signal(false);

  replyControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(5000)]
  });

  currentUserId = computed(() => this.authService.currentUser()?.id ?? null);

  constructor() {
    // Autoscroll effect whenever messages signal updates
    effect(() => {
      this.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngOnInit(): void {
    this.loadConversations();
    // Delay websocket listening slightly to ensure session is stable
    setTimeout(() => this.listenToWebsocket(), 500);
  }

  listenToWebsocket(): void {
    this.wsService.onNewMessage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg: Message) => {
        const selected = this.selectedConversation();
        if (selected && msg.conversation_id === selected.id) {
          if (msg.sender_id !== this.currentUserId()) {
            this.messages.update(items => [...items, msg]);
          }
        } else {
          this.snackBar.open('Nuevo mensaje recibido', 'Ver', { duration: 3000 });
          this.loadConversations();
        }
      });
  }

  loadConversations(): void {
    this.loadingConversations.set(true);
    this.messagesApi.conversationsGet().subscribe({
      next: (conversations: Conversation[]) => {
        this.conversations.set(conversations);
        this.loadingConversations.set(false);
      },
      error: () => {
        this.loadingConversations.set(false);
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation.set(conversation);
    this.replyControl.setValue('');

    if (conversation.id == null) {
      this.messages.set([]);
      return;
    }

    this.loadingMessages.set(true);
    this.messagesApi.conversationsIdMessagesGet(conversation.id).subscribe({
      next: (messages: Message[]) => {
        this.messages.set(messages);
        this.loadingMessages.set(false);
      },
      error: () => {
        this.loadingMessages.set(false);
      }
    });
  }

  handleEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendReply(event);
    }
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
    this.messagesApi.conversationsIdMessagesPost(conversation.id, { content }).subscribe({
      next: (message: Message) => {
        this.messages.update((items: Message[]) => [...items, message]);
        this.replyControl.setValue('');
        this.sending.set(false);
      },
      error: (error) => {
        this.sending.set(false);
        this.snackBar.open(getApiErrorMessage(error, 'No se pudo enviar el mensaje'), 'Cerrar', { duration: 3500 });
      }
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
    return conversation.product?.title ?? `Producto #${conversation.product_id ?? 'N/A'}`;
  }
}
