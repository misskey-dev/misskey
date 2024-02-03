/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NOTE: アガリ形の判定に使われるため並び順が重要
// 具体的には、文字列としてソートした際に同じ牌種の1~9が順に並んでいる必要がある
// また、字牌は最後にある必要がある
export const TILE_TYPES = [
	'm1',
	'm2',
	'm3',
	'm4',
	'm5',
	'm6',
	'm7',
	'm8',
	'm9',
	'p1',
	'p2',
	'p3',
	'p4',
	'p5',
	'p6',
	'p7',
	'p8',
	'p9',
	's1',
	's2',
	's3',
	's4',
	's5',
	's6',
	's7',
	's8',
	's9',
	'e',
	's',
	'w',
	'n',
	'haku',
	'hatsu',
	'chun',
] as const;

export type Tile = typeof TILE_TYPES[number];

export type House = 'e' | 's' | 'w' | 'n';

export type Huro = {
	type: 'pon';
	tile: Tile;
	from: House;
} | {
	type: 'cii';
	tiles: [Tile, Tile, Tile];
	from: House;
} | {
	type: 'ankan';
	tile: Tile;
} | {
	type: 'minkan';
	tile: Tile;
	from: House | null; // null で加槓
};

export const NEXT_TILE_FOR_DORA_MAP: Record<Tile, Tile> = {
	m1: 'm2',
	m2: 'm3',
	m3: 'm4',
	m4: 'm5',
	m5: 'm6',
	m6: 'm7',
	m7: 'm8',
	m8: 'm9',
	m9: 'm1',
	p1: 'p2',
	p2: 'p3',
	p3: 'p4',
	p4: 'p5',
	p5: 'p6',
	p6: 'p7',
	p7: 'p8',
	p8: 'p9',
	p9: 'p1',
	s1: 's2',
	s2: 's3',
	s3: 's4',
	s4: 's5',
	s5: 's6',
	s6: 's7',
	s7: 's8',
	s8: 's9',
	s9: 's1',
	e: 's',
	s: 'w',
	w: 'n',
	n: 'e',
	haku: 'hatsu',
	hatsu: 'chun',
	chun: 'haku',
};

type EnvForCalcYaku = {
	house: House;

	/**
	 * 和了る人の手牌(副露牌および和了る際のツモ牌・ロン牌は含まない)
	 */
	handTiles: Tile[];

	/**
	 * 河
	 */
	hoTiles: Tile[];

	/**
	 * 副露
	 */
	huros: Huro[];

	/**
	 * ツモ牌
	 */
	tsumoTile: Tile | null;

	/**
	 * ロン牌
	 */
	ronTile: Tile | null;

	/**
	 * ドラ表示牌
	 */
	doraTiles: Tile[];

	/**
	 * 赤ドラ表示牌
	 */
	redDoraTiles: Tile[];

	/**
	 * 場風
	 */
	fieldWind: House;

	/**
	 * 自風
	 */
	seatWind: House;

	/**
	 * リーチしたかどうか
	 */
	riichi: boolean;
};

