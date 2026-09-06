/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const wallMirror_schema = defineFurnitureSchema({
	id: 'wallMirror',
	options: {
		schema: {
			width: {
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
			frameThickness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			frameMat: {
				type: 'material',
			},
		},
		default: {
			width: 0.2,
			height: 0.2,
			frameThickness: 0.1,
			frameMat: { color: [0.8, 0.28, 0.06], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'side',
	hasCollisions: false,
});
