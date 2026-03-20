import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BYPASS_GLOBAL_HTTP_ERROR_HANDLER } from './http-context-tokens';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (req.context.get(BYPASS_GLOBAL_HTTP_ERROR_HANDLER)) {
        return throwError(() => error);
      }

      let message = 'Ocurrió un error inesperado';

      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
        message = 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        message = 'No tienes permisos para realizar esta acción.';
      } else if (error.status === 404) {
        message = 'El recurso solicitado no existe.';
      } else if (error.status >= 500) {
        message = 'Error en el servidor. Por favor, intenta más tarde.';
      } else if (error.error?.message) {
        message = error.error.message;
      }

      snackBar.open(message, 'Cerrar', { 
        duration: 5000,
        panelClass: ['error-snackbar'] 
      });
      
      return throwError(() => error);
    })
  );
};
