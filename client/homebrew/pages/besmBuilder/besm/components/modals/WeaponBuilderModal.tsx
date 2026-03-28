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

// Weapon configuration interface
export interface WeaponConfig {
  id: string;
  name: string;
  weaponType?: string; // e.g., "martial arts", "energy sword", "lightning"
  baseDamageLevel: number; // -1 to 6 (weapons can have negative levels)
  description?: string;
  weaponAttributes: {
    key: string;
    level: number;
    notes?: string;
    enhancements?: { key: string; notes?: string }[];
    limiters?: { key: string; assignments?: number; notes?: string }[];
  }[];
  weaponDefects: { key: string; rank: number; notes?: string }[];
  spentCP: number; // Total CP cost of the weapon
}

interface WeaponBuilderModalProps {
  open: boolean;
  onClose: () => void;
  level: number; // The level of the Weapon attribute itself
  effectiveLevel: number; // After enhancements/limiters
  existingConfig?: Partial<WeaponConfig>;
  onSave: (config: WeaponConfig) => void;
  budgetOverride?: number; // Optional budget override
  computeBudget?: (level: number) => number; // Optional budget computation function
}

// Tab identifiers
type TabKey = 'weapon' | 'attributes' | 'defects' | 'description';

const tabOrder: { key: TabKey; label: string }[] = [
  { key: 'weapon', label: 'Weapon' },
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

// Circular stepper button styles
const circleBase: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  fontSize: '1.2rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  userSelect: 'none',
};
const circlePink: React.CSSProperties = { ...circleBase, background: 'var(--besm-pink)', color: '#fff', cursor: 'pointer' };
const circlePinkLight: React.CSSProperties = { ...circleBase, background: 'var(--besm-light-pink-bg, #ffd1e6)', color: 'var(--besm-pink)', cursor: 'pointer' };
const circleBlue: React.CSSProperties = { ...circleBase, background: 'var(--besm-blue, #0b74ff)', color: '#fff' };

// Helper: clamp to integer >= 0
const clampNonNegativeInt = (n: number) => Math.max(0, Math.trunc(Number.isFinite(n) ? n : 0));

