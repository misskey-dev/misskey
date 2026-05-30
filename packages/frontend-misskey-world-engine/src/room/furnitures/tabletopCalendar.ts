/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { tabletopCalendar_schema } from 'misskey-world/src/room/furnitures/tabletopCalendar.schema.js';

export const tabletopCalendar = defineFuniture(tabletopCalendar_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
