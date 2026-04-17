/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';

export const pachira = defineObject({
	id: 'pachira',
	name: 'Pachira',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: true,
	hasTexture: true,
	canPreMeshesMerging: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
