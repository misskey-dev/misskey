/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const hangingTShirt = defineObject({
	id: 'hangingTShirt',
	name: i18n.ts._miRoom._objects.hangingTShirt,
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
