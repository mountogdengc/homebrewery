/**
 * Deterministic random number generator using seeded RNG
 * Ensures reproducible procedural generation - same seed always produces same output
 */

/**
 * Mulberry32: Fast, simple seeded PRNG
 * https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
function mulberry32(seed) {
	return function() {
		seed |= 0; seed = seed + 0x6D2B79F5 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	}
}

/**
 * Convert any seed string to a numeric hash
 */
function hashSeed(seed) {
	if (typeof seed === 'number') return seed;
	if (typeof seed !== 'string') seed = String(seed);

	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		const char = seed.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}

/**
 * Create a seeded random number generator
 * @param {string|number} seed - Seed for reproducibility
 * @returns {Object} RNG with utility methods
 */
export function createRandom(seed) {
	const numericSeed = hashSeed(seed);
	const rng = mulberry32(numericSeed);

	return {
		/**
		 * Get next random number [0, 1)
		 */
		next() {
			return rng();
		},

		/**
		 * Get random integer in range [min, max)
		 */
		range(min, max) {
			return Math.floor(this.next() * (max - min)) + min;
		},

		/**
		 * Get random float in range [min, max)
		 */
		float(min, max) {
			return this.next() * (max - min) + min;
		},

		/**
		 * Get random boolean with given probability [0, 1]
		 */
		chance(probability = 0.5) {
			return this.next() < probability;
		},

		/**
		 * Pick random element from array
		 */
		pick(arr) {
			return arr[this.range(0, arr.length)];
		},

		/**
		 * Shuffle array in place (Fisher-Yates)
		 */
		shuffle(arr) {
			const copy = [...arr];
			for (let i = copy.length - 1; i > 0; i--) {
				const j = this.range(0, i + 1);
				[copy[i], copy[j]] = [copy[j], copy[i]];
			}
			return copy;
		},

		/**
		 * Perlin-like noise (simple implementation)
		 * Returns smoother values than raw random
		 */
		noise(x) {
			const xi = Math.floor(x);
			const xf = x - xi;
			const u = xf * xf * (3.0 - 2.0 * xf); // Smoothstep

			// Use seeded values for corners
			const seed1 = numericSeed + xi;
			const seed2 = numericSeed + xi + 1;
			const n0 = mulberry32(seed1)();
			const n1 = mulberry32(seed2)();

			return n0 * (1.0 - u) + n1 * u;
		}
	};
}

/**
 * Generate a random seed string (for user-triggered regeneration)
 * @returns {string} 16-character hex seed
 */
export function generateRandomSeed() {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).slice(2);
	return (timestamp + random).slice(0, 16).padEnd(16, '0');
}
