/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const plant2 = defineObject({
	id: 'plant2',
	name: i18n.ts._miRoom._objects.plant2,
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasTexture: true,
	canPreMeshesMerging: true,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
