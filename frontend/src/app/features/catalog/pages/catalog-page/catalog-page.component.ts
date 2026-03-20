import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { CatalogDataService } from '../../../../core/services/catalog-data.service';
import { Product } from '../../../../core/api/model/product';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { SearchBarComponent } from '../../ui/search-bar/search-bar.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule, 
    MatProgressSpinnerModule, 
    MatSnackBarModule,
    MatIconModule,
    ProductCardComponent, 
    SearchBarComponent
  ],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent {
  private catalogData = inject(CatalogDataService);

  searchQuery = signal('');
  isLoading = signal(false);

  // Re-fetch products when search query changes
  products = toSignal(
    toObservable(this.searchQuery).pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(query => 
        this.catalogData.getProducts(query).pipe(
          catchError(() => of([] as Product[]))
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
