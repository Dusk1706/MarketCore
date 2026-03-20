import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../../core/api/model/models';
import { FavoritesService } from '../../../../core/api/api/favorites.service';
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
  favoriteToggled = output<Product>();

  private favoritesApi = inject(FavoritesService);
  private snackBar = inject(MatSnackBar);

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    
    const p = this.product();
    // Assuming adding by default. In a real app we'd track state locally or globally.
    // For now we just emit the toggle event, and if it's on the favorites page it removes it.
    // We can just call delete if we are in the favorites page. But let's just make it a simple emit for now.
    // Or we can just call the API here to remove if we pass a mode.
    this.favoritesApi.usersMeFavoritesProductIdDelete(p.id!).subscribe({
      next: () => {
        this.favoriteToggled.emit(p);
        this.snackBar.open('Eliminado de favoritos', 'Cerrar', { duration: 2000 });
      },
      error: () => {
        // Fallback to add if it was a toggle
        this.favoritesApi.usersMeFavoritesProductIdPost(p.id!).subscribe({
          next: () => {
            this.snackBar.open('Agregado a favoritos', 'Cerrar', { duration: 2000 });
          }
        });
      }
    });
  }
}
