#!/usr/bin/env node
import { createServer } from '../server.js';

const port = Number(process.env.PORT ?? process.env.LIT_PIGEON_REST_PORT ?? 0);
const host = process.env.HOST ?? process.env.LIT_PIGEON_REST_HOST ?? '127.0.0.1';
const bearerToken = process.env.LIT_PIGEON_REST_TOKEN;

const { server, ready } = createServer({ port, host, bearerToken });

ready
  .then(({ host: boundHost, port: boundPort }) => {
    // eslint-disable-next-line no-console
    console.error(`[lit-pigeon-rest] listening on http://${boundHost}:${boundPort}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[lit-pigeon-rest] failed to start:', err);
    process.exit(1);
  });

const shutdown = (): void => {
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
