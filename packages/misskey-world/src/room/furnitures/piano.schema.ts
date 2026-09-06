/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const piano_schema = defineFurnitureSchema({
	id: 'piano',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
		},
		default: {
			bodyMat: { color: [0, 0, 0], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	canPreMeshesMerging: true,
});
