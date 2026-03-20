import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, finalize, map, tap } from 'rxjs';

import { CategoriesService } from '../../../core/api/api/categories.service';
import { ProductsService } from '../../../core/api/api/products.service';
import { Category, Product, ProductCreate, ProductUpdate } from '../../../core/api/model/models';

@Injectable({ providedIn: 'root' })
export class SellerProductsStore {
  private categoriesApi = inject(CategoriesService);
  private productsApi = inject(ProductsService);

  private _categories = signal<Category[]>([]);
  private _products = signal<Product[]>([]);
  private _loading = signal(false);

  readonly categories = this._categories.asReadonly();
  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();

  loadInitialData() {
    this._loading.set(true);
    return forkJoin({
      categories: this.categoriesApi.categoriesGet(),
      products: this.productsApi.productsGet(undefined, undefined, undefined, undefined, undefined, undefined, true)
    }).pipe(
      tap(({ categories, products }) => {
        this._categories.set(categories);
        this._products.set(this.normalizeProductsResponse(products));
      }),
      finalize(() => this._loading.set(false))
    );
  }

  refreshProducts() {
    this._loading.set(true);
    return this.productsApi.productsGet(undefined, undefined, undefined, undefined, undefined, undefined, true).pipe(
      map((response) => this.normalizeProductsResponse(response)),
      tap((products) => this._products.set(products)),
      finalize(() => this._loading.set(false))
    );
  }

  saveProduct(editingProduct: Product | null, payload: ProductCreate | ProductUpdate) {
    this._loading.set(true);
    const isUpdate = !!editingProduct?.id;
    const normalizedPayload = this.normalizeProductPayload(payload, isUpdate);

    const request$ = editingProduct?.id
      ? this.productsApi.productsIdPut(editingProduct.id, normalizedPayload as ProductUpdate)
      : this.productsApi.productsPost(normalizedPayload as ProductCreate);

    return request$.pipe(finalize(() => this._loading.set(false)));
  }

  deleteProduct(id: number) {
    this._loading.set(true);
    return this.productsApi.productsIdDelete(id).pipe(finalize(() => this._loading.set(false)));
  }

  private normalizeProductsResponse(response: unknown): Product[] {
    const payload = response as { products?: Product[] } | Product[];
    return Array.isArray(payload) ? payload : payload.products ?? [];
  }

  private normalizeProductPayload(payload: ProductCreate | ProductUpdate, isUpdate: boolean): ProductCreate | ProductUpdate {
    const normalized = {
      ...payload,
      price: payload.price !== undefined ? Number(payload.price) : payload.price
    } as ProductCreate | ProductUpdate;

    if ('id' in (normalized as Record<string, unknown>)) {
      delete (normalized as Record<string, unknown>)['id'];
    }

    if (!isUpdate && 'is_sold' in (normalized as Record<string, unknown>)) {
      delete (normalized as Record<string, unknown>)['is_sold'];
    }

    return normalized;
  }
}
