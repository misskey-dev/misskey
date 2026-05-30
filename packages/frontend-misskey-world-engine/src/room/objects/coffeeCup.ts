/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { coffeeCup_schema } from 'misskey-world/src/room/objects/coffeeCup.schema.js';

export const coffeeCup = defineFuniture(coffeeCup_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
