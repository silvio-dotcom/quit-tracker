/**
 * datetime-local inputs use local calendar fields; stored quit dates are UTC ISO strings.
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

/** ISO instant (or Date) → `YYYY-MM-DDTHH:mm` in the user's local timezone. */
export function toDatetimeLocalValue(isoOrDate) {
  if (!isoOrDate) return '';
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Current local time formatted for datetime-local inputs. */
export function datetimeLocalNow() {
  return toDatetimeLocalValue(new Date());
}

/**
 * Parse a datetime-local value as local time and return a stored quit date.
 * @returns {{ ok: true, iso: string } | { ok: false, error: string }}
 */
export function quitDateFromDatetimeLocal(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return { ok: false, error: 'Quit date is required.' };
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return { ok: false, error: 'Invalid quit date.' };
  if (t > Date.now()) {
    return { ok: false, error: 'Quit date cannot be in the future. Choose a time you already quit.' };
  }
  return { ok: true, iso: new Date(t).toISOString() };
}
