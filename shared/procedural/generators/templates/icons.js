/**
 * Adventure Icon Templates
 * 10 themed adventure icons for quests, campaigns, and plot hooks
 */

export const ICON_TEMPLATES = {
	dragon_slaying: {
		name: 'Dragon Slaying',
		description: 'Epic dragon hunt - face the ultimate wyrm threat',
		theme: 'dragon_slaying',
		color: '#C41E3A',
		accentColor: '#FFD700',
		effectIntensity: 0.5,
		size: 512
	},

	treasure_hunt: {
		name: 'Treasure Hunt',
		description: 'Seek wealth and riches - a quest for fortune',
		theme: 'treasure_hunt',
		color: '#DAA520',
		accentColor: '#FFD700',
		effectIntensity: 0.4,
		size: 512
	},

	monster_hunting: {
		name: 'Monster Hunting',
		description: 'Bounty quest - eliminate the beast',
		theme: 'monster_hunting',
		color: '#8B0000',
		accentColor: '#C41E3A',
		effectIntensity: 0.5,
		size: 512
	},

	dungeon_delving: {
		name: 'Dungeon Delving',
		description: 'Explore dark depths - deadly dungeons await',
		theme: 'dungeon_delving',
		color: '#1a1a1a',
		accentColor: '#FFD700',
		effectIntensity: 0.6,
		size: 512
	},

	planar_travel: {
		name: 'Planar Travel',
		description: 'Interdimensional adventure - breach other realms',
		theme: 'planar_travel',
		color: '#4B0082',
		accentColor: '#9370DB',
		effectIntensity: 0.5,
		size: 512
	},

	heist_stealth: {
		name: 'Heist & Stealth',
		description: 'Sneaky mission - infiltrate and escape',
		theme: 'heist_stealth',
		color: '#1a1a1a',
		accentColor: '#FFD700',
		effectIntensity: 0.4,
		size: 512
	},

	mystery_investigation: {
		name: 'Mystery Investigation',
		description: 'Uncover secrets - solve the puzzle',
		theme: 'mystery_investigation',
		color: '#8B4513',
		accentColor: '#D4AF37',
		effectIntensity: 0.4,
		size: 512
	},

	dark_quest: {
		name: 'Dark Quest',
		description: 'Ominous threat - embrace the darkness',
		theme: 'dark_quest',
		color: '#2a2a2a',
		accentColor: '#8B0000',
		effectIntensity: 0.6,
		size: 512
	},

	magic_arcana: {
		name: 'Magic & Arcana',
		description: 'Magical adventure - harness arcane forces',
		theme: 'magic_arcana',
		color: '#4B0082',
		accentColor: '#DAA520',
		effectIntensity: 0.5,
		size: 512
	},

	undead_necromancy: {
		name: 'Undead & Necromancy',
		description: 'Undead threat - confront the risen dead',
		theme: 'undead_necromancy',
		color: '#1a1a1a',
		accentColor: '#AAAAAA',
		effectIntensity: 0.5,
		size: 512
	}
};

/**
 * Get all available icon template names
 */
export function getIconTemplateNames() {
	return Object.keys(ICON_TEMPLATES);
}

/**
 * Get icon template by name
 */
export function getIconTemplate(name) {
	return ICON_TEMPLATES[name];
}
