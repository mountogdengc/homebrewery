import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CharacterAttribute, CharacterDefect, AttributeEnhancement, AttributeLimiter } from '../../types/besm-character';
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

export interface ItemConfig {
  id: string;
  name: string;
  description?: string;
  itemAttributes: CharacterAttribute[];
  itemDefects: CharacterDefect[];
  spentCP: number;
}

interface ItemBuilderModalProps {
  open: boolean;
  onClose: () => void;
  existingConfig?: ItemConfig;
  onSave: (config: ItemConfig) => void;
}

type TabKey = 'attributes' | 'defects' | 'description';
type OptionalAttrMeta = { max_level?: number; description?: string };
type OptionalDefectMeta = { description?: string };

const tabOrder: { key: TabKey; label: string }[] = [
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

const ItemBuilderModal: React.FC<ItemBuilderModalProps> = ({
  open,
  onClose,
  existingConfig,
  onSave,
}) => {
  const [name, setName] = useState(existingConfig?.name || '');
  const [description, setDescription] = useState(existingConfig?.description || '');
  const [itemAttributes, setItemAttributes] = useState<CharacterAttribute[]>(existingConfig?.itemAttributes || []);
  const [itemDefects, setItemDefects] = useState<CharacterDefect[]>(existingConfig?.itemDefects || []);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('attributes');
  const [focusedTab, setFocusedTab] = useState<TabKey | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ attributes: null, defects: null, description: null });

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

  // Item CP calculation: (attributes cost - defects refund) / 2
  const spentCP = useMemo(() => {
    const attrCost = itemAttributes.reduce((t, a) => t + calculateAttributeCost(a.template as any, Math.max(1, a.level || 1)), 0);
    const defectRefund = itemDefects.reduce((t, d) => {
      const rank = Math.max(1, d.rank || 1);
      return t + calculateDefectBonus(d.template as DefectTemplate, rank);
    }, 0);
    const netPoints = Math.max(0, attrCost - defectRefund);
    return Math.max(0, Math.floor(netPoints / 2));
  }, [itemAttributes, itemDefects]);

  useEffect(() => {
    if (!open) return;
    setActiveTab('attributes');
    if (existingConfig) {
      setName(existingConfig.name || '');
      setDescription(existingConfig.description || '');
      const syncedAttrs = (existingConfig.itemAttributes || []).map(a => {
        const levelSafe = Math.max(1, a.level || 1);
        const cpCost = calculateAttributeCost(a.template as any, levelSafe);
        return { ...a, level: levelSafe, cpCost } as CharacterAttribute;
      });
      const syncedDefects = (existingConfig.itemDefects || []).map(d => {
        const rankSafe = Math.max(1, d.rank || 1);
        const cpRefund = calculateDefectBonus(d.template as DefectTemplate, rankSafe);
        return { ...d, rank: rankSafe, cpRefund } as CharacterDefect;
      });
      setItemAttributes(syncedAttrs);
      setItemDefects(syncedDefects);
    } else {
      setName('');
      setDescription('');
      setItemAttributes([]);
      setItemDefects([]);
    }
    setIsDirty(false);
  }, [open, existingConfig]);

  const handleRequestClose = () => {
    if (isDirty) { setConfirmOpen(true); return; }
    onClose();
  };

  const handleAddItemAttribute = (template: AttributeTemplate) => {
    const exists = itemAttributes.some(a => (a.template?.key || '') === (template.key || ''));
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
    setItemAttributes(prev => [...prev, newAttr]);
    setIsDirty(true);
  };

  const handleRemoveItemAttribute = (id: string) => {
    setItemAttributes(prev => prev.filter(a => a.id !== id));
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
    setItemAttributes(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, enhancements: [...(a.enhancements || []), enh] } : a));
    setIsDirty(true);
  };

  const handleAddLimiterToActive = (lim: AttributeLimiter) => {
    if (!activeAttrForMods) return;
    setItemAttributes(prev => prev.map(a => a.id === activeAttrForMods.id ? { ...a, limiters: [...(a.limiters || []), lim] } : a));
    setIsDirty(true);
  };

  const handleAddDefect = (template: DefectTemplate) => {
    const existing = itemDefects.find(d => d.template?.key === template.key);
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
    setItemDefects(prev => [...prev, newDef]);
    setIsDirty(true);
  };

  const handleRemoveDefect = (id: string) => {
    setItemDefects(prev => prev.filter(d => d.id !== id));
    setIsDirty(true);
  };

  const handleSave = () => {
    const config: ItemConfig = {
      id: existingConfig?.id || uuidv4(),
      name: name || 'Enchanted Item',
      description,
      itemAttributes,
      itemDefects,
      spentCP,
    };
    onSave(config);
    setIsDirty(false);
    onClose();
  };

  // Import/Export
  const importInputRef = useRef<HTMLInputElement>(null);
  const handleExportToLibrary = () => {
    const config: ItemConfig = {
      id: existingConfig?.id || uuidv4(),
      name: name || 'Enchanted Item',
      description,
      itemAttributes,
      itemDefects,
      spentCP,
    };
    exportLibraryFile('item', 1, config, { prefix: 'BESM_item', baseName: config.name });
  };

  const handleImportFromLibrary = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const parsed = await parseLibraryFile<Partial<ItemConfig>>(file, 'item');
      const data: Partial<ItemConfig> = (parsed as any).data ?? (parsed as any);
      if (!data || typeof data !== 'object') throw new Error('Invalid file format');

      setName((data.name as string) || 'Enchanted Item');
      setDescription(typeof data.description === 'string' ? data.description : '');

      if (Array.isArray(data.itemAttributes)) {
        const mappedAttrs = (data.itemAttributes as any[])
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
        setItemAttributes(mappedAttrs);
      } else {
        setItemAttributes([]);
      }

      if (Array.isArray(data.itemDefects)) {
        const mappedDefs = (data.itemDefects as any[])
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
        setItemDefects(mappedDefs);
      } else {
        setItemDefects([]);
      }

      if (importInputRef.current) importInputRef.current.value = '' as any;
      setIsDirty(true);
    } catch (err) {
      console.error('Failed to import item file', err);
      alert('Failed to import file. Please ensure it is a valid Item JSON export.');
    }
  };

  return (
    <EntityBuilderModal
      isOpen={open}
      onClose={handleRequestClose}
      title="Item Builder"
      maxWidth="900px"
      storageKey="besm_item_prefs_v1"
      showGear={true}
      renderTooltipLayer={true}
      renderInfoLayer={true}
      renderScreenReaderRegions={true}
    >
      {(ctx) => {
        const { setSrAnnounce, showTip, moveTip, hideTip, showTipAtElement, openInfoAtElement, setSrText } = ctx;

        const bumpAttrLevelCtx = (id: string, delta: number) => {
          setItemAttributes(prev => prev.map(a => {
            if (a.id !== id) return a;
            const nextLevel = Math.max(1, (a.level || 1) + delta);
            const cpCost = calculateAttributeCost(a.template as any, nextLevel);
            setSrAnnounce(`${a.template.name} level set to ${nextLevel}`);
            setIsDirty(true);
            return { ...a, level: nextLevel, cpCost } as CharacterAttribute;
          }));
        };

        const setDefectRankCtx = (id: string, delta: number) => {
          setItemDefects(prev => prev.map(d => {
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
          setItemDefects(prev => prev.map(d => {
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

        const srInstructions = (
          <div style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }} aria-live="polite">
            Item editor. Tabs are Attributes, Defects, and Description. Use Left and Right arrow keys to switch tabs.
          </div>
        );

        return (
          <div style={{ color: 'var(--besm-dark-text)' }}>
            {srInstructions}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Item Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                  placeholder="e.g., Flaming Sword"
                  style={textInputStyle}
                  className="sheet-input"
                />
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 200 }}>
                <div style={{ color: 'var(--besm-dark-text)', fontWeight: 700, fontSize: 14 }}>Item Cost</div>
                <div style={{ color: 'var(--besm-purple)', fontWeight: 800, fontSize: 20 }}>{spentCP} CP</div>
                <div style={{ fontSize: 11, color: 'var(--besm-dark-text)', marginTop: 2 }}>
                  (Attrs - Defects) / 2
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8, margin: '8px 0 12px 0', position: 'relative' }} role="tablist" aria-label="Item editor sections">
              <div style={{ display: 'flex', gap: 8 }}>
                {tabOrder.map((t, idx) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={activeTab === t.key}
                    aria-controls={`item-tabpanel-${t.key}`}
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
              {/* Attributes */}
              <div role="tabpanel" id="item-tabpanel-attributes" aria-labelledby="item-tab-attributes" hidden={activeTab !== 'attributes'} style={{ marginTop: 8 }}>
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
                    <div style={{ height: 400, overflow: 'auto' }}>
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
                            <button style={{ ...buttonBase, background: 'var(--besm-light-gray)', color: 'var(--besm-dark-text)' }} onClick={() => handleAddItemAttribute(tpl)}>Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Item Attributes</div>
                    <div style={{ height: 400, overflow: 'auto', paddingRight: 4 }}>
                      {itemAttributes.length === 0 && (
                        <div style={{ color: 'var(--besm-dark-text)' }}>No attributes selected.</div>
                      )}
                      {itemAttributes.map((a) => (
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
                            <button style={{ ...buttonBase, background: 'var(--besm-red)', color: 'white' }} onClick={() => handleRemoveItemAttribute(a.id)}>Remove</button>
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
              <div role="tabpanel" id="item-tabpanel-defects" aria-labelledby="item-tab-defects" hidden={activeTab !== 'defects'} style={{ marginTop: 8 }}>
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
                    <div style={{ height: 400, overflow: 'auto' }}>
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
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Item Defects</div>
                    <div style={{ height: 400, overflow: 'auto', paddingRight: 4 }}>
                      {itemDefects.length === 0 && (
                        <div style={{ color: 'var(--besm-dark-text)' }}>No defects selected.</div>
                      )}
                      {itemDefects.map((d) => (
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
                                onChange={(e) => { setItemDefects(prev => prev.map(def => def.id === d.id ? { ...def, notes: e.target.value } : def)); setIsDirty(true); }}
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
              <div role="tabpanel" id="item-tabpanel-description" aria-labelledby="item-tab-description" hidden={activeTab !== 'description'} style={{ marginTop: 8 }}>
                <div style={contentPanelStyle}>
                  <h4 style={{ margin: 0, marginBottom: 8, color: 'var(--besm-black)' }}>Item Description</h4>
                  <textarea
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
                    rows={10}
                    style={{ width: '100%', border: '1px solid var(--besm-light-gray)', borderRadius: 6, padding: 8, minHeight: 380, resize: 'vertical' }}
                    placeholder="Describe the item's appearance, history, and special properties..."
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
              saveLabel="Save Item"
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

export default ItemBuilderModal;
