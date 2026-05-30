/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { stormGlass_schema } from 'misskey-world/src/room/objects/stormGlass.schema.js';

export const stormGlass = defineFuniture(stormGlass_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
