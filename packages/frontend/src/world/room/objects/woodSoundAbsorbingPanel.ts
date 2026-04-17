/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const woodSoundAbsorbingPanel = defineObject({
	id: 'woodSoundAbsorbingPanel',
	name: 'Wood Sound Absorbing Panel',
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
