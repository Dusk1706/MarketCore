import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 413) {
    return 'La imagen es demasiado grande. Intenta una imagen menor a 5MB.';
  }

  if (error.status === 401) {
    return 'Tu sesión no es válida. Inicia sesión de nuevo.';
  }

  return error.error?.message || error.error?.error || fallback;
}
