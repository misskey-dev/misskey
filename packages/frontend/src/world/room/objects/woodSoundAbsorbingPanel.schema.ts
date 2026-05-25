/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const woodSoundAbsorbingPanel_schema = defineObjectSchema({
	id: 'woodSoundAbsorbingPanel',
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
});
