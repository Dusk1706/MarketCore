import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';

import { ProductsService } from '../../../../core/api/api/products.service';
import { Product } from '../../../../core/api/model/models';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { SearchBarComponent } from '../../ui/search-bar/search-bar.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule, 
    MatProgressSpinnerModule, 
    MatSnackBarModule, 
    ProductCardComponent, 
    SearchBarComponent
  ],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent {
  private productsApi = inject(ProductsService);
  private snackBar = inject(MatSnackBar);

  searchQuery = signal('');
  isLoading = signal(false);

  // Re-fetch products when search query changes
  products = toSignal(
    toObservable(this.searchQuery).pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(query => 
        this.productsApi.productsGet(query).pipe(
          catchError(err => {
            this.snackBar.open('Error al cargar productos', 'Cerrar', { duration: 3000 });
            return of([] as Product[]);
          })
        )
      ),
      tap(() => this.isLoading.set(false))
    ),
    { initialValue: [] as Product[] }
  );

  onSearch(query: string) {
    this.searchQuery.set(query);
  }
}
