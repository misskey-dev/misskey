/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const energyDrink = defineObject({
	id: 'energyDrink',
	name: i18n.ts._miRoom._objects.energyDrink,
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
			dispose: () => {},
		};
	},
});
