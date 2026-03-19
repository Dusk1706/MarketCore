import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { BASE_PATH } from './core/api/variables';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideAnimationsAsync(),
    // Registramos ambos interceptores. El orden importa: primero añade el token, luego maneja errores
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    { provide: BASE_PATH, useValue: '/api/v1' } // Se comunica a través del proxy de Nginx en Docker
  ]
};
