/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { miPlateDisplayed_schema } from 'misskey-world/src/room/furnitures/miPlateDisplayed.schema.js';

export const miPlateDisplayed = defineFurniture(miPlateDisplayed_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
