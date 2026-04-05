// ── BRP Character / Statblock Schema ─────────────────────────────────
// Unified schema for both creatures (stat blocks) and player characters.
// Leave character-specific fields blank for creature stat blocks.

export function createEmptyBrpStatblock() {
	return {
		// Identity
		name     : '',
		category : 'Human',
		subtype  : '',
		description : '',
		source   : '',
		tags     : [],

		// Character type: 'creature' or 'character'
		characterType : 'creature',

		// ── Character-specific identity ───────────────────────────────
		player      : '',
		occupation  : '',
		age         : '',
		gender      : '',
		nationality : '',
		appearance  : '',
		background  : '',

		// Characteristics
		characteristics : {
			str : 10,
			con : 10,
			siz : 10,
			int : 10,
			pow : 10,
			dex : 10,
			cha : 10
		},

		// Derived values (overrideable)
		hitPointsOverride    : null,
		magicPointsOverride  : null,
		damageBonusOverride  : null,
		moveRate             : 8,
		armorPoints          : 0,
		armorDescription     : '',

		// ── Sanity (optional, for horror settings) ────────────────────
		sanity    : null,
		sanityMax : null,

		// Skills: array of { name, value, category, specialty, trained }
		// For characters: trained skills stored here, defaults computed from defaultSkills.js
		// For creatures: all listed skills (same as before)
		skills : [],

		// Weapons: array of { name, skill, damage, range, rate, parry, hp }
		weapons : [],

		// Spells / Powers
		spells : [],

		// Special abilities / traits
		traits : [],

		// Hit locations (optional): array of { name, hpOverride, armorOverride }
		hitLocations : [],

		// ── Passions (BRP passions system) ────────────────────────────
		passions : [],  // { name, value, category }

		// ── Allegiances ───────────────────────────────────────────────
		allegiances : [],  // { name, value }

		// ── Equipment ─────────────────────────────────────────────────
		equipment : [],  // { name, quantity, notes }

		// ── Wealth ────────────────────────────────────────────────────
		wealth : '',

		// ── Experience ────────────────────────────────────────────────
		experiencePoints : 0,
		experienceChecks : [],  // skill names with experience checks

		// Notes
		notes : ''
	};
}

// Create a new character (pre-configured for character mode)
export function createEmptyBrpCharacter() {
	const ch = createEmptyBrpStatblock();
	ch.characterType = 'character';
	ch.category = 'Human';
	return ch;
}
