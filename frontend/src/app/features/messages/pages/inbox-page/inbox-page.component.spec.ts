import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';

import { InboxPageComponent } from './inbox-page.component';
import { MessagesService } from '../../../../core/api/api/messages.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('InboxPageComponent', () => {
  let messagesApiSpy: jasmine.SpyObj<MessagesService>;

  beforeEach(async () => {
    messagesApiSpy = jasmine.createSpyObj<MessagesService>(
      'MessagesService',
      ['conversationsGet', 'conversationsIdMessagesGet', 'conversationsIdMessagesPost']
    );

    messagesApiSpy.conversationsGet.and.returnValue(of([]));
    messagesApiSpy.conversationsIdMessagesGet.and.returnValue(of([]));
    messagesApiSpy.conversationsIdMessagesPost.and.returnValue(of({ id: 2, content: 'reply', sender_id: 1 }));

    await TestBed.configureTestingModule({
      imports: [InboxPageComponent],
      providers: [
        { provide: MessagesService, useValue: messagesApiSpy },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 1 }) } }
      ]
    }).compileComponents();
  });

  it('fetches conversations on init', () => {
    messagesApiSpy.conversationsGet.and.returnValue(of([{ id: 10, product_id: 22 }]));

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
