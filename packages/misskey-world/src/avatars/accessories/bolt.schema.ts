/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAccessorySchema } from '../accessory.js';
export const bolt_schema = defineAccessorySchema({
	id: 'bolt',
	options: {
		schema: {
			mat: {
				type: 'material',
			},
		},
		default: {
			mat: { color: [0.8, 0.8, 0.8], roughness: 0.3, metallic: 1 },
		},
	},
});
