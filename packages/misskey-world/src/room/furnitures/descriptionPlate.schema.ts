/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const descriptionPlate_schema = defineFurnitureSchema({
	id: 'descriptionPlate',
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
});
