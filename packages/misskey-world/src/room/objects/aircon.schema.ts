/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const aircon_schema = defineFurnitureSchema({
	id: 'aircon',
	options: {
		schema: {},
		default: {},
	},
	placement: 'wall',
	hasCollisions: false,
	canPreMeshesMerging: true,
});
