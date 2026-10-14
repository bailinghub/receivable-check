import { createHash } from 'node:crypto';
import { AppError, requireValue } from './errors.mjs';

export const CSV_LIMITS = Object.freeze({ maxBytes: 2 * 1024 * 1024, maxRows: 5000, maxColumns: 80, maxHeaderCharacters: 120, maxFieldCharacters: 65536 });

export function safeFilename(value) {
  if (typeof value !== 'string') return 'input.csv';
  return value.split(/[\\/]/).at(-1).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200) || 'input.csv';
}

// A source line means the physical starting line of a CSV record, including quoted newlines.
export function parseCsv(input, filename = 'input.csv') {
  requireValue(typeof input === 'string', 'INVALID_CSV', 'CSV content must be a UTF-8 string.');
  requireValue(Buffer.byteLength(input, 'utf8') <= CSV_LIMITS.maxBytes, 'CSV_TOO_LARGE', 'Each CSV is limited to 2 MiB.', 413);
  requireValue(!input.includes('\0'), 'INVALID_CSV', 'CSV content cannot contain NUL characters.');
  const sha256 = createHash('sha256').update(input, 'utf8').digest('hex');
  const text = input.startsWith('\ufeff') ? input.slice(1) : input;
  const records = [];
  let fields = [], field = '', quoted = false, afterQuote = false, line = 1, startLine = 1, recordStarted = false;
  function append(character) {
    field += character;
    requireValue(field.length <= CSV_LIMITS.maxFieldCharacters, 'FIELD_TOO_LARGE', 'A CSV field is limited to 65,536 characters.', 413);
  }
  function finishField() {
    fields.push(field);
    requireValue(fields.length <= CSV_LIMITS.maxColumns, 'TOO_MANY_COLUMNS', 'Each CSV is limited to 80 columns.', 413);
    field = ''; afterQuote = false;
  }
  function finishRecord(endLine) {
    finishField();
    // Empty physical lines are ignored; quoted empty records and delimited blanks are retained.
    if (recordStarted || fields.length > 1 || fields[0] !== '') records.push({ line: startLine, endLine, fields });
    requireValue(records.length <= CSV_LIMITS.maxRows + 1, 'TOO_MANY_ROWS', 'Each CSV is limited to 5,000 data rows.', 413);
    fields = []; recordStarted = false;
  }
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') { append('"'); index += 1; }
        else { quoted = false; afterQuote = true; }
      } else if (character === '\r' || character === '\n') {
        if (character === '\r' && text[index + 1] === '\n') index += 1;
        append('\n'); line += 1;
      } else append(character);
      continue;
    }
    if (afterQuote && character !== ',' && character !== '\r' && character !== '\n') {
      throw new AppError('INVALID_CSV', `Unexpected character after a quoted field on line ${line}.`);
    }
    if (character === '"') {
      requireValue(field === '' && !afterQuote, 'INVALID_CSV', `Unexpected quote in an unquoted field on line ${line}.`);
      quoted = true; recordStarted = true;
    } else if (character === ',') {
      finishField(); recordStarted = true;
    } else if (character === '\r' || character === '\n') {
      finishRecord(line);
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      line += 1; startLine = line;
    } else { append(character); recordStarted = true; }
  }
  requireValue(!quoted, 'INVALID_CSV', `Unclosed quoted field starting on line ${startLine}.`);
  if (recordStarted || fields.length || field || afterQuote) finishRecord(line);
  requireValue(records.length > 0, 'INVALID_CSV', 'A CSV header is required.');
  const headers = records[0].fields.map((header) => header.trim());
  requireValue(headers.every(Boolean), 'EMPTY_HEADER', 'All CSV columns must have non-empty names.');
  requireValue(headers.every((header) => header.length <= CSV_LIMITS.maxHeaderCharacters), 'HEADER_TOO_LARGE', 'CSV column names are limited to 120 characters.', 413);
  requireValue(headers.length >= 3, 'MISSING_COLUMNS', 'Reference, amount and currency require at least three distinct columns.');
  requireValue(new Set(headers).size === headers.length, 'DUPLICATE_HEADER', 'CSV column names must be unique after trimming.');
  const rows = records.slice(1).map((record) => {
    requireValue(record.fields.length === headers.length, 'COLUMN_COUNT', `Line ${record.line} has ${record.fields.length} fields; expected ${headers.length}.`);
    const values = Object.fromEntries(headers.map((header, index) => [header, record.fields[index]]));
    return { line: record.line, endLine: record.endLine, values };
  });
  requireValue(rows.length > 0, 'NO_DATA', 'At least one data row is required.');
  return { sha256, filename: safeFilename(filename), headers, rowCount: rows.length, rows };
}

export function documentMetadata(document) {
  const { sha256, filename, headers, rowCount } = document;
  return { sha256, filename, headers, rowCount };
}

export function validateMapping(mapping, headers) {
  requireValue(mapping && typeof mapping === 'object' && !Array.isArray(mapping), 'INVALID_MAPPING', 'Confirm all three column mappings before reconciling.');
  const keys = ['reference', 'amount', 'currency'];
  requireValue(keys.every((key) => typeof mapping[key] === 'string' && headers.includes(mapping[key])), 'INVALID_MAPPING', 'Every mapping must name an existing CSV column.');
  requireValue(new Set(keys.map((key) => mapping[key])).size === keys.length, 'INVALID_MAPPING', 'Reference, amount and currency must map to different columns.');
  return Object.fromEntries(keys.map((key) => [key, mapping[key]]));
}
