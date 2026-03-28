/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseAttribute, AttributeLevel, AttributeInputField, AttributeModifier, InputFieldType, AttributeCategory } from '../types/besm-types';

// Narrow types for legacy fields we still support in data
type StatMods = {
  derived?: Record<string, number>;
  dynamic?: boolean;
  base?: Record<string, number>;
};

type LegacyUserInput = {
  label: string;
  key: string;
  field_type: string; // legacy may include values outside our InputFieldType union
  description?: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  // Legacy extensions used by certain entries
  autocomplete_by_category?: Record<string, string[]>;
  autocomplete_options?: string[];
};

type LegacyModifier = {
  target: string;
  target_key_from_field?: string;
  // Some legacy entries omit this field; treat as optional
  modifier_type?: string;
  value_per_level?: number;
  type?: string;
  value?: number;
  condition?: string;
};

type LegacyAttribute = {
  name: string;
  key?: string;
  cost_per_level?: number | null;
  relevant_stat?: string | null;
  is_human_attribute?: boolean;
  description?: string;
  source?: string;
  sourcesRefs?: { abbr: string; page: number }[];
  // Legacy data may contain loosely-shaped level entries
  levels?: Record<string, unknown>;
  stat_mods?: StatMods;
  user_input_required?: LegacyUserInput[];
  modifiers_legacy?: LegacyModifier[];
  modifiers?: LegacyModifier[]; // some entries use 'modifiers' directly
  dynamic_cost?: Record<string, number>;
  options_per_level?: string[];
  category?: AttributeCategory;
  // Some entries include a precomputed baseCost for convenience
  baseCost?: number;
  // Some entries explicitly include this flag
  hasLevels?: boolean;
};

export interface AttributeTemplate extends BaseAttribute {
  // Additional fields specific to the template
  levels: Record<number, string | AttributeLevel>;
  userInputRequired?: AttributeInputField[];
  modifiers?: AttributeModifier[];
  options_per_level?: string[];
  
  // Legacy fields for backward compatibility
  cost_per_level?: number | null;
  relevant_stat?: string | null;
  is_human_attribute?: boolean;
  stat_mods?: StatMods;
  user_input_required?: LegacyUserInput[];
  modifiers_legacy?: LegacyModifier[];
  dynamic_cost?: Record<string, number>;
}

// Helper: normalize legacy field types to our InputFieldType
function normalizeFieldType(ft: string): InputFieldType {
  switch (ft) {
    case 'text':
    case 'number':
    case 'select':
    case 'dropdown':
      return ft as InputFieldType;
    case 'combo_editable':
    case 'list':
      return 'select' as InputFieldType;
    case 'textarea':
      return 'text' as InputFieldType;
    default:
      return 'text' as InputFieldType;
  }
}

// Helper function to create a base attribute with required fields
const createBaseAttribute = (legacy: LegacyAttribute, category: AttributeCategory = 'special'): AttributeTemplate => {
  const id = legacy.key || legacy.name.toLowerCase().replace(/\s+/g, '-');
  const key = legacy.key || legacy.name.toLowerCase().replace(/\s+/g, '-');
  const baseCost = typeof legacy.cost_per_level === 'number' ? legacy.cost_per_level : 0;
  const hasLevels = !!(legacy.cost_per_level !== null && legacy.levels && Object.keys(legacy.levels).length > 0);
  
  // Convert levels to proper AttributeLevel objects
  const levels: Record<number, AttributeLevel> = {};
  if (legacy.levels) {
    Object.entries(legacy.levels).forEach(([level, value]) => {
      const levelNum = parseInt(level, 10);
      if (!isNaN(levelNum)) {
        levels[levelNum] = typeof value === 'string' 
          ? { level: levelNum, description: value }
          : { 
              level: levelNum, 
              description: (value as AttributeLevel).description || `Level ${levelNum}`, 
              ...(value as object) 
            };
      }
    });
  }
  
  // Determine the best category if not specified
  let finalCategory = category;
  if (!finalCategory) {
    finalCategory = legacy.is_human_attribute ? 'physical' : 'supernatural';
  }
  
  // Create the base template
  const template: AttributeTemplate = {
    id,
    name: legacy.name,
    key,
    category: finalCategory,
    description: legacy.description || '',
    source: legacy.source || 'BESM4e',
    sourcesRefs: legacy.sourcesRefs,
    baseCost,
    hasLevels,
    levels,
    isHumanAttribute: !!legacy.is_human_attribute,
    relevantStat: legacy.relevant_stat || undefined,
    statMods: legacy.stat_mods,
    userInputRequired: legacy.user_input_required?.map((input: LegacyUserInput) => ({
      label: input.label,
      key: input.key,
      fieldType: normalizeFieldType(input.field_type),
      description: input.description,
      options: input.options,
      required: input.required,
      placeholder: input.placeholder
    })),
    modifiers: legacy.modifiers_legacy
      ? legacy.modifiers_legacy.map((modifier: LegacyModifier) => ({
          target: modifier.target,
          targetKeyFromField: modifier.target_key_from_field,
          modifierType: modifier.modifier_type,
          valuePerLevel: modifier.value_per_level,
          type: modifier.type,
          value: modifier.value,
          condition: modifier.condition
      }))
      : (legacy.modifiers as unknown as AttributeModifier[]),
    dynamicCost: legacy.dynamic_cost,
    options_per_level: legacy.options_per_level,
    
    // Legacy fields for backward compatibility
    cost_per_level: legacy.cost_per_level,
    relevant_stat: legacy.relevant_stat,
    is_human_attribute: legacy.is_human_attribute,
    stat_mods: legacy.stat_mods,
    user_input_required: legacy.user_input_required,
    modifiers_legacy: legacy.modifiers_legacy,
    dynamic_cost: legacy.dynamic_cost
  };
  
  return template;
};


