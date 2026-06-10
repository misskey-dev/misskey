/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const kakejiku_schema = defineFurnitureSchema({
	id: 'kakejiku',
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
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
});
