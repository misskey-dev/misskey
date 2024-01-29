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
	type: 'minkan';
	tile: Tile;
	from: House;
} | {
	type: 'ankan';
	tile: Tile;
	from: House;
};

export const yakuNames = [
	'riichi',
	'ippatsu',
	'tsumo',
	'tanyao',
	'pinfu',
	'iipeko',
	'field-wind',
	'seat-wind',
	'white',
	'green',
	'red',
	'rinshan',
	'chankan',
	'haitei',
	'hotei',
	'sanshoku-dojun',
	'sanshoku-doko',
	'ittsu',
	'chanta',
	'chitoitsu',
	'toitoi',
	'sananko',
	'honroto',
	'sankantsu',
	'shosangen',
	'double-riichi',
	'honitsu',
	'junchan',
	'ryampeko',
	'chinitsu',
	'dora',
	'red-dora',
] as const;

export const yakumanNames = [
	'kokushi',
	'kokushi-13',
	'suanko',
	'suanko-tanki',
	'daisangen',
	'tsuiso',
	'shosushi',
	'daisushi',
	'ryuiso',
	'chinroto',
	'sukantsu',
	'churen',
	'pure-churen',
	'tenho',
	'chiho',
] as const;

type EnvForCalcYaku = {
	house: House;

	/**
	 * 和了る人の手牌(副露した牌は含まない)
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
	name: 'seat-wind',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		return (
			(state.handTiles.filter(t => t === state.house).length >= 3) ||
			(state.huros.filter(huro =>
				huro.type === 'pon' ? huro.tile === state.house :
				huro.type === 'ankan' ? huro.tile === state.house :
				huro.type === 'minkan' ? huro.tile === state.house :
				false).length >= 3)
		);
	},
}, {
	name: 'tanyao',
	fan: 1,
	calc: (state: EnvForCalcYaku) => {
		const yaochuTiles: Tile[] = ['m1', 'm9', 'p1', 'p9', 's1', 's9', 'e', 's', 'w', 'n', 'haku', 'hatsu', 'chun'];
		return (
			(state.handTiles.filter(t => yaochuTiles.includes(t)).length === 0) &&
			(state.huros.filter(huro =>
				huro.type === 'pon' ? yaochuTiles.includes(huro.tile) :
				huro.type === 'ankan' ? yaochuTiles.includes(huro.tile) :
				huro.type === 'minkan' ? yaochuTiles.includes(huro.tile) :
				huro.type === 'cii' ? huro.tiles.some(t2 => yaochuTiles.includes(t2)) :
				false).length === 0)
		);
	},
}];
