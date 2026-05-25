/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const icosahedron_schema = defineObjectSchema({
	id: 'icosahedron',
	options: {
		schema: {
			mat: {
				type: 'material',
			},
		},
		default: {
			mat: { color: [0.32, 0.12, 0.05], metallic: 1, roughness: 0.5 },
		},
	},
	placement: 'top',
	hasCollisions: false,
});
