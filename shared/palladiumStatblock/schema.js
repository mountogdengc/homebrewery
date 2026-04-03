// ── Palladium Megaversal Statblock Schema ─────────────────────────────
// Supports: Rifts, Palladium Fantasy RPG, TMNT & Other Strangeness

export const PALLADIUM_GAMES = ['Rifts', 'Palladium Fantasy', 'TMNT'];

export function createEmptyPalladiumStatblock() {
	return {
		// Identity
		name        : '',
		game        : 'Rifts',          // which Palladium game
		category    : 'NPC',            // NPC, Creature, Robot/Vehicle, etc.
		occ         : '',               // OCC / RCC / PCC / MOS
		occType     : 'OCC',            // OCC, RCC, PCC
		level       : 1,
		alignment   : '',
		race        : '',
		description : '',
		source      : '',
		tags        : [],

		// Core Attributes (Megaversal 8)
		attributes : {
			iq  : 10,
			me  : 10,
			ma  : 10,
			ps  : 10,
			pp  : 10,
			pe  : 10,
			pb  : 10,
			spd : 10
		},

		// Structural / Durability
		hp           : 0,               // Hit Points
		hpOverride   : null,
		sdc          : 0,               // SDC
		sdcOverride  : null,
		mdc          : 0,               // MDC (Rifts only)
		mdcOverride  : null,
		ar           : 0,               // Natural Armor Rating
		ppeMagic     : 0,               // PPE (magic)
		isp          : 0,               // ISP (psionics)

		// Combat
		combat : {
			attacks       : 0,           // Attacks / Actions per melee
			initiative    : 0,
			strike        : 0,
			parry         : 0,
			dodge         : 0,
			rollWithPunch : 0,
			pull          : 0,
			damage        : '',          // PS damage bonus text
			criticalOn    : 'Natural 20'
		},

		// Movement
		movement : {
			run  : '',
			fly  : '',
			swim : '',
			leap : ''
		},

		// Skills: array of { name, value, category }
		skills : [],

		// Weapons / Equipment: array of { name, damage, range, rof, payload, bonus, notes }
		weapons : [],

		// Armor / Equipment: array of { name, mdc/sdc, ar, notes }
		armor : [],

		// Magic: array of { name, level, ppe, range, duration, description }
		magic : [],

		// Psionics: array of { name, isp, range, duration, description, category }
		psionics : [],

		// Special abilities / traits: array of { name, description }
		abilities : [],

		// TMNT-specific: Animal mutations
		animalType : '',                 // e.g., "Turtle", "Rat", "Cat"
		bioE       : 0,                 // Bio-E points
		mutations  : [],                // array of { name, cost, description }
		animalSize : '',                // Size category

		// Equipment / Gear (general text)
		equipment : '',

		// Notes
		notes : ''
	};
}
