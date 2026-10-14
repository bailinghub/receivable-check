import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createApp } from '../src/server.mjs';
import { AppError } from '../src/errors.mjs';

const mapping = { reference: 'ref', amount: 'amount', currency: 'currency' };
const pair = { orders: { csv: 'ref,amount,currency\nA,10.00,USD', mapping }, receipts: { csv: 'ref,amount,currency\nA,9.00,USD', mapping } };
const modelClient = {
  modelStatus: async () => ({ modelReady: false, model: 'qwen3:4b', modelDigest: null }),
  suggestMapping: async () => { throw new AppError('MODEL_UNAVAILABLE', 'Local model is offline.', 503); },
  explain: async () => { throw new AppError('MODEL_UNAVAILABLE', 'Local model is offline.', 503); },
};

test('HTTP local-only guards, manual reconciliation, stored report export and truthful AI failure', async (context) => {
  const server = createApp({ modelClient });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  const call = (path, { method = 'GET', body, headers = {} } = {}) => new Promise((resolve, reject) => {
    const request = httpRequest({ hostname: '127.0.0.1', port, path, method, headers: { host: '127.0.0.1:4317', ...body ? { 'content-type': 'application/json' } : {}, ...headers } }, (response) => {
      const chunks = []; response.on('data', (chunk) => chunks.push(chunk)); response.on('end', () => { const text = Buffer.concat(chunks).toString(); resolve({ status: response.statusCode, headers: response.headers, text, json: () => JSON.parse(text) }); });
    });
    request.on('error', reject); request.end(body ? JSON.stringify(body) : undefined);
  });
  assert.equal((await call('/api/health')).json().modelReady, false);
  assert.equal((await call('/api/config')).json().limits.maxRows, 5000);
  assert.equal((await call('/api/health', { headers: { host: 'attacker.example:4317' } })).status, 403);
  assert.equal((await call('/api/health', { headers: { origin: 'https://attacker.example' } })).status, 403);
  assert.equal((await call('/api/health', { headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal((await call('/api/reconcile', { method: 'POST', body: pair, headers: { 'content-type': 'text/plain' } })).status, 415);
  const result = await call('/api/reconcile', { method: 'POST', body: pair });
  assert.equal(result.status, 200); const report = result.json().report;
  assert.equal(report.findings[0].delta, '-1.00'); assert.equal(report.findings[0].status, 'under');
  const csv = await call(`/api/reports/${report.id}/export?format=csv`);
  assert.equal(csv.status, 200); assert.ok(csv.text.includes(report.documents.orders.sha256)); assert.ok(csv.headers['content-disposition'].startsWith('attachment;'));
  const html = await call(`/api/reports/${report.id}/export?format=html`);
  assert.equal(html.status, 200); assert.ok(html.text.includes('<!doctype html>'));
  const unavailable = await call('/api/mapping', { method: 'POST', body: { role: 'orders', csv: pair.orders.csv, filename: 'sample.csv' } });
  assert.equal(unavailable.status, 503); assert.equal(unavailable.json().error.code, 'MODEL_UNAVAILABLE'); assert.equal(unavailable.json().document.rowCount, 1); assert.ok(!unavailable.json().suggestion);
  assert.equal((await call('/api/explain', { method: 'POST', body: { reportId: 'not-cached' } })).status, 404);
  assert.equal((await call('/api/explain', { method: 'POST', body: { reportId: report.id } })).status, 503);
  assert.equal((await call('/examples/orders.csv')).status, 200);
  assert.equal((await call('/../../package.json')).status, 404);
  assert.equal((await call('/src/server.mjs')).status, 404);
  assert.equal((await call('/api/reports/00000000-0000-0000-0000-000000000000/export?format=csv')).status, 404);
  assert.equal((await call(`/api/reports/${report.id}/export?format=js`)).status, 400);
});
