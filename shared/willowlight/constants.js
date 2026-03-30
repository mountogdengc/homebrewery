// ── Willowlight Engine Constants ──────────────────────────────────────

export const ATTRIBUTE_GROUPS = {
	mental   : { label: 'Mental',   attrs: ['reason', 'guile', 'resolve'] },
	physical : { label: 'Physical', attrs: ['might', 'reflex', 'endurance'] },
	social   : { label: 'Social',   attrs: ['influence', 'poise', 'command'] }
};

export const ATTRIBUTE_LABELS = {
	might     : 'Might',
	reflex    : 'Reflex',
	endurance : 'Endurance',
	reason    : 'Reason',
	guile     : 'Guile',
	resolve   : 'Resolve',
	influence : 'Influence',
	poise     : 'Poise',
	command   : 'Command'
};

export const ALL_ATTRIBUTES = [
	'reason', 'guile', 'resolve',
	'might', 'reflex', 'endurance',
	'influence', 'poise', 'command'
];

export const ATTACK_DOMAINS = ['P', 'M', 'S']; // Physical, Mental, Social

export const DOMAIN_LABELS = {
	P : 'Physical',
	M : 'Mental',
	S : 'Social'
};

export const SKILL_TIERS = [
	{ key: 'vocation',  label: 'Vocation',  bonus: null },
	{ key: 'interests', label: 'Interests', bonus: 2 },
	{ key: 'hobbies',   label: 'Hobbies',   bonus: 1 }
];

// Health track definitions
export const HEALTH_TRACKS = [
	{ key: 'willpower', label: 'Willpower', baseAttr: 'resolve',   base: 3 },
	{ key: 'vitality',  label: 'Vitality',  baseAttr: 'endurance', base: 3 },
	{ key: 'composure', label: 'Composure', baseAttr: 'command',   base: 3 }
];

// ── Helper functions ──────────────────────────────────────────────────

export function getTrackBoxes(base, attrValue) {
	return base + (attrValue || 0);
}

export function getDefTN(attrValue) {
	return 8 + (attrValue || 0);
}
