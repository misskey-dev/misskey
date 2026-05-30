/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const handheldGameConsole_schema = defineFurnitureSchema({
	id: 'handheldGameConsole',
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
			image: {
				type: 'image',
				presets: [],
			},
		},
		default: {
			bodyMat: { color: [1, 1, 1], roughness: 0.5, metallic: 0 },
			screenBrightness: 0.5,
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
