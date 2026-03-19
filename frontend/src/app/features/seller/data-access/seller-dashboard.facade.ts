import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { Product, ProductCreate, ProductUpdate } from '../../../core/api/model/models';
import { UploadService } from '../../../core/services/upload.service';
import { getApiErrorMessage } from '../../../core/utils/http-error-message.util';
import { ConfirmDialogComponent } from '../../../core/ui/confirm-dialog/confirm-dialog.component';
import { SellerProductsStore } from './seller-products.store';

@Injectable()
export class SellerDashboardFacade {
  private sellerProductsStore = inject(SellerProductsStore);
  private uploadApi = inject(UploadService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly products = this.sellerProductsStore.products;
  readonly categories = this.sellerProductsStore.categories;

  readonly ui = {
    loading: this.sellerProductsStore.loading,
    uploading: signal(false),
    formOpen: signal(false),
    editingProduct: signal<Product | null>(null)
  };

  readonly uploadedImageUrl = signal<string | null>(null);

  initialize() {
    this.sellerProductsStore.loadInitialData().subscribe({
      error: (error) => this.showError(error, 'Error al cargar datos iniciales')
    });
  }

  refreshProducts() {
    this.sellerProductsStore.refreshProducts().subscribe({
      error: (error) => this.showError(error, 'Error al refrescar productos')
    });
  }

  openForm(product: Product | null = null) {
    this.ui.editingProduct.set(product);
    this.ui.formOpen.set(true);
  }

  closeForm() {
    this.ui.formOpen.set(false);
    this.ui.editingProduct.set(null);
    this.ui.uploading.set(false);
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

  consumeUploadedImageUrl() {
    this.uploadedImageUrl.set(null);
  }

  saveProduct(productData: ProductCreate | ProductUpdate) {
    if (this.ui.uploading()) {
      this.snackBar.open('Espera a que termine la subida de la imagen.', 'Cerrar', { duration: 3000 });
      return;
    }

    const product = this.ui.editingProduct();
    const isUpdate = !!(product && product.id);

    this.sellerProductsStore.saveProduct(product, productData).subscribe({
      next: () => {
        this.snackBar.open(isUpdate ? 'Producto actualizado' : 'Producto publicado', 'Cerrar', { duration: 3000 });
        this.refreshProducts();
        this.closeForm();
      },
      error: (error) => {
        this.showError(error, isUpdate ? 'Error al actualizar' : 'Error al publicar');
      }
    });
  }

  deleteProduct(id: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: '¿Eliminar producto?',
          message: 'Esta accion no se puede deshacer.',
          confirmText: 'Eliminar',
          cancelText: 'Cancelar'
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.sellerProductsStore.deleteProduct(id).subscribe({
          next: () => {
            this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
            this.refreshProducts();
          },
          error: (error) => {
            this.showError(error, 'Error al eliminar');
          }
        });
      });
  }

  private showError(error: unknown, fallback: string) {
    this.snackBar.open(getApiErrorMessage(error, fallback), 'Cerrar', { duration: 4000 });
  }
}
