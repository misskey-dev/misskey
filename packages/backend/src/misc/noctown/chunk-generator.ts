/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PerlinNoise, getPerlinNoise } from './perlin-noise.js';

// Chunk configuration
export const CHUNK_SIZE = 16; // 16x16 tiles per chunk

// Biome types
export type BiomeType = 'plains' | 'forest' | 'desert' | 'mountain' | 'ocean' | 'swamp' | 'tundra';

// Terrain tile types
export type TileType = 'grass' | 'dirt' | 'sand' | 'stone' | 'water' | 'snow' | 'mud';

// Environment object types
export type EnvironmentType = 'tree' | 'rock' | 'flower' | 'grass_tuft' | 'cactus' | 'bush' | 'mushroom' | 'ice_crystal';

// Building types
export type BuildingType = 'shop' | 'inn' | 'house' | 'guild' | 'barn' | 'well' | 'tower';

export interface EnvironmentObject {
	type: EnvironmentType;
	localX: number; // Position within chunk (0-15)
	localZ: number;
	variant: number; // Visual variant
	scale: number; // Size multiplier
}

export interface BuildingData {
	type: BuildingType;
	localX: number; // Position within chunk (0-15)
	localZ: number;
	rotation: number; // 0, 90, 180, 270 degrees
	width: number; // Building footprint
	depth: number;
	interiorId: string; // Reference to interior map
}

// Treasure chest rarity types
export type ChestRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface TreasureChestData {
	localX: number;
	localZ: number;
	rarity: ChestRarity;
	interiorId: string | null; // null = outdoor chest
}

// Pond data for fishing
export interface PondData {
	localX: number;
	localZ: number;
	width: number;
	depth: number;
	fishingSpots: Array<{ x: number; z: number }>;
}

export interface TerrainTile {
	height: number;
	type: TileType;
}

export interface ChunkTerrainData {
	heightMap: number[][];
	tileTypes: TileType[][];
	biome: BiomeType;
	environmentObjects: EnvironmentObject[];
	buildings: BuildingData[];
	treasureChests: TreasureChestData[];
	ponds: PondData[];
	isVillage: boolean;
	version: number;
}

// Biome configuration
interface BiomeConfig {
	baseHeight: number;
	heightVariation: number;
	tileType: TileType;
	treeDensity: number;
	rockDensity: number;
	flowerDensity: number;
	specialObjects: EnvironmentType[];
}

const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
	plains: {
		baseHeight: 8,
		heightVariation: 3,
		tileType: 'grass',
		treeDensity: 0.02,
		rockDensity: 0.01,
		flowerDensity: 0.05,
		specialObjects: ['flower', 'grass_tuft'],
	},
	forest: {
		baseHeight: 10,
		heightVariation: 5,
		tileType: 'grass',
		treeDensity: 0.15,
		rockDensity: 0.02,
		flowerDensity: 0.02,
		specialObjects: ['tree', 'bush', 'mushroom'],
	},
	desert: {
		baseHeight: 6,
		heightVariation: 2,
		tileType: 'sand',
		treeDensity: 0,
		rockDensity: 0.03,
		flowerDensity: 0,
		specialObjects: ['cactus', 'rock'],
	},
	mountain: {
		baseHeight: 20,
		heightVariation: 15,
		tileType: 'stone',
		treeDensity: 0.05,
		rockDensity: 0.1,
		flowerDensity: 0.01,
		specialObjects: ['rock', 'tree'],
	},
	ocean: {
		baseHeight: 2,
		heightVariation: 1,
		tileType: 'water',
		treeDensity: 0,
		rockDensity: 0,
		flowerDensity: 0,
		specialObjects: [],
	},
	swamp: {
		baseHeight: 5,
		heightVariation: 2,
		tileType: 'mud',
		treeDensity: 0.08,
		rockDensity: 0.02,
		flowerDensity: 0.01,
		specialObjects: ['tree', 'mushroom'],
	},
	tundra: {
		baseHeight: 7,
		heightVariation: 3,
		tileType: 'snow',
		treeDensity: 0.01,
		rockDensity: 0.02,
		flowerDensity: 0,
		specialObjects: ['ice_crystal', 'rock'],
	},
};

