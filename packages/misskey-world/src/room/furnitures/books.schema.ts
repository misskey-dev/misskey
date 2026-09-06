/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const books_schema = defineFurnitureSchema({
	id: 'books',
	options: {
		schema: {
			variation: {
				type: 'enum',
				enum: [{
					value: 'A',
				}, {
					value: 'B',
				}, {
					value: 'C',
				}, {
					value: 'D',
				}, {
					value: 'E',
				}],
			},
		},
		default: {
			variation: 'A',
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: false,
});
