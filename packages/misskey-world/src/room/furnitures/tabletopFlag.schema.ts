/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const tabletopFlag_schema = defineFurnitureSchema({
	id: 'tabletopFlag',
	options: {
		schema: {
			image: {
				type: 'image',
				presets: [],
			},
		},
		default: {
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
