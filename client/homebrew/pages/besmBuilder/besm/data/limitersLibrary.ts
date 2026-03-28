export interface LimiterTemplate {
  name: string;
  key: string;
  description: string;
  compatible_with: string[];
  source: string;
  picks: number;
  max_selections?: number;
  assignments?: Record<string, string>;
}

const UNIVERSAL_LIMITERS: LimiterTemplate[] = [
  {
    name: "Activation",
    key: "activation",
    description: "Requires focused preparation to ready the power; you pause to activate it. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Spend one round preparing the Attribute before it is used",
      "2": "Spend one minute preparing the Attribute before it is used",
      "3": "Spend one hour preparing the Attribute before it is used"
    }
  },
  {
    name: "Deplete",
    key: "deplete",
    description: "Consumes personal reserves either during use or afterward. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Attributes with immediate effects burn 10 Energy Points for each use (or attempted use); ongoing Attributes burn 10 Energy Point each minute of use",
      "2": "Attributes with immediate effects burn 20 Energy Points for each use (or attempted use); ongoing Attributes burn 5 Energy Point each round of use",
      "3": "Attributes with immediate effects burn 30 Energy Points for each use (or attempted use); ongoing Attributes burn 20 Energy Point each round of use"
    }
  },
  {
    name: "Maximum",
    key: "maximum",
    description: "Capped reach or area; it never exceeds a set bound. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "The character’s Attribute is at Level 2 and always functions at its Maximum effectiveness",
      "2": "The character’s Attribute is at Level 3 or 4 and always functions at its Maximum effectiveness",
      "3": "The character’s Attribute is at Level 5+ and always functions at its Maximum effectiveness"
    }
  },
  {
    name: "Assisted",
    key: "assisted",
    description: "Needs dedicated helpers or support to function. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "A single assistant is required for the Attribute to function",
      "2": "A small group of assistants (2-10) is required for the Attribute to function",
      "3": "A large group of assistants (11-100) is required for the Attribute to function"
    }
  },
  {
    name: "Backlash",
    key: "backlash",
    description: "Failures kick back with unwanted side effects. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "The Backlash occurs if the character fails their roll by an extreme margin (6 or more)",
      "2": "The Backlash occurs if the character fails their roll by a significant margin (3 or more)",
      "3": "The Backlash occurs if the character fails their roll"
    }
  },
  {
    name: "Charges",
    key: "charges",
    description: "Only a few uses before it must be refreshed or reloaded. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Only use the Attribute four to six times a day (or session)",
      "2": "Only use the Attribute two or three times a day (or session)",
      "3": "Only use the Attribute once a day (or session)"
    }
  },
  {
    name: "Concentration",
    key: "concentration",
    description: "Requires steady focus; interruptions end the effect. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Requires slight Concentration. The character can still perform other general actions but cannot perform any combat-related actions or use other Attributes that also require Concentration.",
      "2": "Requires intense Concentration. The character can move at slow speeds and talk with others while using the Attribute but cannot perform any complex actions (including combat) or use any other Attribute.",
      "3": "Requires full Concentration. The character cannot do anything else while using the Attribute and must remain still to devote their full attention to the Attribute."
    }
  },
  {
    name: "Consumable",
    key: "consumable",
    description: "Consumes a focus or component on each use. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Focus is easy to replace",
      "2": "Focus is hard to replace",
      "3": "Focus is very difficult to replace"
    }
  },
  {
    name: "Delay",
    key: "delay",
    description: "Takes effect later, leaving a window to intervene. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Delay of a few minutes before it takes full effect",
      "2": "Delay of a few hours before it takes full effect",
      "3": "Delay of a few days before it takes full effect"
    }
  },
  {
    name: "Dependent",
    key: "dependent",
    description: "Relies on other abilities being active or succeeding. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Dependent Attribute does not take effect until one other Attribute is activated",
      "2": "Dependent Attribute does not take effect until two other Attributes are activated",
      "3": "Dependent Attribute does not take effect until three other Attributes are activated"
    }
  },
  {
    name: "Detectable",
    key: "detectable",
    description: "Obvious to observers via telltale signs. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Detectable using 1-2 methods.",
      "2": "Detectable using 3-5 methods.",
      "3": "Detectable using 6-10 methods.",
    }
  },
  {
    name: "Object",
    key: "object",
    description: "Bound to a particular item you must carry. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "The Item’s Attribute still provides moderate benefit to the character.",
      "2": "The Item’s Attribute still provides slight benefit to the character.",
      "3": "The Item’s Attribute hardly provides any benefit to the character.",
    }
  },
  {
    name: "Environmental",
    key: "environmental",
    description: "Only works within certain environments. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Equipment",
    key: "equipment",
    description: "Requires specific gear to operate. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Semi-Permanent",
    key: "semi_permanent",
    description: "Lasts a long while but eventually fades. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Imbue",
    key: "imbue",
    description: "Grant this ability to others for a short time. Source: BESM4e.",
    compatible_with: ["armour", "augmented", "heightened_awareness", "immutable", "massive_damage", "melee_attack", "melee_defence", "mulligan", "ranged_attack", "ranged_defence", "resilient", "special_movement"],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Imbue 4-5 people",
      "2": "Imbue 2-3 people",
      "3": "Imbue 1 person"
    }
  },
  {
    name: "Unique",
    key: "unique",
    description: "A bespoke restriction negotiated with the GM. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Unique Limitation imposes minor restrictions on the Attribute",
      "2": "Unique Limitation imposes moderate restrictions on the Attribute",
      "3": "Unique Limitation imposes major restrictions on the Attribute"
    }
  },
  {
    name: "Irreversible",
    key: "irreversible",
    description: "Once changed, returning requires special means or time. Source: BESM4e.",
    compatible_with: ["alternate_form", "alternate_identity", "change_state", "elasticity", "undetectable"],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "It takes several hours of work or special circumstances to enable the character to transform back to an earlier form",
      "2": "As above, but the process also requires expensive or rare replacement components, ingredients, or prerequisites",
      "3": "As above, but the process takes several days"
    }
  },
  {
    name: "Unpredictable",
    key: "unpredictable",
    description: "Sometimes misfires or behaves unexpectedly. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "The character must make a successful average Stat roll (TN 12) to use the Attribute.",
      "2": "The character must make a successful average Stat roll (TN 15) to use the Attribute.",
      "3": "The character must make a successful average Stat roll (TN 18) to use the Attribute."
    }
  },
  {
    name: "Localised",
    key: "localised",
    description: "Only affects a specific body part or section. Source: BESM4e.",
    compatible_with: ["absorption", "alternate_form", "armour", "change_state", "conversion", "resilient", "superstrength", "undetectable"],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Affects a large part of the body (torso, both legs or arms, etc.)",
      "2": "Affects a small part of the body (one leg or arm, abdomen, chest, head, etc.)",
      "3": "Affects a tiny part of the body (one hand or foot, face, groin, knee, etc.)"
    }
  }
];

