/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const energyDrink_schema = defineFurnitureSchema({
	id: 'energyDrink',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
