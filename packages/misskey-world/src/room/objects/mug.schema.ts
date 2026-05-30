/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const mug_schema = defineFurnitureSchema({
	id: 'mug',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			liquidMat: {
				type: 'material',
			},
		},
		default: {
			bodyMat: { color: [0.8, 0.8, 0.8], roughness: 0, metallic: 0 },
			liquidMat: { color: [0.033, 0.013, 0.005], roughness: 0, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
});
