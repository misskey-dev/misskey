/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const newtonsCradle_schema = defineFurnitureSchema({
	id: 'newtonsCradle',
	options: {
		schema: {
			frameMat: {
				type: 'material',
			},
		},
		default: {
			frameMat: { color: [0.15, 0.15, 0.15], roughness: 0.4, metallic: 0.8 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
});
