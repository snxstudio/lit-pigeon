import express from 'express';
import { createHandler } from '@lit-pigeon/rest';

export function createApp(token: string) {
  const app = express();
  // Express strips the /email prefix, so the handler sees /render, /parse, …
  app.use(
    '/email',
    createHandler({
      bearerToken: token,
      // Same-origin only; set an explicit origin if a browser calls it cross-origin.
      cors: false,
      maxBodyBytes: 2 * 1024 * 1024,
    }),
  );
  return app;
}
