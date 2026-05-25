/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const emptyBento_schema = defineObjectSchema({
	id: 'emptyBento',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
});
