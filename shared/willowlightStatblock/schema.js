// ── Willowlight Engine Statblock Schema ───────────────────────────────

export function createEmptyWillowlightStatblock() {
	return {
		// Identity
		name       : '',
		path       : '',
		conviction : '',
		shortDescription : '',
		description      : '',
		source           : '',
		tags       : [],

		// Attributes (0–5 dots each)
		attributes : {
			might     : 0,
			reflex    : 0,
			endurance : 0,
			reason    : 0,
			guile     : 0,
			resolve   : 0,
			influence : 0,
			poise     : 0,
			command   : 0
		},

		// Scale
		scale : {
			physical : '',
			mental   : '',
			social   : ''
		},

		// Skills
		vocation       : { name: '', bonus: 0 },
		interests      : [],  // { name, bonus: 2 }
		hobbies        : [],  // { name, bonus: 1 }

		// Health track overrides (null = use derived)
		vitalityOverride  : null,
		willpowerOverride : null,
		composureOverride : null,

		// Attacks: { name, domain (P/M/S), attribute, skill, modifier, rating }
		attacks : [],

		// Edges: { name, dots (1-5) }
		edges : [],

		// Aspects: { name, dots (1-5) }
		aspects : [],

		// Burdens: { name, dots (1-5) }
		burdens : [],

		// Notes
		notes : ''
	};
}
