/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const desktopPc_schema = defineFurnitureSchema({
	id: 'desktopPc',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			coverMat: {
				type: 'material',
			},
			inner1Mat: {
				type: 'material',
			},
			inner2Mat: {
				type: 'material',
			},
			inner3Mat: {
				type: 'material',
			},
			ledColor: {
				type: 'color',
			},
		},
		default: {
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 0.25 },
			coverMat: { color: [0.85, 0.85, 0.85], roughness: 0.2, metallic: 0 },
			inner1Mat: { color: [1, 1, 1], roughness: 0.2, metallic: 0 },
			inner2Mat: { color: [1, 1, 1], roughness: 0.2, metallic: 0 },
			inner3Mat: { color: [0.1, 0.1, 0.1], roughness: 0.4, metallic: 0.7 },
			ledColor: [0.5, 0.9, 0],
		},
	},
	placement: 'top',
	hasCollisions: true,
	canPreMeshesMerging: true,
});
