import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { getApiErrorMessage } from '../../../core/utils/http-error-message.util';
import { ConfirmDialogComponent } from '../../../core/ui/confirm-dialog/confirm-dialog.component';
import { SellerProductsStore } from './seller-products.store';

@Injectable()
export class SellerDashboardFacade {
  private sellerProductsStore = inject(SellerProductsStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly products = this.sellerProductsStore.products;

  readonly ui = {
    loading: this.sellerProductsStore.loading
  };

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
