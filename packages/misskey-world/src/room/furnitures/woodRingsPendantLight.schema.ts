/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const woodRingsPendantLight_schema = defineFurnitureSchema({
	id: 'woodRingsPendantLight',
	options: {
		schema: {
			shadeMat: {
				type: 'material',
			},
			bodyMat: {
				type: 'material',
			},
			light: {
				type: 'light',
			},
			length: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			shadeMat: { color: [0.21, 0.04, 0], roughness: 0.5, metallic: 0 },
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 1 },
			light: {
				color: [1, 0.5, 0.2],
				brightness: 0.5,
			},
			length: 0.2,
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
});
