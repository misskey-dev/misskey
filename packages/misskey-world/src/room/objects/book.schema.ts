/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const book_schema = defineObjectSchema({
	id: 'book',
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
	canPreMeshesMerging: true,
});
