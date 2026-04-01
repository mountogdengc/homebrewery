/**
 * Adventure Icon Generator
 * Creates symbolic icons representing adventure themes (dragon slaying, treasure, mystery, etc.)
 */

import { ProceduralImageGenerator } from '../generatorBase.js';
import { createRandom } from '../randomSeeder.js';
import { ICON_TEMPLATES } from './templates/icons.js';

export class AdventureIconGenerator extends ProceduralImageGenerator {
	constructor() {
		super('icon');
	}

	getTemplates() {
		return ICON_TEMPLATES;
	}

	getDescription() {
		return 'Create procedural adventure icons representing quest themes, campaign concepts, and plot hooks';
	}

	validate(config) {
		const errors = [];

		// Required fields
		if (!config.templateName) errors.push('templateName is required');
		if (!ICON_TEMPLATES[config.templateName]) {
			errors.push(`Unknown template: ${config.templateName}`);
		}

		// Optional customizations
		if (config.customizations) {
			const cust = config.customizations;
			if (cust.color !== undefined && !this._isValidHexColor(cust.color)) {
				errors.push('color must be valid hex color');
			}
			if (cust.accentColor !== undefined && !this._isValidHexColor(cust.accentColor)) {
				errors.push('accentColor must be valid hex color');
			}
			if (cust.effectIntensity !== undefined && (cust.effectIntensity < 0 || cust.effectIntensity > 1)) {
				errors.push('effectIntensity must be between 0 and 1');
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
	 * Generate an adventure icon
	 * @param {string} seed - Deterministic seed
	 * @param {Object} config - Configuration with templateName and optional customizations
	 * @param {number} size - Output size (default 512)
	 * @returns {Promise<string>} Base64 PNG data
	 */
	async generate(seed, config, size = 512) {
		// Validate
		const validation = this.validate(config);
		if (!validation.valid) {
			throw new Error(`Invalid icon config: ${validation.errors.join(', ')}`);
		}

		// Merge template with customizations
		const finalConfig = this.mergeConfig(config.templateName, config.customizations || {});

		// Create RNG
		const rng = createRandom(seed);

		// Create canvas
		const canvas = this._createCanvas(size, size);
		const ctx = canvas.getContext('2d');

		// Draw icon components
		this._drawBackground(ctx, finalConfig, size);
		this._drawSymbol(ctx, rng, finalConfig, size);
		this._drawBorder(ctx, finalConfig, size);

		if (finalConfig.effectIntensity > 0.2) {
			this._addGlowEffect(ctx, finalConfig, size);
		}

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

		// Node environment
		try {
			const { Canvas } = await import('canvas');
			return new Canvas(width, height);
		} catch (err) {
			throw new Error('Canvas library not available. Install "canvas" package for server-side rendering.');
		}
	}

	_drawBackground(ctx, config, size) {
		const center = size / 2;
		const radius = size / 2.2;

		// Solid background circle
		ctx.fillStyle = config.color;
		ctx.beginPath();
		ctx.arc(center, center, radius, 0, Math.PI * 2);
		ctx.fill();
	}

	_drawSymbol(ctx, rng, config, size) {
		ctx.fillStyle = config.accentColor;
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 2;

		switch (config.theme) {
			case 'dragon_slaying':
				this._drawDragonSymbol(ctx, rng, config, size);
				break;
			case 'treasure_hunt':
				this._drawTreasureSymbol(ctx, rng, config, size);
				break;
			case 'monster_hunting':
				this._drawMonsterSymbol(ctx, rng, config, size);
				break;
			case 'dungeon_delving':
				this._drawDungeonSymbol(ctx, rng, config, size);
				break;
			case 'planar_travel':
				this._drawPlanarSymbol(ctx, rng, config, size);
				break;
			case 'heist_stealth':
				this._drawHeistSymbol(ctx, rng, config, size);
				break;
			case 'mystery_investigation':
				this._drawMysterySymbol(ctx, rng, config, size);
				break;
			case 'dark_quest':
				this._drawDarkQuestSymbol(ctx, rng, config, size);
				break;
			case 'magic_arcana':
				this._drawMagicSymbol(ctx, rng, config, size);
				break;
			case 'undead_necromancy':
				this._drawUndeadSymbol(ctx, rng, config, size);
				break;
			default:
				this._drawDragonSymbol(ctx, rng, config, size);
		}
	}

	_drawDragonSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Dragon head (left side)
		ctx.beginPath();
		ctx.arc(cx - 40 * scale, cy - 20 * scale, 25 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Dragon mouth
		ctx.beginPath();
		ctx.moveTo(cx - 15 * scale, cy - 20 * scale);
		ctx.lineTo(cx + 10 * scale, cy - 30 * scale);
		ctx.lineTo(cx + 10 * scale, cy - 10 * scale);
		ctx.closePath();
		ctx.fill();

		// Dragon wings
		ctx.beginPath();
		ctx.ellipse(cx - 30 * scale, cy + 10 * scale, 30 * scale, 40 * scale, -0.3, 0, Math.PI * 2);
		ctx.stroke();

		// Sword (right side, crossing)
		ctx.lineWidth = 3 * scale;
		ctx.beginPath();
		ctx.moveTo(cx + 20 * scale, cy - 50 * scale);
		ctx.lineTo(cx + 20 * scale, cy + 50 * scale);
		ctx.stroke();

		// Sword hilt
		ctx.fillRect(cx + 15 * scale, cy + 45 * scale, 10 * scale, 15 * scale);
	}

	_drawTreasureSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Treasure chest (center)
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 2 * scale;
		ctx.strokeRect(cx - 30 * scale, cy - 10 * scale, 60 * scale, 35 * scale);

		// Chest lid (arc)
		ctx.beginPath();
		ctx.ellipse(cx, cy - 10 * scale, 30 * scale, 12 * scale, 0, 0, Math.PI);
		ctx.stroke();

		// Gold coins (circles around chest)
		ctx.fillStyle = config.accentColor;
		const positions = [
			{ x: cx - 50 * scale, y: cy },
			{ x: cx + 50 * scale, y: cy },
			{ x: cx, y: cy - 40 * scale },
			{ x: cx, y: cy + 40 * scale }
		];

		positions.forEach(pos => {
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 8 * scale, 0, Math.PI * 2);
			ctx.fill();
		});

		// Gem (center of chest)
		ctx.beginPath();
		ctx.arc(cx, cy, 6 * scale, 0, Math.PI * 2);
		ctx.fill();
	}

	_drawMonsterSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Crossed swords (X shape)
		ctx.lineWidth = 3 * scale;
		ctx.strokeStyle = config.accentColor;

		// Left diagonal sword
		ctx.beginPath();
		ctx.moveTo(cx - 45 * scale, cy - 45 * scale);
		ctx.lineTo(cx + 45 * scale, cy + 45 * scale);
		ctx.stroke();

		// Right diagonal sword
		ctx.beginPath();
		ctx.moveTo(cx + 45 * scale, cy - 45 * scale);
		ctx.lineTo(cx - 45 * scale, cy + 45 * scale);
		ctx.stroke();

		// Monster skull (center)
		ctx.fillStyle = config.accentColor;
		ctx.beginPath();
		ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Eye sockets
		ctx.fillStyle = config.color;
		ctx.beginPath();
		ctx.arc(cx - 7 * scale, cy - 5 * scale, 4 * scale, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(cx + 7 * scale, cy - 5 * scale, 4 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Mouth
		ctx.strokeStyle = config.color;
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.moveTo(cx - 8 * scale, cy + 3 * scale);
		ctx.lineTo(cx + 8 * scale, cy + 3 * scale);
		ctx.stroke();
	}

	_drawDungeonSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Stone stairs (stacked rectangles, left side)
		ctx.fillStyle = config.accentColor;
		for (let i = 0; i < 4; i++) {
			ctx.fillRect(cx - 40 * scale, cy - 30 * scale + i * 15 * scale, 30 * scale, 12 * scale);
		}

		// Torch (right side)
		// Handle
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 3 * scale;
		ctx.beginPath();
		ctx.moveTo(cx + 40 * scale, cy - 20 * scale);
		ctx.lineTo(cx + 40 * scale, cy + 30 * scale);
		ctx.stroke();

		// Flame
		ctx.fillStyle = config.accentColor;
		ctx.beginPath();
		ctx.moveTo(cx + 35 * scale, cy - 25 * scale);
		ctx.quadraticCurveTo(cx + 32 * scale, cy - 40 * scale, cx + 40 * scale, cy - 50 * scale);
		ctx.quadraticCurveTo(cx + 48 * scale, cy - 40 * scale, cx + 45 * scale, cy - 25 * scale);
		ctx.closePath();
		ctx.fill();

		// Skull at bottom
		ctx.beginPath();
		ctx.arc(cx + 40 * scale, cy + 40 * scale, 8 * scale, 0, Math.PI * 2);
		ctx.fill();
	}

	_drawPlanarSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Portal frame (concentric circles)
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 2 * scale;
		for (let i = 1; i <= 3; i++) {
			ctx.beginPath();
			ctx.arc(cx, cy, 20 * scale * i, 0, Math.PI * 2);
			ctx.stroke();
		}

		// Portal rays
		for (let i = 0; i < 8; i++) {
			const angle = (Math.PI * 2 * i) / 8;
			const x1 = cx + Math.cos(angle) * 20 * scale;
			const y1 = cy + Math.sin(angle) * 20 * scale;
			const x2 = cx + Math.cos(angle) * 45 * scale;
			const y2 = cy + Math.sin(angle) * 45 * scale;

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}

		// Stars inside
		ctx.fillStyle = config.accentColor;
		for (let i = 0; i < 5; i++) {
			const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
			const x = cx + Math.cos(angle) * 15 * scale;
			const y = cy + Math.sin(angle) * 15 * scale;
			this._drawStar(ctx, x, y, 5, 3 * scale, 1.5 * scale);
		}
	}

