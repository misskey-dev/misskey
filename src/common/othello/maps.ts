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
	size: number;
	data: string;
};

export const fourfour: Map = {
	name: '4x4',
	category: '4x4',
	size: 4,
	data:
		'----' +
		'-wb-' +
		'-bw-' +
		'----'
};

export const sixsix: Map = {
	name: '6x6',
	category: '6x6',
	size: 6,
	data:
		'------' +
		'------' +
		'--wb--' +
		'--bw--' +
		'------' +
		'------'
};

export const roundedSixsix: Map = {
	name: '6x6 rounded',
	category: '6x6',
	size: 6,
	data:
		' ---- ' +
		'------' +
		'--wb--' +
		'--bw--' +
		'------' +
		' ---- '
};

export const roundedSixsix2: Map = {
	name: '6x6 rounded 2',
	category: '6x6',
	size: 6,
	data:
		'  --  ' +
		' ---- ' +
		'--wb--' +
		'--bw--' +
		' ---- ' +
		'  --  '
};

export const eighteight: Map = {
	name: '8x8',
	category: '8x8',
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
	category: '8x8',
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
	category: '8x8',
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

export const roundedEighteight3: Map = {
	name: '8x8 rounded 3',
	category: '8x8',
	size: 8,
	data:
		'   --   ' +
		'  ----  ' +
		' ------ ' +
		'---wb---' +
		'---bw---' +
		' ------ ' +
		'  ----  ' +
		'   --   '
};

export const eighteightWithNotch: Map = {
	name: '8x8 with notch',
	category: '8x8',
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
	category: '8x8',
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

export const circle: Map = {
	name: 'Circle',
	category: '8x8',
	size: 8,
	data:
		'   --   ' +
		' ------ ' +
		' ------ ' +
		'---wb---' +
		'---bw---' +
		' ------ ' +
		' ------ ' +
		'   --   '
};

export const face: Map = {
	name: 'Face',
	category: '8x8',
	size: 8,
	data:
		' ------ ' +
		'--------' +
		'-- -- --' +
		'---wb---' +
		'-- bw --' +
		'---  ---' +
		'--------' +
		' ------ '
};

export const window: Map = {
	name: 'Window',
	category: '8x8',
	size: 8,
	data:
		'--------' +
		'-  --  -' +
		'-  --  -' +
		'---wb---' +
		'---bw---' +
		'-  --  -' +
		'-  --  -' +
		'--------'
};

export const tenthtenth: Map = {
	name: '10x10',
	category: '10x10',
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
	name: 'The Hole',
	category: '10x10',
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

export const grid: Map = {
	name: 'Grid',
	category: '10x10',
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

export const cross: Map = {
	name: 'Cross',
	category: '10x10',
	size: 10,
	data:
		'   ----   ' +
		'   ----   ' +
		'   ----   ' +
		'----------' +
		'----wb----' +
		'----bw----' +
		'----------' +
		'   ----   ' +
		'   ----   ' +
		'   ----   '
};

export const walls: Map = {
	name: 'Walls',
	category: '10x10',
	size: 10,
	data:
		' bbbbbbbb ' +
		'w--------w' +
		'w--------w' +
		'w--------w' +
		'w---wb---w' +
		'w---bw---w' +
		'w--------w' +
		'w--------w' +
		'w--------w' +
		' bbbbbbbb '
};

export const sixeight: Map = {
	name: '6x8',
	category: 'special',
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

export const spark: Map = {
	name: 'Spark',
	category: 'special',
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
	name: 'Islands',
	category: 'special',
	size: 10,
	data:
		'--------  ' +
		'---wb---  ' +
		'---bw---  ' +
		'--------  ' +
		'  -    -  ' +
		'  -    -  ' +
		'  --------' +
		'  --------' +
		'  --------' +
		'  --------'
};

export const iphonex: Map = {
	name: 'iPhone X',
	category: 'special',
	size: 12,
	data:
		'   --  --   ' +
		'  --------  ' +
		'  --------  ' +
		'  --------  ' +
		'  --------  ' +
		'  ---wb---  ' +
		'  ---bw---  ' +
		'  --------  ' +
		'  --------  ' +
		'  --------  ' +
		'  --------  ' +
		'   ------   '
};

export const bigBoard: Map = {
	name: 'Big board',
	category: 'special',
	size: 16,
	data:
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'-------wb-------' +
		'-------bw-------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------' +
		'----------------'
};

export const twoBoard: Map = {
	name: 'Two board',
	category: 'special',
	size: 17,
	data:
		'-------- --------' +
		'-------- --------' +
		'-------- --------' +
		'---wb--- ---wb---' +
		'---bw--- ---bw---' +
		'-------- --------' +
		'-------- --------' +
		'-------- --------' +
		'                 ' +
		'                 ' +
		'                 ' +
		'                 ' +
		'                 ' +
		'                 ' +
		'                 ' +
		'                 ' +
		'                 '
};
