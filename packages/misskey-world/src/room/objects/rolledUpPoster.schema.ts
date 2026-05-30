/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const rolledUpPoster_schema = defineFurnitureSchema({
	id: 'rolledUpPoster',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
});
