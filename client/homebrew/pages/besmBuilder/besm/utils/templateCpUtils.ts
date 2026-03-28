import { ATTRIBUTES_LIBRARY } from '../data/attributesLibrary';
import { DEFECTS_LIBRARY } from '../data/defectsLibrary';

// Helper function to safely access attribute name
const getAttributeName = (attr: unknown): string => {
  if (!attr) return 'Unknown';
  const a = attr as { custom_name?: string; name?: string; attribute?: unknown };
  if (typeof a.custom_name === 'string') return a.custom_name;
  if (typeof a.name === 'string') return a.name;
  if (a.attribute && typeof a.attribute === 'object') {
    return getAttributeName(a.attribute);
  }
  return 'Unknown';
};

// Helper function to safely access defect name
const getDefectName = (defect: unknown): string => {
  if (!defect) return 'Unknown';
  const d = defect as { custom_name?: string; name?: string; defect?: unknown };
  if (typeof d.custom_name === 'string') return d.custom_name;
  if (typeof d.name === 'string') return d.name;
  if (d.defect && typeof d.defect === 'object') {
    return getDefectName(d.defect);
  }
  return 'Unknown';
};

// Resolve attribute cost from library (case-insensitive by key or name)
export const computeAttributeCpCost = (attr: unknown): number | null => {
  if (!attr) return null;
  const a = attr as {
    key?: string;
    attribute?: { key?: string; level?: number; baseLevel?: number; user_input?: { custom_cp_cost?: number } };
    level?: number;
    baseLevel?: number;
    points?: number;
    user_input?: { custom_cp_cost?: number };
  };
  const key = ((a.key ?? a.attribute?.key ?? '') as string).trim().toLowerCase();
  const name = getAttributeName(attr).trim().toLowerCase();
  let tpl = key
    ? ATTRIBUTES_LIBRARY.find(a => (a.key || '').toLowerCase() === key)
    : undefined;
  if (!tpl && name) {
    tpl = ATTRIBUTES_LIBRARY.find(a => (a.name || '').toLowerCase() === name);
  }
  // Use baseLevel for CP calculation (what you pay for), fall back to level if baseLevel not defined
  const baseLevel = (a.baseLevel ?? a.attribute?.baseLevel ?? a.level ?? a.attribute?.level ?? 0) as number;
  const perLevel = tpl?.cost_per_level ?? tpl?.baseCost;

  // Special handling: Unique Attribute has variable cost set per-character, not fixed in library
  const isUnique = (tpl?.key || tpl?.name || '').toLowerCase().includes('unique');
  if (isUnique) {
    const ui = a.user_input || a.attribute?.user_input || {};
    const per = typeof ui === 'object' && ui !== null && 'custom_cp_cost' in ui && typeof (ui as Record<string, unknown>).custom_cp_cost === 'number'
      ? (ui as Record<string, unknown>).custom_cp_cost as number
      : null;
    if (per != null && baseLevel > 0) return per * baseLevel;
    // No custom cost — use stored points directly (library cost_per_level is 0 for unique attrs)
    if (typeof a.points === 'number') return a.points;
    return null;
  }

  if (tpl && perLevel != null && baseLevel > 0) {
    return perLevel * baseLevel;
  }
  // Fallback to raw points if provided
  if (typeof a.points === 'number') return a.points;
  return null;
};

// Resolve defect refund from library (case-insensitive by key or name)
export const computeDefectCpRefund = (defect: unknown): number | null => {
  if (!defect) return null;
  const d = defect as {
    key?: string;
    defect?: { key?: string; rank?: number };
    rank?: number;
    cp_refund?: number;
  };
  const key = ((d.key ?? d.defect?.key ?? '') as string).trim().toLowerCase();
  const name = getDefectName(d).trim().toLowerCase();
  let tpl = key
    ? DEFECTS_LIBRARY.find(d => (d.key || '').toLowerCase() === key)
    : undefined;
  if (!tpl && name) {
    tpl = DEFECTS_LIBRARY.find(d => (d.name || '').toLowerCase() === name);
  }
  const rank = (d.rank ?? d.defect?.rank ?? 0) as number;
  // When library lookup succeeds: cp_refund is per-rank, multiply by rank.
  // When library lookup fails: stored cp_refund is already the total, use as-is.
  const perRank = tpl?.cp_refund ?? null;
  if (perRank != null && rank > 0) {
    return perRank * rank;
  }
  // Fallback: stored cp_refund is the total value when library lookup fails
  if (typeof d.cp_refund === 'number') return d.cp_refund;
  return null;
};

type TemplateLike = {
  totalPoints?: number;
  attributes?: unknown[];
  stats?: Array<{ points?: number; body_adj?: number | null; mind_adj?: number | null; soul_adj?: number | null; stat?: string; value?: number }>;
  defects?: unknown[];
};

// Compute template CP cost entirely from library lookups — never uses stored totalPoints.
// Falls back to stored attr.points / defect.cp_refund only when library lookup fails.
export const computeTemplateCp = (template: unknown): number | null => {
  if (!template) return null;
  const t = template as TemplateLike;
  let total = 0;

  if (Array.isArray(t.attributes)) {
    for (const a of t.attributes) {
      const cost = computeAttributeCpCost(a);
      const points = (a as { points?: number })?.points;
      total += typeof cost === 'number' ? cost : (typeof points === 'number' ? points : 0);
    }
  }

  if (Array.isArray(t.stats)) {
    for (const s of t.stats) {
      if (typeof s?.points === 'number') {
        total += s.points;
      } else if (s) {
        // Race-style stat: body/mind/soul adjustments each cost 2 CP
        const body = typeof s.body_adj === 'number' ? s.body_adj : 0;
        const mind = typeof s.mind_adj === 'number' ? s.mind_adj : 0;
        const soul = typeof s.soul_adj === 'number' ? s.soul_adj : 0;
        total += (body + mind + soul) * 2;
      }
    }
  }

  if (Array.isArray(t.defects)) {
    for (const d of t.defects) {
      const refund = computeDefectCpRefund(d);
      const cp_refund = (d as { cp_refund?: number })?.cp_refund;
      total -= typeof refund === 'number' ? refund : (typeof cp_refund === 'number' ? cp_refund : 0);
    }
  }

  return total;
};
