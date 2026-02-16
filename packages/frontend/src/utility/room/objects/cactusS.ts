/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const cactusS = defineObject({
	id: 'cactusS',
	defaultOptions: {},
	placement: 'top',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
