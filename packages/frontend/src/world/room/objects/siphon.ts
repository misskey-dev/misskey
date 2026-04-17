/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const siphon = defineObject({
	id: 'siphon',
	name: 'Siphon',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
