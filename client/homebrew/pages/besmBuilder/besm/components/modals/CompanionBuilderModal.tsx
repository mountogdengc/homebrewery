import React, { useEffect, useMemo, useRef, useState } from 'react';
import { exportLibraryFile, parseLibraryFile } from '../../utils/userLibrary';
import { EntityBuilderModal } from '../common/EntityBuilderModal';
import { EditorFooterActions } from '../common/EditorFooterActions';
import { ATTRIBUTES_LIBRARY, calculateAttributeCost, getAttributeByKey } from '../../data/attributesLibrary';
import type { AttributeTemplate } from '../../data/attributesLibrary';
import { DEFECTS_LIBRARY, calculateDefectBonus, getDefectByKey } from '../../data/defectsLibrary';
import type { DefectTemplate } from '../../data/defectsLibrary';
import { EnhancementsModal } from './EnhancementsModal';
import LimitersModal from './LimitersModal';
import type { AttributeEnhancement, AttributeLimiter } from '../../types/besm-character';
import { getEnhancementByKey } from '../../data/enhancementsLibrary';
import { getLimiterByKey } from '../../data/limitersLibrary';
import { v4 as uuidv4 } from 'uuid';

// Lightweight types scoped to this component to avoid ripple edits for the first scaffold
export type CompanionStats = {
  body: number;
  mind: number;
  soul: number;
};

// Helper: restrict unknown level to allowed companion levels
const allowedLevels = [1, 2, 3, 4, 5, 6] as const;
type CompanionLevel = typeof allowedLevels[number];
function toCompanionLevel(v: unknown, fallback: CompanionLevel = 4): CompanionLevel {
  const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
  const found = allowedLevels.find(l => l === n);
  return found ?? fallback;
}

// Safe readers for optional template metadata occasionally present in data
type OptionalAttrMeta = { max_level?: number; description?: string; stat_mods?: { derived?: Record<string, number> } };
type OptionalDefectMeta = { description?: string };

export type CompanionConfig = {
  name: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  stats: CompanionStats;
  description?: string;
  spentCP?: number;
  attributes?: { key: string; level: number; notes?: string; enhancements?: { key: string; notes?: string }[]; limiters?: { key: string; assignments?: number; notes?: string }[] }[];
  defects?: { key: string; rank: number; notes?: string }[];
  derived?: Record<string, number>;
};

interface CompanionBuilderModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<CompanionConfig>;
  onSave: (config: CompanionConfig) => void;
  defaultLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

// Tab identifiers
type TabKey = 'stats' | 'attributes' | 'defects' | 'description';

// Helper: clamp to integer >= 0
const clampNonNegativeInt = (n: number) => Math.max(0, Math.trunc(Number.isFinite(n as number) ? n as number : 0));

const tabOrder: { key: TabKey; label: string }[] = [
  { key: 'stats', label: 'Stats' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'defects', label: 'Defects' },
  { key: 'description', label: 'Description' },
];

const labelStyle: React.CSSProperties = { fontWeight: 700, color: 'var(--besm-purple)', marginBottom: 6 };


const textInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '2px solid var(--besm-purple)',
  borderRadius: 8,
  background: 'white',
  color: 'var(--besm-dark-text)'
};

const buttonBase: React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 800,
  letterSpacing: 0.5,
};

const primaryButton: React.CSSProperties = {
  ...buttonBase,
  background: 'var(--besm-pink)',
  color: 'white',
};

const secondaryButton: React.CSSProperties = {
  ...buttonBase,
  background: 'var(--besm-light-gray)',
  color: 'var(--besm-dark-text)'
};

// Circular stepper styles for stats (- value +)
const circleBase: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  border: 'none',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  userSelect: 'none',
};
const circlePink: React.CSSProperties = {
  ...circleBase,
  background: 'var(--besm-pink)',
  color: '#fff',
  cursor: 'pointer',
};
const circlePinkLight: React.CSSProperties = {
  ...circleBase,
  background: 'var(--besm-light-pink-bg, #ffd1e6)',
  color: 'var(--besm-pink)',
  cursor: 'pointer',
};
const circleBlue: React.CSSProperties = {
  ...circleBase,
  background: 'var(--besm-blue, #0b74ff)',
  color: '#fff',
};

// Shared panel for tab content to normalize height across tabs
const contentPanelStyle: React.CSSProperties = {
  border: '2px solid var(--besm-purple)',
  borderRadius: 8,
  padding: 16,
  background: 'var(--besm-light-bg)',
  height: 460,          // fixed tab height to prevent growth
  overflowY: 'auto',    // scroll if content overflows
};

