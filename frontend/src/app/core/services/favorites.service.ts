import { Injectable, inject, signal, effect } from '@angular/core';
import { FavoritesService as ApiFavoritesService } from '../api/api/favorites.service';
import { AuthService } from './auth.service';
import { map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoreFavoritesService {
  private apiFavorites = inject(ApiFavoritesService);
  private authService = inject(AuthService);

  // Set of favorite product IDs
  private favoriteIds = signal<Set<number>>(new Set());

  constructor() {
    // Re-fetch favorites when user logs in
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.loadFavorites();
      } else {
        this.favoriteIds.set(new Set());
      }
    });
  }

  loadFavorites() {
    this.apiFavorites.usersMeFavoritesGet().pipe(
      map(products => new Set(products.map(p => p.id!))),
      catchError(() => of(new Set<number>()))
    ).subscribe(ids => this.favoriteIds.set(ids));
  }

  isFavorite(productId: number): boolean {
    return this.favoriteIds().has(productId);
  }

  toggleFavorite(productId: number) {
    const isFav = this.isFavorite(productId);
    const request$ = isFav 
      ? this.apiFavorites.usersMeFavoritesProductIdDelete(productId)
      : this.apiFavorites.usersMeFavoritesProductIdPost(productId);

    return request$.pipe(
      map(() => {
        this.favoriteIds.update(set => {
          const newSet = new Set(set);
          if (isFav) {
            newSet.delete(productId);
          } else {
            newSet.add(productId);
          }
          return newSet;
        });
        return !isFav;
      })
    );
  }
}
