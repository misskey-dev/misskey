/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const debugHipoly_schema = defineObjectSchema({
	id: 'debugHipoly',
	name: 'Debug Hipoly',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
});
