/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const lavaLamp_schema = defineObjectSchema({
	id: 'lavaLamp',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			glassMat: {
				type: 'material',
			},
			lightColor: {
				type: 'color',
			},
			lavaColor: {
				type: 'color',
			},
		},
		default: {
			bodyMat: { color: [0.8, 0.8, 0.8], roughness: 0.5, metallic: 0.7 },
			glassMat: { color: [0.8, 0, 0.1], roughness: 0, metallic: 0 },
			lightColor: [1, 0.175, 0.175],
			lavaColor: [1, 0.5, 0.2],
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
});
