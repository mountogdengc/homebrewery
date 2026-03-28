import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AlternateFormConfig,
  CharacterAttribute,
  CharacterDefect,
  BesmCharacter,
  AttributeEnhancement,
  AttributeLimiter,
  AlternateFormAttributeReduction,
  AlternateFormDefectBuyoff,
} from '../../types/besm-character';
import { AttributeTemplate, ATTRIBUTES_LIBRARY, calculateAttributeCost, getAttributeByKey } from '../../data/attributesLibrary';
import { DEFECTS_LIBRARY, calculateDefectBonus, getDefectByKey } from '../../data/defectsLibrary';
import type { DefectTemplate } from '../../data/defectsLibrary';
import { getEnhancementByKey } from '../../data/enhancementsLibrary';
import { getLimiterByKey } from '../../data/limitersLibrary';
import { exportLibraryFile, parseLibraryFile } from '../../utils/userLibrary';
import { EnhancementsModal } from './EnhancementsModal';
import LimitersModal from './LimitersModal';
import { EntityBuilderModal } from '../common/EntityBuilderModal';
import { EditorFooterActions } from '../common/EditorFooterActions';

interface AlternateFormBuilderModalProps {
  open: boolean;
  onClose: () => void;
  attributeId?: string;
  level: number;
  effectiveLevel?: number;
  character: BesmCharacter;
  existingConfig?: AlternateFormConfig;
  computeBudget?: (level: number) => number;
  budgetOverride?: number;
  onSave: (config: AlternateFormConfig) => void;
}

type TabKey = 'stats' | 'attributes' | 'defects' | 'description';
type OptionalAttrMeta = { max_level?: number; description?: string; stat_mods?: { derived?: Record<string, number> } };
type OptionalDefectMeta = { description?: string };

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
const circlePink: React.CSSProperties = { ...circleBase, background: 'var(--besm-pink)', color: '#fff', cursor: 'pointer' };
const circlePinkLight: React.CSSProperties = { ...circleBase, background: 'var(--besm-light-pink-bg, #ffd1e6)', color: 'var(--besm-pink)', cursor: 'pointer' };
const circleBlue: React.CSSProperties = { ...circleBase, background: 'var(--besm-blue, #0b74ff)', color: '#fff' };

const contentPanelStyle: React.CSSProperties = {
  border: '2px solid var(--besm-purple)',
  borderRadius: 8,
  padding: 16,
  background: 'var(--besm-light-bg)',
  height: 460,
  overflowY: 'auto',
};