export const ATTRIBUTES_LIBRARY: AttributeTemplate[] = [
  createBaseAttribute({
    name: "Absorption",
    key: "absorption",
    cost_per_level: 5,
    relevant_stat: "Body",
    is_human_attribute: false,
    description: "Turn incoming physical harm into staying power, drawing strength from impact. Primarily resists conventional blows. See official rules for limits and interactions.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 78 },
      { abbr: "Naked", page: 36 },
      { abbr: "Extras", page: 5 }
    ],
    levels: {
      1: { level: 1, description: "Absorbs 5 damage" },
      2: { level: 2, description: "Absorbs 10 damage" },
      3: { level: 3, description: "Absorbs 15 damage" },
      4: { level: 4, description: "Absorbs 20 damage" },
      5: { level: 5, description: "Absorbs 25 damage" },
      6: { level: 6, description: "Absorbs 30 damage" }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Alternate Form",
    key: "alternate_form",
    cost_per_level: 4,
    relevant_stat: "Body",
    is_human_attribute: false,
    description: "Adopt a distinct form that reflects a different suite of traits. Serves story and theme; coordinate details with your GM.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 78 },
      { abbr: "Naked", page: 36 },
      { abbr: "Extras", page: 5 }
    ],
    levels: {
      1: { level: 1, description: "5 CP for alternate form" },
      2: { level: 2, description: "6-10 CP for alternate form" },
      3: { level: 3, description: "11-15 CP for alternate form" },
      4: { level: 4, description: "16-20 CP for alternate form" },
      5: { level: 5, description: "21-25 CP for alternate form" },
      6: { level: 6, description: "26-30 CP for alternate form" }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Alternate Identity",
    key: "alternate_identity",
    cost_per_level: 1,
    relevant_stat: "Body",
    is_human_attribute: true,
    description: "Maintain separate personas for roleplay and access, without changing your core abilities.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 80 },
      { abbr: "Naked", page: 38 }
    ],
    levels: {
      1: { level: 1, description: "One alternate identity" },
      2: { level: 2, description: "Two alternate identities" },
      3: { level: 3, description: "Three alternate identities" },
      4: { level: 4, description: "Four alternate identities" },
      5: { level: 5, description: "Five alternate identities" },
      6: { level: 6, description: "Six alternate identities" }
    }
  }, 'social'),
  createBaseAttribute({
    name: "Armour",
    key: "armour",
    cost_per_level: 2,
    relevant_stat: null,
    is_human_attribute: false,
    description: "Tangible protection against harm through gear, hide, or force. Represents steady damage mitigation. See official rules for coverage.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 80 },
      { abbr: "Naked", page: 38 },
      { abbr: "Extras", page: 5 },
      { abbr: "Multiverse", page: 12 }
    ],
    levels: {
      1: { level: 1, description: "Armour Rating = 5" },
      2: { level: 2, description: "Armour Rating = 10" },
      3: { level: 3, description: "Armour Rating = 15" },
      4: { level: 4, description: "Armour Rating = 20" },
      5: { level: 5, description: "Armour Rating = 25" },
      6: { level: 6, description: "Armour Rating = 30" }
    },
    stat_mods: {
      derived: {
        "Armour Rating": 5
      }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Attack Mastery",
    key: "attack_mastery",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Refined offensive training that sharpens your strikes across styles and weapons.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 80 },
      { abbr: "Naked", page: 38 }
    ],
    levels: {
      1: { level: 1, description: "+1 ACV" },
      2: { level: 2, description: "+2 ACV" },
      3: { level: 3, description: "+3 ACV" },
      4: { level: 4, description: "+4 ACV" },
      5: { level: 5, description: "+5 ACV" },
      6: { level: 6, description: "+6 ACV" }
    },
    stat_mods: {
      derived: {
        "ACV": 1
      }
    }
  }, 'physical'),
  // Inserted: Extra Defences
  createBaseAttribute({
    name: "Extra Defences",
    key: "extra_defences",
    cost_per_level: 2,
    relevant_stat: null,
    is_human_attribute: false,
    description: "Grants additional defensive actions each round.",
    source: "Extras",
    sourcesRefs: [
      { abbr: "Extras", page: 6 }
    ],
    levels: {
      1: { level: 1, description: "+1 defensive action per round" },
      2: { level: 2, description: "+2 defensive actions per round" },
      3: { level: 3, description: "+3 defensive actions per round" },
      4: { level: 4, description: "+4 defensive actions per round" },
      5: { level: 5, description: "+5 defensive actions per round" },
      6: { level: 6, description: "+6 defensive actions per round" }
    }
  }, 'special'),
  createBaseAttribute({
    name: "Augmented",
    key: "augmented",
    cost_per_level: 2,
    relevant_stat: null,
    is_human_attribute: false,
    description: "A stat bolstered by external means—bio, tech, or mystical—without redefining who you are.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 80 },
      { abbr: "Naked", page: 38 }
    ],
    levels: {
      1: { level: 1, description: "+1 to selected stat" },
      2: { level: 2, description: "+2 to selected stat" },
      3: { level: 3, description: "+3 to selected stat" },
      4: { level: 4, description: "+4 to selected stat" },
      5: { level: 5, description: "+5 to selected stat" },
      6: { level: 6, description: "+6 to selected stat" }
    },
    user_input_required: [
      {
        label: "Stat Affected",
        key: "stat_target",
        field_type: "dropdown",
        options: ["Body", "Mind", "Soul"],
        required: true
      }
    ],
    modifiers: [
      {
        target: "stat",
        target_key_from_field: "stat_target",
        modifier_type: "add_per_level",
        value_per_level: 1
      }
    ],
    stat_mods: {
      dynamic: true,
      base: {
        stat_target: 1
      }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Capacity",
    key: "capacity",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: false,
    description: "Room within or aboard for passengers or cargo, common for vehicles and massive beings.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 81 },
      { abbr: "Naked", page: 38 }
    ],
    levels: {
      1: { level: 1, description: "1 person / 200 kg" },
      2: { level: 2, description: "2 people / 500 kg" },
      3: { level: 3, description: "5 people / 1 tonne" },
      4: { level: 4, description: "10 people / 2 tonnes" },
      5: { level: 5, description: "25 people / 5 tonnes" },
      6: { level: 6, description: "50 people / 10 tonnes" },
      7: { level: 7, description: "100 people / 25 tonnes" },
      8: { level: 8, description: "250 people / 50 tonnes" },
      9: { level: 9, description: "500 people / 100 tonnes" },
      10: { level: 10, description: "1,000 people / 200 tonnes" },
      11: { level: 11, description: "Double capacity of previous level" }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Change State",
    key: "change_state",
    cost_per_level: 3,
    relevant_stat: "Body",
    is_human_attribute: false,
    description: "Shift into liquid, gas, incorporeal, or energy for dramatic movement and access.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 82 },
      { abbr: "Naked", page: 38 }
    ],
    levels: {
      1: { level: 1, description: "Liquid state, short duration" },
      2: { level: 2, description: "Liquid state, long duration" },
      3: { level: 3, description: "Gaseous state, short duration" },
      4: { level: 4, description: "Gaseous state, long duration" },
      5: { level: 5, description: "Incorporeal state, short duration" },
      6: { level: 6, description: "Incorporeal state, long duration" },
      7: { level: 7, description: "Energy state, short duration" },
      8: { level: 8, description: "Energy state, long duration" }
    },
    user_input_required: [
      {
        label: "State Type",
        key: "state_type",
        field_type: "dropdown",
        options: ["Liquid", "Gaseous", "Incorporeal", "Energy"],
        required: true
      }
    ]
  }, 'supernatural'),
  createBaseAttribute({
    name: "Cognition",
    key: "cognition",
    cost_per_level: 2,
    relevant_stat: "Mind",
    is_human_attribute: false,
    description: "Glimpses beyond the now—insight into futures or echoes of the past. GM sets clarity.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 82 },
      { abbr: "Naked", page: 39 }
    ],
    levels: {
      1: { level: 1, description: "See a few seconds ahead / 1 minute past" },
      2: { level: 2, description: "See 1 minute ahead / 1 hour past" },
      3: { level: 3, description: "See 10 minutes ahead / 1 day past" },
      4: { level: 4, description: "See 1 hour ahead / 1 week past" },
      5: { level: 5, description: "See 1 day ahead / 1 month past" },
      6: { level: 6, description: "See 1 week ahead / 1 year past" }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Combat Technique",
    key: "combat_technique",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Signature tactics that express your combat style and flair. Choose distinctive maneuvers.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 83 },
      { abbr: "Naked", page: 39 },
      { abbr: "Extras", page: 5 },
      { abbr: "Multiverse", page: 12 }
    ],
    levels: {
      1: { level: 1, description: "One combat technique" },
      2: { level: 2, description: "Two combat techniques" },
      3: { level: 3, description: "Three combat techniques" },
      4: { level: 4, description: "Four combat techniques" },
      5: { level: 5, description: "Five combat techniques" },
      6: { level: 6, description: "Six combat techniques" }
    },
    options_per_level: [
      "Blind Fighting",
      "Blind Shooting",
      "Brutal",
      "Concealment",
      "Death Dodge",
      "Deflection",
      "Extended Range",
      "Judge Opponent",
      "Lethal Blow",
      "Lightning Reflexes",
      "Portable Armoury",
      "Reflection",
      "Rush Attack",
      "Tournament Encyclopaedia",
      "Weapons Encyclopaedia"
    ]
  }, 'physical'),
  createBaseAttribute({
    name: "Companion",
    key: "companion",
    cost_per_level: 4,
    relevant_stat: null,
    is_human_attribute: true,
    description: "A loyal ally built to complement your role and story—familiar, partner, or guardian.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 84 },
      { abbr: "Naked", page: 40 }
    ],
    levels: {
      1: { level: 1, description: "10 CP Companion" },
      2: { level: 2, description: "11 - 20 CP Companion" },
      3: { level: 3, description: "21 - 30 CP Companion" },
      4: { level: 4, description: "31 - 40 CP Companion" },
      5: { level: 5, description: "41 - 50 CP Companion" },
      6: { level: 6, description: "51 - 60 CP Companion" }
    }
  }, 'special'),
  createBaseAttribute({
    name: "Connected",
    key: "connected",
    cost_per_level: 1,
    relevant_stat: "Soul",
    is_human_attribute: true,
    description: "Institutional ties that open doors, grant access, or carry weight.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 84 },
      { abbr: "Naked", page: 40 },
      { abbr: "Ikaris", page: 69 }
    ],
    levels: {
      1: { level: 1, description: "Associated (e.g. student rep, police officer)" },
      2: { level: 2, description: "Respected (e.g. sergeant, small biz owner)" },
      3: { level: 3, description: "Modest Authority (e.g. lieutenant, mayor)" },
      4: { level: 4, description: "Local Authority (e.g. captain, knight with land)" },
      5: { level: 5, description: "Regional Authority (e.g. colonel, baron)" },
      6: { level: 6, description: "Provincial Authority (e.g. senator, VP)" },
      7: { level: 7, description: "National Authority (e.g. king, cabinet official)" },
      8: { level: 8, description: "International Authority (e.g. president, pope)" },
      9: { level: 9, description: "Planetary Authority (e.g. world ruler)" },
      10: { level: 10, description: "Extraplanetary Authority (e.g. galactic emperor)" }
    },
    user_input_required: [
      {
        label: "Organization or Individual Connected To",
        key: "connection_target",
        field_type: "text",
        description: "Name the organization, faction, or individual the character is connected to."
      }
    ]
  }, 'social'),
  createBaseAttribute({
    name: "Control Environment",
    key: "control_environment",
    cost_per_level: 1,
    relevant_stat: "Soul",
    is_human_attribute: true,
    description: "Subtle influence over ambient conditions for mood, concealment, or advantage.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 86 },
      { abbr: "Naked", page: 41 }
    ],
    levels: {
      1: { level: 1, description: "Influence over one environment" },
      2: { level: 2, description: "Influence over two environments" },
      3: { level: 3, description: "Influence over three environments" },
      4: { level: 4, description: "Influence over four environments" },
      5: { level: 5, description: "Influence over five environments" },
      6: { level: 6, description: "Influence over six environments" }
    },
    user_input_required: [
      {
        label: "Controlled Environments",
        key: "controlled_environments",
        field_type: "combo_editable",
        description: "List the types of environments the character can influence.",
        options: [
          "Air Pressure",
          "Barometric Pressure",
          "Cold",
          "Color Saturation",
          "Darkness",
          "Dust",
          "Fog",
          "Gravity",
          "Heat",
          "Humidity",
          "Light",
          "Lightning",
          "Magnetism",
          "Mist",
          "Pollen",
          "Pollution",
          "Radiation",
          "Rain",
          "Shadow",
          "Silence",
          "Smell",
          "Snow",
          "Sound",
          "Static Electricity",
          "Thunder",
          "Vibration",
          "Visibility",
          "Wind"
        ]
      }
    ]
  }, 'supernatural'),
  createBaseAttribute({
    name: "Conversion",
    key: "conversion",
    cost_per_level: 3,
    relevant_stat: "Body",
    is_human_attribute: false,
    description: "Draw power from pain, momentarily fueling greater feats when struck.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 86 },
      { abbr: "Naked", page: 41 },
      { abbr: "Extras", page: 6 }
    ],
    levels: {
      1: { level: 1, description: "1 temporary CP per 10 damage" },
      2: { level: 2, description: "2 temporary CP per 10 damage" },
      3: { level: 3, description: "3 temporary CP per 10 damage" },
      4: { level: 4, description: "4 temporary CP per 10 damage" },
      5: { level: 5, description: "5 temporary CP per 10 damage" },
      6: { level: 6, description: "6 temporary CP per 10 damage" }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Data Access",
    key: "data_access",
    cost_per_level: 2,
    relevant_stat: "Mind",
    is_human_attribute: false,
    description: "Sense and interface with data systems around you, interpreting signals as awareness.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 88 },
      { abbr: "Naked", page: 41 }
    ],
    levels: {
      1: { level: 1, description: "Access tech in 10 cm radius" },
      2: { level: 2, description: "Access tech in 1 m radius" },
      3: { level: 3, description: "Access tech in 10 m radius" },
      4: { level: 4, description: "Access tech in 100 m radius" },
      5: { level: 5, description: "Access tech in 1 km radius" },
      6: { level: 6, description: "Access tech in 10 km radius" }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Defence Mastery",
    key: "defence_mastery",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Honed instincts and technique that keep you safe regardless of style.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 88 },
      { abbr: "Naked", page: 41 }
    ],
    levels: {
      1: { level: 1, description: "+1 to Defence CV" },
      2: { level: 2, description: "+2 to Defence CV" },
      3: { level: 3, description: "+3 to Defence CV" },
      4: { level: 4, description: "+4 to Defence CV" },
      5: { level: 5, description: "+5 to Defence CV" },
      6: { level: 6, description: "+6 to Defence CV" }
    },
    stat_mods: {
      derived: {
        "DCV": 1
      }
    }
  }, 'physical'),
  createBaseAttribute({
    name: "Social Mastery",
    key: "social_mastery",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Increases overall Social Combat Value.",
    source: "Extras",
    sourcesRefs: [
      { abbr: "Extras", page: 9 }
    ],
    levels: {
      1: { level: 1, description: "+1 to social interaction rolls" },
      2: { level: 2, description: "+2 to social interaction rolls" },
      3: { level: 3, description: "+3 to social interaction rolls" },
      4: { level: 4, description: "+4 to social interaction rolls" },
      5: { level: 5, description: "+5 to social interaction rolls" },
      6: { level: 6, description: "+6 to social interaction rolls" }
    }
  }, 'social'),
  createBaseAttribute({
    name: "Skills",
    key: "skills",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Grants skill points to spend on a specific skill set.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "Extras", page: 8 }
    ],
    levels: {
      1: { level: 1, description: "1 skill pick" },
      2: { level: 2, description: "2 skill picks" },
      3: { level: 3, description: "3 skill picks" },
      4: { level: 4, description: "4 skill picks" },
      5: { level: 5, description: "5 skill picks" },
      6: { level: 6, description: "6 skill picks" }
    },
    user_input_required: [
      {
        label: "Skill Name",
        key: "skill_name",
        field_type: "combo_editable",
        description: "Enter or select the specific skill.",
        options: [
          "Acrobatics",
          "Animal Training",
          "Architecture",
          "Area Knowledge",
          "Artisan",
          "Biological Sciences",
          "Boating",
          "Burglary",
          "Business",
          "Civilisation",
          "Climbing",
          "Computers",
          "Controlled Breathing",
          "Cultural Arts",
          "Demolitions",
          "Disguise",
          "Domestic Arts",
          "Driving",
          "Electronics",
          "Empathy",
          "Engineering",
          "Environmental Sciences",
          "Etiquette",
          "Forgery",
          "Gaming",
          "Interrogation",
          "Intimidation",
          "Languages",
          "Law",
          "Leadership",
          "Listening",
          "Mechanics",
          "Medical",
          "Military Sciences",
          "Naturopathy",
          "Navigation",
          "Occult",
          "Occupation",
          "Performing Arts",
          "Persuasion",
          "Physical Sciences",
          "Piloting",
          "Poisons",
          "Police Sciences",
          "Powerlifting",
          "Religion",
          "Riding",
          "Search",
          "Seduction",
          "Sleight of Hand",
          "Social Sciences",
          "Sports",
          "Stealth",
          "Street Sense",
          "Survival",
          "Swimming",
          "Unique Skill",
          "Urban Tracking",
          "Visual Arts",
          "Wilderness Tracking",
          "Writing"
        ]
      },
      {
        label: "Specialization (optional)",
        key: "specialization",
        field_type: "text",
        description: "If applicable, record a focus within the skill (e.g., Negotiation for Persuasion).",
        required: false,
        placeholder: "e.g., Negotiation, Parkour, Network Security"
      }
    ],
    options_per_level: [
      "Acrobatics",
      "Animal Training",
      "Architecture",
      "Area Knowledge",
      "Artisan",
      "Biological Sciences",
      "Boating",
      "Burglary",
      "Business",
      "Civilisation",
      "Climbing",
      "Computers",
      "Controlled Breathing",
      "Cultural Arts",
      "Demolitions",
      "Disguise",
      "Domestic Arts",
      "Driving",
      "Electronics",
      "Empathy",
      "Engineering",
      "Environmental Sciences",
      "Etiquette",
      "Forgery",
      "Gaming",
      "Interrogation",
      "Intimidation",
      "Languages",
      "Law",
      "Leadership",
      "Listening",
      "Mechanics",
      "Medical",
      "Military Sciences",
      "Naturopathy",
      "Navigation",
      "Occult",
      "Occupation",
      "Performing Arts",
      "Persuasion",
      "Physical Sciences",
      "Piloting",
      "Poisons",
      "Police Sciences",
      "Powerlifting",
      "Religion",
      "Riding",
      "Search",
      "Seduction",
      "Sleight of Hand",
      "Social Sciences",
      "Sports",
      "Stealth",
      "Street Sense",
      "Survival",
      "Swimming",
      "Unique Skill",
      "Urban Tracking",
      "Visual Arts",
      "Wilderness Tracking",
      "Writing"
    ]
  }, 'social'),
  createBaseAttribute({
    name: "Dimension Walk",
    key: "dimension_walk",
    cost_per_level: 5,
    relevant_stat: "Soul",
    is_human_attribute: false,
    description: "Step between nearby realities with thematic resonance to your concept.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 89 },
      { abbr: "Naked", page: 41 }
    ],
    levels: {
      1: { level: 1, description: "Insignificant changes" },
      2: { level: 2, description: "Specific changes" },
      3: { level: 3, description: "Minor changes" },
      4: { level: 4, description: "Moderate changes" },
      5: { level: 5, description: "Significant changes" },
      6: { level: 6, description: "Major changes" }
    }
  }, 'supernatural'),
  createBaseAttribute({
    name: "Dynamic Powers",
    key: "dynamic_powers",
    cost_per_level: 10,
    relevant_stat: "Variable",
    is_human_attribute: false,
    description: "Broad narrative authority over a chosen domain; focus shifts with the story. Coordinate scope with your GM.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 89 },
      { abbr: "BESM4e", page: 259 },
      { abbr: "Naked", page: 41 }
    ],
    levels: {
      1: { level: 1, description: "Minimal control over area" },
      2: { level: 2, description: "Minor control over area" },
      3: { level: 3, description: "Moderate control over area" },
      4: { level: 4, description: "Good control over area" },
      5: { level: 5, description: "Significant control over area" },
      6: { level: 6, description: "Major control over area" }
    },
    user_input_required: [
      {
        label: "Category Type",
        key: "category_type",
        field_type: "select",
        description: "Select the scope of influence your character has.",
        options: [
          "Minor",
          "Major",
          "Primal"
        ]
      },
      {
        label: "Controlled Category",
        key: "controlled_category",
        field_type: "combo_editable",
        description: "Enter the specific category your character controls.",
        autocomplete_by_category: {
          "Minor": [
            "Always Being On Time",
            "Always Dressed for the Occasion",
            "Cats",
            "Charm",
            "Earth",
            "Fashion",
            "Fire",
            "Friction",
            "Having the Right Amount of Money",
            "Insects",
            "Keys",
            "Lust",
            "Making People Laugh",
            "Nutrition",
            "Pride",
            "Protection",
            "Shadow",
            "Silence",
            "Sunlight",
            "Temperature",
            "Water",
            "Wind",
            "Writing"
          ],
          "Major": [
            "Animals",
            "Cities",
            "Communication",
            "Computer Data",
            "Drugs",
            "Electricity",
            "Fertility",
            "Gravity",
            "Health",
            "Love",
            "Magnetism",
            "Manufacturing",
            "Necromancy",
            "Shapeshifting",
            "Strength",
            "Travel",
            "Truth",
            "Weapons",
            "Weather"
          ],
          "Primal": [
            "Chaos",
            "Death",
            "Dimensions",
            "Dreams",
            "Earth (as a cosmic force)",
            "Force",
            "Heaven",
            "Hell",
            "Law",
            "Life",
            "Magic",
            "Math",
            "Self",
            "Stars",
            "Thought",
            "Time",
            "War"
          ]
        }
      }
    ]
  }, 'supernatural'),
  createBaseAttribute({
    name: "Enemy Attack",
    key: "enemy_attack",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Focused training that exploits a particular foe’s habits and tells.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 90 },
      { abbr: "Naked", page: 42 }
    ],
    levels: {
      1: { level: 1, description: "+2 ACV vs. chosen enemy" },
      2: { level: 2, description: "+4 ACV vs. chosen enemy" },
      3: { level: 3, description: "+6 ACV vs. chosen enemy" },
      4: { level: 4, description: "+8 ACV vs. chosen enemy" },
      5: { level: 5, description: "+10 ACV vs. chosen enemy" },
      6: { level: 6, description: "+12 ACV vs. chosen enemy" }
    },
    user_input_required: [
      {
        label: "Enemy Type",
        key: "enemy_type",
        field_type: "combo_editable",
        description: "Enter or select the type of enemy this bonus applies to.",
        options: [
          "A Specific Nemesis",
          "A Specific Organization",
          "Aliens",
          "Animals",
          "Angels",
          "Bandits",
          "Blood Relatives",
          "Cultists",
          "Demons",
          "Dragons",
          "Extra-Dimensional Beings",
          "Ghosts",
          "Giants",
          "Goblins",
          "Insects",
          "Nobility",
          "Orcs",
          "Robots",
          "Trolls",
          "Undead",
          "Vampires",
          "Werewolves",
          "Zombies"
        ]
      }
    ]
  }, 'physical'),
  createBaseAttribute({
    name: "Enemy Defence",
    key: "enemy_defence",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Defensive preparation keyed to a known adversary’s methods.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 90 },
      { abbr: "Naked", page: 42 }
    ],
    levels: {
      1: { level: 1, description: "+2 DCV vs. chosen enemy" },
      2: { level: 2, description: "+4 DCV vs. chosen enemy" },
      3: { level: 3, description: "+6 DCV vs. chosen enemy" },
      4: { level: 4, description: "+8 DCV vs. chosen enemy" },
      5: { level: 5, description: "+10 DCV vs. chosen enemy" },
      6: { level: 6, description: "+12 DCV vs. chosen enemy" }
    },
    user_input_required: [
      {
        label: "Enemy Type",
        key: "enemy_type",
        field_type: "combo_editable",
        description: "Enter or select the type of enemy this bonus applies to.",
        options: [
          "A Specific Nemesis",
          "A Specific Organization",
          "Aliens",
          "Animals",
          "Angels",
          "Bandits",
          "Blood Relatives",
          "Cultists",
          "Demons",
          "Dragons",
          "Extra-Dimensional Beings",
          "Ghosts",
          "Giants",
          "Goblins",
          "Insects",
          "Nobility",
          "Orcs",
          "Robots",
          "Trolls",
          "Undead",
          "Vampires",
          "Werewolves",
          "Zombies"
        ]
      }
    ]
  }, 'physical'),
  createBaseAttribute({
    name: "Energised",
    key: "energised",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: true,
    description: "A deeper energy reserve that sustains your abilities or endurance.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 90 },
      { abbr: "Naked", page: 42 }
    ],
    levels: {
      1: { level: 1, description: "+10 EP" },
      2: { level: 2, description: "+20 EP" },
      3: { level: 3, description: "+30 EP" },
      4: { level: 4, description: "+40 EP" },
      5: { level: 5, description: "+50 EP" },
      6: { level: 6, description: "+60 EP" }
    },
    stat_mods: {
      derived: {
        EP: 10
      }
    }
  }, 'special'),
  createBaseAttribute({
    name: "Exorcism",
    key: "exorcism",
    cost_per_level: 1,
    relevant_stat: "Soul",
    is_human_attribute: false,
    description: "Drive out malign influences through will, ritual, or faith.",
    category: "special",  // Must be one of: 'physical' | 'mental' | 'social' | 'supernatural' | 'special'
    baseCost: 1,  // Base cost of the attribute
    hasLevels: true,  // Since you have levels defined
    source: "BESM4e",
    sourcesRefs: [
      { "abbr": "BESM4e", "page": 90 },
      { "abbr": "Naked", "page": 43 }
    ],
    levels: {
      1: { level: 1, description: "+2 to Exorcism checks" },
      2: { level: 2, description: "+4 to Exorcism checks" },
      3: { level: 3, description: "+6 to Exorcism checks" },
      4: { level: 4, description: "+8 to Exorcism checks" },
      5: { level: 5, description: "+10 to Exorcism checks" },
      6: { level: 6, description: "+12 to Exorcism checks" }
    }
  }, 'special'),
  createBaseAttribute({
    name: "Extra Actions",
    key: "extra_actions",
    cost_per_level: 4,
    relevant_stat: null,
    is_human_attribute: true,
    description: "Act with exceptional tempo or parallel processing, enabling rapid sequences.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 90 },
      { abbr: "Naked", page: 43 }
    ],
    levels: {
      1: { level: 1, description: "+1 action per round" },
      2: { level: 2, description: "+2 actions per round" },
      3: { level: 3, description: "+3 actions per round" },
      4: { level: 4, description: "+4 actions per round" },
      5: { level: 5, description: "+5 actions per round" },
      6: { level: 6, description: "+6 actions per round" }
    }
  }, 'special'),
  createBaseAttribute({
    name: "Extra Arms",
    key: "extra_arms",
    cost_per_level: 1,
    relevant_stat: null,
    is_human_attribute: false,
    description: "Additional manipulators that enhance handling and presence, not extra turns.",
    source: "BESM4e",
    sourcesRefs: [
      { abbr: "BESM4e", page: 92 },
      { abbr: "Naked", page: 43 }
    ],
    levels: {
      1: { level: 1, description: "1 extra arm" },
      2: { level: 2, description: "2 extra arms" },
      3: { level: 3, description: "3 - 5 extra arms" },
      4: { level: 4, description: "6 - 10 extra arms" },
      5: { level: 5, description: "11 - 25 extra arms" },
      6: { level: 6, description: "26 - 50 extra arms" }
    }
  }, 'special'),
  createBaseAttribute({
    "name": "Features",
    "cost_per_level": 1,
    "relevant_stat": "Variable",
    "is_human_attribute": true,
    "description": "Minor edges and conveniences that flesh out your concept with color and utility.",
    "source": "BESM4e",
    "sourcesRefs": [
      { "abbr": "BESM4e", "page": 92 },
      { "abbr": "Naked", "page": 44 }
    ],
    "levels": {
        "1": "1-2 Features",
        "2": "3-5 Features",
        "3": "6-10 Features",
        "4": "11-25 Features",
        "5": "26-50 Features",
        "6": "51-100 Features"
    },
    "user_input_required": [
        {
            "label": "Feature Type",
            "key": "feature_type",
            "field_type": "select",
            "description": "Select the general type of feature.",
            "options": [
                "Personal",
                "Racial",
                "Technological"
            ]
        },
        {
            "label": "Features List",
            "key": "features_list",
            "field_type": "combo_editable",
            "description": "Enter one or more features (select from suggestions or write your own).",
            "options": [
                "Ambidexterity",
                "Animal Empathy",
                "Appearance",
                "Auditory Discrimination",
                "Breath/Heartbeat Control",
                "Depth Awareness",
                "Direction Sense",
                "Eidetic Memory",
                "Famous (Beneficial)",
                "Foreign Language",
                "Hypermobility (Double-Jointed)",
                "Light Sleeper",
                "Lightning Calculator",
                "Mimic Sound",
                "Perfect Pitch",
                "Range Sense",
                "Spatial Sense",
                "Speed Reading",
                "Time Sense",
                "Weather Sense",
                "360-Degree Vision",
                "Camouflage",
                "Fluid Squirting",
                "Gills",
                "Heat Regulation",
                "Homing Instinct",
                "Light Armour (AR 1-4)",
                "Light Weaponry (5 Damage)",
                "Long Tongue",
                "Longevity",
                "Low-Light Vision",
                "Multiple Hearts",
                "Nictitating Membrane",
                "Pouch",
                "Retractable Claws",
                "Scent Glands",
                "Scentless",
                "Sexual Duality",
                "Ultrasonic Communication",
                "Webbed Feet/Hands/Paws",
                "Alarm System",
                "Basic AI (0 Stats)",
                "Camera",
                "Comms Suite",
                "Data Backup Auto System",
                "Ejection Seat",
                "Emergency Lights/Siren",
                "Fast Acceleration",
                "GPS",
                "Gyrocompass",
                "Highly Maneuverable",
                "Identity Verifier",
                "Life Monitoring Systems",
                "Luxurious Decor",
                "Modern Vehicle Tech Suite",
                "Naked Enhancement",
                "Radar Detector",
                "Revolving License Plate",
                "Smartphone",
                "Tool Kit",
                "Medical Kit"
            ]
        }
    ],
    "key": "features"
  }, 'special'),
  createBaseAttribute({
    "name": "Flight",
    "cost_per_level": 3,
    "relevant_stat": "Body",
    "description": "Allows the character to fly through an atmosphere using any method such as wings, magic, or anti-gravity.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 94 },
        { "abbr": "Naked", "page": 44 }
    ],
    "levels": {
        "1": "Fly at speeds up to 10 kph",
        "2": "Fly at speeds up to 30 kph",
        "3": "Fly at speeds up to 100 kph",
        "4": "Fly at speeds up to 300 kph",
        "5": "Fly at speeds up to 1,000 kph",
        "6": "Fly at speeds up to 3,000 kph"
    },
    "key": "flight",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Force Field",
    "cost_per_level": 4,
    "relevant_stat": "Body",
    "description": "An energy shield that protects the user from damage, often magical or technological in nature.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 94 },
        { "abbr": "Naked", "page": 45 },
        { "abbr": "Extras", "page": 7 }
    ],
    "levels": {
        "1": "Armour Rating = 10",
        "2": "Armour Rating = 20",
        "3": "Armour Rating = 30",
        "4": "Armour Rating = 40",
        "5": "Armour Rating = 50",
        "6": "Armour Rating = 60"
    },
    "key": "force_field",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Gear",
    "cost_per_level": 1,
    "relevant_stat": null,
    "description": "Represents a character's access to useful but non-powerful equipment suitable for the campaign setting.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 95 },
        { "abbr": "Naked", "page": 45 },
        { "abbr": "Uresia", "page": 70 }
    ],
    "levels": {
        "1": "A couple pieces of Gear (1-2)",
        "2": "A few pieces of Gear (3-5)",
        "3": "Several pieces of Gear (6-10)",
        "4": "Many pieces of Gear (11-25)",
        "5": "Large amount of Gear (26-50)",
        "6": "Huge amount of Gear (51-100)"
    },
    "key": "gear",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Ground Speed",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "Allows the character or item to move quickly on the ground using various movement techniques.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 96 },
        { "abbr": "Naked", "page": 45 }
    ],
    "levels": {
        "1": "Ground speed up to 10 kph",
        "2": "Ground speed up to 25 kph",
        "3": "Ground speed up to 50 kph",
        "4": "Ground speed up to 100 kph",
        "5": "Ground speed up to 250 kph",
        "6": "Ground speed up to 500 kph"
    },
    "key": "ground_speed",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Healing",
    "cost_per_level": 1,
    "relevant_stat": "Soul",
    "description": "Allows the character to heal physical injuries through touch, including some severe trauma.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 96 },
        { "abbr": "Naked", "page": 46 }
    ],
    "levels": {
        "1": "Heals 5 Health Points",
        "2": "Heals 10 Health Points",
        "3": "Heals 15 Health Points",
        "4": "Heals 20 Health Points",
        "5": "Heals 25 Health Points",
        "6": "Heals 30 Health Points"
    },
    "key": "healing",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Heightened Awareness",
    "cost_per_level": 1,
    "relevant_stat": "Body or Mind",
    "description": "Grants a bonus on rolls to notice nearby hidden objects or ambushes.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 97 },
        { "abbr": "Naked", "page": 46 }
    ],
    "levels": {
        "1": "+2 Stat roll awareness bonus",
        "2": "+4 Stat roll awareness bonus",
        "3": "+6 Stat roll awareness bonus",
        "4": "+8 Stat roll awareness bonus",
        "5": "+10 Stat roll awareness bonus",
        "6": "+12 Stat roll awareness bonus"
    },
    "key": "heightened_awareness",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Heightened Senses",
    "cost_per_level": 1,
    "relevant_stat": "Body or Mind",
    "description": "Enhances one or more of the character's physical senses to superhuman levels.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 97 },
        { "abbr": "Naked", "page": 46 }
    ],
    "levels": {
        "1": "One enhanced sense",
        "2": "Two enhanced senses",
        "3": "Three enhanced senses",
        "4": "Four enhanced senses",
        "5": "Five enhanced senses"
    },
    "user_input_required": [
        {
            "label": "Enhanced Senses",
            "key": "enhanced_senses",
            "field_type": "list",
            "description": "List the senses enhanced by this attribute.",
            "autocomplete_options": [
                "Sight",
                "Hearing",
                "Smell",
                "Taste",
                "Touch"
            ]
        }
    ],
    "key": "heightened_senses",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Illusion",
    "cost_per_level": 1,
    "relevant_stat": "Body or Mind",
    "description": "Allows the character to create mental hallucinations that appear real to targeted observers. Illusions can vary in complexity based on enhancements and require concentration to maintain. Each level increases the maximum size of the illusion.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 97 },
        { "abbr": "Naked", "page": 46 }
    ],
    "levels": {
        "1": "Tiny-sized Illusions (10 cm)",
        "2": "Small-sized Illusions (1 m)",
        "3": "Moderate-sized Illusions (10 m)",
        "4": "Building-sized Illusions (100 m)",
        "5": "Neighbourhood-sized Illusions (1 km)",
        "6": "City-sized Illusions (10 km)"
    },
    "key": "illusion",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Immunity",
    "cost_per_level": 3,
    "relevant_stat": "Body",
    "description": "The character is completely immune to attack damage and adverse effects from a particular weapon, element, or condition. Higher levels reflect broader or more impactful immunities.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 98 },
        { "abbr": "Naked", "page": 47 }
    ],
    "levels": {
        "1": "Rare role in game (e.g., sacred wood weapons, specific nemesis)",
        "2": "Small role in game (e.g., silver weapons, specific group)",
        "3": "Moderate role in game (e.g., iron weapons, demons, night)",
        "4": "Large role in game (e.g., electricity, cold, weapon types)",
        "5": "Major role in game (e.g., fire/heat, broad weapon types)",
        "6": "Extreme role in game (e.g., gunfire, explosives, unarmed attacks)"
    },
    "user_input_required": [
        {
            "label": "Immunity Target",
            "key": "immune_to",
            "field_type": "text",
            "description": "Describe what the character is immune to (e.g., fire, cold, silver weapons)."
        }
    ],
    "key": "immunity",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Immutable",
    "cost_per_level": 1,
    "relevant_stat": "Body or Soul",
    "description": "Protects the character from transformation, displacement, or nullification effects. Grants a bonus to resist certain abilities and includes minor armor protection against insidious attacks.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 99 },
        { "abbr": "Naked", "page": 47 }
    ],
    "levels": {
        "1": "+2 Stat roll bonus when resisting effects",
        "2": "+4 Stat roll bonus when resisting effects",
        "3": "+6 Stat roll bonus when resisting effects",
        "4": "+8 Stat roll bonus when resisting effects",
        "5": "+10 Stat roll bonus when resisting effects",
        "6": "+12 Stat roll bonus when resisting effects"
    },
    "key": "immutable",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Inspire",
    "cost_per_level": 1,
    "relevant_stat": "Soul",
    "description": "The character can uplift allies and instill courage, strength, or resolve through charisma, magic, or leadership. Requires a successful Soul or Skill Group roll. Allies gain a bonus to relevant rolls and recover Energy Points more quickly.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 99 },
        { "abbr": "Naked", "page": 47 }
    ],
    "levels": {
        "1": "Inspired characters gain a +1 bonus to Stat/Skill Group rolls when appropriate",
        "2": "Inspired characters gain a +2 bonus to Stat/Skill Group rolls when appropriate",
        "3": "Inspired characters gain a +3 bonus to Stat/Skill Group rolls when appropriate",
        "4": "Inspired characters gain a +4 bonus to Stat/Skill Group rolls when appropriate",
        "5": "Inspired characters gain a +5 bonus to Stat/Skill Group rolls when appropriate",
        "6": "Inspired characters gain a +6 bonus to Stat/Skill Group rolls when appropriate"
    },
    "key": "inspire",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Item",
    "cost_per_level": 1,
    "relevant_stat": null,
    "description": "Items are devices that enhance a character in some way or that serve as a useful tool, vehicle, base, or weapon.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 101 },
        { "abbr": "Naked", "page": 47 }
    ],
    "levels": {
        "1": "+1 bonus to appropriate Stat/Skill Group rolls",
        "2": "+2 bonus to appropriate Stat/Skill Group rolls",
        "3": "+3 bonus to appropriate Stat/Skill Group rolls",
        "4": "+4 bonus to appropriate Stat/Skill Group rolls",
        "5": "+5 bonus to appropriate Stat/Skill Group rolls",
        "6": "+6 bonus to appropriate Stat/Skill Group rolls"
    },
    "key": "items",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Jumping",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "Allows a character to jump great distances and land without injury.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 101 },
        { "abbr": "Naked", "page": 47 }
    ],
    "levels": {
        "1": "Jump up to 3 times normal distance",
        "2": "Jump up to 10 times normal distance",
        "3": "Jump up to 30 times normal distance",
        "4": "Jump up to 100 times normal distance",
        "5": "Jump up to 300 times normal distance",
        "6": "Jump up to 1,000 times normal distance"
    },
    "key": "jumping",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Massive Damage",
    "cost_per_level": 3,
    "relevant_stat": null,
    "description": "Increases damage multiplier by striking at weaknesses.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 102 },
        { "abbr": "Naked", "page": 47 }
    ],
    "levels": {
        "1": "Damage Multiplier increases by 1",
        "2": "Damage Multiplier increases by 2",
        "3": "Damage Multiplier increases by 3",
        "4": "Damage Multiplier increases by 4",
        "5": "Damage Multiplier increases by 5",
        "6": "Damage Multiplier increases by 6"
    },
    "key": "massive_damage",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Melee Attack",
    "cost_per_level": 1,
    "relevant_stat": null,
    "description": "Adds +2 ACV per level when using a specific fighting technique.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 102 },
        { "abbr": "Naked", "page": 48 }
    ],
    "levels": {
        "1": "Attack Combat Value increases by 2 when using a specific fighting technique",
        "2": "Attack Combat Value increases by 4 when using a specific fighting technique",
        "3": "Attack Combat Value increases by 6 when using a specific fighting technique",
        "4": "Attack Combat Value increases by 8 when using a specific fighting technique",
        "5": "Attack Combat Value increases by 10 when using a specific fighting technique",
        "6": "Attack Combat Value increases by 12 when using a specific fighting technique"
    },
    "user_input_required": [
        {
            "label": "Weapon Class or Technique",
            "key": "weapon_class",
            "field_type": "text",
            "description": "Enter the class of weapon or specific fighting style this bonus applies to."
        }
    ],
    "key": "melee_attack",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Melee Defence",
    "cost_per_level": 1,
    "relevant_stat": null,
    "description": "Adds +2 DCV per level when using a specific fighting technique.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 103 },
        { "abbr": "Naked", "page": 48 }
    ],
    "levels": {
        "1": "Defence Combat Value increases by 2 when using a specific technique",
        "2": "Defence Combat Value increases by 4 when using a specific technique",
        "3": "Defence Combat Value increases by 6 when using a specific technique",
        "4": "Defence Combat Value increases by 8 when using a specific technique",
        "5": "Defence Combat Value increases by 10 when using a specific technique",
        "6": "Defence Combat Value increases by 12 when using a specific technique"
    },
    "user_input_required": [
        {
            "label": "Weapon Class or Technique",
            "key": "weapon_class",
            "field_type": "text",
            "description": "Enter the class of weapon or specific fighting style this bonus applies to."
        }
    ],
    "key": "melee_defence",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Merge",
    "cost_per_level": 4,
    "relevant_stat": null,
    "source": "BESM4e",
    "description": "Allows multiple items or characters to merge into a more powerful form.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 103 },
        { "abbr": "Naked", "page": 48 },
        { "abbr": "Extras", "page": 8 }
    ],
    "levels": {
        "1": "Merged Item is created with up to 10 Points for each combining Item",
        "2": "Merged Item is created with 11-20 Points for each combining Item",
        "3": "Merged Item is created with 21-30 Points for each combining Item",
        "4": "Merged Item is created with 31-40 Points for each combining Item",
        "5": "Merged Item is created with 41-50 Points for each combining Item",
        "6": "Merged Item is created with 51-60 Points for each combining Item"
    },
    "key": "merge",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Metamorphosis",
    "cost_per_level": 2,
    "relevant_stat": "Mind or Soul",
    "description": "Allows the character to transform themselves or others into a new species or form for a limited duration. This change replaces the subjectâ€™s current Race Template with a new one of equivalent Character Point value, determined by the level of this Attribute.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 106 },
        { "abbr": "Naked", "page": 48 }
    ],
    "levels": {
        "1": "Race Template is created with up to +/- 5 Character Points",
        "2": "Race Template is created with up to +/- 10 Character Points",
        "3": "Race Template is created with up to +/- 15 Character Points",
        "4": "Race Template is created with up to +/- 20 Character Points",
        "5": "Race Template is created with up to +/- 25 Character Points",
        "6": "Race Template is created with up to +/- 30 Character Points"
    },
    "key": "metamorphosis",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Mind Control",
    "cost_per_level": 5,
    "relevant_stat": "Mind",
    "description": "Mentally dominate a target through touch. Unwilling targets resist with an opposed Mind roll. Duration is typically one minute or a dramatic scene.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 108 },
        { "abbr": "Naked", "page": 50 }
    ],
    "levels": {
        "1": "Basic commands like 'turn around'",
        "2": "Simple commands like 'go make me a sandwich'",
        "3": "Complex commands like 'use a fake ID to smuggle an item'",
        "4": "Can issue aggressive commands (e.g., attacking)",
        "5": "Can erase brief memories",
        "6": "Can erase or alter complex memories"
    },
    "key": "mind_control",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Mind Shield",
    "cost_per_level": 1,
    "relevant_stat": "Mind",
    "source": "BESM4e",
    "description": "Protects against psychic intrusion and attacks with the Psychic Weapon Enhancement. Provides a roll bonus and mental armor.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 109 },
        { "abbr": "Naked", "page": 50 }
    ],
    "levels": {
        "1": "+2 bonus and 5 mental armor",
        "2": "+4 bonus and 10 mental armor",
        "3": "+6 bonus and 15 mental armor",
        "4": "+8 bonus and 20 mental armor",
        "5": "+10 bonus and 25 mental armor",
        "6": "+12 bonus and 30 mental armor"
    },
    "key": "mind_shield",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Minions",
    "cost_per_level": 2,
    "relevant_stat": "Soul",
    "source": "BESM4e",
    "description": "Character commands loyal followers. Each minion can be created with up to 1/5 of the character's total points.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 109 },
        { "abbr": "Naked", "page": 50 }
    ],
    "levels": {
        "1": "Up to 5 Minions",
        "2": "6-10 Minions",
        "3": "11-25 Minions",
        "4": "26-50 Minions",
        "5": "51-100 Minions",
        "6": "101-200 Minions"
    },
    "key": "minions",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Mulligan",
    "cost_per_level": 1,
    "relevant_stat": "Soul",
    "source": "BESM4e",
    "description": "Allows a character to reroll all dice for an action. You may choose from any result (original or rerolled).",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 109 },
        { "abbr": "Naked", "page": 50 }
    ],
    "levels": {
        "1": "2 rerolls per session",
        "2": "4 rerolls per session",
        "3": "6 rerolls per session",
        "4": "8 rerolls per session",
        "5": "10 rerolls per session",
        "6": "12 rerolls per session"
    },
    "key": "mulligan",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Nullify",
    "cost_per_level": 5,
    "relevant_stat": "Body or Soul",
    "source": "BESM4e",
    "description": "Temporarily nullify Attributes based on their source (e.g., magic, tech). Requires touch and a successful attack action.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 110 },
        { "abbr": "Naked", "page": 51 }
    ],
    "levels": {
        "1": "Nullify 1 Level of an Attribute",
        "2": "Nullify 2 Levels",
        "3": "Nullify 3 Levels",
        "4": "Nullify 4 Levels",
        "5": "Nullify 5 Levels",
        "6": "Nullify 6 Levels"
    },
    "user_input_required": [
        {
            "label": "Attribute Source",
            "key": "nullify_source",
            "field_type": "text",
            "description": "Enter the power source this attribute nullifies (e.g., magic, technology, supernatural)."
        }
    ],
    "key": "nullify",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Immovable",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "Grants the ability to reduce the knockback effect.",
    "source": "Extras",
    "sourcesRefs": [
        { "abbr": "Extras", "page": 7 }
    ],
    "levels": {
        "1": "Reduces knockback",
        "2": "Further reduces knockback",
        "3": "Further reduces knockback",
        "4": "Further reduces knockback",
        "5": "Further reduces knockback",
        "6": "Further reduces knockback"
    },
    "key": "immovable",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Plant Control",
    "cost_per_level": 1,
    "relevant_stat": "Mind",
    "source": "BESM4e",
    "description": "Control plant growth and movement in a given area. Plants return to normal after the effect ends.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 110 },
        { "abbr": "Naked", "page": 51 },
        { "abbr": "Extras", "page": 8 }
    ],
    "levels": {
        "1": "10 cm radius; plants grow x3",
        "2": "1 m radius; plants grow x10",
        "3": "10 m radius; plants grow x30",
        "4": "100 m radius; plants grow x100",
        "5": "1 km radius; plants grow x300",
        "6": "10 km radius; plants grow x1000"
    },
    "key": "plant_control",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Pocket Dimension",
    "cost_per_level": 1,
    "relevant_stat": null,
    "source": "BESM4e",
    "description": "Grants the user control over a small extra-dimensional space for storage, habitation, or narrative purposes. Typically requires Dimension Walk or Portal unless granted via an accessible item.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 112 },
        { "abbr": "Naked", "page": 51 }
    ],
    "levels": {
        "1": "Tiny dimension (10 cm radius)",
        "2": "Small dimension (1 m radius)",
        "3": "Moderately sized dimension (10 m radius)",
        "4": "Building-sized dimension (100 m radius)",
        "5": "Neighbourhood-sized dimension (1 km radius)",
        "6": "City-sized dimension (10 km radius)"
    },
    "key": "pocket_dimension",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Portal",
    "cost_per_level": 2,
    "relevant_stat": "Soul",
    "source": "BESM4e",
    "description": "Creates a one-way dimensional gate to another defined plane of existence or dimension.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 112 },
        { "abbr": "Naked", "page": 51 }
    ],
    "levels": {
        "1": "Create a one-way Portal to 1 defined dimension",
        "2": "Create a one-way Portal to 2 defined dimensions",
        "3": "Create a one-way Portal to 3 defined dimensions",
        "4": "Create a one-way Portal to 4 defined dimensions",
        "5": "Create a one-way Portal to 5 defined dimensions",
        "6": "Create a one-way Portal to 6 defined dimensions"
    },
    "key": "portal",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Power Flux",
    "cost_per_level": 10,
    "relevant_stat": "Variable",
    "source": "BESM4e",
    "description": "Grants the user a pool of Flux Points to dynamically assign to thematic Attributes once per minute or dramatic scene. Attributes must be aligned to a user-defined concept.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 113 },
        { "abbr": "Naked", "page": 51 },
        { "abbr": "Extras", "page": 8 }
    ],
    "levels": {
        "1": "Reassign up to 5 Flux Points each minute",
        "2": "Reassign up to 10 Flux Points each minute",
        "3": "Reassign up to 15 Flux Points each minute",
        "4": "Reassign up to 20 Flux Points each minute",
        "5": "Reassign up to 25 Flux Points each minute",
        "6": "Reassign up to 30 Flux Points each minute"
    },
    "user_input_required": [
        {
            "label": "Flux Category",
            "key": "flux_category",
            "field_type": "text",
            "description": "Enter the thematic category (e.g., cats, fire, lust, gravity) that all Flux powers must align with."
        }
    ],
    "key": "power_flux",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Power Variation",
    "cost_per_level": 4,
    "relevant_stat": "Variable",
    "source": "BESM4e",
    "description": "Allows redistribution of CPs between a fixed set of Attributes. Ideal for characters with adjustable power sets or shifting forms.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 114 },
        { "abbr": "Naked", "page": 51 }
    ],
    "levels": {
        "1": "Reassign Character Points between 2 Attributes each minute",
        "2": "Reassign Character Points between 3 Attributes each minute",
        "3": "Reassign Character Points between 4 Attributes each minute",
        "4": "Reassign Character Points between 5 Attributes each minute",
        "5": "Reassign Character Points between 6 Attributes each minute",
        "6": "Reassign Character Points between 7 Attributes each minute"
    },
    "user_input_required": [
        {
            "label": "Variable Attributes",
            "key": "variable_attributes",
            "field_type": "list",
            "description": "List the specific Attributes whose CP values may be varied."
        }
    ],
    "key": "power_variation",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Projection",
    "cost_per_level": 3,
    "relevant_stat": "Mind",
    "source": "BESM4e",
    "description": "Creates visible or audible images detectable by all, not just mentally targeted illusions. Useful for distraction, deception, or communication.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 114 },
        { "abbr": "Naked", "page": 52 }
    ],
    "levels": {
        "1": "Tiny projection (10 cm radius)",
        "2": "Small projection (1 m radius)",
        "3": "Moderately sized projection (10 m radius)",
        "4": "Building-size projection (100 m radius)",
        "5": "Neighbourhood-sized projection (1 km radius)",
        "6": "City-sized projection (10 km radius)"
    },
    "key": "projection",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Ranged Attack",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "source": "BESM4e",
    "description": "Allows the character to perform precise ranged attacks with a specific weapon class.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 116 },
        { "abbr": "Naked", "page": 53 }
    ],
    "levels": {
        "1": {
            "acv_bonus": 2
        },
        "2": {
            "acv_bonus": 4
        },
        "3": {
            "acv_bonus": 6
        },
        "4": {
            "acv_bonus": 8
        },
        "5": {
            "acv_bonus": 10
        },
        "6": {
            "acv_bonus": 12
        }
    },
    "modifiers": [
        {
            "type": "derived",
            "target": "ACV",
            "value_per_level": 2,
            "condition": "only when using selected weapon class"
        }
    ],
    "user_input_required": [
        {
            "label": "Weapon Class",
            "key": "weapon_class",
            "field_type": "combo_editable",
            "description": "Enter a custom category of weapons this Ranged Attack applies to (e.g. Long Gun, Spell, Throwing).",
            "options": [
                "Biotech Projectiles",
                "Bows",
                "Crossbows",
                "Elemental Blasts",
                "Energy Weapons",
                "Explosives",
                "Firearms",
                "Guns (General)",
                "Laser Pistols",
                "Magic Spells",
                "Thrown Weapons"
            ]
        }
    ],
    "key": "ranged_attack",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Ranged Defence",
    "cost_per_level": 1,
    "relevant_stat": null,
    "source": "BESM4e",
    "description": "Boosts Defence Combat Value when avoiding ranged attacks under a specific condition, such as while on foot or piloting a vehicle.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 116 },
        { "abbr": "Naked", "page": 53 }
    ],
    "levels": {
        "1": "+2 DCV against ranged attacks under a specific condition",
        "2": "+4 DCV against ranged attacks under a specific condition",
        "3": "+6 DCV against ranged attacks under a specific condition",
        "4": "+8 DCV against ranged attacks under a specific condition",
        "5": "+10 DCV against ranged attacks under a specific condition",
        "6": "+12 DCV against ranged attacks under a specific condition"
    },
    "user_input_required": [
        {
            "label": "Condition",
            "key": "condition",
            "field_type": "dropdown",
            "options": [
                "Personal",
                "Movement"
            ]
        }
    ],
    "key": "ranged_defence",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Regeneration",
    "cost_per_level": 5,
    "relevant_stat": "Body",
    "source": "BESM4e",
    "description": "The character regenerates Health or Energy each round. Must choose one focus when assigned.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 117 },
        { "abbr": "Naked", "page": 54 }
    ],
    "levels": {
        "1": "Regenerates up to 5 HP or EP per round",
        "2": "Regenerates up to 10 HP or EP per round",
        "3": "Regenerates up to 15 HP or EP per round",
        "4": "Regenerates up to 20 HP or EP per round",
        "5": "Regenerates up to 25 HP or EP per round",
        "6": "Regenerates up to 30 HP or EP per round"
    },
    "user_input_required": [
        {
            "label": "Regeneration Focus",
            "key": "regeneration_focus",
            "field_type": "dropdown",
            "options": [
                "Health",
                "Energy"
            ]
        }
    ],
    "key": "regeneration",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Reincarnation",
    "cost_per_level": 2,
    "relevant_stat": "Soul",
    "source": "BESM4e",
    "description": "Character returns after death if remnants are preserved. Revival time decreases with level.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 117 },
        { "abbr": "Naked", "page": 54 }
    ],
    "levels": {
        "1": "Reincarnates in 1 month",
        "2": "Reincarnates in 1 week",
        "3": "Reincarnates in 1 day",
        "4": "Reincarnates in 12 hours",
        "5": "Reincarnates in 1 hour",
        "6": "Reincarnates in 1 minute"
    },
    "key": "reincarnation",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Resilient",
    "cost_per_level": 2,
    "relevant_stat": "Body",
    "source": "BESM4e",
    "description": "Survive in hostile environments or conditions. Each level adds protection against one type.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 118 },
        { "abbr": "Naked", "page": 55 }
    ],
    "levels": {
        "1": "Resilient to 1 environment or condition",
        "2": "Resilient to 2 environments or conditions",
        "3": "Resilient to 3 environments or conditions",
        "4": "Resilient to 4 environments or conditions",
        "5": "Resilient to 5 environments or conditions",
        "6": "Resilient to 6 environments or conditions"
    },
    "user_input_required": [
        {
            "label": "Resilient Conditions",
            "key": "resilient_conditions",
            "field_type": "list",
            "placeholder": "Enter environments or conditions (e.g., vacuum, fire, underwater)"
        }
    ],
    "key": "resilient",
    "is_human_attribute": false
   }, 'special'),
  createBaseAttribute({
    "name": "Sensory Block",
    "cost_per_level": 1,
    "relevant_stat": "Mind",
    "source": "BESM4e",
    "description": "Partially hides character from specific senses or detection techniques in a 3m area.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 119 },
        { "abbr": "Naked", "page": 55 }
    ],
    "levels": {
        "1": "1 sense/technique blocked",
        "2": "2 senses/techniques blocked",
        "3": "3 senses/techniques blocked",
        "4": "4 senses/techniques blocked",
        "5": "5 senses/techniques blocked",
        "6": "6 senses/techniques blocked"
    },
    "user_input_required": [
        {
            "label": "Blocked Senses or Techniques",
            "key": "blocked_senses",
            "field_type": "list",
            "placeholder": "e.g., sight, infrared, radar"
        }
    ],
    "key": "sensory_block",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Sixth Sense",
    "cost_per_level": 1,
    "relevant_stat": "Soul",
    "source": "BESM4e",
    "description": "Allows character to sense phenomena others cannot, such as emotions, magic, danger.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 119 },
        { "abbr": "Naked", "page": 55 }
    ],
    "levels": {
        "1": "Sense 1 type of phenomenon",
        "2": "Sense 2 types of phenomena",
        "3": "Sense 3 types of phenomena",
        "4": "Sense 4 types of phenomena",
        "5": "Sense 5 types of phenomena",
        "6": "Sense 6 types of phenomena"
    },
    "key": "sixth_sense",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Size Change",
    "cost_per_level": 3,
    "relevant_stat": "Body",
    "source": "BESM4e",
    "description": "The character can temporarily grow or shrink in size. Choose increase or decrease at creation unless the 'Both Ways' enhancement is taken.",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 120 },
        { "abbr": "Naked", "page": 55 }
    ],
    "levels": {
        "1": "Change up to 1 Size Rank",
        "2": "Change up to 2 Size Ranks",
        "3": "Change up to 3 Size Ranks",
        "4": "Change up to 4 Size Ranks",
        "5": "Change up to 5 Size Ranks",
        "6": "Change up to 6 Size Ranks"
    },
    "user_input_required": [
        {
            "label": "Size Direction",
            "key": "size_direction",
            "field_type": "dropdown",
            "options": [
                "Increase",
                "Decrease"
            ]
        }
    ],
    "key": "size_change",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Tough",
    "cost_per_level": 1,
    "relevant_stat": null,
    "description": "Increases total Health Points.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 128 },
        { "abbr": "Naked", "page": 60 }
    ],
    "levels": {
        "1": "+10 Health Points",
        "2": "+20 Health Points",
        "3": "+30 Health Points",
        "4": "+40 Health Points",
        "5": "+50 Health Points",
        "6": "+60 Health Points"
    },
    "stat_mods": {
        "derived": {
            "HP": 10
        }
    },
    "key": "tough",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Transfer",
    "cost_per_level": 3,
    "relevant_stat": "Soul",
    "description": "Grants the ability to give attributes to a target.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 128 }
    ],
    "levels": {
        "1": "Transfer 1 Attribute",
        "2": "Transfer 2 Attributes",
        "3": "Transfer 3 Attributes",
        "4": "Transfer Attributes up to Level 4",
        "5": "Transfer Attributes up to Level 5",
        "6": "Transfer Attributes up to Level 6"
    },
    "key": "transfer",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Transmute",
    "cost_per_level": 3,
    "relevant_stat": "Mind or Soul",
    "description": "Grants the ability to turn one up to medium-sized or a set of connected non-living objects into another.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 128 },
        { "abbr": "Naked", "page": 60 }
    ],
    "levels": {
        "1": "Transmute object up to 1 kg",
        "2": "Transmute object up to 10 kg",
        "3": "Transmute object up to 100 kg",
        "4": "Transmute objects worth up to 20 CP",
        "5": "Transmute objects worth up to 25 CP",
        "6": "Transmute objects worth up to 30 CP"
    },
    "key": "transmute",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Unaffected",
    "cost_per_level": 2,
    "relevant_stat": "Body",
    "description": "Grants the ability to impose a penalty to a target’s offensive attribute roll.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 129 },
        { "abbr": "Naked", "page": 60 }
    ],
    "levels": {
        "1": "Minor penalty",
        "2": "Moderate penalty",
        "3": "Significant penalty",
        "4": "-8 penalty to attacker using the specific Attribute",
        "5": "-10 penalty to attacker using the specific Attribute",
        "6": "-12 penalty to attacker using the specific Attribute"
    },
    "user_input_required": [
        {
            "label": "Blocked Attribute",
            "key": "blocked_attribute",
            "field_type": "text",
            "description": "Enter the Attribute this resistance applies to."
        },
        {
            "label": "Power Source",
            "key": "blocked_source",
            "field_type": "dropdown",
            "options": ["Magic", "Technology", "Supernatural", "Psionics", "Other"],
            "required": true
        }
    ],
    "key": "unaffected",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Undetectable",
    "cost_per_level": 2,
    "relevant_stat": "Body",
    "description": "Grants the ability to hide from a particular sense or detection technique.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 131 },
        { "abbr": "Naked", "page": 61 }
    ],
    "levels": {
        "1": "Hide from one minor sense",
        "2": "Hide from one common sense",
        "3": "Hide from multiple senses",
        "4": "Undetectable to 4 senses or techniques",
        "5": "Undetectable to 5 senses or techniques",
        "6": "Undetectable to 6 senses or techniques"
    },
    "user_input_required": [
        {
            "label": "Concealed Senses/Techniques",
            "key": "undetectable_types",
            "field_type": "list",
            "description": "List the senses or techniques from which the character is hidden.",
            "autocomplete_options": [
                "Sight",
                "Hearing",
                "Touch",
                "Smell",
                "Taste",
                "Infrared",
                "Ultraviolet",
                "Magic",
                "Radar",
                "Sonar",
                "Mental",
                "Spiritual",
                "Astral",
                "Vibration",
                "Radiation",
                "Ethereal"
            ]
        }
    ],
    "key": "undetectable",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Unique Attribute",
    "cost_per_level": null,
    "relevant_stat": "Variable",
    "description": "Fill in the blank.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 131 },
        { "abbr": "Naked", "page": 61 }
    ],
    "levels": {
        "1": "Basic aptitude",
        "2": "Minor aptitude",
        "3": "Moderate aptitude",
        "4": "Significant aptitude",
        "5": "Major aptitude",
        "6": "Extreme aptitude"
    },
    "user_input_required": [
        {
            "label": "Custom Description",
            "key": "custom_description",
            "field_type": "textarea",
            "description": "Describe what this Unique Attribute does and its game effects."
        },
        {
            "label": "Point Cost Per Level",
            "key": "custom_cp_cost",
            "field_type": "number",
            "description": "Assign the CP cost per level (1–10).",
            "required": true
        }
    ],
    "key": "unique_attribute",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Unknown Power",
    "cost_per_level": 1,
    "relevant_stat": "Special",
    "description": "Grants hidden abilities unknown to the character and player.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 131 },
        { "abbr": "Naked", "page": 61 }
    ],
    "levels": {},
    "key": "unknown_power",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Water Speed",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "Grants the ability to swim on and underwater at high speeds.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 132 },
        { "abbr": "Naked", "page": 62 }
    ],
    "levels": {
        "1": "Swim at up to 10 kph",
        "2": "Swim at up to 30 kph",
        "3": "Swim at up to 100 kph",
        "4": "Swim at up to 300 kph",
        "5": "Swim at up to 1,000 kph",
        "6": "Swim at up to 3,000 kph"
    },
    "key": "water_speed",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Skill Group - Background",
    "cost_per_level": 1,
    "source": "BESM4e",
    "description": "Grants training or talent in a broad range of background skills.",
    "relevant_stat": "Body, Mind, or Soul",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 120 },
        { "abbr": "Naked", "page": 55 }
    ],
    "user_input_required": [
        {
            "field_type": "dropdown",
            "label": "Background Skill Group",
            "key": "skill_group_name",
            "options": [
                "Academic",
                "Artistic",
                "Domestic",
                "Occupation",
                "Unique Background Skill Group"
            ]
        }
    ],
    "levels": {
        "1": "Developing - Gaining proficiency through regular application",
        "2": "Trained - Moderate training and practice",
        "3": "Expert - Significant training and practice",
        "4": "Veteran - Extensive training and practice",
        "5": "Master - Exhaustive training and practice",
        "6": "Grand Master - Unparalleled ability and knowledge"
    },
    "key": "skill_group_background",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Skill Group - Field",
    "cost_per_level": 2,
    "source": "BESM4e",
    "description": "Grants training or talent in a broad range of field skills.",
    "relevant_stat": "Body, Mind, or Soul",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 120 },
        { "abbr": "Naked", "page": 55 }
    ],
    "user_input_required": [
        {
            "field_type": "dropdown",
            "label": "Field Skill Group",
            "key": "skill_group_name",
            "options": [
                "Business",
                "Social",
                "Street",
                "Technical",
                "Unique Field Skill Group"
            ]
        }
    ],
    "levels": {
        "1": "Developing - Gaining proficiency through regular application",
        "2": "Trained - Moderate training and practice",
        "3": "Expert - Significant training and practice",
        "4": "Veteran - Extensive training and practice",
        "5": "Master - Exhaustive training and practice",
        "6": "Grand Master - Unparalleled ability and knowledge"
    },
    "key": "skill_group_field",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Skill Group - Action",
    "cost_per_level": 3,
    "source": "BESM4e",
    "description": "Grants training or talent in a broad range of action skills.",
    "relevant_stat": "Body, Mind, or Soul",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 120 },
        { "abbr": "Naked", "page": 55 }
    ],
    "user_input_required": [
        {
            "field_type": "dropdown",
            "label": "Action Skill Group",
            "key": "skill_group_name",
            "options": [
                "Adventuring",
                "Detective",
                "Military",
                "Scientific",
                "Unique Action Skill Group"
            ]
        }
    ],
    "levels": {
        "1": "Developing - Gaining proficiency through regular application",
        "2": "Trained - Moderate training and practice",
        "3": "Expert - Significant training and practice",
        "4": "Veteran - Extensive training and practice",
        "5": "Master - Exhaustive training and practice",
        "6": "Grand Master - Unparalleled ability and knowledge"
    },
    "key": "skill_group_action",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Wealth",
    "cost_per_level": 3,
    "relevant_stat": null,
    "description": "Grants a disposable income and other liquid assets.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 132 },
        { "abbr": "Naked", "page": 62 }
    ],
    "levels": {
        "1": "Financially stable ($300k)",
        "2": "Well off ($1M)",
        "3": "Moderately rich ($3M)",
        "4": "Very rich ($10M)",
        "5": "Extremely rich ($30M)",
        "6": "Wealthy ($100M)"
    },
    "key": "wealth",
    "is_human_attribute": true
  }, 'special'),
  createBaseAttribute({
    "name": "Weapon",
    "cost_per_level": 2,
    "relevant_stat": "None",
    "description": "Grants the ability to deal damage through offensive means.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 132 },
        { "abbr": "Naked", "page": 62 },
        { "abbr": "Extras", "page": 10 },
        { "abbr": "Multiverse", "page": 13 }
    ],
    "levels": {
        "-1": "The attack doesn’t inflict regular damage",
        "0": "The Weapon’s Base Damage is 0 and thus the final damage is only equal to the character’s Attack Combat Value",
        "1": "The Weapon’s Base Damage is equal to 1 times the character’s Damage Multiplier",
        "2": "The Weapon’s Base Damage is equal to 2 times the character’s Damage Multiplier",
        "3": "The Weapon’s Base Damage is equal to 3 times the character’s Damage Multiplier",
        "4": "The Weapon’s Base Damage is equal to 4 times the character’s Damage Multiplier",
        "5": "The Weapon’s Base Damage is equal to 5 times the character’s Damage Multiplier",
        "6": "The Weapon’s Base Damage is equal to 6 times the character’s Damage Multiplier"
    },
    "user_input_required": [
        {
            "label": "Weapon",
            "key": "weapon",
            "field_type": "list",
            "placeholder": "e.g., martial arts, magic, lightning, energy sword, etc."
        }
    ],
    "key": "weapon",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Elasticity",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "The character can stretch or contort their limbs and/or body to a superhuman degree. This is most appropriate for giant robots with telescoping arms, sinuous demons or aliens, and rubbery creatures. While stretched, the character receives a minor edge on unarmed attack rolls.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 90 },
        { "abbr": "Naked", "page": 42 }
    ],
    "levels": {
        "1": "Can stretch their body up to 10 cm",
        "2": "Can stretch their body up to 30 cm",
        "3": "Can stretch their body up to 1 m",
        "4": "Can stretch their body up to 3 m",
        "5": "Can stretch their body up to 10 m",
        "6": "Can stretch their body up to 30 m"
    },
    "key": "elasticity",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Tunnelling",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "Grants the ability to burrow into dirt and stone-like ground.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 129 }
    ],
    "levels": {
        "1": "Tunnel up to 10 metres per hour",
        "2": "Tunnel up to 30 metres per hour",
        "3": "Tunnel up to 100 metres per hour",
        "4": "Tunnel up to 300 metres per hour",
        "5": "Tunnel up to 1 kph",
        "6": "Tunnel up to 3 kph"
    },
    "key": "tunnelling",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Spaceflight",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "Grants the ability to fly at high speeds beyond an atmosphere.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 121 }
    ],
    "levels": {
        "1": "Primitive near-planetary travel (up to 10,000 kph); days to moon, years to nearby planets",
        "2": "Slow interplanetary travel (up to 100,000 kph); hours to moon, month to nearby planets",
        "3": "Average interplanetary travel; days between nearby planets",
        "4": "Fast interplanetary travel; hours between nearby planets",
        "5": "Extrasolar travel; minutes between planets, years between nearby stars",
        "6": "Slow FTL travel; weeks between star systems"
    },
    "key": "spaceflight",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Special Movement",
    "cost_per_level": 1,
    "relevant_stat": "Body",
    "description": "Grants additional extra-ordinary movement techniques.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 122 },
        { "abbr": "Naked", "page": 57 }
    ],
    "levels": {
        "1": "1 Special Movement ability",
        "2": "2 Special Movement abilities",
        "3": "3 Special Movement abilities",
        "4": "4 Special Movement abilities",
        "5": "5 Special Movement abilities",
        "6": "6 Special Movement abilities"
    },
    "user_input_required": [
        {
            "label": "Movement Types",
            "key": "movement_types",
            "field_type": "list",
            "description": "List the Special Movement abilities the character possesses.",
            "autocomplete_options": [
                "Balance",
                "Cat-like",
                "Fast",
                "Light-footed",
                "Slithering",
                "Speedburst",
                "Swinging",
                "Unique Special Movement",
                "Untrackable",
                "Wall-Bouncing",
                "Wall-Crawling",
                "Water-Walking",
                "Zen Direction"
            ]
        }
    ],
    "key": "special_movement",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Summon Creatures",
    "cost_per_level": 2,
    "relevant_stat": "Mind",
    "description": "Grants the ability to summon and command creatures.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 122 },
        { "abbr": "Naked", "page": 57 }
    ],
    "levels": {
        "1": "Summon up to 1 animal",
        "2": "Summon up to 2 animals",
        "3": "Summon up to 4 animals",
        "4": "Summon up to 8 animals",
        "5": "Summon up to 16 animals",
        "6": "Summon up to 32 animals"
    },
    "key": "summon_creatures",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Supersense",
    "cost_per_level": 1,
    "relevant_stat": "Mind",
    "description": "Grants the ability to sense something beyond normal capabilities.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 123 },
        { "abbr": "Naked", "page": 58 }
    ],
    "levels": {
        "1": "10 m range",
        "2": "100 m range",
        "3": "1 km range",
        "4": "10 km range",
        "5": "100 km range",
        "6": "1,000 km range"
    },
    "user_input_required": [
        {
            "label": "Supersense Type",
            "key": "supersense_type",
            "field_type": "combo_editable",
            "description": "Enter the type of Supersense (e.g., radar, x-ray vision, echolocation).",
            "options": [
                "Echolocation",
                "Infrared Vision",
                "Radar",
                "Sonar",
                "Magnetic Field Detection",
                "Microscopic Vision",
                "Ultravision",
                "Vibration Detection",
                "X-Ray Vision"
            ]
        }
    ],
    "key": "supersense",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Superspeed",
    "cost_per_level": 3,
    "relevant_stat": "Body",
    "description": "Grants the ability to move at superspeeds.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 123 },
        { "abbr": "Naked", "page": 58 }
    ],
    "levels": {
        "1": "Top speed is 100 kph",
        "2": "Top speed is 300 kph",
        "3": "Top speed is 1,000 kph",
        "4": "Top speed is 3,000 kph",
        "5": "Top speed is 10,000 kph",
        "6": "Top speed is 30,000 kph"
    },
    "key": "superspeed",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Superstrength",
    "cost_per_level": 4,
    "relevant_stat": "Body",
    "description": "Grants the ability to lift and maneouevre things with strength beyond normal.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 124 },
        { "abbr": "Naked", "page": 58 }
    ],
    "levels": {
        "1": "Lift up to 250 kg (e.g., motorcycle)",
        "2": "Lift up to 500 kg (e.g., horse)",
        "3": "Lift up to 1 tonne (e.g., small car)",
        "4": "Lift up to 2 tonnes (e.g., truck)",
        "5": "Lift up to 5 tonnes (e.g., elephant)",
        "6": "Lift up to 10 tonnes (e.g., yacht)"
    },
    "key": "superstrength",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Swarm",
    "cost_per_level": 2,
    "relevant_stat": "Mind",
    "description": "Grants the ability to separate into many individual, smaller creatures.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 124 },
        { "abbr": "Naked", "page": 58 }
    ],
    "levels": {
        "1": "Swarm = HP total × 1",
        "2": "Swarm = HP total × 2",
        "3": "Swarm = HP total × 3",
        "4": "Swarm = HP total × 4",
        "5": "Swarm = HP total × 5",
        "6": "Swarm = HP total × 6"
    },
    "user_input_required": [
        {
            "label": "Swarm Creature Type",
            "key": "swarm_type",
            "field_type": "text",
            "description": "Describe what the swarm transforms into (e.g., rats, crows, tiny robots)."
        }
    ],
    "key": "swarm",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Telekinesis",
    "cost_per_level": 4,
    "relevant_stat": "Mind",
    "description": "Grants the ability to lift and maneouevre things remotely with one’s mind.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 125 },
        { "abbr": "Naked", "page": 58 }
    ],
    "levels": {
        "1": "Lift/Move up to 1 kg",
        "2": "Lift/Move up to 5 kg",
        "3": "Lift/Move up to 10 kg",
        "4": "Lift/Move up to 50 kg",
        "5": "Lift/Move up to 100 kg",
        "6": "Lift/Move up to 500 kg"
    },
    "key": "telekinesis",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Telepathy",
    "cost_per_level": 3,
    "relevant_stat": "Mind",
    "description": "Grants the ability to read minds and transmit thoughts both passively and aggressively.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 126 },
        { "abbr": "Naked", "page": 59 }
    ],
    "levels": {
        "1": "Sense strong surface thoughts; transmit basic feelings",
        "2": "Read ordinary surface thoughts; send words/images; converse with other telepaths",
        "3": "Share sensory input or read thoughts from a group (up to 10); speak to group or send strong image",
        "4": "Invade mind to extract memories (opposed roll); instinctive touch reading; speak to small group",
        "5": "Read surface thoughts of anyone nearby; probe repressed memories; speak to crowd (25)",
        "6": "Automatically read thoughts and sensory input from touch; alter memories; speak to throng (50)"
    },
    "key": "telepathy",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Teleport",
    "cost_per_level": 3,
    "relevant_stat": "Mind",
    "description": "Grants the ability to instantly travel from one place to another.",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 127 },
        { "abbr": "Naked", "page": 59 },
        { "abbr": "Extras", "page": 9 }
    ],
    "levels": {
        "1": "Teleport up to 10 meters",
        "2": "Teleport up to 100 meters",
        "3": "Teleport up to 1 kilometer",
        "4": "Teleport up to 10 kilometers",
        "5": "Teleport up to 100 kilometers",
        "6": "Teleport up to 1,000 kilometers"
    },
    "key": "teleport",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Mimic",
    "cost_per_level": 2,
    "relevant_stat": null,
    "description": "The character can temporarily mimic one Attribute or Stat of any single touched character for a duration of one minute or dramatic scene, though it only works on Attributes that derive their powers from one particular source (such as magic or technology or supernatural ability; page 258).",
    "source": "BESM4e",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 103 },
        { "abbr": "Naked", "page": 48 }
    ],
    "levels": {
        "1": "Mimic 1 Attributes",
        "2": "Mimic 2 Attributes",
        "3": "Mimic 3 Attributes",
        "4": "Mimic 4 Attributes",
        "5": "Mimic 5 Attributes, as well as Stats",
        "6": "Mimic 6 Attributes, as well as Stats"
    },
    "key": "mimic",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Expertise",
    "cost_per_level": 1,
    "relevant_stat": null,
    "description": "The character displays a dominant talent in certain selected situations and gains a minor or major edge (see BESM4, page 182) when making related dice rolls, depending on their Expertise Level.",
    "source": "Multiverse",
    "sourcesRefs": [
        { "abbr": "BESM4e", "page": 107 },
        { "abbr": "Naked", "page": 49 },
        { "abbr": "Multiverse", "page": 12 }
    ],
    "levels": {
        "1": "Character gains a minor edge with: one type of Skill roll; attack rolls with one narrow category of weapon; defence rolls with one narrow guarding category; a specific identified Attribute; opposed rolls when defending against an Attribute’s use",
        "2": "As Level 1, but character gains a major edge instead",
        "3": "Character gains a minor edge with: rolls related to one Stat; one type of attack roll or defence roll; a small group of related Attributes; one or more types of rolls under one environmental condition",
        "4": "As Level 3, but character gains a major edge instead",
        "5": "Character gains a minor edge with: all Skill rolls; all types of attack rolls; all types of defence rolls; Dynamic Powers or Power Flux",
        "6": "As Level 5, but character gains a major edge instead",
        "7": "Character gains a minor edge with: all Stat rolls; all combat rolls",
        "8": "As Level 7, but character gains a major edge instead",
        "9": "Character gains a minor edge with: all rolls",
        "10": "As Level 9, but character gains a major edge instead"
    },
    "key": "expertise",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    "name": "Taunt",
    "cost_per_level": 1,
    "relevant_stat": null,
    "description": "The character’s jibes and insults, or even simple presence, cause others to make errors of judgement and falter unexpectedly. Enemies suffer a minor or major obstacle (see BESM4, page 182) when making certain types of dice rolls that directly oppose the character or their efforts, depending on the Taunt Level.",
    "source": "Multiverse",
    "levels": {
        "1": "Opponent suffers a minor obstacle with: one type of Skill roll; attack rolls with one narrow category of weapon (one specific Weapon Attribute, unarmed, swords, bows, handguns, etc.); defence rolls with one narrow guarding category (using a shield, unarmed, driving/piloting a vehicle, while flying, swimming, swords, etc.); a specific identified Attribute; opposed rolls when defending against an Attribute’s use",
        "2": "As Level 1, but opponent suffers a major obstacle instead",
        "3": "Opponent suffers a minor obstacle with: rolls related to one Stat (Body, Mind, or Soul); one type of attack roll or defence roll (melee, ranged, vehicle, etc.); a small group of related Attributes; one or more types of rolls under one environmental condition (such as sunlight, water, flying, moonlight, etc.)",
        "4": "As Level 3, but opponent suffers a major obstacle instead",
        "5": "Opponent suffers a minor obstacle with: all Skill rolls; all types of attack rolls; all types of defence rolls; Dynamic Powers or Power Flux",
        "6": "As Level 5, but opponent suffers a major obstacle instead",
        "7": "Opponent suffers a minor obstacle with: all Stat rolls; all combat rolls",
        "8": "As Level 7, but opponent suffers a major obstacle instead",
        "9": "Opponent suffers a minor obstacle with: all rolls",
    },
    "key": "taunt",
    "is_human_attribute": false
  }, 'special'),
  createBaseAttribute({
    name: "God of Cookery",
    key: "god_of_cookery",
    cost_per_level: 2,
    relevant_stat: null,
    is_human_attribute: false,
    description: "The new God of Cookery Attribute allows a character to perform over-the-top feats involving food and cooking equipment.",
    source: "Uresia",
    sourcesRefs: [
      { abbr: "Uresia", page: 68 }
    ],
    levels: {
      1: { level: 1, description: "One chef technique" },
      2: { level: 2, description: "Two chef techniques" },
      3: { level: 3, description: "Three chef techniques" },
      4: { level: 4, description: "Four chef techniques" },
      5: { level: 5, description: "Five chef techniques" },
      6: { level: 6, description: "Six chef techniques" }
    },
    user_input_required: [
      {
        label: "Technique Description",
        key: "chef_technique_description",
        field_type: "list",
        description: "Enter one chef technique per line.",
        autocomplete_options: [
          "Buffet Demon",
          "Connoisseur",
          "Culinary Encyclopedia",
          "Food Fighter",
          "Gustatory Focus",
          "Judge Cook",
          "Lightning Chef",
          "Portable Kitchen",
          "Unique God of Cookery"
        ]
      }
    ]
  }, 'special'),
  createBaseAttribute({
    name: "Mana Flux",
    key: "mana_flux",
    cost_per_level: 10,
    relevant_stat: "Mind",
    is_human_attribute: false,
    description: "Grants the user a pool of Flux Points to dynamically assign to thematic Attributes once per minute or dramatic scene. Attributes must be aligned to a user-defined concept.",
    source: "Ikaris",
    sourcesRefs: [
      { abbr: "Ikaris", page: 123 }
    ],
    levels: {
      1: { level: 1, description: "Reassign up to 5 Flux Points each minute" },
      2: { level: 2, description: "Reassign up to 10 Flux Points each minute" },
      3: { level: 3, description: "Reassign up to 15 Flux Points each minute" },
      4: { level: 4, description: "Reassign up to 20 Flux Points each minute" },
      5: { level: 5, description: "Reassign up to 25 Flux Points each minute" },
      6: { level: 6, description: "Reassign up to 30 Flux Points each minute" }
    },
    user_input_required: [
      {
        label: "Primary Category",
        key: "primary_category",
        field_type: "dropdown",
        description: "Select the primary category that flux powers must align with.",
        options: [
          "Animal",
          "Classical Elementals",
          "Darkness",
          "Electricity",
          "Health",
          "Light",
          "Manufacturing",
          "Nature",
          "Necromancy",
          "Shapeshifting",
          "Travel",
          "Weather"
        ]
      },
      {
        label: "Secondary Category",
        key: "secondary_category",
        field_type: "dropdown",
        description: "Select the secondary category that flux powers must align with.",
        options: [
          "Animal",
          "Classical Elementals",
          "Darkness",
          "Electricity",
          "Health",
          "Light",
          "Manufacturing",
          "Nature",
          "Necromancy",
          "Shapeshifting",
          "Travel",
          "Weather"
        ]
      },
      {
        label: "Tertiary Category",
        key: "tertiary_category",
        field_type: "dropdown",
        description: "Select the tertiary category that flux powers must align with.",
        options: [
          "Animal",
          "Classical Elementals",
          "Darkness",
          "Electricity",
          "Health",
          "Light",
          "Manufacturing",
          "Nature",
          "Necromancy",
          "Shapeshifting",
          "Travel",
          "Weather"
        ]
      }
    ]
  }, 'supernatural'),
  createBaseAttribute({
    name: "Small, Light, and Unobtrusive",
    key: "small_light_unobtrusive",
    cost_per_level: 2,
    relevant_stat: "Soul",
    is_human_attribute: false,
    description: "The character is small, light, and unobtrusive. They are easy to miss and can be easily hidden.",
    source: "BESM4e",
    levels: {
      1: { level: 1, description: "+1 to Stealth and related rolls" },
      2: { level: 2, description: "+2 to Stealth and related rolls" },
      3: { level: 3, description: "+3 to Stealth and related rolls" },
      4: { level: 4, description: "+4 to Stealth and related rolls" },
      5: { level: 5, description: "+5 to Stealth and related rolls" },
      6: { level: 6, description: "+6 to Stealth and related rolls" }
    },
    stat_mods: {
      derived: {
        "Stealth Bonus": 1
      }
    }
  }, 'physical')
];

