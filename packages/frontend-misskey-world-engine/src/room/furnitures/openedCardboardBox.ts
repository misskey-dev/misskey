/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { openedCardboardBox_schema } from 'misskey-world/src/room/furnitures/openedCardboardBox.schema.js';

export const openedCardboardBox = defineFurniture(openedCardboardBox_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
