/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { facialTissue_schema } from 'misskey-world/src/room/furnitures/facialTissue.schema.js';

export const facialTissue = defineFurniture(facialTissue_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
