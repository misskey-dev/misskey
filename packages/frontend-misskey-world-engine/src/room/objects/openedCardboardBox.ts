/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { openedCardboardBox_schema } from 'misskey-world/src/room/objects/openedCardboardBox.schema.js';

export const openedCardboardBox = defineFuniture(openedCardboardBox_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
