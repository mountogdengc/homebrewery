import React, { useState, useEffect, CSSProperties, useMemo } from 'react';
import { BesmCharacter, CharacterAttribute, AttributeEnhancement, AlternateFormConfig, MinionsConfig, AttributeLimiter } from '../../types/besm-character';
import { AttributeTemplate, ATTRIBUTES_LIBRARY } from '../../data/attributesLibrary';
import EnhancementsModal from '../modals/EnhancementsModal';
import LimitersModal from '../modals/LimitersModal';
import AlternateFormBuilderModal from '../modals/AlternateFormBuilderModal';
import MetamorphosisBuilderModal from '../modals/MetamorphosisBuilderModal';
import CompanionBuilderModal, { CompanionConfig } from '../modals/CompanionBuilderModal';
import ItemBuilderModal, { ItemConfig } from '../modals/ItemBuilderModal';
import WeaponBuilderModal, { WeaponConfig } from '../modals/WeaponBuilderModal';
import MinionsBuilderModal from '../modals/MinionsBuilderModal';
import { Modal } from '../common/Modal';
import { Step6Skills } from './Step6Skills';
import { useToast } from '../../contexts/ToastContext';
import { formatRefs as formatRefsShared, cleanDescription as cleanDescriptionShared, computeAvailableSources as computeAvailableSourcesShared, matchesSource as matchesSourceShared } from '../common/sourceRefs';

// Extended AttributeTemplate interface to include custom_inputs
interface ExtendedAttributeTemplate extends AttributeTemplate {
  custom_inputs?: Array<{
    label: string;
    key: string;
    type: string;
    placeholder?: string;
    min?: number;
    max?: number;
    options?: Array<{
      label: string;
      value: string;
    }>;
  }>;
}

interface Step4AttributesProps {
  character: BesmCharacter;
  onAttributeAdd: (attribute: AttributeTemplate, level: number, customInputs?: Record<string, unknown>, enhancements?: AttributeEnhancement[], limiters?: AttributeLimiter[], selectedOptions?: string[], notes?: string) => void;
  onAttributeUpdate: (id: string, updates: { level?: number; customInputs?: Record<string, unknown>; enhancements?: AttributeEnhancement[]; limiters?: AttributeLimiter[], selectedOptions?: string[], notes?: string, alternateForm?: AlternateFormConfig, metamorphosis?: AlternateFormConfig, minions?: MinionsConfig }) => void;
  onAttributeRemove: (id: string) => void;
  onCharacterChange: (updates: Partial<BesmCharacter>) => void;
}

// Narrow view of dynamic custom inputs we use in this component
type CustomInputsPartial = {
  gearSpecific?: string;
  alternateIdentities?: string;
  custom_description?: string;
  itemConfig?: ItemConfig;
  weaponConfig?: WeaponConfig;
  alternateFormDraft?: AlternateFormConfig;
  metamorphosisDraft?: AlternateFormConfig;
  minionsConfig?: MinionsConfig;
  companionConfig?: CompanionConfig;
  state_type?: string;
  cognition_type?: string;
  stat_target?: string;
};

// Define styles as React inline styles objects
const styles: Record<string, CSSProperties> = {
  attributesStep: {
    fontFamily: 'var(--font-main)',
    color: 'var(--besm-dark-text)',
  },
  header: {
    fontFamily: 'var(--font-header)',
    color: 'var(--besm-purple)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textAlign: 'center',
    marginBottom: '8px',
  },
  description: {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '1rem',
    color: 'var(--besm-dark-text)',
  },
  mainContent: {
    display: 'grid',
    gap: '24px',
    marginBottom: '24px',
    height: 'auto',
  },
  leftPanel: {},
  rightPanel: {},
  searchFilterContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  searchInput: {
    flex: '2 1 0%',
    padding: '12px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'var(--font-main)',
  },
  filterSelect: {
    flex: '1 1 0%',
    padding: '12px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'var(--font-main)',
    cursor: 'pointer',
  },
  attributesList: {
    height: '621px',
    overflowY: 'auto',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    backgroundColor: 'var(--besm-light-bg)',
    boxSizing: 'border-box',
  },
  attributeItem: {
    padding: '12px',
    borderBottom: '2px solid var(--besm-purple)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  attributeItemSelected: {
    backgroundColor: 'var(--besm-light-pink-bg)',
    borderLeft: '4px solid var(--besm-pink)',
  },
  attributeItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  attributeName: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: 'var(--besm-drk-blue)',
  },
  attributeCost: {
    backgroundColor: 'var(--besm-purple)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  attributeItemDescription: {
    fontSize: '0.9rem',
  },
  attributeDetails: {
    paddingTop: '16px',
    paddingRight: '16px',
    paddingBottom: '24px',
    paddingLeft: '16px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    backgroundColor: 'var(--besm-light-bg)',
    height: '700px',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  detailHeader: {
    fontFamily: 'var(--font-header)',
    color: 'var(--besm-pink)',
    fontSize: '1.5rem',
    marginBottom: '4px',
  },
  costPerLevel: {
    fontWeight: 'bold',
    color: 'var(--besm-purple)',
    marginBottom: '16px',
  },
  levelSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '16px 0',
  },
  inputLabel: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  levelInput: {
    width: '80px',
    padding: '8px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '1.1rem',
  },
  totalCost: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: 'var(--besm-pink)',
    textAlign: 'center',
    margin: '16px 0',
  },
  addButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--besm-blue)',
    color: 'black',
    border: '2px solid black',
    borderRadius: '8px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '16px',
    border: '2px dashed var(--besm-light-gray)',
    borderRadius: '8px',
  },
  selectedAttributesSection: {
    marginTop: '24px',
  },
  selectedAttributesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  selectedAttributeCard: {
    padding: '12px',
    border: '2px solid var(--besm-purple)',
    borderRadius: '8px',
    backgroundColor: 'var(--besm-light-bg)',
    cursor: 'pointer',
  },
  selectedCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  removeButton: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--besm-pink)',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  actionButton: {
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'var(--besm-yellow)',
    border: '2px solid black',
    borderRadius: '5px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '10px',
    width: '100%',
  },
  enhancementButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  enhancementButton: {
    padding: '8px 12px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'var(--besm-yellow)',
    border: '2px solid black',
    borderRadius: '5px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '10px',
    width: '48%',
  },
  customInputsContainer: {
    margin: '16px 0',
  },
};

