/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const roundRug = defineObject({
	id: 'roundRug',
	defaultOptions: {},
	placement: 'floor',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
