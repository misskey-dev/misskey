/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { usedTissue_schema } from 'misskey-world/src/room/furnitures/usedTissue.schema.js';

export const usedTissue = defineFuniture(usedTissue_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
