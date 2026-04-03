// ── Palladium Megaversal Constants ─────────────────────────────────────

export const ATTRIBUTES = ['iq', 'me', 'ma', 'ps', 'pp', 'pe', 'pb', 'spd'];

export const ATTR_LABELS = {
	iq  : 'IQ',
	me  : 'ME',
	ma  : 'MA',
	ps  : 'PS',
	pp  : 'PP',
	pe  : 'PE',
	pb  : 'PB',
	spd : 'SPD'
};

export const ATTR_NAMES = {
	iq  : 'Intelligence Quotient',
	me  : 'Mental Endurance',
	ma  : 'Mental Affinity',
	ps  : 'Physical Strength',
	pp  : 'Physical Prowess',
	pe  : 'Physical Endurance',
	pb  : 'Physical Beauty',
	spd : 'Speed'
};

// ── Alignments ───────────────────────────────────────────────────────
export const ALIGNMENTS = [
	'Principled', 'Scrupulous',                              // Good
	'Unprincipled', 'Anarchist',                             // Selfish
	'Miscreant', 'Aberrant', 'Diabolic'                      // Evil
];

export const ALIGNMENT_GROUPS = {
	'Good'    : ['Principled', 'Scrupulous'],
	'Selfish' : ['Unprincipled', 'Anarchist'],
	'Evil'    : ['Miscreant', 'Aberrant', 'Diabolic']
};

// ── Category per game ────────────────────────────────────────────────
export const CATEGORIES = {
	'Rifts'            : ['NPC', 'Creature', 'D-Bee', 'Robot/Vehicle', 'Power Armor', 'Dragon', 'Demon/Deevil', 'Entity', 'Other'],
	'Palladium Fantasy': ['NPC', 'Creature', 'Monster', 'Undead', 'Demon/Deevil', 'Dragon', 'Fairy Folk', 'Elemental', 'Other'],
	'TMNT'             : ['NPC', 'Mutant Animal', 'Creature', 'Robot', 'Other']
};

// ── OCC Type per game ────────────────────────────────────────────────
export const OCC_TYPES = {
	'Rifts'            : ['OCC', 'RCC'],
	'Palladium Fantasy': ['OCC', 'PCC'],
	'TMNT'             : ['OCC', 'MOS']
};

// ── Skill categories (shared across all Palladium games) ─────────────
export const SKILL_CATEGORIES = [
	'Communications', 'Domestic', 'Electrical', 'Espionage',
	'Mechanical', 'Medical', 'Military', 'Physical',
	'Pilot', 'Pilot Related', 'Rogue', 'Science',
	'Technical', 'Weapon Proficiencies', 'Wilderness'
];

// ── Palladium Fantasy specific skill categories ──────────────────────
export const FANTASY_SKILL_CATEGORIES = [
	'Communications', 'Domestic', 'Espionage', 'Horsemanship',
	'Medical', 'Military', 'Physical', 'Rogue',
	'Science', 'Scholar/Technical', 'Weapon Proficiencies',
	'Wilderness'
];

// ── Magic spell levels ───────────────────────────────────────────────
export const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// ── Psionic categories ───────────────────────────────────────────────
export const PSIONIC_CATEGORIES = ['Healing', 'Physical', 'Sensitive', 'Super'];

// ── TMNT: Animal types ───────────────────────────────────────────────
export const TMNT_ANIMAL_TYPES = [
	'Alligator/Crocodile', 'Bat', 'Bear', 'Bull/Cow', 'Cat (Domestic)',
	'Cat (Wild)', 'Chameleon', 'Chicken/Rooster', 'Chimpanzee',
	'Coyote', 'Crow/Raven', 'Deer', 'Dog', 'Dolphin', 'Eagle/Hawk',
	'Elephant', 'Fox', 'Frog/Toad', 'Gorilla', 'Horse', 'Iguana',
	'Kangaroo', 'Lion', 'Lizard', 'Monkey', 'Mouse', 'Octopus',
	'Owl', 'Parrot', 'Pig', 'Rabbit', 'Raccoon', 'Rat', 'Rhinoceros',
	'Scorpion', 'Shark', 'Snake', 'Spider', 'Squirrel', 'Tiger',
	'Turtle/Tortoise', 'Vulture', 'Weasel/Ferret', 'Wolf', 'Wolverine'
];

