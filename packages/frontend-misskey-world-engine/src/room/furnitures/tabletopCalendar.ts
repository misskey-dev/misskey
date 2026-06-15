/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { tabletopCalendar_schema } from 'misskey-world/src/room/furnitures/tabletopCalendar.schema.js';

export const tabletopCalendar = defineFurniture(tabletopCalendar_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
