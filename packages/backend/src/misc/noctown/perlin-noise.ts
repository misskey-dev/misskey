/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Perlin Noise generator for terrain generation
 * Based on improved Perlin noise algorithm
 */

// Permutation table
const PERMUTATION = [
	151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
	140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
	247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
	57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
	74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
	60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
	65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
	200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
	52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
	207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
	119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
	129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
	218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
	81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
	184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
	222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];

// Double permutation table for faster access
const PERM = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
	PERM[i] = PERMUTATION[i & 255];
}

// Gradient vectors for 3D noise
const GRAD3 = [
	[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
	[1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
	[0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

// Fade function for smooth interpolation
function fade(t: number): number {
	return t * t * t * (t * (t * 6 - 15) + 10);
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
	return a + t * (b - a);
}

// Dot product of gradient and distance vector
function grad3(hash: number, x: number, y: number, z: number): number {
	const g = GRAD3[hash % 12];
	return g[0] * x + g[1] * y + g[2] * z;
}

// Dot product for 2D
function grad2(hash: number, x: number, y: number): number {
	const h = hash & 3;
	const u = h < 2 ? x : y;
	const v = h < 2 ? y : x;
	return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
}

export class PerlinNoise {
	private seed: number;
	private perm: Uint8Array;

	constructor(seed: number = 0) {
		this.seed = seed;
		this.perm = this.generatePermutation(seed);
	}

	private generatePermutation(seed: number): Uint8Array {
		const perm = new Uint8Array(512);

		// Create seeded permutation
		const source = [...PERMUTATION];

		// Simple seeded shuffle
		let s = seed;
		for (let i = source.length - 1; i > 0; i--) {
			s = (s * 1103515245 + 12345) & 0x7fffffff;
			const j = s % (i + 1);
			[source[i], source[j]] = [source[j], source[i]];
		}

		for (let i = 0; i < 512; i++) {
			perm[i] = source[i & 255];
		}

		return perm;
	}

	/**
	 * 2D Perlin noise
	 * @param x X coordinate
	 * @param y Y coordinate
	 * @returns Noise value between -1 and 1
	 */
	public noise2D(x: number, y: number): number {
		// Find unit grid cell
		const X = Math.floor(x) & 255;
		const Y = Math.floor(y) & 255;

		// Relative position in cell
		x -= Math.floor(x);
		y -= Math.floor(y);

		// Fade curves
		const u = fade(x);
		const v = fade(y);

		// Hash coordinates
		const A = this.perm[X] + Y;
		const B = this.perm[X + 1] + Y;

		// Interpolate
		return lerp(
			lerp(grad2(this.perm[A], x, y), grad2(this.perm[B], x - 1, y), u),
			lerp(grad2(this.perm[A + 1], x, y - 1), grad2(this.perm[B + 1], x - 1, y - 1), u),
			v,
		);
	}

	/**
	 * 3D Perlin noise
	 * @param x X coordinate
	 * @param y Y coordinate
	 * @param z Z coordinate
	 * @returns Noise value between -1 and 1
	 */
	public noise3D(x: number, y: number, z: number): number {
		// Find unit grid cell
		const X = Math.floor(x) & 255;
		const Y = Math.floor(y) & 255;
		const Z = Math.floor(z) & 255;

		// Relative position in cell
		x -= Math.floor(x);
		y -= Math.floor(y);
		z -= Math.floor(z);

		// Fade curves
		const u = fade(x);
		const v = fade(y);
		const w = fade(z);

		// Hash coordinates
		const A = this.perm[X] + Y;
		const AA = this.perm[A] + Z;
		const AB = this.perm[A + 1] + Z;
		const B = this.perm[X + 1] + Y;
		const BA = this.perm[B] + Z;
		const BB = this.perm[B + 1] + Z;

		// Blend results from 8 corners
		return lerp(
			lerp(
				lerp(
					grad3(this.perm[AA], x, y, z),
					grad3(this.perm[BA], x - 1, y, z),
					u,
				),
				lerp(
					grad3(this.perm[AB], x, y - 1, z),
					grad3(this.perm[BB], x - 1, y - 1, z),
					u,
				),
				v,
			),
			lerp(
				lerp(
					grad3(this.perm[AA + 1], x, y, z - 1),
					grad3(this.perm[BA + 1], x - 1, y, z - 1),
					u,
				),
				lerp(
					grad3(this.perm[AB + 1], x, y - 1, z - 1),
					grad3(this.perm[BB + 1], x - 1, y - 1, z - 1),
					u,
				),
				v,
			),
			w,
		);
	}

	/**
	 * Fractal Brownian Motion (fBm) for more natural terrain
	 * @param x X coordinate
	 * @param y Y coordinate
	 * @param octaves Number of noise layers
	 * @param persistence Amplitude reduction per octave
	 * @param lacunarity Frequency increase per octave
	 * @returns Noise value
	 */
	public fbm2D(
		x: number,
		y: number,
		octaves: number = 4,
		persistence: number = 0.5,
		lacunarity: number = 2.0,
	): number {
		let total = 0;
		let amplitude = 1;
		let frequency = 1;
		let maxValue = 0;

		for (let i = 0; i < octaves; i++) {
			total += this.noise2D(x * frequency, y * frequency) * amplitude;
			maxValue += amplitude;
			amplitude *= persistence;
			frequency *= lacunarity;
		}

		return total / maxValue;
	}

	/**
	 * Ridge noise for mountain-like terrain
	 * @param x X coordinate
	 * @param y Y coordinate
	 * @param octaves Number of noise layers
	 * @returns Noise value
	 */
	public ridgeNoise2D(
		x: number,
		y: number,
		octaves: number = 4,
	): number {
		let total = 0;
		let amplitude = 1;
		let frequency = 1;
		let maxValue = 0;

		for (let i = 0; i < octaves; i++) {
			let n = this.noise2D(x * frequency, y * frequency);
			n = 1 - Math.abs(n); // Create ridges
			n = n * n; // Sharpen ridges
			total += n * amplitude;
			maxValue += amplitude;
			amplitude *= 0.5;
			frequency *= 2;
		}

		return total / maxValue;
	}

	/**
	 * Turbulence noise for clouds/distortion
	 * @param x X coordinate
	 * @param y Y coordinate
	 * @param octaves Number of noise layers
	 * @returns Noise value (always positive)
	 */
	public turbulence2D(
		x: number,
		y: number,
		octaves: number = 4,
	): number {
		let total = 0;
		let amplitude = 1;
		let frequency = 1;
		let maxValue = 0;

		for (let i = 0; i < octaves; i++) {
			total += Math.abs(this.noise2D(x * frequency, y * frequency)) * amplitude;
			maxValue += amplitude;
			amplitude *= 0.5;
			frequency *= 2;
		}

		return total / maxValue;
	}

	/**
	 * Get seed
	 */
	public getSeed(): number {
		return this.seed;
	}

	/**
	 * Set new seed
	 */
	public setSeed(seed: number): void {
		this.seed = seed;
		this.perm = this.generatePermutation(seed);
	}
}

// Default instance with world seed
let defaultInstance: PerlinNoise | null = null;

export function getPerlinNoise(seed?: number): PerlinNoise {
	if (seed !== undefined) {
		return new PerlinNoise(seed);
	}

	if (!defaultInstance) {
		// Use a consistent world seed
		defaultInstance = new PerlinNoise(42);
	}

	return defaultInstance;
}

export function setWorldSeed(seed: number): void {
	defaultInstance = new PerlinNoise(seed);
}
