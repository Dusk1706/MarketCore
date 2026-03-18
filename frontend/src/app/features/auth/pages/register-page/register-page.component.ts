import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterFormComponent } from '../../ui/register-form/register-form.component';
import { UserRegister } from '../../../../core/api/model/models';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatSnackBarModule, RegisterFormComponent],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);

  onRegister(userData: UserRegister) {
    this.isLoading.set(true);
    this.authService.register(userData).subscribe({
      next: () => {
        this.snackBar.open('¡Registro exitoso! Por favor inicia sesión.', 'Cerrar', { duration: 5000 });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err.status === 400 ? 'El correo ya está en uso o los datos son inválidos' : 'Ocurrió un error. Por favor intenta de nuevo.';
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
      }
    });
  }
}
