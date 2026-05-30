/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const wallShelf_schema = defineFurnitureSchema({
	id: 'wallShelf',
	options: {
		schema: {
			style: {
				type: 'enum',
				enum: [{
					value: 'A',
				}, {
					value: 'B',
				}, {
					value: 'C',
				}, {
					value: 'D',
				}],
			},
			boardMat: {
				type: 'material',
			},
		},
		default: {
			style: 'A',
			boardMat: { color: [1, 1, 1], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'side',
});
