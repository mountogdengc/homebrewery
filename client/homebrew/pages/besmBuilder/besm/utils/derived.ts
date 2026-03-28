// Utility helpers for working with derived values in a consistent way.
// Use lowercase keys (hp, ep, acv, dcv, dm, sv, scv) across the app.
// In development, we warn if uppercase keys are present so they can be cleaned up.

export type DerivedMap = Record<string, number>;

function isDev(): boolean {
  // Vite style env; fallback to NODE_ENV
  const viteDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
  return Boolean(viteDev || process.env.NODE_ENV === 'development');
}

const UPPER_TO_LOWER: Record<string, string> = {
  HP: 'hp',
  EP: 'ep',
  ACV: 'acv',
  DCV: 'dcv',
  DM: 'dm',
  SV: 'sv',
  SCV: 'scv',
};

/**
 * Normalize a derived object to use lowercase keys. Uppercase keys are copied to lowercase
 * and a dev-only warning is emitted if uppercase keys were present.
 */
export function normalizeDerived(derived: DerivedMap | undefined): DerivedMap {
  if (!derived) return {};
  const out: DerivedMap = { ...derived };
  let warned = false;
  for (const [upper, lower] of Object.entries(UPPER_TO_LOWER)) {
    const hasUpper = Object.prototype.hasOwnProperty.call(out, upper);
    if (hasUpper) {
      // Copy to lowercase if not already present
      if (!Object.prototype.hasOwnProperty.call(out, lower)) {
        const val = (out as Record<string, number | undefined>)[upper];
        if (typeof val === 'number') {
          (out as Record<string, number>)[lower] = val;
        }
      }
      if (isDev() && !warned) {
        console.warn('[derived] Detected uppercase derived keys; please migrate to lowercase.', { found: upper });
        warned = true;
      }
    }
  }
  return out;
}

/**
 * Safe getter that prefers lowercase derived values and falls back to uppercase,
 * emitting a dev-only warning once if it had to read uppercase.
 */
export function getDerived(derived: DerivedMap | undefined, key: keyof typeof UPPER_TO_LOWER | string): number | undefined {
  if (!derived) return undefined;
  const lowerKey = String(key).toLowerCase();
  if (Object.prototype.hasOwnProperty.call(derived, lowerKey)) {
    return (derived as Record<string, number>)[lowerKey];
  }
  const upperKey = String(key).toUpperCase();
  if (Object.prototype.hasOwnProperty.call(derived, upperKey)) {
    if (isDev()) {
      console.warn(`[derived] Accessed uppercase key '${upperKey}'. Prefer lowercase '${lowerKey}'.`);
    }
    return (derived as Record<string, number>)[upperKey];
  }
  return undefined;
}
