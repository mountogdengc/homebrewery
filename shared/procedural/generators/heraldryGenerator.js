/**
 * Heraldry Generator
 * Creates procedural heraldic shields with traditional charges, divisions, and patterns
 */

import { ProceduralImageGenerator } from '../generatorBase.js';
import { createRandom } from '../randomSeeder.js';
import { HERALDRY_TEMPLATES } from './templates/heraldry.js';

export class HeraldryGenerator extends ProceduralImageGenerator {
	constructor() {
		super('heraldry');
	}

	getTemplates() {
		return HERALDRY_TEMPLATES;
	}

	getDescription() {
		return 'Generate procedural heraldic shields with traditional coats of arms, charges, and divisions';
	}

	validate(config) {
		const errors = [];

		if (!config.templateName) errors.push('templateName is required');
		if (!HERALDRY_TEMPLATES[config.templateName]) {
			errors.push(`Unknown template: ${config.templateName}`);
		}

		if (config.customizations) {
			const cust = config.customizations;
			if (cust.primaryColor !== undefined && !this._isValidHexColor(cust.primaryColor)) {
				errors.push('primaryColor must be valid hex color');
			}
			if (cust.accentColor !== undefined && !this._isValidHexColor(cust.accentColor)) {
				errors.push('accentColor must be valid hex color');
			}
			if (cust.detail !== undefined && (cust.detail < 0 || cust.detail > 1)) {
				errors.push('detail must be between 0 and 1');
			}
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	_isValidHexColor(color) {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
	}

	/**
	 * Generate a heraldic shield
	 * @param {string} seed - Deterministic seed
	 * @param {Object} config - Configuration with templateName and customizations
	 * @param {number} size - Output size (default 512)
	 * @returns {Promise<string>} Base64 PNG data
	 */
	async generate(seed, config, size = 512) {
		const validation = this.validate(config);
		if (!validation.valid) {
			throw new Error(`Invalid heraldry config: ${validation.errors.join(', ')}`);
		}

		const finalConfig = this.mergeConfig(config.templateName, config.customizations || {});
		const rng = createRandom(seed);

		const canvas = this._createCanvas(size, size);
		const ctx = canvas.getContext('2d');

		// Draw background
		ctx.fillStyle = '#f5f5f5';
		ctx.fillRect(0, 0, size, size);

		// Draw shield shape
		this._drawShield(ctx, size, rng, finalConfig);

		// Draw field/background
		this._drawField(ctx, size, rng, finalConfig);

		// Draw divisions
		this._drawDivisions(ctx, size, rng, finalConfig);

		// Draw charges/objects
		this._drawCharges(ctx, size, rng, finalConfig);

		// Draw border/embellishment
		this._drawBorder(ctx, size, rng, finalConfig);

		return this._canvasToBase64(canvas);
	}

	_drawShield(ctx, size, rng, config) {
		const cx = size / 2;
		const cy = size / 2;
		const width = size * 0.7;
		const height = size * 0.85;

		ctx.fillStyle = config.baseColor || '#FF0000';
		ctx.strokeStyle = '#1a1a1a';
		ctx.lineWidth = 3;

		const shapeType = config.shieldShape || 'heater';

		ctx.beginPath();

		if (shapeType === 'heater') {
			// Traditional heater shield
			const left = cx - width / 2;
			const top = cy - height / 2;
			const right = cx + width / 2;
			const bottom = cy + height / 2;

			ctx.moveTo(left, top);
			ctx.lineTo(right, top);
			ctx.lineTo(right, bottom - height * 0.2);
			ctx.quadraticCurveTo(cx, bottom + height * 0.15, left, bottom - height * 0.2);
			ctx.closePath();
		} else if (shapeType === 'pointed') {
			// Pointed shield
			const left = cx - width / 2;
			const top = cy - height / 2;
			const right = cx + width / 2;
			const bottom = cy + height / 2;

			ctx.moveTo(left, top);
			ctx.lineTo(right, top);
			ctx.lineTo(right, cy);
			ctx.lineTo(cx, bottom);
			ctx.lineTo(left, cy);
			ctx.closePath();
		} else if (shapeType === 'kite') {
			// Kite shield
			const left = cx - width / 2;
			const top = cy - height / 2;
			const right = cx + width / 2;
			const bottom = cy + height / 2;

			ctx.moveTo(cx, top);
			ctx.lineTo(right, cy * 0.7);
			ctx.lineTo(right, bottom);
			ctx.lineTo(cx, bottom + height * 0.1);
			ctx.lineTo(left, bottom);
			ctx.lineTo(left, cy * 0.7);
			ctx.closePath();
		} else if (shapeType === 'rounded') {
			// Rounded shield
			const left = cx - width / 2;
			const top = cy - height / 2;
			const right = cx + width / 2;
			const bottom = cy + height / 2;
			const radius = width * 0.15;

			ctx.moveTo(left + radius, top);
			ctx.lineTo(right - radius, top);
			ctx.quadraticCurveTo(right, top, right, top + radius);
			ctx.lineTo(right, bottom - height * 0.2);
			ctx.quadraticCurveTo(cx, bottom, left, bottom - height * 0.2);
			ctx.lineTo(left, top + radius);
			ctx.quadraticCurveTo(left, top, left + radius, top);
			ctx.closePath();
		}

		ctx.fill();
		ctx.stroke();
	}

	_drawField(ctx, size, rng, config) {
		const cx = size / 2;
		const cy = size / 2;
		const width = size * 0.65;
		const height = size * 0.8;

		ctx.save();
		ctx.beginPath();

		// Create clipping path for shield interior
		const left = cx - width / 2;
		const top = cy - height / 2;
		const right = cx + width / 2;
		const bottom = cy + height / 2;

		ctx.moveTo(left, top);
		ctx.lineTo(right, top);
		ctx.lineTo(right, bottom - height * 0.15);
		ctx.quadraticCurveTo(cx, bottom, left, bottom - height * 0.15);
		ctx.closePath();
		ctx.clip();

		// Draw base field color
		const colors = config.baseColors || [config.baseColor || '#FF0000'];
		ctx.fillStyle = colors[0];
		ctx.fillRect(left, top, width, height);

		// Add subtle pattern
		const pattern = config.pattern || 'simple';
		if (pattern === 'ermine') {
			this._drawErmine(ctx, left, top, width, height, rng);
		} else if (pattern === 'vair') {
			this._drawVair(ctx, left, top, width, height);
		} else if (pattern === 'roundels') {
			this._drawRoundels(ctx, left, top, width, height, rng);
		} else if (pattern === 'diagonal') {
			this._drawDiagonal(ctx, left, top, width, height);
		} else if (pattern === 'fleur_de_lis') {
			this._drawFleurPattern(ctx, left, top, width, height, rng);
		} else if (pattern === 'stars') {
			this._drawStarPattern(ctx, left, top, width, height, rng);
		}

		ctx.restore();
	}

	_drawErmine(ctx, x, y, w, h, rng) {
		// Ermine pattern - black fur with white spots
		const spotSize = 8;
		const spacing = 16;

		ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
		for (let i = x; i < x + w; i += spacing) {
			for (let j = y; j < y + h; j += spacing) {
				ctx.beginPath();
				ctx.arc(i + rng.range(0, spacing), j + rng.range(0, spacing), spotSize, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}

	_drawVair(ctx, x, y, w, h) {
		// Vair pattern - alternating blue and white squares
		const size = 20;
		for (let i = x; i < x + w; i += size) {
			for (let j = y; j < y + h; j += size) {
				const odd = (Math.floor((i - x) / size) + Math.floor((j - y) / size)) % 2;
				ctx.fillStyle = odd ? 'rgba(255, 255, 255, 0.3)' : 'rgba(100, 150, 255, 0.2)';
				ctx.fillRect(i, j, size, size);
			}
		}
	}

	_drawRoundels(ctx, x, y, w, h, rng) {
		// Roundels - circular spots scattered across the field
		ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
		const spacing = 60;
		for (let i = x + 30; i < x + w; i += spacing) {
			for (let j = y + 30; j < y + h; j += spacing) {
				ctx.beginPath();
				ctx.arc(i + rng.range(-10, 10), j + rng.range(-10, 10), 15, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}

	_drawDiagonal(ctx, x, y, w, h) {
		// Diagonal stripes
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
		ctx.lineWidth = 3;
		for (let i = -h; i < w; i += 15) {
			ctx.beginPath();
			ctx.moveTo(x + i, y);
			ctx.lineTo(x + i + h, y + h);
			ctx.stroke();
		}
	}

	_drawFleurPattern(ctx, x, y, w, h, rng) {
		// Fleur-de-lis scattered pattern
		const spacing = 80;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
		for (let i = x + 40; i < x + w; i += spacing) {
			for (let j = y + 40; j < y + h; j += spacing) {
				this._drawFleurDeLis(ctx, i + rng.range(-5, 5), j + rng.range(-5, 5), 12);
			}
		}
	}

	_drawStarPattern(ctx, x, y, w, h, rng) {
		// Stars scattered pattern
		const spacing = 70;
		for (let i = x + 35; i < x + w; i += spacing) {
			for (let j = y + 35; j < y + h; j += spacing) {
				ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
				this._drawStar(ctx, i + rng.range(-5, 5), j + rng.range(-5, 5), 5, 10, 5);
			}
		}
	}

	_drawDivisions(ctx, size, rng, config) {
		const cx = size / 2;
		const cy = size / 2;
		const width = size * 0.65;
		const height = size * 0.8;

		const left = cx - width / 2;
		const top = cy - height / 2;
		const right = cx + width / 2;
		const bottom = cy + height / 2;

		ctx.save();
		ctx.strokeStyle = '#1a1a1a';
		ctx.lineWidth = 2;

		const division = config.divisions || 'simple';

		if (division === 'quartered') {
			// Four quarters
			ctx.beginPath();
			ctx.moveTo(cx, top);
			ctx.lineTo(cx, bottom);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(left, cy);
			ctx.lineTo(right, cy);
			ctx.stroke();
		} else if (division === 'fess') {
			// Horizontal division
			ctx.beginPath();
			ctx.moveTo(left, cy);
			ctx.lineTo(right, cy);
			ctx.stroke();
		} else if (division === 'pale') {
			// Vertical division
			ctx.beginPath();
			ctx.moveTo(cx, top);
			ctx.lineTo(cx, bottom);
			ctx.stroke();
		} else if (division === 'bend') {
			// Diagonal from top-left to bottom-right
			ctx.beginPath();
			ctx.moveTo(left, top);
			ctx.lineTo(right, bottom);
			ctx.stroke();
		} else if (division === 'cross') {
			// Cross division
			ctx.beginPath();
			ctx.moveTo(cx, top);
			ctx.lineTo(cx, bottom);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(left, cy);
			ctx.lineTo(right, cy);
			ctx.stroke();
		}

		ctx.restore();
	}

	_drawCharges(ctx, size, rng, config) {
		const cx = size / 2;
		const cy = size / 2;
		const width = size * 0.65;
		const height = size * 0.8;

		const left = cx - width / 2;
		const top = cy - height / 2;
		const right = cx + width / 2;
		const bottom = cy + height / 2;

		ctx.save();
		ctx.beginPath();
		ctx.moveTo(left, top);
		ctx.lineTo(right, top);
		ctx.lineTo(right, bottom - height * 0.15);
		ctx.quadraticCurveTo(cx, bottom, left, bottom - height * 0.15);
		ctx.closePath();
		ctx.clip();

		const charges = config.charges || [];
		const colors = config.baseColors || [config.baseColor || '#FF0000'];
		const accentColor = config.accentColor || '#FFD700';

		ctx.fillStyle = accentColor;

		if (charges.length === 4 && config.divisions === 'quartered') {
			// Place one charge in each quarter
			const positions = [
				{ x: left + width * 0.25, y: top + height * 0.25 },
				{ x: right - width * 0.25, y: top + height * 0.25 },
				{ x: left + width * 0.25, y: bottom - height * 0.35 },
				{ x: right - width * 0.25, y: bottom - height * 0.35 }
			];

			for (let i = 0; i < charges.length; i++) {
				this._drawCharge(ctx, charges[i], positions[i].x, positions[i].y, 30, rng);
			}
		} else if (charges.length > 0) {
			// Distribute charges evenly
			for (let i = 0; i < charges.length; i++) {
				const angle = (Math.PI * 2 * i) / charges.length;
				const radius = Math.min(width, height) * 0.25;
				const x = cx + Math.cos(angle) * radius;
				const y = cy + Math.sin(angle) * radius;

				this._drawCharge(ctx, charges[i], x, y, 25, rng);
			}
		}

		ctx.restore();
	}

	_drawCharge(ctx, type, x, y, size, rng) {
		switch (type) {
			case 'lion':
				this._drawLion(ctx, x, y, size);
				break;
			case 'eagle':
				this._drawEagle(ctx, x, y, size);
				break;
			case 'dragon':
				this._drawDragon(ctx, x, y, size);
				break;
			case 'cross':
				this._drawCross(ctx, x, y, size);
				break;
			case 'fleur_de_lis':
				this._drawFleurDeLis(ctx, x, y, size);
				break;
			case 'crown':
				this._drawCrown(ctx, x, y, size);
				break;
			case 'sword':
				this._drawSword(ctx, x, y, size);
				break;
			case 'shield':
				this._drawShieldCharge(ctx, x, y, size);
				break;
			case 'star':
				this._drawStar(ctx, x, y, 3, size, 5);
				break;
			case 'moon':
				this._drawMoon(ctx, x, y, size);
				break;
		}
	}

	_drawLion(ctx, x, y, size) {
		ctx.fillStyle = ctx.fillStyle;
		ctx.beginPath();
		// Head
		ctx.arc(x, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
		ctx.fill();
		// Body
		ctx.fillRect(x - size * 0.2, y - size * 0.1, size * 0.4, size * 0.5);
		// Legs
		ctx.fillRect(x - size * 0.25, y + size * 0.35, size * 0.15, size * 0.3);
		ctx.fillRect(x + size * 0.1, y + size * 0.35, size * 0.15, size * 0.3);
	}

	_drawEagle(ctx, x, y, size) {
		// Head
		ctx.beginPath();
		ctx.arc(x, y - size * 0.2, size * 0.2, 0, Math.PI * 2);
		ctx.fill();

		// Wings
		ctx.beginPath();
		ctx.moveTo(x - size * 0.4, y);
		ctx.lineTo(x - size * 0.6, y + size * 0.1);
		ctx.lineTo(x - size * 0.3, y + size * 0.3);
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(x + size * 0.4, y);
		ctx.lineTo(x + size * 0.6, y + size * 0.1);
		ctx.lineTo(x + size * 0.3, y + size * 0.3);
		ctx.closePath();
		ctx.fill();

		// Body
		ctx.fillRect(x - size * 0.1, y, size * 0.2, size * 0.3);
	}

	_drawDragon(ctx, x, y, size) {
		// Body
		ctx.beginPath();
		ctx.ellipse(x, y, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
		ctx.fill();

		// Head
		ctx.beginPath();
		ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.15, 0, Math.PI * 2);
		ctx.fill();

		// Tail
		ctx.beginPath();
		ctx.moveTo(x - size * 0.3, y);
		ctx.quadraticCurveTo(x - size * 0.5, y + size * 0.2, x - size * 0.4, y + size * 0.4);
		ctx.lineWidth = size * 0.1;
		ctx.stroke();
	}

	_drawCross(ctx, x, y, size) {
		ctx.fillRect(x - size * 0.15, y - size * 0.4, size * 0.3, size * 0.8);
		ctx.fillRect(x - size * 0.4, y - size * 0.15, size * 0.8, size * 0.3);
	}

	_drawFleurDeLis(ctx, x, y, size) {
		const s = size / 10;
		// Center stem
		ctx.fillRect(x - s * 0.5, y, s, s * 3);

		// Top petals
		ctx.beginPath();
		ctx.arc(x - s, y - s, s * 0.7, 0, Math.PI * 2);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(x + s, y - s, s * 0.7, 0, Math.PI * 2);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(x, y - s * 2.5, s * 0.7, 0, Math.PI * 2);
		ctx.fill();
	}

	_drawCrown(ctx, x, y, size) {
		const s = size / 5;
		// Base band
		ctx.fillRect(x - size * 0.4, y, size * 0.8, s);

		// Points
		for (let i = 0; i < 3; i++) {
			const px = x - size * 0.25 + i * size * 0.25;
			ctx.beginPath();
			ctx.moveTo(px, y);
			ctx.lineTo(px - s * 0.5, y - size * 0.4);
			ctx.lineTo(px + s * 0.5, y - size * 0.4);
			ctx.closePath();
			ctx.fill();
		}
	}

	_drawSword(ctx, x, y, size) {
		// Blade
		ctx.fillRect(x - size * 0.08, y - size * 0.4, size * 0.16, size * 0.8);

		// Cross-guard
		ctx.fillRect(x - size * 0.3, y + size * 0.05, size * 0.6, size * 0.1);

		// Pommel
		ctx.beginPath();
		ctx.arc(x, y + size * 0.35, size * 0.12, 0, Math.PI * 2);
		ctx.fill();
	}

	_drawShieldCharge(ctx, x, y, size) {
		ctx.strokeStyle = ctx.fillStyle;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x, y - size * 0.3);
		ctx.lineTo(x + size * 0.2, y);
		ctx.lineTo(x + size * 0.2, y + size * 0.2);
		ctx.quadraticCurveTo(x, y + size * 0.35, x - size * 0.2, y + size * 0.2);
		ctx.lineTo(x - size * 0.2, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	_drawStar(ctx, x, y, inner, outer, points) {
		let rot = Math.PI / 2 * 3;
		let step = Math.PI / points;

		ctx.beginPath();
		ctx.moveTo(x, y - outer);

		for (let i = 0; i < points; i++) {
			ctx.lineTo(Math.cos(rot) * outer + x, Math.sin(rot) * outer + y);
			rot += step;

			ctx.lineTo(Math.cos(rot) * inner + x, Math.sin(rot) * inner + y);
			rot += step;
		}

		ctx.lineTo(x, y - outer);
		ctx.closePath();
		ctx.fill();
	}

	_drawMoon(ctx, x, y, size) {
		ctx.beginPath();
		ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#f5f5f5';
		ctx.beginPath();
		ctx.arc(x + size * 0.1, y, size * 0.25, 0, Math.PI * 2);
		ctx.fill();
	}

	_drawBorder(ctx, size, rng, config) {
		ctx.strokeStyle = '#333333';
		ctx.lineWidth = 2;

		const cx = size / 2;
		const cy = size / 2;
		const width = size * 0.7;
		const height = size * 0.85;

		const left = cx - width / 2;
		const top = cy - height / 2;
		const right = cx + width / 2;
		const bottom = cy + height / 2;

		ctx.beginPath();
		ctx.moveTo(left, top);
		ctx.lineTo(right, top);
		ctx.lineTo(right, bottom - height * 0.2);
		ctx.quadraticCurveTo(cx, bottom + height * 0.15, left, bottom - height * 0.2);
		ctx.lineTo(left, top);
		ctx.stroke();
	}
}
