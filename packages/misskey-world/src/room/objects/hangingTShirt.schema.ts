/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const hangingTShirt_schema = defineFurnitureSchema({
	id: 'hangingTShirt',
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
});
