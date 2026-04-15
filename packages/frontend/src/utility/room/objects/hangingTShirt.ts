/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const hangingTShirt = defineObject({
	id: 'hangingTShirt',
	name: 'Hanging T-Shirt',
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
