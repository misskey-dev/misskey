/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const pachira_schema = defineObjectSchema({
	id: 'pachira',
	options: {
		schema: {
			potMat: {
				type: 'material',
			},
		},
		default: {
			potMat: { color: [0.8, 0.8, 0.8], roughness: 0.2, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
});
