import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BASE_PATH } from '../api/variables';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const basePath = inject(BASE_PATH);
  const token = authService.getToken();

  // Solo adjuntar el token si la petición va dirigida a nuestra propia API
  // Esto evita que el token se filtre a servicios externos (analíticas, etc.)
  if (token && req.url.startsWith(basePath)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
