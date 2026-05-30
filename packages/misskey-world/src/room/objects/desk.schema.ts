/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const desk_schema = defineFurnitureSchema({
	id: 'desk',
	options: {
		schema: {
			frameMat: {
				type: 'material',
			},
			boardMat: {
				type: 'material',
			},
			width: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			depth: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			frameMat: { color: [0.8, 0.8, 0.8], roughness: 0.3, metallic: 1 },
			boardMat: { color: [0.8, 0.4, 0.1], roughness: 0.5, metallic: 0 },
			width: 0.28,
			depth: 0.26,
		},
	},
	placement: 'floor',
	hasCollisions: true,
});