// Building configuration
interface BuildingConfig {
	width: number;
	depth: number;
	spawnRate: number; // Probability to spawn in village
}

const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
	shop: { width: 4, depth: 4, spawnRate: 0.8 },
	inn: { width: 5, depth: 4, spawnRate: 0.5 },
	house: { width: 3, depth: 3, spawnRate: 1.0 },
	guild: { width: 5, depth: 5, spawnRate: 0.3 },
	barn: { width: 4, depth: 5, spawnRate: 0.4 },
	well: { width: 2, depth: 2, spawnRate: 0.6 },
	tower: { width: 3, depth: 3, spawnRate: 0.2 },
};

export class ChunkGenerator {
	private noise: PerlinNoise;
	private biomeNoise: PerlinNoise;
	private detailNoise: PerlinNoise;
	private villageNoise: PerlinNoise;

	constructor(seed: number) {
		// Create separate noise generators for different purposes
		this.noise = new PerlinNoise(seed);
		this.biomeNoise = new PerlinNoise(seed + 12345);
		this.detailNoise = new PerlinNoise(seed + 67890);
		this.villageNoise = new PerlinNoise(seed + 111111);
	}

	/**
	 * Generate terrain data for a chunk
	 * @param chunkX Chunk X coordinate
	 * @param chunkZ Chunk Z coordinate
	 * @returns Complete terrain data for the chunk
	 */
	public generateChunk(chunkX: number, chunkZ: number): ChunkTerrainData {
		// Determine biome for this chunk
		const biome = this.determineBiome(chunkX, chunkZ);
		const biomeConfig = BIOME_CONFIGS[biome];

		// Check if this chunk is a village
		const isVillage = this.isVillageChunk(chunkX, chunkZ, biome);

		// Generate height map
		const heightMap = this.generateHeightMap(chunkX, chunkZ, biomeConfig);

		// Generate tile types
		const tileTypes = this.generateTileTypes(heightMap, biome, biomeConfig);

		// Generate buildings if village
		const buildings = isVillage
			? this.generateBuildings(chunkX, chunkZ, heightMap)
			: [];

		// Get occupied tiles from buildings
		const occupiedTiles = new Set<string>();
		for (const building of buildings) {
			for (let dx = -1; dx < building.width + 1; dx++) {
				for (let dz = -1; dz < building.depth + 1; dz++) {
					const x = building.localX + dx;
					const z = building.localZ + dz;
					if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
						occupiedTiles.add(`${x},${z}`);
					}
				}
			}
		}

		// Generate environment objects (avoid building areas)
		const environmentObjects = this.generateEnvironmentObjects(
			chunkX,
			chunkZ,
			heightMap,
			biome,
			biomeConfig,
			occupiedTiles,
		);

		// Generate treasure chests
		const treasureChests = this.generateTreasureChests(
			chunkX,
			chunkZ,
			buildings,
			occupiedTiles,
			heightMap,
			isVillage,
		);

		// Generate ponds for fishing
		const ponds = this.generatePonds(
			chunkX,
			chunkZ,
			biome,
			occupiedTiles,
			heightMap,
		);

