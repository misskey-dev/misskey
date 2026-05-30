/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const snakeplant_schema = defineFurnitureSchema({
	id: 'snakeplant',
	options: {
		schema: {
			potMat: {
				type: 'material',
			},
		},
		default: {
			potMat: { color: [0.7, 0.7, 0.7], roughness: 1, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
});
