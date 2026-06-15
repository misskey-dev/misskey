/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { miPlate_schema } from 'misskey-world/src/room/furnitures/miPlate.schema.js';

export const miPlate = defineFurniture(miPlate_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
