/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';

export const plant2 = defineObject({
	id: 'plant2',
	name: 'Plant 2',
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
		};
	},
});
