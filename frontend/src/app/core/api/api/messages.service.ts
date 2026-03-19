import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConversationCreate } from '../model/conversationCreate';
import { Conversation } from '../model/conversation';
import { MessageCreate } from '../model/messageCreate';
import { Message } from '../model/message';

@Injectable({ providedIn: 'root' })
export class MessagesService {
    constructor(private http: HttpClient) {}
    conversationsPost(body: ConversationCreate): Observable<Conversation> {
        return this.http.post<Conversation>('/api/v1/conversations', body);
    }
    conversationsGet(): Observable<Conversation[]> {
        return this.http.get<Conversation[]>('/api/v1/conversations');
    }
    conversationsIdMessagesGet(id: number): Observable<Message[]> {
        return this.http.get<Message[]>(/api/v1/conversations//messages);
    }
    conversationsIdMessagesPost(id: number, body: MessageCreate): Observable<Message> {
        return this.http.post<Message>(/api/v1/conversations//messages, body);
    }
}