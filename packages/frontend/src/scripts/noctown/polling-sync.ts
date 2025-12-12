/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PlayerData, DroppedItemData, PlacedItemData, NpcData } from './engine.js';

export interface PollingConfig {
	nearbyPlayersInterval: number;
	droppedItemsInterval: number;
	placedItemsInterval: number;
	npcsInterval: number;
	radius: number;
	farRadius: number;
}

const DEFAULT_CONFIG: PollingConfig = {
	nearbyPlayersInterval: 5000, // 5 seconds for far players
	droppedItemsInterval: 10000, // 10 seconds for items
	placedItemsInterval: 30000, // 30 seconds for placed items
	npcsInterval: 15000, // 15 seconds for NPCs
	radius: 30,
	farRadius: 100,
};

type DataCallback<T> = (data: T[]) => void;

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

export class PollingSync {
	private config: PollingConfig;
	private currentX = 0;
	private currentZ = 0;

	// Polling intervals
	private playersInterval: ReturnType<typeof setInterval> | null = null;
	private droppedItemsInterval: ReturnType<typeof setInterval> | null = null;
	private placedItemsInterval: ReturnType<typeof setInterval> | null = null;
	private npcsInterval: ReturnType<typeof setInterval> | null = null;

	// Callbacks
	private onPlayersUpdate: DataCallback<PlayerData> | null = null;
	private onDroppedItemsUpdate: DataCallback<DroppedItemData> | null = null;
	private onPlacedItemsUpdate: DataCallback<PlacedItemData> | null = null;
	private onNpcsUpdate: DataCallback<NpcData> | null = null;

	// State tracking
	private lastPlayersFetch = 0;
	private lastItemsFetch = 0;
	private lastPlacedFetch = 0;
	private lastNpcsFetch = 0;

	private isRunning = false;

	constructor(config: Partial<PollingConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	public setPosition(x: number, z: number): void {
		this.currentX = x;
		this.currentZ = z;
	}

	public setCallbacks(callbacks: {
		onPlayersUpdate?: DataCallback<PlayerData>;
		onDroppedItemsUpdate?: DataCallback<DroppedItemData>;
		onPlacedItemsUpdate?: DataCallback<PlacedItemData>;
		onNpcsUpdate?: DataCallback<NpcData>;
	}): void {
		if (callbacks.onPlayersUpdate) this.onPlayersUpdate = callbacks.onPlayersUpdate;
		if (callbacks.onDroppedItemsUpdate) this.onDroppedItemsUpdate = callbacks.onDroppedItemsUpdate;
		if (callbacks.onPlacedItemsUpdate) this.onPlacedItemsUpdate = callbacks.onPlacedItemsUpdate;
		if (callbacks.onNpcsUpdate) this.onNpcsUpdate = callbacks.onNpcsUpdate;
	}

	public start(): void {
		if (this.isRunning) return;
		this.isRunning = true;

		// Start polling intervals
		this.playersInterval = setInterval(() => {
			this.fetchNearbyPlayers();
		}, this.config.nearbyPlayersInterval);

		this.droppedItemsInterval = setInterval(() => {
			this.fetchDroppedItems();
		}, this.config.droppedItemsInterval);

		this.placedItemsInterval = setInterval(() => {
			this.fetchPlacedItems();
		}, this.config.placedItemsInterval);

		this.npcsInterval = setInterval(() => {
			this.fetchNpcs();
		}, this.config.npcsInterval);

		// Initial fetch
		this.fetchAll();
	}

	public stop(): void {
		this.isRunning = false;

		if (this.playersInterval) {
			clearInterval(this.playersInterval);
			this.playersInterval = null;
		}
		if (this.droppedItemsInterval) {
			clearInterval(this.droppedItemsInterval);
			this.droppedItemsInterval = null;
		}
		if (this.placedItemsInterval) {
			clearInterval(this.placedItemsInterval);
			this.placedItemsInterval = null;
		}
		if (this.npcsInterval) {
			clearInterval(this.npcsInterval);
			this.npcsInterval = null;
		}
	}

	public async fetchAll(): Promise<void> {
		await Promise.all([
			this.fetchNearbyPlayers(),
			this.fetchDroppedItems(),
			this.fetchPlacedItems(),
			this.fetchNpcs(),
		]);
	}

	public async fetchNearbyPlayers(): Promise<PlayerData[]> {
		const now = Date.now();
		if (now - this.lastPlayersFetch < 1000) {
			return []; // Debounce
		}
		this.lastPlayersFetch = now;

		try {
			const res = await window.fetch('/api/noctown/players/nearby', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					i: getToken(),
					x: this.currentX,
					z: this.currentZ,
					radius: this.config.farRadius,
				}),
			});

