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
