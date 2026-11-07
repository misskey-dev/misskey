/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * 組み込みマップ定義
 *
 * データ値:
 * (スペース) ... マス無し
 * - ... マス
 * b ... 初期配置される黒石
 * w ... 初期配置される白石
 */

export type Map = {
	name?: string;
	category?: string;
	author?: string;
	data: string[];
};

export const fourfour: Map = {
	name: '4x4',
	category: '4x4',
	data: [
		'----',
		'-wb-',
		'-bw-',
		'----',
	],
};

export const sixsix: Map = {
	name: '6x6',
	category: '6x6',
	data: [
		'------',
		'------',
		'--wb--',
		'--bw--',
		'------',
		'------',
	],
};

export const roundedSixsix: Map = {
	name: '6x6 rounded',
	category: '6x6',
	author: 'syuilo',
	data: [
		' ---- ',
		'------',
		'--wb--',
		'--bw--',
		'------',
		' ---- ',
	],
};

export const roundedSixsix2: Map = {
	name: '6x6 rounded 2',
	category: '6x6',
	author: 'syuilo',
	data: [
		'  --  ',
		' ---- ',
		'--wb--',
		'--bw--',
		' ---- ',
		'  --  ',
	],
};

export const eighteight: Map = {
	name: '8x8',
	category: '8x8',
	data: [
		'--------',
		'--------',
		'--------',
		'---wb---',
		'---bw---',
		'--------',
		'--------',
		'--------',
	],
};

export const eighteightH28: Map = {
	name: '8x8 handicap 28',
	category: '8x8',
	data: [
		'bbbbbbbb',
		'b------b',
		'b------b',
		'b--wb--b',
		'b--bw--b',
		'b------b',
		'b------b',
		'bbbbbbbb',
	],
};

export const roundedEighteight: Map = {
	name: '8x8 rounded',
	category: '8x8',
	author: 'syuilo',
	data: [
		' ------ ',
		'--------',
		'--------',
		'---wb---',
		'---bw---',
		'--------',
		'--------',
		' ------ ',
	],
};

export const roundedEighteight2: Map = {
	name: '8x8 rounded 2',
	category: '8x8',
	author: 'syuilo',
	data: [
		'  ----  ',
		' ------ ',
		'--------',
		'---wb---',
		'---bw---',
		'--------',
		' ------ ',
		'  ----  ',
	],
};

export const roundedEighteight3: Map = {
	name: '8x8 rounded 3',
	category: '8x8',
	author: 'syuilo',
	data: [
		'   --   ',
		'  ----  ',
		' ------ ',
		'---wb---',
		'---bw---',
		' ------ ',
		'  ----  ',
		'   --   ',
	],
};

export const eighteightWithNotch: Map = {
	name: '8x8 with notch',
	category: '8x8',
	author: 'syuilo',
	data: [
		'---  ---',
		'--------',
		'--------',
		' --wb-- ',
		' --bw-- ',
		'--------',
		'--------',
		'---  ---',
	],
};

export const eighteightWithSomeHoles: Map = {
	name: '8x8 with some holes',
	category: '8x8',
	author: 'syuilo',
	data: [
		'--- ----',
		'----- --',
		'-- -----',
		'---wb---',
		'---bw- -',
		' -------',
		'--- ----',
		'--------',
	],
};

export const circle: Map = {
	name: 'Circle',
	category: '8x8',
	author: 'syuilo',
	data: [
		'   --   ',
		' ------ ',
		' ------ ',
		'---wb---',
		'---bw---',
		' ------ ',
		' ------ ',
		'   --   ',
	],
};

export const smile: Map = {
	name: 'Smile',
	category: '8x8',
	author: 'syuilo',
	data: [
		' ------ ',
		'--------',
		'-- -- --',
		'---wb---',
		'-- bw --',
		'---  ---',
		'--------',
		' ------ ',
	],
};

export const window: Map = {
	name: 'Window',
	category: '8x8',
	author: 'syuilo',
	data: [
		'--------',
		'-  --  -',
		'-  --  -',
		'---wb---',
		'---bw---',
		'-  --  -',
		'-  --  -',
		'--------',
	],
};

export const reserved: Map = {
	name: 'Reserved',
	category: '8x8',
	author: 'Aya',
	data: [
		'w------b',
		'--------',
		'--------',
		'---wb---',
		'---bw---',
		'--------',
		'--------',
		'b------w',
	],
};

