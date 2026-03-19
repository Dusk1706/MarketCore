import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductsService } from '../../../../core/api/api/products.service';
import { CategoriesService } from '../../../../core/api/api/categories.service';
import { Product, Category, ProductCreate, ProductUpdate } from '../../../../core/api/model/models';
import { ProductFormComponent } from '../../ui/product-form/product-form.component';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule, 
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ProductFormComponent
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SellerDashboardComponent implements OnInit {
  private productsApi = inject(ProductsService);
  private categoriesApi = inject(CategoriesService);
  private snackBar = inject(MatSnackBar);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  isFormOpen = signal(false);
  editingProduct = signal<Product | null>(null);

  displayedColumns: string[] = ['title', 'price', 'category', 'status', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    // Load categories first
    this.categoriesApi.categoriesGet().subscribe(cats => this.categories.set(cats));
    
    // Load seller's products
    this.productsApi.productsGet(undefined, undefined, undefined, undefined, true).subscribe({
      next: (response: any) => {
        // Manejar la estructura paginada del backend: { meta: {...}, products: [...] }
        const items = response.products ? response.products : response;
        this.products.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar tus productos', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  openCreateForm() {
    this.editingProduct.set(null);
    this.isFormOpen.set(true);
  }

  openEditForm(product: Product) {
    this.editingProduct.set(product);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.editingProduct.set(null);
  }

  onSave(productData: ProductCreate | ProductUpdate) {
    this.isLoading.set(true);
    const product = this.editingProduct();
    
    if (product && product.id) {
      // Update
      this.productsApi.productsIdPut(product.id, productData as ProductUpdate).subscribe({
        next: () => {
          this.snackBar.open('Producto actualizado', 'Cerrar', { duration: 3000 });
          this.loadData();
          this.closeForm();
        },
        error: () => {
          this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
    } else {
      // Create
      this.productsApi.productsPost(productData as ProductCreate).subscribe({
        next: () => {
          this.snackBar.open('Producto publicado', 'Cerrar', { duration: 3000 });
          this.loadData();
          this.closeForm();
        },
        error: () => {
          this.snackBar.open('Error al publicar', 'Cerrar', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
    }
  }

  onDelete(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.isLoading.set(true);
      this.productsApi.productsIdDelete(id).subscribe({
        next: () => {
          this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
          this.loadData();
        },
        error: () => {
          this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
    }
  }
}
