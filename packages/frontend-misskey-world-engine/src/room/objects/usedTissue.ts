/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { usedTissue_schema } from 'misskey-world/src/room/objects/usedTissue.schema.js';

export const usedTissue = defineFuniture(usedTissue_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
