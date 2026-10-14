import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseCsv, validateMapping, CSV_LIMITS } from '../src/csv.mjs';
import { parseMoney, formatMinor } from '../src/money.mjs';
import { reconcile } from '../src/reconcile.mjs';
import { csvCell, escapeHtml, exportCsv, exportHtml } from '../src/export.mjs';
import { ReportStore } from '../src/store.mjs';

const english = { orders: { reference: 'Order code', amount: 'Amount due', currency: 'Currency' }, receipts: { reference: 'Payment reference', amount: 'Received', currency: 'Currency' } };
const simple = { reference: 'ref', amount: 'amount', currency: 'currency' };
function pair(orderRows, receiptRows) {
  return reconcile({ orders: { csv: `ref,amount,currency\n${orderRows}\n`, filename: 'orders.csv', mapping: simple }, receipts: { csv: `ref,amount,currency\n${receiptRows}\n`, filename: 'receipts.csv', mapping: simple } });
}

test('synthetic fixture matches independently fixed expected amounts, statuses and all physical source rows', async () => {
  const [orders, receipts, expectedJson] = await Promise.all(['orders.csv', 'receipts.csv', 'expected.json'].map((name) => readFile(new URL(`../examples/${name}`, import.meta.url), 'utf8')));
  const expected = JSON.parse(expectedJson);
  const report = reconcile({ orders: { csv: orders, filename: 'orders.csv', mapping: english.orders }, receipts: { csv: receipts, filename: 'receipts.csv', mapping: english.receipts } });
  assert.deepEqual(report.summary.byStatus, expected.byStatus);
  assert.equal(report.documents.orders.rowCount, expected.documents.orders);
  assert.equal(report.documents.receipts.rowCount, expected.documents.receipts);
  assert.equal(report.documents.orders.sha256, createHash('sha256').update(orders).digest('hex'));
  for (const [reference, target] of Object.entries(expected.references)) {
    const finding = report.findings.find((item) => item.reference === reference);
    assert.ok(finding, reference);
    for (const field of ['status', 'expected', 'received', 'delta']) assert.equal(finding[field], target[field], `${reference} ${field}`);
    for (const role of ['orders', 'receipts']) {
      assert.deepEqual(finding[role].map((row) => row.line), target[role]);
      for (const row of finding[role]) assert.equal(row.documentSha256, report.documents[role].sha256);
    }
  }
  assert.equal(report.summary.totals, null);
  assert.ok(report.scope.mixedCurrencyWarning);
});

test('CSV parser preserves BOM digest, RFC quoted commas, escaped quotes and CRLF physical source lines', () => {
  const csv = '\ufeffref,amount,currency,note\r\nA,1.00,CNY,"comma, and ""quote""\r\nsecond line"\r\nB,2.00,CNY,plain\r\n';
  const document = parseCsv(csv, '../../sample.csv');
  assert.equal(document.filename, 'sample.csv');
  assert.equal(document.rows[0].values.note, 'comma, and "quote"\nsecond line');
  assert.equal(document.rows[0].line, 2); assert.equal(document.rows[0].endLine, 3);
  assert.equal(document.rows[1].line, 4);
  assert.equal(document.sha256, createHash('sha256').update(csv).digest('hex'));
});

test('CSV rejects duplicate / missing headers and missing / extra columns instead of guessing', () => {
  for (const csv of ['ref, amount,amount\nA,1,USD', 'ref,,currency\nA,1,USD', 'ref,amount\nA,1', 'ref,amount,currency\nA,1', 'ref,amount,currency\nA,1,USD,extra']) assert.throws(() => parseCsv(csv));
});

test('CSV rejects malformed quotes, NUL, empty datasets and non-text input', () => {
  for (const csv of ['ref,amount,currency\n"A,1,USD', 'ref,amount,currency\n"A" x,1,USD', 'ref,amount,currency\nA"B,1,USD', 'ref,amount,currency\nA,1,US\0D', 'ref,amount,currency\n', '', null]) assert.throws(() => parseCsv(csv));
});

test('empty physical lines do not shift the preserved physical source coordinates', () => {
  const document = parseCsv('ref,amount,currency\n\nA,1,USD\n\nB,2,USD\n');
  assert.deepEqual(document.rows.map((row) => row.line), [3, 5]);
});

test('CSV enforces byte, row, column and field bounds', () => {
  assert.throws(() => parseCsv('界'.repeat(CSV_LIMITS.maxBytes / 3 + 1)), { code: 'CSV_TOO_LARGE' });
  assert.throws(() => parseCsv(`ref,amount,currency\n${'A,1,USD\n'.repeat(5001)}`), { code: 'TOO_MANY_ROWS' });
  assert.throws(() => parseCsv(`${Array.from({ length: 81 }, (_, index) => `c${index}`).join(',')}\n${'x,'.repeat(80)}x`), { code: 'TOO_MANY_COLUMNS' });
  assert.throws(() => parseCsv(`ref,amount,currency\n${'A'.repeat(65537)},1,USD`), { code: 'FIELD_TOO_LARGE' });
  assert.throws(() => parseCsv(`${'A'.repeat(121)},amount,currency\nA,1,USD`), { code: 'HEADER_TOO_LARGE' });
});

