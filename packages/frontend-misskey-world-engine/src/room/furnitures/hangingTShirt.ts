/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { hangingTShirt_schema } from 'misskey-world/src/room/furnitures/hangingTShirt.schema.js';

export const hangingTShirt = defineFurniture(hangingTShirt_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
