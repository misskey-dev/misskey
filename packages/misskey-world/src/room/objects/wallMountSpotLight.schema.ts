/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const wallMountSpotLight_schema = defineObjectSchema({
	id: 'wallMountSpotLight',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			light: {
				type: 'light',
			},
			angleV: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			angleH: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 1 },
			light: {
				color: [1, 0.5, 0.2],
				brightness: 0.5,
			},
			angleV: 0.1,
			angleH: 0.5,
		},
	},
	placement: 'side',
	hasCollisions: false,
	canPreMeshesMerging: false,
	hasTexture: false,
});
