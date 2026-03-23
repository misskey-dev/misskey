/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, reactive, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { PlayerData, DroppedItemData, PlacedItemData, NpcData, ChunkData } from './engine.js';

export interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	quantity: number;
	acquiredAt: string;
}

export interface ActiveQuest {
	id: string;
	questType: string;
	difficulty: number;
	status: string;
	targetItemId: string | null;
	targetCondition: Record<string, unknown> | null;
	sourceNpcId: string;
	destinationNpcId: string | null;
	rewardCoins: number;
	rewardItemId: string | null;
	startedAt: string;
}

export interface WalletState {
	balance: string;
	lastUpdated: Date | null;
}

export interface FarmPlot {
	id: string;
	positionX: number;
	positionY: number;
	positionZ: number;
	size: number;
	crop: {
		id: string;
		stage: string;
		waterLevel: number;
		growthProgress: number;
	} | null;
}

export interface Chicken {
	id: string;
	name: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	hunger: number;
	happiness: number;
	eggsReady: number;
}

export interface Cow {
	id: string;
	name: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	hunger: number;
	happiness: number;
	milkReady: number;
}

export interface GameStateData {
	// Player state
	localPlayer: PlayerData | null;
	remotePlayers: Map<string, PlayerData>;

	// World state
	loadedChunks: Map<string, ChunkData>;

	// Items
	droppedItems: Map<string, DroppedItemData>;
	placedItems: Map<string, PlacedItemData>;
	inventory: InventoryItem[];

	// NPCs and Quests
	npcs: Map<string, NpcData>;
	activeQuests: ActiveQuest[];

	// Economy
	wallet: WalletState;

	// Farming
	farmPlots: FarmPlot[];
	chickens: Chicken[];
	cows: Cow[];

	// UI State
	isLoading: boolean;
	error: string | null;
	showInventory: boolean;
	showQuestPanel: boolean;
	showFarmPanel: boolean;
	showNpcDialog: boolean;
	selectedNpc: NpcData | null;
	placeMode: boolean;
	selectedItemForPlace: InventoryItem | null;
}

class GameState {
	// Reactive state
	public localPlayer: Ref<PlayerData | null> = ref(null);
	public remotePlayers: Map<string, PlayerData> = reactive(new Map());
	public loadedChunks: Map<string, ChunkData> = reactive(new Map());
	public droppedItems: Map<string, DroppedItemData> = reactive(new Map());
	public placedItems: Map<string, PlacedItemData> = reactive(new Map());
	public inventory: Ref<InventoryItem[]> = ref([]);
	public npcs: Map<string, NpcData> = reactive(new Map());
	public activeQuests: Ref<ActiveQuest[]> = ref([]);
	public wallet: Ref<WalletState> = ref({ balance: '0', lastUpdated: null });
	public farmPlots: Ref<FarmPlot[]> = ref([]);
	public chickens: Ref<Chicken[]> = ref([]);
	public cows: Ref<Cow[]> = ref([]);

	// UI State
	public isLoading: Ref<boolean> = ref(false);
	public error: Ref<string | null> = ref(null);
	public showInventory: Ref<boolean> = ref(false);
	public showQuestPanel: Ref<boolean> = ref(false);
	public showFarmPanel: Ref<boolean> = ref(false);
	public showNpcDialog: Ref<boolean> = ref(false);
	public selectedNpc: Ref<NpcData | null> = ref(null);
	public placeMode: Ref<boolean> = ref(false);
	public selectedItemForPlace: Ref<InventoryItem | null> = ref(null);

	// Computed properties
	public isConnected: ComputedRef<boolean> = computed(() => this.localPlayer.value !== null);
	public playerPosition: ComputedRef<{ x: number; y: number; z: number } | null> = computed(() => {
		if (!this.localPlayer.value) return null;
		return {
			x: this.localPlayer.value.positionX,
			y: this.localPlayer.value.positionY,
			z: this.localPlayer.value.positionZ,
		};
	});
	public inventoryCount: ComputedRef<number> = computed(() =>
		this.inventory.value.reduce((sum, item) => sum + item.quantity, 0),
	);
	public activeQuestCount: ComputedRef<number> = computed(() => this.activeQuests.value.length);

