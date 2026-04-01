/**
 * Wax Seal Generator
 * Procedurally generates wax seal images using canvas
 */

import { ProceduralImageGenerator } from '../generatorBase.js';
import { createRandom } from '../randomSeeder.js';
import { SEAL_TEMPLATES } from './templates/seals.js';

export class SealGenerator extends ProceduralImageGenerator {
	constructor() {
		super('seal');
	}

	getTemplates() {
		return SEAL_TEMPLATES;
	}

	getDescription() {
		return 'Create procedural wax seals with customizable colors, patterns, and effects';
	}

	validate(config) {
		const errors = [];

		// Required fields
		if (!config.templateName) errors.push('templateName is required');
		if (!SEAL_TEMPLATES[config.templateName]) {
			errors.push(`Unknown template: ${config.templateName}`);
		}

		// Optional customizations
		if (config.customizations) {
			const cust = config.customizations;
			if (cust.complexity !== undefined && (cust.complexity < 0 || cust.complexity > 1)) {
				errors.push('complexity must be between 0 and 1');
			}
			if (cust.color !== undefined && !this._isValidHexColor(cust.color)) {
				errors.push('color must be valid hex color');
			}
			if (cust.accentColor !== undefined && !this._isValidHexColor(cust.accentColor)) {
				errors.push('accentColor must be valid hex color');
			}
			if (cust.effectIntensity !== undefined && (cust.effectIntensity < 0 || cust.effectIntensity > 1)) {
				errors.push('effectIntensity must be between 0 and 1');
			}
			if (cust.waxDrips !== undefined && (cust.waxDrips < 0 || cust.waxDrips > 1)) {
				errors.push('waxDrips must be between 0 and 1');
			}
			if (cust.cracks !== undefined && (cust.cracks < 0 || cust.cracks > 1)) {
				errors.push('cracks must be between 0 and 1');
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
	 * Generate a wax seal image
	 * @param {string} seed - Deterministic seed
	 * @param {Object} config - Configuration with templateName and optional customizations
	 * @param {number} size - Output size (default 512)
	 * @returns {Promise<string>} Base64 PNG data
	 */
	async generate(seed, config, size = 512) {
		// Validate
		const validation = this.validate(config);
		if (!validation.valid) {
			throw new Error(`Invalid seal config: ${validation.errors.join(', ')}`);
		}

		// Merge template with customizations
		const template = SEAL_TEMPLATES[config.templateName];
		const finalConfig = this.mergeConfig(config.templateName, config.customizations || {});

		// Create RNG
		const rng = createRandom(seed);

		// Create canvas (browser vs node)
		const canvas = this._createCanvas(size, size);
		const ctx = canvas.getContext('2d');

		// Draw seal components
		this._drawWaxBase(ctx, rng, finalConfig, size);
		this._drawRings(ctx, rng, finalConfig, size);
		this._drawPattern(ctx, rng, finalConfig, size);
		this._applyCracks(ctx, rng, finalConfig, size);
		this._applyWaxDrips(ctx, rng, finalConfig, size);
		this._applyEmbossEffect(ctx, finalConfig, size);

		// Convert to PNG
		return this._canvasToBase64(canvas);
	}

	_createCanvas(width, height) {
		// Browser environment
		if (typeof document !== 'undefined') {
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			return canvas;
		}

		// Node environment (for server-side rendering)
		try {
			const { Canvas } = await import('canvas');
			return new Canvas(width, height);
		} catch (err) {
			throw new Error('Canvas library not available. Install "canvas" package for server-side rendering.');
		}
	}

	_drawWaxBase(ctx, rng, config, size) {
		const center = size / 2;
		const baseRadius = size / 2.2;

		// Create radial gradient for wax appearance
		const gradient = ctx.createRadialGradient(center, center, 0, center, center, baseRadius);
		gradient.addColorStop(0, this._lightenColor(config.color, 0.2));
		gradient.addColorStop(0.5, config.color);
		gradient.addColorStop(1, this._darkenColor(config.color, 0.3));

		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(center, center, baseRadius, 0, Math.PI * 2);
		ctx.fill();

		// Add subtle texture noise to wax
		this._addWaxTexture(ctx, rng, config, size, baseRadius, center);
	}

	_addWaxTexture(ctx, rng, config, size, radius, centerX, centerY) {
		const intensity = config.effectIntensity * 0.3;
		ctx.globalAlpha = intensity;

		// Random noise pattern
		for (let i = 0; i < 200; i++) {
			const angle = rng.next() * Math.PI * 2;
			const dist = rng.next() * radius;
			const x = centerX + Math.cos(angle) * dist;
			const y = centerY + Math.sin(angle) * dist;
			const size = rng.range(1, 3);

			ctx.fillStyle = rng.chance(0.5) ? '#FFFFFF' : '#000000';
			ctx.fillRect(x, y, size, size);
		}

		ctx.globalAlpha = 1;
	}

	_drawRings(ctx, rng, config, size) {
		const center = size / 2;
		const maxRadius = size / 2.2;
		const ringCount = config.ringCount || 2;

		ctx.strokeStyle = this._darkenColor(config.color, 0.4);
		ctx.lineWidth = 2;

		for (let i = 1; i <= ringCount; i++) {
			const radius = maxRadius * (1 - i / (ringCount + 1));
			ctx.beginPath();
			ctx.arc(center, center, radius, 0, Math.PI * 2);
			ctx.stroke();

			// Add subtle decorative rings with varying opacity
			if (i < ringCount && config.effectIntensity > 0.3) {
				ctx.globalAlpha = 0.3;
				ctx.lineWidth = 1;
				ctx.strokeStyle = config.accentColor;
				ctx.beginPath();
				ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
				ctx.stroke();
				ctx.globalAlpha = 1;
				ctx.lineWidth = 2;
			}
		}
	}

	_drawPattern(ctx, rng, config, size) {
		const center = size / 2;
		const patternSize = size / 3;

		ctx.fillStyle = config.accentColor;
		ctx.globalAlpha = 0.8;

		switch (config.patternType) {
			case 'rings':
				this._drawRingPattern(ctx, center, patternSize, rng);
				break;
			case 'celtic_knot':
				this._drawCelticKnot(ctx, center, patternSize, rng);
				break;
			case 'gothic':
				this._drawGothicPattern(ctx, center, patternSize, rng);
				break;
			case 'heraldic_shield':
				this._drawHeraldicShield(ctx, center, patternSize, rng);
				break;
			case 'mystical':
				this._drawMysticalPattern(ctx, center, patternSize, rng);
				break;
			case 'simple_symbol':
				this._drawSimpleSymbol(ctx, center, patternSize, rng);
				break;
			case 'royal_crown':
				this._drawRoyalCrown(ctx, center, patternSize, rng);
				break;
			case 'guild_mark':
				this._drawGuildMark(ctx, center, patternSize, rng);
				break;
			case 'sword_star':
				this._drawSwordStar(ctx, center, patternSize, rng);
				break;
			default:
				this._drawSimpleSymbol(ctx, center, patternSize, rng);
		}

		ctx.globalAlpha = 1;
	}

	_drawRingPattern(ctx, cx, size, rng) {
		const rings = 3 + rng.range(0, 2);
		for (let i = 0; i < rings; i++) {
			const radius = size * (0.3 + i * 0.2);
			ctx.beginPath();
			ctx.arc(cx, cx, radius, 0, Math.PI * 2);
			ctx.stroke();
		}
	}

	_drawCelticKnot(ctx, cx, size, rng) {
		// Simplified Celtic knot pattern
		ctx.lineWidth = 2;
		ctx.strokeStyle = ctx.fillStyle;

		const loops = 3;
		for (let i = 0; i < loops; i++) {
			const angle = (Math.PI * 2 * i) / loops;
			const x = cx + Math.cos(angle) * size * 0.4;
			const y = cx + Math.sin(angle) * size * 0.4;

			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.quadraticCurveTo(cx, cx, x + size * 0.15, y);
			ctx.stroke();
		}
	}

	_drawGothicPattern(ctx, cx, size, rng) {
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = ctx.fillStyle;

		// Gothic spires
		for (let i = 0; i < 4; i++) {
			const angle = (Math.PI * 2 * i) / 4;
			const startX = cx + Math.cos(angle) * size * 0.2;
			const startY = cx + Math.sin(angle) * size * 0.2;
			const endX = cx + Math.cos(angle) * size * 0.6;
			const endY = cx + Math.sin(angle) * size * 0.6;

			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.stroke();

			// Cross spire
			ctx.beginPath();
			ctx.moveTo(endX - 3, endY);
			ctx.lineTo(endX + 3, endY);
			ctx.stroke();
		}
	}

	_drawHeraldicShield(ctx, cx, size, rng) {
		ctx.lineWidth = 2;
		ctx.strokeStyle = ctx.fillStyle;

		// Shield shape
		const shieldWidth = size;
		const shieldHeight = size * 1.2;
		const x = cx - shieldWidth / 2;
		const y = cx - shieldHeight / 2;

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + shieldWidth, y);
		ctx.quadraticCurveTo(x + shieldWidth, y + shieldHeight * 0.7, cx, y + shieldHeight);
		ctx.quadraticCurveTo(x, y + shieldHeight * 0.7, x, y);
		ctx.stroke();

		// Vertical stripe in center
		ctx.beginPath();
		ctx.moveTo(cx, y);
		ctx.lineTo(cx, y + shieldHeight);
		ctx.stroke();
	}

	_drawMysticalPattern(ctx, cx, size, rng) {
		// Arcane symbols - stars and circles
		const symbols = 3 + rng.range(0, 2);
		for (let i = 0; i < symbols; i++) {
			const angle = (Math.PI * 2 * i) / symbols;
			const x = cx + Math.cos(angle) * size * 0.5;
			const y = cx + Math.sin(angle) * size * 0.5;

			// Draw star
			this._drawStar(ctx, x, y, 5, size * 0.1, size * 0.05);
		}
	}

	_drawSimpleSymbol(ctx, cx, size, rng) {
		// Simple central circle with decorative dots
		ctx.beginPath();
		ctx.arc(cx, cx, size * 0.2, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = this._lightenColor(ctx.fillStyle, 0.3);
		for (let i = 0; i < 8; i++) {
			const angle = (Math.PI * 2 * i) / 8;
			const x = cx + Math.cos(angle) * size * 0.4;
			const y = cx + Math.sin(angle) * size * 0.4;
			ctx.beginPath();
			ctx.arc(x, y, 2, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	_drawRoyalCrown(ctx, cx, size, rng) {
		ctx.lineWidth = 2;

		// Crown base
		ctx.strokeStyle = ctx.fillStyle;
		ctx.beginPath();
		ctx.moveTo(cx - size * 0.4, cx + size * 0.2);
		ctx.lineTo(cx - size * 0.3, cx - size * 0.3);
		ctx.lineTo(cx, cx - size * 0.5);
		ctx.lineTo(cx + size * 0.3, cx - size * 0.3);
		ctx.lineTo(cx + size * 0.4, cx + size * 0.2);
		ctx.stroke();

		// Crown points (jewels)
		for (let i = 0; i < 3; i++) {
			const pointX = cx - size * 0.3 + i * size * 0.3;
			const pointY = cx - size * (0.3 + i * 0.1);
			ctx.fillStyle = ctx.fillStyle;
			ctx.beginPath();
			ctx.arc(pointX, pointY, 3, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	_drawGuildMark(ctx, cx, size, rng) {
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = ctx.fillStyle;

		// Square base
		ctx.strokeRect(cx - size * 0.3, cx - size * 0.3, size * 0.6, size * 0.6);

		// Diagonal cross
		ctx.beginPath();
		ctx.moveTo(cx - size * 0.3, cx - size * 0.3);
		ctx.lineTo(cx + size * 0.3, cx + size * 0.3);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(cx + size * 0.3, cx - size * 0.3);
		ctx.lineTo(cx - size * 0.3, cx + size * 0.3);
		ctx.stroke();
	}

	_drawSwordStar(ctx, cx, size, rng) {
		// Star pattern
		this._drawStar(ctx, cx, cx, 8, size * 0.4, size * 0.2);

		// Center sword
		ctx.lineWidth = 2;
		ctx.strokeStyle = ctx.fillStyle;
		ctx.beginPath();
		ctx.moveTo(cx, cx - size * 0.4);
		ctx.lineTo(cx, cx + size * 0.3);
		ctx.stroke();
	}

	_drawStar(ctx, cx, cy, points, outer, inner) {
		ctx.beginPath();
		for (let i = 0; i < points * 2; i++) {
			const angle = (Math.PI * i) / points - Math.PI / 2;
			const radius = i % 2 === 0 ? outer : inner;
			const x = cx + Math.cos(angle) * radius;
			const y = cy + Math.sin(angle) * radius;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.fill();
	}

	_applyCracks(ctx, rng, config, size) {
		const crackIntensity = config.cracks * config.effectIntensity;
		if (crackIntensity < 0.01) return;

		ctx.globalAlpha = crackIntensity * 0.4;
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 0.5;

		const crackCount = Math.floor(3 * crackIntensity);
		const center = size / 2;

		for (let c = 0; c < crackCount; c++) {
			const startAngle = rng.next() * Math.PI * 2;
			const startDist = rng.float(0, size * 0.4);
			const startX = center + Math.cos(startAngle) * startDist;
			const startY = center + Math.sin(startAngle) * startDist;

			ctx.beginPath();
			ctx.moveTo(startX, startY);

			let x = startX;
			let y = startY;

			for (let i = 0; i < 20; i++) {
				const angle = startAngle + rng.float(-0.3, 0.3);
				x += Math.cos(angle) * 5;
				y += Math.sin(angle) * 5;
				ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		ctx.globalAlpha = 1;
	}

	_applyWaxDrips(ctx, rng, config, size) {
		const dripIntensity = config.waxDrips * config.effectIntensity;
		if (dripIntensity < 0.01) return;

		ctx.globalAlpha = 0.6;
		ctx.fillStyle = this._darkenColor(config.color, 0.2);

		const dripCount = Math.floor(3 + dripIntensity * 5);

		for (let i = 0; i < dripCount; i++) {
			const x = rng.float(size * 0.2, size * 0.8);
			const y = size * 0.85 + rng.float(0, size * 0.1);
			const width = rng.float(3, 12);
			const height = rng.float(8, 20);

			ctx.beginPath();
			ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.globalAlpha = 1;
	}

	_applyEmbossEffect(ctx, config, size) {
		if (!config.emboss) return;

		ctx.globalAlpha = 0.15;
		ctx.fillStyle = '#FFFFFF';
		ctx.beginPath();
		ctx.arc(size * 0.25, size * 0.25, size * 0.3, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#000000';
		ctx.beginPath();
		ctx.arc(size * 0.75, size * 0.75, size * 0.3, 0, Math.PI * 2);
		ctx.fill();

		ctx.globalAlpha = 1;
	}

	_lightenColor(color, amount) {
		const num = parseInt(color.replace('#', ''), 16);
		const amt = Math.round(2.55 * amount);
		const R = Math.min(255, (num >> 16) + amt);
		const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
		const B = Math.min(255, (num & 0x0000FF) + amt);
		return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
	}

	_darkenColor(color, amount) {
		const num = parseInt(color.replace('#', ''), 16);
		const amt = Math.round(2.55 * amount);
		const R = Math.max(0, (num >> 16) - amt);
		const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
		const B = Math.max(0, (num & 0x0000FF) - amt);
		return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
	}

	_canvasToBase64(canvas) {
		// Browser
		if (canvas.toDataURL) {
			return canvas.toDataURL('image/png');
		}

		// Node.js (canvas library)
		if (canvas.toBuffer) {
			return canvas.toBuffer('image/png').toString('base64');
		}

		throw new Error('Unable to convert canvas to Base64');
	}
}
