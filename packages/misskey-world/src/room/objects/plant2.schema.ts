/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const plant2_schema = defineFurnitureSchema({
	id: 'plant2',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasTexture: true,
	canPreMeshesMerging: true,
});
