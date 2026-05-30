/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { miPlateDisplayed_schema } from 'misskey-world/src/room/furnitures/miPlateDisplayed.schema.js';

export const miPlateDisplayed = defineFuniture(miPlateDisplayed_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
