/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const roundRug = defineObject({
	id: 'roundRug',
	name: i18n.ts._miRoom._objects.roundRug,
	options: {
		schema: {},
		default: {},
	},
	placement: 'floor',
	hasCollisions: false,
	hasTexture: true,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
