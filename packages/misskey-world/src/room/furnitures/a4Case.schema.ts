/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const a4Case_schema = defineFurnitureSchema({
	id: 'a4Case',
	options: {
		schema: {
			mat: {
				type: 'material',
			},
		},
		default: {
			mat: { color: [0.9, 0.9, 0.9], roughness: 0.3, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
});
