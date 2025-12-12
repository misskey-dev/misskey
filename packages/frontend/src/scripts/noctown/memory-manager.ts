/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';
import { EnvironmentObjectFactory } from './environment-objects.js';

export interface MemoryConfig {
	maxCachedChunks: number;
	maxCachedTextures: number;
	chunkUnloadDistance: number;
	memoryCheckInterval: number;
	memoryWarningThreshold: number; // MB
}

const DEFAULT_CONFIG: MemoryConfig = {
	maxCachedChunks: 100,
	maxCachedTextures: 50,
	chunkUnloadDistance: 64, // Unload chunks further than this distance
	memoryCheckInterval: 10000, // Check every 10 seconds
	memoryWarningThreshold: 500, // Warn at 500MB
};

interface CacheEntry<T> {
	data: T;
	lastAccess: number;
	size: number; // Estimated size in bytes
}

interface ChunkCacheEntry {
	group: THREE.Group;
	lastAccess: number;
	objectCount: number;
}

export class MemoryManager {
	private config: MemoryConfig;
	private chunkCache: Map<string, ChunkCacheEntry> = new Map();
	private textureCache: Map<string, CacheEntry<THREE.Texture>> = new Map();
	private geometryCache: Map<string, CacheEntry<THREE.BufferGeometry>> = new Map();
	private materialCache: Map<string, CacheEntry<THREE.Material>> = new Map();

	private checkInterval: ReturnType<typeof setInterval> | null = null;
	private scene: THREE.Scene | null = null;
	private playerPosition: THREE.Vector3 = new THREE.Vector3();

	// Memory statistics
	private stats = {
		chunksLoaded: 0,
		chunksUnloaded: 0,
		texturesLoaded: 0,
		texturesUnloaded: 0,
		lastCleanup: 0,
		estimatedMemoryUsage: 0,
	};

