/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const blind_schema = defineObjectSchema({
	id: 'blind',
	options: {
		schema: {
			blades: {
				type: 'range',
				min: 1,
				max: 100,
			},
			angle: {
				type: 'range',
				min: -Math.PI / 2,
				max: Math.PI / 2,
				step: 0.01,
			},
			open: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			blades: 24,
			angle: 0,
			open: 1,
		},
	},
	placement: 'bottom',
	hasCollisions: false,
	hasTexture: false,
});