export const Step4Attributes: React.FC<Step4AttributesProps> = ({
  character,
  onAttributeAdd,
  onAttributeUpdate,
  onAttributeRemove,
  onCharacterChange
}) => {
  const { addToast } = useToast();
  const [attributes, setAttributes] = useState<ExtendedAttributeTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [humanFilter, setHumanFilter] = useState<'all' | 'human' | 'nonhuman'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<ExtendedAttributeTemplate | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<CharacterAttribute | null>(null);
  const [attributeLevel, setAttributeLevel] = useState(1);
  const [attributeNotes, setAttributeNotes] = useState('');
  // Alternate Form builder modal state (for both new selection and editing)
  const [isAfBuilderOpen, setIsAfBuilderOpen] = useState(false);
  const [afDraft, setAfDraft] = useState<AlternateFormConfig | undefined>(undefined);
  // Metamorphosis builder modal state (mirrors AF)
  const [isMetaBuilderOpen, setIsMetaBuilderOpen] = useState(false);
  const [metaDraft, setMetaDraft] = useState<AlternateFormConfig | undefined>(undefined);
  const [customInputs, setCustomInputs] = useState<Record<string, unknown>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  // Companion builder modal state
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [companionConfig, setCompanionConfig] = useState<CompanionConfig | undefined>(undefined);
  // Item builder modal state
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [itemConfig, setItemConfig] = useState<ItemConfig | undefined>(undefined);
  // Weapon builder modal state
  const [isWeaponOpen, setIsWeaponOpen] = useState(false);
  const [weaponConfig, setWeaponConfig] = useState<WeaponConfig | undefined>(undefined);
  // Minions builder modal state
  const [isMinionsOpen, setIsMinionsOpen] = useState(false);
  const [minionsConfig, setMinionsConfig] = useState<MinionsConfig | undefined>(undefined);
  // Skills editor modal state
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  // Collapsible notes UI
  const [showNotes, setShowNotes] = useState(false);

  // Ensure Skills attribute is added/updated with current level before opening modal
  const openSkillsModalWithSync = () => {
    if (!selectedAttribute || !(selectedAttribute.key === 'skills' || selectedAttribute.name.toLowerCase() === 'skills')) {
      return;
    }
    const desiredLevel = Math.max(1, Number(attributeLevel) || 1);
    // Try to find an existing Skills attribute on the character
    const existingSkills = (character.attributes || []).find(a => a.template?.key === 'skills' || a.template?.name?.toLowerCase() === 'skills');
    if (existingSkills) {
      // Update level if changed
      if ((existingSkills.level || 1) !== desiredLevel) {
        onAttributeUpdate(existingSkills.id, { level: desiredLevel });
      }
      setIsSkillsModalOpen(true);
    } else {
      // Add the Skills attribute at the current level, then open modal
      onAttributeAdd(selectedAttribute, desiredLevel);
      setIsSkillsModalOpen(true);
    }
  };

  // Total SP spent from character skills
  const totalSkillSP = useMemo(() => {
    return (character.skills || []).reduce((t, s) => t + (s.cpCost || 0), 0);
  }, [character.skills]);

  const formatAttributeDetails = (attribute: CharacterAttribute): string => {
    const parts: string[] = [];

    // Build sections
    // Primary label: specific Gear text; Item/AF/Metamorph/Minions name from their modals
    const primaryNames: string[] = (() => {
      const out: string[] = [];
      const key = attribute.template?.key || attribute.template?.name?.toLowerCase();
      const nameLower = attribute.template?.name?.toLowerCase();
      // Gear specific text
      if (key === 'gear' || nameLower === 'gear') {
        const txt = (attribute.customInputs as CustomInputsPartial)?.gearSpecific;
        if (txt) out.push(txt);
      }
      // Alternate Identity: list of identities entered by the user
      if (key === 'alternate_identity' || nameLower === 'alternate identity') {
        const ids = (attribute.customInputs as CustomInputsPartial)?.alternateIdentities;
        if (ids && ids.trim()) out.push(ids.trim());
      }
      // Item name from ItemBuilderModal
      if (key === 'items' || nameLower === 'item') {
        const itemName = (attribute.customInputs as CustomInputsPartial)?.itemConfig?.name;
        if (itemName) out.push(itemName);
      }
      // Weapon name from WeaponBuilderModal
      if (key === 'weapon' || nameLower === 'weapon') {
        const weaponName = (attribute.customInputs as CustomInputsPartial)?.weaponConfig?.name;
        if (weaponName) out.push(weaponName);
      }
      // Alternate Form name from saved attribute or draft while adding
      if (key === 'alternate_form' || nameLower === 'alternate form') {
        const afName = attribute.alternateForm?.name || (attribute.customInputs as CustomInputsPartial)?.alternateFormDraft?.name;
        if (afName) out.push(String(afName));
      }
      // Metamorphosis name from saved attribute or draft while adding
      if (key === 'metamorphosis' || nameLower === 'metamorphosis') {
        const metaName = attribute.metamorphosis?.name || (attribute.customInputs as CustomInputsPartial)?.metamorphosisDraft?.name;
        if (metaName) out.push(String(metaName));
      }
      // Minions name
      if (key === 'minions' || nameLower === 'minions') {
        const minionsName = attribute.minions?.name || (attribute.customInputs as CustomInputsPartial)?.minionsConfig?.name;
        if (minionsName) out.push(String(minionsName));
      }
      // Companion name
      if (key === 'companion' || nameLower === 'companion') {
        const companionName = (attribute.customInputs as CustomInputsPartial)?.companionConfig?.name;
        if (companionName) out.push(String(companionName));
      }
      return out;
    })();
    // For Augmented, display the targeted stat and value
    const augmentedSection: string[] = (() => {
      const key = (attribute.template?.key || attribute.template?.name?.toLowerCase());
      if (key === 'augmented') {
        const stat = (attribute.customInputs as CustomInputsPartial)?.stat_target;
        const lvl = attribute.level || 1;
        if (stat) return [`${stat}: ${lvl}`];
      }
      return [];
    })();

    // For Change State, display the chosen state type
    const changeStateSection: string[] = (() => {
      const key = (attribute.template?.key || attribute.template?.name?.toLowerCase());
      if (key === 'change_state' || (attribute.template?.name || '').toLowerCase() === 'change state') {
        const st = (attribute.customInputs as CustomInputsPartial)?.state_type;
        if (st) return [`State: ${st}`];
      }
      return [];
    })();

    // For Cognition, show chosen type (Precognition or Postcognition)
    const cognitionSection: string[] = (() => {
      const key = (attribute.template?.key || attribute.template?.name?.toLowerCase());
      if (key === 'cognition') {
        const t = (attribute.customInputs as CustomInputsPartial)?.cognition_type;
        if (t) return [t];
      }
      return [];
    })();

    const enhancementsSection: string[] = ([...(attribute.enhancements || [])]
      .sort((a, b) => a.template.name.localeCompare(b.template.name))
      .map(e => `${e.template.name} -${e.template.picks || 1}`));
    const limitersSection: string[] = ([...(attribute.limiters || [])]
      .sort((a, b) => a.template.name.localeCompare(b.template.name))
      .map(l => {
        const picks = l.assignments ?? (l.template.picks ?? 1);
        const focus = (l as Partial<AttributeLimiter>)?.focus ? `: ${(l as Partial<AttributeLimiter>).focus}` : '';
        return `${l.template.name}${focus} +${picks}`;
      }));
    const techniquesSection: string[] = (attribute.selectedOptions && attribute.selectedOptions.length > 0)
      ? [attribute.selectedOptions.join(', ')]
      : [];

    // Always list: Augmented/Change State/Cognition first (if any), then primary names, then techniques/options, then enhancements, then limiters
    parts.push(...augmentedSection, ...changeStateSection, ...cognitionSection, ...primaryNames, ...(techniquesSection.length ? techniquesSection : []), ...enhancementsSection, ...limitersSection);

    if (parts.length === 0) {
      return '';
    }

    return `(${parts.join('; ')})`;
  };
  
  // Enhancement modal state
  const [isEnhancementModalOpen, setIsEnhancementModalOpen] = useState(false);
  const [currentEnhancements, setCurrentEnhancements] = useState<AttributeEnhancement[]>([]);
  
  // Limiter modal state
  const [isLimiterModalOpen, setIsLimiterModalOpen] = useState(false);
  const [currentLimiters, setCurrentLimiters] = useState<AttributeLimiter[]>([]);

  useEffect(() => {
    setAttributes(ATTRIBUTES_LIBRARY);
    setAvailableSources(computeAvailableSourcesShared(ATTRIBUTES_LIBRARY));
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Category filter removed per request

  const handleAttributeSelect = (attribute: ExtendedAttributeTemplate, existingAttribute?: CharacterAttribute) => {
    setSelectedAttribute(attribute);
    if (existingAttribute) {
      setEditingAttribute(existingAttribute);
      setAttributeLevel(existingAttribute.level);
      setCustomInputs(existingAttribute.customInputs || {});
      setSelectedOptions(existingAttribute.selectedOptions || []);
      setCurrentEnhancements(existingAttribute.enhancements || []);
      setCurrentLimiters(existingAttribute.limiters || []);
      setAttributeNotes(existingAttribute.notes || '');
    } else {
      setEditingAttribute(null);
      setAttributeLevel(1);
      setCustomInputs({});
      setSelectedOptions([]);
      setCurrentEnhancements([]);
      setCurrentLimiters([]);
    }
  };

  // Removed unused handleLevelChange; using inline handlers on level controls

  // Removed unused handleCustomInputChange

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...selectedOptions];
    newOptions[index] = value;
    setSelectedOptions(newOptions);
  };

  const renderAttributeOptions = () => {
    // Do not render options picker for Skills; it uses a dedicated SP editor modal
    if (selectedAttribute && selectedAttribute.key === 'skills') return null;
    // Do not render dropdowns for Combat Technique; we'll use a free-text field instead
    if (selectedAttribute && (selectedAttribute.key === 'combat_technique' || selectedAttribute.name.toLowerCase() === 'combat technique')) return null;
    if (selectedAttribute && selectedAttribute.options_per_level && selectedAttribute.options_per_level.length > 0) {
      return Array.from({ length: attributeLevel }, (_, i) => (
        <div key={i} style={{ marginTop: '10px' }}>
          <label style={styles.inputLabel}>Technique {i + 1}:</label>
          <select
            value={selectedOptions[i] || ''}
            onChange={(e) => handleOptionChange(i, e.target.value)}
            style={styles.filterSelect} // Re-using existing style for consistency
            className="sheet-select"
          >
            <option value="">-- Select a Technique --</option>
            {selectedAttribute.options_per_level!.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      ));
    }
    return null;
  };

  const handleAddOrUpdateAttribute = () => {
    try {
      addToast('Processing attribute change...', 'info');
    } catch { /* ignore: toast optional */ }
    if (selectedAttribute) {
      const cost = calculateAttributeCost();
      const available = Number.isFinite(Number((character as unknown as { availableCP?: number })?.availableCP))
        ? Number((character as unknown as { availableCP?: number }).availableCP)
        : undefined;
      const payload = {
        level: attributeLevel,
        customInputs: (() => {
          // Merge companion config into custom inputs if present
          const base = { ...customInputs };
          if (selectedAttribute && (selectedAttribute.key === 'companion' || selectedAttribute.name.toLowerCase() === 'companion') && companionConfig) {
            base.companionConfig = companionConfig;
          }
          // Merge item config into custom inputs for Item attribute
          if (selectedAttribute && (selectedAttribute.key === 'items' || selectedAttribute.name.toLowerCase() === 'item') && itemConfig) {
            (base as Record<string, unknown>).itemConfig = itemConfig;
          }
          // Merge weapon config into custom inputs for Weapon attribute
          if (selectedAttribute && (selectedAttribute.key === 'weapon' || selectedAttribute.name.toLowerCase() === 'weapon') && weaponConfig) {
            (base as Record<string, unknown>).weaponConfig = weaponConfig;
          }
          // Stash Minions config in custom inputs for Minions attribute
          if (selectedAttribute && (selectedAttribute.key === 'minions' || selectedAttribute.name.toLowerCase() === 'minions') && minionsConfig) {
            (base as Record<string, unknown>).minionsConfig = minionsConfig;
          }
          // Stash Alternate Form draft in customInputs when adding new Alternate Form
          if (selectedAttribute && (selectedAttribute.key === 'alternate_form' || selectedAttribute.name.toLowerCase() === 'alternate form') && afDraft) {
            (base as Record<string, unknown>).alternateFormDraft = afDraft;
          }
          // Stash Metamorphosis draft in customInputs when adding new Metamorphosis
          if (selectedAttribute && (selectedAttribute.key === 'metamorphosis' || selectedAttribute.name.toLowerCase() === 'metamorphosis') && metaDraft) {
            (base as Record<string, unknown>).metamorphosisDraft = metaDraft;
          }
          return Object.keys(base).length > 0 ? base : undefined;
        })(),
        enhancements: currentEnhancements.length > 0 ? currentEnhancements : undefined,
        limiters: currentLimiters.length > 0 ? currentLimiters : undefined,
        selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
        notes: attributeNotes
      };
      if (editingAttribute) {
        onAttributeUpdate(editingAttribute.id, payload);
        try {
          const name = editingAttribute.template?.name || selectedAttribute.name;
          addToast(`Updated ${name} to Level ${attributeLevel}`, 'info');
        } catch { /* ignore: toast optional */ }
      } else {
        // Warn if over budget, but allow adding so user can manage later
        if (available != null && available < cost) {
          try {
            addToast(`Note: Adding ${selectedAttribute.name} (Cost ${cost} CP) exceeds available CP by ${cost - available}. You can adjust later.`, 'info');
          } catch { /* ignore: toast optional */ }
        }
        onAttributeAdd(selectedAttribute, attributeLevel, payload.customInputs, currentEnhancements, currentLimiters, payload.selectedOptions, attributeNotes);
        try {
          addToast(`Added Attribute: ${selectedAttribute.name} (Lvl ${attributeLevel})`, 'success');
        } catch { /* ignore: toast optional */ }
      }
      setSelectedAttribute(null);
      setEditingAttribute(null);
      setAttributeLevel(1);
      setCustomInputs({});
      setCurrentEnhancements([]);
      setCurrentLimiters([]);
      setSelectedOptions([]);
      setAttributeNotes('');
      setCompanionConfig(undefined);
      setItemConfig(undefined);
      setWeaponConfig(undefined);
      setMinionsConfig(undefined);
      setAfDraft(undefined);
    }
  };
  
  // Enhancement handlers
  const handleOpenEnhancementModal = () => {
    if (selectedAttribute) {
      setIsEnhancementModalOpen(true);
    }
  };
  
  const handleCloseEnhancementModal = () => {
    setIsEnhancementModalOpen(false);
  };
  
  const handleAddEnhancement = (enhancement: AttributeEnhancement) => {
    setCurrentEnhancements(prev => [...prev, enhancement]);
    setIsEnhancementModalOpen(false);
  };
  
  const handleRemoveEnhancement = (enhancementId: string) => {
    setCurrentEnhancements(prev => prev.filter(enhancement => enhancement.id !== enhancementId));
  };
  
  // Limiter handlers
  const handleOpenLimiterModal = () => {
    if (selectedAttribute) {
      setIsLimiterModalOpen(true);
    }
  };
  
  const handleCloseLimiterModal = () => {
    setIsLimiterModalOpen(false);
  };
  
  const handleAddLimiter = (limiter: AttributeLimiter) => {
    setCurrentLimiters(prev => [...prev, limiter]);
    setIsLimiterModalOpen(false);
  };
  
  const handleRemoveLimiter = (limiterId: string) => {
    setCurrentLimiters(prev => prev.filter(limiter => limiter.id !== limiterId));
  };

  const handleRemoveAttribute = (attributeId: string) => {
    // Attempt to get the attribute name before removal
    const toRemove = (character.attributes || []).find(a => a.id === attributeId);
    onAttributeRemove(attributeId);
    try {
      const nm = toRemove?.template?.name || 'Attribute';
      addToast(`Removed ${nm}`, 'info');
    } catch { /* ignore: toast optional */ }
    if (editingAttribute?.id === attributeId) {
      setSelectedAttribute(null);
      setEditingAttribute(null);
      setAttributeLevel(1);
      setCustomInputs({});
    }
  };

  // Use shared helpers for formatting
  const formatRefs = (attr: AttributeTemplate) => formatRefsShared(attr);
  const cleanDescription = (attr: AttributeTemplate) => cleanDescriptionShared(attr);

  const filteredAttributes = attributes
    .filter(attribute => {
      const name = attribute.name.toLowerCase();
      const refsStr = formatRefs(attribute).toLowerCase();
      const description = cleanDescription(attribute).toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || description.includes(search) || (!!refsStr && refsStr.includes(search));

      // Human/Supernatural filter
      const isHuman = (attribute as ExtendedAttributeTemplate).is_human_attribute ?? (attribute as ExtendedAttributeTemplate).isHumanAttribute ?? false;
      const matchesHuman =
        humanFilter === 'all' ||
        (humanFilter === 'human' && !!isHuman) ||
        (humanFilter === 'nonhuman' && !isHuman);

      // Source filter
      const matchesSource = matchesSourceShared(attribute as AttributeTemplate, sourceFilter);

      return matchesSearch && matchesHuman && matchesSource;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const calculateAttributeCost = () => {
    if (!selectedAttribute) return 0;
    // Special case: Item attribute cost = floor(item points / 2), minimum 0
    if (selectedAttribute.key === 'items' || selectedAttribute.name.toLowerCase() === 'item') {
      const points = (customInputs as CustomInputsPartial)?.itemConfig?.spentCP ?? itemConfig?.spentCP ?? 0;
      return Math.max(0, Math.floor((Number(points) || 0) / 2));
    }
    
    // According to BESM rules: Enhancements and Limiters do NOT change cost
    // Cost is always based on the actual attribute level
    return (selectedAttribute.cost_per_level || 0) * attributeLevel;
  };
  
  const calculateEffectiveLevel = () => {
    if (!selectedAttribute) return 0;
    
    // Calculate enhancement picks (decreases effective level)
    const enhancementPicks = currentEnhancements.reduce((total, enhancement) => {
      return total + (enhancement.template.picks || 0);
    }, 0);
    
    // Calculate limiter picks (increases effective level)
    const limiterPicks = currentLimiters.reduce((total, limiter) => {
      return total + (limiter.template.picks || 0);
    }, 0);
    
    // Calculate raw effective level
    const rawEffectiveLevel = attributeLevel - enhancementPicks + limiterPicks;
    
    // Apply BESM rules for minimum effective level
    const isWeaponAttribute = selectedAttribute.name.toLowerCase().includes('weapon');
    
    if (isWeaponAttribute) {
      // Weapon attributes can have effective level 0 or -1, but not below -1
      return Math.max(-1, rawEffectiveLevel);
    } else {
      // All other attributes must have minimum effective level of 1
      return Math.max(1, rawEffectiveLevel);
    }
  };
  
  // Removed unused renderCustomInputs; custom inputs are handled inline where needed

  // Initialize enhancements and limiters from editing attribute if available
  useEffect(() => {
    if (editingAttribute) {
      setCurrentEnhancements(editingAttribute.enhancements || []);
      setCurrentLimiters(editingAttribute.limiters || []);
      // Preload companion config when editing a Companion attribute
      const isCompanion = editingAttribute.template?.key === 'companion' || editingAttribute.template?.name?.toLowerCase() === 'companion';
      if (isCompanion) {
        const cfg = (editingAttribute.customInputs as CustomInputsPartial)?.companionConfig;
        setCompanionConfig(cfg);
      } else {
        setCompanionConfig(undefined);
      }
      // Preload item config when editing an Item attribute
      const isItem = editingAttribute.template?.key === 'items' || editingAttribute.template?.name?.toLowerCase() === 'item';
      if (isItem) {
        const icfg = (editingAttribute.customInputs as CustomInputsPartial)?.itemConfig as ItemConfig | undefined;
        setItemConfig(icfg);
      } else {
        setItemConfig(undefined);
      }
      // Preload weapon config when editing a Weapon attribute
      const isWeapon = editingAttribute.template?.key === 'weapon' || editingAttribute.template?.name?.toLowerCase() === 'weapon';
      if (isWeapon) {
        const wcfg = (editingAttribute.customInputs as CustomInputsPartial)?.weaponConfig as WeaponConfig | undefined;
        setWeaponConfig(wcfg);
      } else {
        setWeaponConfig(undefined);
      }
      // Preload minions config when editing a Minions attribute
      const isMinions = editingAttribute.template?.key === 'minions' || editingAttribute.template?.name?.toLowerCase() === 'minions';
      if (isMinions) {
        const mcfg = editingAttribute.minions || (editingAttribute.customInputs as CustomInputsPartial)?.minionsConfig;
        setMinionsConfig(mcfg);
      } else {
        setMinionsConfig(undefined);
      }
    } else {
      setCurrentEnhancements([]);
      setCurrentLimiters([]);
      setCompanionConfig(undefined);
      setItemConfig(undefined);
      setWeaponConfig(undefined);
      setMinionsConfig(undefined);
    }
  }, [editingAttribute]);

  return (
    <div style={styles.attributesStep}>
      <h2 style={styles.header}>Character Attributes</h2>
      <p style={styles.description}>
        Attributes are special abilities, powers, and positive traits that define what your character can do. Each attribute costs Character Points based on its level.
      </p>
      
      {/* Enhancements Modal */}
      <EnhancementsModal
        isOpen={isEnhancementModalOpen}
        onClose={handleCloseEnhancementModal}
        attribute={selectedAttribute!}
        currentEnhancements={currentEnhancements}
        onAddEnhancement={handleAddEnhancement}
      />
      
      {/* Limiters Modal */}
      <LimitersModal
        isOpen={isLimiterModalOpen}
        onClose={handleCloseLimiterModal}
        attribute={selectedAttribute!}
        currentLimiters={currentLimiters}
        onAddLimiter={handleAddLimiter}
      />

      {/* Companion Builder Modal */}
      {selectedAttribute && (selectedAttribute.key === 'companion' || selectedAttribute.name.toLowerCase() === 'companion') && (
        <CompanionBuilderModal
          open={isCompanionOpen}
          onClose={() => setIsCompanionOpen(false)}
          initial={companionConfig}
          defaultLevel={(() => {
            const base = editingAttribute?.level ?? attributeLevel ?? 4;
            const clamped = Math.max(1, Math.min(6, Number(base) || 4));
            return clamped as 1 | 2 | 3 | 4 | 5 | 6;
          })()}
          onSave={(cfg) => {
            setCompanionConfig(cfg);
            setIsCompanionOpen(false);
          }}
        />
      )}

      {/* Item Builder Modal */}
      {selectedAttribute && (selectedAttribute.key === 'items' || selectedAttribute.name.toLowerCase() === 'item') && (
        <ItemBuilderModal
          open={isItemOpen}
          onClose={() => setIsItemOpen(false)}
          initial={itemConfig}
          onSave={(cfg) => {
            setItemConfig(cfg);
            setIsItemOpen(false);
            if (!attributeNotes) {
              const cost = Math.max(0, Math.floor((cfg.spentCP || 0) / 2));
              setAttributeNotes(`Item: ${cfg.name} • Points ${cfg.spentCP || 0} • Attribute Cost ${cost} CP`);
            }
          }}
        />
      )}

      {/* Weapon Builder Modal */}
      {selectedAttribute && (selectedAttribute.key === 'weapon' || selectedAttribute.name.toLowerCase() === 'weapon') && (
        <WeaponBuilderModal
          open={isWeaponOpen}
          onClose={() => setIsWeaponOpen(false)}
          level={attributeLevel}
          effectiveLevel={calculateEffectiveLevel()}
          existingConfig={weaponConfig}
          onSave={(cfg) => {
            setWeaponConfig(cfg);
            setIsWeaponOpen(false);
            if (!attributeNotes) {
              setAttributeNotes(`Weapon: ${cfg.name} • Base Damage Level: ${cfg.baseDamageLevel} • CP: ${cfg.spentCP}`);
            }
          }}
        />
      )}

      {/* Minions Builder Modal */}
      {selectedAttribute && (selectedAttribute.key === 'minions' || selectedAttribute.name.toLowerCase() === 'minions') && (
        <MinionsBuilderModal
          open={isMinionsOpen}
          onClose={() => setIsMinionsOpen(false)}
          attributeId={editingAttribute?.id}
          level={attributeLevel}
          effectiveLevel={(() => {
            const enh = (currentEnhancements || []).reduce((s, e) => s + (e.template?.picks || 1), 0);
            const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template?.picks ?? 1), 0);
            return Math.max(1, attributeLevel - enh + lim);
          })()}
          character={character}
          existingConfig={minionsConfig}
          onSave={(cfg) => {
            setMinionsConfig(cfg);
            setIsMinionsOpen(false);
            // If editing an existing attribute, immediately persist via update so hook normalizes to attribute.minions
            if (editingAttribute?.id) {
              onAttributeUpdate(editingAttribute.id, { minions: cfg });
            }
            if (!attributeNotes) {
              setAttributeNotes(`Minions: ${cfg.name} • Per-Min Budget ${cfg.perMinionBudgetCP} CP • Spent ${cfg.spentCP} CP`);
            }
          }}
        />
      )}

      {/* Skills Editor Modal */}
      {selectedAttribute && (selectedAttribute.key === 'skills' || selectedAttribute.name.toLowerCase() === 'skills') && (
        <Modal
          isOpen={isSkillsModalOpen}
          onClose={() => setIsSkillsModalOpen(false)}
          title="Edit Skills (SP)"
          maxWidth="1000px"
          maxHeight="85vh"
        >
          <Step6Skills character={character} onCharacterChange={onCharacterChange} />
        </Modal>
      )}

      <div className="attributes-main-content" style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div style={styles.searchFilterContainer}>
            <input
              type="text"
              placeholder="Search attributes..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={styles.searchInput}
              className="sheet-input"
            />
            <select
              value={humanFilter}
              onChange={(e) => setHumanFilter(e.target.value as 'all' | 'human' | 'nonhuman')}
              style={styles.filterSelect}
              className="sheet-select"
            >
              <option value="all">All</option>
              <option value="human">Human</option>
              <option value="nonhuman">Supernatural</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={styles.filterSelect}
              className="sheet-select"
            >
              <option value="all">All Sources</option>
              {availableSources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
          <div style={styles.attributesList}>
            {filteredAttributes.map(attr => (
              <div
                key={attr.id}
                style={selectedAttribute?.id === attr.id ? { ...styles.attributeItem, ...styles.attributeItemSelected } : styles.attributeItem}
                onClick={() => handleAttributeSelect(attr)}
              >
                <div style={styles.attributeItemHeader}>
                  <span style={styles.attributeName}>{attr.name}</span>
                  <span style={styles.attributeCost}>{attr.cost_per_level} CP/Lvl</span>
                </div>
                <p style={styles.attributeItemDescription}>
                  {(() => {
                    const base = cleanDescription(attr);
                    // Do not display page refs in the list panel; details panel shows them.
                    return base;
                  })()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.rightPanel}>
          {selectedAttribute ? (
            <div style={styles.attributeDetails}>
              <h3 style={styles.detailHeader}>{(() => {
                // If editing a Unique Attribute and it has a custom description, show that instead of the generic name
                const selName = selectedAttribute?.name || '';
                const selKey = (selectedAttribute?.key || selName.toLowerCase());
                const isUniqueSel = selKey === 'unique_attribute' || selName.toLowerCase() === 'unique attribute';
                const editingIsUnique = !!(editingAttribute && ((editingAttribute.template?.key === 'unique_attribute') || (editingAttribute.template?.name || '').toLowerCase() === 'unique attribute'));
                if (editingIsUnique) {
                  const custom = (editingAttribute?.customInputs as CustomInputsPartial)?.custom_description as string | undefined;
                  if (typeof custom === 'string' && custom.trim().length > 0) return custom.trim();
                }
                if (isUniqueSel) {
                  // Fallback to any in-progress custom input if available
                  const custom = (customInputs as CustomInputsPartial)?.custom_description as string | undefined;
                  if (typeof custom === 'string' && custom.trim().length > 0) return custom.trim();
                }
                return selName;
              })()}</h3>
              <p style={styles.costPerLevel}>Cost: {selectedAttribute.cost_per_level} CP per level</p>
              {(() => {
                const base = cleanDescription(selectedAttribute);
                const refs = formatRefs(selectedAttribute);
                const refsText = refs.replace(/^Source\(s\):\s*/, '');
                return (
                  <>
                    <p className="desc-desktop" style={styles.description}>{base}</p>
                    {refs && (
                      <p className="desc-desktop" style={{ ...styles.description, marginTop: '-6px' }}>
                        <strong>Source(s):</strong> {refsText}
                      </p>
                    )}
                  </>
                );
              })()}

              {/* Level controls (match Step 2 circular controls) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 12px' }}>
                <label style={{ ...styles.inputLabel, margin: 0 }}>Level</label>
                <button
                  type="button"
                  onClick={() => setAttributeLevel(prev => Math.max(1, (Number(prev) || 1) - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--besm-light-pink)',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, minWidth: 32, maxWidth: 32, lineHeight: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  aria-label="Decrease Level"
                >
                  -
                </button>
                <div
                  style={{
                    fontSize: '1.5rem', fontWeight: 'bold', backgroundColor: 'var(--besm-button-blue)', color: 'white',
                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  aria-live="polite"
                  aria-label={`Level value`}
                >
                  {attributeLevel}
                </div>
                <button
                  type="button"
                  onClick={() => setAttributeLevel(prev => Math.max(1, (Number(prev) || 1) + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--besm-light-pink)',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, minWidth: 32, maxWidth: 32, lineHeight: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  aria-label="Increase Level"
                >
                  +
                </button>
              </div>

              {/* Minions Builder Modal */}
              {selectedAttribute && (selectedAttribute.key === 'minions' || selectedAttribute.name.toLowerCase() === 'minions') && (
                <MinionsBuilderModal
                  open={isMinionsOpen}
                  onClose={() => setIsMinionsOpen(false)}
                  attributeId={editingAttribute?.id}
                  level={attributeLevel}
                  effectiveLevel={(() => {
                    const enh = (currentEnhancements || []).reduce((s, e) => s + (e.template?.picks || 1), 0);
                    const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template?.picks ?? 1), 0);
                    return Math.max(1, attributeLevel - enh + lim);
                  })()}
                  character={character}
                  existingConfig={minionsConfig}
                  onSave={(cfg) => {
                    setMinionsConfig(cfg);
                    setIsMinionsOpen(false);
                    // If editing an existing attribute, immediately persist via update so hook normalizes to attribute.minions
                    if (editingAttribute?.id) {
                      onAttributeUpdate(editingAttribute.id, { minions: cfg });
                    }
                    if (!attributeNotes) {
                      setAttributeNotes(`Minions: ${cfg.name} • Per-Min Budget ${cfg.perMinionBudgetCP} CP • Spent ${cfg.spentCP} CP`);
                    }
                  }}
                />
              )}

              {/* Skills Editor Modal */}
          {selectedAttribute && (selectedAttribute.key === 'skills' || selectedAttribute.name.toLowerCase() === 'skills') && (
            <Modal
              isOpen={isSkillsModalOpen}
              onClose={() => setIsSkillsModalOpen(false)}
              title="Edit Skills (SP)"
              maxWidth="1000px"
              maxHeight="85vh"
            >
              <Step6Skills character={character} onCharacterChange={onCharacterChange} />
            </Modal>
          )}

          {/* Skills attribute: open SP editor (placed above Enhancements/Limiters) */}
          {selectedAttribute && (selectedAttribute.key === 'skills' || selectedAttribute.name.toLowerCase() === 'skills') && (
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={openSkillsModalWithSync}
                style={styles.enhancementButton}
              >
                Edit Skills (Spend SP)
              </button>
              <div style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                SP Budget: {attributeLevel * 10} • Spent: {totalSkillSP}
              </div>
            </div>
          )}

          {/* Builder edit buttons for special attributes */}
          {selectedAttribute && (() => {
            const key = selectedAttribute.key || selectedAttribute.name.toLowerCase();
            const nameLower = selectedAttribute.name.toLowerCase();
            if (key === 'alternate_form' || nameLower === 'alternate form') {
              return (
                <div style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => setIsAfBuilderOpen(true)}
                    style={styles.enhancementButton}
                  >
                    Edit Alternate Form
                  </button>
                  {(() => {
                    const enh = currentEnhancements?.length || 0;
                    const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template?.picks ?? 1), 0);
                    const eff = Math.max(1, attributeLevel - enh + lim);
                    const existing = editingAttribute?.alternateForm || afDraft;
                    const budget = existing?.budgetCP ?? eff * 5;
                    const spent = existing?.spentCP ?? 0;
                    return (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                        Budget: {budget} CP • Spent: {spent} CP
                      </div>
                    );
                  })()}
                </div>
              );
            }
            if (key === 'metamorphosis' || nameLower === 'metamorphosis') {
              return (
                <div style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => setIsMetaBuilderOpen(true)}
                    style={styles.enhancementButton}
                  >
                    Edit Metamorphosis
                  </button>
                  {(() => {
                    const enh = currentEnhancements?.length || 0;
                    const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template?.picks ?? 1), 0);
                    const eff = Math.max(1, attributeLevel - enh + lim);
                    const existing = editingAttribute?.metamorphosis || metaDraft;
                    const budget = existing?.budgetCP ?? eff * 5;
                    const spent = existing?.spentCP ?? 0;
                    return (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                        Budget: {budget} CP • Spent: {spent} CP
                      </div>
                    );
                  })()}
                </div>
              );
            }
            if (key === 'companion' || nameLower === 'companion') {
              return (
                <div style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => setIsCompanionOpen(true)}
                    style={styles.enhancementButton}
                  >
                    Edit Companion
                  </button>
                  {(() => {
                    const budget = (companionConfig?.level ? companionConfig.level * 10 : (attributeLevel * 10));
                    const spent = companionConfig?.spentCP ?? 0;
                    return (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                        Budget: {budget} CP • Spent: {spent} CP
                      </div>
                    );
                  })()}
                </div>
              );
            }
            if (key === 'items' || nameLower === 'item') {
              return (
                <div style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => setIsItemOpen(true)}
                    style={styles.enhancementButton}
                  >
                    Edit Item
                  </button>
                  {(() => {
                    const points = (itemConfig?.spentCP ?? (customInputs as CustomInputsPartial)?.itemConfig?.spentCP ?? 0) as number;
                    const attrCost = Math.max(0, Math.floor((Number(points) || 0) / 2));
                    return (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                        Points: {points} • Attribute Cost: {attrCost} CP
                      </div>
                    );
                  })()}
                </div>
              );
            }
            if (key === 'weapon' || nameLower === 'weapon') {
              return (
                <div style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => setIsWeaponOpen(true)}
                    style={styles.enhancementButton}
                  >
                    Edit Weapon
                  </button>
                  {(() => {
                    const cfg = weaponConfig ?? (customInputs as CustomInputsPartial)?.weaponConfig;
                    const baseDmg = cfg?.baseDamageLevel ?? 1;
                    const points = cfg?.spentCP ?? 0;
                    return (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                        Base Damage: {baseDmg} • CP: {points}
                      </div>
                    );
                  })()}
                </div>
              );
            }
            if (key === 'minions' || nameLower === 'minions') {
              return (
                <div style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => setIsMinionsOpen(true)}
                    style={styles.enhancementButton}
                  >
                    Edit Minions
                  </button>
                  {(() => {
                    const budget = (minionsConfig?.perMinionBudgetCP ?? Math.max(1, attributeLevel - (currentEnhancements?.length||0) + (currentLimiters||[]).reduce((s,l)=> s + (l.assignments ?? l.template?.picks ?? 1),0)) * 5);
                    const spent = minionsConfig?.spentCP ?? 0;
                    return (
                      <div style={{ marginTop: '6px', fontSize: '0.9rem', color: 'var(--besm-dark-text)' }}>
                        Per-Min Budget: {budget} CP • Spent: {spent} CP
                      </div>
                    );
                  })()}
                </div>
              );
            }
            return null;
          })()}

              {renderAttributeOptions()}

              {/* Combat Technique: free-text list like Alternate Identity */}
              {selectedAttribute && ((selectedAttribute.key === 'combat_technique') || (selectedAttribute.name.toLowerCase() === 'combat technique')) && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Techniques</label>
                  <textarea
                    value={(selectedOptions || []).join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const parsed = raw
                        .split(/[,\n]/)
                        .map(s => s.trim())
                        .filter(Boolean)
                        .slice(0, Math.max(0, attributeLevel));
                      setSelectedOptions(parsed);
                    }}
                    placeholder={`List techniques (comma or newline separated). Level ${attributeLevel} allows ${attributeLevel} technique${attributeLevel>1?'s':''}.`}
                    style={{ width: '100%', minHeight: '60px', padding: '8px', border: '1px solid var(--besm-light-gray)', borderRadius: '6px', resize: 'vertical' }}
                    className="sheet-input"
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--besm-dark-text)' }}>
                    {selectedOptions.length}/{attributeLevel} selected
                  </div>
                </div>
              )}

              {/* Augmented: choose stat target and toggle active state */}
              {selectedAttribute && ((selectedAttribute.key === 'augmented') || (selectedAttribute.name.toLowerCase() === 'augmented')) && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Stat Affected</label>
                  <select
                    value={String((customInputs as CustomInputsPartial)?.stat_target || '')}
                    onChange={(e) => setCustomInputs(prev => ({ ...prev, stat_target: e.target.value }))}
                    style={styles.filterSelect}
                    className="sheet-select"
                  >
                    <option value="">-- Select a Stat --</option>
                    <option value="Body">Body</option>
                    <option value="Mind">Mind</option>
                    <option value="Soul">Soul</option>
                  </select>
                </div>
              )}

              {/* Change State: choose the state type */}
              {selectedAttribute && ((selectedAttribute.key === 'change_state') || (selectedAttribute.name.toLowerCase() === 'change state')) && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>State Type</label>
                  <select
                    value={String((customInputs as CustomInputsPartial)?.state_type || '')}
                    onChange={(e) => setCustomInputs(prev => ({ ...prev, state_type: e.target.value }))}
                    style={styles.filterSelect}
                    className="sheet-select"
                  >
                    <option value="">-- Select a State --</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Gaseous">Gaseous</option>
                    <option value="Incorporeal">Incorporeal</option>
                    <option value="Energy">Energy</option>
                  </select>
                </div>
              )}

              {/* Cognition: choose type */}
              {selectedAttribute && ((selectedAttribute.key === 'cognition') || (selectedAttribute.name.toLowerCase() === 'cognition')) && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Cognition Type</label>
                  <select
                    value={String((customInputs as CustomInputsPartial)?.cognition_type || '')}
                    onChange={(e) => setCustomInputs(prev => ({ ...prev, cognition_type: e.target.value }))}
                    style={styles.filterSelect}
                    className="sheet-select"
                  >
                    <option value="">-- Select Type --</option>
                    <option value="Precognition">Precognition</option>
                    <option value="Postcognition">Postcognition</option>
                  </select>
                </div>
              )}

              {/* Alternate Identity: user-provided list of identities */}
              {selectedAttribute && ((selectedAttribute.key === 'alternate_identity') || (selectedAttribute.name.toLowerCase() === 'alternate identity')) && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Alternate Identities</label>
                  <textarea
                    value={String((customInputs as CustomInputsPartial)?.alternateIdentities || '')}
                    onChange={(e) => setCustomInputs(prev => ({ ...prev, alternateIdentities: e.target.value }))}
                    placeholder={`List identities (comma or newline separated). Level ${attributeLevel} allows ${attributeLevel} identity${attributeLevel>1?'ies':'y'}.`}
                    style={{ width: '100%', minHeight: '60px', padding: '8px', border: '1px solid var(--besm-light-gray)', borderRadius: '6px', resize: 'vertical' }}
                    className="sheet-input"
                  />
                </div>
              )}

              {/* Mobile-only attribute description placed after controls */}
              <p className="desc-mobile" style={styles.description}>{selectedAttribute.description}</p>

              {/* Show attribute notes (preview) if any */}
              {attributeNotes && (
                <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--besm-light-bg)', borderRadius: '6px' }}>
                  <h4 style={{ margin: 0, marginBottom: '6px', fontWeight: 'bold' }}>Attribute Description</h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{attributeNotes}</p>
                </div>
              )}

              {/* Alternate Form summary if present on editing attribute */}
              {editingAttribute?.alternateForm && (
                <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--besm-light-bg)', borderRadius: '6px' }}>
                  <h4 style={{ margin: 0, marginBottom: '6px', fontWeight: 'bold' }}>Alternate Form</h4>
                  <div style={{ fontWeight: 600 }}>{editingAttribute.alternateForm.name}</div>
                  {editingAttribute.alternateForm.notes && (
                    <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{editingAttribute.alternateForm.notes}</p>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {(() => {
                      const enh = currentEnhancements?.length || 0;
                      const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template.picks ?? 1), 0);
                      const eff = Math.max(1, attributeLevel - enh + lim);
                      return (
                        <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Level: {attributeLevel} ({eff})</span>
                      );
                    })()}
                    <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Budget: {editingAttribute.alternateForm.budgetCP} CP</span>
                    <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Spent: {editingAttribute.alternateForm.spentCP} CP</span>
                    <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Remaining: {editingAttribute.alternateForm.remainingCP} CP</span>
                  </div>
                  {editingAttribute.alternateForm.formAttributes?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Form Attributes</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {editingAttribute.alternateForm.formAttributes.map(fa => (
                          <li key={fa.id} style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 6, padding: 8, marginBottom: 6, background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600 }}>{(() => {
                                const baseName = fa?.template?.name || '';
                                const key = (fa?.template?.key || baseName.toLowerCase());
                                if (key === 'unique_attribute' || baseName.toLowerCase() === 'unique attribute') {
                                  const custom = (fa as { customInputs?: { custom_description?: string } })?.customInputs?.custom_description;
                                  if (typeof custom === 'string' && custom.trim().length > 0) return custom.trim();
                                }
                                return baseName;
                              })()}</span>
                              <span style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>L{fa.level} • {fa.cpCost} CP</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Metamorphosis summary if present on editing attribute */}
              {editingAttribute?.metamorphosis && (
                <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--besm-light-bg)', borderRadius: '6px' }}>
                  <h4 style={{ margin: 0, marginBottom: '6px', fontWeight: 'bold' }}>Metamorphosis</h4>
                  <div style={{ fontWeight: 600 }}>{editingAttribute.metamorphosis.name}</div>
                  {editingAttribute.metamorphosis.notes && (
                    <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{editingAttribute.metamorphosis.notes}</p>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {(() => {
                      const enh = currentEnhancements?.length || 0;
                      const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template.picks ?? 1), 0);
                      const eff = Math.max(1, attributeLevel - enh + lim);
                      return (
                        <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Level: {attributeLevel} ({eff})</span>
                      );
                    })()}
                    <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Budget: {editingAttribute.metamorphosis.budgetCP} CP</span>
                    <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Spent: {editingAttribute.metamorphosis.spentCP} CP</span>
                    <span style={{ background: 'var(--besm-light-bg)', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>Remaining: {editingAttribute.metamorphosis.remainingCP} CP</span>
                  </div>
                  {editingAttribute.metamorphosis.formAttributes?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Form Attributes</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {editingAttribute.metamorphosis.formAttributes.map(fa => (
                          <li key={fa.id} style={{ border: '1px solid var(--besm-light-gray)', borderRadius: 6, padding: 8, marginBottom: 6, background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600 }}>{(() => {
                                const baseName = fa?.template?.name || '';
                                const key = (fa?.template?.key || baseName.toLowerCase());
                                if (key === 'unique_attribute' || baseName.toLowerCase() === 'unique attribute') {
                                  const custom = (fa as { customInputs?: { custom_description?: string } })?.customInputs?.custom_description;
                                  if (typeof custom === 'string' && custom.trim().length > 0) return custom.trim();
                                }
                                return baseName;
                              })()}</span>
                              <span style={{ fontSize: 12, color: 'var(--besm-dark-text)' }}>L{fa.level} • {fa.cpCost} CP</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.enhancementButtons}>
                <button 
                  style={styles.enhancementButton}
                  onClick={handleOpenEnhancementModal}
                >
                  Enhancements {currentEnhancements.length > 0 && `(${currentEnhancements.length})`}
                </button>
                <button 
                  style={styles.enhancementButton}
                  onClick={handleOpenLimiterModal}
                >
                  Limiters {currentLimiters.length > 0 && `(${currentLimiters.length})`}
                </button>
              </div>

              {/* Display current enhancements */}
              {currentEnhancements.length > 0 && (
                <div style={{marginTop: '16px', padding: '12px', backgroundColor: 'var(--besm-light-bg)', borderRadius: '8px'}}>
                  <h4 style={{fontWeight: 'bold', marginBottom: '8px'}}>Selected Enhancements:</h4>
                  <ul style={{listStyle: 'none', padding: '0'}}>
                    {[...currentEnhancements]
                      .sort((a, b) => a.template.name.localeCompare(b.template.name))
                      .map(enhancement => (
                      <li key={enhancement.id} style={{marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid var(--besm-light-gray)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{fontWeight: 'bold'}}>{enhancement.template.name}</span>
                          <div>
                            <span style={{marginRight: '10px'}}>Picks: {enhancement.template.picks}</span>
                            <button 
                              onClick={() => handleRemoveEnhancement(enhancement.id)}
                              style={{
                                backgroundColor: 'var(--besm-red)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {enhancement.notes && <p style={{fontSize: '0.9rem', marginTop: '4px'}}>{enhancement.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Display current limiters */}
              {currentLimiters.length > 0 && (
                <div style={{marginTop: '16px', padding: '12px', backgroundColor: 'var(--besm-light-bg)', borderRadius: '8px'}}>
                  <h4 style={{fontWeight: 'bold', marginBottom: '8px'}}>Selected Limiters:</h4>
                  <ul style={{listStyle: 'none', padding: '0'}}>
                    {[...currentLimiters]
                      .sort((a, b) => a.template.name.localeCompare(b.template.name))
                      .map(limiter => (
                      <li key={limiter.id} style={{marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid var(--besm-light-gray)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{fontWeight: 'bold'}}>{limiter.template.name}{(limiter as Partial<AttributeLimiter>)?.focus ? `: ${(limiter as Partial<AttributeLimiter>).focus}` : ''}</span>
                          <div>
                            <span style={{marginRight: '10px'}}>Picks: {limiter.assignments ?? limiter.template.picks}</span>
                            <button 
                              onClick={() => handleRemoveLimiter(limiter.id)}
                              style={{
                                backgroundColor: 'var(--besm-red)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {limiter.notes && <p style={{fontSize: '0.9rem', marginTop: '4px'}}>{limiter.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attribute notes input (collapsible) */}
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  style={{ padding: '8px 12px', backgroundColor: 'var(--besm-yellow)', color: '#000', border: '2px solid black', borderRadius: 5, fontWeight: 'bold' }}
                >
                  {showNotes ? 'Hide Notes' : 'Show Notes'} {(!showNotes && attributeNotes) ? '🛈' : ''}
                </button>
                {showNotes && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Description / Notes</label>
                    <textarea
                      value={attributeNotes}
                      onChange={(e) => setAttributeNotes(e.target.value)}
                      placeholder="Add a description for this attribute..."
                      style={{ width: '100%', minHeight: '70px', padding: '8px', border: '1px solid var(--besm-light-gray)', borderRadius: '6px', resize: 'vertical' }}
                      className="sheet-input"
                    />
                  </div>
                )}
              </div>

              {/* Cost and effective level */}
              <div style={{marginBottom: '16px'}}>
                <p style={styles.totalCost}>Total Cost: {calculateAttributeCost()} CP</p>
                {(currentEnhancements.length > 0 || currentLimiters.length > 0) && (
                  <p style={{...styles.totalCost, fontSize: '0.9rem', color: 'var(--besm-dark-text)'}}>
                    Level: {attributeLevel} ({calculateEffectiveLevel()})
                  </p>
                )}
              </div>

              

              {/* Validation warnings for effective level limits */}
              {(() => {
                const effectiveLevel = calculateEffectiveLevel();
                const isWeaponAttribute = selectedAttribute.name.toLowerCase().includes('weapon');

                if (!isWeaponAttribute && effectiveLevel === 1 && currentEnhancements.length > 0) {
                  return (
                    <p style={{fontSize: '0.8rem', color: 'var(--besm-red)', marginTop: '4px'}}>
                      ⚠️ Warning: Cannot add more enhancements - effective level cannot drop below 1
                    </p>
                  );
                }

                if (isWeaponAttribute && effectiveLevel === -1) {
                  return (
                    <p style={{fontSize: '0.8rem', color: 'var(--besm-red)', marginTop: '4px'}}>
                      ⚠️ Warning: Cannot add more enhancements - weapon effective level cannot drop below -1
                    </p>
                  );
                }

                if (isWeaponAttribute && effectiveLevel <= 0) {
                  return (
                    <p style={{fontSize: '0.8rem', color: 'var(--besm-orange)', marginTop: '4px'}}>
                      ℹ️ Note: Level {effectiveLevel} weapons have special damage rules (see BESM rulebook)
                    </p>
                  );
                }

                return null;
              })()}

              {/* Alternate Form Builder Modal mount for both new selection and editing */}
              {(() => {
                // Only mount when the selected or editing attribute is Alternate Form
                const isSelectedAF = selectedAttribute && (selectedAttribute.key === 'alternate_form' || selectedAttribute.name.toLowerCase() === 'alternate form');
                const isEditingAF = editingAttribute && (editingAttribute.template.key === 'alternate_form' || editingAttribute.template.name.toLowerCase() === 'alternate form');
                if (!isSelectedAF && !isEditingAF) return null;
                const enh = currentEnhancements?.length || 0;
                const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template?.picks ?? 1), 0);
                const eff = Math.max(1, attributeLevel - enh + lim);
                const budgetOverride = eff * 5;
                const existingConfig = isEditingAF ? editingAttribute!.alternateForm : afDraft;
                const attributeId = isEditingAF ? editingAttribute!.id : 'new';
                const handleSave = (config: AlternateFormConfig) => {
                  if (isEditingAF) {
                    onAttributeUpdate(editingAttribute!.id, { alternateForm: config });
                  } else {
                    setAfDraft(config);
                  }
                };
                return (
                  <AlternateFormBuilderModal
                    open={isAfBuilderOpen}
                    onClose={() => setIsAfBuilderOpen(false)}
                    attributeId={attributeId}
                    level={attributeLevel}
                    effectiveLevel={eff}
                    character={character}
                    existingConfig={existingConfig}
                    budgetOverride={budgetOverride}
                    onSave={handleSave}
                  />
                );
              })()}

              {/* Metamorphosis Builder Modal mount for both new selection and editing */}
              {(() => {
                // Only mount when the selected or editing attribute is Metamorphosis
                const isSelectedMeta = selectedAttribute && (selectedAttribute.key === 'metamorphosis' || selectedAttribute.name.toLowerCase() === 'metamorphosis');
                const isEditingMeta = editingAttribute && (editingAttribute.template.key === 'metamorphosis' || editingAttribute.template.name.toLowerCase() === 'metamorphosis');
                if (!isSelectedMeta && !isEditingMeta) return null;
                const enh = currentEnhancements?.length || 0;
                const lim = (currentLimiters || []).reduce((s, l) => s + (l.assignments ?? l.template?.picks ?? 1), 0);
                const eff = Math.max(1, attributeLevel - enh + lim);
                const budgetOverride = eff * 5;
                const existingConfig = isEditingMeta ? editingAttribute!.metamorphosis : metaDraft;
                const attributeId = isEditingMeta ? editingAttribute!.id : 'new';
                const handleSave = (config: AlternateFormConfig) => {
                  if (isEditingMeta) {
                    onAttributeUpdate(editingAttribute!.id, { metamorphosis: config });
                  } else {
                    setMetaDraft(config);
                  }
                };
                return (
                  <MetamorphosisBuilderModal
                    open={isMetaBuilderOpen}
                    onClose={() => setIsMetaBuilderOpen(false)}
                    attributeId={attributeId}
                    level={attributeLevel}
                    effectiveLevel={eff}
                    character={character}
                    existingConfig={existingConfig}
                    budgetOverride={budgetOverride}
                    onSave={handleSave}
                  />
                );
              })()}
              
              <button
                onClick={handleAddOrUpdateAttribute}
                style={styles.actionButton}
                // Allow adding even if over budget; we warn via toast in handler
                disabled={false}
              >
                {editingAttribute ? 'Update Attribute' : 'Add Attribute'}
              </button>
              
            </div>
          ) : (
            <div style={styles.placeholder}>
              <p>Select an attribute from the list to see details.</p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.selectedAttributesSection}>
        <h3 style={styles.header}>Selected Attributes</h3>
        {character.attributes.length === 0 ? (
          <p style={styles.description}>No attributes selected yet.</p>
        ) : (
          <div style={styles.selectedAttributesGrid}>
            {[...character.attributes]
              .sort((a, b) => {
                const nameCmp = a.template.name.localeCompare(b.template.name, undefined, { numeric: true, sensitivity: 'base' });
                if (nameCmp !== 0) return nameCmp;
                const aLvl = a.level ?? 0;
                const bLvl = b.level ?? 0;
                return aLvl - bLvl;
              })
              .map(attr => (
              <div
                key={attr.id}
                style={styles.selectedAttributeCard}
                onClick={() => {
                  // Resolve the attribute template from the library by key or name for robust selection
                  const tKey = (attr.template?.key || '').toString().toLowerCase();
                  const tName = (attr.template?.name || '').toString().toLowerCase();
                  const byKey = tKey ? attributes.find(a => (a.key || '').toString().toLowerCase() === tKey) : undefined;
                  const byName = !byKey && tName ? attributes.find(a => (a.name || '').toString().toLowerCase() === tName) : undefined;
                  const byId = !byKey && !byName ? attributes.find(a => a.id === attr.template.id) : undefined;
                  const resolved = (byKey || byName || byId) as ExtendedAttributeTemplate | undefined;
                  if (resolved) {
                    handleAttributeSelect(resolved, attr);
                  }
                }}
              >
                <div style={styles.selectedCardHeader}>
                  <span style={styles.attributeName}>{(() => {
                    const baseName = attr?.template?.name || '';
                    const key = (attr?.template?.key || baseName.toLowerCase());
                    if (key === 'unique_attribute' || baseName.toLowerCase() === 'unique attribute') {
                      const custom = (attr?.customInputs as CustomInputsPartial)?.custom_description as string | undefined;
                      if (typeof custom === 'string' && custom.trim().length > 0) {
                        return custom.trim();
                      }
                    }
                    return baseName;
                  })()}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {attr.notes && String(attr.notes).trim().length > 0 && (
                      <span title="Has notes" style={{ fontSize: 11, background: 'var(--besm-light-bg)', border: '1px solid var(--besm-light-gray)', borderRadius: 999, padding: '2px 6px' }}>🛈 Notes</span>
                    )}
                    <button style={styles.removeButton} onClick={() => handleRemoveAttribute(attr.id)}>×</button>
                  </div>
                </div>
                <div>{(() => { const enh = (attr.enhancements||[]).length; const lim = (attr.limiters||[]).reduce((s,l)=> s + (l.assignments ?? l.template?.picks ?? 1),0); const eff = Math.max(1, (attr.level||1) - enh + lim); return `Level: ${attr.level}${(enh||lim)?` (${eff})`:''}`; })()}</div>
                <div>Cost: {attr.cpCost} CP</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--besm-drk-blue)', marginTop: '4px' }}>
                  {formatAttributeDetails(attr)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4Attributes;