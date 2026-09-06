/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const debugMetal_schema = defineFurnitureSchema({
	id: 'debugMetal',
	name: 'Debug Metal',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: false,
});