			if (!res.ok) return [];

			const players: PlayerData[] = await res.json();

			if (this.onPlayersUpdate) {
				this.onPlayersUpdate(players);
			}

			return players;
		} catch (e) {
			console.error('Failed to fetch nearby players:', e);
			return [];
		}
	}

	public async fetchDroppedItems(): Promise<DroppedItemData[]> {
		const now = Date.now();
		if (now - this.lastItemsFetch < 1000) {
			return []; // Debounce
		}
		this.lastItemsFetch = now;

		try {
			const res = await window.fetch('/api/noctown/item/dropped', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					i: getToken(),
					x: this.currentX,
					z: this.currentZ,
					radius: this.config.radius,
				}),
			});

			if (!res.ok) return [];

			const items: DroppedItemData[] = await res.json();

			if (this.onDroppedItemsUpdate) {
				this.onDroppedItemsUpdate(items);
			}

			return items;
		} catch (e) {
			console.error('Failed to fetch dropped items:', e);
			return [];
		}
	}

	public async fetchPlacedItems(): Promise<PlacedItemData[]> {
		const now = Date.now();
		if (now - this.lastPlacedFetch < 1000) {
			return []; // Debounce
		}
		this.lastPlacedFetch = now;

		try {
			const res = await window.fetch('/api/noctown/item/placed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					i: getToken(),
					x: this.currentX,
					z: this.currentZ,
					radius: this.config.radius,
				}),
			});

			if (!res.ok) return [];

			const items: PlacedItemData[] = await res.json();

			if (this.onPlacedItemsUpdate) {
				this.onPlacedItemsUpdate(items);
			}

			return items;
		} catch (e) {
			console.error('Failed to fetch placed items:', e);
			return [];
		}
	}

	public async fetchNpcs(): Promise<NpcData[]> {
		const now = Date.now();
		if (now - this.lastNpcsFetch < 1000) {
			return []; // Debounce
		}
		this.lastNpcsFetch = now;

		try {
			const res = await window.fetch('/api/noctown/npc/nearby', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({
					i: getToken(),
					x: this.currentX,
					z: this.currentZ,
					radius: this.config.radius,
				}),
			});

			if (!res.ok) return [];

			const npcs: NpcData[] = await res.json();

			if (this.onNpcsUpdate) {
				this.onNpcsUpdate(npcs);
			}

			return npcs;
		} catch (e) {
			console.error('Failed to fetch NPCs:', e);
			return [];
		}
	}

	// Force immediate refresh
	public refresh(): void {
		this.lastPlayersFetch = 0;
		this.lastItemsFetch = 0;
		this.lastPlacedFetch = 0;
		this.lastNpcsFetch = 0;
		this.fetchAll();
	}

	public isActive(): boolean {
		return this.isRunning;
	}
}

// Singleton instance
let instance: PollingSync | null = null;

export function getPollingSync(): PollingSync {
	if (!instance) {
		instance = new PollingSync();
	}
	return instance;
}

export function disposePollingSync(): void {
	if (instance) {
		instance.stop();
		instance = null;
	}
}
