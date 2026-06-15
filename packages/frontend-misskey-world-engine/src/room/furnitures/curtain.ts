/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { curtain_schema } from 'misskey-world/src/room/furnitures/curtain.schema.js';

export const curtain = defineFurniture(curtain_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
