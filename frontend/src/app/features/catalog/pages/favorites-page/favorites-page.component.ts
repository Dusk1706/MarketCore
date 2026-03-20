import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FavoritesService } from '../../../../core/api/api/favorites.service';
import { Product } from '../../../../core/api/model/product';
import { ProductCardComponent } from '../../ui/product-card/product-card.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, ProductCardComponent, RouterLink],
  templateUrl: './favorites-page.component.html',
  styleUrl: './favorites-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesPageComponent implements OnInit {
  private favoritesApi = inject(FavoritesService);

  products = signal<Product[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loading.set(true);
    this.favoritesApi.usersMeFavoritesGet().subscribe({
      next: (products) => {
        this.products.set(products as Product[]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFavoriteToggled(product: Product): void {
    // Si se quita de favoritos, lo quitamos de la lista
    this.products.update(list => list.filter(p => p.id !== product.id));
  }
}