export const x: Map = {
	name: 'X',
	category: '8x8',
	author: 'Aya',
	data: [
		'w------b',
		'-w----b-',
		'--w--b--',
		'---wb---',
		'---bw---',
		'--b--w--',
		'-b----w-',
		'b------w',
	],
};

export const parallel: Map = {
	name: 'Parallel',
	category: '8x8',
	author: 'Aya',
	data: [
		'--------',
		'--------',
		'--------',
		'---bb---',
		'---ww---',
		'--------',
		'--------',
		'--------',
	],
};

export const lackOfBlack: Map = {
	name: 'Lack of Black',
	category: '8x8',
	data: [
		'--------',
		'--------',
		'--------',
		'---w----',
		'---bw---',
		'--------',
		'--------',
		'--------',
	],
};

export const squareParty: Map = {
	name: 'Square Party',
	category: '8x8',
	author: 'syuilo',
	data: [
		'--------',
		'-wwwbbb-',
		'-w-wb-b-',
		'-wwwbbb-',
		'-bbbwww-',
		'-b-bw-w-',
		'-bbbwww-',
		'--------',
	],
};

export const minesweeper: Map = {
	name: 'Minesweeper',
	category: '8x8',
	author: 'syuilo',
	data: [
		'b-b--w-w',
		'-w-wb-b-',
		'w-b--w-b',
		'-b-wb-w-',
		'-w-bw-b-',
		'b-w--b-w',
		'-b-bw-w-',
		'w-w--b-b',
	],
};

export const tenthtenth: Map = {
	name: '10x10',
	category: '10x10',
	data: [
		'----------',
		'----------',
		'----------',
		'----------',
		'----wb----',
		'----bw----',
		'----------',
		'----------',
		'----------',
		'----------',
	],
};

export const hole: Map = {
	name: 'The Hole',
	category: '10x10',
	author: 'syuilo',
	data: [
		'----------',
		'----------',
		'--wb--wb--',
		'--bw--bw--',
		'----  ----',
		'----  ----',
		'--wb--wb--',
		'--bw--bw--',
		'----------',
		'----------',
	],
};

export const grid: Map = {
	name: 'Grid',
	category: '10x10',
	author: 'syuilo',
	data: [
		'----------',
		'- - -- - -',
		'----------',
		'- - -- - -',
		'----wb----',
		'----bw----',
		'- - -- - -',
		'----------',
		'- - -- - -',
		'----------',
	],
};

export const cross: Map = {
	name: 'Cross',
	category: '10x10',
	author: 'Aya',
	data: [
		'   ----   ',
		'   ----   ',
		'   ----   ',
		'----------',
		'----wb----',
		'----bw----',
		'----------',
		'   ----   ',
		'   ----   ',
		'   ----   ',
	],
};

export const charX: Map = {
	name: 'Char X',
	category: '10x10',
	author: 'syuilo',
	data: [
		'---    ---',
		'----  ----',
		'----------',
		' -------- ',
		'  --wb--  ',
		'  --bw--  ',
		' -------- ',
		'----------',
		'----  ----',
		'---    ---',
	],
};

export const charY: Map = {
	name: 'Char Y',
	category: '10x10',
	author: 'syuilo',
	data: [
		'---    ---',
		'----  ----',
		'----------',
		' -------- ',
		'  --wb--  ',
		'  --bw--  ',
		'  ------  ',
		'  ------  ',
		'  ------  ',
		'  ------  ',
	],
};

export const walls: Map = {
	name: 'Walls',
	category: '10x10',
	author: 'Aya',
	data: [
		' bbbbbbbb ',
		'w--------w',
		'w--------w',
		'w--------w',
		'w---wb---w',
		'w---bw---w',
		'w--------w',
		'w--------w',
		'w--------w',
		' bbbbbbbb ',
	],
};

export const cpu: Map = {
	name: 'CPU',
	category: '10x10',
	author: 'syuilo',
	data: [
		' b b  b b ',
		'w--------w',
		' -------- ',
		'w--------w',
		' ---wb--- ',
		' ---bw--- ',
		'w--------w',
		' -------- ',
		'w--------w',
		' b b  b b ',
	],
};

export const checker: Map = {
	name: 'Checker',
	category: '10x10',
	author: 'Aya',
	data: [
		'----------',
		'----------',
		'----------',
		'---wbwb---',
		'---bwbw---',
		'---wbwb---',
		'---bwbw---',
		'----------',
		'----------',
		'----------',
	],
};

