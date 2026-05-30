/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const randomBooks_schema = defineFurnitureSchema({
	id: 'randomBooks',
	options: {
		schema: {
			variation: {
				type: 'enum',
				enum: [{
					value: 'mix',
				}, {
					value: 'mix-plain',
				}],
			},
			count: {
				type: 'range',
				min: 1,
				max: 30,
				step: 1,
			},
			stackVertically: {
				type: 'boolean',
			},
			seed: {
				type: 'seed',
			},
		},
		default: {
			variation: 'mix',
			count: 10,
			stackVertically: false,
			seed: 0,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: false,
});
