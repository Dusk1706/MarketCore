import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { AuthToken, User, UserLogin, UserRegister } from '../api/model/models';
import { AuthService as ApiAuthService } from '../api/api/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiAuth = inject(ApiAuthService);
  
  private _currentUser = signal<User | null>(null);
  currentUser = this._currentUser.asReadonly();
  
  isAuthenticated = computed(() => !!this._currentUser());

  constructor() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this._currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }

  login(credentials: UserLogin) {
    return this.apiAuth.authLoginPost(credentials).pipe(
      tap((response: AuthToken) => {
        if (response.access_token && response.user) {
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this._currentUser.set(response.user);
        }
      })
    );
  }

  register(userData: UserRegister) {
    return this.apiAuth.authRegisterPost(userData);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
