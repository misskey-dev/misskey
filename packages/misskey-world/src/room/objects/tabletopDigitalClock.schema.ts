/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const tabletopDigitalClock_schema = defineObjectSchema({
	id: 'tabletopDigitalClock',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			lcdColor: {
				type: 'color',
			},
		},
		default: {
			bodyMat: { color: [0.45, 0.8, 0], roughness: 0.2, metallic: 0 },
			lcdColor: [1, 1, 1],
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: false,
});
