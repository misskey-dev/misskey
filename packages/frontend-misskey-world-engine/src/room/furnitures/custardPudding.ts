/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { custardPudding_schema } from 'misskey-world/src/room/furnitures/custardPudding.schema.js';

export const custardPudding = defineFuniture(custardPudding_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
