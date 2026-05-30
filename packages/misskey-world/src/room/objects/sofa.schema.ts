/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const sofa_schema = defineFurnitureSchema({
	id: 'sofa',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
		},
		default: {
			bodyMat: { color: [0.4, 0.4, 0.4], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	canPreMeshesMerging: true,
	hasTexture: false,
});
