import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FavoritesService as ApiFavoritesService } from '../api/api/favorites.service';
import { AuthService } from './auth.service';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { BYPASS_GLOBAL_HTTP_ERROR_HANDLER } from '../interceptors/http-context-tokens';

@Injectable({
  providedIn: 'root'
})
export class CoreFavoritesService {
  private readonly apiFavorites = inject(ApiFavoritesService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private syncedUserId: number | null = null;
  private pendingLoad$: Observable<Set<number>> | null = null;

  private readonly favoriteIds = signal<Set<number>>(new Set());
  private readonly hasLoaded = signal(false);
  private readonly isLoading = signal(false);

  constructor() {
    effect(() => {
      const currentUserId = this.authService.currentUser()?.id ?? null;
      if (currentUserId === this.syncedUserId) {
        return;
      }

      this.syncedUserId = currentUserId;
      this.favoriteIds.set(new Set());
      this.hasLoaded.set(false);
      this.isLoading.set(false);
      this.pendingLoad$ = null;
    }, { allowSignalWrites: true });
  }

  loadFavorites(): void {
    this.loadFavoriteIds(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  ensureLoadedSilently(): void {
    this.loadFavoriteIds(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  isFavorite(productId: number): boolean {
    return this.favoriteIds().has(productId);
  }

  toggleFavorite(productId: number) {
    return this.loadFavoriteIds(false).pipe(
      switchMap(() => {
        const isFav = this.isFavorite(productId);
        const request$ = isFav
          ? this.apiFavorites.usersMeFavoritesProductIdDelete(productId)
          : this.apiFavorites.usersMeFavoritesProductIdPost(productId);

        return request$.pipe(
          map(() => {
            this.favoriteIds.update((set) => {
              const newSet = new Set(set);
              if (isFav) {
                newSet.delete(productId);
              } else {
                newSet.add(productId);
              }
              return newSet;
            });
            this.hasLoaded.set(true);
            return !isFav;
          })
        );
      })
    );
  }

  private loadFavoriteIds(silent: boolean): Observable<Set<number>> {
    if (!this.authService.isAuthenticated()) {
      this.favoriteIds.set(new Set());
      this.hasLoaded.set(false);
      return of(new Set<number>());
    }

    if (this.hasLoaded()) {
      return of(this.favoriteIds());
    }

    if (this.pendingLoad$) {
      return this.pendingLoad$;
    }

    this.isLoading.set(true);
    this.pendingLoad$ = this.fetchFavoriteIds(silent).pipe(
      tap((ids) => {
        this.favoriteIds.set(ids);
        this.hasLoaded.set(true);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.pendingLoad$ = null;
      }),
      shareReplay(1)
    );

    return this.pendingLoad$;
  }

  private fetchFavoriteIds(silent: boolean): Observable<Set<number>> {
    const requestOptions = silent
      ? { context: new HttpContext().set(BYPASS_GLOBAL_HTTP_ERROR_HANDLER, true) }
      : undefined;

    return this.apiFavorites.usersMeFavoritesGet('body', false, requestOptions).pipe(
      map((products) => new Set(products.flatMap((product) => product.id != null ? [product.id] : []))),
      catchError((error: HttpErrorResponse) => {
        if (silent && error.status === 401) {
          this.authService.logout();
        }

        return of(new Set<number>());
      })
    );
  }
}
