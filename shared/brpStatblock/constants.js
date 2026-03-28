// ── BRP (Basic Roleplaying) Constants ──────────────────────────────────

export const CHARACTERISTICS = ['str', 'con', 'siz', 'int', 'pow', 'dex', 'cha'];

export const CHAR_LABELS = {
	str : 'STR',
	con : 'CON',
	siz : 'SIZ',
	int : 'INT',
	pow : 'POW',
	dex : 'DEX',
	cha : 'CHA'
};

export const CREATURE_CATEGORIES = [
	'Human', 'Animal', 'Construct', 'Demon', 'Dragon', 'Elemental',
	'Faerie', 'Giant', 'Monster', 'Spirit', 'Undead', 'Other'
];

// Standard BRP skill categories
export const SKILL_CATEGORIES = [
	'Combat', 'Communication', 'Manipulation', 'Mental', 'Perception', 'Physical'
];

// Damage bonus table based on STR + SIZ
export const DAMAGE_BONUS_TABLE = [
	{ max: 12,  db: '-1d6' },
	{ max: 16,  db: '-1d4' },
	{ max: 24,  db: '0' },
	{ max: 32,  db: '+1d4' },
	{ max: 40,  db: '+1d6' },
	{ max: 56,  db: '+2d6' },
	{ max: 72,  db: '+3d6' },
	{ max: 88,  db: '+4d6' },
	{ max: 104, db: '+5d6' },
	{ max: 120, db: '+6d6' }
];

export const HIT_LOCATION_NAMES = [
	'Right Leg', 'Left Leg', 'Abdomen', 'Chest', 'Right Arm', 'Left Arm', 'Head'
];

// ── Helper functions ──────────────────────────────────────────────────

export function getDamageBonus(str, siz) {
	const total = (str || 0) + (siz || 0);
	for (const entry of DAMAGE_BONUS_TABLE) {
		if(total <= entry.max) return entry.db;
	}
	// Beyond table: +1d6 per 16 above 120
	const extra = Math.ceil((total - 104) / 16);
	return `+${extra}d6`;
}

export function getHitPoints(con, siz) {
	return Math.ceil(((con || 0) + (siz || 0)) / 2);
}

export function getMagicPoints(pow) {
	return pow || 0;
}

export function getMoveRate(category) {
	if(category === 'Human') return 8;
	return 8; // default; can be overridden
}

export function getSpiritDamage(pow, cha) {
	const total = (pow || 0) + (cha || 0);
	for (const entry of DAMAGE_BONUS_TABLE) {
		if(total <= entry.max) return entry.db;
	}
	const extra = Math.ceil((total - 104) / 16);
	return `+${extra}d6`;
}
