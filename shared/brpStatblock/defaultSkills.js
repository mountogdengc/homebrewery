// ── BRP Default Skill List ────────────────────────────────────────────
// Standard skills with base percentages.
// `base` can be a number or a string like 'DEX×2' for characteristic-derived values.
// The resolver function computes actual base from characteristics.

export const DEFAULT_SKILLS = [
	// ── Combat ────────────────────────────────────────────────────────
	{ name: 'Brawl',            base: 25,  category: 'Combat' },
	{ name: 'Dodge',            base: 'DEX×2', category: 'Combat' },
	{ name: 'Grapple',         base: 25,  category: 'Combat' },
	{ name: 'Melee Weapon',    base: 15,  category: 'Combat' },
	{ name: 'Missile Weapon',  base: 15,  category: 'Combat' },
	{ name: 'Shield',          base: 15,  category: 'Combat' },

	// ── Communication ────────────────────────────────────────────────
	{ name: 'Bargain',         base: 5,   category: 'Communication' },
	{ name: 'Command',         base: 5,   category: 'Communication' },
	{ name: 'Disguise',        base: 1,   category: 'Communication' },
	{ name: 'Etiquette',       base: 5,   category: 'Communication' },
	{ name: 'Fast Talk',       base: 5,   category: 'Communication' },
	{ name: 'Insight',         base: 5,   category: 'Communication' },
	{ name: 'Language (Own)',   base: 'INT×5', category: 'Communication' },
	{ name: 'Language (Other)', base: 0,  category: 'Communication' },
	{ name: 'Perform',         base: 5,   category: 'Communication' },
	{ name: 'Persuade',        base: 15,  category: 'Communication' },
	{ name: 'Status',          base: 15,  category: 'Communication' },
	{ name: 'Teach',           base: 10,  category: 'Communication' },

	// ── Manipulation ─────────────────────────────────────────────────
	{ name: 'Art',             base: 5,   category: 'Manipulation' },
	{ name: 'Craft',           base: 5,   category: 'Manipulation' },
	{ name: 'Demolition',     base: 1,   category: 'Manipulation' },
	{ name: 'Fine Manipulation', base: 5, category: 'Manipulation' },
	{ name: 'First Aid',      base: 30,  category: 'Manipulation' },
	{ name: 'Gaming',         base: 'INT+POW', category: 'Manipulation' },
	{ name: 'Heavy Machine',  base: 1,   category: 'Manipulation' },
	{ name: 'Locksmith',      base: 1,   category: 'Manipulation' },
	{ name: 'Medicine',       base: 5,   category: 'Manipulation' },
	{ name: 'Repair',         base: 15,  category: 'Manipulation' },
	{ name: 'Sleight of Hand', base: 5,  category: 'Manipulation' },

	// ── Mental ───────────────────────────────────────────────────────
	{ name: 'Appraise',       base: 15,  category: 'Mental' },
	{ name: 'Knowledge',      base: 5,   category: 'Mental' },
	{ name: 'Literacy',       base: 0,   category: 'Mental' },
	{ name: 'Navigate',       base: 10,  category: 'Mental' },
	{ name: 'Research',       base: 25,  category: 'Mental' },
	{ name: 'Science',        base: 1,   category: 'Mental' },
	{ name: 'Strategy',       base: 1,   category: 'Mental' },

	// ── Perception ───────────────────────────────────────────────────
	{ name: 'Listen',         base: 25,  category: 'Perception' },
	{ name: 'Sense',          base: 10,  category: 'Perception' },
	{ name: 'Spot',           base: 25,  category: 'Perception' },
	{ name: 'Track',          base: 10,  category: 'Perception' },

	// ── Physical ─────────────────────────────────────────────────────
	{ name: 'Climb',          base: 40,  category: 'Physical' },
	{ name: 'Hide',           base: 10,  category: 'Physical' },
	{ name: 'Jump',           base: 25,  category: 'Physical' },
	{ name: 'Ride',           base: 5,   category: 'Physical' },
	{ name: 'Stealth',        base: 10,  category: 'Physical' },
	{ name: 'Swim',           base: 25,  category: 'Physical' },
	{ name: 'Throw',          base: 25,  category: 'Physical' }
];

// Resolve a base value that may be characteristic-derived
export function resolveBase(base, characteristics) {
	if(typeof base === 'number') return base;
	if(!characteristics) return 0;

	const str = String(base).toUpperCase();

	// DEX×2, INT×5, etc.
	const multMatch = str.match(/^(\w+)\s*[×x*]\s*(\d+)$/);
	if(multMatch) {
		const char = multMatch[1].toLowerCase();
		const mult = parseInt(multMatch[2]);
		return (characteristics[char] || 0) * mult;
	}

	// INT+POW, STR+CON, etc.
	const addMatch = str.match(/^(\w+)\s*\+\s*(\w+)$/);
	if(addMatch) {
		const a = addMatch[1].toLowerCase();
		const b = addMatch[2].toLowerCase();
		return (characteristics[a] || 0) + (characteristics[b] || 0);
	}

	return 0;
}

// Build a full skill array from defaults + character overrides.
// Each skill gets: { name, base, value, category, trained }
// `trained` means the character has points invested beyond base.
export function buildSkillList(characterSkills, characteristics) {
	const overrides = new Map();
	for (const s of (characterSkills || [])) {
		overrides.set(s.name, s);
	}

	const result = [];
	for (const def of DEFAULT_SKILLS) {
		const baseVal = resolveBase(def.base, characteristics);
		const override = overrides.get(def.name);
		if(override) {
			result.push({
				name     : def.name,
				base     : baseVal,
				value    : override.value ?? baseVal,
				category : def.category,
				trained  : true,
				specialty: override.specialty || ''
			});
			overrides.delete(def.name);
		} else {
			result.push({
				name     : def.name,
				base     : baseVal,
				value    : baseVal,
				category : def.category,
				trained  : false,
				specialty: ''
			});
		}
	}

	// Custom skills not in the default list
	for (const [, s] of overrides) {
		result.push({
			name     : s.name,
			base     : 0,
			value    : s.value ?? 0,
			category : s.category || '',
			trained  : true,
			specialty: s.specialty || ''
		});
	}

	return result;
}

// Return only trained skills (for stat block view)
export function getTrainedSkills(characterSkills, characteristics) {
	return buildSkillList(characterSkills, characteristics).filter((s)=>s.trained);
}

export const SKILL_CATEGORY_ORDER = ['Combat', 'Communication', 'Manipulation', 'Mental', 'Perception', 'Physical'];
