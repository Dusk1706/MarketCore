export * from './auth.service';
import { AuthService } from './auth.service';
export * from './categories.service';
import { CategoriesService } from './categories.service';
export * from './products.service';
import { ProductsService } from './products.service';
export const APIS = [AuthService, CategoriesService, ProductsService];
