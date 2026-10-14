import { AppError } from './errors.mjs';

// Only reports are kept in memory. There is no upload directory or raw CSV persistence.
export class ReportStore {
  constructor({ ttlMs = 20 * 60 * 1000, maxReports = 12, maxBytes = 32 * 1024 * 1024, now = Date.now } = {}) {
    this.ttlMs = ttlMs; this.maxReports = maxReports; this.maxBytes = maxBytes; this.now = now;
    this.entries = new Map(); this.bytes = 0;
  }
  delete(id) {
    const entry = this.entries.get(id);
    if (entry) { clearTimeout(entry.timer); this.bytes -= entry.bytes; this.entries.delete(id); }
  }
  purge() {
    for (const [id, entry] of this.entries) if (this.now() >= entry.expiresAt) this.delete(id);
  }
  put(report) {
    this.purge();
    const bytes = Buffer.byteLength(JSON.stringify(report));
    if (bytes > this.maxBytes) throw new AppError('REPORT_TOO_LARGE', 'Report exceeds this local session memory limit; use a smaller CSV.', 413);
    this.delete(report.id);
    while (this.entries.size >= this.maxReports || this.bytes + bytes > this.maxBytes) this.delete(this.entries.keys().next().value);
    const timer = setTimeout(() => this.delete(report.id), this.ttlMs);
    timer.unref();
    this.entries.set(report.id, { report, bytes, expiresAt: this.now() + this.ttlMs, timer });
    this.bytes += bytes;
    return report;
  }
  get(id) {
    this.purge();
    const entry = this.entries.get(id);
    if (!entry) throw new AppError('REPORT_EXPIRED', 'This in-memory report expired or the server restarted. Re-upload and confirm the mappings to generate a new report.', 404);
    return entry.report;
  }
  dispose() {
    for (const id of this.entries.keys()) this.delete(id);
  }
}
