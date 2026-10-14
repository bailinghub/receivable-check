export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

export function csvCell(value) {
  let text = String(value ?? '');
  // Quoting alone does not stop spreadsheet formula interpretation; prefix risky cells with an apostrophe.
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportCsv(report) {
  const headers = ['finding_id', 'status', 'reference', 'expected', 'received', 'delta', 'currency', 'order_lines', 'receipt_lines', 'orders_file', 'orders_sha256', 'receipts_file', 'receipts_sha256', 'calculation', 'issues'];
  const lines = [headers.map(csvCell).join(',')];
  for (const finding of report.findings) {
    lines.push([finding.id, finding.status, finding.reference, finding.expected, finding.received, finding.delta, finding.currency,
      finding.orders.map((row) => row.line).join(';'), finding.receipts.map((row) => row.line).join(';'),
      report.documents.orders.filename, report.documents.orders.sha256, report.documents.receipts.filename, report.documents.receipts.sha256,
      finding.calculation, finding.issues.join(' | ')].map(csvCell).join(','));
  }
  return `\ufeff${lines.join('\r\n')}\r\n`;
}

export function exportHtml(report) {
  const e = escapeHtml;
  const document = (role) => {
    const item = report.documents[role];
    return `<li><strong>${e(role)}</strong>: ${e(item.filename)} (${item.rowCount} data rows)<br><code>${e(item.sha256)}</code><br>Confirmed mapping: ${e(JSON.stringify(item.mapping))}</li>`;
  };
  const evidence = (rows) => rows.map((row) => `<details><summary>${e(row.filename)} — physical line ${row.line}${row.endLine !== row.line ? `–${row.endLine}` : ''}</summary><pre>${e(JSON.stringify(row.values, null, 2))}</pre><code>${e(row.documentSha256)}</code></details>`).join('');
  const findings = report.findings.map((finding) => `<tr><td>${e(finding.id)}</td><td>${e(finding.status)}</td><td>${e(finding.reference)}</td><td>${e(finding.expected ?? 'not confirmed')}</td><td>${e(finding.received ?? 'not confirmed')}</td><td>${e(finding.delta ?? 'not calculated')}</td><td>${e(finding.currency)}</td><td>${e(finding.calculation)}<br>${e(finding.issues.join(' '))}${evidence(finding.orders)}${evidence(finding.receipts)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Receivable Check report ${e(report.id)}</title><style>body{font:15px system-ui;margin:2rem;color:#152b35}h1{font-size:1.6rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cdd8de;padding:.6rem;text-align:left;vertical-align:top}code,pre{overflow-wrap:anywhere;white-space:pre-wrap}li{margin:.6rem 0}summary{cursor:pointer}</style></head><body><h1>Receivable Check — review report</h1><p>Generated ${e(report.createdAt)}. Report ${e(report.id)}. Deterministic arithmetic; AI text is not an accounting conclusion.</p><h2>Source documents</h2><ul>${document('orders')}${document('receipts')}</ul><h2>Scope</h2><ul>${report.scope.limitations.map((limitation) => `<li>${e(limitation)}</li>`).join('')}</ul>${report.scope.mixedCurrencyWarning ? `<p>${e(report.scope.mixedCurrencyWarning)}</p>` : ''}<h2>Findings</h2><p>${report.summary.total} reference groups / unkeyed rows; ${report.summary.same} equal-amount pairs; ${report.summary.needsReview} need review. No cross-currency or whole-file total is computed.</p><table><thead><tr><th>ID</th><th>Status</th><th>Reference</th><th>Expected</th><th>Received</th><th>Delta</th><th>Currency</th><th>Evidence</th></tr></thead><tbody>${findings}</tbody></table></body></html>`;
}
