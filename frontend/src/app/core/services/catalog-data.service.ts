import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CategoriesService } from '../api/api/categories.service';
import { ProductsService } from '../api/api/products.service';
import { SKIP_BEARER_AUTH } from '../interceptors/http-context-tokens';
import { Category } from '../api/model/category';
import { Product } from '../api/model/product';
import { ProductsGet200Response } from '../api/model/productsGet200Response';

export type CatalogSortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc';

export interface CatalogProductQuery {
  search: string;
  categorySlug: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: CatalogSortOption;
  includeSold: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogDataService {
  private readonly productsApi = inject(ProductsService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly publicRequestContext = new HttpContext().set(SKIP_BEARER_AUTH, true);

  getProducts(query: Pick<CatalogProductQuery, 'search' | 'categorySlug' | 'minPrice' | 'maxPrice'>): Observable<Product[]> {
    return this.productsApi.productsGet(
      query.search || undefined,
      query.categorySlug || undefined,
      query.minPrice ?? undefined,
      query.maxPrice ?? undefined,
      undefined,
      undefined,
      undefined,
      'body',
      false,
      { context: this.publicRequestContext }
    ).pipe(
      map((resp: ProductsGet200Response) => resp.products ?? [])
    );
  }

  getCategories(): Observable<Category[]> {
    return this.categoriesApi.categoriesGet('body', false, { context: this.publicRequestContext }).pipe(
      map((categories) => [...(categories ?? [])].sort((left, right) =>
        this.getCategoryLabel(left).localeCompare(this.getCategoryLabel(right), 'es', { sensitivity: 'base' })
      ))
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.productsApi.productsIdGet(id, 'body', false, { context: this.publicRequestContext }).pipe(
      map((resp: Product) => resp)
    );
  }

  private getCategoryLabel(category: Category): string {
    return category.name?.trim() || category.slug?.trim() || '';
  }
}
