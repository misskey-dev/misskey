/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';

export const mixer = defineObject({
	id: 'mixer',
	name: 'Mixer',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
