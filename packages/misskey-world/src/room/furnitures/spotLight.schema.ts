/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const spotLight_schema = defineFurnitureSchema({
	id: 'spotLight',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			light: {
				type: 'light',
			},
			angleV: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			angleH: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 1 },
			light: {
				color: [1, 0.5, 0.2],
				brightness: 0.2,
			},
			angleV: 0.75,
			angleH: 0.5,
		},
	},
	placement: 'bottom',
	hasCollisions: false,
});
