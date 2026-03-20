import { Injectable, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { Product, ProductCreate, ProductUpdate } from '../../../core/api/model/models';
import { UploadService } from '../../../core/services/upload.service';
import { getApiErrorMessage } from '../../../core/utils/http-error-message.util';
import { SellerProductsStore } from './seller-products.store';
import { ProductsService } from '../../../core/api/api/products.service';

@Injectable()
export class ProductEditFacade {
  private sellerProductsStore = inject(SellerProductsStore);
  private productsApi = inject(ProductsService);
  private uploadApi = inject(UploadService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  readonly categories = this.sellerProductsStore.categories;
  
  readonly ui = {
    loading: signal(false),
    uploading: signal(false),
    editingProduct: signal<Product | null>(null)
  };

  readonly uploadedImageUrl = signal<string | null>(null);

  initialize(productId?: number) {
    this.ui.loading.set(true);
    
    // Always ensure categories are loaded
    this.sellerProductsStore.loadInitialData().subscribe({
      next: () => {
        if (productId) {
          this.loadProduct(productId);
        } else {
          this.ui.loading.set(false);
        }
      },
      error: (error) => {
        this.showError(error, 'Error al cargar categorías');
        this.ui.loading.set(false);
      }
    });
  }

  private loadProduct(id: number) {
    // Check if already in store
    const product = this.sellerProductsStore.products().find(p => p.id === id);
    if (product) {
      this.ui.editingProduct.set(product);
      this.ui.loading.set(false);
      return;
    }

    // Otherwise fetch from API
    this.productsApi.productsIdGet(id)
      .pipe(finalize(() => this.ui.loading.set(false)))
      .subscribe({
        next: (p) => this.ui.editingProduct.set(p),
        error: (error) => this.showError(error, 'Error al cargar el producto')
      });
  }

  uploadImage(file: File) {
    this.ui.uploading.set(true);
    this.uploadApi
      .upload(file)
      .pipe(finalize(() => this.ui.uploading.set(false)))
      .subscribe({
        next: (response) => {
          this.uploadedImageUrl.set(response.url);
        },
        error: (error) => {
          this.showError(error, 'Error al subir imagen');
        }
      });
  }

  saveProduct(productData: ProductCreate | ProductUpdate) {
    if (this.ui.uploading()) {
      this.snackBar.open('Espera a que termine la subida de la imagen.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.ui.loading.set(true);
    const product = this.ui.editingProduct();
    const isUpdate = !!(product && product.id);

    this.sellerProductsStore.saveProduct(product, productData)
      .pipe(finalize(() => this.ui.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open(isUpdate ? 'Producto actualizado' : 'Producto publicado', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/seller']);
        },
        error: (error) => {
          this.showError(error, isUpdate ? 'Error al actualizar' : 'Error al publicar');
        }
      });
  }

  cancel() {
    this.router.navigate(['/seller']);
  }

  private showError(error: unknown, fallback: string) {
    this.snackBar.open(getApiErrorMessage(error, fallback), 'Cerrar', { duration: 4000 });
  }
}
