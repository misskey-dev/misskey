/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';

export const letterCase = defineObject({
	id: 'letterCase',
	name: 'Letter Case',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
