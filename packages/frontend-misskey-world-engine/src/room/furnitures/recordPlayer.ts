/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { recordPlayer_schema } from 'misskey-world/src/room/furnitures/recordPlayer.schema.js';

export const recordPlayer = defineFurniture(recordPlayer_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
