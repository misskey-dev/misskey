/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { powerStrip_schema } from 'misskey-world/src/room/furnitures/powerStrip.schema.js';

export const powerStrip = defineFuniture(powerStrip_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
