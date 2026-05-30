/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const tabletopLcdButtonsController_schema = defineFurnitureSchema({
	id: 'tabletopLcdButtonsController',
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
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 0 },
			screenBrightness: 0.5,
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
