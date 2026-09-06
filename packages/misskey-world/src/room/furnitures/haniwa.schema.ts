/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const haniwa_schema = defineFurnitureSchema({
	id: 'haniwa',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			insideColor: {
				type: 'color',
			},
		},
		default: {
			bodyMat: { color: [0.3, 0.3, 0.3], roughness: 0.6, metallic: 0 },
			insideColor: [1, 1, 1],
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: false,
	canPreMeshesMerging: true,
});
