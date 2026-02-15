/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const chair = defineObject({
	id: 'chair',
	defaultOptions: {},
	placement: 'floor',
	isChair: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
