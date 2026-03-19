import { Component, ChangeDetectionStrategy, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Product, ProductCreate, ProductUpdate } from '../../../../core/api/model/models';
import { ProductFormComponent } from '../../ui/product-form/product-form.component';
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
    MatProgressSpinnerModule,
    ProductFormComponent
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SellerDashboardComponent {
  @ViewChild(ProductFormComponent) productFormRef?: ProductFormComponent;

  private sellerFacade = inject(SellerDashboardFacade);

  products = this.sellerFacade.products;
  categories = this.sellerFacade.categories;
  ui = this.sellerFacade.ui;

  displayedColumns: string[] = ['title', 'price', 'category', 'status', 'actions'];

  constructor() {
    this.sellerFacade.initialize();

    effect(
      () => {
        const imageUrl = this.sellerFacade.uploadedImageUrl();
        if (!imageUrl) {
          return;
        }

        this.productFormRef?.updateImageUrl(imageUrl);
        this.sellerFacade.consumeUploadedImageUrl();
      },
      { allowSignalWrites: true }
    );
  }

  openForm(product: Product | null = null) {
    this.sellerFacade.openForm(product);
  }

  closeForm() {
    this.sellerFacade.closeForm();
  }

  onUploadImage(file: File) {
    this.sellerFacade.uploadImage(file);
  }

  onSave(productData: ProductCreate | ProductUpdate) {
    this.sellerFacade.saveProduct(productData);
  }

  onDelete(id: number) {
    this.sellerFacade.deleteProduct(id);
  }
}
