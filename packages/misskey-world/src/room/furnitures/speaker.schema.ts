/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const speaker_schema = defineFurnitureSchema({
	id: 'speaker',
	options: {
		schema: {
			outerMat: {
				type: 'material',
			},
			innerMat: {
				type: 'material',
			},
		},
		default: {
			outerMat: { color: [0.45, 0.8, 0], roughness: 0.1, metallic: 0 },
			innerMat: { color: [0, 0, 0], roughness: 0.5, metallic: 0.5 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: false,
	canPreMeshesMerging: true,
});
