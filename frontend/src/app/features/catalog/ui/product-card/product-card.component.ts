import { Component, ChangeDetectionStrategy, input, output, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../../core/api/model/models';
import { FavoritesService } from '../../../../core/api/api/favorites.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  product = input.required<Product>();
  inFavoritesView = input(false);
  favoriteToggled = output<Product>();

  private favoritesApi = inject(FavoritesService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  isFavoritePending = signal(false);
  isFavorited = signal(false);

  isOwnProduct = computed(() => {
    const p = this.product();
    const user = this.authService.currentUser();
    return !!(p && user && p.seller?.id === user.id);
  });

  isFavoriteActive = computed(() => this.inFavoritesView() || this.isFavorited());

  favoriteIcon = computed(() => this.isFavoriteActive() ? 'favorite' : 'favorite_border');

  favoriteAriaLabel = computed(() => this.isFavoriteActive() ? 'Quitar de favoritos' : 'Agregar a favoritos');

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.isFavoritePending()) {
      return;
    }

    const p = this.product();
    if (!p.id) {
      this.snackBar.open('No se pudo actualizar favorito', 'Cerrar', { duration: 2500 });
      return;
    }

    const shouldRemove = this.inFavoritesView() || this.isFavorited();
    const request$ = shouldRemove
      ? this.favoritesApi.usersMeFavoritesProductIdDelete(p.id)
      : this.favoritesApi.usersMeFavoritesProductIdPost(p.id);

    this.isFavoritePending.set(true);
    request$.subscribe({
      next: () => {
        if (this.inFavoritesView()) {
          this.favoriteToggled.emit(p);
          this.snackBar.open('Eliminado de favoritos', 'Cerrar', { duration: 2000 });
        } else {
          this.isFavorited.set(!shouldRemove);
          this.snackBar.open(shouldRemove ? 'Eliminado de favoritos' : 'Agregado a favoritos', 'Cerrar', { duration: 2000 });
        }
        this.isFavoritePending.set(false);
      },
      error: () => {
        this.snackBar.open('No se pudo actualizar favoritos', 'Cerrar', { duration: 2500 });
        this.isFavoritePending.set(false);
      }
    });
  }
}
