/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const cardboardBox_schema = defineFurnitureSchema({
	id: 'cardboardBox',
	options: {
		schema: {
			variation: {
				type: 'enum',
				enum: [{
					value: 'default',
				}, {
					value: 'mikan',
				}, {
					value: 'aizon',
				}],
			},
		},
		default: {
			variation: 'default',
		},
	},
	placement: 'top',
	hasCollisions: true,
	hasTexture: true,
});
