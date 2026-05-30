/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const roundRug_schema = defineFurnitureSchema({
	id: 'roundRug',
	options: {
		schema: {},
		default: {},
	},
	placement: 'floor',
	hasCollisions: false,
	hasTexture: true,
});