export const LIMITERS_LIBRARY: LimiterTemplate[] = [
  ...UNIVERSAL_LIMITERS,

  {
    name: "Both Directions",
    key: "both_directions",
    description: "Blocks both ways; protection also seals your own attacks. Source: BESM4e.",
    compatible_with: ["force_field"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Gap",
    key: "gap",
    description: "Has vulnerable openings that clever foes can exploit. Source: BESM4e.",
    compatible_with: ["armour"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Glide",
    key: "glide",
    description: "Airborne only with height or momentum; you ride currents, not launch. Source: BESM4e.",
    compatible_with: ["flight"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Internal",
    key: "internal",
    description: "Only functions within a specific place or enclosure. Source: BESM4e.",
    compatible_with: ["force_field"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Limited Use",
    key: "limited_use",
    description: "Only a few uses before it needs a new day or scene. Source: BESM4e.",
    compatible_with: ["ranged_attack", "regeneration"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Maintain",
    key: "maintain",
    description: "Requires forward speed and friendly surfaces to stay aloft. Source: BESM4e.",
    compatible_with: ["flight"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Preparation",
    key: "preparation",
    description: "Demands prep time or setup before use. Source: BESM4e.",
    compatible_with: ["ranged_attack", "flight"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Road-Bound",
    key: "road_bound",
    description: "Shines on smooth roads; struggles off‑road. Source: BESM4e.",
    compatible_with: ["ground_speed"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Situational",
    key: "situational",
    description: "Functions only when certain conditions are met. Source: BESM4e.",
    compatible_with: ["ranged_attack", "regeneration"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Skim",
    key: "skim",
    description: "Hovers skimming just above ground or water. Source: BESM4e.",
    compatible_with: ["flight"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Spread",
    key: "spread",
    description: "Needs open space to deploy and manoeuvre. Source: BESM4e.",
    compatible_with: ["flight"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Alt-Munition",
    key: "alt_munition",
    description: "Alternate ammunition profile for special purposes, typically on Items. Source: BESM4e.",
    compatible_with: ["weapon", "item"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Ammo",
    key: "ammo",
    description: "Limited carried ammunition; once spent, you’re done until resupplied. Source: BESM4e.",
    compatible_with: ["weapon"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Backblast",
    key: "backblast",
    description: "Dangerous exhaust or rebound can harm those behind you — sometimes even you. Source: BESM4e.",
    compatible_with: ["weapon"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Broad Category",
    key: "broad_category",
    description: "Affects only a broad, defined class of targets or subjects. Source: BESM4e.",
    compatible_with: ["mind_control", "telepathy", "transmute"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Conditional",
    key: "conditional",
    description: "Recovery depends on exposure to a specific source or condition. Source: BESM4e.",
    compatible_with: ["regeneration"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Emphasised",
    key: "emphasised",
    description: "Tuned to an uncommon threat; less effective against everything else. Source: BESM4e.",
    compatible_with: ["armour"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Optimised",
    key: "optimised",
    description: "Optimised against a common threat; performance is skewed toward a chosen focus. Source: BESM4e.",
    compatible_with: ["armour"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Exclusive",
    key: "exclusive",
    description: "Only affects a narrowly specified target set; others are unaffected. Source: BESM4e.",
    compatible_with: ["weapon"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Fieldless",
    key: "fieldless",
    description: "Cannot fire while any Force Fields are active; drop fields first. Source: BESM4e.",
    compatible_with: ["weapon", "item", "force_field"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Focussed",
    key: "focussed",
    description: "Only manipulates a single chosen substance or element. Source: BESM4e.",
    compatible_with: ["telekinesis"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Focussed Damage",
    key: "focussed_damage",
    description: "Extra harm applies only with a specific attack style or method. Source: BESM4e.",
    compatible_with: ["massive_damage", "weapon"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Hands",
    key: "hands",
    description: "Requires two hands or equivalents to use properly. Source: BESM4e.",
    compatible_with: ["weapon"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Inaccurate",
    key: "inaccurate",
    description: "Notoriously imprecise or unwieldy in use. Source: BESM4e.",
    compatible_with: ["weapon", "item"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Charges (4-6/day)",
    key: "charges_1",
    description: "Limited uses: about 4–6 per day or session. Source: BESM4e.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Charges (2-3/day)",
    key: "charges_2",
    description: "Limited uses: about 2–3 per day or session. Source: BESM4e.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 2
  },
  {
    name: "Charges (1/day)",
    key: "charges_3",
    description: "Limited uses: about once per day or session. Source: BESM4e.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 3
  },
  {
    name: "Concentration (Slight)",
    key: "concentration_1",
    description: "Requires slight focus; general actions okay, combat is not. Source: BESM4e.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Concentration (Intense)",
    key: "concentration_2",
    description: "Requires intense focus; only simple movement/speech. Source: BESM4e.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 2
  },
  {
    name: "Concentration (Full)",
    key: "concentration_3",
    description: "Requires full focus; do nothing else while active. Source: BESM4e.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Consumable (Easy Replace)",
    key: "consumable_easy",
    description: "Attribute requires a focus (e.g., candles, incense) that is destroyed upon activation. Focus is easy to replace.",
    compatible_with: ["various_attributes", "item"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Consumable (Hard Replace)",
    key: "consumable_hard",
    description: "Attribute requires a focus (e.g., candles, incense) that is destroyed upon activation. Focus is hard to replace.",
    compatible_with: ["various_attributes", "item"],
    source: "BESM4e",
    picks: 2
  },
  {
    name: "Consumable (Very Difficult Replace)",
    key: "consumable_very_difficult",
    description: "Attribute requires a focus (e.g., candles, incense) that is destroyed upon activation. Focus is very difficult to replace.",
    compatible_with: ["various_attributes", "item"],
    source: "BESM4e",
    picks: 3
  },
  {
    name: "Delay (Few Minutes)",
    key: "delay_minutes",
    description: "Attribute does not take effect immediately, activating some time later. Delay of a few minutes before full effect.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Delay (Few Hours)",
    key: "delay_hours",
    description: "Attribute does not take effect immediately, activating some time later. Delay of a few hours before full effect.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 2
  },
  {
    name: "Delay (Few Days)",
    key: "delay_days",
    description: "Attribute does not take effect immediately, activating some time later. Delay of a few days before full effect.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 3
  },
  {
    name: "Emotional",
    key: "emotional",
    description: "Manifests only under strong emotional triggers or stakes. Source: BESM4e.",
    compatible_with: ["various_attributes", "weapon"],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Use requires significant Emotional investment.",
      "2": "Use requires strong Emotional investment.",
      "3": "Use requires extreme Emotional investment.",
    }
  },
  {
    name: "Environmental",
    key: "environmental",
    description: "Only works within a specified environment or condition. Source: BESM4e.",
    compatible_with: ["various_attributes", "weapon", "alternate_form", "item"],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Adventures often take place in or near the specific environment",
      "2": "Adventures occasionally take place in or near the specific environment",
      "3": "Adventures rarely take place in or near the specific environment",
    }
  },
  {
    name: "Equipment (Portable)",
    key: "equipment_portable",
    description: "Attribute requires specific external materials/machinery/accessories to function. Required Equipment is easily portable (smartphone, wagon, spell book).",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Imbue (4-5 people)",
    key: "imbue_4_5",
    description: "Character grants Attribute use (excluding Imbue) to others for one scene. Can Imbue 4-5 people. (Often used with Charges).",
    compatible_with: ["armour", "augmented", "heightened_awareness", "immutable", "massive_damage", "melee_attack", "melee_defence", "mulligan", "ranged_attack", "ranged_defence", "resilient", "special_movement"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Irreversible (Hours/Circumstance)",
    key: "irreversible_hours",
    description: "Applies to appearance/structure changing Attributes. Cannot transform back without meeting conditions. Takes several hours of work or special circumstances to transform back.",
    compatible_with: ["alternate_form", "alternate_identity", "change_state", "elasticity", "undetectable"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Localised (Large Part)",
    key: "localised_large",
    description: "Only part of the character's body is affected. Affects a large part (torso, both legs or arms, etc.). (For Item Armour, usually implies riding on vehicle).",
    compatible_with: ["absorption", "alternate_form", "armour", "change_state", "conversion", "resilient", "superstrength", "undetectable", "item"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Object (Moderate Benefit)",
    key: "object_moderate",
    description: "Usually for Attributes within Items contrary to 'normal use'. Benefits Item, not user directly. The Item's Attribute still provides moderate benefit to the character.",
    compatible_with: ["item"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Permanent",
    key: "permanent",
    description: "Always on and cannot be switched off; brings ongoing drawbacks. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Permanent Attribute is a slight inconvenience",
      "2": "Permanent Attribute is a minor inconvenience",
      "3": "Permanent Attribute is a moderate inconvenience",
    }
  },
  {
    name: "Recovery",
    key: "recovery",
    description: "Requires a cool-down period after use before working again. Source: BESM4e.",
    compatible_with: ["various_attributes", "item"],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "For every 1 minute the character uses the Attribute, the Recovery time is 1 minute before the Attribute functions again. The Attribute can be used for a maximum of 12 hours.",
      "2": "For every 1 minute the character uses the Attribute, the Recovery time is 10 minutes before the Attribute functions again. The Attribute can be used for a maximum of 4 hours.",
      "3": "For every 1 minute the character uses the Attribute, the Recovery time is 1 hour before the Attribute functions again. The Attribute can be used for a maximum of 1 hour.",
    }
  },
  {
    name: "Semi-Permanent",
    key: "semi_permanent",
    description: "Always on, but can be suppressed briefly at a cost. Source: BESM4e.",
    compatible_with: [],
    source: "BESM4e",
    picks: 1,
    max_selections: 3,
    assignments: {
      "1": "Semi-Permanent Attribute is a minor inconvenience to the character; can be turned off at a cost of 1 Energy Points/minute",
      "2": "Semi-Permanent Attribute is a moderate inconvenience to the character; can be turned off at a cost of 10 Energy Points/minute",
      "3": "Semi-Permanent Attribute is a major inconvenience to the character; can be turned off at a cost of 10 Energy Points/round",
    }
  },
  {
    name: "Unpredictable (Average TN 12)",
    key: "unpredictable_tn12",
    description: "Attribute doesn't always function when desired or functions unexpectedly; requires Stat roll (usually Soul). Must make a successful average Stat roll (TN 12) to use correctly.",
    compatible_with: ["various_attributes"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Ignore",
    key: "ignore",
    description: "Ignores a chosen aspect (substance, color, or condition). Source: Multiverse.",
    compatible_with: ["various_attributes"],
    source: "Multiverse",
    picks: 1,
    "assignments": {
      "1": "The substance, colour, or condition plays a rare role in the game. Examples include marble stone, a specific shade of yellow, paranoia, pentagrams, etc.",
      "2": "The substance, colour, or condition plays a uncommon role in the game. Examples include wood, teal, jealousy, numbers divisible by 10, etc.",
      "3": "The substance, colour, or condition plays a common role in the game. Examples include metal, blue, fear, circles, etc."
    }
  },
  {
    name: "Acceleration",
    key: "acceleration",
    description: "Shortens how long an effect persists. Source: Multiverse.",
    compatible_with: ["various_attributes"],
    source: "Multiverse",
    picks: 1,
    "assignments": {
      "0": "Remains in effect as long as the Attribute description indicates (which is usually one minute or dramatic scene)",
      "1": "Remains in effect for 30 seconds (or only part of a dramatic scene)",
      "2": "Remains in effect for 5 rounds",
      "3": "Remains in effect for 2 rounds",
      "4": "Remains in effect for 1 round",
      "5": "Remains in effect for 1-2 seconds",
      "6": "The effect is instantaneous or has no significant duration"
    }
  },
  {
    name: "Haywire",
    key: "haywire",
    description: "Becomes erratic when exposed to a specific trigger. Source: Multiverse.",
    compatible_with: ["various_attributes"],
    source: "Multiverse",
    picks: 1,
    "assignments": {
      "1": "The substance or condition is rare (meteor rock, ginger, eucalyptus, hurricanes), and the fluctuation lasts for one to several rounds.",
      "2": "The substance or condition is uncommon (gold, cinnamon, bamboo, storms), and the fluctuation lasts for one minute or dramatic scene.",
      "3": "The substance or condition is common (lead, pepper, maple tree, rain), and the fluctuation lasts for one to several hours."
    }
  },
  {
    name: "Timed",
    key: "timed",
    description: "Ongoing or permanent effects end after a set duration. Source: Multiverse.",
    compatible_with: ["various_attributes"],
    source: "Multiverse",
    picks: 1,
    "assignments": {
      "1": "Attribute remains in effect for up to one hour",
      "2": "Attribute remains in effect for up to one minute or dramatic scene",
      "3": "Attribute remains in effect for up to five rounds"
    }
  },
  {
    name: "Replenishment",
    key: "replenishment",
    description: "Defines how quickly Mana returns to the character. Source: Ikaris.",
    compatible_with: ["mana_flux"],
    source: "Ikaris",
    picks: 1,
    "assignments": {
      "1": "Mana replenishes at a rate of 1/minute",
      "2": "Mana replenishes at a rate of 1/5 minutes",
      "3": "Mana replenishes at a rate of 5/hour",
      "4": "Mana replenishes at a rate of 10/day",
      "5": "Mana replenishes at a rate of 1/day",
      "6": "Mana replenishes at a rate of 1/week"
    }
  },
  {
    name: "Capped",
    key: "capped",
    description: "Absorption has an upper limit before overflow applies. Source: BESM4e.",
    compatible_with: ["absorption"],
    source: "BESM4e",
    picks: 1,
    max_selections: 3
  },
  {
    name: "Narrow Category",
    key: "narrow_category",
    description: "Summons are restricted to a narrow subset within a broader type (e.g., only corvids among birds).",
    compatible_with: ["summon_creatures"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Specific Category",
    key: "specific_category",
    description: "Summons are restricted to one specific category (e.g., only wolves).",
    compatible_with: ["summon_creatures"],
    source: "BESM4e",
    picks: 1
  },
  {
    name: "Single Category",
    key: "single_category",
    description: "Summons are restricted to one single, particularly tight grouping (e.g., only a single species or defined individual type).",
    compatible_with: ["summon_creatures"],
    source: "BESM4e",
    picks: 1
  }
  ,
  {
    name: "Nonadjacent",
    key: "nonadjacent",
    description: "Undetectable does not work on adjacent targets; only affects those not right next to the character. Source: Multiverse.",
    compatible_with: ["undetectable"],
    source: "Multiverse",
    picks: 1
  }
];

export function getLimiterByKey(key: string): LimiterTemplate | undefined {
  return LIMITERS_LIBRARY.find(l => l.key === key);
}

export function searchLimiters(query: string): LimiterTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return LIMITERS_LIBRARY.filter(l =>
    l.name.toLowerCase().includes(lowercaseQuery) ||
    l.description.toLowerCase().includes(lowercaseQuery)
  );
} 