import { Component, ChangeDetectionStrategy, input, output, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../../core/api/model/product';
import { CoreFavoritesService } from '../../../../core/services/favorites.service';
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

  private favoritesService = inject(CoreFavoritesService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  isFavoritePending = signal(false);

  constructor() {
    this.favoritesService.ensureLoadedSilently();
  }

  isOwnProduct = computed(() => {
    const p = this.product();
    const user = this.authService.currentUser();
    return !!(p && user && p.seller?.id === user.id);
  });

  isFavoriteActive = computed(() => {
    const p = this.product();
    return this.inFavoritesView() || (!!p.id && this.favoritesService.isFavorite(p.id));
  });

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
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Debes iniciar sesión para guardar favoritos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isFavoritePending.set(true);
    this.favoritesService.toggleFavorite(p.id).subscribe({
      next: (isNowFav) => {
        if (this.inFavoritesView() && !isNowFav) {
          this.favoriteToggled.emit(p);
        }
        this.isFavoritePending.set(false);
        this.snackBar.open(isNowFav ? 'Agregado a favoritos' : 'Eliminado de favoritos', 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.isFavoritePending.set(false);
      }
    });
  }
}
