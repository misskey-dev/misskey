/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { hangingTShirt_schema } from 'misskey-world/src/room/furnitures/hangingTShirt.schema.js';

export const hangingTShirt = defineFuniture(hangingTShirt_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
