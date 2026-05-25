/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const stanchionPole_schema = defineObjectSchema({
	id: 'stanchionPole',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			ropeMat: {
				type: 'material',
			},
		},
		default: {
			bodyMat: { color: [0.8, 0.39, 0.1], roughness: 0.2, metallic: 1 },
			ropeMat: { color: [0.21, 0.0, 0.0], roughness: 0.7, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: false,
});
