/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const colorBox = defineObject({
	id: 'colorBox',
	name: 'Color Box',
	options: {
		schema: {},
		default: {},
	},
	placement: 'floor',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
