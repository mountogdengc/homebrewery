// statblock/constants.js — lookup tables and static data for 5e 2024 stat blocks
// Isomorphic: used by both client (preview) and server (embed API)

export const SYSTEMS = {
	'5e2024' : { name: 'D&D 5e (2024)', id: '5e2024' },
};

export const DEFAULT_SYSTEM = '5e2024';

export const CR_LIST = [
	'0', '1/8', '1/4', '1/2',
	'1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
	'11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
	'21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
];

export const CR_XP = {
	'0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
	'1': 200, '2': 450, '3': 700, '4': 1100,
	'5': 1800, '6': 2300, '7': 2900, '8': 3900,
	'9': 5000, '10': 5900, '11': 7200, '12': 8400,
	'13': 10000, '14': 11500, '15': 13000, '16': 15000,
	'17': 18000, '18': 20000, '19': 22000, '20': 25000,
	'21': 33000, '22': 41000, '23': 50000, '24': 62000,
	'25': 75000, '26': 90000, '27': 105000, '28': 120000,
	'29': 135000, '30': 155000
};

export const CR_PB = {
	'0': 2, '1/8': 2, '1/4': 2, '1/2': 2,
	'1': 2, '2': 2, '3': 2, '4': 2,
	'5': 3, '6': 3, '7': 3, '8': 3,
	'9': 4, '10': 4, '11': 4, '12': 4,
	'13': 5, '14': 5, '15': 5, '16': 5,
	'17': 6, '18': 6, '19': 6, '20': 6,
	'21': 7, '22': 7, '23': 7, '24': 7,
	'25': 8, '26': 8, '27': 8, '28': 8,
	'29': 9, '30': 9
};

export const CR_DISPLAY = {
	'1/8': '⅛', '1/4': '¼', '1/2': '½'
};

export const SKILLS = [
	{ key: 'acrobatics',     name: 'Acrobatics',      ability: 'dex' },
	{ key: 'animalHandling', name: 'Animal Handling',  ability: 'wis' },
	{ key: 'arcana',         name: 'Arcana',           ability: 'int' },
	{ key: 'athletics',      name: 'Athletics',        ability: 'str' },
	{ key: 'deception',      name: 'Deception',        ability: 'cha' },
	{ key: 'history',        name: 'History',           ability: 'int' },
	{ key: 'insight',        name: 'Insight',           ability: 'wis' },
	{ key: 'intimidation',   name: 'Intimidation',      ability: 'cha' },
	{ key: 'investigation',  name: 'Investigation',     ability: 'int' },
	{ key: 'medicine',       name: 'Medicine',          ability: 'wis' },
	{ key: 'nature',         name: 'Nature',            ability: 'int' },
	{ key: 'perception',     name: 'Perception',        ability: 'wis' },
	{ key: 'performance',    name: 'Performance',       ability: 'cha' },
	{ key: 'persuasion',     name: 'Persuasion',        ability: 'cha' },
	{ key: 'religion',       name: 'Religion',          ability: 'int' },
	{ key: 'sleightOfHand',  name: 'Sleight of Hand',   ability: 'dex' },
	{ key: 'stealth',        name: 'Stealth',           ability: 'dex' },
	{ key: 'survival',       name: 'Survival',          ability: 'wis' }
];

export const CREATURE_TYPES = [
	'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon',
	'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid',
	'Monstrosity', 'Ooze', 'Plant', 'Undead'
];

export const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

export const ALIGNMENTS = [
	'Lawful Good', 'Neutral Good', 'Chaotic Good',
	'Lawful Neutral', 'Neutral', 'Chaotic Neutral',
	'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
	'Unaligned', 'Any Alignment', 'Any Non-Good Alignment',
	'Any Non-Lawful Alignment', 'Any Chaotic Alignment', 'Any Evil Alignment'
];

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const ABILITY_LABELS = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

export const USAGE_OPTIONS = [
	'', '1/Day', '2/Day', '3/Day',
	'Recharge 5–6', 'Recharge 4–6', 'Recharge 3–6',
	'Recharge after a Short or Long Rest'
];

export function getXP(cr)      { return CR_XP[cr] ?? 0; }
export function getPB(cr)      { return CR_PB[cr] ?? 2; }
export function abilityMod(score) { return Math.floor((score - 10) / 2); }
export function fmtMod(n)      { return n >= 0 ? `+${n}` : `${n}`; }
export function fmtXP(n)       { return n.toLocaleString(); }
export function displayCR(cr)  { return CR_DISPLAY[cr] || cr; }
