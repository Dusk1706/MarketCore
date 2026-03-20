import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { catchError, finalize, map, of } from 'rxjs';

import { MessagesService } from '../../../../core/api/api/messages.service';
import { OrdersService } from '../../../../core/api/api/orders.service';
import { ProductsService } from '../../../../core/api/api/products.service';
import { ReviewsService } from '../../../../core/api/api/reviews.service';
import { Order } from '../../../../core/api/model/order';
import { Product } from '../../../../core/api/model/product';
import { Review } from '../../../../core/api/model/review';
import { AuthService } from '../../../../core/services/auth.service';
import { ContactDialogComponent } from '../../components/contact-dialog/contact-dialog.component';
import { ReviewDialogComponent, ReviewDialogResult } from '../../components/review-dialog/review-dialog.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly messagesApi = inject(MessagesService);
  private readonly ordersApi = inject(OrdersService);
  private readonly productsApi = inject(ProductsService);
  private readonly reviewsApi = inject(ReviewsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  product = signal<Product | null>(null);
  isLoading = signal(true);
  averageRating = signal(0);
  totalSales = signal(0);
  totalReviews = signal(0);
  reviews = signal<Review[]>([]);
  productOrders = signal<Order[]>([]);

  ratingStars = computed(() => this.buildRatingStars(this.averageRating()));
  reviewedOrderIds = computed(() => {
    const currentUserId = this.authService.currentUser()?.id;
    if (currentUserId == null) {
      return new Set<number>();
    }

    return new Set(
      this.reviews()
        .flatMap((review) => review.reviewer_id === currentUserId && review.order_id != null ? [review.order_id] : [])
    );
  });
  currentUserBought = computed(() => this.productOrders().length > 0);
  hasReviewed = computed(() =>
    this.productOrders().some((order) => order.id != null && this.reviewedOrderIds().has(order.id))
  );
  currentOrderId = computed(() => {
    const reviewedOrderIds = this.reviewedOrderIds();

    for (const order of this.productOrders()) {
      if (order.id != null && !reviewedOrderIds.has(order.id)) {
        return order.id;
      }
    }

    return this.productOrders().find((order) => order.id != null)?.id ?? null;
  });
  isOwnProduct = computed(() => {
    const p = this.product();
    const user = this.authService.currentUser();
    return !!(p && user && p.seller?.id === user.id);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(Number(id));
    }
  }

  loadProduct(id: number): void {
    this.isLoading.set(true);
    this.productsApi.productsIdGet(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (product) => {
          const currentProduct = product as Product;
          this.product.set(currentProduct);
          this.hydrateProductContext(currentProduct);
        },
        error: () => {
          this.product.set(null);
          this.resetProductContext();
        }
      });
  }

  onBuy(): void {
    const currentProduct = this.product();
    if (!currentProduct?.id) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Debes iniciar sesión para comprar', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.ordersApi.ordersPost({ product_id: currentProduct.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          const createdOrder = order as Order;
          this.productOrders.update((orders) => {
            if (createdOrder.id != null && orders.some((existingOrder) => existingOrder.id === createdOrder.id)) {
              return orders;
            }

            return [createdOrder, ...orders];
          });
          this.product.update((p) => (p ? { ...p, is_sold: true } : p));
          this.snackBar.open('Compra realizada con éxito', 'Cerrar', { duration: 3000 });
          this.onLeaveReview();
        },
        error: (err) => {
          const errorMsg = err?.error?.message ?? 'No se pudo completar la compra';
          this.snackBar.open(errorMsg, 'Cerrar', { duration: 3000 });
        }
      });
  }

  onLeaveReview(): void {
    const currentProduct = this.product();
    const sellerId = currentProduct?.seller?.id;
    const orderId = this.currentOrderId();
    if (!sellerId || !orderId) {
      return;
    }

    const dialogRef = this.dialog.open(ReviewDialogComponent, {
      width: '400px',
      data: {
        sellerName: currentProduct.seller?.name || 'el vendedor'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: ReviewDialogResult) => {
        if (!result) {
          return;
        }

        this.reviewsApi.ordersIdReviewsPost(orderId, {
          rating: result.rating,
          comment: result.comment
        }).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('¡Gracias por tu reseña!', 'Cerrar', { duration: 3000 });
              this.loadSellerReviews(sellerId);
            },
            error: () => {
              this.snackBar.open('No se pudo enviar la reseña', 'Cerrar', { duration: 3000 });
            }
          });
      }
    );
  }

  onContactSeller(): void {
    const currentProduct = this.product();
    if (!currentProduct?.id) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Debes iniciar sesión para contactar al vendedor', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/auth/login']);
      return;
    }

    const dialogRef = this.dialog.open(ContactDialogComponent, {
      width: '540px',
      data: {
        productTitle: currentProduct.title ?? 'Producto'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((content?: string) => {
        if (!content) {
          return;
        }

        this.messagesApi.conversationsPost({
          product_id: currentProduct.id!,
          content
        }).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Mensaje enviado al vendedor', 'Cerrar', { duration: 3000 });
              this.router.navigate(['/inbox']);
            },
            error: () => {
              this.snackBar.open('No se pudo enviar el mensaje', 'Cerrar', { duration: 3000 });
            }
          });
      });
  }

  private hydrateProductContext(product: Product): void {
    const sellerId = product.seller?.id ?? null;
    const productId = product.id ?? null;

    if (sellerId != null) {
      this.loadSellerReviews(sellerId);
    } else {
      this.averageRating.set(0);
      this.totalSales.set(0);
      this.totalReviews.set(0);
      this.reviews.set([]);
    }

    if (productId != null && this.authService.isAuthenticated()) {
      this.loadUserOrdersForProduct(productId);
    } else {
      this.productOrders.set([]);
    }
  }

  private resetProductContext(): void {
    this.averageRating.set(0);
    this.totalSales.set(0);
    this.totalReviews.set(0);
    this.reviews.set([]);
    this.productOrders.set([]);
  }

  private loadUserOrdersForProduct(productId: number): void {
    this.ordersApi.ordersMeGet()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((orders: Order[]) =>
          orders
            .filter((order) => order.product_id === productId)
            .sort((left, right) => this.getOrderSortValue(right) - this.getOrderSortValue(left))
        ),
        catchError(() => of([] as Order[]))
      )
      .subscribe((orders) => this.productOrders.set(orders));
  }

  private getOrderSortValue(order: Order): number {
    const timestamp = order.created_at ? Date.parse(order.created_at) : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private loadSellerReviews(sellerId: number): void {
    this.reviewsApi.usersIdReviewsGet(sellerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.averageRating.set(data.average_rating ?? 0);
          this.totalSales.set(data.total_sales ?? 0);
          this.totalReviews.set(data.reviews?.length ?? 0);
          this.reviews.set(data.reviews ?? []);
        },
        error: () => {
          this.averageRating.set(0);
          this.totalSales.set(0);
          this.totalReviews.set(0);
          this.reviews.set([]);
        }
      });
  }

  private buildRatingStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i += 1) {
      if (rating >= i) {
        stars.push('grade');
      } else if (rating >= i - 0.5) {
        stars.push('star_half');
      } else {
        stars.push('star_outline');
      }
    }
    return stars;
  }
}
