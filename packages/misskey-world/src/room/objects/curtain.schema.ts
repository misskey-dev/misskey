/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const curtain_schema = defineFurnitureSchema({
	id: 'curtain',
	options: {
		schema: {},
		default: {},
	},
	placement: 'wall',
	hasCollisions: false,
	hasTexture: true,
});