const AlternateFormBuilderModal: React.FC<AlternateFormBuilderModalProps> = ({
  open,
  onClose,
  level,
  effectiveLevel,
  character,
  existingConfig,
  computeBudget,
  budgetOverride,
  onSave,
}) => {
  const [name, setName] = useState(existingConfig?.name || '');
  const [notes, setNotes] = useState(existingConfig?.notes || '');
  const [formAttributes, setFormAttributes] = useState<CharacterAttribute[]>(existingConfig?.formAttributes || []);
  const [formDefects, setFormDefects] = useState<CharacterDefect[]>(existingConfig?.formDefects || []);
  const [statDeltas, setStatDeltas] = useState(existingConfig?.statDeltas || { body: 0, mind: 0, soul: 0 });
  const [reducedBaseAttributes, setReducedBaseAttributes] = useState<AlternateFormAttributeReduction[]>(existingConfig?.reducedBaseAttributes || []);
  const [boughtOffBaseDefects, setBoughtOffBaseDefects] = useState<AlternateFormDefectBuyoff[]>(existingConfig?.boughtOffBaseDefects || []);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('stats');
  const [focusedTab, setFocusedTab] = useState<TabKey | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ stats: null, attributes: null, defects: null, description: null });

  // Dirty tracking
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  // Modals for per-attribute Enhancements / Limiters
  const [enhModalOpen, setEnhModalOpen] = useState(false);
  const [limModalOpen, setLimModalOpen] = useState(false);
  const [activeAttrForMods, setActiveAttrForMods] = useState<CharacterAttribute | null>(null);

  // Search
  const [attrSearch, setAttrSearch] = useState('');
  const [defectSearch, setDefectSearch] = useState('');

  const filteredAttrLib = useMemo(() => {
    const q = attrSearch.trim().toLowerCase();
    if (!q) return ATTRIBUTES_LIBRARY;
    return ATTRIBUTES_LIBRARY.filter(a =>
      a.name.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
    );
  }, [attrSearch]);

  const filteredDefectsLib = useMemo(() => {
    const q = defectSearch.trim().toLowerCase();
    if (!q) return DEFECTS_LIBRARY;
    return DEFECTS_LIBRARY.filter(d =>
      d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
    );
  }, [defectSearch]);

  const budgetCP = useMemo(() => {
    if (typeof budgetOverride === 'number') return budgetOverride;
    if (computeBudget) return computeBudget(level);
    return Math.max(0, level * 5);
  }, [budgetOverride, computeBudget, level]);

  // Stat cost per point: 2 up to and including 12, then 4 after that
  const statCostTotal = (value: number) => {
    if (value <= 0) return 0;
    return value <= 12 ? value * 2 : 24 + (value - 12) * 4;
  };

  // Stat delta CP impact: positive = extra cost, negative = refund when reducing stats in the AF
  const { statDeltaCost, statDeltaRefund } = useMemo(() => {
    const base = character?.stats || { body: 0, mind: 0, soul: 0 };
    const bodyNew = Math.max(0, base.body + (statDeltas.body || 0));
    const mindNew = Math.max(0, base.mind + (statDeltas.mind || 0));
    const soulNew = Math.max(0, base.soul + (statDeltas.soul || 0));

    const baseCost = statCostTotal(base.body) + statCostTotal(base.mind) + statCostTotal(base.soul);
    const newCost = statCostTotal(bodyNew) + statCostTotal(mindNew) + statCostTotal(soulNew);
    const diff = newCost - baseCost;
    return { statDeltaCost: Math.max(0, diff), statDeltaRefund: Math.max(0, -diff) };
  }, [character, statDeltas]);

  // Spent = attribute costs + stat delta cost - defect refunds
  const spentCP = useMemo(() => {
    const attrCost = formAttributes.reduce((t, a) => t + calculateAttributeCost(a.template as any, Math.max(1, a.level || 1)), 0);
    const defectRefund = formDefects.reduce((t, d) => {
      const rank = Math.max(1, d.rank || 1);
      return t + calculateDefectBonus(d.template as DefectTemplate, rank);
    }, 0);
    return Math.max(0, attrCost + statDeltaCost - defectRefund);
  }, [formAttributes, formDefects, statDeltaCost]);

  // Compute budget adjustments from reductions/buy-offs
  const reductionsRefund = useMemo(() => reducedBaseAttributes.reduce((t, r) => t + (r.refundedCP || 0), 0), [reducedBaseAttributes]);
  const buyoffCost = useMemo(() => boughtOffBaseDefects.reduce((t, b) => t + (b.costCP || 0), 0), [boughtOffBaseDefects]);
  const totalBudgetCP = Math.max(0, budgetCP + reductionsRefund + statDeltaRefund - buyoffCost);

  const remainingCP = Math.max(0, totalBudgetCP - spentCP);
  const overBudgetBy = Math.max(0, spentCP - totalBudgetCP);
  const overBudget = overBudgetBy > 0;

  // Aggregate derived bonuses from selected form attributes
  const derivedBonuses = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of formAttributes) {
      const tpl: any = a.template as unknown as OptionalAttrMeta;
      const d = tpl?.stat_mods?.derived;
      if (!d) continue;
      for (const key of Object.keys(d)) {
        const perLevel = Number(d[key]) || 0;
        out[key] = (out[key] || 0) + perLevel * (a.level || 1);
      }
    }
    return out;
  }, [formAttributes]);

  // Derived Values Preview based on base stats + deltas
  const derivedPreview = useMemo(() => {
    const base = character?.stats || { body: 0, mind: 0, soul: 0 };
    const body = Math.max(0, base.body + (statDeltas.body || 0));
    const mind = Math.max(0, base.mind + (statDeltas.mind || 0));
    const soul = Math.max(0, base.soul + (statDeltas.soul || 0));

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

    const mappedKeys = new Set(['HP','Health Points','EP','Energy Points','ACV','Attack Combat Value','DCV','Defense Combat Value','SV','Shock Value','DM','Damage Multiplier','SaP','SP','SoP','SCV','Armour Rating','Armor Rating']);
    const other: Record<string, number> = {};
    for (const [k, v] of Object.entries(derivedBonuses)) {
      if (!mappedKeys.has(k)) other[k] = v;
    }

    const fastMultiplier = (() => {
      try {
        return (formAttributes || []).reduce((mult, a) => {
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

    const calcSpeed = (base: number) => (body * base) * fastMultiplier;
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
  }, [character, statDeltas, derivedBonuses, formAttributes]);

  useEffect(() => {
    if (!open) return;
    setActiveTab('stats');
    if (existingConfig) {
      setName(existingConfig.name || '');
      setNotes(existingConfig.notes || '');
      const syncedAttrs = (existingConfig.formAttributes || []).map(a => {
        const levelSafe = Math.max(1, a.level || 1);
        const cpCost = calculateAttributeCost(a.template as any, levelSafe);
        return { ...a, level: levelSafe, cpCost } as CharacterAttribute;
      });
      const syncedDefects = (existingConfig.formDefects || []).map(d => {
        const rankSafe = Math.max(1, d.rank || 1);
        const cpRefund = calculateDefectBonus(d.template as DefectTemplate, rankSafe);
        return { ...d, rank: rankSafe, cpRefund } as CharacterDefect;
      });
      setFormAttributes(syncedAttrs);
      setFormDefects(syncedDefects);
      setStatDeltas(existingConfig.statDeltas || { body: 0, mind: 0, soul: 0 });
      setReducedBaseAttributes(existingConfig.reducedBaseAttributes || []);
      setBoughtOffBaseDefects(existingConfig.boughtOffBaseDefects || []);
    } else {
      setName('');
      setNotes('');
      setFormAttributes([]);
      setFormDefects([]);
      setStatDeltas({ body: 0, mind: 0, soul: 0 });
      setReducedBaseAttributes([]);
      setBoughtOffBaseDefects([]);
    }
    setIsDirty(false);
  }, [open, existingConfig]);

  const handleRequestClose = () => {
    if (isDirty) { setConfirmOpen(true); return; }
    onClose();
  };

  const handleAddFormAttribute = (template: AttributeTemplate) => {
    const exists = formAttributes.some(a => (a.template?.key || '') === (template.key || ''));
    if (exists) return;
    const level = 1;
    const cpCost = calculateAttributeCost(template as any, level);
    const newAttr: CharacterAttribute = {
      id: uuidv4(),
      template,
      level,
      cpCost,
      notes: '',
      source: 'custom',
      isCustom: true,
      customInputs: {},
      enhancements: [],
      defects: [],
      limiters: [],
      selectedOptions: [],
    };
    setFormAttributes(prev => [...prev, newAttr]);
    setIsDirty(true);
  };

  const handleRemoveFormAttribute = (id: string) => {
    setFormAttributes(prev => prev.filter(a => a.id !== id));
    setIsDirty(true);
  };

  const calculateEffectiveLevel = (attr: CharacterAttribute) => {
    const enhancementPicks = (attr.enhancements || []).reduce((s, e) => s + (e.template?.picks || 1), 0);
    const limiterPicks = (attr.limiters || []).reduce((s, l) => s + ((l.template?.picks || 1) * (l.assignments || 1)), 0);
    return Math.max(1, (attr.level || 1) - enhancementPicks + limiterPicks);
  };

  const openEnhancementsFor = (attribute: CharacterAttribute) => {
    setActiveAttrForMods(attribute);
    setEnhModalOpen(true);
  };
  const openLimitersFor = (attribute: CharacterAttribute) => {
    setActiveAttrForMods(attribute);
    setLimModalOpen(true);
  };

  const handleAddEnhancementToActive = (enh: AttributeEnhancement) => {
    if (!activeAttrForMods) return;
    setFormAttributes(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, enhancements: [...(a.enhancements || []), enh] } : a));
    setIsDirty(true);
  };

  const handleAddLimiterToActive = (lim: AttributeLimiter) => {
    if (!activeAttrForMods) return;
    setFormAttributes(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, limiters: [...(a.limiters || []), lim] } : a));
    setIsDirty(true);
  };

  const handleAddDefect = (template: DefectTemplate) => {
    const existing = formDefects.find(d => d.template?.key === template.key);
    if (existing) return;
    const rank = 1;
    const cpRefund = calculateDefectBonus(template, rank);
    const newDef: CharacterDefect = {
      id: uuidv4(),
      template,
      rank,
      cpRefund,
      notes: '',
      source: 'custom',
    } as CharacterDefect;
    setFormDefects(prev => [...prev, newDef]);
    setIsDirty(true);
  };

  const handleRemoveDefect = (id: string) => {
    setFormDefects(prev => prev.filter(d => d.id !== id));
    setIsDirty(true);
  };

  const handleSave = () => {
    const config: AlternateFormConfig = {
      id: existingConfig?.id || uuidv4(),
      name: name || 'Alternate Form',
      notes,
      iconUrl: existingConfig?.iconUrl,
      level,
      budgetCP: totalBudgetCP,
      formAttributes,
      formDefects,
      reducedBaseAttributes,
      boughtOffBaseDefects,
      statDeltas,
      spentCP,
      remainingCP,
    };
    onSave(config);
    setIsDirty(false);
    onClose();
  };

  // Import/Export
  const importInputRef = useRef<HTMLInputElement>(null);
  const handleExportToLibrary = () => {
    const config: AlternateFormConfig = {
      id: existingConfig?.id || uuidv4(),
      name: name || 'Alternate Form',
      notes,
      iconUrl: existingConfig?.iconUrl,
      level,
      budgetCP: totalBudgetCP,
      formAttributes,
      formDefects,
      reducedBaseAttributes,
      boughtOffBaseDefects,
      statDeltas,
      spentCP,
      remainingCP,
    };
    exportLibraryFile('alternate_form', 1, config, { prefix: 'BESM_alternate_form', baseName: config.name });
  };

  const handleImportFromLibrary = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const parsed = await parseLibraryFile<Partial<AlternateFormConfig>>(file, 'alternate_form');
      const data: Partial<AlternateFormConfig> = (parsed as any).data ?? (parsed as any);
      if (!data || typeof data !== 'object') throw new Error('Invalid file format');

      setName((data.name as string) || 'Alternate Form');
      setNotes(typeof data.notes === 'string' ? data.notes : '');
      if (data.statDeltas && typeof (data.statDeltas as any).body === 'number') {
        setStatDeltas({
          body: Math.trunc((data.statDeltas as any).body || 0),
          mind: Math.trunc((data.statDeltas as any).mind || 0),
          soul: Math.trunc((data.statDeltas as any).soul || 0),
        });
      } else {
        setStatDeltas({ body: 0, mind: 0, soul: 0 });
      }

      if (Array.isArray(data.formAttributes)) {
        const mappedAttrs = (data.formAttributes as any[])
          .map((a) => {
            const tplKey = a?.template?.key ?? a?.key;
            const tpl = tplKey ? getAttributeByKey(tplKey) : undefined;
            if (!tpl) return null;
            const lvl = Math.max(1, Math.trunc(a.level || 1));
            const cpCost = calculateAttributeCost(tpl as any, lvl);
            const enhancements: AttributeEnhancement[] = (a.enhancements || [])
              .map((e: any) => {
                const et = e?.template?.key ? getEnhancementByKey(e.template.key) : (e?.key ? getEnhancementByKey(e.key) : undefined);
                if (!et) return null;
                return { id: uuidv4(), template: et, notes: e.notes || '' } as AttributeEnhancement;
              })
              .filter(Boolean) as AttributeEnhancement[];
            const limiters: AttributeLimiter[] = (a.limiters || [])
              .map((l: any) => {
                const lt = l?.template?.key ? getLimiterByKey(l.template.key) : (l?.key ? getLimiterByKey(l.key) : undefined);
                if (!lt) return null;
                return { id: uuidv4(), template: lt, assignments: l.assignments, notes: l.notes || '' } as AttributeLimiter;
              })
              .filter(Boolean) as AttributeLimiter[];
            return {
              id: uuidv4(),
              template: tpl,
              level: lvl,
              cpCost,
              notes: a.notes || '',
              source: 'custom',
              isCustom: true,
              customInputs: {},
              enhancements,
              defects: [],
              limiters,
              selectedOptions: a.selectedOptions || [],
            };
          })
          .filter(Boolean) as CharacterAttribute[];
        setFormAttributes(mappedAttrs);
      } else {
        setFormAttributes([]);
      }

      if (Array.isArray(data.formDefects)) {
        const mappedDefs = (data.formDefects as any[])
          .map((d) => {
            const tplKey = d?.template?.key ?? d?.key;
            const tpl = tplKey ? getDefectByKey(tplKey) : undefined;
            if (!tpl) return null;
            const rank = Math.max(1, Math.min(tpl.max_rank || 1, Math.trunc(d.rank || 1)));
            const cpRefund = calculateDefectBonus(tpl, rank);
            return {
              id: uuidv4(),
              template: tpl,
              rank,
              cpRefund,
              notes: d.notes || '',
              source: 'custom',
              customInputs: {},
            };
          })
          .filter(Boolean) as CharacterDefect[];
        setFormDefects(mappedDefs);
      } else {
        setFormDefects([]);
      }

      if (importInputRef.current) importInputRef.current.value = '' as any;
      setIsDirty(true);
    } catch (err) {
      console.error('Failed to import alternate form file', err);
      alert('Failed to import file. Please ensure it is a valid Alternate Form JSON export.');
    }
  };

  return (
    <EntityBuilderModal
      isOpen={open}
      onClose={handleRequestClose}
      title="Alternate Form Builder"
      maxWidth="900px"
      storageKey="besm_alternate_form_prefs_v1"
      showGear={true}
      renderTooltipLayer={true}
      renderInfoLayer={true}
      renderScreenReaderRegions={true}
    >
      {(ctx) => {
        const { setSrAnnounce, showTip, moveTip, hideTip, showTipAtElement, openInfoAtElement, setSrText } = ctx;

        const bumpAttrLevelCtx = (id: string, delta: number) => {
          setFormAttributes(prev => prev.map(a => {
            if (a.id !== id) return a;
            const nextLevel = Math.max(1, (a.level || 1) + delta);
            const cpCost = calculateAttributeCost(a.template as any, nextLevel);
            setSrAnnounce(`${a.template.name} level set to ${nextLevel}`);
            setIsDirty(true);
            return { ...a, level: nextLevel, cpCost } as CharacterAttribute;
          }));
        };

        const setDefectRankCtx = (id: string, delta: number) => {
          setFormDefects(prev => prev.map(d => {
            if (d.id !== id) return d;
            const tpl = d.template as DefectTemplate;
            const maxRank = tpl.max_rank || 1;
            const nextBase = Math.max(1, Math.min(maxRank, (d.rank || 1) + delta));
            const cpRefund = calculateDefectBonus(tpl, nextBase);
            setSrAnnounce(`${tpl.name} rank set to ${nextBase}`);
            setIsDirty(true);
            return { ...d, rank: nextBase, cpRefund } as CharacterDefect;
          }));
        };

        const setDefectRankAbsolute = (id: string, rank: number) => {
          setFormDefects(prev => prev.map(d => {
            if (d.id !== id) return d;
            const tpl = d.template as DefectTemplate;
            const maxRank = tpl.max_rank || 1;
            const next = Math.max(1, Math.min(maxRank, Math.trunc(rank || 1)));
            const cpRefund = calculateDefectBonus(tpl, next);
            setSrAnnounce(`${tpl.name} rank set to ${next}`);
            setIsDirty(true);
            return { ...d, rank: next, cpRefund } as CharacterDefect;
          }));
        };

        const bumpStatCtx = (key: 'body' | 'mind' | 'soul', delta: number) => {
          setStatDeltas(s => {
            const next = (s[key] + delta);
            setSrAnnounce(`${key.charAt(0).toUpperCase()}${key.slice(1)} set to ${next}`);
            setIsDirty(true);
            return { ...s, [key]: next };
          });
        };

        const srInstructions = (
          <div style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} aria-live="polite">
            Alternate Form editor. Tabs are Stats, Attributes, Defects, and Description. Use Left and Right arrow keys to switch tabs.
          </div>
        );

        return (
          <div style={{ color: 'var(--besm-dark-text)' }}>
            {srInstructions}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Form Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                  placeholder="e.g., Flame Form"
                  style={textInputStyle}
                  className="sheet-input"
                />
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 260 }}>
                <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700 }}>Level: {level}{typeof effectiveLevel === 'number' ? ` (${effectiveLevel})` : ''}</div>
                <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700 }}>Budget: {totalBudgetCP} CP</div>
                <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700 }}>Spent: {spentCP} CP</div>
                <div style={{ color: overBudget ? 'var(--besm-red)' : 'var(--besm-purple)', fontWeight: 800 }}>Remaining: {remainingCP} CP</div>
                <div style={{ marginTop: 6, background: '#eee', height: 8, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.round((spentCP / Math.max(1, totalBudgetCP)) * 100))}%`, height: '100%', background: 'var(--besm-pink)' }} />
                </div>
                {overBudget && (
                  <div style={{ marginTop: 6, color: 'var(--besm-red)', fontWeight: 800 }} aria-live="polite">
                    Over budget by {overBudgetBy} CP
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8, margin: '8px 0 12px 0', position: 'relative' }} role="tablist" aria-label="Alternate Form editor sections">
              <div style={{ display: 'flex', gap: 8 }}>
                {tabOrder.map((t, idx) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={activeTab === t.key}
                    aria-controls={`af-tabpanel-${t.key}`}
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
                      const nextIndex = e.key === 'ArrowRight' ? (currentIndex + 1) % count : (currentIndex - 1 + count) % count;
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
                      boxShadow: focusedTab === t.key ? '0 0 0 3px #ffffff, 0 0 0 6px var(--besm-pink)' : 'none',
                      transition: 'box-shadow 120ms ease-in-out'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Panels */}
            <div>
              {/* Stats */}
              <div role="tabpanel" id="af-tabpanel-stats" aria-labelledby="af-tab-stats" hidden={activeTab !== 'stats'} style={{ marginTop: 8 }}>
                <div style={contentPanelStyle}>
                  <h4 style={{ margin: 0, marginBottom: 8, color: 'var(--besm-black)' }}>Stat Adjustments (Deltas)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {(['body','mind','soul'] as const).map(stat => (
                      <div key={stat} style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 10, background: '#fff' }}>
                        <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--besm-pink)', marginBottom: 6 }}>{stat.toUpperCase()}</div>
                        <div
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); bumpStatCtx(stat, -1); }
                            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); bumpStatCtx(stat, +1); }
                          }}
                          aria-label={`${stat.toUpperCase()} stepper`}
                          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                          <button type="button" onClick={() => bumpStatCtx(stat, -1)} style={circlePinkLight}>-</button>
                          <div style={circleBlue} aria-live="polite" aria-atomic="true">{statDeltas[stat]}</div>
                          <button type="button" onClick={() => bumpStatCtx(stat, +1)} style={circlePink}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Derived + Movement */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                    <div style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 12, background: '#fff' }}>
                      <div style={{ fontFamily: 'var(--font-header)', color: 'var(--besm-pink)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>Derived Values</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 12, rowGap: 6 }}>
                        <div>Health Points (HP)</div><div>{derivedPreview.hp}</div>
                        <div>Energy Points (EP)</div><div>{derivedPreview.ep}</div>
                        <div>Attack Combat Value (ACV)</div><div>{derivedPreview.acv}</div>
                        <div>Defense Combat Value (DCV)</div><div>{derivedPreview.dcv}</div>
                        <div>Shock Value (SV)</div><div>{derivedPreview.sv}</div>
                        <div>Damage Multiplier (DM)</div><div>{derivedPreview.dm}x</div>
                        <div>Sanity Points (SaP)</div><div>{derivedPreview.sp}</div>
                        <div>Social Combat Value (SCV)</div><div>{derivedPreview.scv}</div>
                        <div>Social Points (SoP)</div><div>{derivedPreview.sop}</div>
                      </div>
                    </div>
                    <div style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 12, background: '#fff' }}>
                      <div style={{ fontFamily: 'var(--font-header)', color: 'var(--besm-pink)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>Movement</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 12, rowGap: 6 }}>
                        <div>Walk</div><div>{derivedPreview.movement.walk.toFixed(1)} m/rd</div>
                        <div>Jog</div><div>{derivedPreview.movement.jog.toFixed(1)} m/rd</div>
                        <div>Run</div><div>{derivedPreview.movement.run.toFixed(1)} m/rd</div>
                        <div>Sprint</div><div>{derivedPreview.movement.sprint.toFixed(1)} m/rd</div>
                        <div>Swim</div><div>{derivedPreview.movement.swim.toFixed(1)} m/rd</div>
                        <div>Crawl</div><div>{derivedPreview.movement.crawl.toFixed(1)} m/rd</div>
                        <div>Standing High Jump</div><div>{derivedPreview.movement.standingHighJump.toFixed(2)} m</div>
                        <div>Standing Long Jump</div><div>{derivedPreview.movement.standingLongJump.toFixed(2)} m</div>
                        <div>Running Long Jump</div><div>{derivedPreview.movement.runningLongJump.toFixed(2)} m</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--besm-dark-text)' }}>Stat Delta Cost: {statDeltaCost} CP • Stat Delta Refund: {statDeltaRefund} CP</div>
                </div>
              </div>

              {/* Attributes */}
              <div role="tabpanel" id="af-tabpanel-attributes" aria-labelledby="af-tab-attributes" hidden={activeTab !== 'attributes'} style={{ marginTop: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                            <div style={{ fontSize: 12, color: '#666' }}>{tpl.cost_per_level ?? 0} CP / level</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              aria-label={`More info about ${tpl.name}`}
                              aria-haspopup="dialog"
                              onClick={(e) => openInfoAtElement(tpl.description || '', (e.currentTarget as HTMLElement))}
                              style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                            >i</button>
                            <button style={{ ...buttonBase, background: 'var(--besm-light-gray)', color: 'var(--besm-dark-text)' }} onClick={() => handleAddFormAttribute(tpl)}>Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Form Attributes</div>
                    <div style={{ height: 330, overflow: 'auto', paddingRight: 4 }}>
                      {formAttributes.length === 0 && (
                        <div style={{ color: 'var(--besm-dark-text)' }}>No attributes selected.</div>
                      )}
                      {formAttributes.map((a) => (
                        <div key={a.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{ fontWeight: 700, color: 'var(--besm-dark-text)' }}
                                tabIndex={0}
                                aria-describedby="entity-sr-desc"
                                onMouseEnter={(e) => showTip(((a.template as unknown as OptionalAttrMeta)?.description) || '', e)}
                                onMouseMove={moveTip}
                                onMouseLeave={hideTip}
                                onFocus={(e) => { const desc = (a.template as unknown as OptionalAttrMeta)?.description || ''; setSrText(desc); showTipAtElement(desc, e.currentTarget); }}
                                onBlur={() => { hideTip(); setSrText(''); }}
                              >
                                {a.template.name}
                              </div>
                              <button
                                type="button"
                                aria-label={`More info about ${a.template.name}`}
                                aria-haspopup="dialog"
                                onClick={(e) => openInfoAtElement(((a.template as unknown as OptionalAttrMeta)?.description) || '', (e.currentTarget as HTMLElement))}
                                style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                              >i</button>
                            </div>
                            <button style={{ ...buttonBase, background: 'var(--besm-red)', color: 'white' }} onClick={() => handleRemoveFormAttribute(a.id)}>Remove</button>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                            <label style={labelStyle}>Level</label>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); bumpAttrLevelCtx(a.id, -1); }
                                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); bumpAttrLevelCtx(a.id, +1); }
                                if (e.key === 'Home') { e.preventDefault(); bumpAttrLevelCtx(a.id, -(a.level - 1)); }
                              }}
                              aria-label={`${a.template.name} level stepper`}
                            >
                              <button type="button" onClick={() => bumpAttrLevelCtx(a.id, -1)} style={circlePinkLight} aria-label={`Decrease ${a.template.name} level`}>-</button>
                              <div style={circleBlue} aria-live="polite" aria-atomic="true">{a.level}</div>
                              <button type="button" onClick={() => bumpAttrLevelCtx(a.id, +1)} style={circlePink} aria-label={`Increase ${a.template.name} level`}>+</button>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>Effective: {calculateEffectiveLevel(a)}</div>
                            <div style={{ marginLeft: 'auto', fontWeight: 700 }}>{calculateAttributeCost(a.template as any, a.level || 1)} CP</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                            <button style={{ ...buttonBase, background: 'var(--besm-yellow)', border: '1px solid black', color: '#000' }} onClick={() => openEnhancementsFor(a)}>Enhancements ({(a.enhancements || []).reduce((s, e) => s + (e.template?.picks || 1), 0)})</button>
                            <button style={{ ...buttonBase, background: 'var(--besm-yellow)', border: '1px solid black', color: '#000' }} onClick={() => openLimitersFor(a)}>Limiters ({(a.limiters || []).reduce((s, l) => s + ((l.template?.picks || 1) * (l.assignments || 1)), 0)})</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Defects */}
              <div role="tabpanel" id="af-tabpanel-defects" aria-labelledby="af-tab-defects" hidden={activeTab !== 'defects'} style={{ marginTop: 8 }}>
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
                            <div style={{ fontSize: 12, color: '#666' }}>Refund {tpl.cp_refund ?? 0} CP / rank • Max {tpl.max_rank}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              aria-label={`More info about ${tpl.name}`}
                              aria-haspopup="dialog"
                              onClick={(e) => openInfoAtElement(tpl.description || '', (e.currentTarget as HTMLElement))}
                              style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                            >i</button>
                            <button style={{ ...buttonBase, background: 'var(--besm-light-gray)', color: 'var(--besm-dark-text)' }} onClick={() => handleAddDefect(tpl)}>Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Form Defects</div>
                    <div style={{ height: 330, overflow: 'auto', paddingRight: 4 }}>
                      {formDefects.length === 0 && (
                        <div style={{ color: 'var(--besm-dark-text)' }}>No defects selected.</div>
                      )}
                      {formDefects.map((d) => (
                        <div key={d.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{ fontWeight: 700, color: 'var(--besm-dark-text)' }}
                                tabIndex={0}
                                aria-describedby="entity-sr-desc"
                                onMouseEnter={(e) => showTip(((d.template as unknown as OptionalDefectMeta)?.description) || '', e)}
                                onMouseMove={moveTip}
                                onMouseLeave={hideTip}
                                onFocus={(e) => { const desc = (d.template as unknown as OptionalDefectMeta)?.description || ''; setSrText(desc); showTipAtElement(desc, e.currentTarget); }}
                                onBlur={() => { hideTip(); setSrText(''); }}
                              >
                                {d.template.name}
                              </div>
                              <button
                                type="button"
                                aria-label={`More info about ${d.template.name}`}
                                aria-haspopup="dialog"
                                onClick={(e) => openInfoAtElement(((d.template as unknown as OptionalDefectMeta)?.description) || '', (e.currentTarget as HTMLElement))}
                                style={{ border: '1px solid #ccc', background: '#fff', color: '#333', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                              >i</button>
                            </div>
                            <button style={{ ...buttonBase, background: 'var(--besm-red)', color: 'white' }} onClick={() => handleRemoveDefect(d.id)}>Remove</button>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                            <label style={labelStyle}>Rank</label>
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                const tpl = d.template as DefectTemplate;
                                const maxRank = tpl.max_rank || 1;
                                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setDefectRankCtx(d.id, -1); }
                                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setDefectRankCtx(d.id, +1); }
                                if (e.key === 'Home') { e.preventDefault(); setDefectRankAbsolute(d.id, 1); }
                                if (e.key === 'End') { e.preventDefault(); setDefectRankAbsolute(d.id, maxRank); }
                              }}
                              aria-label={`${d.template.name} rank stepper`}
                            >
                              <button type="button" onClick={() => setDefectRankCtx(d.id, -1)} style={circlePinkLight} aria-label={`Decrease ${d.template.name} rank`}>-</button>
                              <div style={circleBlue} aria-live="polite" aria-atomic="true">{d.rank}</div>
                              <button type="button" onClick={() => setDefectRankCtx(d.id, +1)} style={circlePink} aria-label={`Increase ${d.template.name} rank`}>+</button>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>Max: {d.template.max_rank || 1}</div>
                            <div style={{ marginLeft: 'auto', fontWeight: 700 }}>Refund {d.cpRefund || 0} CP</div>
                          </div>
                          {d.template.requires_description && (
                            <div style={{ marginTop: 8 }}>
                              <label style={labelStyle}>Notes / Details</label>
                              <textarea
                                value={d.notes || ''}
                                onChange={(e) => { setFormDefects(prev => prev.map(def => def.id === d.id ? { ...def, notes: e.target.value } : def)); setIsDirty(true); }}
                                rows={2}
                                style={{ ...textInputStyle, resize: 'vertical', minHeight: 60 }}
                                placeholder="Describe specifics for this defect"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div role="tabpanel" id="af-tabpanel-description" aria-labelledby="af-tab-description" hidden={activeTab !== 'description'} style={{ marginTop: 8 }}>
                <div style={contentPanelStyle}>
                  <h4 style={{ margin: 0, marginBottom: 8, color: 'var(--besm-black)' }}>Form Notes / Description</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
                    rows={10}
                    style={{ width: '100%', border: '1px solid var(--besm-light-gray)', borderRadius: 6, padding: 8, minHeight: 380, resize: 'vertical' }}
                    placeholder="Describe the form's appearance, trigger, and theme..."
                  />
                </div>
              </div>
            </div>

            {/* Hidden input for Import from Library */}
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFileChange}
              style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
              aria-hidden
              tabIndex={-1}
            />

            <EditorFooterActions
              onCancel={handleRequestClose}
              onImport={handleImportFromLibrary}
              onExport={handleExportToLibrary}
              onSave={handleSave}
              saveLabel="Save Form"
            />

            {/* Enhancement / Limiter Modals */}
            {enhModalOpen && activeAttrForMods && (
              <EnhancementsModal
                isOpen={enhModalOpen}
                onClose={() => setEnhModalOpen(false)}
                attribute={activeAttrForMods.template}
                currentEnhancements={activeAttrForMods.enhancements || []}
                onAddEnhancement={handleAddEnhancementToActive}
              />
            )}
            {limModalOpen && activeAttrForMods && (
              <LimitersModal
                isOpen={limModalOpen}
                onClose={() => setLimModalOpen(false)}
                attribute={activeAttrForMods.template}
                currentLimiters={activeAttrForMods.limiters || []}
                onAddLimiter={handleAddLimiterToActive}
              />
            )}

            {/* Discard changes confirmation */}
            {confirmOpen && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}>
                <div style={{ background: 'white', borderRadius: 10, padding: 24, maxWidth: 400, boxShadow: '0 10px 24px rgba(0,0,0,0.3)' }}>
                  <h3 style={{ margin: 0, marginBottom: 12, color: 'var(--besm-black)' }}>Discard Changes?</h3>
                  <p style={{ margin: 0, marginBottom: 16, color: 'var(--besm-dark-text)' }}>You have unsaved changes. Are you sure you want to close without saving?</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={() => setConfirmOpen(false)} style={{ ...buttonBase, background: 'var(--besm-light-gray)', color: 'var(--besm-dark-text)' }}>Cancel</button>
                    <button onClick={() => { setConfirmOpen(false); setIsDirty(false); onClose(); }} style={{ ...buttonBase, background: 'var(--besm-red)', color: 'white' }}>Discard</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </EntityBuilderModal>
  );
};

export default AlternateFormBuilderModal;
