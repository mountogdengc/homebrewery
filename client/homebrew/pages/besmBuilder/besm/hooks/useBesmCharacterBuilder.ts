import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import { 
  BesmCharacter,
  CharacterAttribute,
  CharacterDefect,
  AttributeEnhancement,
  AttributeLimiter,
  AlternateFormConfig,
  MinionsConfig,
  createEmptyBesmCharacter,
} from '../types/besm-character';
import { AttributeTemplate, getAttributeByKey, ATTRIBUTES_LIBRARY } from '../data/attributesLibrary';
import { ClassTemplate } from '../data/classTemplatesLibrary';
import { RaceTemplate, getAllRaceTemplates } from '../data/raceTemplatesLibrary';
import { LIMITERS_LIBRARY } from '../data/limitersLibrary';
import { SizeTemplate, getAllSizeTemplates } from '../data/sizeTemplatesLibrary';
import { DefectTemplate, DEFECTS_LIBRARY } from '../data/defectsLibrary';

// Local helper types to avoid `any`
type StatMods = {
  dynamic?: boolean;
  base?: { Body?: number; Mind?: number; Soul?: number };
  derived?: Record<string, number>;
  multipliers?: Record<string, number>;
};

function getFromCustomInputs<T>(obj: Record<string, unknown> | undefined, key: string): T | undefined {
  if (!obj) return undefined;
  const val = obj[key];
  return (val as unknown) as T | undefined;
}

interface CharacterWithMethods {
  character: BesmCharacter;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetCharacter: () => void;
  updateCharacter: (updates: Partial<BesmCharacter>) => void;
  addAttribute: (template: AttributeTemplate, level?: number, customInputs?: Record<string, unknown>, enhancements?: AttributeEnhancement[], limiters?: AttributeLimiter[], selectedOptions?: string[], notes?: string) => void;
  updateAttribute: (id: string, updates: Partial<CharacterAttribute>) => void;
  removeAttribute: (id: string) => void;
  clearTemplates: () => void;
  getAttribute: (id: string) => CharacterAttribute | undefined;
  getAttributesByCategory: (category: string) => CharacterAttribute[];
  getTotalPointsSpent: () => number;
  getAvailableCP: () => number;
  getTotalCP: () => number;
  setTotalCP: (points: number) => void;
  setCharacterPoints: (points: number) => void;
  updateStat: (stat: keyof BesmCharacter['stats'], value: number) => void;
  addDefect: (defect: DefectTemplate, rank?: number, customInputs?: Record<string, unknown>, id?: string, notes?: string, source?: string) => void;
  updateDefect: (id: string, updates: Partial<CharacterDefect>) => void;
  removeDefect: (id: string) => void;
  applyRaceTemplate: (template: RaceTemplate) => void;
  applyClassTemplate: (template: ClassTemplate) => void;
  removeClassTemplate: () => void;
  applySizeTemplate: (template: SizeTemplate) => void;
  clearSizeTemplate: () => void;
  removeAppliedTemplate: (appliedId: string) => void;
  removeTemplatesByNameAndType: (type: 'class'|'race'|'size', name: string) => void;
  calculateEffectiveLevel: (level: number, enhancements?: AttributeEnhancement[], limiters?: AttributeLimiter[], attributeName?: string) => number;
  computeAlternateFormBudget: (level: number) => number;
  saveAlternateFormConfig: (attributeId: string, config: AlternateFormConfig) => void;
  // Metamorphosis helpers
  computeMetamorphosisBudget: (level: number) => number;
  saveMetamorphosisConfig: (attributeId: string, config: AlternateFormConfig) => void;
  // Minions helpers
  computeMinionsBudget: (totalCP: number) => number;
  saveMinionsConfig: (attributeId: string, config: MinionsConfig) => void;
  currentStep: number;
}