test('mapping must be an operator-supplied set of three distinct existing headers', () => {
  for (const mapping of [null, {}, { ...simple, amount: 'unknown' }, { ...simple, amount: 'ref' }]) assert.throws(() => validateMapping(mapping, ['ref', 'amount', 'currency']), { code: 'INVALID_MAPPING' });
  assert.deepEqual(validateMapping(simple, ['ref', 'amount', 'currency']), simple);
});

test('decimal arithmetic remains exact beyond Number safe integer and does not round', () => {
  assert.equal(parseMoney('999999999999999.99', 'USD').minor, 99999999999999999n);
  assert.equal(parseMoney('0.1', 'USD').formatted, '0.10');
  assert.equal(formatMinor(-1n, 2), '-0.01');
  const report = pair('A,999999999999999.99,USD', 'A,999999999999999.98,USD');
  assert.equal(report.findings[0].delta, '-0.01');
  assert.equal(report.findings[0].status, 'under');
  for (const value of ['12.345', '-1', '+1', '1,000', '1e3', 'NaN', '', '01', '$1.00']) assert.equal(parseMoney(value, 'USD').valid, false, value);
});

test('explicit currency scales include zero and three decimals; unknown currency never assumes two', () => {
  assert.equal(parseMoney('123', 'JPY').formatted, '123');
  assert.equal(parseMoney('123.00', 'JPY').valid, false);
  assert.equal(parseMoney('0.123', 'KWD').minor, 123n);
  assert.equal(parseMoney('1.0000', 'KWD').valid, false);
  assert.equal(parseMoney('1.00', 'XYZ').valid, false);
});

test('two receipt rows are preserved without summing even if they total the order amount', () => {
  const finding = pair('A,100.00,CNY', 'A,40.00,CNY\nA,60.00,CNY').findings[0];
  assert.equal(finding.status, 'duplicate'); assert.equal(finding.received, null); assert.equal(finding.delta, null);
  assert.deepEqual(finding.receipts.map((row) => row.amount), ['40.00', '60.00']);
});

test('missing key, missing amount and absent other-side rows remain distinct unknown states', () => {
  const report = pair(',1.00,USD\nA,,USD\nB,2.00,USD', 'A,1.00,USD\nC,3.00,USD');
  assert.equal(report.summary['missing-key'], 1); assert.equal(report.summary['invalid-amount'], 1); assert.equal(report.summary['one-side-missing'], 2);
  assert.equal(report.findings.find((finding) => finding.reference === 'B').received, null);
  assert.equal(report.findings.find((finding) => finding.reference === 'B').delta, null);
});

test('currency mismatch is not converted or subtracted; reference matching is exact and case sensitive', () => {
  assert.equal(pair('A,10.00,USD', 'A,10.00,CNY').findings[0].status, 'currency-mismatch');
  assert.equal(pair('A,10.00,USD', 'A,10.00,CNY').findings[0].delta, null);
  assert.equal(pair('A,10.00,USD', 'a,10.00,USD').summary['one-side-missing'], 2);
});

test('changed input changes document digest; equal content retains source digest and independent report identity', () => {
  const before = pair('A,1.00,USD', 'A,1.00,USD');
  const after = pair('A,1.00,USD', 'A,2.00,USD');
  assert.equal(before.documents.orders.sha256, after.documents.orders.sha256);
  assert.notEqual(before.documents.receipts.sha256, after.documents.receipts.sha256);
  assert.notEqual(before.id, after.id);
});

test('HTML export escapes file names, headers and source cells without executable markup', () => {
  const report = pair('<script>alert(1)</script>,1.00,USD', '<script>alert(1)</script>,2.00,USD');
  report.documents.orders.filename = '<img src=x onerror=alert(1)>.csv';
  const html = exportHtml(report);
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<img src=')); assert.ok(html.includes('&lt;script&gt;'));
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.ok(html.includes(report.documents.orders.sha256));
});

test('CSV export quotes and prefixes spreadsheet formula payloads including leading spaces and controls', () => {
  for (const text of ['=HYPERLINK("bad")', '+cmd', '-1+2', '@SUM(1)', '  =1', '\t=1', '\r=1']) assert.ok(csvCell(text).startsWith('"\''), text);
  assert.equal(csvCell('normal,"quote"'), '"normal,""quote"""');
  const csv = exportCsv(pair('=2+2,1.00,USD', '=2+2,2.00,USD'));
  assert.ok(csv.includes('"\'=2+2"')); assert.ok(csv.startsWith('\ufeff')); assert.ok(csv.includes('orders_sha256'));
});

test('report cache expires and evicts in bounded memory; it never retains raw uploaded CSV', () => {
  let clock = 100;
  const store = new ReportStore({ ttlMs: 10, maxReports: 1, maxBytes: 100000, now: () => clock });
  const first = pair('A,1.00,USD', 'A,1.00,USD'); store.put(first); assert.equal(store.get(first.id), first);
  const second = pair('B,1.00,USD', 'B,1.00,USD'); store.put(second);
  assert.throws(() => store.get(first.id), { code: 'REPORT_EXPIRED' });
  assert.ok(!Object.keys(store.entries.get(second.id)).includes('csv'));
  clock += 10; assert.throws(() => store.get(second.id), { code: 'REPORT_EXPIRED' }); assert.equal(store.bytes, 0);
  assert.throws(() => new ReportStore({ maxBytes: 10 }).put(first), { code: 'REPORT_TOO_LARGE' });
});
