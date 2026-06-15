/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { tetrapod_schema } from 'misskey-world/src/room/furnitures/tetrapod.schema.js';

export const tetrapod = defineFurniture(tetrapod_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
