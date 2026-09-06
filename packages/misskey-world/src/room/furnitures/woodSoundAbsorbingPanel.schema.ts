/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const woodSoundAbsorbingPanel_schema = defineFurnitureSchema({
	id: 'woodSoundAbsorbingPanel',
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
});
