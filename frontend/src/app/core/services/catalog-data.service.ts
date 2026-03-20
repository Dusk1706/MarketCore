import { Injectable, inject } from '@angular/core';
import { ProductsService } from '../api/api/products.service';
import { Product } from '../api/model/product';
import { ProductsGet200Response } from '../api/model/productsGet200Response';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogDataService {
  private productsApi = inject(ProductsService);

  getProducts(search?: string): Observable<Product[]> {
    return this.productsApi.productsGet(search).pipe(
      map((resp: ProductsGet200Response) => resp.products ?? [])
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.productsApi.productsIdGet(id).pipe(
      map((resp: Product) => resp)
    );
  }
}
