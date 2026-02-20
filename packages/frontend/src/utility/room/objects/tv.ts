/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const tv = defineObject({
	id: 'tv',
	name: 'TV',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
