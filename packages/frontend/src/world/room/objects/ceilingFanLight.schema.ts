/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const ceilingFanLight_schema = defineObjectSchema({
	id: 'ceilingFanLight',
	options: {
		schema: {
			shadeMat: {
				type: 'material',
			},
		},
		default: {
			shadeMat: { color: [0.8, 0.19, 0], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
	receiveShadows: false,
	castShadows: false,
});
