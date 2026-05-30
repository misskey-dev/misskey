/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const woodRingFloorLamp_schema = defineFurnitureSchema({
	id: 'woodRingFloorLamp',
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
		},
		default: {
			shadeMat: { color: [0.21, 0.04, 0], metallic: 0, roughness: 0.5 },
			bodyMat: { color: [0.05, 0.05, 0.05], metallic: 1, roughness: 0.5 },
			light: {
				color: [1, 0.5, 0.2],
				brightness: 0.5,
			},
		},
	},
	placement: 'floor',
	hasCollisions: true,
});
