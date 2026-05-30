/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const emptyBento_schema = defineFurnitureSchema({
	id: 'emptyBento',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
});
