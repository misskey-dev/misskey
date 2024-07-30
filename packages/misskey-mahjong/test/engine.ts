/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'node:assert';
import * as Common from '../src/common.js';
import { TileType, TileId } from '../src/common.js';
import { MasterGameEngine, MasterState } from '../src/engine.master.js';

const TILES = [71, 132, 108, 51, 39, 19, 3, 86, 104, 18, 50, 7, 45, 82, 43, 34, 111, 78, 53, 105, 126, 91, 112, 75, 119, 55, 95, 93, 65, 9, 66, 52, 79, 32, 99, 109, 56, 5, 101, 92, 1, 37, 62, 23, 27, 117, 77, 14, 31, 96, 120, 130, 29, 135, 100, 17, 102, 124, 59, 89, 49, 115, 107, 97, 90, 48, 25, 110, 68, 15, 74, 129, 69, 61, 73, 81, 11, 41, 44, 84, 13, 40, 33, 58, 30, 8, 38, 10, 87, 125, 57, 121, 21, 2, 54, 46, 22, 4, 133, 16, 76, 70, 60, 103, 114, 122, 24, 88, 36, 123, 47, 12, 128, 118, 116, 63, 26, 94, 67, 131, 64, 35, 113, 134, 6, 127, 80, 72, 42, 98, 85, 20, 106, 136, 83, 28];

class TileSetBuilder {
	private restTiles = [...TILES];

	private handTiles: {
		e: TileId[] | null,
		s: TileId[] | null,
		w: TileId[] | null,
		n: TileId[] | null,
	} = {
		e: null,
		s: null,
		w: null,
		n: null,
	};

	private tiles = new Map<number, TileId>;

	public setHandTiles(house: Common.House, tileTypes: TileType[]): this {
		if (this.handTiles[house] != null) {
			throw new TypeError(`Hand tiles of house '${house}' is already set`);
		}

		const tiles = tileTypes.map(tile => {
			const index = this.restTiles.findIndex(tileId => Common.TILE_ID_MAP.get(tileId)!.t == tile);
			if (index == -1) {
				throw new TypeError(`Tile '${tile}' is not left`);
			}
			return this.restTiles.splice(index, 1)[0];
		});

		this.handTiles[house] = tiles;

		return this;
	}

	/**
	 * 山のn番目（0始まり)の牌を指定する。nが負の場合、海底を-1として海底側から数える
	 */
	public setTile(n: number, tileType: TileType): this {
		if (n < 0) {
			n += 69;
		}

		if (this.tiles.has(n)) {
			throw new TypeError(`${n}th tile is already set`);
		}

		const index = this.restTiles.findIndex(tileId => Common.TILE_ID_MAP.get(tileId)!.t == tileType);
		if (index == -1) {
			throw new TypeError(`Tile '${tileType}' is not left`);
		}
		this.tiles.set(n, this.restTiles.splice(index, 1)[0]);

		return this;
	}

	public build(): Pick<MasterState, 'tiles' | 'kingTiles' | 'handTiles'> {
		const handTiles: MasterState['handTiles'] = {
			e: this.handTiles.e ?? this.restTiles.splice(0, 14),
			s: this.handTiles.s ?? this.restTiles.splice(0, 13),
			w: this.handTiles.w ?? this.restTiles.splice(0, 13),
			n: this.handTiles.n ?? this.restTiles.splice(0, 13),
		};

		const kingTiles: MasterState['kingTiles'] = this.restTiles.splice(0, 14);

		const tiles = [...this.restTiles];
		for (const [n, tile] of [...this.tiles.entries()].sort(([n1], [n2]) => n1 - n2)) {
			tiles.splice(n, 0, tile);
		}

		return {
			tiles,
			kingTiles,
			handTiles,
		};
	}
}

describe('Master game engine', () => {
	it('tenho', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder().setHandTiles('e', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3']).build(),
		));
		assert.deepStrictEqual(engine.commit_tsumoHora('e', false).yakus.map(yaku => yaku.name), ['tenho']);
	});

	it('chiho', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder()
				.setHandTiles('s', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3'])
				.setTile(0, 'm3')
				.build(),
		));
		engine.commit_dahai('e', engine.$state.handTiles.e.at(-1)!);
		assert.deepStrictEqual(engine.commit_tsumoHora('s', false).yakus.map(yaku => yaku.name), ['chiho']);
	});

	it('rinshan', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder()
			.setHandTiles('e', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'n'])
			.setTile(-1, 'm3')
			.build(),
		));
		engine.commit_ankan('e', engine.$state.handTiles.e.at(-1)!);
		assert.deepStrictEqual(engine.commit_tsumoHora('e', false).yakus.map(yaku => yaku.name), ['tsumo', 'rinshan']);
	});
});
