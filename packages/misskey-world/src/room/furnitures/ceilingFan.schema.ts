/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const ceilingFan_schema = defineFurnitureSchema({
	id: 'ceilingFan',
	options: {
		schema: {
			shadeMat: {
				type: 'material',
			},
			bodyMat: {
				type: 'material',
			},
		},
		default: {
			shadeMat: { color: [0.8, 0.19, 0], roughness: 0.5, metallic: 0 },
			bodyMat: { color: [0.9, 0.9, 0.9], roughness: 0, metallic: 1 },
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
});