export const japaneseCurry: Map = {
	name: 'Japanese curry',
	category: '10x10',
	author: 'syuilo',
	data: [
		'w-b-b-b-b-',
		'-w-b-b-b-b',
		'w-w-b-b-b-',
		'-w-w-b-b-b',
		'w-w-wwb-b-',
		'-w-wbb-b-b',
		'w-w-w-b-b-',
		'-w-w-w-b-b',
		'w-w-w-w-b-',
		'-w-w-w-w-b',
	],
};

export const mosaic: Map = {
	name: 'Mosaic',
	category: '10x10',
	author: 'syuilo',
	data: [
		'- - - - - ',
		' - - - - -',
		'- - - - - ',
		' - w w - -',
		'- - b b - ',
		' - w w - -',
		'- - b b - ',
		' - - - - -',
		'- - - - - ',
		' - - - - -',
	],
};

export const arena: Map = {
	name: 'Arena',
	category: '10x10',
	author: 'syuilo',
	data: [
		'- - -- - -',
		' - -  - - ',
		'- ------ -',
		' -------- ',
		'- --wb-- -',
		'- --bw-- -',
		' -------- ',
		'- ------ -',
		' - -  - - ',
		'- - -- - -',
	],
};

export const reactor: Map = {
	name: 'Reactor',
	category: '10x10',
	author: 'syuilo',
	data: [
		'-w------b-',
		'b- -  - -w',
		'- --wb-- -',
		'---b  w---',
		'- b wb w -',
		'- w bw b -',
		'---w  b---',
		'- --bw-- -',
		'w- -  - -b',
		'-b------w-',
	],
};

export const sixeight: Map = {
	name: '6x8',
	category: 'Special',
	data: [
		'------',
		'------',
		'------',
		'--wb--',
		'--bw--',
		'------',
		'------',
		'------',
	],
};

export const spark: Map = {
	name: 'Spark',
	category: 'Special',
	author: 'syuilo',
	data: [
		' -      - ',
		'----------',
		' -------- ',
		' -------- ',
		' ---wb--- ',
		' ---bw--- ',
		' -------- ',
		' -------- ',
		'----------',
		' -      - ',
	],
};

export const islands: Map = {
	name: 'Islands',
	category: 'Special',
	author: 'syuilo',
	data: [
		'--------  ',
		'---wb---  ',
		'---bw---  ',
		'--------  ',
		'  -    -  ',
		'  -    -  ',
		'  --------',
		'  --------',
		'  --------',
		'  --------',
	],
};

export const galaxy: Map = {
	name: 'Galaxy',
	category: 'Special',
	author: 'syuilo',
	data: [
		'   ------   ',
		'  --www---  ',
		' ------w--- ',
		'---bbb--w---',
		'--b---b-w-b-',
		'-b--wwb-w-b-',
		'-b-w-bww--b-',
		'-b-w-b---b--',
		'---w--bbb---',
		' ---w------ ',
		'  ---www--  ',
		'   ------   ',
	],
};

export const triangle: Map = {
	name: 'Triangle',
	category: 'Special',
	author: 'syuilo',
	data: [
		'    --    ',
		'    --    ',
		'   ----   ',
		'   ----   ',
		'  --wb--  ',
		'  --bw--  ',
		' -------- ',
		' -------- ',
		'----------',
		'----------',
	],
};

export const iphonex: Map = {
	name: 'iPhone X',
	category: 'Special',
	author: 'syuilo',
	data: [
		' --  -- ',
		'--------',
		'--------',
		'--------',
		'--------',
		'---wb---',
		'---bw---',
		'--------',
		'--------',
		'--------',
		'--------',
		' ------ ',
	],
};

export const dealWithIt: Map = {
	name: 'Deal with it!',
	category: 'Special',
	author: 'syuilo',
	data: [
		'------------',
		'--w-b-------',
		' --b-w------',
		'  --w-b---- ',
		'   -------  ',
	],
};

export const twoBoard: Map = {
	name: 'Two board',
	category: 'Special',
	author: 'Aya',
	data: [
		'-------- --------',
		'-------- --------',
		'-------- --------',
		'---wb--- ---wb---',
		'---bw--- ---bw---',
		'-------- --------',
		'-------- --------',
		'-------- --------',
	],
};
