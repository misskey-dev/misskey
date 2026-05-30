/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const largeMousepad_schema = defineFurnitureSchema({
	id: 'largeMousepad',
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
