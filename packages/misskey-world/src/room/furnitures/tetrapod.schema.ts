/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const tetrapod_schema = defineFurnitureSchema({
	id: 'tetrapod',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
});
