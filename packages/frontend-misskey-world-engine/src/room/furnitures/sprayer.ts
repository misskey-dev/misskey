/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { sprayer_schema } from 'misskey-world/src/room/furnitures/sprayer.schema.js';

export const sprayer = defineFurniture(sprayer_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
