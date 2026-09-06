/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const cactusS_schema = defineFurnitureSchema({
	id: 'cactusS',
	options: {
		schema: {
			potMat: {
				type: 'material',
			},
		},
		default: {
			potMat: { color: [0.45, 0.45, 0.45], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
});