	// Player methods
	public setLocalPlayer(player: PlayerData): void {
		this.localPlayer.value = player;
	}

	public updateLocalPosition(x: number, y: number, z: number, rotation: number): void {
		if (this.localPlayer.value) {
			this.localPlayer.value.positionX = x;
			this.localPlayer.value.positionY = y;
			this.localPlayer.value.positionZ = z;
			this.localPlayer.value.rotation = rotation;
		}
	}

	public addRemotePlayer(player: PlayerData): void {
		this.remotePlayers.set(player.id, player);
	}

	public updateRemotePlayer(player: PlayerData): void {
		const existing = this.remotePlayers.get(player.id);
		if (existing) {
			Object.assign(existing, player);
		} else {
			this.remotePlayers.set(player.id, player);
		}
	}

	public removeRemotePlayer(playerId: string): void {
		this.remotePlayers.delete(playerId);
	}

	// Chunk methods
	public addChunk(chunk: ChunkData): void {
		const key = `${chunk.chunkX},${chunk.chunkZ}`;
		this.loadedChunks.set(key, chunk);
	}

	public getChunk(chunkX: number, chunkZ: number): ChunkData | undefined {
		return this.loadedChunks.get(`${chunkX},${chunkZ}`);
	}

	public removeChunk(chunkX: number, chunkZ: number): void {
		this.loadedChunks.delete(`${chunkX},${chunkZ}`);
	}

	// Item methods
	public addDroppedItem(item: DroppedItemData): void {
		this.droppedItems.set(item.id, item);
	}

	public removeDroppedItem(itemId: string): void {
		this.droppedItems.delete(itemId);
	}

	public addPlacedItem(item: PlacedItemData): void {
		this.placedItems.set(item.id, item);
	}

	public removePlacedItem(itemId: string): void {
		this.placedItems.delete(itemId);
	}

	public setInventory(items: InventoryItem[]): void {
		this.inventory.value = items;
	}

	public addInventoryItem(item: InventoryItem): void {
		const existing = this.inventory.value.find(i => i.itemId === item.itemId);
		if (existing) {
			existing.quantity += item.quantity;
		} else {
			this.inventory.value.push(item);
		}
	}

	public removeInventoryItem(itemId: string, quantity: number = 1): void {
		const index = this.inventory.value.findIndex(i => i.id === itemId);
		if (index !== -1) {
			const item = this.inventory.value[index];
			if (item.quantity <= quantity) {
				this.inventory.value.splice(index, 1);
			} else {
				item.quantity -= quantity;
			}
		}
	}

	// NPC methods
	public addNpc(npc: NpcData): void {
		this.npcs.set(npc.id, npc);
	}

	public removeNpc(npcId: string): void {
		this.npcs.delete(npcId);
	}

	public getNpcAt(x: number, z: number, radius: number): NpcData | null {
		for (const npc of this.npcs.values()) {
			const dx = npc.positionX - x;
			const dz = npc.positionZ - z;
			if (Math.sqrt(dx * dx + dz * dz) <= radius) {
				return npc;
			}
		}
		return null;
	}

	// Quest methods
	public setActiveQuests(quests: ActiveQuest[]): void {
		this.activeQuests.value = quests;
	}

	public addQuest(quest: ActiveQuest): void {
		this.activeQuests.value.push(quest);
	}

	public removeQuest(questId: string): void {
		const index = this.activeQuests.value.findIndex(q => q.id === questId);
		if (index !== -1) {
			this.activeQuests.value.splice(index, 1);
		}
	}

	// Wallet methods
	public setWalletBalance(balance: string): void {
		this.wallet.value = {
			balance,
			lastUpdated: new Date(),
		};
	}

