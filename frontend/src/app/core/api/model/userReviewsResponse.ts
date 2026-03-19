import { Review } from './review';
export interface UserReviewsResponse {
    average_rating?: number;
    total_sales?: number;
    reviews?: Review[];
}