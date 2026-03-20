import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { MessagesService } from '../../../../core/api/api/messages.service';
import { OrdersService } from '../../../../core/api/api/orders.service';
import { ProductsService } from '../../../../core/api/api/products.service';
import { ReviewsService } from '../../../../core/api/api/reviews.service';
import { Product } from '../../../../core/api/model/product';
import { AuthService } from '../../../../core/services/auth.service';
import { ContactDialogComponent } from '../../components/contact-dialog/contact-dialog.component';

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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private messagesApi = inject(MessagesService);
  private ordersApi = inject(OrdersService);
  private productsApi = inject(ProductsService);
  private reviewsApi = inject(ReviewsService);
  private snackBar = inject(MatSnackBar);

  product = signal<Product | null>(null);
  isLoading = signal(true);
  averageRating = signal(0);
  totalSales = signal(0);
  totalReviews = signal(0);

  ratingStars = computed(() => this.buildRatingStars(this.averageRating()));
  isOwnProduct = computed(() => {
    const p = this.product();
    const user = this.authService.currentUser();
    return !!(p && user && p.seller?.id === user.id);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(Number(id));
    }
  }

  loadProduct(id: number) {
    this.isLoading.set(true);
    this.productsApi.productsIdGet(id).subscribe({
      next: (product) => {
        this.product.set(product as Product);
        const sellerId = product.seller?.id;
        if (sellerId != null) {
          this.loadSellerReviews(sellerId);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onBuy() {
    const currentProduct = this.product();
    if (!currentProduct?.id) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Debes iniciar sesión para comprar', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.ordersApi.ordersPost({ product_id: currentProduct.id }).subscribe({
      next: () => {
        this.product.update((p) => (p ? { ...p, is_sold: true } : p));
        this.snackBar.open('Compra realizada con éxito', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const errorMsg = err?.error?.message ?? 'No se pudo completar la compra';
        this.snackBar.open(errorMsg, 'Cerrar', { duration: 3000 });
      }
    });
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

    dialogRef.afterClosed().subscribe((content?: string) => {
      if (!content) {
        return;
      }

      this.messagesApi.conversationsPost({
        product_id: currentProduct.id!,
        content
      }).subscribe({
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

  private loadSellerReviews(sellerId: number): void {
    this.reviewsApi.usersIdReviewsGet(sellerId).subscribe({
      next: (data) => {
        this.averageRating.set(data.average_rating ?? 0);
        this.totalSales.set(data.total_sales ?? 0);
        this.totalReviews.set(data.reviews?.length ?? 0);
      },
      error: () => {
        this.averageRating.set(0);
        this.totalSales.set(0);
        this.totalReviews.set(0);
      }
    });
  }

  private buildRatingStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i += 1) {
      if (rating >= i) {
        stars.push('star');
      } else if (rating >= i - 0.5) {
        stars.push('star_half');
      } else {
        stars.push('star_border');
      }
    }
    return stars;
  }
}
