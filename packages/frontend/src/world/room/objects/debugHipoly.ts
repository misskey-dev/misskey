/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const debugHipoly = defineObject({
	id: 'debugHipoly',
	name: i18n.ts._miRoom._objects.debugHipoly,
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
