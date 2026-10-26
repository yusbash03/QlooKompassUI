// Stand-in API for Playwright e2e while the backend lacks most endpoints: serves the MSW fake API (src/test/msw)
// over HTTP so the built app + service worker run against it unchanged. One in-memory backend: run e2e with 1 worker.
// Run: node e2e/mock-api/server.ts  (Node ≥ 23 strips the TypeScript types.)
import { createServer } from 'node:http';
import { registerHooks } from 'node:module';
import { Readable } from 'node:stream';

const SRC = new URL('../../src/', import.meta.url);

// Resolve the app's `@/` alias and extensionless relative imports the way Vite does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = specifier.startsWith('@/') ? new URL(specifier.slice(2), SRC).href : specifier;
    const local = target.startsWith('.') || target.startsWith('file:');
    if (local && !/\.[cm]?[jt]sx?$/.test(target)) {
      for (const ext of ['.ts', '.tsx']) {
        try {
          return nextResolve(target + ext, context);
        } catch {
          // try the next extension
        }
      }
    }
    return nextResolve(target, context);
  },
});

const { getResponse } = await import('msw');
const { handlers } = await import('../../src/test/msw/handlers/index.ts');

const port = Number(process.env.MOCK_API_PORT ?? 5299);

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname === '/health') {
    res.writeHead(200).end('ok');
    return;
  }
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(name, value);
    else if (Array.isArray(value)) for (const v of value) headers.append(name, v);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const request = new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
    duplex: 'half',
  } as RequestInit);

  const response = await getResponse(handlers, request);
  if (!response) {
    res.writeHead(404, { 'Content-Type': 'application/problem+json' });
    res.end(JSON.stringify({ title: 'Not found', status: 404, code: 'not_found' }));
    return;
  }
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.log(`mock API on http://localhost:${port}`));
