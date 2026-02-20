/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const facialTissue = defineObject({
	id: 'facialTissue',
	name: 'Facial Tissue',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: () => {
		return {
			interactions: {},
		};
	},
});
