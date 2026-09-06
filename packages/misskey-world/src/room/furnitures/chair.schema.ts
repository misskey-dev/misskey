/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const chair_schema = defineFurnitureSchema({
	id: 'chair',
	options: {
		schema: {
			primaryMat: {
				type: 'material',
			},
			secondaryMat: {
				type: 'material',
			},
			frameMat: {
				type: 'material',
			},
		},
		default: {
			primaryMat: { color: [0.44, 0.6, 0], roughness: 1, metallic: 0 },
			secondaryMat: { color: [0, 0, 0], roughness: 0.5, metallic: 0 },
			frameMat: { color: [0.8, 0.8, 0.8], roughness: 0.25, metallic: 1 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	isChair: true,
	canPreMeshesMerging: true,
});