	constructor(config: Partial<MemoryConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Initialize memory manager with scene reference
	 */
	public initialize(scene: THREE.Scene): void {
		this.scene = scene;
		this.startMemoryMonitoring();
	}

	/**
	 * Start periodic memory monitoring
	 */
	public startMemoryMonitoring(): void {
		if (this.checkInterval) return;

		this.checkInterval = setInterval(() => {
			this.performMemoryCheck();
		}, this.config.memoryCheckInterval);
	}

	/**
	 * Stop memory monitoring
	 */
	public stopMemoryMonitoring(): void {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
	}

	/**
	 * Update player position for distance-based unloading
	 */
	public setPlayerPosition(x: number, y: number, z: number): void {
		this.playerPosition.set(x, y, z);
	}

	/**
	 * Register a chunk in the cache
	 */
	public registerChunk(key: string, group: THREE.Group, objectCount: number): void {
		const existing = this.chunkCache.get(key);
		if (existing) {
			existing.lastAccess = Date.now();
			return;
		}

		this.chunkCache.set(key, {
			group,
			lastAccess: Date.now(),
			objectCount,
		});
		this.stats.chunksLoaded++;

		// Check if we need to unload old chunks
		if (this.chunkCache.size > this.config.maxCachedChunks) {
			this.unloadOldestChunks(Math.floor(this.config.maxCachedChunks * 0.2));
		}
	}

	/**
	 * Mark a chunk as accessed
	 */
	public touchChunk(key: string): void {
		const entry = this.chunkCache.get(key);
		if (entry) {
			entry.lastAccess = Date.now();
		}
	}

	/**
	 * Unload a specific chunk
	 */
	public unloadChunk(key: string): boolean {
		const entry = this.chunkCache.get(key);
		if (!entry) return false;

		if (this.scene) {
			this.scene.remove(entry.group);
		}

		// Dispose of chunk resources
		this.disposeObject3D(entry.group);
		this.chunkCache.delete(key);
		this.stats.chunksUnloaded++;

		return true;
	}

	/**
	 * Register a texture in the cache
	 */
	public registerTexture(key: string, texture: THREE.Texture, estimatedSize: number = 1024 * 1024): void {
		if (this.textureCache.has(key)) {
			const entry = this.textureCache.get(key)!;
			entry.lastAccess = Date.now();
			return;
		}

		this.textureCache.set(key, {
			data: texture,
			lastAccess: Date.now(),
			size: estimatedSize,
		});
		this.stats.texturesLoaded++;

		if (this.textureCache.size > this.config.maxCachedTextures) {
			this.unloadOldestTextures(Math.floor(this.config.maxCachedTextures * 0.2));
		}
	}

	/**
	 * Get cached texture
	 */
	public getTexture(key: string): THREE.Texture | null {
		const entry = this.textureCache.get(key);
		if (entry) {
			entry.lastAccess = Date.now();
			return entry.data;
		}
		return null;
	}

	/**
	 * Register geometry in cache
	 */
	public registerGeometry(key: string, geometry: THREE.BufferGeometry): void {
		if (this.geometryCache.has(key)) {
			const entry = this.geometryCache.get(key)!;
			entry.lastAccess = Date.now();
			return;
		}

		// Estimate geometry size
		let size = 0;
		for (const attr of Object.values(geometry.attributes)) {
			if (attr instanceof THREE.BufferAttribute) {
				size += attr.array.byteLength;
			}
		}

		this.geometryCache.set(key, {
			data: geometry,
			lastAccess: Date.now(),
			size,
		});
	}

	/**
	 * Get cached geometry
	 */
	public getGeometry(key: string): THREE.BufferGeometry | null {
		const entry = this.geometryCache.get(key);
		if (entry) {
			entry.lastAccess = Date.now();
			return entry.data;
		}
		return null;
	}

	/**
	 * Register material in cache
	 */
	public registerMaterial(key: string, material: THREE.Material): void {
		if (this.materialCache.has(key)) {
			const entry = this.materialCache.get(key)!;
			entry.lastAccess = Date.now();
			return;
		}

		this.materialCache.set(key, {
			data: material,
			lastAccess: Date.now(),
			size: 1024, // Rough estimate
		});
	}

	/**
	 * Get cached material
	 */
	public getMaterial(key: string): THREE.Material | null {
		const entry = this.materialCache.get(key);
		if (entry) {
			entry.lastAccess = Date.now();
			return entry.data;
		}
		return null;
	}

	/**
	 * Perform periodic memory check
	 */
	private performMemoryCheck(): void {
		// Unload distant chunks
		this.unloadDistantChunks();

		// Calculate estimated memory usage
		this.updateMemoryEstimate();

		// Force cleanup if memory is high
		if (this.stats.estimatedMemoryUsage > this.config.memoryWarningThreshold * 1024 * 1024) {
			this.forceCleanup();
		}

		this.stats.lastCleanup = Date.now();
	}

	/**
	 * Unload chunks that are too far from player
	 */
	private unloadDistantChunks(): void {
		const chunkSize = 16;
		const unloadDistanceSquared = this.config.chunkUnloadDistance * this.config.chunkUnloadDistance;

		const toUnload: string[] = [];

		for (const [key, entry] of this.chunkCache) {
			const [chunkX, chunkZ] = key.split(',').map(Number);
			const chunkCenterX = (chunkX + 0.5) * chunkSize;
			const chunkCenterZ = (chunkZ + 0.5) * chunkSize;

			const dx = chunkCenterX - this.playerPosition.x;
			const dz = chunkCenterZ - this.playerPosition.z;
			const distanceSquared = dx * dx + dz * dz;

			if (distanceSquared > unloadDistanceSquared) {
				toUnload.push(key);
			}
		}

		for (const key of toUnload) {
			this.unloadChunk(key);
		}
	}

	/**
	 * Unload oldest chunks by last access time
	 */
	private unloadOldestChunks(count: number): void {
		const entries = Array.from(this.chunkCache.entries())
			.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

		for (let i = 0; i < count && i < entries.length; i++) {
			this.unloadChunk(entries[i][0]);
		}
	}

	/**
	 * Unload oldest textures by last access time
	 */
	private unloadOldestTextures(count: number): void {
		const entries = Array.from(this.textureCache.entries())
			.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

		for (let i = 0; i < count && i < entries.length; i++) {
			const [key, entry] = entries[i];
			entry.data.dispose();
			this.textureCache.delete(key);
			this.stats.texturesUnloaded++;
		}
	}

	/**
	 * Update estimated memory usage
	 */
	private updateMemoryEstimate(): void {
		let total = 0;

		// Textures
		for (const entry of this.textureCache.values()) {
			total += entry.size;
		}

		// Geometries
		for (const entry of this.geometryCache.values()) {
			total += entry.size;
		}

		// Chunks (rough estimate based on object count)
		for (const entry of this.chunkCache.values()) {
			total += entry.objectCount * 5000; // ~5KB per object estimate
		}

		this.stats.estimatedMemoryUsage = total;
	}

	/**
	 * Force aggressive cleanup when memory is high
	 */
	public forceCleanup(): void {
		// Unload 50% of oldest chunks
		this.unloadOldestChunks(Math.floor(this.chunkCache.size * 0.5));

		// Unload 50% of oldest textures
		this.unloadOldestTextures(Math.floor(this.textureCache.size * 0.5));

		// Clear environment object factory caches
		EnvironmentObjectFactory.dispose();

		// Request garbage collection (hint only, not guaranteed)
		if (typeof window !== 'undefined' && 'gc' in window) {
			(window as unknown as { gc: () => void }).gc();
		}
	}

	/**
	 * Dispose an Object3D and all its resources
	 */
	private disposeObject3D(object: THREE.Object3D): void {
		object.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				if (child.geometry) {
					child.geometry.dispose();
				}
				if (child.material) {
					if (Array.isArray(child.material)) {
						for (const mat of child.material) {
							this.disposeMaterial(mat);
						}
					} else {
						this.disposeMaterial(child.material);
					}
				}
			}
		});
	}

	/**
	 * Dispose a material and its textures
	 */
	private disposeMaterial(material: THREE.Material): void {
		if (material instanceof THREE.MeshStandardMaterial) {
			if (material.map) material.map.dispose();
			if (material.normalMap) material.normalMap.dispose();
			if (material.roughnessMap) material.roughnessMap.dispose();
			if (material.metalnessMap) material.metalnessMap.dispose();
			if (material.emissiveMap) material.emissiveMap.dispose();
		}
		material.dispose();
	}

	/**
	 * Get memory statistics
	 */
	public getStats(): typeof this.stats & { cacheStatus: { chunks: number; textures: number; geometries: number; materials: number } } {
		return {
			...this.stats,
			cacheStatus: {
				chunks: this.chunkCache.size,
				textures: this.textureCache.size,
				geometries: this.geometryCache.size,
				materials: this.materialCache.size,
			},
		};
	}

	/**
	 * Full cleanup and disposal
	 */
	public dispose(): void {
		this.stopMemoryMonitoring();

		// Unload all chunks
		for (const key of Array.from(this.chunkCache.keys())) {
			this.unloadChunk(key);
		}

		// Dispose all textures
		for (const entry of this.textureCache.values()) {
			entry.data.dispose();
		}
		this.textureCache.clear();

		// Dispose all geometries
		for (const entry of this.geometryCache.values()) {
			entry.data.dispose();
		}
		this.geometryCache.clear();

		// Dispose all materials
		for (const entry of this.materialCache.values()) {
			entry.data.dispose();
		}
		this.materialCache.clear();

		// Dispose environment object factory
		EnvironmentObjectFactory.dispose();

		this.scene = null;
	}
}

// Singleton instance
let instance: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
	if (!instance) {
		instance = new MemoryManager();
	}
	return instance;
}

export function disposeMemoryManager(): void {
	if (instance) {
		instance.dispose();
		instance = null;
	}
}
