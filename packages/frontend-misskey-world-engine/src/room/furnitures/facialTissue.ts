/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { facialTissue_schema } from 'misskey-world/src/room/furnitures/facialTissue.schema.js';

export const facialTissue = defineFuniture(facialTissue_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
