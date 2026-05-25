/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const recordPlayer = defineObject({
	id: 'recordPlayer',
	name: i18n.ts._miRoom._objects.recordPlayer,
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: false,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
