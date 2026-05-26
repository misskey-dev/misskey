/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { miPlateDisplayed_schema } from 'misskey-world/src/room/objects/miPlateDisplayed.schema.js';

export const miPlateDisplayed = defineObject(miPlateDisplayed_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
