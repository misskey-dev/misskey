/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const wallClock_schema = defineFurnitureSchema({
	id: 'wallClock',
	options: {
		schema: {
			frameMat: {
				type: 'material',
			},
			faceMat: {
				type: 'material',
			},
			handsMat: {
				type: 'material',
			},
		},
		default: {
			frameMat: { color: [0.71, 0.58, 0.39], roughness: 0.75, metallic: 0 },
			faceMat: { color: [0.8, 0.8, 0.8], roughness: 0.5, metallic: 0 },
			handsMat: { color: [0.033, 0.033, 0.033], roughness: 0.75, metallic: 0 },
		},
	},
	placement: 'side',
	hasCollisions: false,
});
