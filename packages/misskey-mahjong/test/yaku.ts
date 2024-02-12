/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'node:assert';
import { calcYakus } from '../src/common.yaku.js';

describe('Yaku', () => {
	describe('Riichi', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				riichi: true,
			}), ['riichi']);
		});
	});

	describe('kokushi', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm9', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e'] ,
				huros: [],
			        tumoTiles: 'm1',
			}), ['kokushi']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
			        handTiles: ['m1', 'm9', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm3'] ,
				huros: [],
			        tumoTiles: 'm3',
			}).includes('kokushi'), false);
		});
	});

	describe('daisangen', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['haku', 'haku', 'haku', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'p2', 'p2', 'p2', 's2', 's2'],
				huros: [],
				tsumoTile: 's2',
			}), ['daisangen']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'p2', 'p2', 'p2', 's2', 's2'],
				huros: [{type: 'pon', tile: 'haku'}],
				tsumoTile: 's2',
git 			}), ['daisangen']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
			      	house: 'e',
				handTiles: ['haku', 'haku', 'haku', 'chun', 'chun', 'hatsu', 'hatsu', 'hatsu', 'm1', 'm1', 'm1', 'm2', 'm2', 'm2'] ,
				huros: [],
				tumoTiles: 'm2',
			}).includes('daisangen'), false);
		});
	});


	describe('churen', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm5'],
				huros: [],
				tsumoTile: 'm5',
			}), ['churen']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm2'],
				huros: [],
				tsumoTile: 'm2',
			}).includes('churen'), false);
		});
	});

	describe('churen-9', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm1'],
				huros: [],
				tsumoTile: 'm1',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm2'],
				huros: [],
				tsumoTile: 'm2',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm3'],
				huros: [],
				tsumoTile: 'm3',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm4'],
				huros: [],
				tsumoTile: 'm4',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm5'],
				huros: [],
				tsumoTile: 'm5',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm6'],
				huros: [],
				tsumoTile: 'm6',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm7'],
				huros: [],
				tsumoTile: 'm7',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm8'],
				huros: [],
				tsumoTile: 'm8',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm9'],
				huros: [],
				tsumoTile: 'm9',
			}), ['churen-9']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm5'],
				huros: [],
				tsumoTile: 'm5',
			}).includes('churen-9'), false);
		});
	});
});
