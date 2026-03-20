import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';

import { Category } from '../../../../core/api/model/category';
import { Product } from '../../../../core/api/model/product';
import {
  CatalogDataService,
  CatalogProductQuery,
  CatalogSortOption
} from '../../../../core/services/catalog-data.service';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule, 
    MatSnackBarModule,
    MatIconModule,
    ProductCardComponent
  ],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent {
  private static readonly DEFAULT_FILTERS: CatalogProductQuery = {
    search: '',
    categorySlug: null,
    minPrice: null,
    maxPrice: null,
    sortBy: 'featured',
    includeSold: false
  };

  private readonly catalogData = inject(CatalogDataService);
  private readonly snackBar = inject(MatSnackBar);

  readonly sortOptions: ReadonlyArray<{ value: CatalogSortOption; label: string }> = [
    { value: 'featured', label: 'Relevancia' },
    { value: 'newest', label: 'Más recientes' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' }
  ];

  readonly filtersForm = new FormGroup({
    search: new FormControl(CatalogPageComponent.DEFAULT_FILTERS.search, { nonNullable: true }),
    categorySlug: new FormControl('', { nonNullable: true }),
    minPrice: new FormControl<number | null>(CatalogPageComponent.DEFAULT_FILTERS.minPrice, {
      validators: [Validators.min(0)]
    }),
    maxPrice: new FormControl<number | null>(CatalogPageComponent.DEFAULT_FILTERS.maxPrice, {
      validators: [Validators.min(0)]
    }),
    sortBy: new FormControl<CatalogSortOption>(CatalogPageComponent.DEFAULT_FILTERS.sortBy, { nonNullable: true }),
    includeSold: new FormControl(CatalogPageComponent.DEFAULT_FILTERS.includeSold, { nonNullable: true })
  }, { validators: [CatalogPageComponent.priceRangeValidator] });

  readonly isLoading = signal(false);
  readonly appliedFilters = signal<CatalogProductQuery>({ ...CatalogPageComponent.DEFAULT_FILTERS });

  readonly categories = toSignal(
    this.catalogData.getCategories().pipe(
      catchError(() => {
        this.snackBar.open('No se pudieron cargar las categorías', 'Cerrar', { duration: 3500 });
        return of([] as Category[]);
      })
    ),
    { initialValue: [] as Category[] }
  );

  readonly rawProducts = toSignal(
    toObservable(this.appliedFilters).pipe(
      tap(() => this.isLoading.set(true)),
      switchMap((filters) =>
        this.catalogData.getProducts(filters).pipe(
          catchError(() => {
            this.snackBar.open('No se pudieron cargar los productos', 'Cerrar', { duration: 3500 });
            return of([] as Product[]);
          }),
          finalize(() => this.isLoading.set(false))
        )
      )
    ),
    { initialValue: [] as Product[] }
  );

  readonly products = computed(() => {
    const filters = this.appliedFilters();
    let items = filters.includeSold
      ? [...this.rawProducts()]
      : this.rawProducts().filter((product) => !product.is_sold);

    switch (filters.sortBy) {
      case 'price-asc':
        items = [...items].sort((left, right) => this.getSafePrice(left) - this.getSafePrice(right));
        break;
      case 'price-desc':
        items = [...items].sort((left, right) => this.getSafePrice(right) - this.getSafePrice(left));
        break;
      case 'newest':
        items = [...items].sort((left, right) => this.getCreatedAtValue(right) - this.getCreatedAtValue(left));
        break;
      default:
        break;
    }

    return items;
  });

  readonly hiddenSoldCount = computed(() => {
    if (this.appliedFilters().includeSold) {
      return 0;
    }

    return this.rawProducts().filter((product) => product.is_sold).length;
  });

  readonly activeFilterLabels = computed(() => {
    const filters = this.appliedFilters();
    const labels: string[] = [];

    if (filters.search) {
      labels.push(`Búsqueda: ${filters.search}`);
    }

    if (filters.categorySlug) {
      labels.push(`Categoría: ${this.getCategoryName(filters.categorySlug)}`);
    }

    if (filters.minPrice != null && filters.maxPrice != null) {
      labels.push(`Precio: $${filters.minPrice} - $${filters.maxPrice}`);
    } else if (filters.minPrice != null) {
      labels.push(`Desde $${filters.minPrice}`);
    } else if (filters.maxPrice != null) {
      labels.push(`Hasta $${filters.maxPrice}`);
    }

    if (filters.sortBy !== CatalogPageComponent.DEFAULT_FILTERS.sortBy) {
      labels.push(`Orden: ${this.getSortLabel(filters.sortBy)}`);
    }

    if (filters.includeSold) {
      labels.push('Incluye vendidos');
    }

    return labels;
  });

  readonly hasAppliedFilters = computed(() => this.activeFilterLabels().length > 0);

  applyFilters(): void {
    if (this.filtersForm.invalid) {
      this.filtersForm.markAllAsTouched();
      return;
    }

    this.appliedFilters.set(this.buildFiltersFromForm());
    this.filtersForm.markAsPristine();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: CatalogPageComponent.DEFAULT_FILTERS.search,
      categorySlug: '',
      minPrice: CatalogPageComponent.DEFAULT_FILTERS.minPrice,
      maxPrice: CatalogPageComponent.DEFAULT_FILTERS.maxPrice,
      sortBy: CatalogPageComponent.DEFAULT_FILTERS.sortBy,
      includeSold: CatalogPageComponent.DEFAULT_FILTERS.includeSold
    });

    this.appliedFilters.set({ ...CatalogPageComponent.DEFAULT_FILTERS });
    this.filtersForm.markAsPristine();
  }

  clearSearch(): void {
    this.filtersForm.controls.search.setValue('');
  }

  priceRangeErrorMessage(): string | null {
    if (!this.filtersForm.hasError('priceRange')) {
      return null;
    }

    const minPrice = this.filtersForm.controls.minPrice.value;
    const maxPrice = this.filtersForm.controls.maxPrice.value;
    if (minPrice == null || maxPrice == null) {
      return null;
    }

    return `El precio mínimo ($${minPrice}) no puede superar al máximo ($${maxPrice}).`;
  }

  resultsSummary(): string {
    const count = this.products().length;
    return `${count} ${count === 1 ? 'resultado' : 'resultados'}`;
  }

  private buildFiltersFromForm(): CatalogProductQuery {
    const rawValue = this.filtersForm.getRawValue();

    return {
      search: rawValue.search.trim(),
      categorySlug: rawValue.categorySlug || null,
      minPrice: rawValue.minPrice,
      maxPrice: rawValue.maxPrice,
      sortBy: rawValue.sortBy,
      includeSold: rawValue.includeSold
    };
  }

  private getCategoryName(slug: string): string {
    return this.categories().find((category) => category.slug === slug)?.name ?? slug;
  }

  private getSortLabel(sortBy: CatalogSortOption): string {
    return this.sortOptions.find((option) => option.value === sortBy)?.label ?? 'Relevancia';
  }

  private getSafePrice(product: Product): number {
    return product.price ?? 0;
  }

  private getCreatedAtValue(product: Product): number {
    const timestamp = product.created_at ? Date.parse(product.created_at) : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private static priceRangeValidator(control: AbstractControl): ValidationErrors | null {
    const minPrice = control.get('minPrice')?.value;
    const maxPrice = control.get('maxPrice')?.value;

    if (minPrice == null || maxPrice == null) {
      return null;
    }

    return minPrice <= maxPrice ? null : { priceRange: true };
  }
}
