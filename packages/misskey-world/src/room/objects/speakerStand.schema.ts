/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const speakerStand_schema = defineFurnitureSchema({
	id: 'speakerStand',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			height: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0.2, 0.2, 0.2], roughness: 0.5, metallic: 0.8 },
			height: 0.1,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: false,
});
