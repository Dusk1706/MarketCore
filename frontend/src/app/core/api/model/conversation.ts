import { Product } from './product';
export interface Conversation {
    id?: number;
    buyer_id?: number;
    seller_id?: number;
    product_id?: number;
    product?: Product;
}