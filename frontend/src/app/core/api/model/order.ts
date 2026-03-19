import { Product } from './product';
export interface Order {
    id?: number;
    buyer_id?: number;
    seller_id?: number;
    product_id?: number;
    total_amount?: number;
    status?: string;
    product?: Product;
}