/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const curtain = defineObject({
	id: 'curtain',
	name: i18n.ts._miRoom._objects.curtain,
	options: {
		schema: {},
		default: {},
	},
	placement: 'wall',
	hasCollisions: false,
	hasTexture: true,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
