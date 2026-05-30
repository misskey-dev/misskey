/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { debugHipoly_schema } from 'misskey-world/src/room/furnitures/debugHipoly.schema.js';

export const debugHipoly = defineFuniture(debugHipoly_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
