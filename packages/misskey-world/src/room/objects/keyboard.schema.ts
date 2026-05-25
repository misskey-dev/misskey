/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const keyboard_schema = defineObjectSchema({
	id: 'keyboard',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			keyMat: {
				type: 'material',
			},
		},
		default: {
			bodyMat: { color: [0.3, 0.3, 0.3], roughness: 0.6, metallic: 0 },
			keyMat: { color: [0.2, 0.2, 0.2], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
});
