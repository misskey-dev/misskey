/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { miPlateDisplayed_schema } from 'misskey-world/src/room/objects/miPlateDisplayed.schema.js';

export const miPlateDisplayed = defineFuniture(miPlateDisplayed_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
