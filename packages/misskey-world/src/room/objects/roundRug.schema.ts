/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const roundRug_schema = defineObjectSchema({
	id: 'roundRug',
	options: {
		schema: {},
		default: {},
	},
	placement: 'floor',
	hasCollisions: false,
	hasTexture: true,
});
