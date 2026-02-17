/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const ductTape = defineObject({
	id: 'ductTape',
	defaultOptions: {},
	placement: 'top',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
