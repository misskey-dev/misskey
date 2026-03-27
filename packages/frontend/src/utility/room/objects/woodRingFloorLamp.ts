/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const woodRingFloorLamp = defineObject({
	id: 'woodRingFloorLamp',
	name: 'Wood Ring Floor Lamp',
	options: {
		schema: {},
		default: {},
	},
	placement: 'floor',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
