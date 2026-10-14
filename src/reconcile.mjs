import { randomUUID } from 'node:crypto';
import { parseCsv, documentMetadata, validateMapping } from './csv.mjs';
import { CURRENCY_SCALES, parseMoney, formatMinor } from './money.mjs';
import { requireValue } from './errors.mjs';

export const STATUSES = Object.freeze(['same', 'under', 'over', 'one-side-missing', 'duplicate', 'missing-key', 'invalid-amount', 'currency-mismatch']);
export const REPORT_SCOPE = Object.freeze({
  policy: 'single-row-per-reference',
  currencyScales: CURRENCY_SCALES,
  limitations: [
    'One order row must correspond to one receipt row in the same reporting period and currency.',
    'Split payments, instalments, refunds, fees, net settlements and cross-period receipts require manual review.',
    'Duplicate references are not merged, amounts are not rounded and missing values are not replaced by zero.',
    'This is a review aid, not a verified accounting conclusion or evidence that payment was posted.',
  ],
});

function inputDocument(input, role) {
  requireValue(input && typeof input === 'object', 'INVALID_INPUT', `A ${role} CSV and confirmed mapping are required.`);
  const document = parseCsv(input.csv, input.filename);
  document.mapping = validateMapping(input.mapping, document.headers);
  return document;
}

function evidence(row, document) {
  const mapping = document.mapping;
  return {
    line: row.line, endLine: row.endLine, values: row.values,
    reference: row.values[mapping.reference].trim(), amount: row.values[mapping.amount].trim(),
    currency: row.values[mapping.currency].trim().toUpperCase(),
    documentSha256: document.sha256, filename: document.filename,
  };
}

export function reconcile(input) {
  requireValue(input && typeof input === 'object', 'INVALID_INPUT', 'Two CSV documents and confirmed mappings are required.');
  const orders = inputDocument(input.orders, 'orders');
  const receipts = inputDocument(input.receipts, 'receipts');
  const groups = new Map();
  const findings = [];
  let evidenceBytes = 0;
  for (const [role, document] of Object.entries({ orders, receipts })) {
    for (const raw of document.rows) {
      const row = evidence(raw, document);
      evidenceBytes += Buffer.byteLength(JSON.stringify(row));
      requireValue(evidenceBytes <= 24 * 1024 * 1024, 'REPORT_TOO_LARGE', 'Source evidence exceeds this bounded local report session; use fewer columns or rows.', 413);
      if (!row.reference) {
        findings.push({ id: '', status: 'missing-key', reference: '', expected: null, received: null, delta: null, currency: row.currency || null,
          calculation: null, orders: role === 'orders' ? [row] : [], receipts: role === 'receipts' ? [row] : [], issues: ['Missing reference; this row was not guessed or matched.'] });
        continue;
      }
      if (!groups.has(row.reference)) groups.set(row.reference, { orders: [], receipts: [] });
      groups.get(row.reference)[role].push(row);
    }
  }
  for (const [reference, rows] of groups) {
    const finding = { id: '', status: 'same', reference, expected: null, received: null, delta: null, currency: null, calculation: null, ...rows, issues: [] };
    const allRows = [...rows.orders, ...rows.receipts];
    const currencies = new Set(allRows.map((row) => row.currency));
    const currencyValid = currencies.size === 1 && CURRENCY_SCALES[allRows[0].currency] !== undefined;
    if (currencyValid) finding.currency = allRows[0].currency;
    if (rows.orders.length > 1 || rows.receipts.length > 1) {
      finding.status = 'duplicate';
      finding.issues.push('Repeated reference or split-payment candidate; no rows were added together or arbitrarily selected.');
      if (!currencyValid) finding.issues.push('Missing, unsupported or inconsistent currency is also present.');
    } else if (!currencyValid) {
      finding.status = 'currency-mismatch';
      finding.issues.push('Missing, unsupported or inconsistent currency; no conversion or amount comparison was performed.');
    } else {
      const expected = rows.orders[0] ? parseMoney(rows.orders[0].amount, finding.currency) : null;
      const received = rows.receipts[0] ? parseMoney(rows.receipts[0].amount, finding.currency) : null;
      finding.expected = expected?.valid ? expected.formatted : null;
      finding.received = received?.valid ? received.formatted : null;
      if (expected && !expected.valid || received && !received.valid) {
        finding.status = 'invalid-amount';
        if (expected && !expected.valid) finding.issues.push(`Order amount: ${expected.issue}`);
        if (received && !received.valid) finding.issues.push(`Receipt amount: ${received.issue}`);
      } else if (!expected || !received) {
        finding.status = 'one-side-missing';
        finding.issues.push(!expected ? 'Receipt has no corresponding order in the supplied file; no order was invented.' : 'Order has no corresponding receipt in the supplied file; missing amount was not replaced by zero.');
      } else {
        const delta = received.minor - expected.minor;
        finding.delta = formatMinor(delta, CURRENCY_SCALES[finding.currency]);
        finding.calculation = `${finding.received} - ${finding.expected} = ${finding.delta} ${finding.currency}`;
        finding.status = delta < 0n ? 'under' : delta > 0n ? 'over' : 'same';
        if (delta !== 0n) finding.issues.push('Amount difference under the confirmed gross one-row matching policy; check reporting period and settlement terms before concluding a discrepancy.');
      }
    }
    findings.push(finding);
  }
  findings.forEach((finding, index) => { finding.id = `finding-${String(index + 1).padStart(4, '0')}`; });
  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const finding of findings) byStatus[finding.status] += 1;
  const datasetCurrencies = [...new Set([...orders.rows.map((row) => row.values[orders.mapping.currency].trim().toUpperCase()), ...receipts.rows.map((row) => row.values[receipts.mapping.currency].trim().toUpperCase())])].filter(Boolean);
  return {
    id: randomUUID(), createdAt: new Date().toISOString(),
    documents: { orders: { ...documentMetadata(orders), mapping: orders.mapping }, receipts: { ...documentMetadata(receipts), mapping: receipts.mapping } },
    findings,
    summary: { total: findings.length, ...byStatus, needsReview: findings.length - byStatus.same, byStatus, sourceRows: { orders: orders.rowCount, receipts: receipts.rowCount }, currencies: datasetCurrencies, totals: null },
    scope: { ...REPORT_SCOPE, mixedCurrencyWarning: datasetCurrencies.length > 1 ? 'Multiple currencies appear in these files. Each single-row pair is compared only in its own identical currency; no whole-file total or conversion is available.' : null },
  };
}
