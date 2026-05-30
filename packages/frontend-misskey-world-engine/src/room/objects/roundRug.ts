/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { roundRug_schema } from 'misskey-world/src/room/objects/roundRug.schema.js';

export const roundRug = defineFuniture(roundRug_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
