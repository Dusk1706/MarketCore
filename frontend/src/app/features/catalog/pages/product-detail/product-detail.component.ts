import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProductsService } from '../../../../core/api/api/products.service';
import { Product } from '../../../../core/api/model/models';

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
    MatSnackBarModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productsApi = inject(ProductsService);
  private snackBar = inject(MatSnackBar);

  product = signal<Product | null>(null);
  isLoading = signal(true);

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
        this.product.set(product);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar el producto', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  onBuy() {
    this.snackBar.open('¡Funcionalidad de compra próximamente!', 'Cerrar', { duration: 3000 });
  }
}
