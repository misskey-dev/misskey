/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { pizza_schema } from 'misskey-world/src/room/furnitures/pizza.schema.js';

export const pizza = defineFuniture(pizza_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
