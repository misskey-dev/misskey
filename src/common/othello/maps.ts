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
	size: number;
	data: string;
};

export const fourfour: Map = {
	name: '4x4',
	size: 4,
	data:
		'----' +
		'-wb-' +
		'-bw-' +
		'----'
};

export const sixsix: Map = {
	name: '6x6',
	size: 6,
	data:
		'------' +
		'------' +
		'--wb--' +
		'--bw--' +
		'------' +
		'------'
};

export const eighteight: Map = {
	name: '8x8',
	size: 8,
	data:
		'--------' +
		'--------' +
		'--------' +
		'---wb---' +
		'---bw---' +
		'--------' +
		'--------' +
		'--------'
};

export const roundedEighteight: Map = {
	name: '8x8 rounded',
	size: 8,
	data:
		' ------ ' +
		'--------' +
		'--------' +
		'---wb---' +
		'---bw---' +
		'--------' +
		'--------' +
		' ------ '
};

export const roundedEighteight2: Map = {
	name: '8x8 rounded 2',
	size: 8,
	data:
		'  ----  ' +
		' ------ ' +
		'--------' +
		'---wb---' +
		'---bw---' +
		'--------' +
		' ------ ' +
		'  ----  '
};

export const eighteightWithNotch: Map = {
	name: '8x8 with notch',
	size: 8,
	data:
		'---  ---' +
		'--------' +
		'--------' +
		' --wb-- ' +
		' --bw-- ' +
		'--------' +
		'--------' +
		'---  ---'
};

export const eighteightWithSomeHoles: Map = {
	name: '8x8 with some holes',
	size: 8,
	data:
		'--- ----' +
		'----- --' +
		'-- -----' +
		'---wb---' +
		'---bw- -' +
		' -------' +
		'--- ----' +
		'--------'
};

export const sixeight: Map = {
	name: '6x8',
	size: 8,
	data:
		' ------ ' +
		' ------ ' +
		' ------ ' +
		' --wb-- ' +
		' --bw-- ' +
		' ------ ' +
		' ------ ' +
		' ------ '
};

export const tenthtenth: Map = {
	name: '10x10',
	size: 10,
	data:
		'----------' +
		'----------' +
		'----------' +
		'----------' +
		'----wb----' +
		'----bw----' +
		'----------' +
		'----------' +
		'----------' +
		'----------'
};

export const hole: Map = {
	name: 'hole',
	size: 10,
	data:
		'----------' +
		'----------' +
		'--wb--wb--' +
		'--bw--bw--' +
		'----  ----' +
		'----  ----' +
		'--wb--wb--' +
		'--bw--bw--' +
		'----------' +
		'----------'
};

export const spark: Map = {
	name: 'spark',
	size: 10,
	data:
		' -      - ' +
		'----------' +
		' -------- ' +
		' -------- ' +
		' ---wb--- ' +
		' ---bw--- ' +
		' -------- ' +
		' -------- ' +
		'----------' +
		' -      - '
};

export const islands: Map = {
	name: 'islands',
	size: 10,
	data:
		'--------  ' +
		'---wb---  ' +
		'---bw---  ' +
		'--------  ' +
		'  -    -  ' +
		'  -    -  ' +
		'  --------' +
		'  ---bw---' +
		'  ---wb---' +
		'  --------'
};

export const grid: Map = {
	name: 'grid',
	size: 10,
	data:
		'----------' +
		'- - -- - -' +
		'----------' +
		'- - -- - -' +
		'----wb----' +
		'----bw----' +
		'- - -- - -' +
		'----------' +
		'- - -- - -' +
		'----------'
};

export const iphonex: Map = {
	name: 'iPhone X',
	size: 10,
	data:
		'  --  --  ' +
		' -------- ' +
		' -------- ' +
		' -------- ' +
		' ---wb--- ' +
		' ---bw--- ' +
		' -------- ' +
		' -------- ' +
		' -------- ' +
		'  ------  '
};
