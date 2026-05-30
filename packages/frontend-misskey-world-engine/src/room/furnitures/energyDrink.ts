/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { energyDrink_schema } from 'misskey-world/src/room/furnitures/energyDrink.schema.js';

export const energyDrink = defineFuniture(energyDrink_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
