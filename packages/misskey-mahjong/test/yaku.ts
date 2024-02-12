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
			        handTiles: ['m1', 'm1', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm9'] ,
				huros: [],
			        tumoTiles: 'm9',
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

	describe('kokushi-13', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
			        handTiles: ['m1', 'm9', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm1'] ,
				huros: [],
			        tumoTiles: 'm1',
			}), ['kokushi-13']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
			        handTiles: ['m1', 'm1', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm9'] ,
				huros: [],
			        tumoTiles: 'm1',
			}).includes('kokushi-13'), false);
		});
	});

	describe('suanko', () => {
		it('valid',() => {
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'e', 'e'],
			 	huros: [],
				tsumoTile: 'chun',
			}), ['suanko']);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m2', 'm2', 'm2', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'e', 'e'],
			 	huros: [{type: 'ankan', :tile: 'm1'}],
				tsumoTile: 'chun',
			}), ['suanko']);
		});

		it('invalid',() => {
		      	assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'm2', 'm2', 'e', 'e', 'e'],
				huros: [{type: 'pom', tile: 'm1'}],
				ronTile: 'e',
			}).includes('suanko'), false);

		      	assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'm2', 'm2', 'e', 'e', 'e'],
				huros: [],
				ronTile: 'e',
			}).includes('suanko'), false);

			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'm2', 'm2', 'e', 'e', 'e'],
				huros: [],
				ronTile: 'e',
			}).includes('suanko'), false);
		});
	});

	describe('suanko-tanki', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'm3', 'm3', 'm3', 'haku', 'haku', 'haku', 'e', 'e'],
				huros: [],
				tsumoTile: 'e',
			}), ['suanko-tanki']);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m2', 'm2', 'm2', 'm3', 'm3', 'm3', 'haku', 'haku', 'haku', 'e', 'e'],
				huros: [{type: 'ankan', tile: 'm1'}],
				tsumoTile: 'e',
			}), ['suanko-tanki']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'e', 'e'],
			 	huros: [],
				tsumoTile: 'chun',
			}).includes('suanko-tanki'), false);
		});
	})

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
 			}), ['daisangen']);
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

	describe('tsuiso', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['haku', 'haku', 'haku', 'hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}), ['tsuiso']);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'haku'}],
				tsumoTile: 's',
			}), ['tsuiso']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}).includes('tsuiso'), false);

			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 's',
			}).includes('tuiso'), false);
		});
	})

	describe('shosushi', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'n', 'n', 'n', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}), ['shosushi']);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'n', 'n', 'n', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'e'}],
				tsumoTile: 's',
			}), ['shosushi']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}).includes('shosushi'), false);

			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 's',
			}).includes('shosushi'), false);
		});
	})

	describe('daisushi', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'n', 'n', 'n', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}), ['daisushi']);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'n', 'n', 'n', 'w', 'w', 'w', 's', 's', 's'],
				huros: [{type: 'pon', tile: 'e'}],
				tsumoTile: 'e',
			}), ['daisushi']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m1', 'm1', 'm1', 'n', 'n', 'n', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}).includes('daisushi'), false);

			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 'e',
			}).includes('daisushi'), false);
		});
	})

	describe('ryuiso', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['s2', 's2', 's2', 's2', 's3', 's4', 's6', 's6', 's6', 's8', 's8', 's8', 'hatsu', 'hatsu'],
				huros: [],
				tsumoTile: 'hatsu',
			}), ['ryuiso']);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8'],
				huros: [{type: 'pon', tile: 'hatsu'}],
				tsumoTile: 's8',
			}), ['ryuiso']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: '',
			        handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8','haku','haku','haku'],
			        huros: [],
				tsumoTile: 's',
			}).includes('ryuiso'), false);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8'],
				huros: [{type: 'pon', tile: 'haku'}],
				tsumoTile: 's',
			}).includes('ryuiso'), false);
		});
	})

	describe('chinroto', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				house: '',
			        handTiles: ['m1','m1','m1''m9', 'm9', 'm9', 's1', 's1', 's1', 's9', 's9', 's9', 'p1', 'p1'],
				huros: [],
				tsumoTile: 'p1',
			}), ['chinroto']);
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['m9', 'm9', 'm9', 's1', 's1', 's1', 's9', 's9', 's9', 'p1', 'p1'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 'p1',
			}), ['chinroto']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: '',
			        handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8','haku','haku','haku'],
			        huros: [],
				tsumoTile: 's',
			}).includes('chinroto'), false);
		});
	})

	describe('sukantsu', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				house: '',
				handTiles: ['p1', 'p1'],
			        huros: [{type: 'ankan', tile: 'm1'}, {type: 'ankan', tile: 'm2'}, {type: 'minkan', tile: 'm3'}, {type: 'minkan', tile: 'chun'}],
				tsumoTile: 'p1',
			}), ['sukantsu']);
		});
		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				house: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm2'],
				huros: [],
				tsumoTile: 'm2',
			}).includes('sukantsu'), false);
		});
	})

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
