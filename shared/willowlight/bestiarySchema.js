// ── Willowlight Engine Bestiary Schema ─────────────────────────────────
// Enemies/creatures for the playtest tool and books.
// Tier determines which fields are relevant.

export const ENEMY_TIERS = ['mook', 'elite', 'boss', 'legend'];

export const TIER_LABELS = {
	mook   : 'Mook',
	elite  : 'Elite',
	boss   : 'Boss',
	legend : 'Legend'
};

// Which health tracks each tier gets
export const TIER_TRACKS = {
	mook   : [],                                    // mooks use threshold + group size
	elite  : ['composure'],                         // one track (pick in form)
	boss   : ['willpower', 'vitality', 'composure'],
	legend : ['willpower', 'vitality', 'composure']
};

export function createEmptyEnemy() {
	return {
		// Identity
		name        : '',
		subtitle    : '',
		tier        : 'mook',
		tags        : [],
		source      : '',

		// TNs per domain
		atkTN : { mental: 8, physical: 8, social: 8 },
		defTN : { mental: 8, physical: 8, social: 8 },

		// Scale
		scale : { mental: 0, physical: 0, social: 0 },

		// Mook-specific
		threshold : 2,
		size      : 3,

		// Health tracks (elite/boss/legend) — max boxes per track
		health : {
			willpower : 0,
			vitality  : 0,
			composure : 0
		},

		// Traits — mooks get a single trait string, others get named array
		trait  : '',   // mook single trait
		traits : [],   // { name, desc } for elite/boss/legend

		// Behavior
		goal  : '',
		notes : ''
	};
}