const WeaponBuilderModal: React.FC<WeaponBuilderModalProps> = ({
  open,
  onClose,
  level,
  effectiveLevel,
  existingConfig,
  onSave,
  budgetOverride,
  computeBudget,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('weapon');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  // Weapon basic info
  const [weaponName, setWeaponName] = useState<string>('');
  const [weaponType, setWeaponType] = useState<string>('');
  const [baseDamageLevel, setBaseDamageLevel] = useState<number>(1);
  const [description, setDescription] = useState<string>('');

  // Weapon attributes
  const [weaponAttributes, setWeaponAttributes] = useState<{
    key: string;
    level: number;
    notes?: string;
    enhancements?: { key: string; notes?: string }[];
    limiters?: { key: string; assignments?: number; notes?: string }[];
  }[]>([]);

  // Weapon defects
  const [weaponDefects, setWeaponDefects] = useState<{ key: string; rank: number; notes?: string }[]>([]);

  // Search states
  const [attributeSearch, setAttributeSearch] = useState<string>('');
  const [defectSearch, setDefectSearch] = useState<string>('');

  // Enhancement/Limiter modal states
  const [enhancementModalOpen, setEnhancementModalOpen] = useState(false);
  const [limiterModalOpen, setLimiterModalOpen] = useState(false);
  const [editingAttrIdx, setEditingAttrIdx] = useState<number>(-1);

  // Calculate weapon CP budget (2 CP per level of Weapon attribute)
  const budgetCP = useMemo(() => {
    if (typeof budgetOverride === 'number') return budgetOverride;
    if (computeBudget) return computeBudget(level);
    return Math.max(0, effectiveLevel * 2);
  }, [budgetOverride, computeBudget, level, effectiveLevel]);

  // Calculate total CP spent on weapon
  const spentCP = useMemo(() => {
    const attrCost = weaponAttributes.reduce((total, attr) => {
      const tpl = getAttributeByKey(attr.key);
      if (!tpl) return total;
      return total + calculateAttributeCost(tpl, Math.max(1, attr.level || 1));
    }, 0);

    const defectRefund = weaponDefects.reduce((total, defect) => {
      const tpl = getDefectByKey(defect.key);
      if (!tpl) return total;
      const rank = Math.max(1, defect.rank || 1);
      return total + calculateDefectBonus(tpl, rank);
    }, 0);

    return Math.max(0, attrCost - defectRefund);
  }, [weaponAttributes, weaponDefects]);

  // Load existing config
  useEffect(() => {
    if (!open) return;
    const cfg = existingConfig || {};
    setWeaponName(cfg.name || '');
    setWeaponType(cfg.weaponType || '');
    setBaseDamageLevel(typeof cfg.baseDamageLevel === 'number' ? cfg.baseDamageLevel : 1);
    setDescription(cfg.description || '');
    setWeaponAttributes(cfg.weaponAttributes || []);
    setWeaponDefects(cfg.weaponDefects || []);
    setIsDirty(false);
    setActiveTab('weapon');
  }, [open, existingConfig]);

  // Mark as dirty when any field changes
  useEffect(() => {
    if (!open) return;
    setIsDirty(true);
  }, [weaponName, weaponType, baseDamageLevel, description, weaponAttributes, weaponDefects]);

  // Filtered library lists
  const filteredAttributesLib = useMemo(() => {
    const query = attributeSearch.toLowerCase().trim();
    if (!query) return ATTRIBUTES_LIBRARY;
    return ATTRIBUTES_LIBRARY.filter(a => a.name.toLowerCase().includes(query));
  }, [attributeSearch]);

  const filteredDefectsLib = useMemo(() => {
    const query = defectSearch.toLowerCase().trim();
    if (!query) return DEFECTS_LIBRARY;
    return DEFECTS_LIBRARY.filter(d => d.name.toLowerCase().includes(query));
  }, [defectSearch]);

  // Handlers
  const handleRequestClose = () => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setConfirmOpen(false);
    setIsDirty(false);
    onClose();
  };

  const handleSave = () => {
    const config: WeaponConfig = {
      id: existingConfig?.id || uuidv4(),
      name: weaponName || 'Unnamed Weapon',
      weaponType,
      baseDamageLevel,
      description,
      weaponAttributes,
      weaponDefects,
      spentCP,
    };
    onSave(config);
    setIsDirty(false);
  };

  const handleImport = async (setSrAnnounce: (msg: string) => void) => {
    try {
      const text = await parseLibraryFile();
      const data = JSON.parse(text);
      if (data && typeof data === 'object') {
        setWeaponName(data.name || '');
        setWeaponType(data.weaponType || '');
        setBaseDamageLevel(typeof data.baseDamageLevel === 'number' ? data.baseDamageLevel : 1);
        setDescription(data.description || '');
        setWeaponAttributes(data.weaponAttributes || []);
        setWeaponDefects(data.weaponDefects || []);
        setSrAnnounce('Weapon configuration imported successfully');
      }
    } catch (err) {
      setSrAnnounce('Failed to import weapon configuration');
    }
  };

  const handleExport = (setSrAnnounce: (msg: string) => void) => {
    const config = {
      name: weaponName,
      weaponType,
      baseDamageLevel,
      description,
      weaponAttributes,
      weaponDefects,
      spentCP,
    };
    exportLibraryFile(JSON.stringify(config, null, 2), `weapon_${weaponName || 'unnamed'}.json`);
    setSrAnnounce('Weapon configuration exported successfully');
  };

  // Attribute handlers
  const handleAddAttribute = (tpl: AttributeTemplate) => {
    const existing = weaponAttributes.find(a => a.key === tpl.key);
    if (existing) return;
    setWeaponAttributes([...weaponAttributes, { key: tpl.key, level: 1, notes: '' }]);
  };

  const handleRemoveAttribute = (key: string) => {
    setWeaponAttributes(weaponAttributes.filter(a => a.key !== key));
  };

  const handleAttributeLevelChange = (key: string, delta: number) => {
    setWeaponAttributes(weaponAttributes.map(a => {
      if (a.key !== key) return a;
      const tpl = getAttributeByKey(a.key);
      const maxLevel = (tpl as AttributeTemplate & { max_level?: number })?.max_level || 6;
      const newLevel = Math.max(1, Math.min(maxLevel, a.level + delta));
      return { ...a, level: newLevel };
    }));
  };

  const handleAttributeNotesChange = (key: string, notes: string) => {
    setWeaponAttributes(weaponAttributes.map(a => (a.key === key ? { ...a, notes } : a)));
  };

  // Defect handlers
  const handleAddDefect = (tpl: DefectTemplate) => {
    const existing = weaponDefects.find(d => d.key === tpl.key);
    if (existing) return;
    setWeaponDefects([...weaponDefects, { key: tpl.key, rank: 1, notes: '' }]);
  };

  const handleRemoveDefect = (key: string) => {
    setWeaponDefects(weaponDefects.filter(d => d.key !== key));
  };

  const handleDefectRankChange = (key: string, delta: number) => {
    setWeaponDefects(weaponDefects.map(d => {
      if (d.key !== key) return d;
      const tpl = getDefectByKey(d.key);
      const maxRank = (tpl as DefectTemplate & { max_rank?: number })?.max_rank || 6;
      const newRank = Math.max(1, Math.min(maxRank, d.rank + delta));
      return { ...d, rank: newRank };
    }));
  };

  const handleDefectNotesChange = (key: string, notes: string) => {
    setWeaponDefects(weaponDefects.map(d => (d.key === key ? { ...d, notes } : d)));
  };

  // Enhancement/Limiter handlers
  const handleAddEnhancement = (enhancement: AttributeEnhancement) => {
    if (editingAttrIdx < 0) return;
    const attr = weaponAttributes[editingAttrIdx];
    const existing = attr.enhancements || [];
    setWeaponAttributes(weaponAttributes.map((a, i) =>
      i === editingAttrIdx
        ? { ...a, enhancements: [...existing, { key: enhancement.template.key, notes: enhancement.notes || '' }] }
        : a
    ));
  };

  const handleAddLimiter = (limiter: AttributeLimiter) => {
    if (editingAttrIdx < 0) return;
    const attr = weaponAttributes[editingAttrIdx];
    const existing = attr.limiters || [];
    setWeaponAttributes(weaponAttributes.map((a, i) =>
      i === editingAttrIdx
        ? { ...a, limiters: [...existing, { key: limiter.template.key, assignments: limiter.assignments || 0, notes: limiter.notes || '' }] }
        : a
    ));
  };

  const handleRemoveEnhancement = (attrIdx: number, enhIdx: number) => {
    setWeaponAttributes(weaponAttributes.map((a, i) => {
      if (i !== attrIdx) return a;
      const enhancements = a.enhancements || [];
      return { ...a, enhancements: enhancements.filter((_, ei) => ei !== enhIdx) };
    }));
  };

  const handleRemoveLimiter = (attrIdx: number, limIdx: number) => {
    setWeaponAttributes(weaponAttributes.map((a, i) => {
      if (i !== attrIdx) return a;
      const limiters = a.limiters || [];
      return { ...a, limiters: limiters.filter((_, li) => li !== limIdx) };
    }));
  };

  return (
    <EntityBuilderModal isOpen={open} onClose={handleRequestClose} title="Weapon Builder">
      {(ctx) => {
        const { setSrAnnounce, showTip, moveTip, hideTip, showTipAtElement, openInfoAtElement, setSrText } = ctx;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--besm-dark-text)' }}>
            {/* Budget Info */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                  Weapon Level: {level} | Effective: {effectiveLevel} | Budget: {budgetCP} CP | Spent: {spentCP} CP | Remaining: {budgetCP - spentCP} CP
                </p>
              </div>
              {spentCP > budgetCP && (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--besm-red)' }}>
                  ⚠️ Warning: Over budget by {spentCP - budgetCP} CP
                </p>
              )}
            </div>

            {/* Tab Navigation */}
            <div
              role="tablist"
              aria-label="Weapon builder tabs"
              style={{ display: 'flex', gap: 8, marginBottom: 12 }}
            >
              {tabOrder.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    id={`weapon-tab-${tab.key}`}
                    aria-controls={`weapon-tabpanel-${tab.key}`}
                    aria-selected={isActive}
                    tabIndex={0}
                    onClick={() => setActiveTab(tab.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        const idx = tabOrder.findIndex(t => t.key === tab.key);
                        const nextTab = tabOrder[(idx + 1) % tabOrder.length];
                        setActiveTab(nextTab.key);
                      } else if (e.key === 'ArrowLeft') {
                        const idx = tabOrder.findIndex(t => t.key === tab.key);
                        const prevTab = tabOrder[(idx - 1 + tabOrder.length) % tabOrder.length];
                        setActiveTab(prevTab.key);
                      }
                    }}
                    style={{
                      ...buttonBase,
                      background: isActive ? 'var(--besm-purple)' : 'white',
                      color: isActive ? 'white' : 'var(--besm-dark-text)',
                      border: isActive ? 'none' : '1px solid var(--besm-light-gray)',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
              {/* Weapon Tab */}
              <div
                role="tabpanel"
                id="weapon-tabpanel-weapon"
                aria-labelledby="weapon-tab-weapon"
                hidden={activeTab !== 'weapon'}
                style={{ marginTop: 8 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Weapon Name */}
                  <div>
                    <label htmlFor="weapon-name" style={labelStyle}>
                      Weapon Name <span style={{ color: 'var(--besm-red)' }}>*</span>
                    </label>
                    <input
                      id="weapon-name"
                      type="text"
                      value={weaponName}
                      onChange={(e) => setWeaponName(e.target.value)}
                      placeholder="e.g., Energy Sword, Lightning Strike"
                      style={textInputStyle}
                      aria-required="true"
                    />
                  </div>

                  {/* Weapon Type */}
                  <div>
                    <label htmlFor="weapon-type" style={labelStyle}>
                      Weapon Type
                    </label>
                    <input
                      id="weapon-type"
                      type="text"
                      value={weaponType}
                      onChange={(e) => setWeaponType(e.target.value)}
                      placeholder="e.g., martial arts, magic, energy, ranged"
                      style={textInputStyle}
                      list="weapon-type-suggestions"
                    />
                    <datalist id="weapon-type-suggestions">
                      <option value="martial arts" />
                      <option value="magic" />
                      <option value="energy" />
                      <option value="lightning" />
                      <option value="fire" />
                      <option value="ice" />
                      <option value="ranged" />
                      <option value="melee" />
                      <option value="psychic" />
                    </datalist>
                  </div>

                  {/* Base Damage Level */}
                  <div>
                    <label htmlFor="base-damage-level" style={labelStyle}>
                      Base Damage Level
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setBaseDamageLevel(Math.max(-1, baseDamageLevel - 1))}
                        onKeyDown={(e) => {
                          if (e.key === 'Home') {
                            e.preventDefault();
                            setBaseDamageLevel(-1);
                          }
                        }}
                        style={circlePinkLight}
                        aria-label="Decrease base damage level (Home for minimum)"
                        disabled={baseDamageLevel <= -1}
                      >
                        −
                      </button>
                      <div style={circleBlue} aria-live="polite" aria-atomic="true">
                        {baseDamageLevel}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBaseDamageLevel(Math.min(6, baseDamageLevel + 1))}
                        onKeyDown={(e) => {
                          if (e.key === 'End') {
                            e.preventDefault();
                            setBaseDamageLevel(6);
                          }
                        }}
                        style={circlePink}
                        aria-label="Increase base damage level (End for maximum)"
                        disabled={baseDamageLevel >= 6}
                      >
                        +
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--besm-dark-text)', marginTop: 8 }}>
                      {baseDamageLevel === -1 && "The attack doesn't inflict regular damage"}
                      {baseDamageLevel === 0 && "Base Damage is 0 (damage = Attack Combat Value only)"}
                      {baseDamageLevel > 0 && `Base Damage = ${baseDamageLevel} × Damage Multiplier`}
                    </p>
                  </div>

                  {/* Info Box */}
                  <div
                    style={{
                      padding: 12,
                      border: '2px solid var(--besm-blue)',
                      borderRadius: 8,
                      background: 'var(--besm-light-bg)',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                      <strong>Note:</strong> Weapons can have effective levels of -1 or 0, unlike other attributes. Use the Attributes tab
                      to add special properties to your weapon (e.g., Area Effect, Range, etc.) and the Defects tab to add limitations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attributes Tab */}
              <div
                role="tabpanel"
                id="weapon-tabpanel-attributes"
                aria-labelledby="weapon-tab-attributes"
                hidden={activeTab !== 'attributes'}
                style={{ marginTop: 8 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Left: Search/Add panel */}
                  <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                    <h4 style={{ marginTop: 0, color: 'var(--besm-purple)' }}>Add Attributes</h4>
                    <input
                      type="text"
                      placeholder="Search attributes..."
                      value={attributeSearch}
                      onChange={(e) => setAttributeSearch(e.target.value)}
                      style={{ ...textInputStyle, marginBottom: 8 }}
                    />
                    <div style={{ height: 400, overflow: 'auto' }}>
                      {filteredAttributesLib.map((tpl) => {
                        const hasAttribute = weaponAttributes.some(a => a.key === tpl.key);
                        return (
                          <div
                            key={tpl.key}
                            style={{
                              padding: 8,
                              marginBottom: 6,
                              border: '1px solid var(--besm-light-gray)',
                              borderRadius: 6,
                              background: hasAttribute ? 'var(--besm-light-bg)' : 'white',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: 'var(--besm-purple)' }}>{tpl.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--besm-dark-text)' }}>
                                {tpl.baseCost} CP/level
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddAttribute(tpl)}
                              disabled={hasAttribute}
                              style={{
                                ...secondaryButton,
                                padding: '6px 12px',
                                opacity: hasAttribute ? 0.5 : 1,
                                cursor: hasAttribute ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {hasAttribute ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Selected attributes panel */}
                  <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                    <h4 style={{ marginTop: 0, color: 'var(--besm-purple)' }}>Weapon Attributes</h4>
                    <div style={{ height: 448, overflow: 'auto' }}>
                      {weaponAttributes.length === 0 ? (
                        <p style={{ color: 'var(--besm-dark-text)', fontStyle: 'italic' }}>
                          No attributes added yet. Add attributes from the left panel.
                        </p>
                      ) : (
                        weaponAttributes.map((attr, idx) => {
                          const tpl = getAttributeByKey(attr.key);
                          if (!tpl) return null;

                          const maxLevel = (tpl as AttributeTemplate & { max_level?: number })?.max_level || 6;
                          const cost = calculateAttributeCost(tpl, Math.max(1, attr.level || 1));

                          return (
                            <div
                              key={`${attr.key}-${idx}`}
                              style={{
                                padding: 10,
                                marginBottom: 10,
                                border: '2px solid var(--besm-purple)',
                                borderRadius: 8,
                                background: 'var(--besm-light-bg)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--besm-purple)' }}>{tpl.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--besm-dark-text)' }}>
                                    Cost: {cost} CP
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveAttribute(attr.key)}
                                  style={{ ...secondaryButton, padding: '4px 8px', fontSize: '0.8rem' }}
                                  aria-label={`Remove ${tpl.name}`}
                                >
                                  Remove
                                </button>
                              </div>

                              {/* Level Stepper */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Level:</span>
                                <button
                                  type="button"
                                  onClick={() => handleAttributeLevelChange(attr.key, -1)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Home') {
                                      e.preventDefault();
                                      setWeaponAttributes(weaponAttributes.map(a => (a.key === attr.key ? { ...a, level: 1 } : a)));
                                    }
                                  }}
                                  style={circlePinkLight}
                                  disabled={attr.level <= 1}
                                  aria-label="Decrease level (Home for minimum)"
                                >
                                  −
                                </button>
                                <div style={circleBlue} aria-live="polite" aria-atomic="true">
                                  {attr.level}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAttributeLevelChange(attr.key, 1)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'End') {
                                      e.preventDefault();
                                      setWeaponAttributes(weaponAttributes.map(a => (a.key === attr.key ? { ...a, level: maxLevel } : a)));
                                    }
                                  }}
                                  style={circlePink}
                                  disabled={attr.level >= maxLevel}
                                  aria-label="Increase level (End for maximum)"
                                >
                                  +
                                </button>
                              </div>

                              {/* Enhancements/Limiters */}
                              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <button
                                  onClick={() => {
                                    setEditingAttrIdx(idx);
                                    setEnhancementModalOpen(true);
                                  }}
                                  style={{ ...secondaryButton, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                                >
                                  Add Enhancement
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAttrIdx(idx);
                                    setLimiterModalOpen(true);
                                  }}
                                  style={{ ...secondaryButton, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                                >
                                  Add Limiter
                                </button>
                              </div>

                              {/* Enhancements List */}
                              {attr.enhancements && attr.enhancements.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Enhancements:</div>
                                  {attr.enhancements.map((enh, enhIdx) => {
                                    const enhTpl = getEnhancementByKey(enh.key);
                                    if (!enhTpl) return null;
                                    return (
                                      <div
                                        key={`enh-${enhIdx}`}
                                        style={{
                                          padding: 6,
                                          marginBottom: 4,
                                          border: '1px solid var(--besm-light-gray)',
                                          borderRadius: 4,
                                          background: 'white',
                                          fontSize: '0.8rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                        }}
                                      >
                                        <span>{enhTpl.name}</span>
                                        <button
                                          onClick={() => handleRemoveEnhancement(idx, enhIdx)}
                                          style={{
                                            background: 'var(--besm-red)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 4,
                                            padding: '2px 6px',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Limiters List */}
                              {attr.limiters && attr.limiters.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Limiters:</div>
                                  {attr.limiters.map((lim, limIdx) => {
                                    const limTpl = getLimiterByKey(lim.key);
                                    if (!limTpl) return null;
                                    return (
                                      <div
                                        key={`lim-${limIdx}`}
                                        style={{
                                          padding: 6,
                                          marginBottom: 4,
                                          border: '1px solid var(--besm-light-gray)',
                                          borderRadius: 4,
                                          background: 'white',
                                          fontSize: '0.8rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                        }}
                                      >
                                        <span>{limTpl.name}</span>
                                        <button
                                          onClick={() => handleRemoveLimiter(idx, limIdx)}
                                          style={{
                                            background: 'var(--besm-red)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 4,
                                            padding: '2px 6px',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Notes */}
                              <div>
                                <label
                                  htmlFor={`attr-notes-${idx}`}
                                  style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}
                                >
                                  Notes:
                                </label>
                                <textarea
                                  id={`attr-notes-${idx}`}
                                  value={attr.notes || ''}
                                  onChange={(e) => handleAttributeNotesChange(attr.key, e.target.value)}
                                  placeholder="Optional notes about this attribute"
                                  style={{
                                    ...textInputStyle,
                                    minHeight: 60,
                                    resize: 'vertical',
                                    fontSize: '0.85rem',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Defects Tab */}
              <div
                role="tabpanel"
                id="weapon-tabpanel-defects"
                aria-labelledby="weapon-tab-defects"
                hidden={activeTab !== 'defects'}
                style={{ marginTop: 8 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Left: Search/Add panel */}
                  <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                    <h4 style={{ marginTop: 0, color: 'var(--besm-purple)' }}>Add Defects</h4>
                    <input
                      type="text"
                      placeholder="Search defects..."
                      value={defectSearch}
                      onChange={(e) => setDefectSearch(e.target.value)}
                      style={{ ...textInputStyle, marginBottom: 8 }}
                    />
                    <div style={{ height: 400, overflow: 'auto' }}>
                      {filteredDefectsLib.map((tpl) => {
                        const hasDefect = weaponDefects.some(d => d.key === tpl.key);
                        return (
                          <div
                            key={tpl.key}
                            style={{
                              padding: 8,
                              marginBottom: 6,
                              border: '1px solid var(--besm-light-gray)',
                              borderRadius: 6,
                              background: hasDefect ? 'var(--besm-light-bg)' : 'white',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: 'var(--besm-purple)' }}>{tpl.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--besm-dark-text)' }}>
                                {tpl.bonusPerRank} CP/rank
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddDefect(tpl)}
                              disabled={hasDefect}
                              style={{
                                ...secondaryButton,
                                padding: '6px 12px',
                                opacity: hasDefect ? 0.5 : 1,
                                cursor: hasDefect ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {hasDefect ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Selected defects panel */}
                  <div style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 8, background: 'white', padding: 10 }}>
                    <h4 style={{ marginTop: 0, color: 'var(--besm-purple)' }}>Weapon Defects</h4>
                    <div style={{ height: 448, overflow: 'auto' }}>
                      {weaponDefects.length === 0 ? (
                        <p style={{ color: 'var(--besm-dark-text)', fontStyle: 'italic' }}>
                          No defects added yet. Add defects from the left panel to reduce CP cost.
                        </p>
                      ) : (
                        weaponDefects.map((defect, idx) => {
                          const tpl = getDefectByKey(defect.key);
                          if (!tpl) return null;

                          const maxRank = (tpl as DefectTemplate & { max_rank?: number })?.max_rank || 6;
                          const bonus = calculateDefectBonus(tpl, Math.max(1, defect.rank || 1));
                          const requiresDescription = tpl.requiresDescription;

                          return (
                            <div
                              key={`${defect.key}-${idx}`}
                              style={{
                                padding: 10,
                                marginBottom: 10,
                                border: '2px solid var(--besm-purple)',
                                borderRadius: 8,
                                background: 'var(--besm-light-bg)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--besm-purple)' }}>{tpl.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--besm-dark-text)' }}>
                                    Bonus: +{bonus} CP
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveDefect(defect.key)}
                                  style={{ ...secondaryButton, padding: '4px 8px', fontSize: '0.8rem' }}
                                  aria-label={`Remove ${tpl.name}`}
                                >
                                  Remove
                                </button>
                              </div>

                              {/* Rank Stepper */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Rank:</span>
                                <button
                                  type="button"
                                  onClick={() => handleDefectRankChange(defect.key, -1)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Home') {
                                      e.preventDefault();
                                      setWeaponDefects(weaponDefects.map(d => (d.key === defect.key ? { ...d, rank: 1 } : d)));
                                    }
                                  }}
                                  style={circlePinkLight}
                                  disabled={defect.rank <= 1}
                                  aria-label="Decrease rank (Home for minimum)"
                                >
                                  −
                                </button>
                                <div style={circleBlue} aria-live="polite" aria-atomic="true">
                                  {defect.rank}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDefectRankChange(defect.key, 1)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'End') {
                                      e.preventDefault();
                                      setWeaponDefects(weaponDefects.map(d => (d.key === defect.key ? { ...d, rank: maxRank } : d)));
                                    }
                                  }}
                                  style={circlePink}
                                  disabled={defect.rank >= maxRank}
                                  aria-label="Increase rank (End for maximum)"
                                >
                                  +
                                </button>
                              </div>

                              {/* Notes */}
                              <div>
                                <label
                                  htmlFor={`defect-notes-${idx}`}
                                  style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}
                                >
                                  {requiresDescription ? 'Description (Required):' : 'Notes:'}
                                </label>
                                <textarea
                                  id={`defect-notes-${idx}`}
                                  value={defect.notes || ''}
                                  onChange={(e) => handleDefectNotesChange(defect.key, e.target.value)}
                                  placeholder={requiresDescription ? 'Required description for this defect' : 'Optional notes about this defect'}
                                  style={{
                                    ...textInputStyle,
                                    minHeight: 60,
                                    resize: 'vertical',
                                    fontSize: '0.85rem',
                                    borderColor: requiresDescription && !defect.notes ? 'var(--besm-red)' : 'var(--besm-purple)',
                                  }}
                                  aria-required={requiresDescription}
                                />
                                {requiresDescription && !defect.notes && (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--besm-red)', marginTop: 4 }}>
                                    This defect requires a description
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Tab */}
              <div
                role="tabpanel"
                id="weapon-tabpanel-description"
                aria-labelledby="weapon-tab-description"
                hidden={activeTab !== 'description'}
                style={{ marginTop: 8 }}
              >
                <div>
                  <label htmlFor="weapon-description" style={labelStyle}>
                    Weapon Description
                  </label>
                  <textarea
                    id="weapon-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a detailed description of your weapon, its appearance, history, special abilities, etc."
                    style={{
                      ...textInputStyle,
                      minHeight: 200,
                      resize: 'vertical',
                    }}
                  />
                  <p style={{ fontSize: '0.85rem', color: 'var(--besm-dark-text)', marginTop: 8 }}>
                    Use this space to describe your weapon's appearance, history, special abilities, and how it's used in combat.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <EditorFooterActions
              onCancel={handleRequestClose}
              onSave={handleSave}
              onImport={() => handleImport(setSrAnnounce)}
              onExport={() => handleExport(setSrAnnounce)}
              saveDisabled={!weaponName.trim()}
              saveLabel="Save Weapon"
            />

            {/* Discard Confirmation Modal */}
            {confirmOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                }}
                onClick={() => setConfirmOpen(false)}
              >
                <div
                  style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 12,
                    maxWidth: 400,
                    border: '3px solid var(--besm-purple)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0, color: 'var(--besm-purple)' }}>Discard Changes?</h3>
                  <p style={{ color: 'var(--besm-dark-text)' }}>
                    You have unsaved changes. Are you sure you want to discard them?
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={() => setConfirmOpen(false)} style={secondaryButton}>
                      Cancel
                    </button>
                    <button onClick={handleConfirmDiscard} style={{ ...primaryButton, background: 'var(--besm-red)' }}>
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhancement Modal */}
            {enhancementModalOpen && editingAttrIdx >= 0 && (
              <EnhancementsModal
                open={enhancementModalOpen}
                onClose={() => {
                  setEnhancementModalOpen(false);
                  setEditingAttrIdx(-1);
                }}
                attribute={getAttributeByKey(weaponAttributes[editingAttrIdx].key)!}
                currentEnhancements={(weaponAttributes[editingAttrIdx].enhancements || []).map(e => ({
                  template: getEnhancementByKey(e.key)!,
                  notes: e.notes,
                }))}
                onAddEnhancement={handleAddEnhancement}
              />
            )}

            {/* Limiter Modal */}
            {limiterModalOpen && editingAttrIdx >= 0 && (
              <LimitersModal
                open={limiterModalOpen}
                onClose={() => {
                  setLimiterModalOpen(false);
                  setEditingAttrIdx(-1);
                }}
                attribute={getAttributeByKey(weaponAttributes[editingAttrIdx].key)!}
                currentLimiters={(weaponAttributes[editingAttrIdx].limiters || []).map(l => ({
                  template: getLimiterByKey(l.key)!,
                  assignments: l.assignments,
                  notes: l.notes,
                }))}
                onAddLimiter={handleAddLimiter}
              />
            )}
          </div>
        );
      }}
    </EntityBuilderModal>
  );
};

export default WeaponBuilderModal;
