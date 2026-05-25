/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { glassCylinderPotPlant_schema } from './glassCylinderPotPlant.schema.js';

export const glassCylinderPotPlant = defineObject(glassCylinderPotPlant_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
