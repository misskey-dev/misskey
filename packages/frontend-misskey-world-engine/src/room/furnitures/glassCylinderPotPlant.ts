/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { glassCylinderPotPlant_schema } from 'misskey-world/src/room/furnitures/glassCylinderPotPlant.schema.js';

export const glassCylinderPotPlant = defineFurniture(glassCylinderPotPlant_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