	_drawHeistSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Mask (center)
		ctx.fillStyle = config.accentColor;
		ctx.beginPath();
		ctx.ellipse(cx, cy - 5 * scale, 22 * scale, 18 * scale, 0, 0, Math.PI * 2);
		ctx.fill();

		// Eye holes
		ctx.fillStyle = config.color;
		ctx.beginPath();
		ctx.arc(cx - 8 * scale, cy - 8 * scale, 5 * scale, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(cx + 8 * scale, cy - 8 * scale, 5 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Lockpick (lower right)
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.arc(cx + 20 * scale, cy + 20 * scale, 5 * scale, 0, Math.PI);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(cx + 20 * scale, cy + 20 * scale);
		ctx.lineTo(cx + 20 * scale, cy + 35 * scale);
		ctx.stroke();

		// Shadow (bottom, semi-transparent)
		ctx.globalAlpha = 0.3;
		ctx.fillStyle = config.color;
		ctx.beginPath();
		ctx.ellipse(cx, cy + 35 * scale, 35 * scale, 15 * scale, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;
	}

	_drawMysterySymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Magnifying glass
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 2 * scale;
		ctx.beginPath();
		ctx.arc(cx - 15 * scale, cy - 10 * scale, 20 * scale, 0, Math.PI * 2);
		ctx.stroke();

		// Handle
		ctx.beginPath();
		ctx.moveTo(cx + 8 * scale, cy + 5 * scale);
		ctx.lineTo(cx + 30 * scale, cy + 25 * scale);
		ctx.stroke();

		// Scroll (right side)
		ctx.fillStyle = config.accentColor;
		ctx.fillRect(cx + 15 * scale, cy - 25 * scale, 25 * scale, 40 * scale);

		// Scroll ridges
		ctx.strokeStyle = config.color;
		ctx.lineWidth = 1 * scale;
		for (let i = 0; i < 4; i++) {
			ctx.beginPath();
			ctx.moveTo(cx + 15 * scale, cy - 25 * scale + i * 10 * scale);
			ctx.lineTo(cx + 40 * scale, cy - 25 * scale + i * 10 * scale);
			ctx.stroke();
		}

		// Question mark
		ctx.fillStyle = config.accentColor;
		ctx.font = `${30 * scale}px Arial`;
		ctx.textAlign = 'center';
		ctx.fillText('?', cx - 15 * scale, cy + 5 * scale);
	}

	_drawDarkQuestSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Chains (vertical links)
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 2 * scale;
		for (let i = 0; i < 5; i++) {
			const y = cy - 40 * scale + i * 20 * scale;
			ctx.beginPath();
			ctx.arc(cx, y, 5 * scale, 0, Math.PI * 2);
			ctx.stroke();
		}

		// Chain links
		for (let i = 0; i < 4; i++) {
			const y1 = cy - 40 * scale + i * 20 * scale;
			const y2 = y1 + 20 * scale;
			ctx.beginPath();
			ctx.moveTo(cx - 5 * scale, y1);
			ctx.lineTo(cx - 5 * scale, y2);
			ctx.moveTo(cx + 5 * scale, y1);
			ctx.lineTo(cx + 5 * scale, y2);
			ctx.stroke();
		}

		// Shadow creeping up
		ctx.globalAlpha = 0.4;
		ctx.fillStyle = config.color;
		for (let i = 0; i < 3; i++) {
			ctx.beginPath();
			ctx.ellipse(cx, cy + 35 * scale - i * 15 * scale, 40 * scale - i * 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;

		// Broken crown at top
		ctx.fillStyle = config.accentColor;
		ctx.beginPath();
		ctx.moveTo(cx - 25 * scale, cy - 50 * scale);
		ctx.lineTo(cx, cy - 60 * scale);
		ctx.lineTo(cx + 25 * scale, cy - 50 * scale);
		ctx.lineTo(cx + 15 * scale, cy - 45 * scale);
		ctx.lineTo(cx, cy - 55 * scale);
		ctx.lineTo(cx - 15 * scale, cy - 45 * scale);
		ctx.closePath();
		ctx.fill();
	}

	_drawMagicSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Staff (vertical line with curved top)
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 3 * scale;
		ctx.beginPath();
		ctx.moveTo(cx, cy + 40 * scale);
		ctx.lineTo(cx, cy - 40 * scale);
		ctx.stroke();

		// Staff orb (top)
		ctx.fillStyle = config.accentColor;
		ctx.beginPath();
		ctx.arc(cx, cy - 45 * scale, 10 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Arcane runes (circles around staff)
		ctx.lineWidth = 1.5 * scale;
		ctx.strokeStyle = config.accentColor;
		for (let i = 0; i < 3; i++) {
			const angle = (Math.PI * 2 * i) / 3;
			const x = cx + Math.cos(angle) * 30 * scale;
			const y = cy + Math.sin(angle) * 30 * scale;
			ctx.beginPath();
			ctx.arc(x, y, 5 * scale, 0, Math.PI * 2);
			ctx.stroke();
		}

		// Stars scattered
		ctx.fillStyle = config.accentColor;
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI * 2 * i) / 6;
			const x = cx + Math.cos(angle) * 45 * scale;
			const y = cy + Math.sin(angle) * 45 * scale;
			this._drawStar(ctx, x, y, 4, 2 * scale, 1 * scale);
		}
	}

