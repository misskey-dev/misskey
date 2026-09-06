/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const openedCardboardBox_schema = defineFurnitureSchema({
	id: 'openedCardboardBox',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
});
