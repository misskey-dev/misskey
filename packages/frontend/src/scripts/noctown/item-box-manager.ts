/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';

export interface InventoryItem {
	id: string;
	itemId: string;
	name: string;
	flavorText: string | null;
	imageUrl: string | null;
	rarity: number;
	itemType: string;
	quantity: number;
	obtainedAt: string;
}

export interface ItemBoxConfig {
	baseCapacity: number;
	maxCapacity: number;
	expansionCost: number;
	expansionAmount: number;
}

const DEFAULT_CONFIG: ItemBoxConfig = {
	baseCapacity: 50,
	maxCapacity: 500,
	expansionCost: 1000, // Base cost for expansion
	expansionAmount: 10, // Items per expansion
};

// Rarity names for display
const RARITY_NAMES = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'] as const;

// Rarity colors for UI
const RARITY_COLORS = [
	'#9ca3af', // N - gray
	'#22c55e', // R - green
	'#3b82f6', // SR - blue
	'#a855f7', // SSR - purple
	'#f59e0b', // UR - amber
	'#ef4444', // LR - red
] as const;

export class ItemBoxManager {
	private config: ItemBoxConfig;
	private _items: Ref<InventoryItem[]>;
	private _capacity: Ref<number>;
	private _isLoading: Ref<boolean>;
	private _error: Ref<string | null>;

	constructor(config: Partial<ItemBoxConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this._items = ref([]);
		this._capacity = ref(this.config.baseCapacity);
		this._isLoading = ref(false);
		this._error = ref(null);
	}

	// Reactive getters
	public get items(): Ref<InventoryItem[]> {
		return this._items;
	}

	public get capacity(): Ref<number> {
		return this._capacity;
	}

	public get isLoading(): Ref<boolean> {
		return this._isLoading;
	}

	public get error(): Ref<string | null> {
		return this._error;
	}

	// Computed properties
	public get usedSlots(): ComputedRef<number> {
		return computed(() => this._items.value.length);
	}

	public get availableSlots(): ComputedRef<number> {
		return computed(() => this._capacity.value - this._items.value.length);
	}

	public get isFull(): ComputedRef<boolean> {
		return computed(() => this._items.value.length >= this._capacity.value);
	}

	public get capacityPercentage(): ComputedRef<number> {
		return computed(() => {
			if (this._capacity.value === 0) return 0;
			return (this._items.value.length / this._capacity.value) * 100;
		});
	}

	public get totalItemCount(): ComputedRef<number> {
		return computed(() =>
			this._items.value.reduce((sum, item) => sum + item.quantity, 0),
		);
	}

	/**
	 * Check if player can pick up an item
	 */
	public canPickupItem(): boolean {
		return this._items.value.length < this._capacity.value;
	}

	/**
	 * Check if player can pick up multiple items
	 */
	public canPickupItems(count: number): boolean {
		return this._items.value.length + count <= this._capacity.value;
	}

	/**
	 * Get remaining capacity
	 */
	public getRemainingCapacity(): number {
		return this._capacity.value - this._items.value.length;
	}

	/**
	 * Add item to inventory (client-side)
	 */
	public addItem(item: InventoryItem): boolean {
		if (this._items.value.length >= this._capacity.value) {
			this._error.value = 'アイテムボックスがいっぱいです';
			return false;
		}

		// Check if item already exists (for stacking)
		const existingIndex = this._items.value.findIndex(
			i => i.itemId === item.itemId,
		);

		if (existingIndex !== -1) {
			// Stack items
			this._items.value[existingIndex].quantity += item.quantity;
		} else {
			// Add new item
			this._items.value.push({ ...item });
		}

		return true;
	}

	/**
	 * Remove item from inventory
	 */
	public removeItem(id: string, quantity: number = 1): boolean {
		const index = this._items.value.findIndex(item => item.id === id);
		if (index === -1) return false;

		const item = this._items.value[index];
		if (item.quantity <= quantity) {
			// Remove entirely
			this._items.value.splice(index, 1);
		} else {
			// Reduce quantity
			item.quantity -= quantity;
		}

		return true;
	}

	/**
	 * Get item by ID
	 */
	public getItem(id: string): InventoryItem | null {
		return this._items.value.find(item => item.id === id) ?? null;
	}

	/**
	 * Get items by item type
	 */
	public getItemsByType(itemType: string): InventoryItem[] {
		return this._items.value.filter(item => item.itemType === itemType);
	}

	/**
	 * Get items by rarity
	 */
	public getItemsByRarity(rarity: number): InventoryItem[] {
		return this._items.value.filter(item => item.rarity === rarity);
	}

