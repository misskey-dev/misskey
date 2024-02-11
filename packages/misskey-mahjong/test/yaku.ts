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
	}
}
