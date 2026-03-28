// Shared helpers for formatting and filtering source references across Attributes, Defects, etc.
// Place in src/components/common/sourceRefs.ts

export type WithSources = {
  source?: string;
  sourcesRefs?: Array<{ abbr: string; page: number }>;
  description?: string;
};

// Format structured refs as: "Source(s): BESM4e p. 161; Naked p. 78"
export function formatRefs(item?: WithSources | null): string {
  if (!item || !Array.isArray(item.sourcesRefs) || item.sourcesRefs.length === 0) return '';
  const list = item.sourcesRefs.map(r => `${r.abbr} p. ${r.page}`).join('; ');
  return `Source(s): ${list}`;
}

// Remove any legacy trailing "Source: ..." fragments from description
export function cleanDescription(item?: WithSources | null): string {
  const desc = String(item?.description || '');
  return desc.replace(/\s*Source:\s*[^.]+\.?/i, '').trim();
}

// Compute unique available source values from both legacy primary source and structured refs abbreviations
export function computeAvailableSources(collection: Array<WithSources | null | undefined>): string[] {
  const set = new Set<string>();
  (collection || []).forEach(d => {
    if (d?.source) set.add(String(d.source));
    const refs = d?.sourcesRefs as { abbr: string; page: number }[] | undefined;
    if (refs && Array.isArray(refs)) refs.forEach(r => r?.abbr && set.add(String(r.abbr)));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// Check if an item matches a given source filter ('all' matches everything)
export function matchesSource(item: WithSources | null | undefined, filter: string): boolean {
  if (!filter || filter === 'all') return true;
  if (item?.source === filter) return true;
  const refs = item?.sourcesRefs as { abbr: string; page: number }[] | undefined;
  return !!(refs && refs.some(r => r.abbr === filter));
}