	_drawUndeadSymbol(ctx, rng, config, size) {
		const cx = size / 2;
		const cy = size / 2;
		const scale = size / 256;

		// Skeleton skull
		ctx.fillStyle = config.accentColor;
		ctx.beginPath();
		ctx.arc(cx, cy - 15 * scale, 20 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Eye sockets
		ctx.fillStyle = config.color;
		ctx.beginPath();
		ctx.arc(cx - 8 * scale, cy - 18 * scale, 5 * scale, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(cx + 8 * scale, cy - 18 * scale, 5 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Nose hole
		ctx.beginPath();
		ctx.arc(cx, cy - 8 * scale, 3 * scale, 0, Math.PI * 2);
		ctx.fill();

		// Teeth
		ctx.strokeStyle = config.color;
		ctx.lineWidth = 1 * scale;
		for (let i = 0; i < 6; i++) {
			ctx.beginPath();
			ctx.moveTo(cx - 10 * scale + i * 3 * scale, cy + 5 * scale);
			ctx.lineTo(cx - 10 * scale + i * 3 * scale, cy + 8 * scale);
			ctx.stroke();
		}

		// Crossed bones below
		ctx.strokeStyle = config.accentColor;
		ctx.lineWidth = 2 * scale;

		// Left bone
		ctx.beginPath();
		ctx.moveTo(cx - 25 * scale, cy + 15 * scale);
		ctx.lineTo(cx + 5 * scale, cy + 35 * scale);
		ctx.stroke();

		// Right bone
		ctx.beginPath();
		ctx.moveTo(cx + 25 * scale, cy + 15 * scale);
		ctx.lineTo(cx - 5 * scale, cy + 35 * scale);
		ctx.stroke();

		// Bone knobs
		for (const x of [cx - 25 * scale, cx + 5 * scale, cx + 25 * scale, cx - 5 * scale]) {
			for (const y of [cy + 15 * scale, cy + 35 * scale]) {
				ctx.beginPath();
				ctx.arc(x, y, 4 * scale, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// Dark aura
		ctx.globalAlpha = 0.25;
		ctx.fillStyle = config.color;
		for (let i = 0; i < 3; i++) {
			ctx.beginPath();
			ctx.arc(cx, cy, 35 * scale + i * 10 * scale, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
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

	_drawBorder(ctx, config, size) {
		const center = size / 2;
		const radius = size / 2.2;

		ctx.strokeStyle = this._darkenColor(config.color, 0.3);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(center, center, radius, 0, Math.PI * 2);
		ctx.stroke();
	}

	_addGlowEffect(ctx, config, size) {
		ctx.globalAlpha = 0.2;
		ctx.fillStyle = config.accentColor;
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2.2 + 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;
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

		// Node.js
		if (canvas.toBuffer) {
			return canvas.toBuffer('image/png').toString('base64');
		}

		throw new Error('Unable to convert canvas to Base64');
	}
}
