import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { AppError, requireValue } from './errors.mjs';
import { CSV_LIMITS, parseCsv, documentMetadata } from './csv.mjs';
import { CURRENCY_SCALES } from './money.mjs';
import { reconcile, REPORT_SCOPE } from './reconcile.mjs';
import { exportCsv, exportHtml } from './export.mjs';
import { createOllamaClient, OLLAMA_MODEL, MAX_EXPLANATIONS } from './ollama.mjs';
import { ReportStore } from './store.mjs';

const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const MAX_BODY_BYTES = CSV_LIMITS.maxBytes * 4 + 256 * 1024;
const PUBLIC_FILES = new Map([['/', 'index.html'], ['/index.html', 'index.html'], ['/app.js', 'app.js'], ['/styles.css', 'styles.css'], ['/favicon.svg', 'favicon.svg']]);
const CONTENT_TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', csv: 'text/csv; charset=utf-8' };

async function readJson(request) {
  requireValue(/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || ''), 'CONTENT_TYPE', 'API requests must use application/json.', 415);
  requireValue(Number(request.headers['content-length'] || 0) <= MAX_BODY_BYTES, 'REQUEST_TOO_LARGE', 'Request exceeds the two-file upload limit.', 413);
  const chunks = []; let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    requireValue(bytes <= MAX_BODY_BYTES, 'REQUEST_TOO_LARGE', 'Request exceeds the two-file upload limit.', 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AppError('INVALID_JSON', 'Request body must be valid JSON.'); }
}

export function createApp({ port = 4317, modelClient = createOllamaClient(), store = new ReportStore() } = {}) {
  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const allowedOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
  const server = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    const json = (status, payload) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(payload)); };
    let document;
    try {
      requireValue(allowedHosts.has(request.headers.host), 'INVALID_HOST', 'Only this loopback application host is accepted.', 403);
      requireValue(!request.headers.origin || allowedOrigins.has(request.headers.origin), 'INVALID_ORIGIN', 'Cross-origin requests are not accepted.', 403);
      requireValue(!request.headers['sec-fetch-site'] || ['same-origin', 'none'].includes(request.headers['sec-fetch-site']), 'INVALID_ORIGIN', 'Cross-site browser requests are not accepted.', 403);
      const url = new URL(request.url, `http://127.0.0.1:${port}`);
      requireValue(url.origin === `http://127.0.0.1:${port}`, 'INVALID_URL', 'Absolute external request URLs are not accepted.', 403);
      if (request.method === 'GET' && url.pathname === '/api/health') return json(200, { status: 'ok', ...(await modelClient.modelStatus()) });
      if (request.method === 'GET' && url.pathname === '/api/config') return json(200, { limits: { ...CSV_LIMITS, maxExplanations: MAX_EXPLANATIONS, reportTtlMinutes: 20, maxReports: 12 }, scope: REPORT_SCOPE, currencyScales: CURRENCY_SCALES, model: OLLAMA_MODEL, modelEndpoint: 'loopback Ollama', persistence: 'Reports remain in bounded memory only; closing the server erases them.' });
      if (request.method === 'POST' && url.pathname === '/api/mapping') {
        const input = await readJson(request);
        requireValue(['orders', 'receipts'].includes(input?.role), 'INVALID_ROLE', 'Choose orders or receipts.');
        requireValue(input.language === undefined || ['en', 'zh'].includes(input.language), 'INVALID_LANGUAGE', 'Language must be en or zh.');
        document = parseCsv(input.csv, input.filename);
        return json(200, await modelClient.suggestMapping(document, input.role, input.language));
      }
      if (request.method === 'POST' && url.pathname === '/api/reconcile') return json(200, { report: store.put(reconcile(await readJson(request))) });
      if (request.method === 'POST' && url.pathname === '/api/explain') {
        const input = await readJson(request);
        requireValue(input && typeof input.reportId === 'string', 'INVALID_REPORT_ID', 'Use the ID of a report generated in this session.');
        requireValue(input.language === undefined || ['en', 'zh'].includes(input.language), 'INVALID_LANGUAGE', 'Language must be en or zh.');
        return json(200, await modelClient.explain(store.get(input.reportId), input.language));
      }
      const exportMatch = /^\/api\/reports\/([a-f0-9-]{36})\/export$/.exec(url.pathname);
      if (request.method === 'GET' && exportMatch) {
        const format = url.searchParams.get('format');
        requireValue(['csv', 'html'].includes(format), 'INVALID_EXPORT_FORMAT', 'Choose csv or html.');
        const report = store.get(exportMatch[1]);
        response.writeHead(200, { 'Content-Type': CONTENT_TYPES[format], 'Content-Disposition': `attachment; filename="receivable-check-${report.id}.${format}"` });
        response.end(format === 'csv' ? exportCsv(report) : exportHtml(report)); return;
      }
      let relativePath;
      if (request.method === 'GET' && PUBLIC_FILES.has(url.pathname)) relativePath = `public/${PUBLIC_FILES.get(url.pathname)}`;
      if (request.method === 'GET' && ['/examples/orders.csv', '/examples/receipts.csv', '/examples/orders.zh.csv', '/examples/receipts.zh.csv'].includes(url.pathname)) relativePath = url.pathname.slice(1);
      if (relativePath) {
        let content;
        try { content = await readFile(resolve(PROJECT_ROOT, relativePath)); } catch (error) { if (error.code === 'ENOENT') throw new AppError('NOT_FOUND', 'File not available.', 404); throw error; }
        const extension = relativePath.split('.').at(-1);
        response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream' }); response.end(content); return;
      }
      throw new AppError('NOT_FOUND', 'Route not found.', 404);
    } catch (error) {
      if (response.destroyed || response.headersSent) return;
      const known = error instanceof AppError;
      return json(known ? error.status : 500, { error: { code: known ? error.code : 'INTERNAL_ERROR', message: known ? error.message : 'The local request could not be completed.' }, ...(document ? { document: documentMetadata(document) } : {}) });
    }
  });
  server.requestTimeout = 180000; server.headersTimeout = 10000; server.keepAliveTimeout = 5000; server.maxConnections = 24;
  server.on('close', () => store.dispose());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.RECEIVABLE_CHECK_PORT || 4317);
  requireValue(Number.isSafeInteger(port) && port >= 1024 && port <= 65535, 'INVALID_PORT', 'RECEIVABLE_CHECK_PORT must be between 1024 and 65535.');
  const server = createApp({ port });
  server.listen(port, '127.0.0.1', () => { console.log(`Receivable Check: http://127.0.0.1:${port} — local-only, no CSV files written.`); });
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
