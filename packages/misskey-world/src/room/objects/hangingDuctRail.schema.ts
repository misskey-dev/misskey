/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const hangingDuctRail_schema = defineObjectSchema({
	id: 'hangingDuctRail',
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
			bodyMat: {
				type: 'material',
			},
		},
		default: {
			width: 0.2,
			height: 0.2,
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 1 },
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
});
