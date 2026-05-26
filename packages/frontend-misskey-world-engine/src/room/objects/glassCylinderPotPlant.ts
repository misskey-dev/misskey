/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { glassCylinderPotPlant_schema } from 'misskey-world/src/room/objects/glassCylinderPotPlant.schema.js';

export const glassCylinderPotPlant = defineObject(glassCylinderPotPlant_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
