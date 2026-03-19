import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 (No Autorizado) y NO estamos en la página de login
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        // Limpiamos el estado de autenticación (borrar token de localStorage)
        authService.logout();
        
        // Avisamos al usuario
        snackBar.open('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar'] 
        });
        
        // Redirigimos al login
        router.navigate(['/auth/login']);
      }
      
      // Pasar el error para que otros componentes puedan manejar sus errores específicos si quieren
      return throwError(() => error);
    })
  );
};
