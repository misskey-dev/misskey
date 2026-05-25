/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const tetrapod_schema = defineObjectSchema({
	id: 'tetrapod',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
});
