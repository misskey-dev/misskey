/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const twistedCubeObjet = defineObject({
	id: 'twistedCubeObjet',
	name: i18n.ts._miRoom._objects.twistedCubeObjet,
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
