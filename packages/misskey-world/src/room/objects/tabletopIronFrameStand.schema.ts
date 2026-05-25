/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const tabletopIronFrameStand_schema = defineObjectSchema({
	id: 'tabletopIronFrameStand',
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
			height: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			frameMat: { color: [0.8, 0.8, 0.8], roughness: 0.3, metallic: 1 },
			boardMat: { color: [0.8, 0.4, 0.1], roughness: 0.6, metallic: 0 },
			width: 0.2,
			depth: 0.1,
			height: 0.05,
		},
	},
	placement: 'top',
	hasCollisions: false,
});
