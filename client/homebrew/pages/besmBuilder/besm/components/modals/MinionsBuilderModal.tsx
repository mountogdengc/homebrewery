import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  BesmCharacter,
  CharacterAttribute,
  CharacterDefect,
  AttributeEnhancement,
  AttributeLimiter,
  MinionsConfig,
} from '../../types/besm-character';
import { AttributeTemplate, ATTRIBUTES_LIBRARY, calculateAttributeCost, getAttributeByKey } from '../../data/attributesLibrary';
import { DEFECTS_LIBRARY, calculateDefectBonus, getDefectByKey } from '../../data/defectsLibrary';
import type { DefectTemplate } from '../../data/defectsLibrary';
import { getEnhancementByKey } from '../../data/enhancementsLibrary';
import { getLimiterByKey } from '../../data/limitersLibrary';
import { exportLibraryFile, parseLibraryFile } from '../../utils/userLibrary';
import EnhancementsModal from './EnhancementsModal';
import LimitersModal from './LimitersModal';
import { EntityBuilderModal } from '../common/EntityBuilderModal';
import { EditorFooterActions } from '../common/EditorFooterActions';

interface MinionsBuilderModalProps {
  open: boolean;
  onClose: () => void;
  attributeId?: string; // The Minions attribute id this config attaches to
  level: number; // actual level on Minions attribute (determines count)
  effectiveLevel?: number; // display-only per BESM (enh/lim affect effective level)
  character: BesmCharacter; // used to compute per-minion budget
  existingConfig?: MinionsConfig;
  computePerMinionBudget?: (totalCP: number) => number; // default floor(totalCP/5)
  onSave: (config: MinionsConfig) => void; // parent will call saveMinionsConfig
}

