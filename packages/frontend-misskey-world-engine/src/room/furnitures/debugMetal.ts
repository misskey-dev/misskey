/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { debugMetal_schema } from 'misskey-world/src/room/furnitures/debugMetal.schema.js';

export const debugMetal = defineFuniture(debugMetal_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
