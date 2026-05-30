/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const debugHipoly_schema = defineFurnitureSchema({
	id: 'debugHipoly',
	name: 'Debug Hipoly',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
});
