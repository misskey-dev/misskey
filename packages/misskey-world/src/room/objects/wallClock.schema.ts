/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const wallClock_schema = defineObjectSchema({
	id: 'wallClock',
	options: {
		schema: {
			frameMat: {
				type: 'material',
			},
		},
		default: {
			frameMat: { color: [0.71, 0.58, 0.39], roughness: 0.75, metallic: 0 },
		},
	},
	placement: 'side',
	hasCollisions: false,
});
