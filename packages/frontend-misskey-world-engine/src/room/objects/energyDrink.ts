/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { energyDrink_schema } from 'misskey-world/src/room/objects/energyDrink.schema.js';

export const energyDrink = defineObject(energyDrink_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
