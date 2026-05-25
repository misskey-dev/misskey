/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';

export const curtain = defineObject({
	id: 'curtain',
	options: {
		schema: {},
		default: {},
	},
	placement: 'wall',
	hasCollisions: false,
	hasTexture: true,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
