/**
 * Heraldry Templates
 * Classic heraldic shield designs with traditional colors, divisions, and charges
 */

export const HERALDRY_TEMPLATES = {
	noble_house: {
		name: 'Noble House',
		description: 'Traditional quartered shield with heraldic lions',
		shieldShape: 'heater',
		divisions: 'quartered',
		charges: ['lion', 'lion', 'lion', 'lion'],
		baseColors: ['#FF0000', '#0000FF', '#FFFF00', '#FFFFFF'],
		metals: ['gold', 'silver'],
		effectIntensity: 0.8
	},

	royal_crest: {
		name: 'Royal Crest',
		description: 'Regal shield with crosses and crowned lions',
		shieldShape: 'heater',
		divisions: 'simple',
		baseColor: '#800080',
		charges: ['cross', 'lion', 'crown'],
		pattern: 'ermine',
		effectIntensity: 0.9
	},

	merchant_guild: {
		name: 'Merchant Guild',
		description: 'Commercial heraldry with trading symbols',
		shieldShape: 'pointed',
		divisions: 'fess',
		baseColors: ['#C0C000', '#FFFFFF'],
		charges: ['coin', 'shield', 'key'],
		pattern: 'roundels',
		effectIntensity: 0.7
	},

	warrior_badge: {
		name: 'Warrior Badge',
		description: 'Martial shield with weapons and defenses',
		shieldShape: 'kite',
		divisions: 'pale',
		baseColors: ['#808080', '#FF0000'],
		charges: ['sword', 'shield', 'helmet'],
		pattern: 'diagonal',
		effectIntensity: 0.8
	},

	mystical_order: {
		name: 'Mystical Order',
		description: 'Arcane heraldry with magical symbols',
		shieldShape: 'heater',
		divisions: 'bend',
		baseColors: ['#1a0033', '#FFFF00'],
		charges: ['star', 'moon', 'arcane_symbol'],
		pattern: 'stars',
		effectIntensity: 0.95
	},

	dragon_slayer: {
		name: 'Dragon Slayer',
		description: "Legendary hero's sigil with dragon imagery",
		shieldShape: 'heater',
		divisions: 'simple',
		baseColor: '#333333',
		charges: ['dragon', 'sword', 'flame'],
		accentColor: '#FF4500',
		effectIntensity: 1.0
	},

	forest_realm: {
		name: 'Forest Realm',
		description: 'Natural heraldry with woodland creatures',
		shieldShape: 'pointed',
		divisions: 'quartered',
		baseColors: ['#228B22', '#8B4513', '#228B22', '#228B22'],
		charges: ['stag', 'eagle', 'oak_leaf', 'wolf'],
		pattern: 'vair',
		effectIntensity: 0.7
	},

	sea_captain: {
		name: 'Sea Captain',
		description: 'Maritime heraldry with nautical elements',
		shieldShape: 'rounded',
		divisions: 'simple',
		baseColor: '#000080',
		charges: ['anchor', 'ship', 'wave', 'star'],
		pattern: 'roundels',
		accentColor: '#FFD700',
		effectIntensity: 0.8
	},

	holy_order: {
		name: 'Holy Order',
		description: 'Religious heraldry with sacred symbols',
		shieldShape: 'heater',
		divisions: 'cross',
		baseColor: '#FFFFFF',
		charges: ['cross', 'dove', 'halo'],
		accentColor: '#FFD700',
		pattern: 'fleur_de_lis',
		effectIntensity: 0.9
	},

	shadow_guild: {
		name: 'Shadow Guild',
		description: 'Rogue organization with concealed symbolism',
		shieldShape: 'kite',
		divisions: 'simple',
		baseColor: '#1a1a1a',
		charges: ['dagger', 'mask', 'shadow'],
		accentColor: '#C0C000',
		pattern: 'diagonal',
		effectIntensity: 0.75
	}
};
