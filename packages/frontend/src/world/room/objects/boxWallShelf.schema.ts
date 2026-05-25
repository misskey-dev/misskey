/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const boxWallShelf_schema = defineObjectSchema({
	id: 'boxWallShelf',
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
			withBack: {
				type: 'boolean',
			},
		},
		default: {
			width: 0.1,
			height: 0.1,
			bodyMat: { color: [0.6, 0.35, 0.15], roughness: 0.5, metallic: 0 },
			withBack: true,
		},
	},
	placement: 'wall',
	hasCollisions: false,
	hasTexture: false,
});
