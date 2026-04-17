/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const monitor = defineObject({
	id: 'monitor',
	name: 'Monitor',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasTexture: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
