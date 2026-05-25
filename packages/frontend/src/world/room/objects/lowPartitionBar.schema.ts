/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const lowPartitionBar_schema = defineObjectSchema({
	id: 'lowPartitionBar',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			width: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0.8, 0.8, 0.8], roughness: 0.1, metallic: 1 },
			width: 0.5,
		},
	},
	placement: 'top',
	//hasCollisions: true,
});
