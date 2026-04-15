/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const tabletopCalendar = defineObject({
	id: 'tabletopCalendar',
	name: 'Tabletop Calendar',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
