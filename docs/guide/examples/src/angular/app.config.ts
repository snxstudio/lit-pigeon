import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ACCESS_TOKEN } from './email-api.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Binds the :templateId route parameter to TemplateEditorComponent's input.
    provideRouter(routes, withComponentInputBinding()),
    // Replace with your auth layer's token getter.
    { provide: ACCESS_TOKEN, useValue: () => sessionStorage.getItem('access_token') ?? '' },
  ],
};
