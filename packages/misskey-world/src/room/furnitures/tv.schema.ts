/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const tv_schema = defineFurnitureSchema({
	id: 'tv',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			screenBrightness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0, 0, 0], roughness: 0.3, metallic: 0.5 },
			screenBrightness: 0.5,
		},
	},
	placement: 'top',
	hasCollisions: true,
	hasTexture: true,
});
