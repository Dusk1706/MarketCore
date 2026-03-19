import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
  private readonly snackBar = inject(MatSnackBar);

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

  ngOnInit(): void {
    this.loadConversations();
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
        this.snackBar.open('No se pudieron cargar las conversaciones', 'Cerrar', { duration: 3000 });
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
        this.snackBar.open('No se pudo cargar el hilo de mensajes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  sendReply(): void {
    const conversation = this.selectedConversation();
    const content = this.replyControl.value.trim();

    if (!conversation?.id || !content) {
      this.replyControl.markAsTouched();
      return;
    }

    this.sending.set(true);
    this.messagesApi.conversationsIdMessagesPost(conversation.id, { content }).subscribe({
      next: (message: Message) => {
        this.messages.update((items: Message[]) => [...items, message]);
        this.replyControl.setValue('');
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
        this.snackBar.open('No se pudo enviar el mensaje', 'Cerrar', { duration: 3000 });
      }
    });
  }

  isOwnMessage(message: Message): boolean {
    return message.sender_id != null && message.sender_id === this.currentUserId();
  }

  conversationTitle(conversation: Conversation): string {
    return conversation.product?.title ?? `Producto #${conversation.product_id ?? 'N/A'}`;
  }
}
