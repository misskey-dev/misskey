/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const laptopPc_schema = defineFurnitureSchema({
	id: 'laptopPc',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			bezelMat: {
				type: 'material',
			},
			screenBrightness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				presets: [],
			},
			openAngle: {
				type: 'range',
				min: -Math.PI / 2,
				max: Math.PI / 2,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [1, 1, 1], roughness: 0.5, metallic: 1 },
			bezelMat: { color: [0, 0, 0], roughness: 0, metallic: 0 },
			screenBrightness: 0.5,
			image: { type: null },
			openAngle: 0,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
