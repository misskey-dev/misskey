/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DebounceLoader } from '@/misc/loader.js';

class Mock {
	loadCountByKey = new Map<number, number>();
	load = async (key: number): Promise<number> => {
		const count = this.loadCountByKey.get(key);
		if (typeof count === 'undefined') {
			this.loadCountByKey.set(key, 1);
		} else {
			this.loadCountByKey.set(key, count + 1);
		}
		return key * 2;
	};
	reset() {
		this.loadCountByKey.clear();
	}
}

describe(DebounceLoader, () => {
	describe('single request', () => {
		it('loads once', async () => {
			const mock = new Mock();
			const loader = new DebounceLoader(mock.load);
			expect(await loader.load(7)).toBe(14);
			expect(mock.loadCountByKey.size).toBe(1);
			expect(mock.loadCountByKey.get(7)).toBe(1);
		});
	});

	describe('two duplicated requests at same time', () => {
		it('loads once', async () => {
			const mock = new Mock();
			const loader = new DebounceLoader(mock.load);
			const [v1, v2] = await Promise.all([
				loader.load(7),
				loader.load(7),
			]);
			expect(v1).toBe(14);
			expect(v2).toBe(14);
			expect(mock.loadCountByKey.size).toBe(1);
			expect(mock.loadCountByKey.get(7)).toBe(1);
		});
	});

	describe('two different requests at same time', () => {
		it('loads twice', async () => {
			const mock = new Mock();
			const loader = new DebounceLoader(mock.load);
			const [v1, v2] = await Promise.all([
				loader.load(7),
				loader.load(13),
			]);
			expect(v1).toBe(14);
			expect(v2).toBe(26);
			expect(mock.loadCountByKey.size).toBe(2);
			expect(mock.loadCountByKey.get(7)).toBe(1);
			expect(mock.loadCountByKey.get(13)).toBe(1);
		});
	});

	describe('non-continuous same two requests', () => {
		it('loads twice', async () => {
			const mock = new Mock();
			const loader = new DebounceLoader(mock.load);
			expect(await loader.load(7)).toBe(14);
			expect(mock.loadCountByKey.size).toBe(1);
			expect(mock.loadCountByKey.get(7)).toBe(1);
			mock.reset();
			expect(await loader.load(7)).toBe(14);
			expect(mock.loadCountByKey.size).toBe(1);
			expect(mock.loadCountByKey.get(7)).toBe(1);
		});
	});

	describe('non-continuous different two requests', () => {
		it('loads twice', async () => {
			const mock = new Mock();
			const loader = new DebounceLoader(mock.load);
			expect(await loader.load(7)).toBe(14);
			expect(mock.loadCountByKey.size).toBe(1);
			expect(mock.loadCountByKey.get(7)).toBe(1);
			mock.reset();
			expect(await loader.load(13)).toBe(26);
			expect(mock.loadCountByKey.size).toBe(1);
			expect(mock.loadCountByKey.get(13)).toBe(1);
		});
	});
});