// ── TMNT: Mutation categories ────────────────────────────────────────
export const TMNT_MUTATION_CATEGORIES = [
	'Human Features', 'Animal Powers', 'Hands', 'Biped',
	'Speech', 'Looks', 'Body Type', 'Size'
];

// ── TMNT: Animal sizes ───────────────────────────────────────────────
export const TMNT_ANIMAL_SIZES = [
	'Tiny', 'Small', 'Medium', 'Large', 'Very Large', 'Huge'
];

// ── Rifts: MDC creature types ────────────────────────────────────────
export const MDC_CATEGORIES = ['D-Bee', 'Robot/Vehicle', 'Power Armor', 'Dragon', 'Demon/Deevil', 'Entity'];

// ── Derived value helpers ────────────────────────────────────────────

/** PS damage bonus (Megaversal rules) */
export function getPsDamageBonus(ps) {
	if(ps <= 15) return 0;
	if(ps <= 16) return 1;
	if(ps <= 17) return 2;
	if(ps <= 18) return 3;
	if(ps <= 19) return 4;
	if(ps <= 20) return 5;
	if(ps <= 25) return 6 + Math.floor((ps - 21) / 1);
	if(ps <= 30) return 11 + Math.floor((ps - 26) / 1);
	return 16 + Math.floor((ps - 31) / 1);
}

/** Carry weight from PS */
export function getCarryWeight(ps) {
	return (ps || 0) * 10;
}

/** Lift weight from PS */
export function getLiftWeight(ps) {
	return (ps || 0) * 20;
}

/** SPD to mph conversion */
export function getSpdMph(spd) {
	return Math.round(((spd || 0) * 0.6818) * 10) / 10;
}

/** PE save bonus */
export function getPeSaveBonus(pe) {
	if(pe <= 15) return 0;
	if(pe <= 17) return 1;
	if(pe <= 18) return 2;
	if(pe <= 19) return 3;
	if(pe <= 20) return 4;
	return 4 + Math.floor((pe - 20) / 2);
}

/** MA trust/intimidate percentage */
export function getMaTrust(ma) {
	if(ma <= 15) return 0;
	if(ma == 16) return 40;
	if(ma == 17) return 45;
	if(ma == 18) return 50;
	if(ma == 19) return 55;
	if(ma == 20) return 60;
	if(ma == 21) return 65;
	if(ma == 22) return 70;
	if(ma == 23) return 75;
	if(ma == 24) return 80;
	return 84 + (ma - 24) * 2;
}

/** PB charm/impress percentage */
export function getPbCharm(pb) {
	if(pb <= 15) return 0;
	if(pb == 16) return 30;
	if(pb == 17) return 35;
	if(pb == 18) return 40;
	if(pb == 19) return 45;
	if(pb == 20) return 50;
	if(pb == 21) return 55;
	if(pb == 22) return 60;
	if(pb == 23) return 65;
	if(pb == 24) return 70;
	return 74 + (pb - 24) * 2;
}

/** IQ perception/skill bonus */
export function getIqBonus(iq) {
	if(iq <= 15) return 0;
	if(iq <= 17) return 1;
	if(iq <= 19) return 2;
	if(iq <= 21) return 3;
	if(iq <= 23) return 4;
	return 4 + Math.floor((iq - 23) / 2);
}

/** PP strike/parry/dodge bonus */
export function getPpBonus(pp) {
	if(pp <= 15) return 0;
	if(pp <= 17) return 1;
	if(pp <= 18) return 2;
	if(pp <= 19) return 3;
	if(pp <= 20) return 4;
	if(pp <= 22) return 5;
	if(pp <= 24) return 6;
	return 6 + Math.floor((pp - 24) / 2);
}

/** Determine if game uses MDC */
export function usesMDC(game, category) {
	if(game !== 'Rifts') return false;
	return MDC_CATEGORIES.includes(category) || category === 'Other';
}
