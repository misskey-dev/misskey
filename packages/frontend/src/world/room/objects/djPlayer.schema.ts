/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const djPlayer_schema = defineObjectSchema({
	id: 'djPlayer',
	options: {
		schema: {
			screenBrightness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				presets: [{
					value: 'waveform',
				}],
			},
		},
		default: {
			screenBrightness: 0.5,
			image: { type: 'waveform' },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
