/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const steelRack = defineObject({
	id: 'steelRack',
	defaultOptions: {},
	placement: 'floor',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
