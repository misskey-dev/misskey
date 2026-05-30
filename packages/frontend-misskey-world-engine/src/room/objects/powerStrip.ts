/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { powerStrip_schema } from 'misskey-world/src/room/objects/powerStrip.schema.js';

export const powerStrip = defineFuniture(powerStrip_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
