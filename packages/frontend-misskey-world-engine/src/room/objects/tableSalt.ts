/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { tableSalt_schema } from 'misskey-world/src/room/objects/tableSalt.schema.js';

export const tableSalt = defineFuniture(tableSalt_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
