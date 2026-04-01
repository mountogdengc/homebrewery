/**
 * Wax Seal Templates
 * Each template defines defaults that can be customized by the user
 */

export const SEAL_TEMPLATES = {
	simple_wax: {
		name: 'Simple Wax',
		description: 'A clean, minimalist seal with subtle rings and texture',
		complexity: 0.3,
		patternType: 'rings',
		ringCount: 2,
		effectIntensity: 0.4,
		color: '#C41E3A',
		accentColor: '#8B0000',
		waxDrips: 0.3,
		cracks: 0.1,
		emboss: true,
		size: 512
	},

	celtic_wax: {
		name: 'Celtic Knot',
		description: 'Intricate Celtic knotwork with Celtic patterns',
		complexity: 0.8,
		patternType: 'celtic_knot',
		ringCount: 3,
		effectIntensity: 0.7,
		color: '#8B4513',
		accentColor: '#D4AF37',
		waxDrips: 0.4,
		cracks: 0.2,
		emboss: true,
		size: 512
	},

	gothic_seal: {
		name: 'Gothic Seal',
		description: 'Dark gothic design with ornate details',
		complexity: 0.9,
		patternType: 'gothic',
		ringCount: 4,
		effectIntensity: 0.8,
		color: '#1a1a1a',
		accentColor: '#FFD700',
		waxDrips: 0.5,
		cracks: 0.3,
		emboss: true,
		size: 512
	},

	heraldic_seal: {
		name: 'Heraldic',
		description: 'Classic heraldic design with shields and symbols',
		complexity: 0.7,
		patternType: 'heraldic_shield',
		ringCount: 2,
		effectIntensity: 0.6,
		color: '#8B0000',
		accentColor: '#FFD700',
		waxDrips: 0.2,
		cracks: 0.15,
		emboss: true,
		size: 512
	},

	mystical_seal: {
		name: 'Mystical',
		description: 'Arcane symbols and mystical patterns',
		complexity: 0.85,
		patternType: 'mystical',
		ringCount: 3,
		effectIntensity: 0.75,
		color: '#4B0082',
		accentColor: '#9370DB',
		waxDrips: 0.35,
		cracks: 0.25,
		emboss: true,
		size: 512
	},

	aged_parchment: {
		name: 'Aged Parchment',
		description: 'Weathered, aged appearance with worn edges',
		complexity: 0.5,
		patternType: 'simple_symbol',
		ringCount: 1,
		effectIntensity: 0.5,
		color: '#8B7355',
		accentColor: '#A0826D',
		waxDrips: 0.1,
		cracks: 0.6,
		emboss: false,
		size: 512
	},

	royal_seal: {
		name: 'Royal Seal',
		description: 'Regal gold seal with prominent design',
		complexity: 0.75,
		patternType: 'royal_crown',
		ringCount: 3,
		effectIntensity: 0.8,
		color: '#DAA520',
		accentColor: '#FFD700',
		waxDrips: 0.3,
		cracks: 0.05,
		emboss: true,
		size: 512
	},

	merchant_seal: {
		name: 'Merchant',
		description: 'Professional merchant guild seal',
		complexity: 0.6,
		patternType: 'guild_mark',
		ringCount: 2,
		effectIntensity: 0.5,
		color: '#8B4513',
		accentColor: '#D2691E',
		waxDrips: 0.25,
		cracks: 0.15,
		emboss: true,
		size: 512
	},

	adventurer_seal: {
		name: 'Adventurer',
		description: 'Rugged seal for adventuring parties',
		complexity: 0.65,
		patternType: 'sword_star',
		ringCount: 2,
		effectIntensity: 0.6,
		color: '#C41E3A',
		accentColor: '#FFD700',
		waxDrips: 0.4,
		cracks: 0.35,
		emboss: true,
		size: 512
	}
};

/**
 * Get all available seal template names
 */
export function getSealTemplateNames() {
	return Object.keys(SEAL_TEMPLATES);
}

/**
 * Get seal template by name
 */
export function getSealTemplate(name) {
	return SEAL_TEMPLATES[name];
}
