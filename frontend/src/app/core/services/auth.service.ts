import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { AuthToken, User, UserLogin, UserRegister } from '../api/model/models';
import { AuthService as ApiAuthService } from '../api/api/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiAuth = inject(ApiAuthService);
  
  private readonly _currentUser = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  
  readonly isAuthenticated = computed(() => !!this._currentUser() && !!this._token());

  constructor() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!savedToken || !savedUser) {
      this.clearSession();
      return;
    }

    try {
      this._token.set(savedToken);
      this._currentUser.set(JSON.parse(savedUser));
    } catch {
      this.clearSession();
    }
  }

  login(credentials: UserLogin) {
    return this.apiAuth.authLoginPost(credentials).pipe(
      tap((response: AuthToken) => {
        if (response.access_token && response.user) {
          this.setSession(response.access_token, response.user);
        }
      })
    );
  }

  register(userData: UserRegister) {
    return this.apiAuth.authRegisterPost(userData);
  }

  logout(): void {
    this.clearSession();
  }

  getToken(): string | null {
    return this._token();
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this._token.set(token);
    this._currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._currentUser.set(null);
  }
}
