/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { House, TILE_TYPES, Tile } from './common.js';

export function isTile(tile: string): tile is Tile {
	return TILE_TYPES.includes(tile as Tile);
}

export function sortTiles(tiles: Tile[]): Tile[] {
	tiles.sort((a, b) => {
		const aIndex = TILE_TYPES.indexOf(a);
		const bIndex = TILE_TYPES.indexOf(b);
		return aIndex - bIndex;
	});
	return tiles;
}

export function nextHouse(house: House): House {
	switch (house) {
		case 'e': return 's';
		case 's': return 'w';
		case 'w': return 'n';
		case 'n': return 'e';
	}
}

export function prevHouse(house: House): House {
	switch (house) {
		case 'e': return 'n';
		case 's': return 'e';
		case 'w': return 's';
		case 'n': return 'w';
	}
}

type HoraSet = {
	head: Tile;
	mentsus: [Tile, Tile, Tile][];
};

const SHUNTU_PATTERNS: [Tile, Tile, Tile][] = [
	['m1', 'm2', 'm3'],
	['m2', 'm3', 'm4'],
	['m3', 'm4', 'm5'],
	['m4', 'm5', 'm6'],
	['m5', 'm6', 'm7'],
	['m6', 'm7', 'm8'],
	['m7', 'm8', 'm9'],
	['p1', 'p2', 'p3'],
	['p2', 'p3', 'p4'],
	['p3', 'p4', 'p5'],
	['p4', 'p5', 'p6'],
	['p5', 'p6', 'p7'],
	['p6', 'p7', 'p8'],
	['p7', 'p8', 'p9'],
	['s1', 's2', 's3'],
	['s2', 's3', 's4'],
	['s3', 's4', 's5'],
	['s4', 's5', 's6'],
	['s5', 's6', 's7'],
	['s6', 's7', 's8'],
	['s7', 's8', 's9'],
];

const SHUNTU_PATTERN_IDS = [
	'm123',
	'm234',
	'm345',
	'm456',
	'm567',
	'm678',
	'm789',
	'p123',
	'p234',
	'p345',
	'p456',
	'p567',
	'p678',
	'p789',
	's123',
	's234',
	's345',
	's456',
	's567',
	's678',
	's789',
] as const;

/**
 * アガリ形パターン一覧を取得
 * @param handTiles ポン、チー、カンした牌を含まない手牌
 * @returns
 */
export function getHoraSets(handTiles: Tile[]): HoraSet[] {
	const horaSets: HoraSet[] = [];

	const headSet: Tile[] = [];
	const countMap = new Map<Tile, number>();
	for (const tile of handTiles) {
		const count = (countMap.get(tile) ?? 0) + 1;
		countMap.set(tile, count);
		if (count === 2) {
			headSet.push(tile);
		}
	}

	for (const head of headSet) {
		const tempHandTiles = [...handTiles];
		tempHandTiles.splice(tempHandTiles.indexOf(head), 1);
		tempHandTiles.splice(tempHandTiles.indexOf(head), 1);

		const kotsuTileSet: Tile[] = []; // インデックスアクセスしたいため配列だが実態はSet
		for (const [t, c] of countMap.entries()) {
			if (t === head) continue; // 同じ牌種は4枚しかないので、頭と同じ牌種は刻子になりえない
			if (c >= 3) {
				kotsuTileSet.push(t);
			}
		}

		let kotsuPatterns: Tile[][];
		if (kotsuTileSet.length === 0) {
			kotsuPatterns = [
				[],
			];
		} else if (kotsuTileSet.length === 1) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
			];
		} else if (kotsuTileSet.length === 2) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
				[kotsuTileSet[1]],
				[kotsuTileSet[0], kotsuTileSet[1]],
			];
		} else if (kotsuTileSet.length === 3) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
				[kotsuTileSet[1]],
				[kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[1]],
				[kotsuTileSet[0], kotsuTileSet[2]],
				[kotsuTileSet[1], kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[2]],
			];
		} else if (kotsuTileSet.length === 4) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
				[kotsuTileSet[1]],
				[kotsuTileSet[2]],
				[kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[1]],
				[kotsuTileSet[0], kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[3]],
				[kotsuTileSet[1], kotsuTileSet[2]],
				[kotsuTileSet[1], kotsuTileSet[3]],
				[kotsuTileSet[2], kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[2], kotsuTileSet[3]],
				[kotsuTileSet[1], kotsuTileSet[2], kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[2], kotsuTileSet[3]],
			];
		} else {
			throw new Error('arienai');
		}

		for (const kotsuPattern of kotsuPatterns) {
			const tempHandTilesWithoutKotsu = [...tempHandTiles];
			for (const kotsuTile of kotsuPattern) {
				tempHandTilesWithoutKotsu.splice(tempHandTilesWithoutKotsu.indexOf(kotsuTile), 1);
				tempHandTilesWithoutKotsu.splice(tempHandTilesWithoutKotsu.indexOf(kotsuTile), 1);
				tempHandTilesWithoutKotsu.splice(tempHandTilesWithoutKotsu.indexOf(kotsuTile), 1);
			}

			// 連番に並ぶようにソート
			tempHandTilesWithoutKotsu.sort((a, b) => {
				const aIndex = TILE_TYPES.indexOf(a);
				const bIndex = TILE_TYPES.indexOf(b);
				return aIndex - bIndex;
			});

			const tempTempHandTilesWithoutKotsuAndShuntsu: (Tile | null)[] = [...tempHandTilesWithoutKotsu];

			const shuntsus: [Tile, Tile, Tile][] = [];
			let i = 0;
			while (i < tempHandTilesWithoutKotsu.length) {
				const headThree = tempHandTilesWithoutKotsu.slice(i, i + 3);
				if (headThree.length !== 3) break;

				for (const shuntuPattern of SHUNTU_PATTERNS) {
					if (headThree[0] === shuntuPattern[0] && headThree[1] === shuntuPattern[1] && headThree[2] === shuntuPattern[2]) {
						shuntsus.push(shuntuPattern);
						tempTempHandTilesWithoutKotsuAndShuntsu[i] = null;
						tempTempHandTilesWithoutKotsuAndShuntsu[i + 1] = null;
						tempTempHandTilesWithoutKotsuAndShuntsu[i + 2] = null;
						i += 3;
						break;
					}
				}

				i++;
			}

			const tempHandTilesWithoutKotsuAndShuntsu = tempTempHandTilesWithoutKotsuAndShuntsu.filter(t => t != null) as Tile[];

			if (tempHandTilesWithoutKotsuAndShuntsu.length === 0) { // アガリ形
				horaSets.push({
					head,
					mentsus: [...kotsuPattern.map(t => [t, t, t] as [Tile, Tile, Tile]), ...shuntsus],
				});
			}
		}
	}

	return horaSets;
}

/**
 * アガリ牌リストを取得
 * @param handTiles ポン、チー、カンした牌を含まない手牌
 */
export function getHoraTiles(handTiles: Tile[]): Tile[] {
	return TILE_TYPES.filter(tile => {
		const tempHandTiles = [...handTiles, tile];
		const horaSets = getHoraSets(tempHandTiles);
		return horaSets.length > 0;
	});
}
