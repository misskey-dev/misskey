/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type MemoryStorage = {
	has: (key: string) => boolean;
	getItem: <T>(key: string) => T | null;
	setItem: (key: string, value: unknown) => void;
	removeItem: (key: string) => void;
	clear: () => void;
	size: number;
};

class MemoryStorageImpl implements MemoryStorage {
	private readonly storage: Map<string, unknown>;

	constructor() {
		this.storage = new Map();
	}

	has(key: string): boolean {
		return this.storage.has(key);
	}

	getItem<T>(key: string): T | null {
		return this.storage.has(key) ? this.storage.get(key) as T : null;
	}

	setItem(key: string, value: unknown): void {
		this.storage.set(key, value);
	}

	removeItem(key: string): void {
		this.storage.delete(key);
	}

	clear(): void {
		this.storage.clear();
	}

	get size(): number {
		return this.storage.size;
	}
}

export function createMemoryStorage(): MemoryStorage {
	return new MemoryStorageImpl();
}

/**
 * SessionStorageよりも更に短い期間でクリアされるストレージです
 * - ブラウザの再読み込みやタブの閉じると内容が揮発します
 * - このストレージは他のタブと共有されません
 * - アカウント切り替えやログアウトを行うと内容が揮発します
 */
export const defaultMemoryStorage: MemoryStorage = createMemoryStorage();
