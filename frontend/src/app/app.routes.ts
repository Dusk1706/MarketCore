import { Routes } from '@angular/router';
import { authGuard } from './core/interceptors/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'catalog',
    pathMatch: 'full'
  },
  {
    path: 'catalog',
    loadComponent: () => import('./features/catalog/pages/catalog-page/catalog-page.component').then(m => m.CatalogPageComponent)
  },
  {
    path: 'catalog/product/:id',
    loadComponent: () => import('./features/catalog/pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/pages/login-page/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/pages/register-page/register-page.component').then(m => m.RegisterPageComponent)
  },
  {
    path: 'seller',
    canActivate: [authGuard],
    loadComponent: () => import('./features/seller/pages/seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent)
  }
];
