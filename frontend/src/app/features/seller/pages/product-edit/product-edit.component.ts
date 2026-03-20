import { Component, ChangeDetectionStrategy, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ProductFormComponent } from '../../ui/product-form/product-form.component';
import { ProductEditFacade } from '../../data-access/product-edit.facade';
import { ProductCreate, ProductUpdate } from '../../../../core/api/model/models';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  providers: [ProductEditFacade],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    ProductFormComponent
  ],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductEditComponent {
  @ViewChild(ProductFormComponent) productFormRef?: ProductFormComponent;

  private route = inject(ActivatedRoute);
  private facade = inject(ProductEditFacade);

  ui = this.facade.ui;
  categories = this.facade.categories;

  constructor() {
    const productId = this.route.snapshot.params['id'];
    this.facade.initialize(productId ? Number(productId) : undefined);

    effect(
      () => {
        const imageUrl = this.facade.uploadedImageUrl();
        if (!imageUrl) {
          return;
        }

        this.productFormRef?.updateImageUrl(imageUrl);
      },
      { allowSignalWrites: true }
    );
  }

  onSave(productData: ProductCreate | ProductUpdate) {
    this.facade.saveProduct(productData);
  }

  onUploadImage(file: File) {
    this.facade.uploadImage(file);
  }

  onCancel() {
    this.facade.cancel();
  }
}