export const YAKU_DEFINITIONS = [{
	name: 'riichi',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.riichi;
	},
}, {
	name: 'tsumo',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.tsumoTile != null;
	},
}, {
	name: 'red',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return (
			(state.handTiles.filter(t => t === 'chun').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 'chun' :
				huro.type === 'ankan' ? huro.tile === 'chun' :
				huro.type === 'minkan' ? huro.tile === 'chun' :
				false).length >= 3)
		);
	},
}, {
	name: 'white',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return (
			(state.handTiles.filter(t => t === 'haku').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 'haku' :
				huro.type === 'ankan' ? huro.tile === 'haku' :
				huro.type === 'minkan' ? huro.tile === 'haku' :
				false).length >= 3)
		);
	},
}, {
	name: 'green',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return (
			(state.handTiles.filter(t => t === 'hatsu').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 'hatsu' :
				huro.type === 'ankan' ? huro.tile === 'hatsu' :
				huro.type === 'minkan' ? huro.tile === 'hatsu' :
				false).length >= 3)
		);
	},
}, {
	name: 'field-wind-e',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.fieldWind === 'e' && (
			(state.handTiles.filter(t => t === 'e').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 'e' :
				huro.type === 'ankan' ? huro.tile === 'e' :
				huro.type === 'minkan' ? huro.tile === 'e' :
				false).length >= 3)
		);
	},
}, {
	name: 'field-wind-s',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.fieldWind === 's' && (
			(state.handTiles.filter(t => t === 's').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 's' :
				huro.type === 'ankan' ? huro.tile === 's' :
				huro.type === 'minkan' ? huro.tile === 's' :
				false).length >= 3)
		);
	},
}, {
	name: 'seat-wind-e',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.house === 'e' && (
			(state.handTiles.filter(t => t === 'e').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 'e' :
				huro.type === 'ankan' ? huro.tile === 'e' :
				huro.type === 'minkan' ? huro.tile === 'e' :
				false).length >= 3)
		);
	},
}, {
	name: 'seat-wind-s',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.house === 's' && (
			(state.handTiles.filter(t => t === 's').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 's' :
				huro.type === 'ankan' ? huro.tile === 's' :
				huro.type === 'minkan' ? huro.tile === 's' :
				false).length >= 3)
		);
	},
}, {
	name: 'seat-wind-w',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.house === 'w' && (
			(state.handTiles.filter(t => t === 'w').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 'w' :
				huro.type === 'ankan' ? huro.tile === 'w' :
				huro.type === 'minkan' ? huro.tile === 'w' :
				false).length >= 3)
		);
	},
}, {
	name: 'seat-wind-n',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return state.house === 'n' && (
			(state.handTiles.filter(t => t === 'n').length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === 'n' :
				huro.type === 'ankan' ? huro.tile === 'n' :
				huro.type === 'minkan' ? huro.tile === 'n' :
				false).length >= 3)
		);
	},
}, {
	name: 'tanyao',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		const yaochuTiles: Tile[] = ['m1', 'm9', 'p1', 'p9', 's1', 's9', 'e', 's', 'w', 'n', 'haku', 'hatsu', 'chun'];
		return (
			(!state.handTiles.some(t => yaochuTiles.includes(t))) &&
			(state.huros.filter(huro =>
				huro.type === 'pon' ? yaochuTiles.includes(huro.tile) :
				huro.type === 'ankan' ? yaochuTiles.includes(huro.tile) :
				huro.type === 'minkan' ? yaochuTiles.includes(huro.tile) :
				huro.type === 'cii' ? huro.tiles.some(t2 => yaochuTiles.includes(t2)) :
				false).length === 0)
		);
	},
}, {
	name: 'pinfu',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		// 面前じゃないとダメ
		if (state.huros.length !== 0) return false;
		// 三元牌はダメ
		if (state.handTiles.some(t => ['haku', 'hatsu', 'chun'].includes(t))) return false;

		// TODO: 両面待ちかどうか

		const horaSets = getHoraSets(state.handTiles.concat(state.tsumoTile ?? state.ronTile));
		return horaSets.some(horaSet => {
			// 風牌判定(役牌でなければOK)
			if (horaSet.head === state.seatWind) return false;
			if (horaSet.head === state.fieldWind) return false;

			// 全て順子か？
			if (horaSet.mentsus.some((mentsu) => mentsu[0] === mentsu[1])) return false;
		});
	},
}];

export function fanToPoint(fan: number, isParent: boolean): number {
	let point;

	if (fan >= 13) {
		point = 32000;
	} else if (fan >= 11) {
		point = 24000;
	} else if (fan >= 8) {
		point = 16000;
	} else if (fan >= 6) {
		point = 12000;
	} else if (fan >= 4) {
		point = 8000;
	} else if (fan >= 3) {
		point = 4000;
	} else if (fan >= 2) {
		point = 2000;
	} else {
		point = 1000;
	}

	if (isParent) {
		point *= 1.5;
	}

	return point;
}

