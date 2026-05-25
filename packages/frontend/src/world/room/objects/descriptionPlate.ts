/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const descriptionPlate = defineObject({
	id: 'descriptionPlate',
	name: i18n.ts._miRoom._objects.descriptionPlate,
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
