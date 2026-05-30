/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const wireBasket_schema = defineFurnitureSchema({
	id: 'wireBasket',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
		},
		default: {
			bodyMat: { color: [0.03, 0.03, 0.03], roughness: 0.5, metallic: 0.5 },
		},
	},
	placement: 'side',
	hasCollisions: false,
	canPreMeshesMerging: true,
	hasTexture: false,
});
