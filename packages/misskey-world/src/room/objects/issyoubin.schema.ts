/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const issyoubin_schema = defineObjectSchema({
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
