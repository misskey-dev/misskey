/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const cuboid_schema = defineObjectSchema({
	id: 'cuboid',
	options: {
		schema: {
			x: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			y: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			z: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			mat: {
				type: 'material',
			},
		},
		default: {
			x: 0.01,
			y: 0.01,
			z: 0.01,
			mat: { color: [1, 1, 1], roughness: 0, metallic: 0 },
		},
	},
	placement: 'top',
});
