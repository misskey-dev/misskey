/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { roundRug_schema } from 'misskey-world/src/room/furnitures/roundRug.schema.js';

export const roundRug = defineFurniture(roundRug_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
