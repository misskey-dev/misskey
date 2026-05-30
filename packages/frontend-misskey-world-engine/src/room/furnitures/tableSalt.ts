/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { tableSalt_schema } from 'misskey-world/src/room/furnitures/tableSalt.schema.js';

export const tableSalt = defineFuniture(tableSalt_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
