/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { hangingTShirt_schema } from 'misskey-world/src/room/objects/hangingTShirt.schema.js';

export const hangingTShirt = defineObject(hangingTShirt_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
