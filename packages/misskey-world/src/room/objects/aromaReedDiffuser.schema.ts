/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const aromaReedDiffuser_schema = defineObjectSchema({
	id: 'aromaReedDiffuser',
	options: {
		schema: {
			bottleMat: {
				type: 'material',
			},
			oilMat: {
				type: 'material',
			},
		},
		default: {
			bottleMat: { color: [1, 0.83, 0.48], roughness: 0, metallic: 0.7 },
			oilMat: { color: [1, 0.4, 0], roughness: 0, metallic: 1 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
});
