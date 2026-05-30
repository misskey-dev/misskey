/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const issyoubin_schema = defineFurnitureSchema({
	id: 'issyoubin',
	options: {
		schema: {
			variation: {
				type: 'enum',
				enum: [{
					value: 'misuki',
				}, {
					value: 'ai',
				}],
			},
		},
		default: {
			variation: 'misuki',
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
