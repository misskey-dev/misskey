/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';

export const ironFrameShelf_schema = defineFurnitureSchema({
	id: 'ironFrameShelf',
	options: {
		schema: {
			height: {
				type: 'enum',
				enum: [{
					value: '5',
				}, {
					value: '4',
				}, {
					value: '3',
				}],
			},
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
		},
		default: {
			height: '5',
			frameMat: { color: [0.2, 0.2, 0.2], roughness: 0.4, metallic: 1 },
			boardMat: { color: [0.8, 0.4, 0.1], roughness: 0.7, metallic: 0 },
			width: 0.2,
		},
	},
	placement: 'floor',
	hasCollisions: true,
});
