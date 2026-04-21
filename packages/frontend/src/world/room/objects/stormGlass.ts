/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';

export const stormGlass = defineObject({
	id: 'stormGlass',
	name: 'stormGlass',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: false,
	canPreMeshesMerging: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
