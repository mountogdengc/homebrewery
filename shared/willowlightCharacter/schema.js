// ── Willowlight Engine Character Sheet Schema ────────────────────────

export function createEmptyWillowlightCharacter() {
	return {
		// Identity
		name             : '',
		player           : '',
		conviction       : '',
		path             : '',
		shortDescription : '',
		description      : '',
		source           : '',
		tags             : [],

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
		vocation  : { name: '', bonus: 0 },
		interests : [],  // { name, bonus: 2 }
		hobbies   : [],  // { name, bonus: 1 }

		// Health track overrides
		vitalityOverride  : null,
		willpowerOverride : null,
		composureOverride : null,

		// Attacks
		attacks : [],

		// Edges, Aspects, Burdens
		edges   : [],
		aspects : [],
		burdens : [],

		// ── Character-only fields ─────────────────────────────────

		// Luck
		luckRating : 3,
		luckTokens : 3,

		// Corruption (max 10)
		corruption : 0,

		// XP & Wealth
		unspentXP    : 0,
		wealthPoints : 0,

		// Milestones
		convictionMilestones : [
			{ text: '', completed: false },
			{ text: '', completed: false },
			{ text: '', completed: false },
			{ text: '', completed: false }
		],
		pathMilestones : [
			{ text: '', completed: false },
			{ text: '', completed: false },
			{ text: '', completed: false },
			{ text: '', completed: false }
		],

		// Contacts / Enemies / Allies
		contacts : [],  // { name, health (1-5), type, note }

		// Secrets
		secrets : [],  // { name, weight (1-3), spread: [false,false,false], containmentPlan, contacts }

		// Notes
		notes : ''
	};
}