		return {
			heightMap,
			tileTypes,
			biome,
			environmentObjects,
			buildings,
			treasureChests,
			ponds,
			isVillage,
			version: 5, // Version 5 adds ponds
		};
	}

	/**
	 * Check if a chunk should be a village
	 */
	private isVillageChunk(chunkX: number, chunkZ: number, biome: BiomeType): boolean {
		// Villages only spawn in plains, forest, or desert
		if (biome !== 'plains' && biome !== 'forest' && biome !== 'desert') {
			return false;
		}

		// Use village noise to determine village locations
		// Villages are sparse - about 1 per 64 chunks (8x8 area)
		const worldX = chunkX * CHUNK_SIZE;
		const worldZ = chunkZ * CHUNK_SIZE;

		const villageValue = this.villageNoise.noise2D(
			worldX * 0.005,
			worldZ * 0.005,
		);

		// Only very high values create villages (top ~5%)
		return villageValue > 0.8;
	}

	/**
	 * Generate buildings for a village chunk
	 */
	private generateBuildings(
		chunkX: number,
		chunkZ: number,
		heightMap: number[][],
	): BuildingData[] {
		const buildings: BuildingData[] = [];
		const occupiedAreas: Array<{ x: number; z: number; w: number; d: number }> = [];

		// Village always has a central well
		const centerX = 7;
		const centerZ = 7;
		buildings.push(this.createBuilding('well', centerX, centerZ, chunkX, chunkZ, 0));
		occupiedAreas.push({
			x: centerX - 1,
			z: centerZ - 1,
			w: BUILDING_CONFIGS.well.width + 2,
			d: BUILDING_CONFIGS.well.depth + 2,
		});

		// Try to place other buildings around the well
		const buildingTypes: BuildingType[] = ['shop', 'inn', 'house', 'house', 'house', 'guild', 'barn'];

		for (const type of buildingTypes) {
			const config = BUILDING_CONFIGS[type];

			// Check spawn rate
			const spawnNoise = this.detailNoise.noise2D(
				chunkX * 100 + buildings.length * 17,
				chunkZ * 100 + buildings.length * 23,
			);
			if ((spawnNoise + 1) * 0.5 > config.spawnRate) continue;

			// Try multiple positions to find valid spot
			for (let attempt = 0; attempt < 10; attempt++) {
				const posNoise1 = this.detailNoise.noise2D(
					chunkX * 50 + attempt * 7 + buildings.length * 13,
					chunkZ * 50 + attempt * 11 + buildings.length * 17,
				);
				const posNoise2 = this.detailNoise.noise2D(
					chunkX * 50 + attempt * 13 + buildings.length * 7,
					chunkZ * 50 + attempt * 17 + buildings.length * 11,
				);

				// Convert noise to position (leave margin from chunk edges)
				const margin = Math.max(config.width, config.depth) + 1;
				const posX = Math.floor((posNoise1 + 1) * 0.5 * (CHUNK_SIZE - margin * 2)) + margin;
				const posZ = Math.floor((posNoise2 + 1) * 0.5 * (CHUNK_SIZE - margin * 2)) + margin;

				// Check if position is valid (not overlapping other buildings)
				if (this.canPlaceBuilding(posX, posZ, config.width, config.depth, occupiedAreas, heightMap)) {
					const rotation = Math.floor((posNoise1 * 100) % 4) * 90;
					buildings.push(this.createBuilding(type, posX, posZ, chunkX, chunkZ, rotation));
					occupiedAreas.push({
						x: posX - 1,
						z: posZ - 1,
						w: config.width + 2,
						d: config.depth + 2,
					});
					break;
				}
			}
		}

		return buildings;
	}

	/**
	 * Check if a building can be placed at given position
	 */
	private canPlaceBuilding(
		x: number,
		z: number,
		width: number,
		depth: number,
		occupiedAreas: Array<{ x: number; z: number; w: number; d: number }>,
		heightMap: number[][],
	): boolean {
		// Check bounds
		if (x < 1 || z < 1 || x + width >= CHUNK_SIZE - 1 || z + depth >= CHUNK_SIZE - 1) {
			return false;
		}

		// Check height variation (buildings need flat ground)
		let minHeight = Infinity;
		let maxHeight = -Infinity;
		for (let dx = 0; dx < width; dx++) {
			for (let dz = 0; dz < depth; dz++) {
				const h = heightMap[x + dx]?.[z + dz] ?? 0;
				minHeight = Math.min(minHeight, h);
				maxHeight = Math.max(maxHeight, h);
			}
		}
		if (maxHeight - minHeight > 2) return false; // Too much slope

		// Check water (no buildings on water)
		if (minHeight <= 3) return false;

		// Check overlap with existing buildings
		for (const area of occupiedAreas) {
			if (
				x < area.x + area.w &&
				x + width > area.x &&
				z < area.z + area.d &&
				z + depth > area.z
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Create a building data object
	 */
	private createBuilding(
		type: BuildingType,
		localX: number,
		localZ: number,
		chunkX: number,
		chunkZ: number,
		rotation: number,
	): BuildingData {
		const config = BUILDING_CONFIGS[type];
		// Generate unique interior ID based on position
		const interiorId = `interior_${chunkX}_${chunkZ}_${localX}_${localZ}`;

		return {
			type,
			localX,
			localZ,
			rotation,
			width: config.width,
			depth: config.depth,
			interiorId,
		};
	}

	/**
	 * Generate treasure chests in the chunk
	 */
	private generateTreasureChests(
		chunkX: number,
		chunkZ: number,
		buildings: BuildingData[],
		occupiedTiles: Set<string>,
		heightMap: number[][],
		isVillage: boolean,
	): TreasureChestData[] {
		const chests: TreasureChestData[] = [];

		// Village buildings have indoor chests
		if (isVillage) {
			for (const building of buildings) {
				// Only houses and some other buildings have chests
				if (building.type === 'house' || building.type === 'barn' || building.type === 'tower') {
					const chestNoise = this.detailNoise.noise2D(
						chunkX * 100 + building.localX,
						chunkZ * 100 + building.localZ,
					);

					// 70% chance of chest in eligible buildings
					if ((chestNoise + 1) * 0.5 < 0.7) {
						const rarity = this.determineChestRarity(chestNoise, building.type);
						chests.push({
							localX: building.localX + Math.floor(building.width / 2),
							localZ: building.localZ + Math.floor(building.depth / 2),
							rarity,
							interiorId: building.interiorId,
						});
					}
				}
			}
		}

		// Outdoor chests (rare, ~2% chance per chunk)
		const outdoorChestNoise = this.villageNoise.noise2D(
			chunkX * 0.1 + 5000,
			chunkZ * 0.1 + 5000,
		);

		if (outdoorChestNoise > 0.9) {
			// Find a valid position for outdoor chest
			for (let attempt = 0; attempt < 5; attempt++) {
				const posNoise1 = this.detailNoise.noise2D(
					chunkX * 30 + attempt * 7,
					chunkZ * 30 + attempt * 11,
				);
				const posNoise2 = this.detailNoise.noise2D(
					chunkX * 30 + attempt * 11,
					chunkZ * 30 + attempt * 7,
				);

				const x = Math.floor((posNoise1 + 1) * 0.5 * (CHUNK_SIZE - 2)) + 1;
				const z = Math.floor((posNoise2 + 1) * 0.5 * (CHUNK_SIZE - 2)) + 1;

				// Skip if occupied or water
				if (occupiedTiles.has(`${x},${z}`)) continue;
				if (heightMap[x]?.[z] <= 3) continue;

				const rarity = this.determineChestRarity(outdoorChestNoise, null);
				chests.push({
					localX: x,
					localZ: z,
					rarity,
					interiorId: null,
				});
				break;
			}
		}

		return chests;
	}

	/**
	 * Determine chest rarity based on noise and context
	 */
	private determineChestRarity(noise: number, buildingType: BuildingType | null): ChestRarity {
		const normalizedNoise = (noise + 1) * 0.5;

		// Tower chests are rarer
		if (buildingType === 'tower') {
			if (normalizedNoise > 0.9) return 'legendary';
			if (normalizedNoise > 0.7) return 'epic';
			if (normalizedNoise > 0.5) return 'rare';
			return 'uncommon';
		}

		// Outdoor chests are generally rarer
		if (buildingType === null) {
			if (normalizedNoise > 0.95) return 'epic';
			if (normalizedNoise > 0.85) return 'rare';
			return 'uncommon';
		}

		// Regular building chests
		if (normalizedNoise > 0.95) return 'rare';
		if (normalizedNoise > 0.7) return 'uncommon';
		return 'common';
	}

	/**
	 * Determine the biome for a chunk based on temperature and moisture
	 */
	private determineBiome(chunkX: number, chunkZ: number): BiomeType {
		// Use biome noise at a larger scale for smooth transitions
		const worldX = chunkX * CHUNK_SIZE;
		const worldZ = chunkZ * CHUNK_SIZE;

		// Temperature: varies with X (east-west)
		const temperature = this.biomeNoise.fbm2D(
			worldX * 0.002,
			worldZ * 0.002,
			4,
			0.5,
			2,
		);

		// Moisture: varies with Z (north-south) and adds some variation
		const moisture = this.biomeNoise.fbm2D(
			worldX * 0.002 + 1000,
			worldZ * 0.002 + 1000,
			4,
			0.5,
			2,
		);

		// Altitude check for mountains
		const altitude = this.noise.ridgeNoise2D(
			worldX * 0.005,
			worldZ * 0.005,
			3,
		);

		// Biome selection based on temperature and moisture
		if (altitude > 0.7) {
			return 'mountain';
		}

		if (altitude < 0.15) {
			return 'ocean';
		}

		// Temperature ranges: cold (-1 to -0.3), temperate (-0.3 to 0.3), hot (0.3 to 1)
		// Moisture ranges: dry (-1 to -0.3), normal (-0.3 to 0.3), wet (0.3 to 1)

		if (temperature < -0.3) {
			// Cold
			return 'tundra';
		} else if (temperature > 0.4) {
			// Hot
			if (moisture < 0) {
				return 'desert';
			} else {
				return 'swamp';
			}
		} else {
			// Temperate
			if (moisture > 0.2) {
				return 'forest';
			} else {
				return 'plains';
			}
		}
	}

	/**
	 * Generate height map for a chunk
	 */
	private generateHeightMap(
		chunkX: number,
		chunkZ: number,
		biomeConfig: BiomeConfig,
	): number[][] {
		const heightMap: number[][] = [];

		for (let x = 0; x < CHUNK_SIZE; x++) {
			heightMap[x] = [];
			for (let z = 0; z < CHUNK_SIZE; z++) {
				// Convert to world coordinates
				const worldX = chunkX * CHUNK_SIZE + x;
				const worldZ = chunkZ * CHUNK_SIZE + z;

				// Base terrain using fBm
				const baseNoise = this.noise.fbm2D(
					worldX * 0.02,
					worldZ * 0.02,
					4,
					0.5,
					2,
				);

				// Add detail noise
				const detailNoise = this.detailNoise.noise2D(
					worldX * 0.1,
					worldZ * 0.1,
				) * 0.2;

				// Calculate height based on biome
				const normalizedNoise = (baseNoise + 1) * 0.5; // Convert from [-1,1] to [0,1]
				const height = biomeConfig.baseHeight +
					normalizedNoise * biomeConfig.heightVariation +
					detailNoise * biomeConfig.heightVariation * 0.5;

				// Ensure positive height
				heightMap[x][z] = Math.max(1, Math.round(height));
			}
		}

		return heightMap;
	}

	/**
	 * Generate tile types based on height and biome
	 */
	private generateTileTypes(
		heightMap: number[][],
		biome: BiomeType,
		biomeConfig: BiomeConfig,
	): TileType[][] {
		const tileTypes: TileType[][] = [];

		for (let x = 0; x < CHUNK_SIZE; x++) {
			tileTypes[x] = [];
			for (let z = 0; z < CHUNK_SIZE; z++) {
				const height = heightMap[x][z];

				// Determine tile type based on height and biome
				if (biome === 'ocean' || height <= 3) {
					tileTypes[x][z] = 'water';
				} else if (biome === 'mountain' && height > 25) {
					tileTypes[x][z] = 'snow';
				} else if (biome === 'mountain' && height > 18) {
					tileTypes[x][z] = 'stone';
				} else {
					tileTypes[x][z] = biomeConfig.tileType;
				}
			}
		}

		return tileTypes;
	}

	/**
	 * Generate environment objects (trees, rocks, etc.)
	 */
	private generateEnvironmentObjects(
		chunkX: number,
		chunkZ: number,
		heightMap: number[][],
		biome: BiomeType,
		biomeConfig: BiomeConfig,
		occupiedTiles: Set<string> = new Set(),
	): EnvironmentObject[] {
		const objects: EnvironmentObject[] = [];

		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let z = 0; z < CHUNK_SIZE; z++) {
				// Skip tiles occupied by buildings
				if (occupiedTiles.has(`${x},${z}`)) continue;

				const worldX = chunkX * CHUNK_SIZE + x;
				const worldZ = chunkZ * CHUNK_SIZE + z;
				const height = heightMap[x][z];

				// Skip water tiles
				if (height <= 3 || biome === 'ocean') continue;

				// Use noise for placement density
				const placementNoise = this.detailNoise.noise2D(
					worldX * 0.5 + 5000,
					worldZ * 0.5 + 5000,
				);
				const normalizedNoise = (placementNoise + 1) * 0.5;

				// Try to place tree
				if (normalizedNoise < biomeConfig.treeDensity) {
					objects.push(this.createEnvironmentObject('tree', x, z, worldX, worldZ));
					continue; // Only one object per tile
				}

				// Try to place rock
				const rockNoise = this.detailNoise.noise2D(
					worldX * 0.5 + 10000,
					worldZ * 0.5 + 10000,
				);
				if ((rockNoise + 1) * 0.5 < biomeConfig.rockDensity) {
					objects.push(this.createEnvironmentObject('rock', x, z, worldX, worldZ));
					continue;
				}

				// Try to place flowers/grass
				const flowerNoise = this.detailNoise.noise2D(
					worldX * 0.5 + 15000,
					worldZ * 0.5 + 15000,
				);
				if ((flowerNoise + 1) * 0.5 < biomeConfig.flowerDensity) {
					const type = biomeConfig.specialObjects.length > 0
						? biomeConfig.specialObjects[Math.abs(Math.floor(flowerNoise * 10)) % biomeConfig.specialObjects.length]
						: 'flower';
					objects.push(this.createEnvironmentObject(type, x, z, worldX, worldZ));
				}
			}
		}

		return objects;
	}

	/**
	 * Create an environment object with deterministic properties
	 */
	private createEnvironmentObject(
		type: EnvironmentType,
		localX: number,
		localZ: number,
		worldX: number,
		worldZ: number,
	): EnvironmentObject {
		// Use position for deterministic randomness
		const variantNoise = this.detailNoise.noise2D(worldX * 10, worldZ * 10);
		const scaleNoise = this.detailNoise.noise2D(worldX * 10 + 1000, worldZ * 10 + 1000);

		return {
			type,
			localX,
			localZ,
			variant: Math.abs(Math.floor(variantNoise * 10)) % 4, // 4 variants per type
			scale: 0.8 + (scaleNoise + 1) * 0.2, // Scale from 0.8 to 1.2
		};
	}

	/**
	 * Get biome at a specific world position
	 */
	public getBiomeAt(worldX: number, worldZ: number): BiomeType {
		const chunkX = Math.floor(worldX / CHUNK_SIZE);
		const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
		return this.determineBiome(chunkX, chunkZ);
	}

	/**
	 * Generate ponds for fishing in the chunk
	 */
	private generatePonds(
		chunkX: number,
		chunkZ: number,
		biome: BiomeType,
		occupiedTiles: Set<string>,
		heightMap: number[][],
	): PondData[] {
		const ponds: PondData[] = [];

		// Ponds only spawn in certain biomes
		const pondBiomes: BiomeType[] = ['plains', 'forest', 'swamp'];
		if (!pondBiomes.includes(biome)) {
			return ponds;
		}

		// Pond spawn probability based on biome
		const pondProbability: Record<string, number> = {
			plains: 0.15,
			forest: 0.10,
			swamp: 0.25,
		};

		// Check if this chunk should have a pond
		const pondNoise = this.villageNoise.noise2D(
			chunkX * 0.3 + 2000,
			chunkZ * 0.3 + 2000,
		);
		const normalizedNoise = (pondNoise + 1) * 0.5;

		if (normalizedNoise > (1 - (pondProbability[biome] ?? 0.1))) {
			// Find suitable location for pond
			const posNoise1 = this.detailNoise.noise2D(
				chunkX * 20 + 3000,
				chunkZ * 20 + 3000,
			);
			const posNoise2 = this.detailNoise.noise2D(
				chunkX * 20 + 4000,
				chunkZ * 20 + 4000,
			);

			// Pond size (3-6 tiles)
			const sizeNoise = this.detailNoise.noise2D(
				chunkX * 15 + 5000,
				chunkZ * 15 + 5000,
			);
			const width = 3 + Math.floor((sizeNoise + 1) * 1.5); // 3-6
			const depth = 3 + Math.floor(((sizeNoise * 0.7) + 1) * 1.5); // 3-6

			// Position with margin for pond size
			const margin = Math.max(width, depth) + 1;
			const centerX = Math.floor((posNoise1 + 1) * 0.5 * (CHUNK_SIZE - margin * 2)) + margin;
			const centerZ = Math.floor((posNoise2 + 1) * 0.5 * (CHUNK_SIZE - margin * 2)) + margin;

			// Validate pond placement
			if (this.canPlacePond(centerX, centerZ, width, depth, occupiedTiles, heightMap)) {
				// Generate fishing spots around the pond edges
				const fishingSpots = this.generateFishingSpots(centerX, centerZ, width, depth, chunkX, chunkZ);

				// Mark pond tiles as occupied
				for (let dx = -Math.floor(width / 2); dx <= Math.ceil(width / 2); dx++) {
					for (let dz = -Math.floor(depth / 2); dz <= Math.ceil(depth / 2); dz++) {
						const x = centerX + dx;
						const z = centerZ + dz;
						if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
							occupiedTiles.add(`${x},${z}`);
						}
					}
				}

				ponds.push({
					localX: centerX,
					localZ: centerZ,
					width,
					depth,
					fishingSpots,
				});
			}
		}

		return ponds;
	}

	/**
	 * Check if a pond can be placed at given position
	 */
	private canPlacePond(
		centerX: number,
		centerZ: number,
		width: number,
		depth: number,
		occupiedTiles: Set<string>,
		heightMap: number[][],
	): boolean {
		const halfWidth = Math.floor(width / 2);
		const halfDepth = Math.floor(depth / 2);

		// Check bounds
		if (centerX - halfWidth < 1 || centerZ - halfDepth < 1) return false;
		if (centerX + halfWidth >= CHUNK_SIZE - 1 || centerZ + halfDepth >= CHUNK_SIZE - 1) return false;

		// Check for occupied tiles and suitable height
		let avgHeight = 0;
		let tileCount = 0;

		for (let dx = -halfWidth; dx <= halfWidth; dx++) {
			for (let dz = -halfDepth; dz <= halfDepth; dz++) {
				const x = centerX + dx;
				const z = centerZ + dz;

				if (occupiedTiles.has(`${x},${z}`)) return false;

				const height = heightMap[x]?.[z] ?? 0;
				// Ponds shouldn't be in existing water or too high
				if (height <= 3 || height > 15) return false;

				avgHeight += height;
				tileCount++;
			}
		}

		// Check that ground is relatively flat
		avgHeight /= tileCount;
		for (let dx = -halfWidth; dx <= halfWidth; dx++) {
			for (let dz = -halfDepth; dz <= halfDepth; dz++) {
				const x = centerX + dx;
				const z = centerZ + dz;
				const height = heightMap[x]?.[z] ?? 0;
				if (Math.abs(height - avgHeight) > 2) return false;
			}
		}

		return true;
	}

	/**
	 * Generate fishing spots around pond edges
	 */
	private generateFishingSpots(
		centerX: number,
		centerZ: number,
		width: number,
		depth: number,
		chunkX: number,
		chunkZ: number,
	): Array<{ x: number; z: number }> {
		const spots: Array<{ x: number; z: number }> = [];
		const halfWidth = Math.floor(width / 2);
		const halfDepth = Math.floor(depth / 2);

		// Generate 3-6 fishing spots around the pond edge
		const spotNoise = this.detailNoise.noise2D(
			chunkX * 25 + 6000,
			chunkZ * 25 + 6000,
		);
		const spotCount = 3 + Math.floor((spotNoise + 1) * 1.5);

		// Possible edge positions (one tile outside the pond)
		const edgePositions: Array<{ x: number; z: number }> = [];

		// Top and bottom edges
		for (let dx = -halfWidth; dx <= halfWidth; dx++) {
			edgePositions.push({ x: centerX + dx, z: centerZ - halfDepth - 1 });
			edgePositions.push({ x: centerX + dx, z: centerZ + halfDepth + 1 });
		}

		// Left and right edges
		for (let dz = -halfDepth; dz <= halfDepth; dz++) {
			edgePositions.push({ x: centerX - halfWidth - 1, z: centerZ + dz });
			edgePositions.push({ x: centerX + halfWidth + 1, z: centerZ + dz });
		}

		// Filter valid positions (within chunk bounds)
		const validPositions = edgePositions.filter(
			pos => pos.x >= 0 && pos.x < CHUNK_SIZE && pos.z >= 0 && pos.z < CHUNK_SIZE,
		);

		// Select spots using deterministic noise
		for (let i = 0; i < Math.min(spotCount, validPositions.length); i++) {
			const selectNoise = this.detailNoise.noise2D(
				chunkX * 30 + i * 100 + 7000,
				chunkZ * 30 + i * 100 + 7000,
			);
			const index = Math.floor((selectNoise + 1) * 0.5 * validPositions.length);
			const pos = validPositions[index % validPositions.length];

			// Avoid duplicate spots
			if (!spots.some(s => s.x === pos.x && s.z === pos.z)) {
				spots.push(pos);
			}
		}

		return spots;
	}

	/**
	 * Get height at a specific world position
	 */
	public getHeightAt(worldX: number, worldZ: number): number {
		const chunkX = Math.floor(worldX / CHUNK_SIZE);
		const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
		const biome = this.determineBiome(chunkX, chunkZ);
		const biomeConfig = BIOME_CONFIGS[biome];

		// Base terrain using fBm
		const baseNoise = this.noise.fbm2D(
			worldX * 0.02,
			worldZ * 0.02,
			4,
			0.5,
			2,
		);

		// Add detail noise
		const detailNoise = this.detailNoise.noise2D(
			worldX * 0.1,
			worldZ * 0.1,
		) * 0.2;

		const normalizedNoise = (baseNoise + 1) * 0.5;
		const height = biomeConfig.baseHeight +
			normalizedNoise * biomeConfig.heightVariation +
			detailNoise * biomeConfig.heightVariation * 0.5;

		return Math.max(1, height);
	}
}

// Default instance management
let defaultGenerator: ChunkGenerator | null = null;
let currentSeed: number | null = null;

export function getChunkGenerator(seed: number): ChunkGenerator {
	if (!defaultGenerator || currentSeed !== seed) {
		defaultGenerator = new ChunkGenerator(seed);
		currentSeed = seed;
	}
	return defaultGenerator;
}

export function createChunkGenerator(seed: number): ChunkGenerator {
	return new ChunkGenerator(seed);
}
