/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { roundRug_schema } from 'misskey-world/src/room/furnitures/roundRug.schema.js';

export const roundRug = defineFuniture(roundRug_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
