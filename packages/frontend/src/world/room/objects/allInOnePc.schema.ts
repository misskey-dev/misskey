/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';

export const allInOnePc_schema = defineObjectSchema({
	id: 'allInOnePc',
	placement: 'top',
	hasTexture: true,
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			bezelMat: {
				type: 'material',
			},
			screenBrightness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				presets: [{
					value: 'desktop',
				}],
			},
		},
		default: {
			bodyMat: { color: [1, 1, 1], roughness: 0.5, metallic: 1 },
			bezelMat: { color: [0, 0, 0], roughness: 0, metallic: 0 },
			screenBrightness: 0.5,
			image: {
				type: null,
			},
		},
	},
});
