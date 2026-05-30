/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const petBottle_schema = defineFurnitureSchema({
	id: 'petBottle',
	options: {
		schema: {
			variation: {
				type: 'enum',
				enum: [{
					value: 'mineral-water',
				}, {
					value: 'green-tea',
				}],
			},
			withCap: {
				type: 'boolean',
			},
			withLabel: {
				type: 'boolean',
			},
			empty: {
				type: 'boolean',
			},
		},
		default: {
			variation: 'mineral-water',
			withCap: true,
			withLabel: true,
			empty: false,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
