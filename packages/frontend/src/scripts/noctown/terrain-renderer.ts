/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export type BiomeType = 'plains' | 'forest' | 'desert' | 'mountain' | 'ocean' | 'swamp' | 'tundra';
export type TileType = 'grass' | 'dirt' | 'sand' | 'stone' | 'water' | 'snow' | 'mud';

export interface ChunkTerrainData {
	heightMap: number[][];
	tileTypes: TileType[][];
	biome: BiomeType;
}

interface TerrainChunk {
	mesh: THREE.Mesh;
	waterMesh: THREE.Mesh | null;
	chunkX: number;
	chunkZ: number;
}

// Colors for different terrain types
const TILE_COLORS: Record<TileType, number> = {
	grass: 0x4a8c3a,
	dirt: 0x8b6914,
	sand: 0xd4b896,
	stone: 0x808080,
	water: 0x3399ff,
	snow: 0xfafafa,
	mud: 0x5c4033,
};

// Secondary colors for variation
const TILE_COLORS_ALT: Record<TileType, number> = {
	grass: 0x5a9c4a,
	dirt: 0x9b7924,
	sand: 0xc4a886,
	stone: 0x707070,
	water: 0x4488ee,
	snow: 0xf0f0f0,
	mud: 0x6c5043,
};

// Biome-specific terrain adjustments
const BIOME_ADJUSTMENTS: Record<BiomeType, { colorMod: number; roughness: number; metalness: number }> = {
	plains: { colorMod: 1.0, roughness: 0.8, metalness: 0.0 },
	forest: { colorMod: 0.9, roughness: 0.9, metalness: 0.0 },
	desert: { colorMod: 1.1, roughness: 0.7, metalness: 0.0 },
	mountain: { colorMod: 0.85, roughness: 0.95, metalness: 0.1 },
	ocean: { colorMod: 1.0, roughness: 0.3, metalness: 0.2 },
	swamp: { colorMod: 0.8, roughness: 0.9, metalness: 0.0 },
	tundra: { colorMod: 1.05, roughness: 0.6, metalness: 0.0 },
};

const CHUNK_SIZE = 16;
const TILE_SIZE = 1;
const WATER_LEVEL = 3;

/**
 * Terrain renderer for Noctown.
 * Generates and renders terrain meshes with proper texturing and LOD.
 */
