/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';

export const debugMetal = defineObject({
	id: 'debugMetal',
	name: 'debugMetal',
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
		};
	},
});
