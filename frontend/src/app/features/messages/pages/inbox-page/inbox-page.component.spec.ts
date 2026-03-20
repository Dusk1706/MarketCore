import { EMPTY, Subject, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';

import { InboxPageComponent } from './inbox-page.component';
import { MessagesService } from '../../../../core/api/api/messages.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WebsocketService } from '../../../../core/services/websocket.service';

describe('InboxPageComponent', () => {
  let messagesApiSpy: jasmine.SpyObj<MessagesService>;
  let notificationServiceSpy: {
    setActiveConversation: jasmine.Spy;
    markConversationAsRead: jasmine.Spy;
  };

  beforeEach(async () => {
    messagesApiSpy = jasmine.createSpyObj<MessagesService>(
      'MessagesService',
      ['conversationsGet', 'conversationsIdMessagesGet', 'conversationsIdMessagesPost']
    );

    messagesApiSpy.conversationsGet.and.returnValue(of([]) as any);
    messagesApiSpy.conversationsIdMessagesGet.and.returnValue(of([]) as any);
    messagesApiSpy.conversationsIdMessagesPost.and.returnValue(of({ id: 2, content: 'reply', sender_id: 1 }) as any);
    notificationServiceSpy = {
      setActiveConversation: jasmine.createSpy('setActiveConversation'),
      markConversationAsRead: jasmine.createSpy('markConversationAsRead')
    };

    await TestBed.configureTestingModule({
      imports: [InboxPageComponent],
      providers: [
        { provide: MessagesService, useValue: messagesApiSpy },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 1 }) } },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: WebsocketService, useValue: { onNewMessage: () => EMPTY } }
      ]
    }).compileComponents();
  });

  it('fetches conversations on init', () => {
    messagesApiSpy.conversationsGet.and.returnValue(of([{ id: 10, product_id: 22 }]) as any);

    const fixture = TestBed.createComponent(InboxPageComponent);
    fixture.detectChanges();

    expect(messagesApiSpy.conversationsGet).toHaveBeenCalled();
    expect(fixture.componentInstance.conversations().length).toBe(1);
  });

  it('loads messages when selecting a conversation', () => {
    const fixture = TestBed.createComponent(InboxPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectConversation({ id: 33, product_id: 22 });

    expect(messagesApiSpy.conversationsIdMessagesGet).toHaveBeenCalledWith(33);
  });

  it('ignores stale message loads when switching conversations quickly', () => {
    const firstResponse$ = new Subject<any>();
    const secondResponse$ = new Subject<any>();
    messagesApiSpy.conversationsIdMessagesGet.and.returnValues(firstResponse$ as any, secondResponse$ as any);

    const fixture = TestBed.createComponent(InboxPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectConversation({ id: 11, product_id: 1 });
    fixture.componentInstance.selectConversation({ id: 22, product_id: 2 });

    firstResponse$.next([{ id: 1, content: 'chat viejo', sender_id: 2 }]);
    expect(fixture.componentInstance.messages()).toEqual([]);

    secondResponse$.next([{ id: 2, content: 'chat actual', sender_id: 2 }]);
    expect(fixture.componentInstance.messages()[0].content).toBe('chat actual');
  });

  it('sends a reply and appends it to the local thread', () => {
    const fixture = TestBed.createComponent(InboxPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectConversation({ id: 50, product_id: 7 });
    fixture.componentInstance.replyControl.setValue('Hola');
    fixture.componentInstance.sendReply();

    expect(messagesApiSpy.conversationsIdMessagesPost).toHaveBeenCalledWith(50, { content: 'Hola' });
    expect(fixture.componentInstance.messages().length).toBe(1);
    expect(fixture.componentInstance.messages()[0].content).toBe('reply');
  });
});
