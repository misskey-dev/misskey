/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed, type Ref } from 'vue';

export type MapLocation = 'overworld' | 'interior';

export interface OverworldPosition {
	type: 'overworld';
	x: number;
	y: number;
	z: number;
}

export interface InteriorPosition {
	type: 'interior';
	interiorId: string;
	x: number;
	z: number;
}

export type PlayerPosition = OverworldPosition | InteriorPosition;

export interface BuildingEntrance {
	buildingType: string;
	interiorId: string;
	worldX: number;
	worldZ: number;
	entranceX: number; // Relative to building position
	entranceZ: number;
}

export interface InteriorData {
	id: string;
	type: string;
	name: string;
	width: number;
	depth: number;
	tiles: Array<Array<{
		type: string;
		variant: number;
	}>>;
	npcs: Array<{
		id: string;
		type: string;
		positionX: number;
		positionZ: number;
	}>;
	furniture: Array<{
		id: string;
		itemId: string;
		positionX: number;
		positionZ: number;
		rotation: number;
	}>;
	entryX: number;
	entryZ: number;
}

export interface TransitionCallback {
	onEnterBuilding?: (interiorId: string, interiorData: InteriorData) => void;
	onExitBuilding?: (worldPosition: OverworldPosition) => void;
	onTransitionStart?: () => void;
	onTransitionEnd?: () => void;
}

/**
 * Map transition manager for handling building entry/exit
 */
export class MapTransitionManager {
	private currentLocation: Ref<MapLocation> = ref('overworld');
	private currentInteriorId: Ref<string | null> = ref(null);
	private currentInteriorData: Ref<InteriorData | null> = ref(null);
	private savedOverworldPosition: Ref<OverworldPosition | null> = ref(null);
	private nearbyEntrances: Map<string, BuildingEntrance> = new Map();
	private isTransitioning: Ref<boolean> = ref(false);
	private callbacks: TransitionCallback = {};
	private transitionDuration = 500; // ms

	// Proximity threshold for building entrance detection
	private entranceProximityThreshold = 2.0;

	constructor() {
		// Initialize reactive state
	}

	/**
	 * Register callback functions
	 */
	public setCallbacks(callbacks: TransitionCallback): void {
		this.callbacks = { ...this.callbacks, ...callbacks };
	}

	/**
	 * Get current location type
	 */
	public get location(): MapLocation {
		return this.currentLocation.value;
	}

	/**
	 * Get current interior ID (if in interior)
	 */
	public get interiorId(): string | null {
		return this.currentInteriorId.value;
	}

	/**
	 * Get current interior data (if in interior)
	 */
	public get interiorData(): InteriorData | null {
		return this.currentInteriorData.value;
	}

	/**
	 * Check if currently in transition
	 */
	public get transitioning(): boolean {
		return this.isTransitioning.value;
	}

	/**
	 * Check if player is in overworld
	 */
	public get isInOverworld(): boolean {
		return this.currentLocation.value === 'overworld';
	}

	/**
	 * Check if player is in interior
	 */
	public get isInInterior(): boolean {
		return this.currentLocation.value === 'interior';
	}

	/**
	 * Register a building entrance
	 */
	public registerEntrance(entrance: BuildingEntrance): void {
		const key = `${entrance.worldX},${entrance.worldZ}`;
		this.nearbyEntrances.set(key, entrance);
	}

	/**
	 * Clear all registered entrances
	 */
	public clearEntrances(): void {
		this.nearbyEntrances.clear();
	}

	/**
	 * Register entrances from chunk building data
	 */
	public registerBuildingEntrances(
		buildings: Array<{
			type: string;
			localX: number;
			localZ: number;
			width: number;
			depth: number;
			interiorId: string;
		}>,
		chunkX: number,
		chunkZ: number,
		chunkSize: number,
	): void {
		for (const building of buildings) {
			const worldX = chunkX * chunkSize + building.localX;
			const worldZ = chunkZ * chunkSize + building.localZ;

			// Entrance is at the front of the building (center of front side)
			const entranceX = Math.floor(building.width / 2);
			const entranceZ = building.depth; // Just outside the building

			this.registerEntrance({
				buildingType: building.type,
				interiorId: building.interiorId,
				worldX: worldX + entranceX,
				worldZ: worldZ + entranceZ,
				entranceX,
				entranceZ,
			});
		}
	}

	/**
	 * Check if player is near any building entrance
	 */
	public getNearbyEntrance(playerX: number, playerZ: number): BuildingEntrance | null {
		for (const entrance of this.nearbyEntrances.values()) {
			const dx = entrance.worldX - playerX;
			const dz = entrance.worldZ - playerZ;
			const distance = Math.sqrt(dx * dx + dz * dz);

			if (distance < this.entranceProximityThreshold) {
				return entrance;
			}
		}
		return null;
	}

	/**
	 * Enter a building
	 */
	public async enterBuilding(
		entrance: BuildingEntrance,
		currentOverworldPos: OverworldPosition,
		fetchInteriorData: (interiorId: string) => Promise<InteriorData>,
	): Promise<boolean> {
		if (this.isTransitioning.value || this.currentLocation.value !== 'overworld') {
			return false;
		}

		try {
			this.isTransitioning.value = true;
			this.callbacks.onTransitionStart?.();

			// Save current overworld position for exit
			this.savedOverworldPosition.value = { ...currentOverworldPos };

			// Fetch interior data
			const interiorData = await fetchInteriorData(entrance.interiorId);

			// Wait for transition animation
			await this.sleep(this.transitionDuration);

			// Update state
			this.currentLocation.value = 'interior';
			this.currentInteriorId.value = entrance.interiorId;
			this.currentInteriorData.value = interiorData;

			// Trigger callback
			this.callbacks.onEnterBuilding?.(entrance.interiorId, interiorData);

			return true;
		} catch (error) {
			console.error('Failed to enter building:', error);
			return false;
		} finally {
			this.isTransitioning.value = false;
			this.callbacks.onTransitionEnd?.();
		}
	}

