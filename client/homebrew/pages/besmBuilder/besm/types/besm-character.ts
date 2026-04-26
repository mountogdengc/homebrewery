import { AttributeTemplate } from '../data/attributesLibrary';
import { DefectTemplate } from '../data/defectsLibrary';
import { EnhancementTemplate } from '../data/enhancementsLibrary';
import { LimiterTemplate } from '../data/limitersLibrary';
import { ClassTemplate } from '../data/classTemplatesLibrary';
import { RaceTemplate } from '../data/raceTemplatesLibrary';
import { SizeTemplate, SizeModifiers } from '../data/sizeTemplatesLibrary';

// Define the TemplateSource type
export type TemplateSource = 'base' | 'class' | 'race' | 'size' | string;

export interface BesmCharacter {
  // Basic Info
  name: string;
  identity: string;
  description: string;
  // Player/GM info
  playerName?: string;
  gmName?: string;
  // Skills/Genre selection
  selectedGenre?: string | null;
  selectedSubgenre?: string | null;
  
  // Character Points
  totalCP: number;
  availableCP: number;
  
  // Stats
  stats: {
    body: number;
    mind: number;
    soul: number;
  };
  
  // Templates
  templates: {
    race: RaceTemplate | null;
    class: ClassTemplate | null;
    size: SizeTemplate | null;
  };
  sizeModifiers?: SizeModifiers;
  totalPointsSpent: number;
  // Keeping these for backward compatibility
  race?: RaceTemplate;
  class?: ClassTemplate;
  size?: SizeTemplate;
  characterClass: ClassTemplate | null;
  
  // Attributes & Defects
  attributes: CharacterAttribute[];
  defects: CharacterDefect[];
  skills: CharacterSkill[];
  
  // Derived Values
  derivedValues: {
    healthPoints: number;
    energyPoints: number;
    attackCombatValue: number;
    defenseCombatValue: number;
    damage: number;
    armorRating: number;
    // BESM-specific: Social Combat Value and Shock Value
    scv?: number;
    sv?: number;
  };
  // Applied templates tracking for add/remove
  appliedTemplates?: AppliedTemplate[];
  
  // Personal Details
  baseOfOperations?: string;
  knownRelatives?: string;
  gender?: string;
  age?: number;
  height?: string;
  weight?: string;
  habitat?: string; // Homeworld / Habitat
  hairColor?: string;
  eyeColor?: string;
  appearance?: string;
  background?: string;
  personality?: string;
  notes?: string;
  portrait?: string; // Base64 data URL from AI portrait generator
}

export interface AppliedTemplate {
  id: string; // unique per application
  type: 'class' | 'race' | 'size';
  key?: string; // optional key identifier
  name: string; // display name
  // Record what was added so we can remove
  addedAttributeIds: string[];
  addedDefectIds: string[];
  statsDelta: { body: number; mind: number; soul: number };
  pointsSpentStats?: number; // CP spent on stats from this template
}

export interface AttributeEnhancement {
  id: string;
  template: EnhancementTemplate;
  notes: string;
}

export interface AttributeDefect {
  id: string;
  template: DefectTemplate;
  rank: number;
  notes: string;
}

export interface AttributeLimiter {
  id: string;
  template: LimiterTemplate;
  assignments?: number; // number of assignments/picks selected by user
  // Optional focus text for limiters that require a specified focus (e.g., Armour: Emphasised/Optimised)
  focus?: string;
  notes: string;
}

export interface CharacterAttribute {
  id: string;
  template: AttributeTemplate;
  level: number;
  cpCost: number;
  notes: string;
  source: TemplateSource;
  isCustom: boolean;
  customInputs: Record<string, unknown>;
  enhancements: AttributeEnhancement[];
  defects: AttributeDefect[];
  limiters: AttributeLimiter[];
  selectedOptions?: string[];
  // If this attribute is an Alternate Form, it may carry a form configuration
  alternateForm?: AlternateFormConfig;
  // If this attribute is Metamorphosis, it may carry a form configuration (same structure as AF)
  metamorphosis?: AlternateFormConfig;
  // If this attribute is Minions, it may carry a minions configuration
  minions?: MinionsConfig;
}

export interface CharacterDefect {
  id: string;
  template: DefectTemplate;
  rank: number;
  cpRefund: number;
  notes: string;
  source: TemplateSource;
  customInputs?: Record<string, unknown>;
}

export interface CharacterSkill {
  id: string;
  name: string;
  description: string;
  level: number;
  cpCost: number;
  attribute: string;
  notes: string;
  source: TemplateSource;
  customInputs?: Record<string, unknown>;
  category?: string;
  // Skills-specific optional fields
  specialization?: string;
  relevantStat?: string;
}

// Alternate Form scaffolding types
export interface AlternateFormAttributeReduction {
  attributeId: string;      // base attribute id to reduce in form
  reduceByLevels: number;   // how many levels reduced in the form
  refundedCP: number;       // computed: cost_per_level * reduceByLevels
}

export interface AlternateFormDefectBuyoff {
  defectId: string;         // base defect id to buy off in form
  costCP: number;           // CP required to buy off the defect within form
}

export interface AlternateFormConfig {
  id: string;
  name: string;
  notes?: string;
  iconUrl?: string;
  level: number;            // should mirror the attribute level
  budgetCP: number;         // computed = 5 * level
  // Deltas relative to base character
  formAttributes: CharacterAttribute[];  // attributes added or overridden only while in form
  formDefects: CharacterDefect[];        // defects added only while in form
  reducedBaseAttributes?: AlternateFormAttributeReduction[];
  boughtOffBaseDefects?: AlternateFormDefectBuyoff[];
  // Optional stat adjustments while in form (deltas from base)
  statDeltas?: {
    body: number;
    mind: number;
    soul: number;
  };
  // Derived at save time
  spentCP: number;
  remainingCP: number;
}

// Minions configuration (per-minion build template and budget)
export interface MinionsConfig {
  id: string;
  name: string;
  notes?: string;
  iconUrl?: string;
  level: number;                 // mirrors Minions attribute level (actual level)
  perMinionBudgetCP: number;     // computed = floor(character.totalCP / 5)
  minionAttributes: CharacterAttribute[]; // attributes each minion has
  minionDefects: CharacterDefect[];       // defects each minion has
  // Optional stat adjustments for each minion relative to base human average if desired (kept for parity)
  statDeltas?: {
    body: number;
    mind: number;
    soul: number;
  };
  // Derived at save time (per-minion spend)
  spentCP: number;               // CP spent per minion build
  remainingCP: number;           // remaining per minion
}

// Helper function to create an empty BESM character
export function createEmptyBesmCharacter(totalCP: number = 0): BesmCharacter {
  return {
    name: '',
    identity: '',
    description: '',
    playerName: '',
    gmName: '',
    selectedGenre: null,
    selectedSubgenre: null,
    totalCP: totalCP,
    availableCP: totalCP,
    stats: {
      body: 0,
      mind: 0,
      soul: 0,
    },
    templates: {
      class: null,
      race: null,
      size: null,
    },
    characterClass: null,
    race: undefined,
    class: undefined,
    size: undefined,
    sizeModifiers: undefined,
    totalPointsSpent: 0,
    attributes: [],
    defects: [],
    skills: [],
    derivedValues: {
      healthPoints: 0,
      energyPoints: 0,
      attackCombatValue: 0,
      defenseCombatValue: 0,
      damage: 0,
      armorRating: 0,
    },
    baseOfOperations: '',
    gender: '',
    height: '',
    weight: '',
    habitat: '',
    background: '',
    notes: '',
  };
}
