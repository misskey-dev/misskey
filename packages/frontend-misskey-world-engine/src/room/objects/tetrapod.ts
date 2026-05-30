/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { tetrapod_schema } from 'misskey-world/src/room/objects/tetrapod.schema.js';

export const tetrapod = defineFuniture(tetrapod_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