	public addCoins(amount: number): void {
		const current = BigInt(this.wallet.value.balance);
		this.wallet.value = {
			balance: (current + BigInt(amount)).toString(),
			lastUpdated: new Date(),
		};
	}

	// Farm methods
	public setFarmPlots(plots: FarmPlot[]): void {
		this.farmPlots.value = plots;
	}

	public setChickens(chickens: Chicken[]): void {
		this.chickens.value = chickens;
	}

	public setCows(cows: Cow[]): void {
		this.cows.value = cows;
	}

	// UI methods
	public toggleInventory(): void {
		this.showInventory.value = !this.showInventory.value;
		if (this.showInventory.value) {
			this.showQuestPanel.value = false;
			this.showFarmPanel.value = false;
		}
	}

	public toggleQuestPanel(): void {
		this.showQuestPanel.value = !this.showQuestPanel.value;
		if (this.showQuestPanel.value) {
			this.showInventory.value = false;
			this.showFarmPanel.value = false;
		}
	}

	public toggleFarmPanel(): void {
		this.showFarmPanel.value = !this.showFarmPanel.value;
		if (this.showFarmPanel.value) {
			this.showInventory.value = false;
			this.showQuestPanel.value = false;
		}
	}

	public openNpcDialog(npc: NpcData): void {
		this.selectedNpc.value = npc;
		this.showNpcDialog.value = true;
	}

	public closeNpcDialog(): void {
		this.selectedNpc.value = null;
		this.showNpcDialog.value = false;
	}

	public enterPlaceMode(item: InventoryItem): void {
		this.placeMode.value = true;
		this.selectedItemForPlace.value = item;
		this.showInventory.value = false;
	}

	public exitPlaceMode(): void {
		this.placeMode.value = false;
		this.selectedItemForPlace.value = null;
	}

	// Reset
	public reset(): void {
		this.localPlayer.value = null;
		this.remotePlayers.clear();
		this.loadedChunks.clear();
		this.droppedItems.clear();
		this.placedItems.clear();
		this.inventory.value = [];
		this.npcs.clear();
		this.activeQuests.value = [];
		this.wallet.value = { balance: '0', lastUpdated: null };
		this.farmPlots.value = [];
		this.chickens.value = [];
		this.cows.value = [];
		this.isLoading.value = false;
		this.error.value = null;
		this.showInventory.value = false;
		this.showQuestPanel.value = false;
		this.showFarmPanel.value = false;
		this.showNpcDialog.value = false;
		this.selectedNpc.value = null;
		this.placeMode.value = false;
		this.selectedItemForPlace.value = null;
	}

	// Serialization for debugging
	public toJSON(): GameStateData {
		return {
			localPlayer: this.localPlayer.value,
			remotePlayers: this.remotePlayers,
			loadedChunks: this.loadedChunks,
			droppedItems: this.droppedItems,
			placedItems: this.placedItems,
			inventory: this.inventory.value,
			npcs: this.npcs,
			activeQuests: this.activeQuests.value,
			wallet: this.wallet.value,
			farmPlots: this.farmPlots.value,
			chickens: this.chickens.value,
			cows: this.cows.value,
			isLoading: this.isLoading.value,
			error: this.error.value,
			showInventory: this.showInventory.value,
			showQuestPanel: this.showQuestPanel.value,
			showFarmPanel: this.showFarmPanel.value,
			showNpcDialog: this.showNpcDialog.value,
			selectedNpc: this.selectedNpc.value,
			placeMode: this.placeMode.value,
			selectedItemForPlace: this.selectedItemForPlace.value,
		};
	}
}

// Singleton instance
let instance: GameState | null = null;

export function getGameState(): GameState {
	if (!instance) {
		instance = new GameState();
	}
	return instance;
}

export function disposeGameState(): void {
	if (instance) {
		instance.reset();
		instance = null;
	}
}

export { GameState };
