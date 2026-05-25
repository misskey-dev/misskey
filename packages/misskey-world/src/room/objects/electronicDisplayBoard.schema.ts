/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const electronicDisplayBoard_schema = defineObjectSchema({
	id: 'electronicDisplayBoard',
	options: {
		schema: {
			text: {
				type: 'string',
			},
			frameMat: {
				type: 'material',
			},
			ledColor: {
				type: 'color',
			},
			ledBrightness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			text: 'Hello, Misskey!',
			frameMat: { color: [0.05, 0.05, 0.05], roughness: 0.2, metallic: 0 },
			ledColor: [1, 1, 1],
			ledBrightness: 0.5,
		},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
});
