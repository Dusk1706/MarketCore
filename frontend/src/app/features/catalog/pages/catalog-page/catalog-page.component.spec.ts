import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Category } from '../../../../core/api/model/category';
import { Product } from '../../../../core/api/model/product';
import { AuthService } from '../../../../core/services/auth.service';
import { CatalogDataService } from '../../../../core/services/catalog-data.service';
import { CoreFavoritesService } from '../../../../core/services/favorites.service';
import { CatalogPageComponent } from './catalog-page.component';

describe('CatalogPageComponent', () => {
  let catalogDataSpy: jasmine.SpyObj<CatalogDataService>;

  const categories: Category[] = [
    { id: 1, name: 'Libros', slug: 'libros' },
    { id: 2, name: 'Tecnología', slug: 'tecnologia' }
  ];

  const products: Product[] = [
    { id: 1, title: 'Set de Libros', price: 450, category_slug: 'libros', is_sold: false, created_at: '2026-03-10T10:00:00Z' },
    { id: 2, title: 'Laptop Gamer', price: 2200, category_slug: 'tecnologia', is_sold: false, created_at: '2026-03-12T10:00:00Z' },
    { id: 3, title: 'Libro Vendido', price: 250, category_slug: 'libros', is_sold: true, created_at: '2026-03-14T10:00:00Z' }
  ];

  beforeEach(async () => {
    catalogDataSpy = jasmine.createSpyObj<CatalogDataService>('CatalogDataService', ['getProducts', 'getCategories']);
    catalogDataSpy.getProducts.and.returnValue(of(products));
    catalogDataSpy.getCategories.and.returnValue(of(categories));

    await TestBed.configureTestingModule({
      imports: [CatalogPageComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CatalogDataService, useValue: catalogDataSpy },
        { provide: AuthService, useValue: { currentUser: () => null, isAuthenticated: () => false } },
        { provide: CoreFavoritesService, useValue: { ensureLoadedSilently: () => undefined, isFavorite: () => false } }
      ]
    }).compileComponents();
  });

  it('hides sold products by default', () => {
    const fixture = TestBed.createComponent(CatalogPageComponent);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(fixture.componentInstance.products().map((product) => product.title)).toEqual([
      'Set de Libros',
      'Laptop Gamer'
    ]);
    expect(fixture.componentInstance.hiddenSoldCount()).toBe(1);
  });

  it('shows sold products and sorts by price ascending when requested', () => {
    const fixture = TestBed.createComponent(CatalogPageComponent);
    fixture.detectChanges();
    TestBed.flushEffects();

    fixture.componentInstance.filtersForm.patchValue({
      includeSold: true,
      sortBy: 'price-asc'
    });
    fixture.componentInstance.applyFilters();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(fixture.componentInstance.products().map((product) => product.title)).toEqual([
      'Libro Vendido',
      'Set de Libros',
      'Laptop Gamer'
    ]);
  });

  it('sends category and price filters to the catalog data service', () => {
    const fixture = TestBed.createComponent(CatalogPageComponent);
    fixture.detectChanges();
    TestBed.flushEffects();

    catalogDataSpy.getProducts.calls.reset();

    fixture.componentInstance.filtersForm.patchValue({
      search: 'libro',
      categorySlug: 'libros',
      minPrice: 100,
      maxPrice: 500
    });
    fixture.componentInstance.applyFilters();
    TestBed.flushEffects();

    expect(catalogDataSpy.getProducts).toHaveBeenCalledWith(jasmine.objectContaining({
      search: 'libro',
      categorySlug: 'libros',
      minPrice: 100,
      maxPrice: 500
    }));
  });
});
