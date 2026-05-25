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
				enum: [0, 1],
			},
			width: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			thickness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			variation: 0,
			width: 0.07,
			height: 0.07,
			thickness: 0.1,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
