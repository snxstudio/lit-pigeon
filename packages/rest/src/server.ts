import { createServer as createHttpServer, type Server } from 'node:http';
import { createHandler, type CreateHandlerOptions } from './handler.js';

export interface CreateServerOptions extends CreateHandlerOptions {
  /** Default 0 — let the OS pick a free port (read it back from `server.address()`). */
  port?: number;
  /** Default 127.0.0.1 — bind to localhost. Set '0.0.0.0' to expose externally. */
  host?: string;
}

/**
 * Boot a stand-alone Node HTTP server serving the Lit Pigeon REST API.
 * Returns the underlying `http.Server` so callers can `server.close()`
 * during shutdown or in tests.
 */
export function createServer(options: CreateServerOptions = {}): {
  server: Server;
  ready: Promise<{ host: string; port: number }>;
} {
  const handler = createHandler(options);
  const server = createHttpServer(handler);

  const ready = new Promise<{ host: string; port: number }>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, options.host ?? '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolve({ host: address.address, port: address.port });
      } else {
        reject(new Error('Server failed to bind to a port.'));
      }
    });
  });

  return { server, ready };
}