export const useBesmCharacterBuilder = (initialCharacter: Partial<BesmCharacter> = {}): CharacterWithMethods => {
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const [character, setCharacter] = useState<BesmCharacter>(() => {
    const emptyChar = createEmptyBesmCharacter();
    const initialStats = initialCharacter?.stats || {};
    
    return {
      ...emptyChar,
      ...initialCharacter,
      stats: {
        ...emptyChar.stats,
        ...initialStats,
      },
    };
  });

  // Centralized derived values computation based on current character state
  const calculateDerivedValuesFromState = useCallback((state: BesmCharacter) => {
    const baseBody = state.stats.body || 0;
    const baseMind = state.stats.mind || 0;
    const baseSoul = state.stats.soul || 0;

    let bodyMods = 0;
    let mindMods = 0;
    let soulMods = 0;

    // Keep SCV (Social Combat Value) separate from SV (Shock Value)
    const derivedMods: { [key: string]: number } = { CV: 0, ACV: 0, DCV: 0, HP: 0, EP: 0, DM: 0, SV: 0, SCV: 0 };
    const multipliers: { [key: string]: number } = { CV: 1, ACV: 1, DCV: 1, HP: 1, EP: 1, DM: 1, SV: 1, SCV: 1 };

    // Process Attributes
    (state.attributes || []).forEach((attr: CharacterAttribute) => {
      const statMods = (attr.template as unknown as { stat_mods?: StatMods })?.stat_mods;
      if (!statMods) return;
      const level = attr.level || 1;

      if (statMods.dynamic && (attr.template as AttributeTemplate)?.key === 'augmented' && getFromCustomInputs<string>(attr.customInputs, 'stat_target')) {
        const active = getFromCustomInputs<boolean>(attr.customInputs, 'active');
        if (active === false) {
          // intentionally no-op: Augmented is toggled inactive
        } else {
          const target = getFromCustomInputs<string>(attr.customInputs, 'stat_target');
          if (target === 'Body') bodyMods += level;
          if (target === 'Mind') mindMods += level;
          if (target === 'Soul') soulMods += level;
        }
      }

      if (statMods.base) {
        bodyMods += (statMods.base.Body ?? 0) * level;
        mindMods += (statMods.base.Mind ?? 0) * level;
        soulMods += (statMods.base.Soul ?? 0) * level;
      }

      if (statMods.derived) {
        for (const key in statMods.derived) {
          if (key in derivedMods) derivedMods[key] += statMods.derived[key] * level;
        }
      }

      if (statMods.multipliers) {
        for (const key in statMods.multipliers) {
          if (key in multipliers) multipliers[key] *= statMods.multipliers[key];
        }
      }
    });

    // Process Defects multipliers
    (state.defects || []).forEach((d: CharacterDefect) => {
      const dmods = (d.template as unknown as { stat_mods?: StatMods })?.stat_mods;
      if (dmods?.multipliers) {
        for (const key in dmods.multipliers) {
          if (key in multipliers) multipliers[key] *= dmods.multipliers[key];
        }
      }
    });

    // Final stats
    const finalBody = Math.max(0, baseBody + bodyMods);
    const finalMind = Math.max(0, baseMind + mindMods);
    const finalSoul = Math.max(0, baseSoul + soulMods);

    // Derived base
    let cv = Math.floor((finalBody + finalMind + finalSoul) / 3);
    let hp = (finalBody + finalSoul) * 5;
    let ep = (finalMind + finalSoul) * 5;
    // Shock Value (SV) and Social Combat Value (SCV) are separate
    let sv = finalBody * 2; // Shock Value
    let dm = 5;
    let scv = Math.floor((finalMind + finalSoul) / 2); // Social Combat Value

    // Apply direct modifiers
    cv += derivedMods.CV;
    let acv = cv + derivedMods.ACV;
    let dcv = cv + derivedMods.DCV;
    hp += derivedMods.HP;
    ep += derivedMods.EP;
    sv += derivedMods.SV;
    scv += derivedMods.SCV;
    dm += derivedMods.DM;

    // Apply multipliers
    acv = Math.floor(acv * multipliers.ACV * multipliers.CV);
    dcv = Math.floor(dcv * multipliers.DCV * multipliers.CV);
    hp = Math.floor(hp * multipliers.HP);
    ep = Math.floor(ep * multipliers.EP);
    sv = Math.floor(sv * multipliers.SV);
    dm = Math.floor(dm * multipliers.DM);
    scv = Math.floor(scv * multipliers.SCV);

    // Armor rating is not computed here; preserve existing unless NaN
    const armorRating = Number.isFinite(state.derivedValues?.armorRating) ? state.derivedValues.armorRating : 0;

    return {
      healthPoints: hp,
      energyPoints: ep,
      attackCombatValue: acv,
      defenseCombatValue: dcv,
      damage: dm,
      armorRating,
      scv,
      sv,
    } as BesmCharacter['derivedValues'];
  }, []);
  const updateCharacter = useCallback((updates: Partial<BesmCharacter>) => {
    setCharacter((prev: BesmCharacter) => {
      const next: BesmCharacter = { ...prev, ...updates } as BesmCharacter;
      // Recompute CP totals whenever character changes (local calc to avoid order issues)
      const statCostTotalLocal = (v: number) => (v <= 12 ? v * 2 : 24 + (v - 12) * 4);
      const attributesCost = (next.attributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
      const defectsRefund = (next.defects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
      const statsCost = statCostTotalLocal(next.stats.body) + statCostTotalLocal(next.stats.mind) + statCostTotalLocal(next.stats.soul);
      const spent = attributesCost - defectsRefund + statsCost;
      next.totalPointsSpent = spent;
      next.availableCP = next.totalCP - spent;
      // Recompute derived values
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [calculateDerivedValuesFromState]);

  // Alternate Form helpers
  const computeAlternateFormBudget = useCallback((level: number) => {
    return Math.max(0, level * 5);
  }, []);

  // Save/attach an Alternate Form configuration to a specific attribute
  const saveAlternateFormConfig = useCallback((attributeId: string, config: AlternateFormConfig) => {
    setCharacter((prev: BesmCharacter) => {
      const idx = prev.attributes.findIndex(a => a.id === attributeId);
      if (idx === -1) return prev;
      const attr = prev.attributes[idx];
      const level = config.level ?? attr.level ?? 1;
      const enhancementPicks = (attr.enhancements || []).length; // enhancements reduce effective level
      const limiterPicks = (attr.limiters || []).reduce((sum, l) => sum + (l.assignments || 1), 0);
      const effectiveLevel = Math.max(1, level - enhancementPicks + limiterPicks);
      const normalizedConfig: AlternateFormConfig = {
        ...config,
        level,
        budgetCP: computeAlternateFormBudget(effectiveLevel),
        spentCP: config.spentCP ?? 0,
        remainingCP: Math.max(0, computeAlternateFormBudget(effectiveLevel) - (config.spentCP ?? 0)),
      };
      const attributes = [...prev.attributes];
      attributes[idx] = { ...attr, alternateForm: normalizedConfig } as CharacterAttribute;
      const next: BesmCharacter = { ...prev, attributes } as BesmCharacter;
      const statCostTotalLocal = (v: number) => (v <= 12 ? v * 2 : 24 + (v - 12) * 4);
      const attributesCost = (next.attributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
      const defectsRefund = (next.defects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
      const statsCost = statCostTotalLocal(next.stats.body) + statCostTotalLocal(next.stats.mind) + statCostTotalLocal(next.stats.soul);
      const spent = attributesCost - defectsRefund + statsCost;
      next.totalPointsSpent = spent;
      next.availableCP = next.totalCP - spent;
      return next;
    });
  }, [computeAlternateFormBudget]);

  // Metamorphosis helpers (mirrors Alternate Form budget/save logic)
  const computeMetamorphosisBudget = useCallback((level: number) => {
    return Math.max(0, level * 5);
  }, []);

  const saveMetamorphosisConfig = useCallback((attributeId: string, config: AlternateFormConfig) => {
    setCharacter((prev: BesmCharacter) => {
      const idx = prev.attributes.findIndex(a => a.id === attributeId);
      if (idx === -1) return prev;
      const attr = prev.attributes[idx];
      const level = config.level ?? attr.level ?? 1;
      const enhancementPicks = (attr.enhancements || []).length;
      const limiterPicks = (attr.limiters || []).reduce((sum, l) => sum + (l.assignments || 1), 0);
      const effectiveLevel = Math.max(1, level - enhancementPicks + limiterPicks);
      const normalizedConfig: AlternateFormConfig = {
        ...config,
        level,
        budgetCP: computeMetamorphosisBudget(effectiveLevel),
        spentCP: config.spentCP ?? 0,
        remainingCP: Math.max(0, computeMetamorphosisBudget(effectiveLevel) - (config.spentCP ?? 0)),
      };
      const attributes = [...prev.attributes];
      attributes[idx] = { ...attr, metamorphosis: normalizedConfig } as CharacterAttribute;
      const next: BesmCharacter = { ...prev, attributes } as BesmCharacter;
      const statCostTotalLocal = (v: number) => (v <= 12 ? v * 2 : 24 + (v - 12) * 4);
      const attributesCost = (next.attributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
      const defectsRefund = (next.defects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
      const statsCost = statCostTotalLocal(next.stats.body) + statCostTotalLocal(next.stats.mind) + statCostTotalLocal(next.stats.soul);
      const spent = attributesCost - defectsRefund + statsCost;
      next.totalPointsSpent = spent;
      next.availableCP = next.totalCP - spent;
      return next;
    });
  }, [computeMetamorphosisBudget]);

  // Minions helpers
  const computeMinionsBudget = useCallback((totalCP: number) => {
    // Per BESM: each minion up to 1/5 of the character's total points
    return Math.max(0, Math.floor((totalCP || 0) / 5));
  }, []);

  const saveMinionsConfig = useCallback((attributeId: string, config: MinionsConfig) => {
    setCharacter((prev: BesmCharacter) => {
      const idx = prev.attributes.findIndex(a => a.id === attributeId);
      if (idx === -1) return prev;
      const attr = prev.attributes[idx];
      const level = config.level ?? attr.level ?? 1;
      // Effective level doesn't affect per-minion budget; count of minions is from level
      const perBudget = computeMinionsBudget(prev.totalCP);
      // Normalize per-minion spends
      const attrsCost = (config.minionAttributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
      const defectsRefund = (config.minionDefects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
      const spent = Math.max(0, attrsCost - defectsRefund);
      const normalized: MinionsConfig = {
        ...config,
        level,
        perMinionBudgetCP: perBudget,
        spentCP: config.spentCP ?? spent,
        remainingCP: Math.max(0, perBudget - (config.spentCP ?? spent)),
      };
      const attributes = [...prev.attributes];
      attributes[idx] = { ...attr, minions: normalized } as CharacterAttribute;
      const next: BesmCharacter = { ...prev, attributes } as BesmCharacter;
      // Recompute totals
      const statCostTotalLocal = (v: number) => (v <= 12 ? v * 2 : 24 + (v - 12) * 4);
      const attributesCost = (next.attributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
      const defectsRefundCh = (next.defects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
      const statsCost = statCostTotalLocal(next.stats.body) + statCostTotalLocal(next.stats.mind) + statCostTotalLocal(next.stats.soul);
      const totalSpent = attributesCost - defectsRefundCh + statsCost;
      next.totalPointsSpent = totalSpent;
      next.availableCP = next.totalCP - totalSpent;
      return next;
    });
  }, [computeMinionsBudget]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 7))); // Ensure step is between 1 and 7
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 7)); // Don't go past step 7
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1)); // Don't go below step 1
  }, []);

  const calculateAttributeCost = useCallback((template: AttributeTemplate, level: number) => {
    const costPerLevel = template.cost_per_level || 2;
    return costPerLevel * level;
  }, []);

  // Stat cost per official formula: 2/pt up to 12 inclusive; after 12 cost 4/pt
  const statCostTotal = useCallback((value: number) => {
    if (value <= 0) return 0;
    return value <= 12 ? value * 2 : 24 + (value - 12) * 4;
  }, []);

  const computeTotalPointsSpent = useCallback((state: BesmCharacter) => {
    const attributesCost = state.attributes.reduce((total: number, attr: CharacterAttribute) => total + (attr.cpCost || 0), 0);
    const defectsRefund = state.defects.reduce((total: number, defect: CharacterDefect) => total + (defect.cpRefund || 0), 0);
    const statsCost = statCostTotal(state.stats.body) + statCostTotal(state.stats.mind) + statCostTotal(state.stats.soul);
    return attributesCost - defectsRefund + statsCost;
  }, [statCostTotal]);

  const calculateEffectiveLevel = useCallback((level: number, enhancements: AttributeEnhancement[] = [], limiters: AttributeLimiter[] = [], attributeName?: string) => {
    const enhancementPicks = enhancements.reduce((total, enhancement) => total + (enhancement.template?.picks || 0), 0);
    const limiterPicks = limiters.reduce((total, limiter) => {
      const pickCount = limiter.assignments ?? limiter.template?.picks ?? 0;
      return total + pickCount;
    }, 0);
    const rawEffectiveLevel = level - enhancementPicks + limiterPicks;
    const isWeaponAttribute = attributeName?.toLowerCase().includes('weapon') || false;
    
    if (isWeaponAttribute) {
      return Math.max(-1, rawEffectiveLevel);
    } else {
      return Math.max(1, rawEffectiveLevel);
    }
  }, []);

  const addAttribute = useCallback((template: AttributeTemplate, level = 1, customInputs: Record<string, unknown> = {}, enhancements: AttributeEnhancement[] = [], limiters: AttributeLimiter[] = [], selectedOptions: string[] = [], notes: string = '') => {
    const cpCost = calculateAttributeCost(template, level);

    // Prepare attribute and attach minions config if provided in custom inputs
    const minionsFromInputs: MinionsConfig | undefined = getFromCustomInputs<MinionsConfig>(customInputs, 'minionsConfig');

    const newAttribute: CharacterAttribute = {
      id: uuidv4(),
      template,
      level,
      cpCost,
      notes: notes || '',
      source: 'custom',
      isCustom: true,
      customInputs: customInputs || {},
      enhancements: enhancements || [],
      defects: [],
      limiters: limiters || [],
      selectedOptions: selectedOptions || [],
    } as CharacterAttribute;

    // If minions config provided, normalize and attach on creation
    if (minionsFromInputs) {
      const perBudget = computeMinionsBudget(character.totalCP);
      const attrsCost = (minionsFromInputs.minionAttributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
      const defectsRefund = (minionsFromInputs.minionDefects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
      const spent = Math.max(0, attrsCost - defectsRefund);
      const normalized: MinionsConfig = {
        ...minionsFromInputs,
        level,
        perMinionBudgetCP: perBudget,
        spentCP: minionsFromInputs.spentCP ?? spent,
        remainingCP: Math.max(0, perBudget - (minionsFromInputs.spentCP ?? spent)),
      };
      (newAttribute).minions = normalized;
    }

    setCharacter((prev: BesmCharacter) => {
      const next: BesmCharacter = { ...prev, attributes: [...prev.attributes, newAttribute] } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [calculateAttributeCost, computeMinionsBudget, character.totalCP, computeTotalPointsSpent, calculateDerivedValuesFromState]);

  const updateAttribute = useCallback((id: string, updates: Partial<CharacterAttribute>) => {
    setCharacter((prev: BesmCharacter) => {
      const attributeIndex = prev.attributes.findIndex(attr => attr.id === id);
      if (attributeIndex === -1) return prev;
      
      const currentAttribute = prev.attributes[attributeIndex];
      const updatedEnhancements = updates.enhancements || currentAttribute.enhancements || [];
      const updatedLimiters = updates.limiters || currentAttribute.limiters || [];
      const updatedLevel = updates.level !== undefined ? updates.level : currentAttribute.level;

      const prospectiveEffectiveLevel = calculateEffectiveLevel(updatedLevel, updatedEnhancements, updatedLimiters, currentAttribute.template.name);
      const isWeapon = currentAttribute.template.name.toLowerCase().includes('weapon');
      
      if (!isWeapon && prospectiveEffectiveLevel < 1) {
        addToast('Enhancement would reduce Effective Level below 1.', 'error');
        return prev;
      } else if (isWeapon && prospectiveEffectiveLevel < -1) {
        addToast('Enhancement would reduce Weapon Effective Level below -1.', 'error');
        return prev;
      }

      const newCpCost = calculateAttributeCost(currentAttribute.template, updatedLevel);
      
      const attributes = [...prev.attributes];
      const nextAttr: CharacterAttribute = {
        ...currentAttribute,
        ...updates,
        level: updatedLevel,
        enhancements: updatedEnhancements,
        limiters: updatedLimiters,
        selectedOptions: updates.selectedOptions || currentAttribute.selectedOptions,
        cpCost: newCpCost
      } as CharacterAttribute;

      // Normalize and attach Minions config if provided via direct field or customInputs
      const providedMinions: MinionsConfig | undefined = updates.minions ?? getFromCustomInputs<MinionsConfig>(updates.customInputs as Record<string, unknown> | undefined, 'minionsConfig');
      if (providedMinions) {
        const perBudget = computeMinionsBudget(prev.totalCP);
        const attrsCost = (providedMinions.minionAttributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
        const defectsRefund = (providedMinions.minionDefects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
        const spent = Math.max(0, attrsCost - defectsRefund);
        const normalized: MinionsConfig = {
          ...providedMinions,
          level: updatedLevel,
          perMinionBudgetCP: perBudget,
          spentCP: providedMinions.spentCP ?? spent,
          remainingCP: Math.max(0, perBudget - (providedMinions.spentCP ?? spent)),
        };
        (nextAttr).minions = normalized;
      }

      attributes[attributeIndex] = nextAttr;
      
      const next: BesmCharacter = { ...prev, attributes } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [calculateAttributeCost, addToast, calculateEffectiveLevel, computeTotalPointsSpent, computeMinionsBudget, calculateDerivedValuesFromState]);


  const removeAttribute = useCallback((id: string) => {
    setCharacter((prev: BesmCharacter) => {
      const next: BesmCharacter = { ...prev, attributes: prev.attributes.filter((attr: CharacterAttribute) => attr.id !== id) } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  const clearTemplates = useCallback(() => {
    setCharacter((prev: BesmCharacter) => ({
      ...prev,
      templates: {
        class: null,
        race: null,
        size: null,
      },
      characterClass: null,
      race: undefined,
      class: undefined,
      size: undefined,
    }));
  }, []);

  const getAttribute = useCallback((id: string): CharacterAttribute | undefined => {
    return character.attributes.find((attr: CharacterAttribute) => attr.id === id);
  }, [character.attributes]);

  const getAttributesByCategory = useCallback((category: string): CharacterAttribute[] => {
    return character.attributes.filter((attr: CharacterAttribute) => attr.template.category === category);
  }, [character.attributes]);

  const getTotalPointsSpent = useCallback((): number => {
    return computeTotalPointsSpent(character);
  }, [character, computeTotalPointsSpent]);

  const getAvailableCP = useCallback(() => character.availableCP, [character.availableCP]);

  const getTotalCP = useCallback(() => character.totalCP, [character.totalCP]);

  const setTotalCP = useCallback((points: number) => {
    setCharacter((prev: BesmCharacter) => ({
      ...prev,
      totalCP: points,
      availableCP: points - getTotalPointsSpent()
    }));
  }, [getTotalPointsSpent]);

  const setCharacterPoints = useCallback((points: number) => {
    setCharacter((prev: BesmCharacter) => ({
      ...prev,
      totalCP: points,
      availableCP: points - getTotalPointsSpent()
    }));
  }, [getTotalPointsSpent]);

  const updateStat = useCallback((stat: keyof BesmCharacter['stats'], value: number) => {
    setCharacter((prev: BesmCharacter) => {
      const next: BesmCharacter = {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: value,
        },
      } as BesmCharacter;
      // Recompute locally
      const statCostTotalLocal = (v: number) => (v <= 12 ? v * 2 : 24 + (v - 12) * 4);
      const attributesCost = (next.attributes || []).reduce((t, a) => t + (a.cpCost || 0), 0);
      const defectsRefund = (next.defects || []).reduce((t, d) => t + (d.cpRefund || 0), 0);
      const statsCost = statCostTotalLocal(next.stats.body) + statCostTotalLocal(next.stats.mind) + statCostTotalLocal(next.stats.soul);
      const spent = attributesCost - defectsRefund + statsCost;
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [calculateDerivedValuesFromState]);

  const addDefect = useCallback((template: DefectTemplate, rank = 1, customInputs: Record<string, unknown> = {}, id?: string, notes?: string, source?: string) => {
    const cpRefund = (template.cp_refund || 0) * rank;
    const newDefect: CharacterDefect = {
      id: id || uuidv4(),
      template,
      rank,
      cpRefund,
      notes: notes ?? '',
      source: source ?? 'custom',
      customInputs: customInputs || {},
    };

    setCharacter((prev: BesmCharacter) => {
      const next: BesmCharacter = { ...prev, defects: [...prev.defects, newDefect] } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  const updateDefect = useCallback((id: string, updates: Partial<CharacterDefect>) => {
    setCharacter((prev: BesmCharacter) => {
      const defectIndex = prev.defects.findIndex((d: CharacterDefect) => d.id === id);
      if (defectIndex === -1) return prev;
      
      const currentDefect = prev.defects[defectIndex];
      const updatedRank = updates.rank !== undefined ? updates.rank : currentDefect.rank;
      const newCpRefund = (currentDefect.template.cp_refund || 0) * updatedRank;

      const updatedDefects = [...prev.defects];
      updatedDefects[defectIndex] = {
        ...currentDefect,
        ...updates,
        rank: updatedRank,
        cpRefund: newCpRefund,
      };
      
      const next: BesmCharacter = { ...prev, defects: updatedDefects } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  const removeDefect = useCallback((id: string) => {
    setCharacter((prev: BesmCharacter) => {
      const next: BesmCharacter = { ...prev, defects: prev.defects.filter((d: CharacterDefect) => d.id !== id) } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  // (removed) Legacy CP-neutral template helpers; replaced with cost/refund-aware versions

  // Hoisted helpers so they can be referenced in dependency arrays safely
  const addTemplateAttributesWithCost = useCallback((prev: BesmCharacter, entries: Array<{ key: string; custom_name?: string; level: number; options?: string[]; user_input?: string | null | Record<string, unknown>; points?: number }>, source: 'race' | 'class' | 'size'): CharacterAttribute[] => {
    const created: CharacterAttribute[] = [];
    for (const e of entries) {
      const rawKey = (e.key || '').trim();
      let tpl = rawKey ? (getAttributeByKey(rawKey) as AttributeTemplate | undefined) : undefined;
      if (!tpl && e.custom_name) {
        const nameLower = e.custom_name.toLowerCase();
        tpl = ATTRIBUTES_LIBRARY.find(a => a.name.toLowerCase() === nameLower) ||
              (getAttributeByKey(nameLower.replace(/\s+/g, '_')) as AttributeTemplate | undefined) ||
              (getAttributeByKey(nameLower.replace(/\s+/g, '-')) as AttributeTemplate | undefined) ||
              (getAttributeByKey(nameLower) as AttributeTemplate | undefined);
      }
      const template = tpl || ({
        id: e.key || (e.custom_name || '').toLowerCase().replace(/\s+/g, '-'),
        name: e.custom_name || e.key,
        key: e.key || (e.custom_name || ''),
        category: 'special',
        description: '',
        source: 'Template',
        baseCost: 0,
        hasLevels: true,
        levels: {},
      } as unknown as AttributeTemplate);
      const templateKeyName = `${(template.key || template.name || '')}`.toLowerCase();
      const isUniqueAttr = templateKeyName.includes('unique');
      let cpCost: number;
      if (isUniqueAttr) {
        const ui = (e.user_input && typeof e.user_input === 'object') ? (e.user_input as Record<string, unknown>) : {};
        const customCp = typeof ui['custom_cp_cost'] === 'number' ? (ui['custom_cp_cost'] as number) : undefined;
        const tplIndex = template as unknown as Record<string, unknown>;
        const costPerLevel: number = typeof tplIndex['cost_per_level'] === 'number' ? (tplIndex['cost_per_level'] as number) : 0;
        const perLevel = customCp ?? costPerLevel;
        if ((perLevel || 0) > 0) {
          cpCost = perLevel * (e.level ?? 1);
        } else {
          // No library cost_per_level and no custom_cp_cost — fall back to stored points total
          cpCost = typeof e.points === 'number' ? e.points : 0;
        }
      } else {
        cpCost = calculateAttributeCost(template, e.level ?? 1);
      }
      created.push({
        id: uuidv4(),
        template,
        level: e.level ?? 1,
        cpCost,
        notes: typeof e.user_input === 'string' ? (e.user_input as string) : '',
        source,
        isCustom: false,
        customInputs: (typeof e.user_input === 'object' && e.user_input !== null) ? (e.user_input as Record<string, unknown>) : {},
        enhancements: [],
        defects: [],
        limiters: [],
        selectedOptions: e.options || [],
      });
    }
    return [...prev.attributes, ...created];
  }, [calculateAttributeCost]);

  const addTemplateDefectsWithRefund = useCallback((prev: BesmCharacter, entries: Array<{ custom_name: string; key: string; rank: number; user_description?: string | null; cp_refund?: number }>, source: 'race' | 'class' | 'size'): CharacterDefect[] => {
    const created: CharacterDefect[] = entries.map((d) => {
      const rawKey = (d.key || '').trim().toLowerCase();
      const nameLower = (d.custom_name || '').trim().toLowerCase();
      let defectTpl = rawKey ? DEFECTS_LIBRARY.find(t => (t.key || '').toLowerCase() === rawKey) : undefined;
      if (!defectTpl && nameLower) {
        defectTpl = DEFECTS_LIBRARY.find(t => (t.name || '').toLowerCase() === nameLower);
      }
      // When library lookup succeeds: cp_refund is per-rank, multiply by rank.
      // When library lookup fails: stored cp_refund is already the total, use as-is.
      const perRankRefund = defectTpl?.cp_refund ?? null;
      const rank = d.rank ?? 1;
      const cpRefund = perRankRefund != null ? perRankRefund * rank : (d.cp_refund ?? 0);
      const template: DefectTemplate = defectTpl || ({
        id: d.key || (d.custom_name || '').toLowerCase().replace(/\s+/g, '-'),
        name: d.custom_name || d.key,
        key: d.key || d.custom_name,
        description: d.user_description || '',
        cp_refund: d.cp_refund ?? 0,
        rank_type: 'Lesser',
        max_rank: 3,
        ranks: [],
        category: 'general',
        source: 'Template',
      } as DefectTemplate);
      return {
        id: uuidv4(),
        template,
        rank,
        cpRefund,
        notes: '',
        source,
        customInputs: {},
      } as CharacterDefect;
    });
    return [...prev.defects, ...created];
  }, []);

  const applyClassTemplate = useCallback((template: ClassTemplate) => {
    setCharacter((prev: BesmCharacter) => {
      // Apply stat adjustments
      const statsApplied = (template.stats || []).reduce((acc, s: { stat?: string; value?: number }) => {
        const statKey = (s.stat || '').toLowerCase() as 'body' | 'mind' | 'soul';
        if (statKey in acc) acc[statKey] = Math.max(0, acc[statKey] + (s.value || 0));
        return acc;
      }, { ...prev.stats });

      // Strip attributes/defects that belong to the size template — they'll be applied separately
      const classSizeRank = template.baseSize.rank;
      const classSizeTpl = classSizeRank !== 0 ? getAllSizeTemplates().find(s => s.rank === classSizeRank) : undefined;
      const classSizeAttrKeys = new Set((classSizeTpl?.attributes || []).map(a => a.key.trim().toLowerCase()));
      const classSizeDefectKeys = new Set((classSizeTpl?.defects || []).map(d => d.key.trim().toLowerCase()));

      // Apply attributes and defects (with CP)
      type TemplateAttrRow = { key?: string | null; custom_name?: string | null; level?: number | null; options?: string[] | null; user_input?: string | Record<string, unknown> | null | undefined; points?: number | null };
      const addedAttrs = (template.attributes || [])
        .filter((a: TemplateAttrRow) => !classSizeAttrKeys.has((a.key ?? '').trim().toLowerCase()))
        .map((a: TemplateAttrRow) => ({
          key: (a.key ?? '') as string,
          custom_name: a.custom_name ?? undefined,
          level: (a.level ?? 1) as number,
          options: (a.options ?? undefined) as string[] | undefined,
          user_input: a.user_input,
          points: a.points ?? undefined,
        }));
      const classDefects = (template.defects || []).filter(d => !classSizeDefectKeys.has((d.key ?? '').trim().toLowerCase()));
      const attributes = addTemplateAttributesWithCost(prev, addedAttrs, 'class');
      const defects = addTemplateDefectsWithRefund(prev, classDefects, 'class');

      // Track applied template for removal
      const addedAttributeIds = attributes.slice(prev.attributes.length).map(a => a.id);
      const addedDefectIds = defects.slice(prev.defects.length).map(d => d.id);
      const appliedId = uuidv4();
      const appliedTemplates = [...(prev.appliedTemplates || []), { id: appliedId, type: 'class', key: template.name, name: template.name, addedAttributeIds, addedDefectIds, statsDelta: { body: (template.stats||[]).reduce((n,s)=> n + ((s.stat||'').toLowerCase()==='body'? (s.value||0):0),0), mind: (template.stats||[]).reduce((n,s)=> n + ((s.stat||'').toLowerCase()==='mind'? (s.value||0):0),0), soul: (template.stats||[]).reduce((n,s)=> n + ((s.stat||'').toLowerCase()==='soul'? (s.value||0):0),0) } }];

      const next: BesmCharacter = {
        ...prev,
        stats: statsApplied,
        attributes,
        defects,
        appliedTemplates,
      } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  const removeClassTemplate = useCallback(() => {
    setCharacter((prev: BesmCharacter) => ({
      ...prev,
      templates: {
        ...prev.templates,
        class: null
      },
      characterClass: null,
      class: undefined
    }));
  }, []);

  const applyRaceTemplate = useCallback((template: RaceTemplate) => {
    setCharacter((prev: BesmCharacter) => {
      // Stats adjustments
      type RaceStatAdj = { body_adj?: number | null; mind_adj?: number | null; soul_adj?: number | null };
      const statsApplied = (template.stats || []).reduce((acc, s: RaceStatAdj) => {
        const body = (s.body_adj ?? 0) as number;
        const mind = (s.mind_adj ?? 0) as number;
        const soul = (s.soul_adj ?? 0) as number;
        return {
          body: Math.max(0, acc.body + body),
          mind: Math.max(0, acc.mind + mind),
          soul: Math.max(0, acc.soul + soul),
        };
      }, { ...prev.stats });

      // Strip attributes/defects that belong to the size template — they'll be applied separately
      const raceSizeRank = template.baseSize.size_rank;
      const raceSizeTpl = raceSizeRank !== 0 ? getAllSizeTemplates().find(s => s.rank === raceSizeRank) : undefined;
      const sizeAttrKeys = new Set((raceSizeTpl?.attributes || []).map(a => a.key.trim().toLowerCase()));
      const sizeDefectKeys = new Set((raceSizeTpl?.defects || []).map(d => d.key.trim().toLowerCase()));

      type RaceAttrRow = { key?: string | null; custom_name?: string | null; level?: number | null; options?: string[] | null; user_input?: string | Record<string, unknown> | null | undefined; points?: number | null; user_description?: string | null };
      const addedAttrs = (template.attributes || [])
        .filter((a: RaceAttrRow) => !sizeAttrKeys.has((a.key ?? '').trim().toLowerCase()))
        .map((a: RaceAttrRow) => ({
          key: (a.key ?? '') as string,
          custom_name: a.custom_name ?? undefined,
          level: (a.level ?? 1) as number,
          options: (a.options ?? undefined) as string[] | undefined,
          user_input: a.user_input,
          points: a.points ?? undefined,
        }));
      const raceDefects = (template.defects || []).filter(d => !sizeDefectKeys.has((d.key ?? '').trim().toLowerCase()));
      let attributes = addTemplateAttributesWithCost(prev, addedAttrs, 'race');
      const defects = addTemplateDefectsWithRefund(prev, raceDefects, 'race');

      const addedAttributeIds = attributes.slice(prev.attributes.length).map(a => a.id);
      const addedDefectIds = defects.slice(prev.defects.length).map(d => d.id);
      const appliedId = uuidv4();
      const statsDelta = (template.stats as RaceStatAdj[] | undefined)?.reduce((acc, s) => ({ body: acc.body + ((s.body_adj ?? 0) as number), mind: acc.mind + ((s.mind_adj ?? 0) as number), soul: acc.soul + ((s.soul_adj ?? 0) as number) }), { body:0, mind:0, soul:0 }) || { body:0, mind:0, soul:0 };
      const appliedTemplates = [...(prev.appliedTemplates || []), { id: appliedId, type: 'race', key: template.race_name, name: template.race_name, addedAttributeIds, addedDefectIds, statsDelta }];

      // If this is WEREWOLF - BASE FORM, auto-wire the "WEREWOLF - WOLF FORM" as Alternate Form config
      if (template.race_name === 'WEREWOLF - BASE FORM') {
        const wolf = (getAllRaceTemplates() || []).find(r => r.race_name === 'WEREWOLF - WOLF FORM');
        if (wolf) {
          // Find the newly-added Alternate Form attribute among the attributes we just added
          const newAttrs = attributes.slice(prev.attributes.length);
          const altAttr = newAttrs.find(a => (a.template?.name || a.template?.key || a.notes || a.template)?.toString()?.toLowerCase().includes('alternate form')) || newAttrs.find(a => (a.template as AttributeTemplate | undefined)?.key === 'alternate_form');
          if (altAttr) {
            const level = altAttr.level || 1;
            // Ensure Delay +1 and Concentration +2 limiters are present by default
            const existingKeys = new Set((altAttr.limiters || []).map((l: AttributeLimiter) => l.template?.key));
            const delayT = LIMITERS_LIBRARY.find(l => l.key === 'delay');
            const concT = LIMITERS_LIBRARY.find(l => l.key === 'concentration');
            const toAdd: AttributeLimiter[] = [];
            if (delayT && !existingKeys.has('delay')) {
              toAdd.push({ id: uuidv4(), template: delayT, assignments: 1, notes: '' });
            }
            if (concT && !existingKeys.has('concentration')) {
              toAdd.push({ id: uuidv4(), template: concT, assignments: 2, notes: '' });
            }
            const updatedLimiters = [...(altAttr.limiters || []), ...toAdd];
            const enhPicks = (altAttr.enhancements || []).length;
            const limPicks = updatedLimiters.reduce((sum: number, l: AttributeLimiter) => sum + (l.assignments || 1), 0);
            const effLevel = Math.max(1, level - enhPicks + limPicks);
            const statDelta = ((wolf.stats as RaceStatAdj[]) || []).reduce((acc, s) => ({
              body: acc.body + (s.body_adj ?? 0),
              mind: acc.mind + (s.mind_adj ?? 0),
              soul: acc.soul + (s.soul_adj ?? 0),
            }), { body: 0, mind: 0, soul: 0 });
            // Pre-populate form attributes/defects from Wolf Form template
            const wolfAttrs = (wolf.attributes || [])
              .filter((a: RaceAttrRow) => {
                const key = (a.key || '').toLowerCase();
                const name = (a.custom_name || '').toLowerCase();
                if (key === 'metamorphosis' || key === 'alternate_form') return false;
                if (name.includes('metamorphosis') || name.includes('alternate form')) return false;
                return true;
              })
              .map((a: RaceAttrRow) => {
                // Resolve attribute template by key or custom_name
                const rawKey = (a.key || '').trim();
                let tpl = rawKey ? getAttributeByKey(rawKey) : undefined;
                if (!tpl && a.custom_name) {
                  const nameLower = a.custom_name.toLowerCase();
                  tpl = ATTRIBUTES_LIBRARY.find(at => at.name.toLowerCase() === nameLower)
                    || getAttributeByKey(nameLower.replace(/\s+/g, '_'))
                    || getAttributeByKey(nameLower.replace(/\s+/g, '-'))
                    || getAttributeByKey(nameLower || '');
                }
                const template = (tpl as AttributeTemplate) || ({
                  id: rawKey || (a.custom_name || '').toLowerCase().replace(/\s+/g, '-'),
                  name: a.custom_name || rawKey,
                  key: rawKey || (a.custom_name || ''),
                  category: 'special',
                  description: '',
                  source: 'Template',
                  baseCost: 0,
                  hasLevels: true,
                  levels: {},
                } as unknown as AttributeTemplate);
                // Always compute cost from the Attributes library template; ignore template-provided points
                const cpCostA = calculateAttributeCost(template, a.level ?? 1);
                return {
                  id: uuidv4(),
                  template,
                  level: a.level ?? 1,
                  cpCost: cpCostA,
                  notes: a.user_description || '',
                  source: 'race',
                  isCustom: false,
                  customInputs: {},
                  enhancements: [],
                  defects: [],
                  limiters: [],
                  selectedOptions: a.options || [],
                } as CharacterAttribute;
              });
            type RaceDefRow = { key?: string | null; custom_name?: string | null; rank?: number | null; cp_refund?: number | null; user_description?: string | null };
            const wolfDefects = ((wolf.defects as unknown as RaceDefRow[]) || []).map((d) => {
              const rawKey = (d.key || '').trim();
              const nameLower = (d.custom_name || '').toLowerCase();
              const defectTpl = rawKey ? DEFECTS_LIBRARY.find(t => (t.key || '').toLowerCase() === rawKey.toLowerCase())
                : DEFECTS_LIBRARY.find(t => (t.name || '').toLowerCase() === nameLower);
              const rank = (d.rank ?? 1) as number;
              const perRankRefund = defectTpl?.cp_refund ?? null;
              const cpRefund = perRankRefund != null ? perRankRefund * rank : (d.cp_refund ?? 0);
              return {
                id: uuidv4(),
                template: defectTpl || ({
                  id: rawKey || (d.custom_name || '').toLowerCase().replace(/\s+/g, '-'),
                  name: d.custom_name || rawKey,
                  key: rawKey || d.custom_name,
                  description: d.user_description || '',
                  cp_refund: d.cp_refund ?? 0,
                  category: 'general',
                  source: 'Template',
                } as unknown as DefectTemplate),
                rank,
                cpRefund,
                notes: '',
                source: 'race',
                customInputs: {},
              } as CharacterDefect;
            });
            // Pre-compute spends from preloaded attributes/defects
            const attrsSpend = (wolfAttrs || []).reduce((sum: number, wa: CharacterAttribute) => sum + (wa.cpCost || 0), 0);
            const defectsRefund = (wolfDefects || []).reduce((sum: number, wd: CharacterDefect) => sum + (wd.cpRefund || 0), 0);
            const budget = computeAlternateFormBudget(effLevel);
            const initialSpent = Math.max(0, attrsSpend - defectsRefund);
            const config: AlternateFormConfig = {
              id: uuidv4(),
              name: 'Wolf',
              notes: 'Auto-wired from race template',
              level,
              budgetCP: budget,
              formAttributes: wolfAttrs,
              formDefects: wolfDefects,
              reducedBaseAttributes: [],
              boughtOffBaseDefects: [],
              statDeltas: statDelta,
              spentCP: initialSpent,
              remainingCP: Math.max(0, budget - initialSpent),
            } as AlternateFormConfig;

            // Attach limiters and config to attribute
            attributes = attributes.map(a => a.id === altAttr.id ? ({ ...a, limiters: updatedLimiters, alternateForm: config }) as CharacterAttribute : a);
          }
        }
      }

      const next: BesmCharacter = { ...prev, stats: statsApplied, attributes, defects, appliedTemplates } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState, computeAlternateFormBudget, addTemplateAttributesWithCost, addTemplateDefectsWithRefund]);

  const applySizeTemplate = useCallback((template: SizeTemplate) => {
    setCharacter((prev: BesmCharacter) => {
      // Remove any existing size template first (atomic replace)
      let base = { ...prev } as BesmCharacter;
      const existingSize = (prev.appliedTemplates || []).filter(t => t.type === 'size');
      for (const existing of existingSize) {
        base = {
          ...base,
          attributes: base.attributes.filter(a => !existing.addedAttributeIds.includes(a.id)),
          defects: base.defects.filter(d => !existing.addedDefectIds.includes(d.id)),
          appliedTemplates: (base.appliedTemplates || []).filter(t => t.id !== existing.id),
        } as BesmCharacter;
      }

      const addedAttrs = (template.attributes || []).map(a => ({ key: a.key, custom_name: a.custom_name, level: a.level, options: a.options, user_input: a.user_input, points: a.points }));
      const attributes = addTemplateAttributesWithCost(base, addedAttrs, 'size');
      const defects = addTemplateDefectsWithRefund(base, template.defects || [], 'size');
      const addedAttributeIds = attributes.slice(base.attributes.length).map(a => a.id);
      const addedDefectIds = defects.slice(base.defects.length).map(d => d.id);
      const appliedId = uuidv4();
      const appliedTemplates = [...(base.appliedTemplates || []), { id: appliedId, type: 'size', key: template.key, name: template.name, addedAttributeIds, addedDefectIds, statsDelta: { body:0, mind:0, soul:0 } }];
      const next: BesmCharacter = { ...base, attributes, defects, appliedTemplates, size: template, sizeModifiers: template.modifiers } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState, addTemplateAttributesWithCost, addTemplateDefectsWithRefund]);

  const clearSizeTemplate = useCallback(() => {
    setCharacter((prev: BesmCharacter) => {
      const existingSize = (prev.appliedTemplates || []).filter(t => t.type === 'size');
      let base = { ...prev } as BesmCharacter;
      for (const existing of existingSize) {
        base = {
          ...base,
          attributes: base.attributes.filter(a => !existing.addedAttributeIds.includes(a.id)),
          defects: base.defects.filter(d => !existing.addedDefectIds.includes(d.id)),
          appliedTemplates: (base.appliedTemplates || []).filter(t => t.id !== existing.id),
        } as BesmCharacter;
      }
      const next: BesmCharacter = { ...base, size: undefined, sizeModifiers: undefined } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  // Helpers hoisted above

  const removeAppliedTemplate = useCallback((appliedId: string) => {
    setCharacter((prev: BesmCharacter) => {
      const applied = (prev.appliedTemplates || []).find(t => t.id === appliedId);
      if (!applied) return prev;
      const attributes = prev.attributes.filter(a => !applied.addedAttributeIds.includes(a.id));
      const defects = prev.defects.filter(d => !applied.addedDefectIds.includes(d.id));
      const stats = {
        body: Math.max(0, prev.stats.body - applied.statsDelta.body),
        mind: Math.max(0, prev.stats.mind - applied.statsDelta.mind),
        soul: Math.max(0, prev.stats.soul - applied.statsDelta.soul),
      };
      const appliedTemplates = (prev.appliedTemplates || []).filter(t => t.id !== appliedId);
      const next: BesmCharacter = { ...prev, attributes, defects, stats, appliedTemplates } as BesmCharacter;
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  const removeTemplatesByNameAndType = useCallback((type: 'class'|'race'|'size', name: string) => {
    setCharacter((prev: BesmCharacter) => {
      const toRemove = (prev.appliedTemplates || []).filter(t => t.type === type && t.name === name);
      if (toRemove.length === 0) return prev;
      let next: BesmCharacter = { ...prev } as BesmCharacter;
      for (const applied of toRemove) {
        next = {
          ...next,
          attributes: next.attributes.filter(a => !applied.addedAttributeIds.includes(a.id)),
          defects: next.defects.filter(d => !applied.addedDefectIds.includes(d.id)),
          stats: {
            body: Math.max(0, next.stats.body - applied.statsDelta.body),
            mind: Math.max(0, next.stats.mind - applied.statsDelta.mind),
            soul: Math.max(0, next.stats.soul - applied.statsDelta.soul),
          },
          appliedTemplates: (next.appliedTemplates || []).filter(t => t.id !== applied.id),
        } as BesmCharacter;
      }
      const spent = computeTotalPointsSpent(next);
      next.availableCP = next.totalCP - spent;
      next.totalPointsSpent = spent;
      next.derivedValues = calculateDerivedValuesFromState(next);
      return next;
    });
  }, [computeTotalPointsSpent, calculateDerivedValuesFromState]);

  const resetCharacter = useCallback(() => {
    setCharacter(createEmptyBesmCharacter());
  }, []);

  return {
    character,
    nextStep,
    prevStep,
    goToStep,
    resetCharacter,
    updateCharacter,
    addAttribute,
    updateAttribute,
    removeAttribute,
    clearTemplates,
    getAttribute,
    getAttributesByCategory,
    getTotalPointsSpent,
    getAvailableCP,
    getTotalCP,
    setTotalCP,
    setCharacterPoints,
    updateStat,
    addDefect,
    updateDefect,
    removeDefect,
    applyRaceTemplate,
    applyClassTemplate,
    removeClassTemplate,
    applySizeTemplate,
    clearSizeTemplate,
    removeAppliedTemplate,
    removeTemplatesByNameAndType,
    calculateEffectiveLevel,
    computeAlternateFormBudget,
    saveAlternateFormConfig,
    computeMetamorphosisBudget,
    saveMetamorphosisConfig,
    computeMinionsBudget,
    saveMinionsConfig,
    currentStep,
  };
};

export default useBesmCharacterBuilder;
