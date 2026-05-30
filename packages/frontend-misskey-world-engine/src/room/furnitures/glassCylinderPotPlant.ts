/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { glassCylinderPotPlant_schema } from 'misskey-world/src/room/furnitures/glassCylinderPotPlant.schema.js';

export const glassCylinderPotPlant = defineFuniture(glassCylinderPotPlant_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
