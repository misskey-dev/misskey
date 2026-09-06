/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { tableSalt_schema } from 'misskey-world/src/room/furnitures/tableSalt.schema.js';

export const tableSalt = defineFurniture(tableSalt_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
