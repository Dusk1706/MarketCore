import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { MessagesService } from '../../../../core/api/api/messages.service';
import { OrdersService } from '../../../../core/api/api/orders.service';
import { ProductsService } from '../../../../core/api/api/products.service';
import { ReviewsService } from '../../../../core/api/api/reviews.service';
import { Order } from '../../../../core/api/model/order';
import { Product } from '../../../../core/api/model/product';
import { User } from '../../../../core/api/model/user';
import { UserReviewsResponse } from '../../../../core/api/model/userReviewsResponse';
import { AuthService } from '../../../../core/services/auth.service';
import { ProductDetailComponent } from './product-detail.component';

class AuthServiceStub {
  private readonly currentUserSignal = signal<User | null>({ id: 1, name: 'Buyer User' });
  private readonly tokenSignal = signal<string | null>('token');

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal() && !!this.tokenSignal());
}

describe('ProductDetailComponent', () => {
  const product: Product = {
    id: 1,
    title: 'Set de Libros: El Hobbit',
    description: 'Coleccion completa',
    price: 1200,
    is_sold: true,
    seller: {
      id: 7,
      name: 'Admin User'
    }
  };

  let productsApiSpy: jasmine.SpyObj<ProductsService>;
  let ordersApiSpy: jasmine.SpyObj<OrdersService>;
  let reviewsApiSpy: jasmine.SpyObj<ReviewsService>;

  beforeEach(async () => {
    productsApiSpy = jasmine.createSpyObj<ProductsService>('ProductsService', ['productsIdGet']);
    ordersApiSpy = jasmine.createSpyObj<OrdersService>('OrdersService', ['ordersMeGet', 'ordersPost']);
    reviewsApiSpy = jasmine.createSpyObj<ReviewsService>('ReviewsService', ['usersIdReviewsGet', 'ordersIdReviewsPost']);

    productsApiSpy.productsIdGet.and.returnValue(of(product) as any);
    ordersApiSpy.ordersPost.and.returnValue(of({}) as any);
    reviewsApiSpy.ordersIdReviewsPost.and.returnValue(of({}) as any);

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: ProductsService, useValue: productsApiSpy },
        { provide: OrdersService, useValue: ordersApiSpy },
        { provide: ReviewsService, useValue: reviewsApiSpy },
        { provide: MessagesService, useValue: jasmine.createSpyObj<MessagesService>('MessagesService', ['conversationsPost']) },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']) }
      ]
    }).compileComponents();
  });

  it('keeps the review CTA available for a persisted purchase without a review', () => {
    ordersApiSpy.ordersMeGet.and.returnValue(of([
      { id: 90, product_id: 1, created_at: '2026-03-15T10:00:00Z' }
    ] satisfies Order[]) as any);
    reviewsApiSpy.usersIdReviewsGet.and.returnValue(of(buildReviewsResponse([])) as any);

    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const content = normalizeText(fixture.nativeElement.textContent);

    expect(component.currentUserBought()).toBeTrue();
    expect(component.hasReviewed()).toBeFalse();
    expect(component.currentOrderId()).toBe(90);
    expect(content).toContain('DEJAR RESEÑA');
  });

  it('rebuilds the reviewed state from persisted orders after reload', () => {
    ordersApiSpy.ordersMeGet.and.returnValue(of([
      { id: 90, product_id: 1, created_at: '2026-03-15T10:00:00Z' }
    ] satisfies Order[]) as any);
    reviewsApiSpy.usersIdReviewsGet.and.returnValue(of(buildReviewsResponse([
      { id: 5, order_id: 90, reviewer_id: 1, rating: 5, comment: 'Excelente compra' }
    ])) as any);

    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const content = normalizeText(fixture.nativeElement.textContent);

    expect(component.currentUserBought()).toBeTrue();
    expect(component.hasReviewed()).toBeTrue();
    expect(component.currentOrderId()).toBe(90);
    expect(content).not.toContain('DEJAR RESEÑA');
    expect(content).toContain('COMPRADO');
  });
});

function buildReviewsResponse(reviews: UserReviewsResponse['reviews']): UserReviewsResponse {
  return {
    average_rating: 4.8,
    total_sales: 12,
    reviews: reviews ?? []
  };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
