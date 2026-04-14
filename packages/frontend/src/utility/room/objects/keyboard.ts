/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const keyboard = defineObject({
	id: 'keyboard',
	name: 'Keyboard',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	noCollisions: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
