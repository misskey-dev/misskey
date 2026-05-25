/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const descriptionPlate_schema = defineObjectSchema({
	id: 'descriptionPlate',
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
});
