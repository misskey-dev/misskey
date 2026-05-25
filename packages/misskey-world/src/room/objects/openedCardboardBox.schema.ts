/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const openedCardboardBox_schema = defineObjectSchema({
	id: 'openedCardboardBox',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
});
