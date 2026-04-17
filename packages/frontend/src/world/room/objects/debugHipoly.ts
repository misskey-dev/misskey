/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const debugHipoly = defineObject({
	id: 'debugHipoly',
	name: 'debugHipoly',
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
