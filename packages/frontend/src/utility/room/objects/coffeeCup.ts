/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const coffeeCup = defineObject({
	id: 'coffeeCup',
	name: 'Coffee Cup',
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
