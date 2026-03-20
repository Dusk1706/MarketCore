import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { enableProdMode, isDevMode } from '@angular/core';

if (!isDevMode()) {
  enableProdMode();
  // Redefine console methods to be empty in production
  window.console.log = () => {};
  window.console.debug = () => {};
  window.console.info = () => {};
  window.console.warn = () => {};
  // We keep console.error but we could also sanitize it if needed
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    if (isDevMode()) {
      console.error(err);
    }
  });
