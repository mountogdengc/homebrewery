// statblock/schema.js — canonical stat block data model
// Isomorphic: used by both client and server

import { DEFAULT_SYSTEM } from './constants.js';

export function createEmptyStatblock() {
	return {
		system  : DEFAULT_SYSTEM,

		// Identity
		name      : '',
		size      : 'Medium',
		type      : 'Humanoid',
		subtype   : '',
		alignment : 'True Neutral',
		isHomebrew: false,
		source    : '',
		tags      : [],
		habitat   : '',
		treasure  : '',

		// Combat stats
		ac                 : { value: 10, description: '' },
		hp                 : { average: 0, formula: '' },
		initiativeOverride : null,
		speed              : { walk: 30, fly: 0, swim: 0, burrow: 0, climb: 0, hover: false },

		// Ability scores
		abilities : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },

		// Saving throws
		savingThrows : {
			str : { proficient: false, override: null },
			dex : { proficient: false, override: null },
			con : { proficient: false, override: null },
			int : { proficient: false, override: null },
			wis : { proficient: false, override: null },
			cha : { proficient: false, override: null }
		},

		// Skills
		skills : {
			acrobatics     : { proficient: false, expertise: false, override: null },
			animalHandling : { proficient: false, expertise: false, override: null },
			arcana         : { proficient: false, expertise: false, override: null },
			athletics      : { proficient: false, expertise: false, override: null },
			deception      : { proficient: false, expertise: false, override: null },
			history        : { proficient: false, expertise: false, override: null },
			insight        : { proficient: false, expertise: false, override: null },
			intimidation   : { proficient: false, expertise: false, override: null },
			investigation  : { proficient: false, expertise: false, override: null },
			medicine       : { proficient: false, expertise: false, override: null },
			nature         : { proficient: false, expertise: false, override: null },
			perception     : { proficient: false, expertise: false, override: null },
			performance    : { proficient: false, expertise: false, override: null },
			persuasion     : { proficient: false, expertise: false, override: null },
			religion       : { proficient: false, expertise: false, override: null },
			sleightOfHand  : { proficient: false, expertise: false, override: null },
			stealth        : { proficient: false, expertise: false, override: null },
			survival       : { proficient: false, expertise: false, override: null }
		},

		cr : '1',

		// Defenses / senses
		gear                  : '',
		damageVulnerabilities : '',
		damageResistances     : '',
		damageImmunities      : '',
		conditionImmunities   : '',
		senses                : '',
		languages             : '—',

		// Action blocks — each item: { name, description, usage }
		traits       : [],
		actions      : [],
		bonusActions : [],
		reactions    : [],

		// Legendary actions
		legendary : {
			count    : 3,
			preamble : '',
			actions  : []
		},

		// Mythic actions
		mythic : {
			enabled  : false,
			preamble : '',
			actions  : []
		},

		// Lair actions
		lair : {
			enabled  : false,
			preamble : '',
			actions  : []
		}
	};
}

export function createEmptyAction() {
	return { name: '', description: '', usage: '' };
}

export function createEmptyLegendaryAction() {
	return { name: '', description: '', cost: 1, usage: '' };
}