export class TerrainRenderer {
	private scene: THREE.Scene;
	private chunks: Map<string, TerrainChunk> = new Map();
	private materials: Map<string, THREE.Material> = new Map();
	private waterMaterial: THREE.Material | null = null;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.initializeMaterials();
	}

	/**
	 * Initialize shared materials.
	 */
	private initializeMaterials(): void {
		// Create materials for each tile type
		for (const tileType of Object.keys(TILE_COLORS) as TileType[]) {
			if (tileType === 'water') continue; // Water handled separately

			const material = new THREE.MeshStandardMaterial({
				color: TILE_COLORS[tileType],
				roughness: 0.8,
				metalness: 0.0,
				flatShading: false,
			});
			this.materials.set(tileType, material);
		}

		// Water material with transparency
		this.waterMaterial = new THREE.MeshStandardMaterial({
			color: TILE_COLORS.water,
			transparent: true,
			opacity: 0.7,
			roughness: 0.1,
			metalness: 0.3,
			side: THREE.DoubleSide,
		});
	}

	/**
	 * Generate and add a terrain chunk to the scene.
	 */
	public addChunk(chunkX: number, chunkZ: number, data: ChunkTerrainData): void {
		const key = `${chunkX},${chunkZ}`;

		// Remove existing chunk if present
		this.removeChunk(chunkX, chunkZ);

		// Generate terrain geometry
		const { mesh, waterMesh } = this.generateChunkMesh(chunkX, chunkZ, data);

		this.scene.add(mesh);
		if (waterMesh) {
			this.scene.add(waterMesh);
		}

		this.chunks.set(key, { mesh, waterMesh, chunkX, chunkZ });
	}

	/**
	 * Remove a terrain chunk from the scene.
	 */
	public removeChunk(chunkX: number, chunkZ: number): void {
		const key = `${chunkX},${chunkZ}`;
		const chunk = this.chunks.get(key);

		if (chunk) {
			this.scene.remove(chunk.mesh);
			chunk.mesh.geometry.dispose();

			if (chunk.waterMesh) {
				this.scene.remove(chunk.waterMesh);
				chunk.waterMesh.geometry.dispose();
			}

			this.chunks.delete(key);
		}
	}

	/**
	 * Generate mesh for a terrain chunk.
	 */
	private generateChunkMesh(
		chunkX: number,
		chunkZ: number,
		data: ChunkTerrainData,
	): { mesh: THREE.Mesh; waterMesh: THREE.Mesh | null } {
		const biomeAdjust = BIOME_ADJUSTMENTS[data.biome];

		// Create geometry with vertices for each tile corner
		const segmentsX = CHUNK_SIZE;
		const segmentsZ = CHUNK_SIZE;
		const geometry = new THREE.PlaneGeometry(
			CHUNK_SIZE * TILE_SIZE,
			CHUNK_SIZE * TILE_SIZE,
			segmentsX,
			segmentsZ,
		);

		// Rotate to be horizontal (XZ plane)
		geometry.rotateX(-Math.PI / 2);

		// Apply height map to vertices
		const positions = geometry.attributes.position;
		const colors: number[] = [];

		for (let i = 0; i <= segmentsZ; i++) {
			for (let j = 0; j <= segmentsX; j++) {
				const idx = i * (segmentsX + 1) + j;

				// Get height from height map (interpolated for edge vertices)
				const mapX = Math.min(j, CHUNK_SIZE - 1);
				const mapZ = Math.min(i, CHUNK_SIZE - 1);
				const height = data.heightMap[mapX]?.[mapZ] ?? 0;

				// Set Y position (height)
				positions.setY(idx, height * 0.5); // Scale height

				// Get tile type and color
				const tileType = data.tileTypes[mapX]?.[mapZ] ?? 'grass';
				const baseColor = new THREE.Color(TILE_COLORS[tileType]);
				const altColor = new THREE.Color(TILE_COLORS_ALT[tileType]);

				// Add some variation based on position
				const variation = Math.sin(mapX * 0.5) * Math.cos(mapZ * 0.7) * 0.5 + 0.5;
				const finalColor = baseColor.clone().lerp(altColor, variation);

				// Apply biome color modification
				finalColor.multiplyScalar(biomeAdjust.colorMod);

				// Add color for this vertex
				colors.push(finalColor.r, finalColor.g, finalColor.b);
			}
		}

		// Set vertex colors
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		// Recalculate normals for proper lighting
		geometry.computeVertexNormals();

		// Create material with vertex colors
		const material = new THREE.MeshStandardMaterial({
			vertexColors: true,
			roughness: biomeAdjust.roughness,
			metalness: biomeAdjust.metalness,
			flatShading: data.biome === 'mountain', // Flat shading for mountains
		});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.receiveShadow = true;
		mesh.castShadow = false;

		// Position the chunk in world space
		const worldX = chunkX * CHUNK_SIZE * TILE_SIZE;
		const worldZ = chunkZ * CHUNK_SIZE * TILE_SIZE;
		mesh.position.set(worldX, 0, worldZ);

		// Generate water mesh if there's water in this chunk
		const waterMesh = this.generateWaterMesh(chunkX, chunkZ, data);

		return { mesh, waterMesh };
	}

	/**
	 * Generate water surface mesh for a chunk.
	 */
	private generateWaterMesh(
		chunkX: number,
		chunkZ: number,
		data: ChunkTerrainData,
	): THREE.Mesh | null {
		// Check if there's any water in this chunk
		let hasWater = false;
		for (let x = 0; x < CHUNK_SIZE; x++) {
			for (let z = 0; z < CHUNK_SIZE; z++) {
				if (data.tileTypes[x]?.[z] === 'water' || data.heightMap[x]?.[z] <= WATER_LEVEL) {
					hasWater = true;
					break;
				}
			}
			if (hasWater) break;
		}

		if (!hasWater) return null;

		// Create flat water surface
		const geometry = new THREE.PlaneGeometry(
			CHUNK_SIZE * TILE_SIZE,
			CHUNK_SIZE * TILE_SIZE,
			1,
			1,
		);
		geometry.rotateX(-Math.PI / 2);

		const mesh = new THREE.Mesh(geometry, this.waterMaterial!);
		mesh.receiveShadow = false;
		mesh.castShadow = false;

		const worldX = chunkX * CHUNK_SIZE * TILE_SIZE;
		const worldZ = chunkZ * CHUNK_SIZE * TILE_SIZE;
		mesh.position.set(worldX, WATER_LEVEL * 0.5, worldZ);

		return mesh;
	}

	/**
	 * Get height at a world position.
	 */
	public getHeightAt(worldX: number, worldZ: number): number {
		const chunkX = Math.floor(worldX / (CHUNK_SIZE * TILE_SIZE));
		const chunkZ = Math.floor(worldZ / (CHUNK_SIZE * TILE_SIZE));
		const key = `${chunkX},${chunkZ}`;

		const chunk = this.chunks.get(key);
		if (!chunk) return 0;

		// Get local position within chunk
		const localX = (worldX - chunkX * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE;
		const localZ = (worldZ - chunkZ * CHUNK_SIZE * TILE_SIZE) / TILE_SIZE;

		// Sample height from mesh geometry
		const geometry = chunk.mesh.geometry;
		const positions = geometry.attributes.position;

		// Get the four corners of the tile
		const ix = Math.floor(localX);
		const iz = Math.floor(localZ);
		const fx = localX - ix;
		const fz = localZ - iz;

		const segmentsX = CHUNK_SIZE;
		const getHeight = (x: number, z: number) => {
			const idx = z * (segmentsX + 1) + x;
			return positions.getY(idx);
		};

		// Bilinear interpolation
		const h00 = getHeight(Math.min(ix, CHUNK_SIZE), Math.min(iz, CHUNK_SIZE));
		const h10 = getHeight(Math.min(ix + 1, CHUNK_SIZE), Math.min(iz, CHUNK_SIZE));
		const h01 = getHeight(Math.min(ix, CHUNK_SIZE), Math.min(iz + 1, CHUNK_SIZE));
		const h11 = getHeight(Math.min(ix + 1, CHUNK_SIZE), Math.min(iz + 1, CHUNK_SIZE));

		const h0 = h00 * (1 - fx) + h10 * fx;
		const h1 = h01 * (1 - fx) + h11 * fx;
		return h0 * (1 - fz) + h1 * fz;
	}

	/**
	 * Check if a position is walkable (not water).
	 */
	public isWalkableAt(worldX: number, worldZ: number): boolean {
		const height = this.getHeightAt(worldX, worldZ);
		return height > WATER_LEVEL * 0.5;
	}

	/**
	 * Update water animation.
	 */
	public updateWater(time: number): void {
		// Animate water opacity for wave effect
		if (this.waterMaterial instanceof THREE.MeshStandardMaterial) {
			const wave = Math.sin(time * 2) * 0.05;
			this.waterMaterial.opacity = 0.7 + wave;
		}

		// Update water mesh positions for wave effect
		for (const chunk of this.chunks.values()) {
			if (chunk.waterMesh) {
				const wave = Math.sin(time * 1.5 + chunk.chunkX + chunk.chunkZ) * 0.1;
				chunk.waterMesh.position.y = WATER_LEVEL * 0.5 + wave;
			}
		}
	}

	/**
	 * Get all loaded chunk keys.
	 */
	public getLoadedChunks(): string[] {
		return Array.from(this.chunks.keys());
	}

	/**
	 * Check if a chunk is loaded.
	 */
	public hasChunk(chunkX: number, chunkZ: number): boolean {
		return this.chunks.has(`${chunkX},${chunkZ}`);
	}

	/**
	 * Remove all chunks.
	 */
	public removeAllChunks(): void {
		for (const key of this.chunks.keys()) {
			const [x, z] = key.split(',').map(Number);
			this.removeChunk(x, z);
		}
	}

	/**
	 * Dispose of all resources.
	 */
	public dispose(): void {
		this.removeAllChunks();

		for (const material of this.materials.values()) {
			material.dispose();
		}
		this.materials.clear();

		if (this.waterMaterial) {
			this.waterMaterial.dispose();
			this.waterMaterial = null;
		}
	}
}
