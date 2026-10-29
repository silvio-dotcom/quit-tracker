/** Default UI locale — Latin American Spanish (neutral, tú). */
export const APP_LOCALE = 'es-419';

export function formatLocaleNumber(n, options) {
  return Number(n).toLocaleString(APP_LOCALE, options);
}

export function formatLocaleDate(isoOrDate, options) {
  try {
    const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
    return d.toLocaleDateString(APP_LOCALE, options);
  } catch {
    return '';
  }
}