export const CompanionBuilderModal: React.FC<CompanionBuilderModalProps> = ({ open, onClose, initial, onSave, defaultLevel }) => {
  // Name and Level (level is read-only here; managed by the owning attribute)
  const [name, setName] = useState<string>(initial?.name ?? 'Companion (4 CP)');
  const level: 1 | 2 | 3 | 4 | 5 | 6 = toCompanionLevel(initial?.level ?? defaultLevel ?? 4);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('stats');
  const [focusedTab, setFocusedTab] = useState<TabKey | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ stats: null, attributes: null, defects: null, description: null });

  // Dirty tracking to prevent accidental loss of data
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const markDirty = () => setIsDirty(true);
  // In-app confirm dialog for cancel/close
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState<CompanionStats>({
    body: clampNonNegativeInt(initial?.stats?.body ?? 0),
    mind: clampNonNegativeInt(initial?.stats?.mind ?? 0),
    soul: clampNonNegativeInt(initial?.stats?.soul ?? 0),
  });

  // Description and basic identity/meta fields
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [identity, setIdentity] = useState<string>('');
  const [homeworld, setHomeworld] = useState<string>('');
  const [race, setRace] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [heightTxt, setHeightTxt] = useState<string>('');
  const [weightTxt, setWeightTxt] = useState<string>('');

  // Budget: Companion gives 10 CP per attribute level (BESM rule)
  const budgetCP = (Number(level) || 0) * 10;

  // Selected attributes for the companion (simple: template + level)
  type SelAttr = { id: string; template: AttributeTemplate; level: number; notes?: string; enhancements?: AttributeEnhancement[]; limiters?: AttributeLimiter[] };
  const [selectedAttrs, setSelectedAttrs] = useState<SelAttr[]>([]);
  type SelDefect = { id: string; template: DefectTemplate; rank: number; notes?: string };
  const [selectedDefects, setSelectedDefects] = useState<SelDefect[]>([]);

  // Info popover now handled by base modal via context

  // Handle guarded close to prevent data loss
  const handleRequestClose = () => {
    if (isDirty) { setConfirmOpen(true); return; }
    onClose();
  };

  // Tiered stat cost per BESM rule used elsewhere: 2/pt to 12, then 4/pt after
  const statCostTotal = (value: number) => {
    if (value <= 0) return 0;
    return value <= 12 ? value * 2 : 24 + (value - 12) * 4;
  };
  const statsCost = useMemo(() => (
    statCostTotal(stats.body) +
    statCostTotal(stats.mind) +
    statCostTotal(stats.soul)
  ), [stats]);

  // Compute CP spent from selected attributes (Enhancements/Limiters to be added later, do not affect cost per rules)
  const attrsCost = useMemo(() => selectedAttrs.reduce((sum, a) => sum + calculateAttributeCost(a.template, a.level), 0), [selectedAttrs]);
  const defectsRefund = useMemo(() => selectedDefects.reduce((sum, d) => sum + calculateDefectBonus(d.template, d.rank), 0), [selectedDefects]);
  const computedSpentCP = Math.max(0, statsCost + attrsCost - defectsRefund);
  const remainingCP = Math.max(0, budgetCP - computedSpentCP);
  const overBudgetBy = Math.max(0, computedSpentCP - budgetCP);
  const overBudget = overBudgetBy > 0;

  // Aggregate derived bonuses from selected attributes that declare stat_mods.derived
  const derivedBonuses = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of selectedAttrs) {
      const mods = (a.template as unknown as OptionalAttrMeta).stat_mods;
      const d = mods?.derived;
      if (!d) continue;
      for (const key of Object.keys(d)) {
        const perLevel = Number(d[key]) || 0;
        out[key] = (out[key] || 0) + perLevel * (a.level || 1);
      }
    }
    return out;
  }, [selectedAttrs]);

  // Compute derived values from stats + derivedBonuses where applicable
  const derivedPreview = useMemo(() => {
    const body = stats.body || 0;
    const mind = stats.mind || 0;
    const soul = stats.soul || 0;
    const cvBase = Math.floor((body + mind + soul) / 3);
    const hpBase = (body + soul) * 5;
    const epBase = (mind + soul) * 5;
    const svBase = body * 2;
    const dmBase = 5;
    const spBase = mind + soul;
    const sopBase = mind * 10;
    const scvBase = Math.floor((mind + soul) / 2);

    const hp = hpBase + (derivedBonuses['HP'] || 0) + (derivedBonuses['Health Points'] || 0);
    const ep = epBase + (derivedBonuses['EP'] || 0) + (derivedBonuses['Energy Points'] || 0);
    const acv = cvBase + (derivedBonuses['ACV'] || 0) + (derivedBonuses['Attack Combat Value'] || 0);
    const dcv = cvBase + (derivedBonuses['DCV'] || 0) + (derivedBonuses['Defense Combat Value'] || 0);
    const sv = svBase + (derivedBonuses['SV'] || 0) + (derivedBonuses['Shock Value'] || 0);
    const dm = dmBase + (derivedBonuses['DM'] || 0) + (derivedBonuses['Damage Multiplier'] || 0);
    const sp = spBase + (derivedBonuses['SaP'] || derivedBonuses['SP'] || 0);
    const sop = sopBase + (derivedBonuses['SoP'] || 0);
    const scv = scvBase + (derivedBonuses['SCV'] || 0);
    const armorRating = (derivedBonuses['Armour Rating'] || derivedBonuses['Armor Rating'] || 0);

    // Capture any other unmapped derived bonuses for display
    const mappedKeys = new Set(['HP','Health Points','EP','Energy Points','ACV','Attack Combat Value','DCV','Defense Combat Value','SV','Shock Value','DM','Damage Multiplier','SaP','SP','SoP','SCV','Armour Rating','Armor Rating']);
    const other: Record<string, number> = {};
    for (const [k, v] of Object.entries(derivedBonuses)) {
      if (!mappedKeys.has(k)) other[k] = v;
    }

    // Movement calculations (base formulas, body-scaled)
    // Apply a simple "Fast" special movement multiplier if present in selected attributes
    const fastMultiplier = (() => {
      try {
        return (selectedAttrs || []).reduce((mult, a) => {
          const key = a.template?.key || a.template?.name?.toLowerCase();
          const name = a.template?.name?.toLowerCase() || '';
          const notes = (a.notes || '').toLowerCase();
          if (key === 'special_movement' || name.includes('special movement')) {
            if (name.includes('fast') || notes.includes('fast')) return mult * 2;
          }
          return mult;
        }, 1);
      } catch { return 1; }
    })();

    const calcSpeed = (base: number) => (body * base) * fastMultiplier; // meters per round
    const movement = {
      walk: calcSpeed(1),
      jog: calcSpeed(1.5),
      run: calcSpeed(2),
      sprint: calcSpeed(4),
      swim: calcSpeed(0.5),
      crawl: calcSpeed(0.25),
      standingHighJump: body * 0.125,
      standingLongJump: body * 0.25,
      runningLongJump: body * 1,
    };

    return { body, mind, soul, hp, ep, acv, dcv, sv, dm, sp, sop, scv, armorRating, movement, other };
  }, [stats, derivedBonuses, selectedAttrs]);

  // Reset state on open and preload initial selections
  useEffect(() => {
    if (!open) return;
    setActiveTab('stats');
    // Preload attributes/defects if provided in initial
    if (initial?.attributes && Array.isArray(initial.attributes)) {
      const mapped = initial.attributes
        .map(a => {
          const tpl = a.key ? getAttributeByKey(a.key) : undefined;
          if (!tpl) return null;
          const enhancements: AttributeEnhancement[] = (a.enhancements || [])
            .map(e => {
              const et = e.key ? getEnhancementByKey(e.key) : undefined;
              if (!et) return null;
              return { id: uuidv4(), template: et, notes: e.notes || '' } as AttributeEnhancement;
            })
            .filter(Boolean) as AttributeEnhancement[];
          const limiters: AttributeLimiter[] = (a.limiters || [])
            .map(l => {
              const lt = l.key ? getLimiterByKey(l.key) : undefined;
              if (!lt) return null;
              return { id: uuidv4(), template: lt, assignments: l.assignments, notes: l.notes || '' } as AttributeLimiter;
            })
            .filter(Boolean) as AttributeLimiter[];
          return {
            id: `${tpl.key}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
            template: tpl,
            level: Math.max(1, Math.trunc(a.level || 1)),
            notes: a.notes,
            enhancements,
            limiters,
          } as SelAttr;
        })
        .filter(Boolean) as SelAttr[];
      setSelectedAttrs(mapped);
    } else {
      setSelectedAttrs([]);
    }
    if (initial?.defects && Array.isArray(initial.defects)) {
      const mappedD = initial.defects
        .map(d => {
          const tpl = d.key ? getDefectByKey(d.key) : undefined;
          if (!tpl) return null;
          const rank = Math.min(Math.max(1, Math.trunc(d.rank || 1)), tpl.max_rank);
          return { id: `${tpl.key}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, template: tpl, rank, notes: d.notes } as SelDefect;
        })
        .filter(Boolean) as SelDefect[];
      setSelectedDefects(mappedD);
    } else {
      setSelectedDefects([]);
    }
  }, [open, initial]);

  // Level is supplied by the owning attribute; editing is disabled in this modal

  const MAX_STAT = 20;
  // Attribute selection helpers
  const [attrSearch, setAttrSearch] = useState('');
  const filteredAttrLib = useMemo(() => {
    const q = attrSearch.trim().toLowerCase();
    if (!q) return ATTRIBUTES_LIBRARY;
    return ATTRIBUTES_LIBRARY.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }, [attrSearch]);
  const addAttr = (tpl: AttributeTemplate) => {
    // Avoid duplicates by key; if exists, focus list
    const exists = selectedAttrs.some(sa => sa.template.key === tpl.key);
    if (exists) return;
    setSelectedAttrs(prev => [...prev, { id: `${tpl.key}-${Date.now()}`, template: tpl, level: 1, enhancements: [], limiters: [] }]);
    markDirty();
  };
  const removeAttr = (id: string) => { setSelectedAttrs(prev => prev.filter(a => a.id !== id)); markDirty(); };

  // Enhancement / Limiter modals integration
  const [enhModalOpen, setEnhModalOpen] = useState(false);
  const [limModalOpen, setLimModalOpen] = useState(false);
  const [activeAttrForMods, setActiveAttrForMods] = useState<SelAttr | null>(null);

  const openEnhancementsFor = (attr: SelAttr) => {
    setActiveAttrForMods(attr);
    setEnhModalOpen(true);
  };
  const openLimitersFor = (attr: SelAttr) => {
    setActiveAttrForMods(attr);
    setLimModalOpen(true);
  };
  const handleAddEnhancementToActive = (enh: AttributeEnhancement) => {
    if (!activeAttrForMods) return;
    setSelectedAttrs(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, enhancements: [...(a.enhancements || []), enh] } : a));
  };
  const handleAddLimiterToActive = (lim: AttributeLimiter) => {
    if (!activeAttrForMods) return;
    setSelectedAttrs(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, limiters: [...(a.limiters || []), lim] } : a));
  };

  const countEnhancementPicks = (a: SelAttr) => (a.enhancements || []).reduce((s, e) => s + (e.template?.picks || 1), 0);
  const countLimiterPicks = (a: SelAttr) => (a.limiters || []).reduce((s, l) => s + ((l.template?.picks || 1) * (l.assignments || 1)), 0);
  const calcEffectiveLevel = (a: SelAttr) => Math.max(1, (a.level || 1) - countEnhancementPicks(a) + countLimiterPicks(a));

  // Defect selection helpers
  const [defectSearch, setDefectSearch] = useState('');
  const filteredDefectsLib = useMemo(() => {
    const q = defectSearch.trim().toLowerCase();
    if (!q) return DEFECTS_LIBRARY;
    return DEFECTS_LIBRARY.filter(d => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
  }, [defectSearch]);
  const addDefect = (tpl: DefectTemplate) => {
    const exists = selectedDefects.some(sd => sd.template.key === tpl.key);
    if (exists) return;
    const initialRank = Math.min(1, tpl.max_rank || 1) || 1;
    setSelectedDefects(prev => [...prev, { id: `${tpl.key}-${Date.now()}`, template: tpl, rank: initialRank }]);
    markDirty();
  };
  const removeDefect = (id: string) => { setSelectedDefects(prev => prev.filter(d => d.id !== id)); markDirty(); };
  const updateDefectNotes = (id: string, notes: string) => setSelectedDefects(prev => prev.map(d => { if (d.id !== id) return d; markDirty(); return { ...d, notes }; }));

  // Build a re-usable payload snapshot of the current editor state (without closing)
  const buildPayload = (): CompanionConfig => {
    const metaLines = [
      identity && `Identity / Alias: ${identity}`,
      homeworld && `Homeworld / Habitat: ${homeworld}`,
      race && `Race: ${race}`,
      gender && `Gender: ${gender}`,
      heightTxt && `Height: ${heightTxt}`,
      weightTxt && `Weight: ${weightTxt}`,
    ].filter(Boolean).join('\n');
    const combinedDescription = [metaLines, description?.trim()].filter(Boolean).join('\n\n');

    const payload: CompanionConfig = {
      name: name?.trim() || 'Companion',
      level: level,
      stats,
      description: combinedDescription || undefined,
      spentCP: computedSpentCP,
      attributes: selectedAttrs.map(a => ({
        key: a.template.key,
        level: a.level,
        notes: a.notes,
        enhancements: (a.enhancements || []).map(e => ({ key: e.template.key, notes: e.notes })),
        limiters: (a.limiters || []).map(l => ({ key: l.template.key, assignments: l.assignments, notes: l.notes }))
      })),
      defects: selectedDefects.map(d => ({ key: d.template.key, rank: d.rank, notes: d.notes })),
      derived: {
        Body: derivedPreview.body,
        Mind: derivedPreview.mind,
        Soul: derivedPreview.soul,
        hp: derivedPreview.hp,
        ep: derivedPreview.ep,
        acv: derivedPreview.acv,
        dcv: derivedPreview.dcv,
        sv: derivedPreview.sv,
        dm: derivedPreview.dm,
        SaP: derivedPreview.sp,
        SoP: derivedPreview.sop,
        scv: derivedPreview.scv,
        'Armour Rating': derivedPreview.armorRating,
        ...derivedPreview.other,
      }
    };
    return payload;
  };

  const handleSave = () => {
    const payload: CompanionConfig = buildPayload();
    onSave(payload);
    setIsDirty(false);
    onClose();
  };

  // Local file import/export
  const importInputRef = useRef<HTMLInputElement>(null);
  const handleExportToLibrary = () => {
    const payload = buildPayload();
    exportLibraryFile('companion', 1, payload, { prefix: 'BESM_companion', baseName: payload.name });
  };
  const handleImportFromLibrary = () => {
    importInputRef.current?.click();
  };
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const parsed = await parseLibraryFile<Partial<CompanionConfig>>(file, 'companion');
      const data: Partial<CompanionConfig> = (parsed as any).data ?? (parsed as any);
      if (!data || typeof data !== 'object') throw new Error('Invalid file format');

      // Apply basic fields
      setName((data.name as string) || 'Companion');
      // Level is externally controlled; keep current but allow import to suggest level if present
      // Stats
      if (data.stats) {
        setStats({
          body: clampNonNegativeInt((data.stats as any).body ?? 0),
          mind: clampNonNegativeInt((data.stats as any).mind ?? 0),
          soul: clampNonNegativeInt((data.stats as any).soul ?? 0),
        });
      }
      setDescription(typeof data.description === 'string' ? data.description : '');

      // Map attributes
      if (Array.isArray(data.attributes)) {
        const mapped = (data.attributes as any[])
          .map(a => {
            const tpl = a.key ? getAttributeByKey(a.key) : undefined;
            if (!tpl) return null;
            const enhancements: AttributeEnhancement[] = (a.enhancements || [])
              .map((e: any) => {
                const et = e.key ? getEnhancementByKey(e.key) : undefined;
                if (!et) return null;
                return { id: uuidv4(), template: et, notes: e.notes || '' } as AttributeEnhancement;
              })
              .filter(Boolean) as AttributeEnhancement[];
            const limiters: AttributeLimiter[] = (a.limiters || [])
              .map((l: any) => {
                const lt = l.key ? getLimiterByKey(l.key) : undefined;
                if (!lt) return null;
                return { id: uuidv4(), template: lt, assignments: l.assignments, notes: l.notes || '' } as AttributeLimiter;
              })
              .filter(Boolean) as AttributeLimiter[];
            return {
              id: `${tpl.key}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
              template: tpl,
              level: Math.max(1, Math.trunc(a.level || 1)),
              notes: a.notes,
              enhancements,
              limiters,
            } as SelAttr;
          })
          .filter(Boolean) as SelAttr[];
        setSelectedAttrs(mapped);
      } else {
        setSelectedAttrs([]);
      }

      // Map defects
      if (Array.isArray(data.defects)) {
        const mappedD = (data.defects as any[])
          .map(d => {
            const tpl = d.key ? getDefectByKey(d.key) : undefined;
            if (!tpl) return null;
            const rank = Math.min(Math.max(1, Math.trunc(d.rank || 1)), tpl.max_rank);
            return { id: `${tpl.key}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, template: tpl, rank, notes: d.notes } as SelDefect;
          })
          .filter(Boolean) as SelDefect[];
        setSelectedDefects(mappedD);
      } else {
        setSelectedDefects([]);
      }

      setIsDirty(true);
      // Reset input value so the same file can be imported again if desired
      if (importInputRef.current) importInputRef.current.value = '' as any;
    } catch (err) {
      console.error('Failed to import companion file', err);
      alert('Failed to import file. Please ensure it is a valid Companion JSON export.');
    }
  };

  // Modals for Enhancements / Limiters are rendered within the Modal below

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <label style={labelStyle}>Companion Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); markDirty(); }}
          style={textInputStyle}
          className="sheet-input"
          placeholder="Companion Name"
        />
      </div>
      {/* Companion Level is managed on the attribute itself; shown here for reference only */}
      <div style={{ minWidth: 140 }}>
        <label style={labelStyle}>Companion Level</label>
        <div style={{ fontWeight: 800, color: 'var(--besm-dark-text)', padding: '8px 10px' }}>Level {level}</div>
      </div>
      <div style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 260 }}>
        <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700 }}>CP Budget: {budgetCP}</div>
        <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700 }}>CP Spent: {computedSpentCP}</div>
        <div style={{ color: overBudget ? 'var(--besm-red)' : 'var(--besm-purple)', fontWeight: 800 }}>CP Remaining: {remainingCP}</div>
        <div style={{ marginTop: 6, background: '#eee', height: 8, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, Math.round((computedSpentCP / Math.max(1, budgetCP)) * 100))}%`, height: '100%', background: 'var(--besm-pink)' }} />
        </div>
        {overBudget && (
          <div style={{ marginTop: 6, color: 'var(--besm-red)', fontWeight: 800 }} aria-live="polite">
            Over budget by {overBudgetBy} CP
          </div>
        )}
      </div>
    </div>
  );

  const tabs = (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8, margin: '8px 0 12px 0', position: 'relative' }} role="tablist" aria-label="Companion editor sections">
      <div style={{ display: 'flex', gap: 8 }}>
        {tabOrder.map((t, idx) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            aria-controls={`companion-tabpanel-${t.key}`}
            tabIndex={0}
            ref={(el) => { tabRefs.current[t.key] = el; }}
            onFocus={() => setFocusedTab(t.key)}
            onBlur={() => setFocusedTab(null)}
            onClick={() => setActiveTab(t.key)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
              e.preventDefault();
              const count = tabOrder.length;
              const currentIndex = idx;
              const nextIndex = e.key === 'ArrowRight'
                ? (currentIndex + 1) % count
                : (currentIndex - 1 + count) % count;
              const nextKey = tabOrder[nextIndex].key;
              setActiveTab(nextKey);
              setFocusedTab(nextKey);
              const nextBtn = tabRefs.current[nextKey];
              if (nextBtn) nextBtn.focus();
            }}
            style={{
              ...buttonBase,
              background: activeTab === t.key ? 'var(--besm-purple)' : 'white',
              color: activeTab === t.key ? 'white' : 'var(--besm-dark-text)',
              border: '2px solid var(--besm-purple)',
              outline: 'none',
              boxShadow: focusedTab === t.key
                ? '0 0 0 3px #ffffff, 0 0 0 6px var(--besm-pink)'
                : 'none',
              transition: 'box-shadow 120ms ease-in-out'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );


  return (
    <EntityBuilderModal
      isOpen={open}
      onClose={handleRequestClose}
      title="Edit Companion"
      maxWidth="900px"
      storageKey="besm_companion_prefs_v1"
      showGear={true}
      renderTooltipLayer={true}
      renderInfoLayer={true}
      renderScreenReaderRegions={true}
    >
      {(ctx) => {
        const { readingMode, showTip, moveTip, hideTip, showTipAtElement, openInfoAtElement, setSrText, setSrAnnounce } = ctx;

        // Wrappers that announce via SR and update state
        const bumpStatCtx = (key: keyof CompanionStats, delta: number) => {
          setStats(s => {
            const next = Math.max(0, (s[key] as number || 0) + delta);
            const out = { ...s, [key]: next } as CompanionStats;
            setSrAnnounce(`${String(key).charAt(0).toUpperCase() + String(key).slice(1)} set to ${next}`);
            markDirty();
            return out;
          });
        };
        const updateAttrLevelCtx = (id: string, lvl: number) => setSelectedAttrs(prev => prev.map(a => {
          if (a.id !== id) return a;
          const maxL = (a.template as unknown as OptionalAttrMeta)?.max_level ?? 20;
          const next = Math.min(maxL, Math.max(1, Math.trunc(lvl || 1)));
          setSrAnnounce(`${a.template.name} level set to ${next}`);
          markDirty();
          return { ...a, level: next };
        }));

        // Defect rank stepper helper
        const setDefectRankCtx = (id: string, r: number) => setSelectedDefects(prev => prev.map(d => {
          if (d.id !== id) return d;
          const next = Math.min(d.template.max_rank, Math.max(1, Math.trunc(r || 1)));
          setSrAnnounce(`${d.template.name} rank set to ${next}`);
          markDirty();
          return { ...d, rank: next };
        }));

        // Hidden SR instructions
        const srInstructions = (
          <div style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} aria-live="polite">
            Companion editor. Tabs are Stats, Attributes, Defects, and Description. Use Left and Right arrow keys to switch tabs. Use arrow keys to change steppers; Home and End jump to minimum and maximum.
          </div>
        );

        // Stats tab (uses bumpStatCtx)
        const statsTabCtx = (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {/* Body */}
              <div style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 10, background: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-header)', color: 'var(--besm-pink)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>Body</div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); bumpStatCtx('body', -1); }
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); bumpStatCtx('body', 1); }
                    if (e.key === 'Home') { e.preventDefault(); setStats(s => { const out = { ...s, body: 0 }; setSrAnnounce('Body set to 0'); return out; }); }
                    if (e.key === 'End') { e.preventDefault(); setStats(s => { const out = { ...s, body: MAX_STAT }; setSrAnnounce(`Body set to ${MAX_STAT}`); return out; }); }
                  }}
                  aria-label="Body level stepper"
                >
                  <button type="button" onClick={() => bumpStatCtx('body', -1)} style={circlePinkLight}>-</button>
                  <div style={circleBlue} aria-live="polite" aria-atomic="true">{stats.body}</div>
                  <button type="button" onClick={() => bumpStatCtx('body', 1)} style={circlePink}>+</button>
                </div>
              </div>
              {/* Mind */}
              <div style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 10, background: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-header)', color: 'var(--besm-pink)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>Mind</div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); bumpStatCtx('mind', -1); }
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); bumpStatCtx('mind', 1); }
                    if (e.key === 'Home') { e.preventDefault(); setStats(s => { const out = { ...s, mind: 0 }; setSrAnnounce('Mind set to 0'); return out; }); }
                    if (e.key === 'End') { e.preventDefault(); setStats(s => { const out = { ...s, mind: MAX_STAT }; setSrAnnounce(`Mind set to ${MAX_STAT}`); return out; }); }
                  }}
                  aria-label="Mind level stepper"
                >
                  <button type="button" onClick={() => bumpStatCtx('mind', -1)} style={circlePinkLight}>-</button>
                  <div style={circleBlue} aria-live="polite" aria-atomic="true">{stats.mind}</div>
                  <button type="button" onClick={() => bumpStatCtx('mind', 1)} style={circlePink}>+</button>
                </div>
              </div>
              {/* Soul */}
              <div style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 10, background: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-header)', color: 'var(--besm-pink)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>Soul</div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); bumpStatCtx('soul', -1); }
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); bumpStatCtx('soul', 1); }
                    if (e.key === 'Home') { e.preventDefault(); setStats(s => { const out = { ...s, soul: 0 }; setSrAnnounce('Soul set to 0'); return out; }); }
                    if (e.key === 'End') { e.preventDefault(); setStats(s => { const out = { ...s, soul: MAX_STAT }; setSrAnnounce(`Soul set to ${MAX_STAT}`); return out; }); }
                  }}
                  aria-label="Soul level stepper"
                >
                  <button type="button" onClick={() => bumpStatCtx('soul', -1)} style={circlePinkLight}>-</button>
                  <div style={circleBlue} aria-live="polite" aria-atomic="true">{stats.soul}</div>
                  <button type="button" onClick={() => bumpStatCtx('soul', 1)} style={circlePink}>+</button>
                </div>
              </div>
            </div>
            {/* Derived values preview (unchanged) */}
            { /* re-use existing derived preview block */ }
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 12, background: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-header)', color: 'var(--besm-pink)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Derived Values</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, columnGap: 12 }}>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Health Points (HP)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.hp}</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Energy Points (EP)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.ep}</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Attack Combat Value (ACV)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.acv}</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Defense Combat Value (DCV)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.dcv}</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Shock Value (SV)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.sv}</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Damage Multiplier (DM)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.dm}x</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Sanity Points (SaP)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.sp}</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Social Combat Value (SCV)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.scv}</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Social Points (SoP)</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.sop}</div>
                </div>
              </div>
              {/* Movement panel (original layout) */}
              <div style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 12, background: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-header)', color: 'var(--besm-pink)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Movement</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, columnGap: 12 }}>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Walk</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.walk.toFixed(1)} m/rd</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Jog</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.jog.toFixed(1)} m/rd</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Run</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.run.toFixed(1)} m/rd</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Sprint</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.sprint.toFixed(1)} m/rd</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Swim</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.swim.toFixed(1)} m/rd</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Crawl</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.crawl.toFixed(1)} m/rd</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Standing High Jump</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.standingHighJump.toFixed(2)} m</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Standing Long Jump</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.standingLongJump.toFixed(2)} m</div>
                  <div style={{ color: 'var(--besm-dark-text)' }}>Running Long Jump</div><div style={{ fontWeight: 800, color: '#000' }}>{derivedPreview.movement.runningLongJump.toFixed(2)} m</div>
                </div>
              </div>
            </div>
          </div>
        );

        // Attributes tab rebuilt with ctx handlers
        const attributesTabCtx = (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Library list */}
              <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Search attributes..."
                    value={attrSearch}
                    onChange={(e) => setAttrSearch(e.target.value)}
                    style={textInputStyle}
                    className="sheet-input"
                  />
                </div>
                <div style={{ height: 330, overflow: 'auto' }}>
                  {filteredAttrLib.map(tpl => (
                    <div key={tpl.key} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div
                            style={{ fontWeight: 700, color: 'var(--besm-dark-text)' }}
                            tabIndex={0}
                            aria-describedby="entity-sr-desc"
                            onMouseEnter={(e) => showTip(tpl.description || '', e)}
                            onMouseMove={moveTip}
                            onMouseLeave={() => { hideTip(); }}
                            onFocus={(e) => { setSrText(tpl.description || ''); showTipAtElement(tpl.description || '', e.currentTarget); }}
                            onBlur={() => { hideTip(); setSrText(''); }}
                          >
                            {tpl.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>{tpl.cost_per_level ?? 0} CP / level</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          aria-label={`More info about ${tpl.name}`}
                          aria-haspopup="dialog"
                          onClick={(e) => openInfoAtElement(tpl.description || '', (e.currentTarget as HTMLElement))}
                          style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                        >i</button>
                        <button style={secondaryButton} onClick={() => addAttr(tpl)}>Add</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected list */}
              <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Selected Attributes</div>
                <div style={{ height: 330, overflow: 'auto', paddingRight: 4 }}>
                  {selectedAttrs.length === 0 && (
                    <div style={{ color: 'var(--besm-dark-text)' }}>No attributes selected.</div>
                  )}
                  {selectedAttrs.map(sa => (
                    <div key={sa.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{ fontWeight: 700, color: 'var(--besm-dark-text)' }}
                            tabIndex={0}
                            aria-describedby="entity-sr-desc"
                            onMouseEnter={(e) => showTip(((sa.template as unknown as OptionalAttrMeta).description) || '', e)}
                            onMouseMove={moveTip}
                            onMouseLeave={() => { hideTip(); }}
                            onFocus={(e) => { const desc = (sa.template as unknown as OptionalAttrMeta).description || ''; setSrText(desc); showTipAtElement(desc, e.currentTarget); }}
                            onBlur={() => { hideTip(); setSrText(''); }}
                          >
                            {sa.template.name}
                          </div>
                          <button
                            type="button"
                            aria-label={`More info about ${sa.template.name}`}
                            aria-haspopup="dialog"
                            onClick={(e) => openInfoAtElement(((sa.template as unknown as OptionalAttrMeta).description) || '', (e.currentTarget as HTMLElement))}
                            style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                          >i</button>
                        </div>
                        <button style={{ ...secondaryButton, background: 'var(--besm-red)', color: 'white' }} onClick={() => removeAttr(sa.id)}>Remove</button>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                        <label style={labelStyle}>Level</label>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); updateAttrLevelCtx(sa.id, sa.level - 1); }
                            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); updateAttrLevelCtx(sa.id, sa.level + 1); }
                            if (e.key === 'Home') { e.preventDefault(); updateAttrLevelCtx(sa.id, 1); }
                            if (e.key === 'End') { e.preventDefault(); const maxL = (sa.template as unknown as OptionalAttrMeta)?.max_level ?? 20; updateAttrLevelCtx(sa.id, maxL); }
                          }}
                          aria-label={`${sa.template.name} level stepper`}
                        >
                          <button type="button" onClick={() => updateAttrLevelCtx(sa.id, sa.level - 1)} style={circlePinkLight} aria-label={`Decrease ${sa.template.name} level`}>-</button>
                          <div style={circleBlue} aria-live="polite" aria-atomic="true">{sa.level}</div>
                          <button type="button" onClick={() => updateAttrLevelCtx(sa.id, sa.level + 1)} style={circlePink} aria-label={`Increase ${sa.template.name} level`}>+</button>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>Effective: {calcEffectiveLevel(sa)}</div>
                        <div style={{ marginLeft: 'auto', fontWeight: 700 }}>{calculateAttributeCost(sa.template, sa.level)} CP</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                        <button style={{ ...secondaryButton, background: 'var(--besm-yellow)', border: '1px solid black', color: '#000' }} onClick={() => openEnhancementsFor(sa)}>Enhancements ({countEnhancementPicks(sa)})</button>
                        <button style={{ ...secondaryButton, background: 'var(--besm-yellow)', border: '1px solid black', color: '#000' }} onClick={() => openLimitersFor(sa)}>Limiters ({countLimiterPicks(sa)})</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

        // Defects tab rebuilt with ctx handlers
        const defectsTabCtx = (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Search defects..."
                    value={defectSearch}
                    onChange={(e) => setDefectSearch(e.target.value)}
                    style={textInputStyle}
                    className="sheet-input"
                  />
                </div>
                <div style={{ height: 330, overflow: 'auto' }}>
                  {filteredDefectsLib.map(tpl => (
                    <div key={tpl.key} style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div
                          style={{ fontWeight: 700, color: 'var(--besm-dark-text)' }}
                          tabIndex={0}
                          aria-describedby="entity-sr-desc"
                          onMouseEnter={(e) => showTip(tpl.description || '', e)}
                          onMouseMove={moveTip}
                          onMouseLeave={hideTip}
                          onFocus={(e) => { setSrText(tpl.description || ''); showTipAtElement(tpl.description || '', e.currentTarget); }}
                          onBlur={() => { hideTip(); setSrText(''); }}
                        >
                          {tpl.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>Refund {tpl.cp_refund} CP / rank • Max {tpl.max_rank}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          aria-label={`More info about ${tpl.name}`}
                          aria-haspopup="dialog"
                          onClick={(e) => openInfoAtElement(tpl.description || '', (e.currentTarget as HTMLElement))}
                          style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                        >i</button>
                        <button style={secondaryButton} onClick={() => addDefect(tpl)}>Add</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Selected Defects</div>
                <div style={{ height: 330, overflow: 'auto', paddingRight: 4 }}>
                  {selectedDefects.length === 0 && (
                    <div style={{ color: 'var(--besm-dark-text)' }}>No defects selected.</div>
                  )}
                  {selectedDefects.map(sd => (
                    <div key={sd.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{ fontWeight: 700, color: 'var(--besm-dark-text)' }}
                            tabIndex={0}
                            aria-describedby="entity-sr-desc"
                            onMouseEnter={(e) => showTip(((sd.template as unknown as OptionalDefectMeta).description) || '', e)}
                            onMouseMove={moveTip}
                            onMouseLeave={() => { hideTip(); }}
                            onFocus={(e) => { const desc = (sd.template as unknown as OptionalDefectMeta).description || ''; setSrText(desc); showTipAtElement(desc, e.currentTarget); }}
                            onBlur={() => { hideTip(); setSrText(''); }}
                          >
                            {sd.template.name}
                          </div>
                          <button
                            type="button"
                            aria-label={`More info about ${sd.template.name}`}
                            aria-haspopup="dialog"
                            onClick={(e) => openInfoAtElement(((sd.template as unknown as OptionalDefectMeta).description) || '', (e.currentTarget as HTMLElement))}
                            style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                          >i</button>
                        </div>
                        <button style={{ ...secondaryButton, background: 'var(--besm-red)', color: 'white' }} onClick={() => removeDefect(sd.id)}>Remove</button>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                        <label style={labelStyle}>Rank</label>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setDefectRankCtx(sd.id, sd.rank - 1); }
                            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setDefectRankCtx(sd.id, sd.rank + 1); }
                            if (e.key === 'Home') { e.preventDefault(); setDefectRankCtx(sd.id, 1); }
                            if (e.key === 'End') { e.preventDefault(); setDefectRankCtx(sd.id, sd.template.max_rank); }
                          }}
                          aria-label={`${sd.template.name} rank stepper`}
                        >
                          <button type="button" onClick={() => setDefectRankCtx(sd.id, sd.rank - 1)} style={circlePinkLight} aria-label={`Decrease ${sd.template.name} rank`}>-</button>
                          <div style={circleBlue} aria-live="polite" aria-atomic="true">{sd.rank}</div>
                          <button type="button" onClick={() => setDefectRankCtx(sd.id, sd.rank + 1)} style={circlePink} aria-label={`Increase ${sd.template.name} rank`}>+</button>
                        </div>
                        <div style={{ marginLeft: 'auto', fontWeight: 700 }}>Refund {calculateDefectBonus(sd.template, sd.rank)} CP</div>
                      </div>
                      {sd.template.requires_description && (
                        <div style={{ marginTop: 8 }}>
                          <label style={labelStyle}>Notes / Details</label>
                          <textarea value={sd.notes || ''} onChange={(e) => updateDefectNotes(sd.id, e.target.value)} rows={3} style={{ ...textInputStyle, resize: 'vertical' }} className="sheet-input" placeholder="Describe specifics for this defect" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

        // Description tab: apply ctx.readingMode
        const descriptionTabCtx = (
          <div>
            <div style={readingMode ? { lineHeight: 1.6, letterSpacing: 0.3 } as React.CSSProperties : undefined}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Identity / Alias</label>
                  <input type="text" value={identity} onChange={(e) => { setIdentity(e.target.value); markDirty(); }} style={textInputStyle} className="sheet-input" placeholder="e.g., The Silver Fox" />
                </div>
                <div>
                  <label style={labelStyle}>Homeworld / Habitat</label>
                  <input type="text" value={homeworld} onChange={(e) => { setHomeworld(e.target.value); markDirty(); }} style={textInputStyle} className="sheet-input" placeholder="e.g., Veldora Prime" />
                </div>
                <div>
                  <label style={labelStyle}>Race</label>
                  <input type="text" value={race} onChange={(e) => { setRace(e.target.value); markDirty(); }} style={textInputStyle} className="sheet-input" placeholder="e.g., Andronian" />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <input type="text" value={gender} onChange={(e) => { setGender(e.target.value); markDirty(); }} style={textInputStyle} className="sheet-input" placeholder="e.g., Female" />
                </div>
                <div>
                  <label style={labelStyle}>Height</label>
                  <input type="text" value={heightTxt} onChange={(e) => { setHeightTxt(e.target.value); markDirty(); }} style={textInputStyle} className="sheet-input" placeholder="e.g., 1.8 m" />
                </div>
                <div>
                  <label style={labelStyle}>Weight</label>
                  <input type="text" value={weightTxt} onChange={(e) => { setWeightTxt(e.target.value); markDirty(); }} style={textInputStyle} className="sheet-input" placeholder="e.g., 72 kg" />
                </div>
              </div>
              <label style={labelStyle}>Description / Notes</label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                rows={6}
                style={{ ...textInputStyle, resize: 'vertical', height: 230 }}
                className="sheet-input"
                placeholder="Background, appearance, role, etc."
              />
            </div>
          </div>
        );

        return (
          <>
            {srInstructions}
            {header}
            {tabs}
            <div style={contentPanelStyle}>
              {activeTab === 'stats' && statsTabCtx}
              {activeTab === 'attributes' && attributesTabCtx}
              {activeTab === 'defects' && defectsTabCtx}
              {activeTab === 'description' && descriptionTabCtx}
            </div>

            <EditorFooterActions
              onCancel={handleRequestClose}
              onImport={handleImportFromLibrary}
              onExport={handleExportToLibrary}
              onSave={handleSave}
              saveLabel="Save"
              cancelLabel="Cancel"
            />

            {confirmOpen && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 10003, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div role="dialog" aria-modal="true" aria-label="Discard changes" style={{ background: '#fff', color: 'var(--besm-dark-text)', border: '2px solid var(--besm-purple)', borderRadius: 8, padding: 16, width: 360, boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Discard changes?</div>
                  <div style={{ fontSize: 13, marginBottom: 12 }}>You have unsaved changes. Are you sure you want to close without saving?</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={() => setConfirmOpen(false)} style={{ ...secondaryButton }}>Keep Editing</button>
                    <button onClick={() => { setConfirmOpen(false); setIsDirty(false); onClose(); }} style={{ ...primaryButton, background: 'var(--besm-red)' }}>Discard</button>
                  </div>
                </div>
              </div>
            )}
            {enhModalOpen && activeAttrForMods && (
              <EnhancementsModal
                isOpen={enhModalOpen}
                onClose={() => setEnhModalOpen(false)}
                attribute={activeAttrForMods.template}
                currentEnhancements={activeAttrForMods.enhancements || []}
                onAddEnhancement={(enh) => { handleAddEnhancementToActive(enh); setEnhModalOpen(false); }}
              />
            )}
            {limModalOpen && activeAttrForMods && (
              <LimitersModal
                isOpen={limModalOpen}
                onClose={() => setLimModalOpen(false)}
                attribute={activeAttrForMods.template}
                currentLimiters={activeAttrForMods.limiters || []}
                onAddLimiter={(lim) => { handleAddLimiterToActive(lim); setLimModalOpen(false); }}
              />
            )}
          </>
        );
      }}
    </EntityBuilderModal>
  );
};

export default CompanionBuilderModal;