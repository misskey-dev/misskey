/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { tetrapod_schema } from 'misskey-world/src/room/objects/tetrapod.schema.js';

export const tetrapod = defineObject(tetrapod_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
