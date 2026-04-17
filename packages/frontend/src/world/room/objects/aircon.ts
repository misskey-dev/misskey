/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const aircon = defineObject({
	id: 'aircon',
	name: 'Air Conditioner',
	options: {
		schema: {},
		default: {},
	},
	placement: 'wall',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
