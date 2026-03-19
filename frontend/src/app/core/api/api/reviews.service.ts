import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReviewCreate } from '../model/reviewCreate';
import { UserReviewsResponse } from '../model/userReviewsResponse';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
    constructor(private http: HttpClient) {}
    ordersIdReviewsPost(id: number, body: ReviewCreate): Observable<any> {
        return this.http.post<any>(`/api/v1/orders/${id}/reviews`, body);
    }
    usersIdReviewsGet(id: number): Observable<UserReviewsResponse> {
        return this.http.get<UserReviewsResponse>(`/api/v1/users/${id}/reviews`);
    }
}