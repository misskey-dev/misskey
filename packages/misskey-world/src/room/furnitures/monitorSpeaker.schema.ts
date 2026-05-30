/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const monitorSpeaker_schema = defineFurnitureSchema({
	id: 'monitorSpeaker',
	options: {
		schema: {
			mat: {
				type: 'material',
			},
		},
		default: {
			mat: { color: [0, 0, 0], roughness: 0.5, metallic: 0.5 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
});
