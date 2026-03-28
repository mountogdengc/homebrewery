export interface EnhancementTemplate {
  name: string;
  key: string;
  description: string;
  compatible_with: string[];
  source: string;
  picks: number;
  max_selections?: number;
}

export const ENHANCEMENTS_LIBRARY: EnhancementTemplate[] = [
  {
    "name": "Accurate",
    "key": "accurate",
    "description": "Fine-tuned precision that helps attacks land true; often a hallmark of crafted or smart weapons. Source: BESM4e.",
    "compatible_with": [
      "weapon",
      "item"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "All Attributes (Transfer)",
    "key": "all_attributes_transfer",
    "description": "Channel a broad suite of your abilities into another, sharing your power theme. Source: BESM4e.",
    "compatible_with": [
      "transfer"
    ],
    "source": "BESM4e",
    "picks": 2
  },
  {
    "name": "All Attributes (Unaffected)",
    "key": "all_attributes_unaffected",
    "description": "Unaffected by a wide family of source-related abilities, shrugging them off wholesale. Source: BESM4e.",
    "compatible_with": [
      "unaffected"
    ],
    "source": "BESM4e",
    "picks": 3
  },
  {
    "name": "All Powers",
    "key": "all_powers",
    "description": "Briefly echo a wide spectrum of another’s capabilities, reflecting their theme. Source: BESM4e.",
    "compatible_with": [
      "mimic"
    ],
    "source": "BESM4e",
    "picks": 2
  },
  {
    "name": "All Weapons (Unaffected)",
    "key": "all_weapons_unaffected",
    "description": "Unaffected by source-related weapon effects regardless of refinements. Source: BESM4e.",
    "compatible_with": [
      "unaffected"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Any Form",
    "key": "any_form",
    "description": "Transform subjects into virtually any suitable form within the setting’s logic. Source: BESM4e.",
    "compatible_with": [
      "metamorphosis"
    ],
    "source": "BESM4e",
    "picks": 2
  },
  {
    "name": "Multiform",
    "key": "multiform",
    "description": "Switch subjects among several related, GM-approved forms. Source: BESM4e.",
    "compatible_with": [
      "metamorphosis"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Area",
    "key": "area",
    "description": "Expands an ability’s influence to affect a surrounding space. Source: BESM4e.",
    "compatible_with": [
      "control_environment",
      "dimension_walk",
      "dynamic_powers",
      "exorcism",
      "force_field",
      "healing",
      "illusion",
      "metamorphosis",
      "mind_control",
      "nullify",
      "portal",
      "power_flux",
      "power_variation",
      "projection",
      "sensory_block",
      "sixth_sense",
      "telekinesis",
      "telepathy",
      "teleport",
      "unique_attribute",
      "unknown_power",
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1,
    "max_selections": 6
  },
  {
    "name": "Aura",
    "key": "aura",
    "description": "Your power clings to you—mere contact can trigger its effects. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Autofire",
    "key": "autofire",
    "description": "A rapid cascade of strikes or shots that overwhelms through sheer volume. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 3
  },
  {
    "name": "Blight",
    "key": "blight",
    "description": "On-hit affliction that can escalate harm if not resisted. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Blocks Incorporeal",
    "key": "blocks_incorporeal",
    "description": "Prevents phased or energy-state beings from slipping through. Source: BESM4e.",
    "compatible_with": [
      "force_field"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Blocks Teleport",
    "key": "blocks_teleport",
    "description": "Prevents teleportation into or out of the protected zone. Source: BESM4e.",
    "compatible_with": [
      "force_field"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Both Ways",
    "key": "both_ways",
    "description": "Allows size changes in either direction for flexible scale play. Source: BESM4e.",
    "compatible_with": [
      "size_change"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Complete",
    "key": "complete",
    "description": "Total adaptation to a specific hostile condition or environment. Source: BESM4e.",
    "compatible_with": [
      "resilient"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Contact",
    "key": "contact",
    "description": "Delivers effects through touch or exposure rather than direct impact. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Contagious",
    "key": "contagious",
    "description": "Effects can spread from victim to others through interaction. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Continuing",
    "key": "continuing",
    "description": "Lingering effects that persist beyond the initial strike. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Difficult to Stop",
    "key": "difficult_to_stop",
    "description": "A return that resists interruption; stopping it is exceptionally difficult. Source: BESM4e.",
    "compatible_with": [
      "reincarnation"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Dimensional",
    "key": "dimensional",
    "description": "Call creatures from other realms rather than local fauna. Source: BESM4e.",
    "compatible_with": [
      "summon_creatures"
    ],
    "source": "BESM4e",
    "picks": 2
  },
  {
    "name": "Drain",
    "key": "drain",
    "description": "Saps a chosen core trait, leaving victims diminished. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Duration",
    "key": "duration",
    "description": "Extends how long an effect persists once invoked. Source: BESM4e.",
    "compatible_with": [
      "control_environment",
      "dynamic_powers",
      "force_field",
      "illusion",
      "merge",
      "metamorphosis",
      "mimic",
      "mind_control",
      "nullify",
      "plant_control",
      "portal",
      "power_flux",
      "power_variation",
      "projection",
      "sensory_block",
      "size_change",
      "summon_creatures",
      "transfer",
      "transmute",
      "unique_attribute",
      "unknown_power",
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1,
    "max_selections": 10
  },
  {
    "name": "Enervation",
    "key": "enervation",
    "description": "Wears down personal reserves, leaving targets fatigued. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Enduring",
    "key": "enduring",
    "description": "Sustains invoked effects beyond the instant, maintaining access for a scene. Source: Ikaris.",
    "compatible_with": [
      "mana_flux"
    ],
    "source": "Ikaris",
    "picks": 1
  },
  {
    "name": "Extra Sense",
    "key": "extra_sense",
    "description": "Adds an additional sensory layer such as sound, scent, touch, or taste. Source: BESM4e.",
    "compatible_with": [
      "illusion"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Fast",
    "key": "fast",
    "description": "Improves travel pace for sweeping, dynamic movement. Source: BESM4e.",
    "compatible_with": [
      "flight"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Few Projections",
    "key": "few_projections",
    "description": "Maintain a small set of simultaneous projections. Source: BESM4e.",
    "compatible_with": [
      "projection"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Field-Penetrating",
    "key": "field_penetrating",
    "description": "Slip through or strike past certain protective fields. Source: BESM4e.",
    "compatible_with": [
      "force_field"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Flare",
    "key": "flare",
    "description": "Overloads a sense, such as dazzling light or deafening sound. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Flexible",
    "key": "flexible",
    "description": "A whiplike or extendable attack that enables tricky maneuvers. Source: BESM4e.",
    "compatible_with": [
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Homing",
    "key": "homing",
    "description": "Attacks that curve back toward their mark if they stray. Source: BESM4e.",
    "compatible_with": [
      "ranged_attack"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Multiple Illusions",
    "key": "multiple_illusions",
    "description": "Sustain several illusions at once, sharing your focus. Source: BESM4e.",
    "compatible_with": [
      "illusion"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Offensive",
    "key": "offensive",
    "description": "Your barrier bites back when touched. Source: BESM4e.",
    "compatible_with": [
      "force_field"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Potent",
    "key": "potent",
    "description": "Reins in runaway effectiveness while realizing a stronger concept. Source: BESM4e.",
    "compatible_with": [
      "weapon",
      "force_field",
      "flight",
      "illusion",
      "projection",
      "summon_creatures",
      "transfer"
    ],
    "source": "BESM4e",
    "picks": 1,
    "max_selections": 6
  },
  {
    "name": "Range",
    "key": "range",
    "description": "Projects your effect to distant points from you. Source: BESM4e.",
    "compatible_with": [
      "control_environment",
      "dynamic_powers",
      "exorcism",
      "force_field",
      "healing",
      "illusion",
      "metamorphosis",
      "mimic",
      "mind_control",
      "nullify",
      "portal",
      "power_flux",
      "power_variation",
      "projection",
      "sensory_block",
      "telekinesis",
      "telepathy",
      "teleport",
      "transfer",
      "transmute",
      "unique_attribute",
      "unknown_power",
      "weapon"
    ],
    "source": "BESM4e",
    "picks": 1,
    "max_selections": 6
  },
  {
    "name": "Regenerating",
    "key": "regenerating",
    "description": "Recovers lost potency over short intervals. Source: BESM4e.",
    "compatible_with": [
      "force_field"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Targets",
    "key": "targets",
    "description": "Affects multiple beings or objects at once. Source: BESM4e.",
    "compatible_with": [
      "dynamic_powers",
      "exorcism",
      "healing",
      "illusion",
      "metamorphosis",
      "mind_control",
      "nullify",
      "portal",
      "power_flux",
      "power_variation",
      "telepathy",
      "teleport",
      "transmute",
      "unique_attribute",
      "unknown_power"
    ],
    "source": "BESM4e",
    "picks": 1,
    "max_selections": 6
  },
  {
    "name": "Blind",
    "key": "blind",
    "description": "Teleport without a clear line of sight to the destination; arrive at a known or sensed point. Source: Extras.",
    "compatible_with": [
      "teleport"
    ],
    "source": "Extras",
    "picks": 1
  },
  {
    "name": "Major Category",
    "key": "major_category",
    "description": "Broadens Dynamic Powers to a sweeping, thematic major domain. Source: BESM4e.",
    "compatible_with": [
      "dynamic_powers"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Primal Category",
    "key": "primal_category",
    "description": "Elevates Dynamic Powers to a fundamental cosmic domain. Source: BESM4e.",
    "compatible_with": [
      "dynamic_powers"
    ],
    "source": "BESM4e",
    "picks": 2
  },
  {
    "name": "Significant Power",
    "key": "significant_power",
    "description": "Your connections reach farther within the setting than usual. Source: BESM4e.",
    "compatible_with": [
      "connected"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Great Power",
    "key": "great_power",
    "description": "Your connections wield major, far-reaching influence. Source: BESM4e.",
    "compatible_with": [
      "connected"
    ],
    "source": "BESM4e",
    "picks": 2
  },
  {
    "name": "Quick Change",
    "key": "quick_change",
    "description": "Shift states almost instantly, even mid-conflict. Source: BESM4e.",
    "compatible_with": [
      "change_state"
    ],
    "source": "BESM4e",
    "picks": 1
  },
  {
    "name": "Synergistic",
    "key": "synergistic",
    "description": "Coordinates with adjacent defenses or energy flows for smoother operation. Source: BESM4e.",
    "compatible_with": [
      "absorption"
    ],
    "source": "BESM4e",
    "picks": 1,
    "max_selections": 3
  }
  ,
  {
    "name": "Supernatural",
    "key": "supernatural",
    "description": "Extends Summon Creatures beyond natural animals to include supernatural, magical, or otherworldly beings of the same general theme.",
    "compatible_with": [
      "summon_creatures"
    ],
    "source": "BESM4e",
    "picks": 1
  }
];

export function getEnhancementByKey(key: string): EnhancementTemplate | undefined {
  return ENHANCEMENTS_LIBRARY.find(e => e.key === key);
}

export function searchEnhancements(query: string): EnhancementTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return ENHANCEMENTS_LIBRARY.filter(e =>
    e.name.toLowerCase().includes(lowercaseQuery) ||
    e.description.toLowerCase().includes(lowercaseQuery)
  );
} 