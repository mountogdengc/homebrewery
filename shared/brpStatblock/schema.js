// ── BRP Statblock Schema ──────────────────────────────────────────────

export function createEmptyBrpStatblock() {
	return {
		// Identity
		name     : '',
		category : 'Human',
		subtype  : '',
		description : '',
		source   : '',
		tags     : [],

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

		// Skills: array of { name, value, category }
		skills : [],

		// Weapons: array of { name, skill, damage, range, rate, parry, hp }
		weapons : [],

		// Spells / Powers
		spells : [],

		// Special abilities / traits
		traits : [],

		// Hit locations (optional): array of { name, hpOverride, armorOverride }
		hitLocations : [],

		// Notes
		notes : ''
	};
}
