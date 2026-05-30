/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const tabletopGlassPictureFrame_schema = defineFurnitureSchema({
	id: 'tabletopGlassPictureFrame',
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
			image: {
				type: 'image',
				presets: [],
			},
		},
		default: {
			width: 0.1,
			height: 0.1,
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
