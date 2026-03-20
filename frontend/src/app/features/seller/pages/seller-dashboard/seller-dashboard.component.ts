import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Product } from '../../../../core/api/model/models';
import { SellerDashboardFacade } from '../../data-access/seller-dashboard.facade';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  providers: [SellerDashboardFacade],
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule, 
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SellerDashboardComponent {
  private sellerFacade = inject(SellerDashboardFacade);
  private router = inject(Router);

  products = this.sellerFacade.products;
  ui = this.sellerFacade.ui;

  displayedColumns: string[] = ['title', 'price', 'category', 'status', 'actions'];

  constructor() {
    this.sellerFacade.initialize();
  }

  openForm(product: Product | null = null) {
    if (product) {
      this.router.navigate(['/seller/product/edit', product.id]);
    } else {
      this.router.navigate(['/seller/product/new']);
    }
  }

  onDelete(id: number) {
    this.sellerFacade.deleteProduct(id);
  }
}
