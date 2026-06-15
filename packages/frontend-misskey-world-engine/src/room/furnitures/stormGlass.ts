/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { stormGlass_schema } from 'misskey-world/src/room/furnitures/stormGlass.schema.js';

export const stormGlass = defineFurniture(stormGlass_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
