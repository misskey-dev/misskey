/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const monstera_schema = defineObjectSchema({
	id: 'monstera',
	options: {
		schema: {
			potMat: {
				type: 'material',
			},
		},
		default: {
			potMat: { color: [0.5, 0.5, 0.5], roughness: 0.7, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
});