// Helper functions for working with attributes
export function getAttributeByKey(key: string): AttributeTemplate | undefined {
  return ATTRIBUTES_LIBRARY.find(attr => attr.key === key);
}

export function getAttributesBySource(source: string): AttributeTemplate[] {
  return ATTRIBUTES_LIBRARY.filter(attr => attr.source === source);
}

export function getHumanAttributes(): AttributeTemplate[] {
  return ATTRIBUTES_LIBRARY.filter(attr => attr.is_human_attribute);
}

export function getSupernaturalAttributes(): AttributeTemplate[] {
  return ATTRIBUTES_LIBRARY.filter(attr => !attr.is_human_attribute);
}

export function searchAttributes(query: string): AttributeTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return ATTRIBUTES_LIBRARY.filter(attr => 
    attr.name.toLowerCase().includes(lowercaseQuery) ||
    attr.description.toLowerCase().includes(lowercaseQuery)
  );
}

export function calculateAttributeCost(template: AttributeTemplate, level: number, customInputs?: Record<string, any>): number {
  if (template.dynamic_cost && customInputs?.category) {
    return template.dynamic_cost[customInputs.category] * level;
  }
  
  if (template.cost_per_level === null && customInputs?.custom_cp_cost) {
    return customInputs.custom_cp_cost * level;
  }
  
  return (template.cost_per_level || 1) * level;
}