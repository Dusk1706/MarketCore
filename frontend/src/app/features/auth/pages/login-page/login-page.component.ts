import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginFormComponent } from '../../ui/login-form/login-form.component';
import { UserLogin } from '../../../../core/api/model/models';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);

  onLogin(credentials: UserLogin) {
    this.isLoading.set(true);
    this.authService.login(credentials).subscribe({
      next: () => {
        this.snackBar.open('¡Bienvenido de nuevo!', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/catalog']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err.status === 401 ? 'Credenciales inválidas' : 'Ocurrió un error. Por favor intenta de nuevo.';
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
      }
    });
  }
}
