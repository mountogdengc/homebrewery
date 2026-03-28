export type AttributeCategory = 'physical' | 'mental' | 'social' | 'supernatural' | 'special';

export interface BaseAttribute {
  id: string;
  name: string;
  key: string;
  category: AttributeCategory;
  description: string;
  source: string;
  sourcesRefs?: { abbr: string; page: number }[];
  baseCost: number;
  hasLevels: boolean;
  maxLevel?: number;
  isHumanAttribute?: boolean;
  relevantStat?: string;
  levels?: Record<number, string | AttributeLevel>;
  prerequisites?: AttributePrerequisite[];
  statMods?: {
    derived?: Record<string, number>;
    dynamic?: boolean;
    base?: Record<string, number>;
  };
  userInputRequired?: AttributeInputField[];
  modifiers?: AttributeModifier[];
  dynamicCost?: Record<string, number>;
  
  // Legacy fields for backward compatibility
  cost_per_level?: number | null;
  relevant_stat?: string | null;
  is_human_attribute?: boolean;
  // Legacy shapes retained for import/back-compat; keep as unknown to avoid leaking `any`
  stat_mods?: unknown;
  user_input_required?: unknown[];
  modifiers_legacy?: unknown[];
}

export interface AttributeLevel {
  level: number;
  description: string;
  // Free-form effect bag; use unknown to avoid `any`
  effects?: Record<string, unknown>;
}

export interface AttributePrerequisite {
  attributeId: string;
  level: number;
}

export type InputFieldType = 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'dropdown';

export interface AttributeInputField {
  label: string;
  key: string;
  fieldType: InputFieldType;
  description?: string;
  options?: string[];
  autocompleteOptions?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface AttributeModifier {
  target?: string;
  targetKeyFromField?: string;
  modifierType?: string;
  valuePerLevel?: number;
  type?: string;
  value?: number;
  condition?: string;
}

export interface CharacterAttribute extends BaseAttribute {
  level: number;
  cpCost: number;
  notes: string;
  source: string;
  customInputs?: Record<string, unknown>;
}