	/**
	 * Sort items by various criteria
	 */
	public sortItems(
		criteria: 'name' | 'rarity' | 'type' | 'obtained' | 'quantity',
		ascending: boolean = true,
	): void {
		const multiplier = ascending ? 1 : -1;

		this._items.value.sort((a, b) => {
			switch (criteria) {
				case 'name':
					return a.name.localeCompare(b.name) * multiplier;
				case 'rarity':
					return (a.rarity - b.rarity) * multiplier;
				case 'type':
					return a.itemType.localeCompare(b.itemType) * multiplier;
				case 'obtained':
					return (new Date(a.obtainedAt).getTime() - new Date(b.obtainedAt).getTime()) * multiplier;
				case 'quantity':
					return (a.quantity - b.quantity) * multiplier;
				default:
					return 0;
			}
		});
	}

	/**
	 * Filter items by search text
	 */
	public filterItems(searchText: string): InventoryItem[] {
		const lowerSearch = searchText.toLowerCase();
		return this._items.value.filter(item =>
			item.name.toLowerCase().includes(lowerSearch) ||
			(item.flavorText?.toLowerCase().includes(lowerSearch) ?? false),
		);
	}

	/**
	 * Set capacity (from server data)
	 */
	public setCapacity(capacity: number): void {
		this._capacity.value = Math.min(capacity, this.config.maxCapacity);
	}

	/**
	 * Calculate expansion cost
	 */
	public getExpansionCost(): number {
		const currentExpansions = Math.floor(
			(this._capacity.value - this.config.baseCapacity) / this.config.expansionAmount,
		);
		// Cost increases with each expansion
		return this.config.expansionCost * (1 + currentExpansions * 0.5);
	}

	/**
	 * Check if can expand capacity
	 */
	public canExpand(): boolean {
		return this._capacity.value < this.config.maxCapacity;
	}

	/**
	 * Expand capacity (returns new capacity)
	 */
	public expand(): number {
		if (!this.canExpand()) return this._capacity.value;

		const newCapacity = Math.min(
			this._capacity.value + this.config.expansionAmount,
			this.config.maxCapacity,
		);
		this._capacity.value = newCapacity;
		return newCapacity;
	}

	/**
	 * Load items from server
	 */
	public async loadFromServer(): Promise<void> {
		this._isLoading.value = true;
		this._error.value = null;

		try {
			const token = this.getToken();
			if (!token) {
				throw new Error('Not authenticated');
			}

			const res = await window.fetch('/api/noctown/item/inventory', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: token }),
			});

			if (!res.ok) {
				throw new Error(`Failed to load inventory: ${res.status}`);
			}

			const data = await res.json();
			this._items.value = data.items ?? [];
			this._capacity.value = data.capacity ?? this.config.baseCapacity;
		} catch (e) {
			this._error.value = e instanceof Error ? e.message : 'Unknown error';
			console.error('Failed to load inventory:', e);
		} finally {
			this._isLoading.value = false;
		}
	}

	/**
	 * Get authentication token
	 */
	private getToken(): string | null {
		const account = localStorage.getItem('account');
		if (!account) return null;
		try {
			return JSON.parse(account).token;
		} catch {
			return null;
		}
	}

	/**
	 * Clear all items (for logout, etc.)
	 */
	public clear(): void {
		this._items.value = [];
		this._capacity.value = this.config.baseCapacity;
		this._error.value = null;
	}

	/**
	 * Get statistics about inventory
	 */
	public getStatistics(): {
		totalItems: number;
		uniqueItems: number;
		byRarity: Record<number, number>;
		byType: Record<string, number>;
		usedCapacity: number;
		totalCapacity: number;
	} {
		const byRarity: Record<number, number> = {};
		const byType: Record<string, number> = {};

		for (const item of this._items.value) {
			byRarity[item.rarity] = (byRarity[item.rarity] ?? 0) + item.quantity;
			byType[item.itemType] = (byType[item.itemType] ?? 0) + item.quantity;
		}

		return {
			totalItems: this._items.value.reduce((sum, item) => sum + item.quantity, 0),
			uniqueItems: this._items.value.length,
			byRarity,
			byType,
			usedCapacity: this._items.value.length,
			totalCapacity: this._capacity.value,
		};
	}
}

// Utility functions
export function getRarityName(rarity: number): string {
	return RARITY_NAMES[rarity] ?? 'N';
}

export function getRarityColor(rarity: number): string {
	return RARITY_COLORS[rarity] ?? RARITY_COLORS[0];
}

// Singleton instance
let instance: ItemBoxManager | null = null;

export function getItemBoxManager(): ItemBoxManager {
	if (!instance) {
		instance = new ItemBoxManager();
	}
	return instance;
}

export function disposeItemBoxManager(): void {
	if (instance) {
		instance.clear();
		instance = null;
	}
}
