/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const bed_schema = defineFurnitureSchema({
	id: 'bed',
	options: {
		schema: {
			frameMat: {
				type: 'material',
			},
		},
		default: {
			frameMat: { color: [0.2, 0.1, 0.02], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: true,
});