const MinionsBuilderModal: React.FC<MinionsBuilderModalProps> = ({
  open,
  onClose,
  level,
  effectiveLevel,
  character,
  existingConfig,
  computePerMinionBudget,
  onSave,
}) => {
  const [name, setName] = useState(existingConfig?.name || 'Minion Build');
  const [notes, setNotes] = useState(existingConfig?.notes || '');
  const [minionAttributes, setMinionAttributes] = useState<CharacterAttribute[]>(existingConfig?.minionAttributes || []);
  const [minionDefects, setMinionDefects] = useState<CharacterDefect[]>(existingConfig?.minionDefects || []);
  const [statDeltas, setStatDeltas] = useState<{ body: number; mind: number; soul: number }>(existingConfig?.statDeltas || { body: 0, mind: 0, soul: 0 });
  // Lightweight optional meta for derived bonuses on attributes
  type OptionalAttrMeta = { stat_mods?: { derived?: Record<string, number> }; description?: string };
  type OptionalDefectMeta = { description?: string };

  // Enhancements / Limiters modal state per attribute
  const [enhModalOpen, setEnhModalOpen] = useState(false);
  const [limModalOpen, setLimModalOpen] = useState(false);
  const [activeAttrForMods, setActiveAttrForMods] = useState<CharacterAttribute | null>(null);

  const perMinionBudgetCP = useMemo(() => {
    if (computePerMinionBudget) return computePerMinionBudget(character?.totalCP || 0);
    const total = character?.totalCP || 0;
    return Math.max(0, Math.floor(total / 5));
  }, [character?.totalCP, computePerMinionBudget]);

  // Tiered stat cost per BESM rule: 2/pt to 12, then 4/pt after
  const statCostTotal = (value: number) => {
    if ((value || 0) <= 0) return 0;
    const v = Math.trunc(Math.max(0, value || 0));
    return v <= 12 ? v * 2 : 24 + (v - 12) * 4;
  };

  const statsCost = useMemo(() => (
    statCostTotal(statDeltas.body) +
    statCostTotal(statDeltas.mind) +
    statCostTotal(statDeltas.soul)
  ), [statDeltas]);

  // Spent CP per minion build = stat costs + attribute costs - defect refunds
  const spentCP = useMemo(() => {
    const attrCost = minionAttributes.reduce((t, a) => t + calculateAttributeCost(a.template as any, Math.max(1, a.level || 1)), 0);
    const defectRefund = minionDefects.reduce((t, d) => {
      const rank = Math.max(1, d.rank || 1);
      const key = (d.template?.key || '').toLowerCase();
      const nameL = (d.template?.name || '').toLowerCase();
      const libD = DEFECTS_LIBRARY.find(tl => (tl.key || '').toLowerCase() === key)
        || DEFECTS_LIBRARY.find(tl => (tl.name || '').toLowerCase() === nameL)
        || DEFECTS_LIBRARY.find(tl => (tl.key || '').toLowerCase() === nameL.replace(/\s+/g,'_'))
        || DEFECTS_LIBRARY.find(tl => (tl.key || '').toLowerCase() === nameL.replace(/\s+/g,'-'));
      const per = libD?.cp_refund ?? d.template?.cp_refund ?? 0;
      const refund = d.cpRefund && d.cpRefund > 0 ? d.cpRefund : per * rank;
      return t + refund;
    }, 0);
    return Math.max(0, statsCost + attrCost - defectRefund);
  }, [minionAttributes, minionDefects, statsCost]);

  const remainingCP = Math.max(0, perMinionBudgetCP - spentCP);
  const overBudgetBy = Math.max(0, spentCP - perMinionBudgetCP);
  const overBudget = overBudgetBy > 0;

  // Aggregate derived bonuses from selected minion attributes
  const derivedBonuses = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of minionAttributes) {
      const tpl: any = a.template as unknown as OptionalAttrMeta;
      const d = tpl?.stat_mods?.derived;
      if (!d) continue;
      for (const key of Object.keys(d)) {
        const perLevel = Number(d[key]) || 0;
        out[key] = (out[key] || 0) + perLevel * (a.level || 1);
      }
    }
    return out;
  }, [minionAttributes]);

  // Compute derived preview from stat deltas + bonuses
  const derivedPreview = useMemo(() => {
    const body = statDeltas.body || 0;
    const mind = statDeltas.mind || 0;
    const soul = statDeltas.soul || 0;
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
    const fastMultiplier = (() => {
      try {
        return (minionAttributes || []).reduce((mult, a) => {
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
  }, [statDeltas, derivedBonuses, minionAttributes]);

  useEffect(() => {
    if (open && existingConfig) {
      setName(existingConfig.name || 'Minion Build');
      setNotes(existingConfig.notes || '');
      setStatDeltas(existingConfig.statDeltas || { body: 0, mind: 0, soul: 0 });
      // Sync costs from library for safety
      const syncedAttrs = (existingConfig.minionAttributes || []).map(a => {
        const levelSafe = Math.max(1, a.level || 1);
        const key = (a.template?.key || '').toLowerCase();
        const nameL = (a.template?.name || '').toLowerCase();
        const libT = ATTRIBUTES_LIBRARY.find(t => (t.key || '').toLowerCase() === key)
          || ATTRIBUTES_LIBRARY.find(t => (t.name || '').toLowerCase() === nameL)
          || ATTRIBUTES_LIBRARY.find(t => (t.key || '').toLowerCase() === nameL.replace(/\s+/g,'_'))
          || ATTRIBUTES_LIBRARY.find(t => (t.key || '').toLowerCase() === nameL.replace(/\s+/g,'-'));
        const per = libT?.cost_per_level ?? a.template?.cost_per_level ?? 0;
        const cpCost = a.cpCost && a.cpCost > 0 ? a.cpCost : per * levelSafe;
        return { ...a, level: levelSafe, cpCost } as CharacterAttribute;
      });
      const syncedDefects = (existingConfig.minionDefects || []).map(d => {
        const rankSafe = Math.max(1, d.rank || 1);
        const key = (d.template?.key || '').toLowerCase();
        const nameL = (d.template?.name || '').toLowerCase();
        const libD = DEFECTS_LIBRARY.find(t => (t.key || '').toLowerCase() === key)
          || DEFECTS_LIBRARY.find(t => (t.name || '').toLowerCase() === nameL)
          || DEFECTS_LIBRARY.find(t => (t.key || '').toLowerCase() === nameL.replace(/\s+/g,'_'))
          || DEFECTS_LIBRARY.find(t => (t.key || '').toLowerCase() === nameL.replace(/\s+/g,'-'));
        const perRank = libD?.cp_refund ?? d.template?.cp_refund ?? 0;
        const cpRefund = d.cpRefund && d.cpRefund > 0 ? d.cpRefund : perRank * rankSafe;
        return { ...d, rank: rankSafe, cpRefund } as CharacterDefect;
      });
      setMinionAttributes(syncedAttrs);
      setMinionDefects(syncedDefects);
    }
    if (!open && !existingConfig) {
      setName('Minion Build');
      setNotes('');
      setMinionAttributes([]);
      setMinionDefects([]);
      setStatDeltas({ body: 0, mind: 0, soul: 0 });
    }
  }, [open, existingConfig]);

  // Attribute search within modal
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

  // Tabs: Attributes / Defects / Description
  type TabKey = 'stats' | 'attributes' | 'defects' | 'description';
  const [activeTab, setActiveTab] = useState<TabKey>('stats');
  const [focusedTab, setFocusedTab] = useState<TabKey | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ stats: null, attributes: null, defects: null, description: null });
  const tabOrder: { key: TabKey; label: string }[] = [
    { key: 'stats', label: 'Stats' },
    { key: 'attributes', label: 'Attributes' },
    { key: 'defects', label: 'Defects' },
    { key: 'description', label: 'Description' },
  ];
  const contentPanelStyle: React.CSSProperties = {
    border: '2px solid var(--besm-purple)', borderRadius: 8, padding: 16, background: 'var(--besm-light-bg)', height: 460, overflowY: 'auto',
  };

  const handleAddMinionAttribute = (template: AttributeTemplate) => {
    const exists = minionAttributes.some(a => (a.template?.key || '') === (template.key || ''));
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
    setMinionAttributes(prev => [...prev, newAttr]);
  };

  const handleRemoveMinionAttribute = (id: string) => {
    setMinionAttributes(prev => prev.filter(a => a.id !== id));
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
    setMinionAttributes(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, enhancements: [...(a.enhancements || []), enh] } : a));
  };

  const handleAddLimiterToActive = (lim: AttributeLimiter) => {
    if (!activeAttrForMods) return;
    setMinionAttributes(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, limiters: [...(a.limiters || []), lim] } : a));
  };

  const countEnhancementPicks = (attr: CharacterAttribute) => (attr.enhancements || []).reduce((s, e) => s + (e.template?.picks || 1), 0);
  const countLimiterPicks = (attr: CharacterAttribute) => (attr.limiters || []).reduce((s, l) => s + ((l.template?.picks || 1) * (l.assignments || 1)), 0);

  const handleAddDefect = (template: DefectTemplate) => {
    const existing = minionDefects.find(d => d.template?.key === template.key);
    if (existing) return;
    const rank = 1;
    const cpRefund = calculateDefectBonus(template, rank) ?? (template.cp_refund || 0) * rank;
    const newDef: CharacterDefect = {
      id: uuidv4(),
      template,
      rank,
      cpRefund,
      notes: '',
      source: 'custom',
    } as CharacterDefect;
    setMinionDefects(prev => [...prev, newDef]);
  };

  const handleRemoveDefect = (id: string) => {
    setMinionDefects(prev => prev.filter(d => d.id !== id));
  };

  const minionsTemplate = useMemo(() => getAttributeByKey('minions'), []);
  const minionCountLabel = useMemo(() => {
    const levels = minionsTemplate?.levels as Record<number, string | { description?: string }> | undefined;
    const actualLevel = level || 1;
    const raw = levels?.[actualLevel];
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    // AttributeLevel object: use its description field
    if (typeof raw === 'object' && typeof raw.description === 'string') return raw.description;
    return '';
  }, [minionsTemplate, level]);

  const handleSave = () => {
    const config: MinionsConfig = {
      id: existingConfig?.id || uuidv4(),
      name: name || 'Minion Build',
      notes,
      iconUrl: existingConfig?.iconUrl,
      level,
      perMinionBudgetCP: perMinionBudgetCP,
      minionAttributes,
      minionDefects,
      statDeltas,
      spentCP,
      remainingCP,
    } as MinionsConfig;
    onSave(config);
    onClose();
  };

  // Import/Export to local JSON library
  const importInputRef = useRef<HTMLInputElement>(null);
  const handleExportToLibrary = () => {
    const config: MinionsConfig = {
      id: existingConfig?.id || uuidv4(),
      name: name || 'Minion Build',
      notes,
      iconUrl: existingConfig?.iconUrl,
      level,
      perMinionBudgetCP: perMinionBudgetCP,
      minionAttributes,
      minionDefects,
      statDeltas,
      spentCP,
      remainingCP,
    } as MinionsConfig;
    exportLibraryFile('minions', 1, config, { prefix: 'BESM_minions', baseName: config.name });
  };
  const handleImportFromLibrary = () => {
    importInputRef.current?.click();
  };
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const parsed = await parseLibraryFile<Partial<MinionsConfig>>(file, 'minions');
      const data: Partial<MinionsConfig> = (parsed as any).data ?? (parsed as any);
      if (!data || typeof data !== 'object') throw new Error('Invalid file format');

      setName((data.name as string) || 'Minion Build');
      setNotes(typeof data.notes === 'string' ? data.notes : '');
      if (data.statDeltas && typeof (data.statDeltas as any).body === 'number') {
        setStatDeltas({
          body: Math.max(0, Math.trunc((data.statDeltas as any).body || 0)),
          mind: Math.max(0, Math.trunc((data.statDeltas as any).mind || 0)),
          soul: Math.max(0, Math.trunc((data.statDeltas as any).soul || 0)),
        });
      } else {
        setStatDeltas({ body: 0, mind: 0, soul: 0 });
      }

      // Map attributes back from keys
      if (Array.isArray(data.minionAttributes)) {
        const mappedAttrs = (data.minionAttributes as any[])
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
            const newAttr: CharacterAttribute = {
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
            return newAttr;
          })
          .filter(Boolean) as CharacterAttribute[];
        setMinionAttributes(mappedAttrs);
      } else {
        setMinionAttributes([]);
      }

      // Map defects back from keys
      if (Array.isArray(data.minionDefects)) {
        const mappedDefs = (data.minionDefects as any[])
          .map((d) => {
            const tplKey = d?.template?.key ?? d?.key;
            const tpl = tplKey ? getDefectByKey(tplKey) : undefined;
            if (!tpl) return null;
            const rank = Math.max(1, Math.min(tpl.max_rank || 1, Math.trunc(d.rank || 1)));
            const cpRefund = calculateDefectBonus(tpl, rank) ?? (tpl.cp_refund || 0) * rank;
            const newDef: CharacterDefect = {
              id: uuidv4(),
              template: tpl,
              rank,
              cpRefund,
              notes: d.notes || '',
              source: 'custom',
              customInputs: {},
            };
            return newDef;
          })
          .filter(Boolean) as CharacterDefect[];
        setMinionDefects(mappedDefs);
      } else {
        setMinionDefects([]);
      }

      // reset input to allow re-import same file
      if (importInputRef.current) importInputRef.current.value = '' as any;
    } catch (err) {
      console.error('Failed to import minions file', err);
      alert('Failed to import file. Please ensure it is a valid Minions JSON export.');
    }
  };

  // Styles
  const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 };
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
    padding: '10px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, letterSpacing: 0.5,
  };
  // Circular steppers (mirror Companion)
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
  // Note: keep only used style constants to avoid lints
  return (
    <EntityBuilderModal
      isOpen={open}
      onClose={onClose}
      title="Edit Minions"
      maxWidth="900px"
      storageKey="besm_minions_prefs_v1"
      showGear={true}
      renderTooltipLayer={true}
      renderInfoLayer={true}
      renderScreenReaderRegions={true}
    >
      {(ctx) => {
        const { setSrAnnounce, showTip, moveTip, hideTip, showTipAtElement, openInfoAtElement, setSrText } = ctx;

        const bumpAttrLevelCtx = (id: string, delta: number) => {
          setMinionAttributes(prev => prev.map(a => {
            if (a.id !== id) return a;
            const nextLevel = Math.max(1, (a.level || 1) + delta);
            const cpCost = calculateAttributeCost(a.template as any, nextLevel);
            setSrAnnounce(`${a.template.name} level set to ${nextLevel}`);
            return { ...a, level: nextLevel, cpCost } as CharacterAttribute;
          }));
        };

        const setDefectRankCtx = (id: string, delta: number) => {
          setMinionDefects(prev => prev.map(d => {
            if (d.id !== id) return d;
            const tpl = d.template as DefectTemplate;
            const maxRank = tpl.max_rank || 1;
            const nextBase = Math.max(1, Math.min(maxRank, (d.rank || 1) + delta));
            const cpRefund = calculateDefectBonus(tpl, nextBase) ?? (tpl.cp_refund || 0) * nextBase;
            setSrAnnounce(`${tpl.name} rank set to ${nextBase}`);
            return { ...d, rank: nextBase, cpRefund } as CharacterDefect;
          }));
        };

        const setDefectRankAbsolute = (id: string, rank: number) => {
          setMinionDefects(prev => prev.map(d => {
            if (d.id !== id) return d;
            const tpl = d.template as DefectTemplate;
            const maxRank = tpl.max_rank || 1;
            const next = Math.max(1, Math.min(maxRank, Math.trunc(rank || 1)));
            const cpRefund = calculateDefectBonus(tpl, next) ?? (tpl.cp_refund || 0) * next;
            setSrAnnounce(`${tpl.name} rank set to ${next}`);
            return { ...d, rank: next, cpRefund } as CharacterDefect;
          }));
        };

        // Hidden SR instructions
        const srInstructions = (
          <div style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} aria-live="polite">
            Minions editor. Tabs are Attributes, Defects, and Description. Use Left and Right arrow keys to switch tabs. For steppers, focus the control and use Left/Down to decrease and Right/Up to increase.
          </div>
        );

        return (
        <div style={{ color: 'var(--besm-dark-text)' }}>
          {srInstructions}
          <div style={headerStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Build Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Goblin Squad"
                style={textInputStyle}
                className="sheet-input"
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <label style={labelStyle}>Minions Level</label>
              <div style={{ fontWeight: 800, color: 'var(--besm-dark-text)', padding: '8px 10px' }}>
                Level {level}{typeof effectiveLevel === 'number' ? ` (${effectiveLevel})` : ''}
              </div>
              {minionCountLabel && (
                <div style={{ fontSize: 12, color: 'var(--besm-dark-text)', padding: '0 10px' }}>Count: {minionCountLabel}</div>
              )}
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 260 }}>
              <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700 }}>Per-Min Budget: {perMinionBudgetCP}</div>
              <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700 }}>Spent: {spentCP}</div>
              <div style={{ color: overBudget ? 'var(--besm-red)' : 'var(--besm-purple)', fontWeight: 800 }}>Remaining: {remainingCP}</div>
              <div style={{ marginTop: 6, background: '#eee', height: 8, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.round((spentCP / Math.max(1, perMinionBudgetCP)) * 100))}%`, height: '100%', background: 'var(--besm-pink)' }} />
              </div>
              {overBudget && (
                <div style={{ marginTop: 6, color: 'var(--besm-red)', fontWeight: 800 }} aria-live="polite">
                  Over budget by {overBudgetBy} CP
                </div>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8, margin: '8px 0 12px 0', position: 'relative' }} role="tablist" aria-label="Minions editor sections">
            <div style={{ display: 'flex', gap: 8 }}>
              {tabOrder.map((t, idx) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  aria-controls={`minions-tabpanel-${t.key}`}
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
            <div role="tabpanel" id="minions-tabpanel-stats" aria-labelledby="minions-tab-stats" hidden={activeTab !== 'stats'} style={{ marginTop: 8 }}>
              <div style={contentPanelStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {(['body','mind','soul'] as const).map(stat => (
                    <div key={stat} style={{ border: '2px solid var(--besm-purple)', borderRadius: 12, padding: 10, background: '#fff' }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--besm-pink)', marginBottom: 6 }}>{stat.toUpperCase()}</div>
                      <div
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            setStatDeltas(prev => { const nextVal = Math.max(0, Math.trunc(prev[stat] - 1)); const next = { ...prev, [stat]: nextVal }; ctx.setSrAnnounce(`${stat.toUpperCase()} set to ${nextVal}`); return next; });
                          }
                          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                            e.preventDefault();
                            setStatDeltas(prev => { const nextVal = Math.max(0, Math.trunc(prev[stat] + 1)); const next = { ...prev, [stat]: nextVal }; ctx.setSrAnnounce(`${stat.toUpperCase()} set to ${nextVal}`); return next; });
                          }
                        }}
                        aria-label={`${stat.toUpperCase()} stepper`}
                        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <button type="button" onClick={() => setStatDeltas(prev => { const nextVal = Math.max(0, Math.trunc(prev[stat] - 1)); const next = { ...prev, [stat]: nextVal }; ctx.setSrAnnounce(`${stat.toUpperCase()} set to ${nextVal}`); return next; })} style={circlePinkLight}>-</button>
                        <div style={circleBlue} aria-live="polite" aria-atomic="true">{statDeltas[stat]}</div>
                        <button type="button" onClick={() => setStatDeltas(prev => { const nextVal = Math.max(0, Math.trunc(prev[stat] + 1)); const next = { ...prev, [stat]: nextVal }; ctx.setSrAnnounce(`${stat.toUpperCase()} set to ${nextVal}`); return next; })} style={circlePink}>+</button>
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
              </div>
            </div>
            {/* Attributes */}
            <div role="tabpanel" id="minions-tabpanel-attributes" aria-labelledby="minions-tab-attributes" hidden={activeTab !== 'attributes'} style={{ marginTop: 8 }}>
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
                          <button style={{ ...buttonBase, background: 'var(--besm-light-gray)', color: 'var(--besm-dark-text)' }} onClick={() => handleAddMinionAttribute(tpl)}>Add</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Selected Attributes</div>
                  <div style={{ height: 330, overflow: 'auto', paddingRight: 4 }}>
                    {minionAttributes.length === 0 && (
                      <div style={{ color: 'var(--besm-dark-text)' }}>No attributes selected.</div>
                    )}
                    {minionAttributes.map((a) => (
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
                          <button style={{ ...buttonBase, background: 'var(--besm-red)', color: 'white' }} onClick={() => handleRemoveMinionAttribute(a.id)}>Remove</button>
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
                          <button style={{ ...buttonBase, background: 'var(--besm-yellow)', border: '1px solid black', color: '#000' }} onClick={() => openEnhancementsFor(a)}>Enhancements ({countEnhancementPicks(a)})</button>
                          <button style={{ ...buttonBase, background: 'var(--besm-yellow)', border: '1px solid black', color: '#000' }} onClick={() => openLimitersFor(a)}>Limiters ({countLimiterPicks(a)})</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Defects */}
          <div role="tabpanel" id="minions-tabpanel-defects" aria-labelledby="minions-tab-defects" hidden={activeTab !== 'defects'} style={{ marginTop: 8 }}>
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
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Selected Defects</div>
                <div style={{ height: 330, overflow: 'auto', paddingRight: 4 }}>
                  {minionDefects.length === 0 && (
                    <div style={{ color: 'var(--besm-dark-text)' }}>No defects selected.</div>
                  )}
                  {minionDefects.map((d) => (
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
                            onChange={(e) => setMinionDefects(prev => prev.map(def => def.id === d.id ? { ...def, notes: e.target.value } : def))}
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
          <div role="tabpanel" id="minions-tabpanel-description" aria-labelledby="minions-tab-description" hidden={activeTab !== 'description'} style={{ marginTop: 8 }}>
            <div style={contentPanelStyle}>
              <h4 style={{ margin: 0, marginBottom: 8, color: 'var(--besm-black)' }}>Notes</h4>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={10} style={{ width: '100%', border: '1px solid var(--besm-light-gray)', borderRadius: 6, padding: 8, minHeight: 280 }} />
              <div style={{ marginTop: 16, border: '1px solid var(--besm-light-gray)', borderRadius: 6, padding: 12 }}>
                <h4 style={{ margin: 0, marginBottom: 8, color: 'var(--besm-black)' }}>Per-Minions Summary</h4>
                <div style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>Each minion budget: {perMinionBudgetCP} CP</div>
                <div style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>Spent per minion: {spentCP} CP</div>
                <div style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>Remaining per minion: {remainingCP} CP</div>
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
            onCancel={onClose}
            onImport={handleImportFromLibrary}
            onExport={handleExportToLibrary}
            onSave={handleSave}
            saveLabel="Save"
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
        </div>
        );
      }}
    </EntityBuilderModal>
  );
};

export default MinionsBuilderModal;
