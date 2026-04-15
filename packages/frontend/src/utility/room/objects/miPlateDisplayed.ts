/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const miPlateDisplayed = defineObject({
	id: 'miPlateDisplayed',
	name: 'Mi Plate (Displayed)',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
