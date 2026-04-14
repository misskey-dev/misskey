/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const sprayer = defineObject({
	id: 'sprayer',
	name: '霧吹き',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	noCollisions: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
