/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const downlight_schema = defineFurnitureSchema({
	id: 'downlight',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			light: {
				type: 'light',
			},
		},
		default: {
			bodyMat: { color: [0.8, 0.8, 0.8], roughness: 0.3, metallic: 0 },
			light: {
				color: [1, 0.5, 0.2],
				brightness: 0.2,
			},
		},
	},
	placement: 'bottom',
	hasCollisions: false,
});