	/**
	 * Exit the current building
	 */
	public async exitBuilding(): Promise<OverworldPosition | null> {
		if (this.isTransitioning.value || this.currentLocation.value !== 'interior') {
			return null;
		}

		if (!this.savedOverworldPosition.value) {
			console.error('No saved overworld position');
			return null;
		}

		try {
			this.isTransitioning.value = true;
			this.callbacks.onTransitionStart?.();

			const exitPosition = { ...this.savedOverworldPosition.value };

			// Wait for transition animation
			await this.sleep(this.transitionDuration);

			// Update state
			this.currentLocation.value = 'overworld';
			this.currentInteriorId.value = null;
			this.currentInteriorData.value = null;

			// Trigger callback
			this.callbacks.onExitBuilding?.(exitPosition);

			return exitPosition;
		} finally {
			this.isTransitioning.value = false;
			this.callbacks.onTransitionEnd?.();
		}
	}

	/**
	 * Force set location (for loading saved state)
	 */
	public setLocation(location: MapLocation, interiorId?: string, interiorData?: InteriorData): void {
		this.currentLocation.value = location;
		this.currentInteriorId.value = interiorId ?? null;
		this.currentInteriorData.value = interiorData ?? null;
	}

	/**
	 * Check if player is at exit position in interior
	 */
	public isAtInteriorExit(playerX: number, playerZ: number): boolean {
		if (!this.currentInteriorData.value) return false;

		const { entryX, entryZ } = this.currentInteriorData.value;
		const dx = Math.abs(playerX - entryX);
		const dz = Math.abs(playerZ - entryZ);

		// Player is at exit if within 1 tile of entry point and at the edge
		return dz < 0.5 && dx < 1.5;
	}

	/**
	 * Get reactive location reference
	 */
	public getLocationRef(): Ref<MapLocation> {
		return this.currentLocation;
	}

	/**
	 * Get reactive interior data reference
	 */
	public getInteriorDataRef(): Ref<InteriorData | null> {
		return this.currentInteriorData;
	}

	/**
	 * Get reactive transitioning reference
	 */
	public getTransitioningRef(): Ref<boolean> {
		return this.isTransitioning;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Dispose resources
	 */
	public dispose(): void {
		this.nearbyEntrances.clear();
		this.callbacks = {};
	}
}

/**
 * Create a map transition manager instance
 */
export function createMapTransitionManager(): MapTransitionManager {
	return new MapTransitionManager();
}

/**
 * Generate interior data for a building type (procedural generation)
 */
export function generateDefaultInterior(
	buildingType: string,
	interiorId: string,
): InteriorData {
	const configs: Record<string, { width: number; depth: number; name: string }> = {
		shop: { width: 8, depth: 8, name: 'ショップ' },
		inn: { width: 10, depth: 8, name: '宿屋' },
		house: { width: 6, depth: 6, name: '民家' },
		guild: { width: 10, depth: 10, name: 'ギルド' },
		barn: { width: 8, depth: 10, name: '納屋' },
		tower: { width: 6, depth: 6, name: '塔' },
	};

	const config = configs[buildingType] ?? { width: 6, depth: 6, name: '建物' };
	const { width, depth, name } = config;

	// Generate tile layout
	const tiles: InteriorData['tiles'] = [];
	for (let x = 0; x < width; x++) {
		tiles[x] = [];
		for (let z = 0; z < depth; z++) {
			// Walls around the edge
			if (x === 0 || x === width - 1 || z === 0 || z === depth - 1) {
				// Door at bottom center
				if (z === 0 && x === Math.floor(width / 2)) {
					tiles[x][z] = { type: 'door', variant: 0 };
				} else {
					tiles[x][z] = { type: 'wall', variant: 0 };
				}
			} else if (buildingType === 'shop' && z === depth - 2 && x > 1 && x < width - 2) {
				// Shop counter
				tiles[x][z] = { type: 'counter', variant: 0 };
			} else {
				tiles[x][z] = { type: 'floor', variant: Math.floor(Math.random() * 3) };
			}
		}
	}

	// Generate NPCs based on building type
	const npcs: InteriorData['npcs'] = [];
	if (buildingType === 'shop') {
		npcs.push({
			id: `npc_${interiorId}_shopkeeper`,
			type: 'shopkeeper',
			positionX: Math.floor(width / 2),
			positionZ: depth - 2,
		});
	} else if (buildingType === 'inn') {
		npcs.push({
			id: `npc_${interiorId}_innkeeper`,
			type: 'innkeeper',
			positionX: Math.floor(width / 2),
			positionZ: depth - 2,
		});
	} else if (buildingType === 'guild') {
		npcs.push({
			id: `npc_${interiorId}_guild_master`,
			type: 'guild_master',
			positionX: Math.floor(width / 2),
			positionZ: depth - 2,
		});
	}

	return {
		id: interiorId,
		type: buildingType,
		name,
		width,
		depth,
		tiles,
		npcs,
		furniture: [],
		entryX: Math.floor(width / 2),
		entryZ: 1,
	};
}
