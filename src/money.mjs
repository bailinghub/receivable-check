// An explicit supported set avoids silently treating unknown currencies as two-decimal currencies.
export const CURRENCY_SCALES = Object.freeze({ USD: 2, CNY: 2, EUR: 2, GBP: 2, CAD: 2, AUD: 2, NZD: 2, SGD: 2, HKD: 2, CHF: 2, INR: 2, BRL: 2, MXN: 2, ZAR: 2, JPY: 0, KRW: 0, KWD: 3, BHD: 3, OMR: 3 });

export function parseMoney(value, currency) {
  const scale = CURRENCY_SCALES[currency];
  if (scale === undefined) return { valid: false, issue: 'Missing or unsupported currency.' };
  const amount = typeof value === 'string' ? value.trim() : '';
  // No grouping, exponent, sign, currency symbol or implicit rounding; this MVP uses non-negative gross amounts.
  if (!/^(?:0|[1-9][0-9]{0,14})(?:\.[0-9]+)?$/.test(amount)) return { valid: false, issue: 'Use a non-negative decimal amount without grouping, exponent or currency symbols.' };
  const [whole, fraction = ''] = amount.split('.');
  if (fraction.length > scale) return { valid: false, issue: `Amount has more than ${scale} decimal places for ${currency}; it was not rounded.` };
  const minor = BigInt(whole) * (10n ** BigInt(scale)) + BigInt(fraction.padEnd(scale, '0') || '0');
  return { valid: true, minor, formatted: formatMinor(minor, scale) };
}

export function formatMinor(minor, scale) {
  const negative = minor < 0n;
  const digits = (negative ? -minor : minor).toString().padStart(scale + 1, '0');
  const body = scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits;
  return negative ? `-${body}` : body;
}
