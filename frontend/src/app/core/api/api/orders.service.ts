import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderCreate } from '../model/orderCreate';
import { Order } from '../model/order';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrdersService {
    constructor(private http: HttpClient) {}
    ordersPost(body: OrderCreate): Observable<Order> {
        return this.http.post<Order>('/api/v1/orders', body);
    }
    ordersMeGet(): Observable<Order[]> {
        return this.http.get<Order[]>('/api/v1/orders/me');
    }
}