export function calcOwnedDoraCount(handTiles: Tile[], huros: Huro[], doras: Tile[]): number {
	let count = 0;
	for (const t of handTiles) {
		if (doras.includes(t)) count++;
	}
	for (const huro of huros) {
		if (huro.type === 'pon' && doras.includes(huro.tile)) count += 3;
		if (huro.type === 'cii') count += huro.tiles.filter(t => doras.includes(t)).length;
		if (huro.type === 'minkan' && doras.includes(huro.tile)) count += 4;
		if (huro.type === 'ankan' && doras.includes(huro.tile)) count += 4;
	}
	return count;
}

export function calcTsumoHoraPointDeltas(house: House, fans: number): Record<House, number> {
	const isParent = house === 'e';

	const deltas: Record<House, number> = {
		e: 0,
		s: 0,
		w: 0,
		n: 0,
	};

	const point = fanToPoint(fans, isParent);
	deltas[house] = point;
	if (isParent) {
		const childPoint = Math.ceil(point / 3);
		deltas.s = -childPoint;
		deltas.w = -childPoint;
		deltas.n = -childPoint;
	} else {
		const parentPoint = Math.ceil(point / 2);
		deltas.e = -parentPoint;
		const otherPoint = Math.ceil(point / 4);
		if (house === 's') {
			deltas.w = -otherPoint;
			deltas.n = -otherPoint;
		} else if (house === 'w') {
			deltas.s = -otherPoint;
			deltas.n = -otherPoint;
		} else if (house === 'n') {
			deltas.s = -otherPoint;
			deltas.w = -otherPoint;
		}
	}

	return deltas;
}

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
		default: throw new Error(`unrecognized house: ${house}`);
	}
}

export function prevHouse(house: House): House {
	switch (house) {
		case 'e': return 'n';
		case 's': return 'e';
		case 'w': return 's';
		case 'n': return 'w';
		default: throw new Error(`unrecognized house: ${house}`);
	}
}

type HoraSet = {
	head: Tile;
	mentsus: [Tile, Tile, Tile][];
};

export const SHUNTU_PATTERNS: [Tile, Tile, Tile][] = [
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

function extractShuntsus(tiles: Tile[]): [Tile, Tile, Tile][] {
	const tempTiles = [...tiles];

	tempTiles.sort((a, b) => {
		const aIndex = TILE_TYPES.indexOf(a);
		const bIndex = TILE_TYPES.indexOf(b);
		return aIndex - bIndex;
	});

	const shuntsus: [Tile, Tile, Tile][] = [];
	while (tempTiles.length > 0) {
		let isShuntu = false;
		for (const shuntuPattern of SHUNTU_PATTERNS) {
			if (
				tempTiles[0] === shuntuPattern[0] &&
				tempTiles.includes(shuntuPattern[1]) &&
				tempTiles.includes(shuntuPattern[2])
			) {
				shuntsus.push(shuntuPattern);
				tempTiles.splice(0, 1);
				tempTiles.splice(tempTiles.indexOf(shuntuPattern[1]), 1);
				tempTiles.splice(tempTiles.indexOf(shuntuPattern[2]), 1);
				isShuntu = true;
				break;
			}
		}

		if (!isShuntu) tempTiles.splice(0, 1);
	}

	return shuntsus;
}

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

			const shuntsus = extractShuntsus(tempHandTilesWithoutKotsu);

			if (shuntsus.length * 3 === tempHandTilesWithoutKotsu.length) { // アガリ形
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

// TODO: 国士無双判定関数

// TODO: 七対子判定関数

export function getTilesForRiichi(handTiles: Tile[]): Tile[] {
	return handTiles.filter(tile => {
		const tempHandTiles = [...handTiles];
		tempHandTiles.splice(tempHandTiles.indexOf(tile), 1);
		const horaTiles = getHoraTiles(tempHandTiles);
		return horaTiles.length > 0;
	});
}

export function nextTileForDora(tile: Tile): Tile {
	return NEXT_TILE_FOR_DORA_MAP[tile];
}
