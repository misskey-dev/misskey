/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const miPlate = defineObject({
	id: 'miPlate',
	name: 'Mi Plate',
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
