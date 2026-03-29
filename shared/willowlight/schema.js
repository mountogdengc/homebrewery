// ── Willowlight Engine Unified Character Schema ──────────────────────
// Every Willowlight entity (PC, NPC, creature) uses this schema.
// Leave fields blank for anything that doesn't apply.

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

		// Demographics
		age    : '',
		gender : '',
		height : '',
		weight : '',

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
		vocation    : { name: '', bonus: 0 },
		domainFocus : '',
		interests   : [],  // { name, bonus: 2 }
		hobbies     : [],  // { name, bonus: 1 }

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

		// Luck
		luckRating : 3,
		luckTokens : 3,

		// Corruption (max 10)
		corruption    : 0,
		hearthTrigger : '',

		// XP & Wealth
		unspentXP    : 0,
		totalXP      : 0,
		xpSpent      : 0,
		sessionXP    : 0,
		wealthPoints : 0,
		lifestyle    : 0,
		downtime     : '',

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
		contacts : [],  // { name, health (1-5), type, rating (1-5), relationship, note }

		// Afflictions
		afflictions : {
			terrified    : false,
			discredited  : false,
			stunned      : false,
			prone        : false,
			blinded      : false,
			disoriented  : false,
			restrained   : false,
			slowed       : false,
			disarmed     : false,
			dying        : false,
			other        : ''
		},

		// Equipment
		equipment : [],  // { name }

		// Secrets
		secrets : [],  // { name, weight (1-3), spread: [false,false,false], containmentPlan, contacts }

		// Notes
		notes : ''
	};
}
