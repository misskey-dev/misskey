/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { recordPlayer_schema } from 'misskey-world/src/room/objects/recordPlayer.schema.js';

export const recordPlayer = defineFuniture(recordPlayer_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
