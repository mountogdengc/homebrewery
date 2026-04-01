/**
 * Base class for all procedural image generators
 * Provides interface that all generator types (seal, insignia, heraldry, etc) must implement
 */

export class ProceduralImageGenerator {
	constructor(type) {
		this.type = type;
	}

	/**
	 * Get the type identifier (must match collection name: seal, insignia, heraldry, etc)
	 * @returns {string}
	 */
	getType() {
		return this.type;
	}

	/**
	 * Get all available templates for this generator
	 * @returns {Object} Map of templateName -> templateConfig
	 */
	getTemplates() {
		throw new Error(`${this.type}Generator must implement getTemplates()`);
	}

	/**
	 * Get template by name
	 * @param {string} templateName
	 * @returns {Object} Template configuration
	 */
	getTemplate(templateName) {
		const templates = this.getTemplates();
		if (!templates[templateName]) {
			throw new Error(`Template "${templateName}" not found for ${this.type}`);
		}
		return templates[templateName];
	}

	/**
	 * Validate configuration against this generator's schema
	 * @param {Object} config - Configuration to validate
	 * @returns {Object} { valid: boolean, errors: string[] }
	 */
	validate(config) {
		throw new Error(`${this.type}Generator must implement validate(config)`);
	}

	/**
	 * Generate image data using seeded RNG and configuration
	 * This is the core method that produces output
	 * @param {string} seed - Deterministic seed for reproducibility
	 * @param {Object} config - Generator-specific configuration
	 * @param {number} [size=512] - Output size in pixels
	 * @returns {Promise<string>} Base64 PNG data or SVG string
	 */
	async generate(seed, config, size = 512) {
		throw new Error(`${this.type}Generator must implement generate(seed, config, size)`);
	}

	/**
	 * Merge template defaults with user customizations
	 * @param {string} templateName - Base template to use
	 * @param {Object} customizations - User overrides
	 * @returns {Object} Merged configuration
	 */
	mergeConfig(templateName, customizations = {}) {
		const template = this.getTemplate(templateName);
		return {
			...template,
			...customizations
		};
	}

	/**
	 * Get human-readable name for this generator
	 * @returns {string}
	 */
	getDisplayName() {
		const names = {
			seal: 'Wax Seal',
			insignia: 'Insignia',
			heraldry: 'Heraldry',
			icon: 'Adventure Icon'
		};
		return names[this.type] || this.type;
	}

	/**
	 * Get description of what this generator creates
	 * @returns {string}
	 */
	getDescription() {
		throw new Error(`${this.type}Generator must implement getDescription()`);
	}
}

/**
 * Global registry of generators
 * Use this to look up generators by type
 */
const GENERATOR_REGISTRY = new Map();

export function registerGenerator(generator) {
	if (!(generator instanceof ProceduralImageGenerator)) {
		throw new Error('Generator must extend ProceduralImageGenerator');
	}
	GENERATOR_REGISTRY.set(generator.getType(), generator);
}

export function getGenerator(type) {
	return GENERATOR_REGISTRY.get(type);
}

export function getAllGenerators() {
	return Array.from(GENERATOR_REGISTRY.values());
}

export function getGeneratorTypes() {
	return Array.from(GENERATOR_REGISTRY.keys());
}
